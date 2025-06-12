"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import firebaseService from "../../lib/firebaseService";
import moduleService from "../../lib/moduleService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasFreeTrialOffer, setHasFreeTrialOffer] = useState(false);
    const [referralSource, setReferralSource] = useState(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isFreeUser = Boolean(user?.gratuito);

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

    // 🔧 HANDLE AUTHENTICATION STATE - TOTALMENTE CORRIGIDO
    useEffect(() => {
        console.log('🔐 Authentication state check running, pathname:', pathname);
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    console.log('👤 Authenticated user detected:', authUser.uid);
                    let userData = null;

                    // 🆕 TENTAR BUSCAR DADOS DO USUÁRIO COM TRATAMENTO DE ERRO
                    try {
                        userData = await firebaseService.getUserData(authUser.uid);
                        console.log('✅ User data found in Firestore');
                    } catch (error) {
                        if (error.message === "Usuário não encontrado") {
                            console.log('🔧 User exists in Auth but not in Firestore - creating orphan user data');
                            userData = await createOrphanUserData(authUser);
                        } else {
                            console.error('❌ Unexpected error fetching user data:', error);
                            throw error;
                        }
                    }

                    // Verificar se é legacy antes de migrar
                    const isLegacy = checkIfLegacyUser(userData);

                    if (isLegacy) {
                        console.log('👴 Usuário LEGACY - Mantendo acesso total SEM migração');
                    } else {
                        userData = await migrateUserModulesIfNeeded(userData, authUser.uid);
                    }

                    // 🆕 VALIDAÇÃO ADICIONAL DOS DADOS
                    if (!userHasValidData(userData)) {
                        console.warn('⚠️ User has invalid data structure:', userData);
                        // Para usuários com dados inválidos, podemos tentar recriar os dados básicos
                        if (!userData.email) {
                            userData.email = authUser.email;
                        }
                        if (!userData.hasOwnProperty('gratuito') && !userData.hasOwnProperty('assinouPlano')) {
                            userData.gratuito = true;
                            userData.planType = 'free';
                            await firebaseService.editUserData(authUser.uid, userData);
                        }
                    }

                    setUser({ uid: authUser.uid, ...userData });

                    // 🔧 LÓGICA DE REDIRECIONAMENTO MELHORADA
                    console.log('🔄 Checking redirect logic...');
                    console.log('- Current path:', pathname);
                    console.log('- User has valid data:', userHasValidData(userData));
                    console.log('- User has access:', userHasAccess(userData));
                    console.log('- Should redirect to app:', shouldRedirectToApp(userData, pathname));

                    // Pequeno delay para garantir que o estado foi atualizado
                    setTimeout(() => {
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
                    }, 200); // Aumentado para 200ms para garantir que o estado seja atualizado

                } catch (error) {
                    console.error("❌ Erro crítico ao processar usuário autenticado:", error);
                    // Em caso de erro crítico, fazer logout
                    await signOut(firebaseService.auth);
                    setUser(null);
                    router.push('/');
                }
            } else {
                console.log('🚫 No authenticated user');
                setUser(null);

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
    }, [pathname, router, searchParams, referralSource]);

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

    const logout = async () => {
        try {
            await signOut(firebaseService.auth);
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