// AuthTemplate.jsx
"use client";

import React, { useEffect } from 'react';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import AuthForms from './organismsComponents/authForms';
import { useAuth } from './authProvider';
import { useRouter } from 'next/navigation';

const AuthTemplate = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (user) {
            if (!user.assinouPlano) {
                router.push("/checkout");
            } else {
                router.push("/app");
            }
        }
    }, [user, router]);

    // Enquanto o contexto de autenticação estiver carregando
    if (loading || user) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    width: '100%',
                }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // Se não houver usuário autenticado, exibe os formulários de autenticação
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                m: 0,
                p: 0,
                backgroundColor: { xs: '#f5f5f5', md: 'transparent' },
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
                    p: { xs: 2, sm: 3 },
                    marginLeft: { md: '40px' },
                    width: '100%',
                }}
            >
                <AuthForms />
            </Box>
            {!isMobile && (
                <Box
                    sx={{
                        flex: 1,
                        height: '100vh',
                        m: 0,
                        p: 0,
                        display: { xs: 'none', md: 'block' },
                        backgroundImage: 'url("/fundo.jpg")',
                        backgroundSize: 'contain',
                        backgroundPosition: 'right bottom',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            )}
        </Box>
    );
};

export default AuthTemplate;