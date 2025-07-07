"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import firebaseService from "../../lib/firebaseService";
import moduleService from "../../lib/moduleService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import presenceService from "../../lib/presenceService";
import globalCache from "./globalCache";

const AuthContext = createContext();

// ✅ CACHE PARA RESULTADOS DE VERIFICAÇÃO - MELHORADO
const verificationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // Reduzido para 2 minutos para dados mais frescos

// ✅ FUNÇÃO AUXILIAR PARA CACHE COM TTL - MELHORADA
const getCachedResult = (key, computeFn, duration = CACHE_DURATION) => {
    const cached = verificationCache.get(key);

    // ✅ Verificar se cache expirou ou se foi invalidado
    if (cached && Date.now() - cached.timestamp < duration && !cached.invalidated) {
        return cached.value;
    }

    const result = computeFn();
    verificationCache.set(key, {
        value: result,
        timestamp: Date.now(),
        invalidated: false
    });

    return result;
};

// ✅ FUNÇÃO PARA INVALIDAR CACHE ESPECÍFICO
const invalidateVerificationCache = (pattern = null) => {
    if (pattern) {
        // Invalidar chaves que contenham o padrão
        for (const [key, value] of verificationCache.entries()) {
            if (key.includes(pattern)) {
                value.invalidated = true;
            }
        }
    } else {
        // Invalidar todo o cache
        verificationCache.clear();
    }
};

export const AuthProvider = ({ children }) => {
    // ✅ ESTADOS PRINCIPAIS
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasFreeTrialOffer, setHasFreeTrialOffer] = useState(false);
    const [referralSource, setReferralSource] = useState(null);

    // ✅ ESTADOS PARA SISTEMA DE SECRETÁRIAS
    const [userContext, setUserContext] = useState(null);
    const [isSecretary, setIsSecretary] = useState(false);
    const [workingDoctorId, setWorkingDoctorId] = useState(null);
    const [permissions, setPermissions] = useState('full');

    // ✅ ESTADOS PARA PERFORMANCE E PRESENÇA
    const [presenceInitialized, setPresenceInitialized] = useState(false);

    // ✅ HOOKS DO NEXT.JS
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ✅ REFS PARA OTIMIZAÇÃO
    const mountedRef = useRef(true);
    const processingRef = useRef(false);

    const isFreeUser = Boolean(user?.gratuito);

    // ✅ FUNÇÃO AUXILIAR PARA EXTRAIR REFERÊNCIA - MEMOIZADA
    const extractReferralSource = useCallback((path) => {
        if (path.startsWith('/checkout/') || path.startsWith('/free/')) {
            const parts = path.split('/').filter(Boolean);
            if (parts.length === 3 && parts[1] === 'pv1') {
                return parts[2];
            }
            if (parts.length === 2 && parts[1] !== 'pv1') {
                return parts[1];
            }
        }
        return null;
    }, []);

    // ✅ DETECTAR SE É USUÁRIO LEGACY - OTIMIZADO
    const checkIfLegacyUser = useCallback((userData) => {
        if (!userData) return false;

        const cacheKey = `legacy_${userData.uid || 'unknown'}`;

        return getCachedResult(cacheKey, () => {
            if (userData.administrador === true) return false;

            const hasOldFields = userData.hasOwnProperty('assinouPlano') || userData.hasOwnProperty('gratuito');
            const hasNewFields = userData.hasOwnProperty('modules') || userData.hasOwnProperty('customModules') || userData.hasOwnProperty('planType');

            return hasOldFields && !hasNewFields;
        });
    }, []);

    // ✅ CRIAR DADOS BÁSICOS PARA USUÁRIOS ÓRFÃOS - MEMOIZADA
    const createOrphanUserData = useCallback(async (authUser) => {
        try {
            console.log('🔧 Criando dados básicos para usuário órfão:', authUser.uid);

            const [firstName, ...lastNameArray] = (authUser.displayName || '').split(' ');
            const lastName = lastNameArray.join(' ');

            const userData = {
                fullName: authUser.displayName || '',
                firstName: firstName || '',
                lastName: lastName || '',
                email: authUser.email,
                photoURL: authUser.photoURL || '',
                emailVerified: authUser.emailVerified,
                gratuito: true,
                assinouPlano: false,
                planType: 'free',
                authProvider: authUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
                createdAt: new Date(),
                checkoutCompleted: true,
                needsProfileCompletion: true
            };

            if (authUser.providerData?.[0]?.providerId === 'google.com') {
                userData.googleProfile = {
                    uid: authUser.uid,
                    displayName: authUser.displayName,
                    email: authUser.email,
                    photoURL: authUser.photoURL,
                    emailVerified: authUser.emailVerified
                };
            }

            const currentReferralSource = referralSource || localStorage.getItem('referralSource');
            if (currentReferralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Usuário órfão marcado como vindo através do Enrico');
            } else if (currentReferralSource) {
                userData.referralSource = currentReferralSource;
            }

            await firebaseService.editUserData(authUser.uid, userData);
            console.log('✅ Dados básicos criados para usuário órfão');

            return userData;
        } catch (error) {
            console.error('❌ Erro ao criar dados para usuário órfão:', error);
            throw error;
        }
    }, [referralSource]);

    // ✅ MIGRAÇÃO OPCIONAL - MEMOIZADA
    const migrateUserModulesIfNeeded = useCallback(async (userData, uid) => {
        try {
            const hasOldFields = userData.hasOwnProperty('assinouPlano') || userData.hasOwnProperty('gratuito');
            const hasNewFields = userData.hasOwnProperty('modules') || userData.hasOwnProperty('customModules') || userData.hasOwnProperty('planType');

            if (hasOldFields && !hasNewFields) {
                console.log('👴 Usuário LEGACY detectado - MANTENDO acesso total sem migração');
                return userData;
            }

            if (hasNewFields) {
                console.log('✅ Usuário já tem módulos configurados');
                return userData;
            }

            if (!hasOldFields && !hasNewFields) {
                console.log('🔧 Usuário novo detectado - Aplicando sistema de módulos...');

                let planType = 'free';
                if (userData.assinouPlano === true) {
                    planType = userData.planType || 'monthly';
                }

                const migrationResult = await moduleService.updateUserModulesFromPlan(uid, planType);

                if (migrationResult.success) {
                    console.log(`✅ Usuário novo migrado para plano: ${planType}`);
                    const updatedUserData = await firebaseService.getUserData(uid);
                    return updatedUserData;
                }
            }

            return userData;
        } catch (error) {
            console.error('❌ Erro na migração (não crítico):', error);
            return userData;
        }
    }, []);

    // ✅ VERIFICAR SE USUÁRIO TEM ACESSO - OTIMIZADO
    const userHasAccess = useCallback((userData) => {
        if (!userData) return false;

        const cacheKey = `access_${userData.uid || 'unknown'}_${userData.administrador}_${userData.assinouPlano}_${userData.gratuito}`;

        return getCachedResult(cacheKey, () => {
            if (userData.administrador === true) return true;
            if (checkIfLegacyUser(userData)) return true;
            return userData.assinouPlano === true || userData.gratuito === true;
        });
    }, [checkIfLegacyUser]);

    // ✅ VERIFICAR SE USUÁRIO TEM DADOS VÁLIDOS - OTIMIZADO
    const userHasValidData = useCallback((userData) => {
        if (!userData) return false;

        const cacheKey = `valid_${userData.uid || 'unknown'}_${userData.email}`;

        return getCachedResult(cacheKey, () => {
            return userData.email && (
                userData.hasOwnProperty('assinouPlano') ||
                userData.hasOwnProperty('gratuito') ||
                userData.hasOwnProperty('planType')
            );
        });
    }, []);

    const getUserUnifiedContextCached = useCallback(async (userId, forceRefresh = false) => {
        const cacheKey = `userContext_${userId}`;

        if (forceRefresh) {
            console.log('🔄 Forçando atualização do contexto para:', userId);
            globalCache.invalidate('userContext', userId);
        }

        return await globalCache.getOrSet('userContext', userId, async () => {
            console.log('🔍 Buscando novo contexto para:', userId);

            try {
                // ✅ VERIFICAR SE É SECRETÁRIA PRIMEIRO (MAIS PROVÁVEL EM PRODUÇÃO)
                const secretaryRef = doc(firestore, "secretaries", userId);
                const secretarySnap = await getDoc(secretaryRef);

                if (secretarySnap.exists()) {
                    const secretaryData = secretarySnap.data();

                    if (!secretaryData.active) {
                        throw new Error("Conta de secretária desativada");
                    }

                    // Buscar dados do médico responsável
                    const doctorData = await firebaseService.getUserData(secretaryData.doctorId);
                    if (!doctorData) {
                        throw new Error("Médico responsável não encontrado");
                    }

                    // ✅ ATUALIZAR ÚLTIMO LOGIN DA SECRETÁRIA (NÃO BLOQUEANTE)
                    updateDoc(secretaryRef, {
                        lastLogin: new Date(),
                        loginCount: (secretaryData.loginCount || 0) + 1
                    }).catch(error => {
                        console.warn('⚠️ Erro ao atualizar último login da secretária:', error);
                    });

                    const context = {
                        userType: 'secretary',
                        workingDoctorId: secretaryData.doctorId,
                        userData: doctorData,
                        secretaryData: secretaryData,
                        permissions: secretaryData.permissions || {},
                        isSecretary: true,
                        secretaryId: userId
                    };

                    console.log(`👩‍💼 Contexto de secretária obtido: ${secretaryData.name} -> ${doctorData.fullName}`);
                    return context;
                }

                // ✅ SE NÃO É SECRETÁRIA, VERIFICAR SE É MÉDICO
                console.log('🔍 Não é secretária, verificando se é médico...');
                const doctorData = await firebaseService.getUserData(userId);

                const context = {
                    userType: 'doctor',
                    workingDoctorId: userId,
                    userData: doctorData,
                    permissions: 'full',
                    isSecretary: false
                };

                console.log(`👨‍⚕️ Contexto de médico obtido: ${doctorData.fullName}`);
                return context;

            } catch (error) {
                console.error("❌ Erro ao obter contexto unificado:", error);
                throw new Error("Usuário não autorizado - não é médico nem secretária válida");
            }
        }, forceRefresh ? 1000 : 5 * 60 * 1000);
    }, []);

    // ✅ VERIFICAR SE DEVE REDIRECIONAR PARA APP - OTIMIZADO
    const shouldRedirectToApp = useCallback((userData, currentPath) => {
        if (!userData) return false;

        const cacheKey = `redirect_app_${userData.uid || 'unknown'}_${currentPath}`;

        return getCachedResult(cacheKey, () => {
            if (!userHasValidData(userData) || !userHasAccess(userData)) {
                return false;
            }

            const publicRoutes = ['/', '/login', '/checkout', '/free'];
            const isInPublicRoute = publicRoutes.includes(currentPath) ||
                currentPath.startsWith('/checkout/') ||
                currentPath.startsWith('/free/');

            // Verificar parâmetro especial
            if (isInPublicRoute && searchParams.get('dct') === '1') {
                return false;
            }

            return isInPublicRoute;
        }, 30000); // Cache por 30 segundos para rotas
    }, [userHasValidData, userHasAccess, searchParams]);

    // ✅ VERIFICAR SE DEVE REDIRECIONAR PARA LOGIN/CHECKOUT - OTIMIZADO
    const shouldRedirectToAuth = useCallback((userData, currentPath) => {
        const protectedRoutes = ['/app', '/mobile'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

        if (!isProtectedRoute) return false;

        if (!userData) {
            return { redirect: '/', reason: 'no_user' };
        }

        const cacheKey = `redirect_auth_${userData.uid || 'unknown'}_${currentPath}`;

        return getCachedResult(cacheKey, () => {
            if (!userHasValidData(userData)) {
                return { redirect: '/free', reason: 'invalid_data' };
            }

            if (!userHasAccess(userData)) {
                return { redirect: '/checkout', reason: 'no_access' };
            }

            return false;
        }, 30000); // Cache por 30 segundos
    }, [userHasValidData, userHasAccess]);

    // ✅ FUNÇÃO PARA VERIFICAR PERMISSÃO DE MÓDULO - OTIMIZADA
    const hasModulePermission = useCallback((module, action = 'read') => {
        // Se é médico, sempre tem acesso total
        if (!isSecretary) return true;

        // Se é secretária, verificar permissões específicas
        if (permissions === 'full') return true;

        const modulePermissions = permissions[module];
        return modulePermissions ? modulePermissions[action] === true : false;
    }, [isSecretary, permissions]);

    // ✅ FUNÇÃO PARA VERIFICAR SE PODE ACESSAR DETALHES SENSÍVEIS
    const canViewSensitiveData = useCallback((dataType) => {
        if (!isSecretary) return true;

        const sensitiveModules = ['patients', 'anamnesis', 'medical_records'];

        for (const module of sensitiveModules) {
            if (dataType.includes(module)) {
                return permissions[module]?.viewDetails === true;
            }
        }

        return true;
    }, [isSecretary, permissions]);

    const createSecretaryAccount = useCallback(async (secretaryData) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem criar contas de secretária");
        }

        try {
            console.log('🔄 Iniciando criação de secretária via AuthProvider...');

            const result = await firebaseService.createSecretaryAccount(
                workingDoctorId || user.uid,
                secretaryData
            );

            if (result.success) {
                console.log('✅ Secretária criada com sucesso!');

                // ✅ INVALIDAR TODOS OS CACHES RELACIONADOS
                const doctorId = workingDoctorId || user.uid;
                globalCache.invalidate('userContext', doctorId);
                globalCache.invalidate('secretaryInfo', doctorId);
                globalCache.invalidate('profileData', doctorId);
                invalidateVerificationCache(doctorId);

                // ✅ NÃO PRECISA MAIS DE RE-LOGIN, RECARREGAR CONTEXTO IMEDIATAMENTE
                setTimeout(async () => {
                    try {
                        console.log('🔄 Recarregando contexto após criação de secretária...');
                        await reloadUserContext(true);
                    } catch (error) {
                        console.warn('⚠️ Erro ao recarregar contexto após criação:', error);
                    }
                }, 2000); // Dar tempo para propagação dos dados
            }

            return result;
        } catch (error) {
            console.error("❌ Erro ao criar conta de secretária:", error);
            throw error;
        }
    }, [user, isSecretary, workingDoctorId]);

// ✅ AUTHENTICATION STATE CHECK MELHORADO
    useEffect(() => {
        let isMounted = true;
        let unsubscribe = null;

        console.log('🔐 Auth state check initialized for path:', pathname);

        const handleAuthenticatedUser = async (authUser) => {
            if (!isMounted || processingRef.current) return;

            try {
                processingRef.current = true;
                console.log('👤 Processing authenticated user:', authUser.uid);

                // ✅ AGUARDAR UM POUCO PARA DADOS RECÉM-CRIADOS
                const isNewlyCreated = localStorage.getItem('newlyCreatedSecretary');
                const forceRefresh = !!isNewlyCreated;

                if (isNewlyCreated) {
                    console.log('🔄 Usuário recém-criado detectado, aguardando propagação...');
                    localStorage.removeItem('newlyCreatedSecretary');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                // ✅ OBTER CONTEXTO COM RETRY PARA SECRETÁRIAS RECÉM-CRIADAS
                let context;
                let retries = 0;
                const maxRetries = 3;

                while (retries < maxRetries) {
                    try {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Context timeout')), 10000)
                        );

                        const contextPromise = getUserUnifiedContextCached(authUser.uid, forceRefresh || retries > 0);
                        context = await Promise.race([contextPromise, timeoutPromise]);
                        break; // Sucesso, sair do loop

                    } catch (error) {
                        retries++;
                        console.warn(`⚠️ Tentativa ${retries}/${maxRetries} falhou:`, error.message);

                        if (retries < maxRetries) {
                            console.log(`🔄 Aguardando ${retries * 1000}ms antes da próxima tentativa...`);
                            await new Promise(resolve => setTimeout(resolve, retries * 1000));
                        } else {
                            throw error;
                        }
                    }
                }

                if (!isMounted) return;

                console.log('🎯 Contexto unificado obtido:', context.userType);

                // ✅ ATUALIZAR ESTADOS
                setUserContext(context);
                setIsSecretary(context.isSecretary);
                setWorkingDoctorId(context.workingDoctorId);
                setPermissions(context.permissions);

                // ✅ PREPARAR DADOS DO USUÁRIO
                const displayUserData = {
                    uid: authUser.uid,
                    ...context.userData,
                    isSecretary: context.isSecretary,
                    workingDoctorId: context.workingDoctorId,
                    permissions: context.permissions
                };

                if (context.isSecretary) {
                    displayUserData.secretaryData = context.secretaryData;
                    displayUserData.secretaryName = context.secretaryData.name;
                    displayUserData.secretaryEmail = context.secretaryData.email;
                    console.log(`👩‍💼 Secretária logada: ${context.secretaryData.name} -> Médico: ${context.userData.fullName}`);
                }

                setUser(displayUserData);

                // ✅ REGISTRAR LOGIN (NÃO BLOQUEANTE)
                firebaseService.registerDetailedLogin(
                    authUser.uid,
                    authUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'
                ).catch((loginError) => {
                    console.warn('⚠️ Erro ao registrar login detalhado (não crítico):', loginError);
                });

                // ✅ REDIRECIONAMENTO
                setTimeout(() => {
                    if (!isMounted) return;

                    const userData = context.userData;

                    if (shouldRedirectToApp(userData, pathname)) {
                        console.log('✅ Redirecting authenticated user to /app');
                        router.push('/app');
                    } else {
                        const authRedirect = shouldRedirectToAuth(userData, pathname);
                        if (authRedirect) {
                            console.log(`❌ Redirecting user to ${authRedirect.redirect} (reason: ${authRedirect.reason})`);
                            router.push(authRedirect.redirect);
                        }
                    }
                }, context.isSecretary ? 500 : 200);

            } catch (error) {
                console.error("❌ Auth processing error:", error);

                if (isMounted) {
                    // Reset em caso de erro
                    setUser(null);
                    setUserContext(null);
                    setIsSecretary(false);
                    setWorkingDoctorId(null);
                    setPermissions('full');

                    // Se erro de autorização, redirecionar
                    if (error.message.includes('não autorizado') || error.message.includes('unauthorized')) {
                        router.push('/');
                    }
                }
            } finally {
                processingRef.current = false;
            }
        };

        const handleUnauthenticatedUser = async () => {
            if (!isMounted) return;

            console.log('🚫 Processing unauthenticated user');

            if (presenceInitialized) {
                try {
                    await presenceService.stopPresence();
                    setPresenceInitialized(false);
                } catch (error) {
                    console.warn('⚠️ Erro ao parar presença:', error);
                }
            }

            // Reset completo
            setUser(null);
            setUserContext(null);
            setIsSecretary(false);
            setWorkingDoctorId(null);
            setPermissions('full');
            globalCache.invalidate('userContext');
            globalCache.invalidate('secretaryInfo');
            globalCache.invalidate('profileData');
            verificationCache.clear();

            const authRedirect = shouldRedirectToAuth(null, pathname);
            if (authRedirect) {
                console.log(`🚫 Unauthenticated user trying to access protected route, redirecting to ${authRedirect.redirect}`);
                router.push(authRedirect.redirect);
            }
        };

        // ✅ CONFIGURAR LISTENER
        try {
            unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
                if (!isMounted) return;

                try {
                    if (authUser) {
                        await handleAuthenticatedUser(authUser);
                    } else {
                        await handleUnauthenticatedUser();
                    }
                } catch (error) {
                    console.error("❌ Auth listener error:", error);
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            });
        } catch (error) {
            console.error("❌ Auth listener setup error:", error);
            if (isMounted) {
                setLoading(false);
            }
        }

        return () => {
            isMounted = false;
            processingRef.current = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [pathname]);

    const markAsNewlyCreated = useCallback(() => {
        localStorage.setItem('newlyCreatedSecretary', 'true');
    }, []);

    // ✅ FUNÇÃO PARA ATUALIZAR PERMISSÕES - MELHORADA
    const updateSecretaryPermissions = useCallback(async (secretaryId, newPermissions) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem atualizar permissões");
        }

        try {
            const result = await firebaseService.updateSecretaryPermissions(
                workingDoctorId || user.uid,
                secretaryId,
                newPermissions
            );

            // ✅ INVALIDAR CACHE DO CONTEXTO APÓS ATUALIZAÇÃO
            const doctorId = workingDoctorId || user.uid;
            globalCache.invalidate('userContext', doctorId);
            globalCache.invalidate('secretaryInfo', doctorId);
            invalidateVerificationCache(doctorId);

            return result;
        } catch (error) {
            console.error("❌ Erro ao atualizar permissões:", error);
            throw error;
        }
    }, [user, isSecretary, workingDoctorId]);

    // ✅ FUNÇÃO PARA DESATIVAR SECRETÁRIA - MELHORADA
    const deactivateSecretary = useCallback(async (secretaryId) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem desativar secretárias");
        }

        try {
            const result = await firebaseService.deactivateSecretaryAccount(
                workingDoctorId || user.uid,
                secretaryId
            );

            // ✅ INVALIDAR CACHES E RECARREGAR DADOS
            const doctorId = workingDoctorId || user.uid;
            globalCache.invalidate('userContext', doctorId);
            globalCache.invalidate('secretaryInfo', doctorId);
            globalCache.invalidate('profileData', doctorId);
            invalidateVerificationCache(doctorId);

            // Atualizar dados do usuário
            const updatedUserData = await firebaseService.getUserData(doctorId);
            setUser(prev => ({ ...prev, ...updatedUserData }));

            return result;
        } catch (error) {
            console.error("❌ Erro ao desativar secretária:", error);
            throw error;
        }
    }, [user, isSecretary, workingDoctorId]);

    // ✅ FUNÇÃO PARA OBTER ID EFETIVO PARA OPERAÇÕES
    const getEffectiveUserId = useCallback(() => {
        return workingDoctorId || user?.uid;
    }, [workingDoctorId, user?.uid]);

    // ✅ FUNÇÃO PARA OBTER DADOS PARA EXIBIÇÃO
    const getDisplayUserData = useCallback(() => {
        if (isSecretary) {
            return {
                ...user,
                displayName: `${user.secretaryName} (Secretária de Dr. ${user.fullName})`,
                role: 'Secretária',
                doctorName: user.fullName,
                name: user.fullName,
                secretaryName: user.secretaryName,
                secretaryEmail: user.secretaryEmail
            };
        }

        return {
            ...user,
            displayName: `Dr. ${user.fullName}`,
            role: user.administrador ? 'Administrador' : 'Médico',
            name: user.fullName
        };
    }, [isSecretary, user]);

    // ✅ FUNÇÃO DE LOGOUT MELHORADA
    const logout = useCallback(async () => {
        try {
            console.log('🚪 Iniciando logout...');

            // Parar sistema de presença antes do logout
            if (presenceInitialized) {
                await presenceService.stopPresence();
                setPresenceInitialized(false);
            }

            await signOut(firebaseService.auth);

            // Limpar todos os estados
            setUserContext(null);
            setIsSecretary(false);
            setWorkingDoctorId(null);
            setPermissions('full');

            // ✅ LIMPAR TODOS OS CACHES
            globalCache.invalidate('userContext');
            globalCache.invalidate('secretaryInfo');
            globalCache.invalidate('profileData');
            verificationCache.clear();

            console.log('✅ Logout realizado com sucesso');
            router.push('/');
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
        }
    }, [presenceInitialized, router]);

    // ✅ FUNÇÃO MELHORADA PARA RECARREGAR CONTEXTO DO USUÁRIO
    const reloadUserContext = useCallback(async (forceRefresh = false) => {
        if (!user?.uid) return;

        try {
            console.log('🔄 Recarregando contexto do usuário...', { forceRefresh });

            // ✅ INVALIDAR CACHES RELACIONADOS
            if (forceRefresh) {
                globalCache.invalidate('userContext', user.uid);
                globalCache.invalidate('secretaryInfo', user.uid);
                globalCache.invalidate('profileData', user.uid);
                invalidateVerificationCache(user.uid);
            }

            // ✅ AGUARDAR UM POUCO SE FOR REFRESH FORÇADO
            if (forceRefresh) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const context = await getUserUnifiedContextCached(user.uid, forceRefresh);

            setUserContext(context);
            setIsSecretary(context.isSecretary);
            setWorkingDoctorId(context.workingDoctorId);
            setPermissions(context.permissions);

            console.log('✅ Contexto do usuário recarregado', {
                userType: context.userType,
                isSecretary: context.isSecretary
            });

            return context;
        } catch (error) {
            console.error('❌ Erro ao recarregar contexto:', error);
            throw error;
        }
    }, [user?.uid, getUserUnifiedContextCached]);

    // ✅ DETECÇÃO DE ROTAS ESPECIAIS E REDIRECIONAMENTOS
    useEffect(() => {
        console.log('🔍 Processing route:', pathname);
        let shouldSetFreeTrial = false;
        let referrer = null;
        let shouldRedirect = false;
        let redirectTarget = null;

        if (pathname === '/pv1') {
            console.log('✅ PV1 route detected, setting free trial offer and redirecting');
            shouldSetFreeTrial = true;
            shouldRedirect = true;
            redirectTarget = '/checkout';
        }
        else if (pathname.startsWith('/checkout/')) {
            if (pathname !== '/checkout') {
                shouldRedirect = true;
                redirectTarget = '/checkout';

                if (pathname === '/checkout/pv1' || pathname.startsWith('/checkout/pv1/')) {
                    console.log('✅ PV1 trial path detected, offering free trial');
                    shouldSetFreeTrial = true;
                } else {
                    console.log('🔗 Non-trial checkout path detected');
                }

                referrer = extractReferralSource(pathname);
                if (referrer) {
                    console.log(`🎯 Referral source detected: ${referrer}`);
                }
            }
        }
        else if (pathname.startsWith('/free/')) {
            if (pathname !== '/free') {
                shouldRedirect = true;
                redirectTarget = '/free';

                referrer = extractReferralSource(pathname);
                if (referrer) {
                    console.log(`🎯 Referral source detected for free signup: ${referrer}`);
                }
            }
        }

        if (referrer) {
            console.log(`💾 Saving referral source to localStorage: ${referrer}`);
            localStorage.setItem('referralSource', referrer);
            setReferralSource(referrer);
        } else if (!referralSource) {
            const storedReferrer = localStorage.getItem('referralSource');
            if (storedReferrer) {
                console.log(`📦 Referral source found in localStorage: ${storedReferrer}`);
                setReferralSource(storedReferrer);
            }
        }

        if (shouldSetFreeTrial) {
            console.log('🆓 Setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        }

        if (shouldRedirect && redirectTarget) {
            console.log(`🔄 Scheduling redirect from ${pathname} to ${redirectTarget}`);
            setTimeout(() => {
                if (pathname !== redirectTarget) {
                    console.log(`➡️ Redirecting to ${redirectTarget}...`);
                    router.replace(redirectTarget);
                }
            }, 150);
        }
    }, [pathname, router, extractReferralSource, referralSource]);

    // ✅ INICIALIZAR REFERRALSOURCE DO LOCALSTORAGE
    useEffect(() => {
        const storedReferrer = localStorage.getItem('referralSource');
        if (storedReferrer && !referralSource) {
            console.log(`🔧 Initializing referral source from localStorage: ${storedReferrer}`);
            setReferralSource(storedReferrer);
        }
    }, [referralSource]);

    // ✅ HANDLE OTHER TRIAL PARAMETERS
    useEffect(() => {
        const dctParam = searchParams.get('dct');
        if (dctParam === '1') {
            console.log('🎁 DCT parameter detected, setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        } else if (!hasFreeTrialOffer) {
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true') {
                console.log('🎁 Free trial found in localStorage');
                setHasFreeTrialOffer(true);
            }
        }
    }, [searchParams, hasFreeTrialOffer]);

    // ✅ AUTHENTICATION STATE CHECK - OTIMIZADO COM MELHOR SUPORTE A SECRETÁRIAS
    useEffect(() => {
        let isMounted = true;
        let unsubscribe = null;

        console.log('🔐 Auth state check initialized for path:', pathname);

        // ✅ FUNÇÃO PARA PROCESSAR USUÁRIO AUTENTICADO (MELHORADA)
        const handleAuthenticatedUser = async (authUser) => {
            if (!isMounted || processingRef.current) return;

            try {
                processingRef.current = true;
                console.log('👤 Processing authenticated user:', authUser.uid);

                // ✅ VERIFICAR SE É UM RE-LOGIN APÓS CRIAÇÃO DE SECRETÁRIA
                const isPostSecretaryCreation = localStorage.getItem('tempDoctorSession');
                const forceRefresh = !!isPostSecretaryCreation;

                if (isPostSecretaryCreation) {
                    console.log('🔄 Re-login detectado após criação de secretária, forçando refresh');
                    localStorage.removeItem('tempDoctorSession');
                }

                // ✅ TIMEOUT PARA EVITAR TRAVAMENTOS
                const contextPromise = getUserUnifiedContextCached(authUser.uid, forceRefresh);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Context timeout')), 10000)
                );

                const context = await Promise.race([contextPromise, timeoutPromise]);

                if (!isMounted) return;

                console.log('🎯 Contexto unificado obtido:', context.userType);

                // ✅ ATUALIZAR ESTADOS EM BATCH
                const newState = {
                    userContext: context,
                    isSecretary: context.isSecretary,
                    workingDoctorId: context.workingDoctorId,
                    permissions: context.permissions
                };

                // Aplicar todas as mudanças de uma vez
                setUserContext(newState.userContext);
                setIsSecretary(newState.isSecretary);
                setWorkingDoctorId(newState.workingDoctorId);
                setPermissions(newState.permissions);

                // ✅ PREPARAR DADOS DO USUÁRIO PARA EXIBIÇÃO
                const displayUserData = {
                    uid: authUser.uid,
                    ...context.userData,
                    isSecretary: context.isSecretary,
                    workingDoctorId: context.workingDoctorId,
                    permissions: context.permissions
                };

                // Se é secretária, adicionar dados específicos
                if (context.isSecretary) {
                    displayUserData.secretaryData = context.secretaryData;
                    displayUserData.secretaryName = context.secretaryData.name;
                    displayUserData.secretaryEmail = context.secretaryData.email;
                    console.log(`👩‍💼 Secretária logada: ${context.secretaryData.name} -> Médico: ${context.userData.fullName}`);
                }

                setUser(displayUserData);

                // ✅ REGISTRAR LOGIN (NÃO BLOQUEANTE)
                firebaseService.registerDetailedLogin(
                    authUser.uid,
                    authUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'
                ).catch((loginError) => {
                    console.warn('⚠️ Erro ao registrar login detalhado (não crítico):', loginError);
                });

                // ✅ REDIRECIONAMENTO OTIMIZADO
                setTimeout(() => {
                    if (!isMounted) return;

                    // Usar dados já carregados ao invés de recalcular
                    const userData = context.userData;

                    if (shouldRedirectToApp(userData, pathname)) {
                        console.log('✅ Redirecting authenticated user to /app');
                        router.push('/app');
                    } else {
                        const authRedirect = shouldRedirectToAuth(userData, pathname);
                        if (authRedirect) {
                            console.log(`❌ Redirecting user to ${authRedirect.redirect} (reason: ${authRedirect.reason})`);
                            router.push(authRedirect.redirect);
                        }
                    }
                }, context.isSecretary ? 500 : 200); // Secretárias precisam de mais tempo

            } catch (error) {
                console.error("❌ Auth processing error:", error);

                if (isMounted) {
                    // ✅ RESET LIMPO EM CASO DE ERRO
                    setUser(null);
                    setUserContext(null);
                    setIsSecretary(false);
                    setWorkingDoctorId(null);
                    setPermissions('full');
                    globalCache.invalidate('userContext');
                    verificationCache.clear();

                    // Se erro crítico, redirecionar
                    if (error.message.includes('timeout') || error.message.includes('unauthorized')) {
                        router.push('/');
                    }
                }
            } finally {
                processingRef.current = false;
            }
        };

        // ✅ FUNÇÃO PARA PROCESSAR USUÁRIO DESLOGADO (MELHORADA)
        const handleUnauthenticatedUser = async () => {
            if (!isMounted) return;

            console.log('🚫 Processing unauthenticated user');

            // ✅ PARAR PRESENÇA SE ATIVA
            if (presenceInitialized) {
                try {
                    await presenceService.stopPresence();
                    setPresenceInitialized(false);
                } catch (error) {
                    console.warn('⚠️ Erro ao parar presença:', error);
                }
            }

            // ✅ RESET COMPLETO COM LIMPEZA DE CACHE
            setUser(null);
            setUserContext(null);
            setIsSecretary(false);
            setWorkingDoctorId(null);
            setPermissions('full');
            globalCache.invalidate('userContext');
            globalCache.invalidate('secretaryInfo');
            globalCache.invalidate('profileData');
            verificationCache.clear();

            // ✅ REDIRECIONAR SE NECESSÁRIO
            const authRedirect = shouldRedirectToAuth(null, pathname);
            if (authRedirect) {
                console.log(`🚫 Unauthenticated user trying to access protected route, redirecting to ${authRedirect.redirect}`);
                router.push(authRedirect.redirect);
            }
        };

        // ✅ CONFIGURAR LISTENER
        try {
            unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
                if (!isMounted) return;

                try {
                    if (authUser) {
                        await handleAuthenticatedUser(authUser);
                    } else {
                        await handleUnauthenticatedUser();
                    }
                } catch (error) {
                    console.error("❌ Auth listener error:", error);
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            });
        } catch (error) {
            console.error("❌ Auth listener setup error:", error);
            if (isMounted) {
                setLoading(false);
            }
        }

        // ✅ CLEANUP
        return () => {
            isMounted = false;
            processingRef.current = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };

        // ✅ DEPENDÊNCIAS MÍNIMAS (CRÍTICO!)
    }, [pathname]); // Apenas pathname - outras funções são estáveis

    // ✅ VERIFICAÇÃO DE TAMANHO DE TELA
    useEffect(() => {
        if (!user || loading || pathname !== '/app') return;

        const isLegacy = checkIfLegacyUser(user);
        if (!isLegacy && !userHasAccess(user)) return;

        const checkScreenSize = () => {
            if (typeof window !== "undefined" && window.innerWidth < 900) {
                console.log(`📱 Tela pequena detectada (${window.innerWidth}px), redirecionando para /mobile`);
                router.push("/mobile");
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [user, loading, pathname, router, checkIfLegacyUser, userHasAccess]);

    // ✅ SISTEMA DE PRESENÇA OTIMIZADO
    useEffect(() => {
        if (!user?.uid) {
            // Se não há usuário, parar presença
            if (presenceInitialized) {
                presenceService.stopPresence();
                setPresenceInitialized(false);
            }
            return;
        }

        // Se há usuário e presença não foi inicializada
        if (user.uid && !presenceInitialized && !loading) {
            console.log('🔴 Iniciando sistema de presença para:', user.uid);

            const userData = {
                fullName: user.fullName,
                email: user.email,
                planType: user.planType || (user.gratuito ? 'free' : 'premium'),
                isAdmin: user.administrador === true,
                isSecretary: isSecretary,
                doctorId: workingDoctorId
            };

            presenceService.startPresence(user.uid, userData)
                .then(() => {
                    setPresenceInitialized(true);
                    console.log('✅ Sistema de presença iniciado com sucesso');
                })
                .catch((error) => {
                    console.error('❌ Erro ao iniciar sistema de presença:', error);
                });
        }

        // Cleanup quando componente for desmontado
        return () => {
            if (presenceInitialized) {
                presenceService.stopPresence();
                setPresenceInitialized(false);
            }
        };
    }, [user?.uid, presenceInitialized, loading, isSecretary, workingDoctorId]);

    // ✅ FUNÇÕES PARA GERENCIAR MÓDULOS
    const updateUserModules = useCallback(async (modules, limitations = null) => {
        if (!user?.uid) return false;

        if (checkIfLegacyUser(user)) {
            console.warn('👴 Usuário legacy - Não é possível alterar módulos');
            return false;
        }

        try {
            const result = await moduleService.setCustomModules(user.uid, modules, limitations);
            if (result.success) {
                const updatedUserData = await firebaseService.getUserData(user.uid);
                setUser({ uid: user.uid, ...updatedUserData });

                // Limpar cache do contexto
                globalCache.invalidate('userContext');

                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao atualizar módulos do usuário:', error);
            return false;
        }
    }, [user, checkIfLegacyUser]);

    const upgradeUserPlan = useCallback(async (newPlanType) => {
        if (!user?.uid) return false;

        try {
            const result = await firebaseService.updateUserPlan(user.uid, newPlanType);
            if (result.success) {
                const updatedUserData = await firebaseService.getUserData(user.uid);
                setUser({ uid: user.uid, ...updatedUserData });

                // Limpar cache do contexto
                globalCache.invalidate('userContext');

                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao fazer upgrade do plano:', error);
            return false;
        }
    }, [user]);

    const migrateFromLegacy = useCallback(async (targetPlan = 'free') => {
        if (!user?.uid) return false;

        const isLegacy = checkIfLegacyUser(user);
        if (!isLegacy) {
            console.log('Usuário já está no sistema de módulos');
            return true;
        }

        try {
            console.log(`🔄 Migrando usuário legacy para plano: ${targetPlan}`);

            let planType = targetPlan;
            if (user.assinouPlano === true) {
                planType = user.planType || 'monthly';
            } else if (user.gratuito === true) {
                planType = 'free';
            }

            const result = await moduleService.updateUserModulesFromPlan(user.uid, planType);
            if (result.success) {
                const updatedUserData = await firebaseService.getUserData(user.uid);
                setUser({ uid: user.uid, ...updatedUserData });

                // Limpar cache do contexto
                globalCache.invalidate('userContext');

                console.log('✅ Usuário legacy migrado com sucesso');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao migrar usuário legacy:', error);
            return false;
        }
    }, [user, checkIfLegacyUser]);

    // ✅ FUNÇÕES AUXILIARES
    const isProtectedRoute = useCallback((path) => {
        return path.startsWith('/app') || path.startsWith('/mobile');
    }, []);

    const isPublicRoute = useCallback((path) => {
        return ['/', '/login', '/free', '/checkout'].some(route =>
            path === route || path.startsWith(route + '/')
        );
    }, []);

    // ✅ FUNÇÃO AUXILIAR PARA LIMPAR CACHE QUANDO NECESSÁRIO
    const clearRelatedCaches = useCallback((userId = null) => {
        const targetUserId = userId || user?.uid;
        if (targetUserId) {
            globalCache.invalidate('userContext', targetUserId);
            globalCache.invalidate('secretaryInfo', targetUserId);
            globalCache.invalidate('profileData', targetUserId);
            invalidateVerificationCache(targetUserId);
        } else {
            globalCache.invalidate('userContext');
            globalCache.invalidate('secretaryInfo');
            globalCache.invalidate('profileData');
            verificationCache.clear();
        }
    }, [user?.uid]);

    // ✅ CLEANUP AO DESMONTAR COMPONENTE
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            // Limpar caches ao desmontar
            verificationCache.clear();
        };
    }, []);

    // ✅ MEMOIZAR VALUE DO CONTEXT COM NOVAS FUNÇÕES
    const contextValue = useMemo(() => ({
        // Estados básicos
        user,
        loading,
        isFreeUser,
        logout,
        hasFreeTrialOffer,
        referralSource,

        // Estados de secretária
        isSecretary,
        workingDoctorId,
        permissions,
        userContext,

        // Funções para secretárias - MELHORADAS
        hasModulePermission,
        canViewSensitiveData,
        createSecretaryAccount, // ✅ FUNÇÃO CORRIGIDA
        updateSecretaryPermissions,
        deactivateSecretary,
        getEffectiveUserId,
        getDisplayUserData,
        reloadUserContext,

        // ✅ NOVAS FUNÇÕES
        clearRelatedCaches,
        forceRefreshUserContext: () => reloadUserContext(true),
        markAsNewlyCreated, // ✅ NOVA FUNÇÃO

        // Funções de módulos
        updateUserModules,
        upgradeUserPlan,
        migrateFromLegacy,

        // Funções auxiliares
        isProtectedRoute,
        isPublicRoute,

        // Verificações de usuário
        isLegacyUser: user ? checkIfLegacyUser(user) : false,
        userHasAccess: user ? userHasAccess(user) : false,
        userHasValidData: user ? userHasValidData(user) : false
    }), [
        user, loading, isFreeUser, logout, hasFreeTrialOffer, referralSource,
        isSecretary, workingDoctorId, permissions, userContext,
        hasModulePermission, canViewSensitiveData, createSecretaryAccount,
        updateSecretaryPermissions, deactivateSecretary, getEffectiveUserId,
        getDisplayUserData, reloadUserContext, clearRelatedCaches, markAsNewlyCreated,
        updateUserModules, upgradeUserPlan, migrateFromLegacy,
        isProtectedRoute, isPublicRoute, checkIfLegacyUser,
        userHasAccess, userHasValidData
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);