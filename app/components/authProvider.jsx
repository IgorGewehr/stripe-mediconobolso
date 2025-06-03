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

    // Definir rotas protegidas e públicas
    const protectedRoutes = ["/app"];
    const publicRoutes = ["/", "/login", "/free", "/checkout"];

    // Auxiliar para extrair “referral” na URL
    const extractReferralSource = (path) => {
        if (path.startsWith("/checkout/") || path.startsWith("/free/")) {
            const parts = path.split("/").filter(Boolean);

            if (parts.length === 3 && parts[1] === "pv1") {
                return parts[2];
            }
            if (parts.length === 2 && parts[1] !== "pv1") {
                return parts[1];
            }
        }
        return null;
    };

    // Detecção de rotas especiais (checkout/free/pv1)
    useEffect(() => {
        console.log("🔍 Processing route:", pathname);
        let shouldSetFreeTrial = false;
        let referrer = null;
        let shouldRedirect = false;
        let redirectTarget = null;

        if (pathname === "/pv1") {
            shouldSetFreeTrial = true;
            shouldRedirect = true;
            redirectTarget = "/checkout";
        } else if (pathname.startsWith("/checkout/")) {
            if (pathname !== "/checkout") {
                shouldRedirect = true;
                redirectTarget = "/checkout";

                if (
                    pathname === "/checkout/pv1" ||
                    pathname.startsWith("/checkout/pv1/")
                ) {
                    shouldSetFreeTrial = true;
                } else {
                    console.log("🔗 Non-trial checkout path detected");
                }

                referrer = extractReferralSource(pathname);
                if (referrer) console.log(`🎯 Referral source: ${referrer}`);
            }
        } else if (pathname.startsWith("/free/")) {
            if (pathname !== "/free") {
                shouldRedirect = true;
                redirectTarget = "/free";

                referrer = extractReferralSource(pathname);
                if (referrer)
                    console.log(
                        `🎯 Referral source detected for free signup: ${referrer}`
                    );
            }
        }

        if (referrer) {
            localStorage.setItem("referralSource", referrer);
            setReferralSource(referrer);
        } else if (!referralSource) {
            const stored = localStorage.getItem("referralSource");
            if (stored) {
                setReferralSource(stored);
            }
        }

        if (shouldSetFreeTrial) {
            localStorage.setItem("hasFreeTrialOffer", "true");
            setHasFreeTrialOffer(true);
        }

        if (shouldRedirect && redirectTarget) {
            setTimeout(() => {
                if (pathname !== redirectTarget) {
                    router.replace(redirectTarget);
                }
            }, 150);
        }
    }, [pathname, router]);

    // Init referralSource do localStorage
    useEffect(() => {
        const stored = localStorage.getItem("referralSource");
        if (stored && !referralSource) {
            setReferralSource(stored);
        }
    }, []);

    // Handle parâmetro dct na URL
    useEffect(() => {
        const dctParam = searchParams.get("dct");
        if (dctParam === "1") {
            localStorage.setItem("hasFreeTrialOffer", "true");
            setHasFreeTrialOffer(true);
        } else if (!hasFreeTrialOffer) {
            const stored = localStorage.getItem("hasFreeTrialOffer");
            if (stored === "true") {
                setHasFreeTrialOffer(true);
            }
        }
    }, [searchParams, hasFreeTrialOffer]);

    // ========= AQUI ENTRA A DETECÇÃO DE “MOBILE” =========
    const isMobileDevice = () => {
        if (typeof navigator === "undefined") return false;
        return /Mobi|Android|iPhone/i.test(navigator.userAgent);
    };
    // =====================================================

    // Handle estado de autenticação
    useEffect(() => {
        console.log("🔐 Authentication state check running, pathname:", pathname);

        const unsubscribe = onAuthStateChanged(
            firebaseService.auth,
            async (authUser) => {
                if (authUser) {
                    try {
                        const userData = await firebaseService.getUserData(authUser.uid);
                        setUser({ uid: authUser.uid, ...userData });

                        // Se o usuário tiver plano ou for “gratuito”
                        if (userData.assinouPlano || userData.gratuito) {
                            // Não redirecionar se estiver em páginas públicas e dct=1
                            if (
                                ["/login", "/free", "/checkout"].includes(pathname) &&
                                searchParams.get("dct") !== "1"
                            ) {
                                const destino = isMobileDevice() ? "/mobile" : "/app"; // 👉 decide rota conforme dispositivo
                                console.log(
                                    `👤 User já tem acesso, redirecionando para ${destino}`
                                );
                                router.push(destino);
                            }
                        }
                        // Se não tem plano nem gratuito e tenta /app, mandar para /checkout
                        else if (
                            !userData.assinouPlano &&
                            !userData.gratuito &&
                            pathname.startsWith("/app")
                        ) {
                            router.push("/checkout");
                        }
                    } catch (error) {
                        console.error("❌ Erro ao buscar dados do usuário:", error);
                        setUser({ uid: authUser.uid });
                    }
                } else {
                    setUser(null);
                    // Se não autenticado e acessar rota protegida, manda pro login
                    if (
                        protectedRoutes.some((route) => pathname.startsWith(route))
                    ) {
                        router.push("/login");
                    }
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [pathname, router, searchParams]);

    const logout = async () => {
        try {
            await signOut(firebaseService.auth);
            router.push("/login");
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
        }
    };

    // Debug referralSource
    useEffect(() => {
        if (referralSource) {
            console.log(`🎯 Current referral source: ${referralSource}`);
        }
    }, [referralSource]);

    const isProtectedRoute = (path) => {
        return protectedRoutes.some((route) => path.startsWith(route));
    };

    const isPublicRoute = (path) => {
        return (
            publicRoutes.some((route) => path === route || path.startsWith(route + "/"))
        );
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                logout,
                hasFreeTrialOffer,
                referralSource,
                isProtectedRoute,
                isPublicRoute,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
