// app/not-found/NotFoundClient.jsx
'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function NotFoundClient() {
    return (
        <Box
            className="flex flex-col items-center justify-center min-h-screen"
            sx={{ textAlign: 'center', p: 2 }}
        >
            <Typography variant="h3" gutterBottom>
                Página não encontrada
            </Typography>
            <Typography variant="body1" paragraph>
                O conteúdo que você procura não está disponível.
            </Typography>
            <Button
                variant="contained"
                onClick={() => window.location.href = '/'}
            >
                Voltar para a página inicial
            </Button>
        </Box>
    );
}
