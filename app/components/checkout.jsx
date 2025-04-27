"use client";

import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import CustomCheckout from './customCheckout'; // Importe o novo componente
import { useAuth } from "./authProvider";
import Analytics from "./organismsComponents/analytics";

function CheckoutContent() {
    // Precisamos apenas do auth para manter o trial offer
    const { hasFreeTrialOffer } = useAuth();

    return (
        <>
            <Analytics/>

            {/* Pixel de conversão - mantido do código original */}
            <img
                src="https://mediconobolso.online/split-test-for-elementor/v1/tests/1/track-conversion/"
                alt=""
                width={1}
                height={1}
                style={{ display: 'none' }}
            />

            {/* Nosso novo componente de checkout, passando o hasFreeTrialOffer */}
            <CustomCheckout hasFreeTrialOffer={hasFreeTrialOffer} />
        </>
    );
}

export default function Checkout() {
    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress color="primary" />
                </Box>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}