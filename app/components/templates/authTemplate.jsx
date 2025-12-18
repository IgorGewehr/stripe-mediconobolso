"use client";

import React, { useEffect } from 'react';
import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import AuthForms from '../features/auth/AuthForms';
import { useAuth } from '../providers/authProvider';
import { useRouter } from 'next/navigation';
import { useResponsiveScale } from '../hooks/useScale';

const AuthTemplate = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Obter a escala responsiva
    const { scaleStyle } = useResponsiveScale();

    // Função para lidar com o clique na logo
    const handleLogoClick = () => {
        window.open('https://mediconobolso.com', '_blank');
    };

    // Enquanto o contexto de autenticação estiver carregando ou se usuário está logado
    if (loading || user) {
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
                backgroundColor: { xs: '#fafafa', md: 'white' },
            }}
        >
            {/* Logo apenas no desktop - no mobile está dentro do AuthForms */}
            {!isMobile && (
                <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    onClick={handleLogoClick}
                    sx={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        width: 40,
                        height: 'auto',
                        zIndex: 10,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                            transform: 'scale(1.05)'
                        }
                    }}
                />
            )}

            {/* Mobile: Container de altura total com centralização perfeita */}
            {isMobile ? (
                <Box
                    sx={{
                        flex: 1,
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        width: '100%'
                    }}
                >
                    <Box sx={{ width: '100%', maxWidth: 400 }}>
                        <AuthForms />
                    </Box>
                </Box>
            ) : (
                /* Desktop: Layout original */
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        m: 0,
                        p: 0,
                        marginLeft: '40px',
                        width: '100%',
                        overflowX: 'hidden',
                    }}
                >
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...scaleStyle
                    }}>
                        <AuthForms />
                    </Box>
                </Box>
            )}

            {/* Imagem de fundo apenas no desktop */}
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