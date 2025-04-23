// authProvider.js - Com detecção de parâmetro para trial
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

    useEffect(() => {
        // Verificar se o usuário chegou via rota especial
        const checkSpecialRoute = () => {
            // Verifica se veio pela rota /pv1
            if (pathname === '/pv1') {
                localStorage.setItem('hasFreeTrialOffer', 'true');
                setHasFreeTrialOffer(true);
                // Redireciona para a home mantendo a informação do trial
                router.push('/');
                return;
            }

            // Verifica se tem o parâmetro dct na URL
            const dctParam = searchParams.get('dct');
            if (dctParam === '1') {
                localStorage.setItem('hasFreeTrialOffer', 'true');
                setHasFreeTrialOffer(true);
                return;
            }

            // Verifica se já tem a informação no localStorage
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true') {
                setHasFreeTrialOffer(true);
            }
        };

        checkSpecialRoute();
    }, [pathname, searchParams, router]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    const userData = await firebaseService.getUserData(authUser.uid);
                    setUser({ uid: authUser.uid, ...userData });
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    setUser({ uid: authUser.uid });
                }
            } else {
                setUser(null);
                // Redireciona para login se tentar acessar rotas protegidas
                if (pathname.startsWith('/app') || pathname === '/checkout') {
                    router.push('/');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

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
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);