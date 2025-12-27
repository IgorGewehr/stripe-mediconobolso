'use client';

/**
 * @fileoverview CRM Management Template
 * @description Main page template for CRM system (Customer Relationship Management)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { CRMDashboard } from '../features/crm';

// Theme colors
const themeColors = {
  primary: '#1852FE',
  primaryLight: '#E9EFFF',
  primaryDark: '#0A3AA8',
  success: '#0CAF60',
  error: '#FF4B55',
  warning: '#FFAB2B',
  textPrimary: '#111E5A',
  textSecondary: '#4B5574',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F4F7FF',
  borderColor: 'rgba(17, 30, 90, 0.1)',
};

/**
 * CRM Management Template
 */
export default function CRMTemplate() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: themeColors.backgroundSecondary,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Main Content Container */}
      <Box
        sx={{
          bgcolor: themeColors.backgroundPrimary,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: themeColors.borderColor,
          p: { xs: 2, md: 3 },
        }}
      >
        <CRMDashboard />
      </Box>
    </Box>
  );
}
