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
        // Primeira verificação: padrão /checkout/INFLUENCER/
        const checkoutInfluencerRegex = /\/checkout\/([^\/]+)\/?$/;
        const checkoutMatch = path.match(checkoutInfluencerRegex);

        if (checkoutMatch && checkoutMatch[1] && checkoutMatch[1] !== 'pv1') {
            return checkoutMatch[1];
        }

        // Segunda verificação: padrão /checkout/pv1/INFLUENCER/
        const checkoutPv1InfluencerRegex = /\/checkout\/pv1\/([^\/]+)\/?$/;
        const pv1Match = path.match(checkoutPv1InfluencerRegex);

        if (pv1Match && pv1Match[1]) {
            return pv1Match[1];
        }

        return null;
    };

    // Handle free trial offer routes and referral sources - this needs to run FIRST
    useEffect(() => {
        console.log('Processing route:', pathname);
        let shouldSetFreeTrial = false;
        let referrer = null;
        let shouldRedirect = false;

        // Detecção da rota /pv1 - redirecionar para /checkout
        if (pathname === '/pv1') {
            console.log('PV1 route detected, setting free trial offer and redirecting');
            shouldSetFreeTrial = true;
            shouldRedirect = true;
        }
        // Detecção das rotas que iniciam com /checkout/
        else if (pathname.startsWith('/checkout/')) {
            // Se não for a rota principal /checkout
            if (pathname !== '/checkout') {
                shouldRedirect = true;

                // Verificar se é uma rota de pv1 - DEVE ser especificamente /checkout/pv1 ou iniciar com /checkout/pv1/
                if (pathname === '/checkout/pv1' || pathname.startsWith('/checkout/pv1/')) {
                    console.log('PV1 route detected as trial offer path');
                    shouldSetFreeTrial = true;
                } else {
                    console.log('Non-trial checkout route detected');
                }

                // Extrair referência do influenciador
                referrer = extractReferralSource(pathname);
                if (referrer) {
                    console.log(`Referral source detected: ${referrer}`);
                    localStorage.setItem('referralSource', referrer);
                    setReferralSource(referrer);
                }
            }
        }

        // Se não encontrou referência no URL, verificar localStorage
        if (!referrer && !referralSource) {
            const storedReferrer = localStorage.getItem('referralSource');
            if (storedReferrer) {
                console.log(`Referral source found in localStorage: ${storedReferrer}`);
                setReferralSource(storedReferrer);
            }
        }

        // Configurar trial se necessário
        if (shouldSetFreeTrial) {
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        }

        // Redirecionar se for uma rota especial
        if (shouldRedirect) {
            // Usar setTimeout para garantir que os estados sejam atualizados
            setTimeout(() => {
                // Evitar que o redirecionamento seja feito se o usuário já saiu da página
                if (pathname !== '/checkout') {
                    console.log('Redirecting to main checkout page...');
                    router.replace('/checkout');
                }
            }, 100);
        }
    }, [pathname, router, referralSource]);

    // Handle other trial parameters and localStorage
    useEffect(() => {
        // Check for dct parameter
        const dctParam = searchParams.get('dct');
        if (dctParam === '1') {
            console.log('DCT parameter detected, setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        } else if (!hasFreeTrialOffer) {
            // Check localStorage as fallback for free trial
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true') {
                console.log('Free trial found in localStorage');
                setHasFreeTrialOffer(true);
            }
        }
    }, [searchParams, hasFreeTrialOffer]);

    // Handle authentication state
    useEffect(() => {
        console.log('Authentication state check running, pathname:', pathname);
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    const userData = await firebaseService.getUserData(authUser.uid);
                    setUser({ uid: authUser.uid, ...userData });

                    // Only redirect if not on a special route
                    if (userData && userData.assinouPlano && pathname === '/checkout' &&
                        searchParams.get('dct') !== '1') { // Don't redirect if dct param exists

                        console.log('User already has plan, redirecting to app');
                        router.push('/app');
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    setUser({ uid: authUser.uid });
                }
            } else {
                setUser(null);
                // Redirect to login ONLY if trying to access protected routes
                if (pathname.startsWith('/app')) {
                    console.log('Unauthenticated user trying to access protected route, redirecting to login');
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
            router.push('/');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, hasFreeTrialOffer, referralSource }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);