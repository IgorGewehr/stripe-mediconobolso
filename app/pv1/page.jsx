// app/pv1/page.jsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function PV1Page() {
    const router = useRouter();

    useEffect(() => {
        // Armazene a flag de free trial e redirecione para home
        localStorage.setItem('hasFreeTrialOffer', 'true');
        router.push('/');
    }, [router]);

    // Exibir um loader enquanto redireciona
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