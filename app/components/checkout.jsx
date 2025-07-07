"use client";

import React, { Suspense, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import CustomCheckout from './customCheckout';
import { useAuth } from "./authProvider";
import Analytics from "./organismsComponents/analytics";

// Facebook Pixel implementation


// Loading component for Suspense fallback
function LoadingCheckout() {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#0F0F0F'
            }}
        >
            <CircularProgress sx={{ color: '#F9B934' }} size={60} />
        </Box>
    );
}

function CheckoutContent() {
    const { hasFreeTrialOffer } = useAuth();

    return (
        <>



            {/* Existing conversion pixel */}
            <img
                src="https://mediconobolso.online/split-test-for-elementor/v1/tests/1/track-conversion/"
                alt=""
                width={1}
                height={1}
                style={{ display: 'none' }}
            />

            {/* Checkout component */}
            <CustomCheckout hasFreeTrialOffer={hasFreeTrialOffer} />
        </>
    );
}

export default function Checkout() {
    return (
        <Suspense fallback={<LoadingCheckout />}>
            <CheckoutContent />
        </Suspense>
    );
}