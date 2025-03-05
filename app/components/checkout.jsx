"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import firebaseService from '../../lib/firebaseService';
import { fetchClientSecret } from '../actions/stripe';
import PlanCard from './planSelector';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent({ selectedPlan, onPlanChange }) {
    // Obtém o usuário autenticado
    const currentUser = firebaseService.auth.currentUser;
    const uid = currentUser ? currentUser.uid : '';

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
            <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    width: 40,
                    height: 'auto',
                    zIndex: 10,
                }}
            />

            {/* Painel Esquerdo: Exibe o PlanCard com o toggle para mudar o plano */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
