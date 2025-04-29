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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Handle free trial offer routes - this needs to run FIRST and separately
    useEffect(() => {
        // Check for trial offer routes immediately when component mounts
        if (pathname === '/pv1') {
            console.log('PV1 route detected, setting free trial offer and redirecting');
            // First set the trial offer flag
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);

            // Use setTimeout to ensure state is updated before navigation
            setTimeout(() => {
                router.push('/checkout');
            }, 100);
        } else if (pathname === '/checkout/pv1' || pathname.includes('/pv1')) {
            console.log('PV1 included in path, setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        }
    }, [pathname, router]); // This effect only depends on pathname and router

    // Handle other trials parameters and localStorage
    useEffect(() => {
        // Check for dct parameter
        const dctParam = searchParams.get('dct');
        if (dctParam === '1') {
            console.log('DCT parameter detected, setting free trial offer');
            localStorage.setItem('hasFreeTrialOffer', 'true');
            setHasFreeTrialOffer(true);
        } else {
            // Check localStorage as fallback
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true' && !hasFreeTrialOffer) {
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
                        !pathname.includes('/pv1') && // Don't redirect if on special route
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
        <AuthContext.Provider value={{ user, loading, logout, hasFreeTrialOffer }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);