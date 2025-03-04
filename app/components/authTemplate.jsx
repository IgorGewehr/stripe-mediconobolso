"use client";

import React from 'react';
import { Box } from '@mui/material';
import AuthForms from './authForms';
import PlanCard from "./planSelector";

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
            {/* Logo reposicionada: afastada e menor */}
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

            {/* Coluna esquerda: AuthForms centralizado */}
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
                <PlanCard />
            </Box>

            {/* Coluna direita: imagem de fundo */}
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
