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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent({ selectedPlan, onPlanChange }) {
    // Obtém o usuário autenticado e a função de logout do AuthProvider
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <Box sx={{ display: 'flex', width: '100vw', height: '100vh' }}>
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
                    marginLeft: '40px'
                }}
            >
                <PlanCard selectedPlan={selectedPlan} onPlanChange={onPlanChange} />
            </Box>

            {/* Painel Direito: Exibe o checkout embutido do Stripe */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    height: '100vh',
                    overflowY: 'auto',
                    p: 2,
                }}
            >
                <EmbeddedCheckoutProvider
                    key={selectedPlan} // Quando o plano muda, forçamos a remount do checkout
                    stripe={stripePromise}
                    options={{
                        fetchClientSecret: async () => {
                            try {
                                return await fetchClientSecret({
                                    plan: selectedPlan,
                                    uid: user.uid,
                                    email: userInfo.email,
                                });
                            } catch (err) {
                                console.error("Erro ao buscar client secret:", err);
                                setError("Erro ao iniciar checkout do Stripe");
                                return null;
                            }
                        },
                    }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            </Box>
        </Box>
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