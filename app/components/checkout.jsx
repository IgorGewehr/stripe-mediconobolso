"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Box, CircularProgress, Button } from '@mui/material';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import firebaseService from '../../lib/firebaseService';
import { fetchClientSecret } from '../actions/stripe';
import PlanCard from './organismsComponents/planSelector';
import { useAuth } from "./authProvider";
import { useRouter } from 'next/navigation';
import {signOut} from "firebase/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent({ selectedPlan, onPlanChange }) {
    // Obtém o usuário autenticado
    const auth = useAuth();
    const currentUser = auth?.user;
    const uid = currentUser ? currentUser.uid : '';
    const router = useRouter();

    // Função de logout
    const handleLogout = async () => {
        try {
            await signOut(firebaseService.auth)
            router.push('/'); // Redirecionar para a página inicial após logout
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // Carrega dados adicionais do usuário (nome, email, etc.) do Firestore
    const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
        async function loadUserInfo() {
            if (uid) {
                const data = await firebaseService.getUserData(uid);
                setUserInfo(data);
            }
        }
        loadUserInfo();
    }, [uid]);

    // Enquanto os dados do usuário não são carregados, exibe um spinner
    if (!userInfo) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
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
                        fetchClientSecret: () =>
                            fetchClientSecret({
                                plan: selectedPlan,
                                uid,
                                email: userInfo.email,
                            }),
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