"use client";

import React from 'react';
import { Box } from '@mui/material';
import AuthForms from './AuthForms';

const AuthTemplate = () => {
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
            {/* Logo no canto superior esquerdo */}
            <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 50, // tamanho reduzido
                    height: 'auto',
                    zIndex: 10,
                }}
            />

            {/* Coluna esquerda: AuthForms */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    m: 0,
                    p: 0,
                }}
            >
                <AuthForms />
            </Box>

            {/* Coluna direita: imagem de fundo ocupando exatamente metade da tela */}
            <Box
                sx={{
                    flex: 1,
                    height: '100vh',
                    m: 0,
                    p: 0,
                    backgroundImage: 'url("/fundo.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
        </Box>
    );
};

export default AuthTemplate;
