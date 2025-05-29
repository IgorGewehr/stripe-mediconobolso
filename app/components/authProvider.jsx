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
        // Padrão: /checkout/INFLUENCER/
        if (path.startsWith('/checkout/')) {
            const parts = path.split('/').filter(Boolean);

            // Se for /checkout/pv1/INFLUENCER/
            if (parts.length === 3 && parts[1] === 'pv1') {
                return parts[2];
            }

            // Se for /checkout/INFLUENCER/ (mas não /checkout/pv1/)
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

        // Caso especial: rota /pv1 simples - redirecionar para /checkout com trial
        if (pathname === '/pv1') {
            console.log('✅ PV1 route detected, setting free trial offer and redirecting');
            shouldSetFreeTrial = true;
            shouldRedirect = true;
        }
        // Para rotas com prefixo /checkout/
        else if (pathname.startsWith('/checkout/')) {
            // Se não for exatamente /checkout
            if (pathname !== '/checkout') {
                shouldRedirect = true;

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

        // Redirecionar para a rota principal de checkout se necessário
        if (shouldRedirect) {
            console.log(`🔄 Scheduling redirect from ${pathname} to /checkout`);
            // Delay pequeno para garantir que o referralSource foi salvo
            setTimeout(() => {
                if (pathname !== '/checkout') {
                    console.log('➡️ Redirecting to main checkout page...');
                    router.replace('/checkout');
                }
            }, 150); // Aumentei o delay para 150ms
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

                    // Only redirect if already has plan and on checkout page
                    if (userData && userData.assinouPlano && pathname === '/checkout' &&
                        searchParams.get('dct') !== '1') { // Don't redirect if dct param exists

                        console.log('👤 User already has plan, redirecting to app');
                        router.push('/app');
                    }
                } catch (error) {
                    console.error("❌ Erro ao buscar dados do usuário:", error);
                    setUser({ uid: authUser.uid });
                }
            } else {
                setUser(null);
                // Redirect to login ONLY if trying to access protected routes
                if (pathname.startsWith('/app')) {
                    console.log('🚫 Unauthenticated user trying to access protected route, redirecting to login');
                    router.push('/');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router, searchParams]);

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

    return (
        <AuthContext.Provider value={{ user, loading, logout, hasFreeTrialOffer, referralSource }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);