    // authProvider.js - Versão melhorada
    "use client";
    import { createContext, useContext, useState, useEffect } from "react";
    import { onAuthStateChanged, signOut } from "firebase/auth";
    import firebaseService from "../../lib/firebaseService"; // ajuste o caminho conforme necessário
    import { useRouter, usePathname } from "next/navigation";

    const AuthContext = createContext();

    export const AuthProvider = ({ children }) => {
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true);
        const router = useRouter();
        const pathname = usePathname();

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
            <AuthContext.Provider value={{ user, loading, logout }}>
                {children}
            </AuthContext.Provider>
        );
    };

    export const useAuth = () => useContext(AuthContext);