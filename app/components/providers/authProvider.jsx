"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { authService } from "../../../lib/services/firebase"; // Apenas Firebase Auth
import { auth } from "../../../lib/config/firebase.config";
import moduleService from "../../../lib/moduleService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { presenceApiService } from "@/lib/services/api";
import secretaryApiService from "@/lib/services/api/secretary.service";
import authApiService from "@/lib/services/api/auth.service";
import globalCache from "../utils/globalCache";

const AuthContext = createContext();

// ✅ CACHE PARA RESULTADOS DE VERIFICAÇÃO - MELHORADO
const verificationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// ✅ FUNÇÃO AUXILIAR PARA CACHE COM TTL
const getCachedResult = (key, computeFn, duration = CACHE_DURATION) => {
    const cached = verificationCache.get(key);

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
        for (const [key, value] of verificationCache.entries()) {
            if (key.includes(pattern)) {
                value.invalidated = true;
            }
        }
    } else {
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

    // ✅ ESTADOS PARA SISTEMA MULTI-CLÍNICA
    const [clinicMode, setClinicMode] = useState('solo'); // 'solo' | 'multi_doctor'
    const [clinicData, setClinicData] = useState(null);   // Dados da clínica
    const [doctorAssociation, setDoctorAssociation] = useState(null); // Associação do médico
    const [accessibleDoctors, setAccessibleDoctors] = useState([]); // Médicos que pode acessar
    const [currentDoctorFilter, setCurrentDoctorFilter] = useState(null); // Filtro de médico ativo

    // ✅ HOOKS DO NEXT.JS
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ✅ REFS PARA OTIMIZAÇÃO
    const mountedRef = useRef(true);
    const processingRef = useRef(false);

    // TODAS AS FUNCIONALIDADES LIBERADAS PARA TODOS OS USUÁRIOS
    const isFreeUser = false;

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
                inputPhone: authUser.phoneNumber || null, // Armazenar telefone se disponível
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

            // Provisionar usuário no backend se for novo
            await authApiService.provision({
                name: userData.fullName,
                email: userData.email,
                phone: userData.inputPhone,
                plan_type: userData.planType,
            });
            console.log('✅ Dados básicos criados para usuário órfão via API');

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
                    const updatedUserData = await authApiService.me();
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

    // ✅ FUNÇÃO PARA OBTER CONTEXTO UNIFICADO - CORRIGIDA
    const getUserUnifiedContextCached = useCallback(async (userId, forceRefresh = false) => {
        const cacheKey = `userContext_${userId}`;

        if (forceRefresh) {
            console.log('🔄 Forçando atualização do contexto para:', userId);
            globalCache.invalidate('userContext', userId);
        }

        return await globalCache.getOrSet('userContext', userId, async () => {
            console.log('🔍 Buscando novo contexto para:', userId);

            try {
                // ✅ PRIMEIRO VERIFICAR SE É MÉDICO (MAIS COMUM)
                console.log('🔍 Verificando se é médico via API...');
                let doctorData;

                try {
                    // Usar API para buscar dados do usuário atual
                    doctorData = await authApiService.me();
                } catch (error) {
                    console.log('⚠️ Não encontrado via API:', error.message);
                }

                if (doctorData && doctorData.email) {
                    console.log(`👨‍⚕️ Médico encontrado: ${doctorData.fullName || doctorData.name || doctorData.email}`);

                    const context = {
                        userType: 'doctor',
                        workingDoctorId: userId,
                        userData: {
                            ...doctorData,
                            fullName: doctorData.fullName || doctorData.name,
                        },
                        permissions: 'full',
                        isSecretary: false
                    };

                    return context;
                }

                // ✅ SE NÃO É MÉDICO, VERIFICAR SE É SECRETÁRIA VIA API
                console.log('🔍 Não é médico, verificando se é secretária via API...');

                try {
                    // Buscar dados da secretária via API
                    const secretaryData = await secretaryApiService.getById(userId);

                    if (secretaryData) {
                        if (!secretaryData.isActive) {
                            throw new Error("Conta de secretária desativada");
                        }

                        // Buscar dados do médico responsável via API
                        // Para isso, precisamos buscar os dados do médico associado
                        const doctorData = await authApiService.me();
                        if (!doctorData) {
                            throw new Error("Médico responsável não encontrado");
                        }

                        const context = {
                            userType: 'secretary',
                            workingDoctorId: secretaryData.doctorId,
                            userData: {
                                ...doctorData,
                                fullName: doctorData.fullName || doctorData.name,
                            },
                            secretaryData: secretaryData,
                            permissions: secretaryData.permissions || {},
                            isSecretary: true,
                            secretaryId: userId
                        };

                        console.log(`👩‍💼 Contexto de secretária obtido: ${secretaryData.name} -> ${doctorData.fullName || doctorData.name}`);
                        return context;
                    }
                } catch (secretaryError) {
                    console.log('⚠️ Não é secretária válida:', secretaryError.message);
                }

                // ✅ SE NÃO É NEM MÉDICO NEM SECRETÁRIA, TENTAR CRIAR DADOS ÓRFÃOS
                console.log('🔍 Não é secretária válida, pode ser usuário órfão...');
                throw new Error("Usuário não encontrado - nem médico nem secretária válida");

            } catch (error) {
                console.error("❌ Erro ao obter contexto unificado:", error);
                throw error;
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
        const protectedRoutes = ['/app'];
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

    // ✅ FUNÇÃO PARA CRIAR CONTA DE SECRETÁRIA - CORRIGIDA
    const createSecretaryAccount = useCallback(async (secretaryData) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem criar contas de secretária");
        }

        try {
            console.log('🔄 Iniciando criação de secretária via AuthProvider...');

            const result = await secretaryApiService.create(secretaryData);

            if (result && result.id) {
                console.log('✅ Secretária criada com sucesso!');

                // ✅ INVALIDAR TODOS OS CACHES RELACIONADOS
                const doctorId = workingDoctorId || user.uid;
                globalCache.invalidate('userContext', doctorId);
                globalCache.invalidate('secretaryInfo', doctorId);
                globalCache.invalidate('profileData', doctorId);
                invalidateVerificationCache(doctorId);

                // ✅ RECARREGAR CONTEXTO APÓS CRIAÇÃO
                setTimeout(async () => {
                    try {
                        console.log('🔄 Recarregando contexto após criação de secretária...');
                        await reloadUserContext(true);
                    } catch (error) {
                        console.warn('⚠️ Erro ao recarregar contexto após criação:', error);
                    }
                }, 2000);
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

                // ✅ OBTER CONTEXTO COM RETRY PARA CASOS COMPLEXOS
                let context;
                let retries = 0;
                const maxRetries = 3;
                let userProvisionAttempted = false;

                while (retries < maxRetries) {
                    try {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Context timeout')), 15000)
                        );

                        const contextPromise = getUserUnifiedContextCached(authUser.uid, forceRefresh || retries > 0);
                        context = await Promise.race([contextPromise, timeoutPromise]);
                        break; // Sucesso, sair do loop

                    } catch (error) {
                        retries++;
                        console.warn(`⚠️ Tentativa ${retries}/${maxRetries} falhou:`, error.message);

                        // ✅ SE É USUÁRIO ÓRFÃO E AINDA NÃO TENTOU PROVISIONAR
                        if (error.message.includes('Usuário não encontrado') && !userProvisionAttempted) {
                            userProvisionAttempted = true;
                            console.log('🔧 Tentando criar dados para usuário órfão...');
                            try {
                                const orphanData = await createOrphanUserData(authUser);
                                console.log('✅ Usuário órfão provisionado, aguardando propagação...');

                                // Aguardar propagação no banco
                                await new Promise(resolve => setTimeout(resolve, 1500));

                                // Invalidar cache e tentar novamente
                                globalCache.invalidate('userContext', authUser.uid);

                                // Tentar buscar contexto atualizado
                                try {
                                    context = await getUserUnifiedContextCached(authUser.uid, true);
                                    console.log('✅ Contexto obtido após provisão');
                                    break;
                                } catch (retryError) {
                                    console.log('⚠️ Usando dados locais da provisão');
                                    context = {
                                        userType: 'doctor',
                                        workingDoctorId: authUser.uid,
                                        userData: orphanData,
                                        permissions: 'full',
                                        isSecretary: false
                                    };
                                    break;
                                }
                            } catch (orphanError) {
                                console.error('❌ Erro ao criar usuário órfão:', orphanError);
                                throw new Error('Não foi possível criar sua conta. Tente novamente.');
                            }
                        }

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

                // ✅ CARREGAR DADOS DA CLÍNICA (clinicMode vem do backend)
                const userClinicMode = context.userData?.clinicMode || 'solo';
                await loadClinicData(userClinicMode);

                // ✅ REGISTRAR LOGIN (NÃO BLOQUEANTE) - Agora tratado pelo backend automaticamente
                console.log(`✅ Login registrado: ${authUser.uid} via ${authUser.providerData?.[0]?.providerId || 'email'}`);

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
                    await presenceApiService.stopPresence();
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
            unsubscribe = onAuthStateChanged(auth, async (authUser) => {
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
            const result = await secretaryApiService.updatePermissions(secretaryId, newPermissions);

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
            const result = await secretaryApiService.deactivate(secretaryId);

            // ✅ INVALIDAR CACHES E RECARREGAR DADOS
            const doctorId = workingDoctorId || user.uid;
            globalCache.invalidate('userContext', doctorId);
            globalCache.invalidate('secretaryInfo', doctorId);
            globalCache.invalidate('profileData', doctorId);
            invalidateVerificationCache(doctorId);

            // Atualizar dados do usuário
            const updatedUserData = await authApiService.me();
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
                await presenceApiService.stopPresence();
                setPresenceInitialized(false);
            }

            await signOut(auth);

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

    // ✅ VERIFICAÇÃO DE TAMANHO DE TELA
    useEffect(() => {
        if (!user || loading || pathname !== '/app') return;

        const isLegacy = checkIfLegacyUser(user);
        if (!isLegacy && !userHasAccess(user)) return;

        const checkScreenSize = () => {
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
                presenceApiService.stopPresence();
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

            presenceApiService.startPresence(user.uid, userData)
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
                presenceApiService.stopPresence();
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
                const updatedUserData = await authApiService.me();
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
            // Atualizar plano via moduleService (que já usa a API internamente)
            const result = await moduleService.updateUserModulesFromPlan(user.uid, newPlanType);
            if (result.success) {
                const updatedUserData = await authApiService.me();
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
                const updatedUserData = await authApiService.me();
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
        return path.startsWith('/app');
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

    // ✅ FUNÇÕES PARA SISTEMA MULTI-CLÍNICA

    /**
     * Verifica se pode acessar dados de um médico específico
     */
    const canAccessDoctorData = useCallback((doctorId) => {
        // Admin sempre pode
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }

        // Modo solo: só pode acessar seus próprios dados
        if (clinicMode === 'solo') {
            return workingDoctorId === doctorId;
        }

        // Modo multi-médico: verificar na lista de acessíveis
        return accessibleDoctors.some(d => d.id === doctorId || d.profissionalId === doctorId);
    }, [user, clinicMode, workingDoctorId, accessibleDoctors]);

    /**
     * Verifica se pode gerenciar financeiro
     */
    const canManageFinancial = useCallback(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (doctorAssociation?.additionalPermissions?.canManageFinancial) {
            return true;
        }
        // Médico solo tem acesso total
        if (clinicMode === 'solo' && !isSecretary) {
            return true;
        }
        return false;
    }, [user, doctorAssociation, clinicMode, isSecretary]);

    /**
     * Retorna lista de médicos para filtro
     */
    const getDoctorsForFilter = useCallback(() => {
        if (clinicMode === 'solo') {
            return workingDoctorId ? [{ id: workingDoctorId, name: user?.fullName }] : [];
        }
        return accessibleDoctors;
    }, [clinicMode, workingDoctorId, accessibleDoctors, user]);

    /**
     * Define filtro de médico para visualização
     */
    const setDoctorFilter = useCallback((doctorId) => {
        if (doctorId && !canAccessDoctorData(doctorId)) {
            console.error('Acesso negado ao médico:', doctorId);
            return false;
        }
        setCurrentDoctorFilter(doctorId);
        return true;
    }, [canAccessDoctorData]);

    /**
     * Carrega dados da clínica e médicos (chamado após login)
     * @param {string} [modeFromUser] - clinicMode já obtido do /account/me
     */
    const loadClinicData = useCallback(async (modeFromUser = null) => {
        try {
            // Se já temos o modo do usuário, usar diretamente
            const mode = modeFromUser || 'solo';
            setClinicMode(mode);

            console.log('📊 Modo clínica:', mode);

            // Se for multi_doctor, carregar dados adicionais da clínica
            if (mode === 'multi_doctor') {
                try {
                    const clinicService = (await import('@/lib/services/api/clinic.service')).default;

                    // Carregar informações da clínica
                    const clinicInfo = await clinicService.getCurrent();
                    setClinicData(clinicInfo);

                    // Carregar lista de médicos acessíveis
                    const doctors = await clinicService.listDoctors({ activeOnly: true });
                    setAccessibleDoctors(doctors || []);

                    console.log('📊 Clínica multi-médico carregada:', {
                        clinicName: clinicInfo?.name,
                        doctorsCount: doctors?.length || 0
                    });
                } catch (clinicError) {
                    console.warn('⚠️ Erro ao carregar dados da clínica (não crítico):', clinicError);
                    // Continua funcionando em modo solo como fallback
                    setClinicData(null);
                    setAccessibleDoctors([]);
                }
            } else {
                setClinicData(null);
                setDoctorAssociation(null);
                setAccessibleDoctors([]);
            }
        } catch (error) {
            console.error('Erro ao carregar dados da clínica:', error);
            setClinicMode('solo'); // Fallback seguro
        }
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
        userHasValidData: user ? userHasValidData(user) : false,

        // ✅ ESTADOS E FUNÇÕES MULTI-CLÍNICA
        clinicMode,
        clinicData,
        doctorAssociation,
        accessibleDoctors,
        currentDoctorFilter,

        // Funções multi-clínica
        canAccessDoctorData,
        canManageFinancial,
        getDoctorsForFilter,
        setDoctorFilter,
        loadClinicData,

        // Helpers computados
        isMultiDoctorClinic: clinicMode === 'multi_doctor',
        isSoloDoctor: clinicMode === 'solo' && !isSecretary,
        isClinicAdmin: user?.role === 'tenant_admin' || user?.administrador
    }), [
        user, loading, isFreeUser, logout, hasFreeTrialOffer, referralSource,
        isSecretary, workingDoctorId, permissions, userContext,
        hasModulePermission, canViewSensitiveData, createSecretaryAccount,
        updateSecretaryPermissions, deactivateSecretary, getEffectiveUserId,
        getDisplayUserData, reloadUserContext, clearRelatedCaches, markAsNewlyCreated,
        updateUserModules, upgradeUserPlan, migrateFromLegacy,
        isProtectedRoute, isPublicRoute, checkIfLegacyUser,
        userHasAccess, userHasValidData,
        // Multi-clínica
        clinicMode, clinicData, doctorAssociation, accessibleDoctors,
        currentDoctorFilter, canAccessDoctorData, canManageFinancial,
        getDoctorsForFilter, setDoctorFilter, loadClinicData
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);