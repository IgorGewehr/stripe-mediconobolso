"use client";

import React, { useState, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import firebaseService from '../../lib/firebaseService';
import { fetchClientSecret } from '../actions/stripe';
import PlanCard from './planSelector';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent({ selectedPlan }) {
    // Recupera o usuário autenticado para enviar o uid para o checkout
    const currentUser = firebaseService.auth.currentUser;
    const uid = currentUser ? currentUser.uid : '';

    return (
        <Box sx={{ display: 'flex', width: '100vw', height: '100vh' }}>
            {/* Painel Esquerdo: Informações do plano */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <PlanCard selectedPlan={selectedPlan} onPlanChange={() => {}} />
            </Box>

            {/* Painel Direito: Checkout do Stripe */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <EmbeddedCheckoutProvider
                    key={selectedPlan} // força a remount quando o plano muda
                    stripe={stripePromise}
                    options={{ fetchClientSecret: () => fetchClientSecret({ plan: selectedPlan, uid }) }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            </Box>
        </Box>
    );
}

export default function Checkout() {
    // Estado para controlar o plano (inicialmente mensal)
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress color="primary" />
                </Box>
            }
        >
            <CheckoutContent selectedPlan={selectedPlan} />
        </Suspense>
    );
}
