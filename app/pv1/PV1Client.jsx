"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function PV1Client() {
    const router = useRouter();

    useEffect(() => {
        localStorage.setItem('hasFreeTrialOffer', 'true');
        router.push('/');
    }, [router]);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100%',
                backgroundColor: 'white',
            }}
        >
            <CircularProgress color="primary" />
        </Box>
    );
}
