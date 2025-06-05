"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import firebaseService from "../../lib/firebaseService";
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

    // Função auxiliar para extrair referência de influenciador do pathname
    const extractReferralSource = (path) => {
        // Padrão: /checkout/INFLUENCER/ ou /free/INFLUENCER/
        if (path.startsWith('/checkout/') || path.startsWith('/free/')) {
            const parts = path.split('/').filter(Boolean);

            // Se for /checkout/pv1/INFLUENCER/ ou /free/pv1/INFLUENCER/
            if (parts.length === 3 && parts[1] === 'pv1') {
                return parts[2];
            }

            // Se for /checkout/INFLUENCER/ ou /free/INFLUENCER/ (mas não pv1)
            if (parts.length === 2 && parts[1] !== 'pv1') {
                return parts[1];
            }
        }

        return null;
    };

    // Detecção de rotas especiais e redirecionamentos - EXECUTADO PRIMEIRO
    useEffect(() => {
        console.log('🔍 Processing route:', pathname);
        let shouldSetFreeTrial = false;
        let referrer = null;
        let shouldRedirect = false;
        let redirectTarget = null;

        // Caso especial: rota /pv1 simples - redirecionar para /checkout com trial
        if (pathname === '/pv1') {
            console.log('✅ PV1 route detected, setting free trial offer and redirecting');
            shouldSetFreeTrial = true;
            shouldRedirect = true;
            redirectTarget = '/checkout';
        }
        // Para rotas com prefixo /checkout/
        else if (pathname.startsWith('/checkout/')) {
            // Se não for exatamente /checkout
            if (pathname !== '/checkout') {
                shouldRedirect = true;
                redirectTarget = '/checkout';

                // CUIDADO! Ativar trial APENAS se o caminho for /checkout/pv1 ou iniciar com /checkout/pv1/
                if (pathname === '/checkout/pv1' || pathname.startsWith('/checkout/pv1/')) {
                    console.log('✅ PV1 trial path detected, offering free trial');
                    shouldSetFreeTrial = true;
                } else {
                    console.log('🔗 Non-trial checkout path detected');
                }

                // Extrair referência do influenciador
                referrer = extractReferralSource(pathname);
                if (referrer) {
                    console.log(`🎯 Referral source detected: ${referrer}`);
                }
            }
        }
        // Para rotas com prefixo /free/
        else if (pathname.startsWith('/free/')) {
            // Se não for exatamente /free
            if (pathname !== '/free') {
                shouldRedirect = true;
                redirectTarget = '/free';

                // Extrair referência do influenciador
                referrer = extractReferralSource(pathname);
                if (referrer) {
                    console.log(`🎯 Referral source detected for free signup: ${referrer}`);
                }
            }
        }

        // ⚠️ IMPORTANTE: Definir referralSource ANTES do redirecionamento
        if (referrer) {
            console.log(`💾 Saving referral source to localStorage: ${referrer}`);
            localStorage.setItem('referralSource', referrer);
            setReferralSource(referrer);
        }
        // Verificar localStorage para referralSource se não foi encontrado na URL
        else if (!referralSource) {
            const storedReferrer = localStorage.getItem('referralSource');
            if (storedReferrer) {
                console.log(`📦 Referral source found in localStorage: ${storedReferrer}`);
                setReferralSource(storedReferrer);
            }
        }

        // Configurar trial se necessário
        if (shouldSetFreeTrial) {
            console.log('🆓 Setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        }

        // Redirecionar para a rota principal se necessário
        if (shouldRedirect && redirectTarget) {
            console.log(`🔄 Scheduling redirect from ${pathname} to ${redirectTarget}`);
            // Delay pequeno para garantir que o referralSource foi salvo
            setTimeout(() => {
                if (pathname !== redirectTarget) {
                    console.log(`➡️ Redirecting to ${redirectTarget}...`);
                    router.replace(redirectTarget);
                }
            }, 150);
        }
    }, [pathname, router]); // Removido referralSource da dependência para evitar loops

    // Inicializar referralSource do localStorage na montagem
    useEffect(() => {
        const storedReferrer = localStorage.getItem('referralSource');
        if (storedReferrer && !referralSource) {
            console.log(`🔧 Initializing referral source from localStorage: ${storedReferrer}`);
            setReferralSource(storedReferrer);
        }
    }, []);

    // Handle other trial parameters and localStorage
    useEffect(() => {
        // Check for dct parameter
        const dctParam = searchParams.get('dct');
        if (dctParam === '1') {
            console.log('🎁 DCT parameter detected, setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        } else if (!hasFreeTrialOffer) {
            // Check localStorage as fallback for free trial
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true') {
                console.log('🎁 Free trial found in localStorage');
                setHasFreeTrialOffer(true);
            }
        }
    }, [searchParams, hasFreeTrialOffer]);

    // Handle authentication state
    useEffect(() => {
        console.log('🔐 Authentication state check running, pathname:', pathname);
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    const userData = await firebaseService.getUserData(authUser.uid);
                    setUser({ uid: authUser.uid, ...userData });

                    // Se o usuário tem plano ou é gratuito E está em páginas públicas, redirecionar para /app
                    if ((userData.assinouPlano || userData.gratuito) &&
                        ['/', '/checkout', '/free', '/login'].includes(pathname) &&
                        searchParams.get('dct') !== '1') { // Don't redirect if dct param exists

                        console.log('👤 User já tem acesso, redirecionando para /app');
                        router.push('/app');
                    }
                    // Se não tem acesso e tenta acessar áreas protegidas, redirecionar para checkout
                    else if (!userData.assinouPlano && !userData.gratuito &&
                        (pathname.startsWith('/app') || pathname.startsWith('/mobile'))) {
                        console.log('❌ User sem acesso tentando acessar área protegida, redirecionando para /checkout');
                        router.push('/checkout');
                    }
                } catch (error) {
                    console.error("❌ Erro ao buscar dados do usuário:", error);
                    setUser({ uid: authUser.uid });
                }
            } else {
                setUser(null);
                // Redirect to login ONLY if trying to access protected routes
                if (pathname.startsWith('/app') || pathname.startsWith('/mobile')) {
                    console.log('🚫 Unauthenticated user trying to access protected route, redirecting to login');
                    router.push('/');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router, searchParams]);

    // Verificação de tamanho de tela quando estiver em /app (SÓ EXECUTA APÓS AUTENTICAÇÃO)
    useEffect(() => {
        // Só executar se usuário está autenticado, tem acesso e está em /app
        if (!user || loading || pathname !== '/app') return;
        if (!user.assinouPlano && !user.gratuito) return;

        const checkScreenSize = () => {
            if (typeof window !== "undefined" && window.innerWidth < 900) {
                console.log(`📱 Tela pequena detectada (${window.innerWidth}px), redirecionando para /mobile`);
                router.push("/mobile");
            }
        };

        // Verificar imediatamente
        checkScreenSize();

        // Verificar quando a tela for redimensionada
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, [user, loading, pathname, router]);

    const logout = async () => {
        try {
            await signOut(firebaseService.auth);
            // Limpar referralSource ao fazer logout (opcional)
            // localStorage.removeItem('referralSource');
            router.push('/');
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
        }
    };

    // Log do estado atual para debug
    useEffect(() => {
        if (referralSource) {
            console.log(`🎯 Current referral source: ${referralSource}`);
        }
    }, [referralSource]);

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
            logout,
            hasFreeTrialOffer,
            referralSource,
            isProtectedRoute,
            isPublicRoute
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);