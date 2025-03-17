"use client";

import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AuthForms from './organismsComponents/authForms';
import ComingSoon from './organismsComponents/comingSoon';
import { useAuth } from './authProvider';
import { useRouter } from 'next/navigation';

const AuthTemplate = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            if (!user.assinouPlano) {
                router.push("/checkout");
            } else {
                router.push("/app");
            }
        }
    }, [user, router]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    let content;
    if (!user) {
        content = <AuthForms />;
    } else if (user && user.assinouPlano) {
        content = <ComingSoon />;
    }

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                m: 0,
                p: 0,
            }}
        >
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

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    m: 0,
                    p: 0,
                    marginLeft: '40px',
                }}
            >
                {content}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    height: '100vh',
                    m: 0,
                    p: 0,
                    backgroundImage: 'url("/fundo.jpg")',
                    backgroundSize: 'contain',
                    backgroundPosition: 'right bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            />
        </Box>
    );
};

export default AuthTemplate;
