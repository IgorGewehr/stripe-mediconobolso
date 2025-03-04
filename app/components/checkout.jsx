'use client';

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import { fetchClientSecret } from '../actions/stripe';
import firebaseService from '../../lib/firebaseService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'monthly';
    // Recupera o usuário autenticado (supondo que ele já esteja logado)
    const currentUser = firebaseService.auth.currentUser;
    const uid = currentUser ? currentUser.uid : '';

    return (
        <div id="checkout">
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret: () => fetchClientSecret({ plan, uid }) }}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    );
}
