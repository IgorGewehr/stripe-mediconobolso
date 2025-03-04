'use client';

import React, { Suspense } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import { fetchClientSecret } from '../actions/stripe';
import firebaseService from '../../lib/firebaseService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutContent() {
    // useSearchParams precisa estar dentro de um Suspense boundary
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'monthly';

    // Obtém o usuário autenticado (assegure-se de que ele está logado antes de chegar aqui)
    const currentUser = firebaseService.auth.currentUser;
    const uid = currentUser ? currentUser.uid : '';

    return (
        <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret: () => fetchClientSecret({ plan, uid }) }}
        >
            <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
    );
}

export default function Checkout() {
    return (
        <div id="checkout">
            <Suspense fallback={<div>Carregando checkout...</div>}>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
