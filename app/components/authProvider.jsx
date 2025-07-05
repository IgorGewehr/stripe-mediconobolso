"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import firebaseService from "../../lib/firebaseService";
import moduleService from "../../lib/moduleService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import presenceService from "../../lib/presenceService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasFreeTrialOffer, setHasFreeTrialOffer] = useState(false);
    const [referralSource, setReferralSource] = useState(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [userContext, setUserContext] = useState(null); // Contexto unificado
    const [isSecretary, setIsSecretary] = useState(false);
    const [workingDoctorId, setWorkingDoctorId] = useState(null); // ID do médico responsável
    const [permissions, setPermissions] = useState('full');

    const isFreeUser = Boolean(user?.gratuito);

    const [presenceInitialized, setPresenceInitialized] = useState(false);

    // 🔧 FUNÇÃO AUXILIAR PARA EXTRAIR REFERÊNCIA
    const extractReferralSource = (path) => {
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
    };

    // ✨ DETECTAR SE É USUÁRIO LEGACY
    const checkIfLegacyUser = (userData) => {
        if (!userData) return false;
        if (userData.administrador === true) return false;

        const hasOldFields = userData.hasOwnProperty('assinouPlano') || userData.hasOwnProperty('gratuito');
        const hasNewFields = userData.hasOwnProperty('modules') || userData.hasOwnProperty('customModules') || userData.hasOwnProperty('planType');

        return hasOldFields && !hasNewFields;
    };

    // 🆕 CRIAR DADOS BÁSICOS PARA USUÁRIOS ÓRFÃOS
    const createOrphanUserData = async (authUser) => {
        try {
            console.log('🔧 Criando dados básicos para usuário órfão:', authUser.uid);

            // Extrair informações básicas do Firebase Auth
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
                needsProfileCompletion: true // Marcar para completar perfil
            };

            // Adicionar dados específicos do Google se for o caso
            if (authUser.providerData?.[0]?.providerId === 'google.com') {
                userData.googleProfile = {
                    uid: authUser.uid,
                    displayName: authUser.displayName,
                    email: authUser.email,
                    photoURL: authUser.photoURL,
                    emailVerified: authUser.emailVerified
                };
            }

            // Verificar referralSource
            const currentReferralSource = referralSource || localStorage.getItem('referralSource');
            if (currentReferralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Usuário órfão marcado como vindo através do Enrico');
            } else if (currentReferralSource) {
                userData.referralSource = currentReferralSource;
            }

            // Criar documento no Firestore
            await firebaseService.editUserData(authUser.uid, userData);
            console.log('✅ Dados básicos criados para usuário órfão');

            return userData;
        } catch (error) {
            console.error('❌ Erro ao criar dados para usuário órfão:', error);
            throw error;
        }
    };

    // ✨ MIGRAÇÃO OPCIONAL
    const migrateUserModulesIfNeeded = async (userData, uid) => {
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
    };

    // 🔧 VERIFICAR SE USUÁRIO TEM ACESSO (CORRIGIDO)
    const userHasAccess = (userData) => {
        if (!userData) return false;

        // Admin sempre tem acesso
        if (userData.administrador === true) return true;

        // Legacy users sempre têm acesso
        if (checkIfLegacyUser(userData)) return true;

        // Usuários regulares - deve ter pelo menos um dos campos básicos
        return userData.assinouPlano === true || userData.gratuito === true;
    };

    // 🔧 VERIFICAR SE USUÁRIO TEM DADOS VÁLIDOS
    const userHasValidData = (userData) => {
        if (!userData) return false;

        // Verificar se tem dados mínimos necessários
        return userData.email && (
            userData.hasOwnProperty('assinouPlano') ||
            userData.hasOwnProperty('gratuito') ||
            userData.hasOwnProperty('planType')
        );
    };

    // 🔧 VERIFICAR SE DEVE REDIRECIONAR PARA APP
    const shouldRedirectToApp = (userData, currentPath) => {
        if (!userData) return false;

        // Verificar se tem dados válidos e acesso
        if (!userHasValidData(userData) || !userHasAccess(userData)) return false;

        // Não redirecionar se estiver em rotas específicas
        const publicRoutes = ['/', '/login', '/checkout', '/free'];
        const isInPublicRoute = publicRoutes.includes(currentPath) ||
            currentPath.startsWith('/checkout/') ||
            currentPath.startsWith('/free/');

        // Se está em rota pública E tem parâmetro DCT, não redirecionar
        if (isInPublicRoute && searchParams.get('dct') === '1') {
            return false;
        }

        // Se está em rota pública e tem acesso, redirecionar
        return isInPublicRoute;
    };

    // 🔧 VERIFICAR SE DEVE REDIRECIONAR PARA LOGIN/CHECKOUT
    const shouldRedirectToAuth = (userData, currentPath) => {
        const protectedRoutes = ['/app', '/mobile'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

        if (!isProtectedRoute) return false;

        // Se não tem usuário, redirecionar para login
        if (!userData) return { redirect: '/', reason: 'no_user' };

        // Se não tem dados válidos, redirecionar para completar cadastro
        if (!userHasValidData(userData)) {
            return { redirect: '/free', reason: 'invalid_data' };
        }

        // Se não tem acesso, redirecionar para checkout
        if (!userHasAccess(userData)) {
            return { redirect: '/checkout', reason: 'no_access' };
        }

        return false;
    };

    // 🆕 FUNÇÃO PARA VERIFICAR PERMISSÃO DE MÓDULO
    const hasModulePermission = (module, action = 'read') => {
        // Se é médico, sempre tem acesso total
        if (!isSecretary) return true;

        // Se é secretária, verificar permissões específicas
        if (permissions === 'full') return true;

        const modulePermissions = permissions[module];
        return modulePermissions ? modulePermissions[action] === true : false;
    };

    // 🆕 FUNÇÃO PARA VERIFICAR SE PODE ACESSAR DETALHES SENSÍVEIS
    const canViewSensitiveData = (dataType) => {
        if (!isSecretary) return true;

        const sensitiveModules = ['patients', 'anamnesis', 'medical_records'];

        for (const module of sensitiveModules) {
            if (dataType.includes(module)) {
                return permissions[module]?.viewDetails === true;
            }
        }

        return true;
    };

    // Detecção de rotas especiais e redirecionamentos
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
    }, [pathname, router]);

    // Inicializar referralSource do localStorage
    useEffect(() => {
        const storedReferrer = localStorage.getItem('referralSource');
        if (storedReferrer && !referralSource) {
            console.log(`🔧 Initializing referral source from localStorage: ${storedReferrer}`);
            setReferralSource(storedReferrer);
        }
    }, []);

    // Handle other trial parameters
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

    useEffect(() => {
        console.log('🔐 Authentication state check running, pathname:', pathname);
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    console.log('👤 Authenticated user detected:', authUser.uid);

                    // 🆕 BUSCAR CONTEXTO UNIFICADO (médico ou secretária)
                    const context = await firebaseService.getUserUnifiedContext(authUser.uid);
                    console.log('🎯 Contexto unificado obtido:', context.userType);

                    setUserContext(context);
                    setIsSecretary(context.isSecretary);
                    setWorkingDoctorId(context.workingDoctorId);
                    setPermissions(context.permissions);

                    // Para a interface, sempre usar os dados do médico responsável
                    const displayUserData = {
                        uid: authUser.uid,
                        ...context.userData,
                        // 🎯 CAMPOS ESPECÍFICOS PARA IDENTIFICAÇÃO
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

                    // Registrar login detalhado
                    try {
                        await firebaseService.registerDetailedLogin(
                            authUser.uid,
                            authUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'
                        );
                        console.log('✅ Login detalhado registrado');
                    } catch (loginError) {
                        console.warn('⚠️ Erro ao registrar login detalhado (não crítico):', loginError);
                    }

                    // 🔧 LÓGICA DE REDIRECIONAMENTO MANTIDA
                    console.log('🔄 Checking redirect logic...');
                    setTimeout(() => {
                        if (shouldRedirectToApp(context.userData, pathname)) {
                            console.log('✅ Redirecting authenticated user to /app');
                            router.push('/app');
                        } else {
                            const authRedirect = shouldRedirectToAuth(context.userData, pathname);
                            if (authRedirect) {
                                console.log(`❌ Redirecting user to ${authRedirect.redirect} (reason: ${authRedirect.reason})`);
                                router.push(authRedirect.redirect);
                            }
                        }
                    }, 200);

                } catch (error) {
                    console.error("❌ Erro crítico ao processar usuário autenticado:", error);

                    // Em caso de erro crítico, fazer logout
                    await signOut(firebaseService.auth);
                    setUser(null);
                    setUserContext(null);
                    setIsSecretary(false);
                    setWorkingDoctorId(null);
                    setPermissions('full');
                    router.push('/');
                }
            } else {
                console.log('🚫 No authenticated user');

                if (presenceInitialized) {
                    await presenceService.stopPresence();
                    setPresenceInitialized(false);
                }

                setUser(null);
                setUserContext(null);
                setIsSecretary(false);
                setWorkingDoctorId(null);
                setPermissions('full');

                // Redirecionar usuário não autenticado tentando acessar área protegida
                const authRedirect = shouldRedirectToAuth(null, pathname);
                if (authRedirect) {
                    console.log(`🚫 Unauthenticated user trying to access protected route, redirecting to ${authRedirect.redirect}`);
                    router.push(authRedirect.redirect);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router, searchParams, referralSource, presenceInitialized]);


    // Verificação de tamanho de tela
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
    }, [user, loading, pathname, router]);

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
                isAdmin: user.administrador === true
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
    }, [user?.uid, presenceInitialized, loading]);

    const createSecretaryAccount = async (secretaryData) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem criar contas de secretária");
        }

        try {
            const result = await firebaseService.createSecretaryAccount(
                workingDoctorId || user.uid,
                secretaryData
            );

            // Atualizar dados do usuário para refletir que agora tem secretária
            const updatedUserData = await firebaseService.getUserData(workingDoctorId || user.uid);
            setUser(prev => ({ ...prev, ...updatedUserData }));

            return result;
        } catch (error) {
            console.error("❌ Erro ao criar conta de secretária:", error);
            throw error;
        }
    };

    const updateSecretaryPermissions = async (secretaryId, newPermissions) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem atualizar permissões");
        }

        try {
            return await firebaseService.updateSecretaryPermissions(
                workingDoctorId || user.uid,
                secretaryId,
                newPermissions
            );
        } catch (error) {
            console.error("❌ Erro ao atualizar permissões:", error);
            throw error;
        }
    };

    const deactivateSecretary = async (secretaryId) => {
        if (!user || isSecretary) {
            throw new Error("Apenas médicos podem desativar secretárias");
        }

        try {
            const result = await firebaseService.deactivateSecretaryAccount(
                workingDoctorId || user.uid,
                secretaryId
            );

            // Atualizar dados do usuário
            const updatedUserData = await firebaseService.getUserData(workingDoctorId || user.uid);
            setUser(prev => ({ ...prev, ...updatedUserData }));

            return result;
        } catch (error) {
            console.error("❌ Erro ao desativar secretária:", error);
            throw error;
        }
    };

    // 🆕 FUNÇÃO PARA OBTER ID EFETIVO PARA OPERAÇÕES
    const getEffectiveUserId = () => {
        return workingDoctorId || user?.uid;
    };

    // 🆕 FUNÇÃO PARA OBTER DADOS PARA EXIBIÇÃO
    const getDisplayUserData = () => {
        if (isSecretary) {
            return {
                ...user,
                displayName: `${user.secretaryName} (Secretária de Dr. ${user.fullName})`,
                role: 'Secretária',
                doctorName: user.fullName
            };
        }

        return {
            ...user,
            displayName: `Dr. ${user.fullName}`,
            role: user.administrador ? 'Administrador' : 'Médico'
        };
    };

    const logout = async () => {
        try {
            // Parar sistema de presença antes do logout
            if (presenceInitialized) {
                await presenceService.stopPresence();
                setPresenceInitialized(false);
            }

            await signOut(firebaseService.auth);

            setUserContext(null);
            setIsSecretary(false);
            setWorkingDoctorId(null);
            setPermissions('full');

            router.push('/');
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
        }
    };

    // Funções para gerenciar módulos
    const updateUserModules = async (modules, limitations = null) => {
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
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao atualizar módulos do usuário:', error);
            return false;
        }
    };

    const upgradeUserPlan = async (newPlanType) => {
        if (!user?.uid) return false;

        try {
            const result = await firebaseService.updateUserPlan(user.uid, newPlanType);
            if (result.success) {
                const updatedUserData = await firebaseService.getUserData(user.uid);
                setUser({ uid: user.uid, ...updatedUserData });
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao fazer upgrade do plano:', error);
            return false;
        }
    };

    const migrateFromLegacy = async (targetPlan = 'free') => {
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
                console.log('✅ Usuário legacy migrado com sucesso');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erro ao migrar usuário legacy:', error);
            return false;
        }
    };

    const isProtectedRoute = (path) => {
        return path.startsWith('/app') || path.startsWith('/mobile');
    };

    const isPublicRoute = (path) => {
        return ['/', '/login', '/free', '/checkout'].some(route =>
            path === route || path.startsWith(route + '/')
        );
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isFreeUser,
            logout,
            hasFreeTrialOffer,
            referralSource,

            // 🆕 PROPRIEDADES PARA SECRETÁRIAS
            isSecretary,
            workingDoctorId,
            permissions,
            userContext,

            // 🆕 FUNÇÕES PARA SECRETÁRIAS
            hasModulePermission,
            canViewSensitiveData,
            createSecretaryAccount,
            updateSecretaryPermissions,
            deactivateSecretary,
            getEffectiveUserId,
            getDisplayUserData,

            // Funções existentes
            isProtectedRoute,
            isPublicRoute,
            updateUserModules,
            upgradeUserPlan,
            migrateFromLegacy,
            isLegacyUser: user ? checkIfLegacyUser(user) : false,
            userHasAccess: user ? userHasAccess(user) : false,
            userHasValidData: user ? userHasValidData(user) : false
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);