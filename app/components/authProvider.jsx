// authProvider.js - Com lógica aprimorada para teste gratuito
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
        // Verificar se o usuário chegou via rota especial com oferta de teste
        const checkTrialOffer = () => {
            // Verifica se a URL atual ou anterior contém /pv1
            if (pathname === '/pv1' || pathname === '/checkout/pv1' || pathname.includes('/pv1')) {
                localStorage.setItem('hasFreeTrialOffer', 'true');
                setHasFreeTrialOffer(true);

                // Se estiver na rota /pv1, redireciona para checkout preservando a oferta
                if (pathname === '/pv1') {
                    router.push('/checkout');
                }
                return true;
            }

            // Verifica se tem o parâmetro dct na URL
            const dctParam = searchParams.get('dct');
            if (dctParam === '1') {
                localStorage.setItem('hasFreeTrialOffer', 'true');
                setHasFreeTrialOffer(true);
                return true;
            }

            // Verifica se já tem a informação no localStorage
            const storedTrialOffer = localStorage.getItem('hasFreeTrialOffer');
            if (storedTrialOffer === 'true') {
                setHasFreeTrialOffer(true);
                return true;
            }

            return false;
        };

        checkTrialOffer();
    }, [pathname, searchParams, router]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (authUser) => {
            if (authUser) {
                try {
                    const userData = await firebaseService.getUserData(authUser.uid);
                    setUser({ uid: authUser.uid, ...userData });

                    // Verificar se o usuário já tem assinatura e está tentando acessar o checkout
                    if (userData && userData.assinouPlano && pathname === '/checkout') {
                        // Se já tem assinatura, redireciona para o app
                        router.push('/app');
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    setUser({ uid: authUser.uid });
                }
            } else {
                setUser(null);
                // Redireciona para login APENAS se tentar acessar rotas protegidas da aplicação (/app)
                // NÃO redireciona se tentar acessar /checkout
                if (pathname.startsWith('/app')) {
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