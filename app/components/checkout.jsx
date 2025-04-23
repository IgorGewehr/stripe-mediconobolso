"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Box, CircularProgress, Button, Typography } from '@mui/material';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import firebaseService from '../../lib/firebaseService';
import { fetchClientSecret } from '../actions/stripe';
import PlanCard from './organismsComponents/planSelector';
import { useAuth } from "./authProvider";
import { useRouter } from 'next/navigation';
import { useResponsiveScale } from './useScale';
import Script from "next/script"; // Importação do hook de escala

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent({ selectedPlan, onPlanChange }) {
    // Obtém o usuário autenticado e a função de logout do AuthProvider
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Obter a escala responsiva
    const { scaleStyle, scale } = useResponsiveScale();

    // Função de logout que usa o logout do AuthProvider
    const handleLogout = async () => {
        try {
            await logout(); // Usa a função de logout do AuthProvider que já faz o redirecionamento
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            // Caso falhe, tenta redirecionar manualmente
            router.push('/');
        }
    };

    // Carrega dados adicionais do usuário (nome, email, etc.) do Firestore
    useEffect(() => {
        async function loadUserInfo() {
            // Verifica primeiro se o usuário foi carregado pelo provider e não está mais em loading
            if (!loading) {
                if (!user) {
                    // Se não há usuário após carregar, redireciona para login
                    router.push('/');
                    return;
                }

                try {
                    // Garantindo que temos um UID válido
                    if (user.uid) {
                        const data = await firebaseService.getUserData(user.uid);
                        if (data) {
                            setUserInfo(data);
                        } else {
                            setError("Não foi possível carregar os dados do usuário");
                        }
                    } else {
                        setError("UID do usuário não disponível");
                    }
                } catch (err) {
                    console.error("Erro ao carregar dados do usuário:", err);
                    setError("Erro ao carregar dados do usuário");
                } finally {
                    setIsLoading(false);
                }
            }
        }

        loadUserInfo();
    }, [user, loading, router]);

    // Exibe um loading enquanto autenticação e dados do usuário estão carregando
    if (loading || isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <CircularProgress color="primary" />
                <Typography sx={{ mt: 2 }}>Carregando informações...</Typography>
            </Box>
        );
    }

    // Mostra erro se algo deu errado
    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Typography color="error">{error}</Typography>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => router.push('/')}
                >
                    Voltar para Login
                </Button>
            </Box>
        );
    }

    // Se não há usuário ou userInfo, não prossegue
    if (!user || !userInfo) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Button
                    variant="contained"
                    onClick={() => router.push('/')}
                >
                    Fazer Login
                </Button>
            </Box>
        );
    }

    return (
        <>
            {/*** Meta Pixel Events ***/}
            {/* Initiate Checkout */}
            <Script id="fb-init-checkout" strategy="afterInteractive">
                {`fbq('track', 'InitiateCheckout');`}
            </Script>
            <noscript
                dangerouslySetInnerHTML={{
                    __html: `<img height="1" width="1" style="display:none"
                    src="https://www.facebook.com/tr?id=1033180232110037&ev=InitiateCheckout&noscript=1"/>`
                }}
            />

            {/* Lead */}
            <Script id="fb-lead-event" strategy="afterInteractive">
                {`fbq('track', 'Lead');`}
            </Script>
            <noscript
                dangerouslySetInnerHTML={{
                    __html: `<img height="1" width="1" style="display:none"
                    src="https://www.facebook.com/tr?id=1033180232110037&ev=Lead&noscript=1"/>`
                }}
            />

            {/* Purchase */}
            <Script id="fb-purchase-event" strategy="afterInteractive">
                {`fbq('track', 'Purchase');`}
            </Script>
            <noscript
                dangerouslySetInnerHTML={{
                    __html: `<img height="1" width="1" style="display:none"
                    src="https://www.facebook.com/tr?id=1033180232110037&ev=Purchase&noscript=1"/>`
                }}
            />

            {/*** Google Ads Conversion Snippets ***/}
            {/* Compra (sem valor) */}
            <Script id="gtag-purchase" strategy="afterInteractive">
                {`gtag('event', 'conversion', {
             'send_to': 'AW-17010595542/8yPWCPKzsLkaENatpK8_'
           });`}
            </Script>

            {/* Initiate Checkout (com valor e moeda) */}
            <Script id="gtag-initiate" strategy="afterInteractive">
                {`gtag('event', 'conversion', {
             'send_to': 'AW-17010595542/Jvp_CPWzsLkaENatpK8_',
             'value': 1.0,
             'currency': 'BRL'
           });`}
            </Script>

            {/* Lead (com valor e moeda) */}
            <Script id="gtag-lead" strategy="afterInteractive">
                {`gtag('event', 'conversion', {
             'send_to': 'AW-17010595542/ZmDLCPizsLkaENatpK8_',
             'value': 1.0,
             'currency': 'BRL'
           });`}
            </Script>

            <img
                src="https://mediconobolso.online/split-test-for-elementor/v1/tests/1/track-conversion/"
                alt=""
                width={1}
                height={1}
                style={{ display: 'none' }}
            />

        <Box sx={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden' // Prevenir overflow
        }}>
            {/* Logo e botão de logout */}
            <Box sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                display: 'flex',
                alignItems: 'center',
                zIndex: 10
            }}>
                {/* Botão de logout */}
                <Button
                    onClick={handleLogout}
                    variant="text"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        fontFamily: 'Gellix, sans-serif',
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'none',
                        ml: 3,
                        px: 2,
                        py: 0.5,
                        borderRadius: '18px',
                        color: '#DB4437',
                        backgroundColor: 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(219, 68, 55, 0.08)',
                        },
                    }}
                    startIcon={
                        <Box
                            component="img"
                            src="/logout.svg"
                            alt="Logout"
                            sx={{ width: '18px', height: '18px', mr: 0.8 }}
                        />
                    }
                >
                    Sair
                </Button>
            </Box>

            {/* Painel Esquerdo: Exibe o PlanCard com o toggle para mudar o plano */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: '40px',
                    overflow: 'hidden' // Prevenir overflow
                }}
            >
                {/* Container com escala para o PlanCard */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    ...scaleStyle // Aplicar a escala aqui
                }}>
                    <PlanCard selectedPlan={selectedPlan} onPlanChange={onPlanChange} />
                </Box>
            </Box>

            {/* Painel Direito: Exibe o checkout embutido do Stripe */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    height: '100vh',
                    overflow: 'hidden', // Prevenir overflow horizontal
                    p: 0, // Remover padding para aplicar no container com escala
                }}
            >
                {/* Container com escala para o Checkout */}
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    overflowY: 'auto', // Manter rolagem vertical
                    p: 2,
                    ...scaleStyle // Aplicar a escala aqui
                }}>
                    {/* Verificação explícita de UID antes de mostrar o checkout */}
                    {user && user.uid && userInfo && userInfo.email ? (
                        <EmbeddedCheckoutProvider
                            key={selectedPlan} // Quando o plano muda, forçamos a remount do checkout
                            stripe={stripePromise}
                            options={{
                                fetchClientSecret: async () => {
                                    try {
                                        // Log para depuração
                                        console.log(`Iniciando checkout para UID: ${user.uid}, Email: ${userInfo.email}`);

                                        return await fetchClientSecret({
                                            plan: selectedPlan,
                                            uid: user.uid,
                                            email: userInfo.email,
                                        });
                                    } catch (err) {
                                        console.error("Erro ao buscar client secret:", err);
                                        setError(`Erro ao iniciar checkout do Stripe: ${err.message}`);
                                        return null;
                                    }
                                },
                            }}
                        >
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            p: 3
                        }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Não foi possível iniciar o checkout
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Informações do usuário incompletas: {!user ? "Usuário não autenticado" : !user.uid ? "UID não encontrado" : "Email não encontrado"}
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => router.push('/')}
                            >
                                Voltar para página inicial
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
        </>
    );
}

export default function Checkout() {
    // Estado para controlar o plano selecionado (inicialmente mensal)
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress color="primary" />
                </Box>
            }
        >
            <CheckoutContent selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />
        </Suspense>
    );
}