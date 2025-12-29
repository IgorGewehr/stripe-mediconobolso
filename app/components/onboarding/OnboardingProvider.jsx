"use client";

/**
 * OnboardingProvider Component
 * Wrapper que renderiza o onboarding em uma posição fixa
 * Usa display flex com column-reverse para ancorar o conteúdo no bottom
 * e permitir que cresça para cima com scroll quando necessário
 */

import React from 'react';
import { Box } from '@mui/material';
import Onboarding from './Onboarding';
import { useAuth } from '../providers/authProvider';

export default function OnboardingProvider() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 72, md: 24 },
        right: { xs: 16, md: 24 },
        zIndex: 1100,
        maxWidth: { xs: 'calc(100% - 32px)', md: 400 },
        maxHeight: { xs: 'calc(100vh - 150px)', md: 'calc(100vh - 100px)' },
        display: 'flex',
        flexDirection: 'column',
        // Permite scroll quando conteúdo excede maxHeight
        overflowY: 'auto',
        overflowX: 'hidden',
        // Scrollbar styling
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <Onboarding userId={user?.uid} />
    </Box>
  );
}
