'use client';

import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';

// Animation keyframes
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

// Elegant circular spinner
export const CircleSpinner = ({
  size = 40,
  thickness = 3,
  color = '#1852FE',
  secondaryColor = '#E9EFFF',
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      position: 'relative',
    }}
  >
    {/* Background circle */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: `${thickness}px solid ${secondaryColor}`,
      }}
    />
    {/* Spinning arc */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: `${thickness}px solid transparent`,
        borderTopColor: color,
        animation: `${spin} 0.8s linear infinite`,
      }}
    />
  </Box>
);

// Three dots loading
export const DotsSpinner = ({ size = 8, color = '#1852FE', gap = 4 }) => (
  <Box sx={{ display: 'flex', gap: `${gap}px`, alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          animation: `${bounce} 1.4s infinite ease-in-out both`,
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
  </Box>
);

// Elegant pulse ring
export const PulseSpinner = ({ size = 40, color = '#1852FE' }) => (
  <Box
    sx={{
      width: size,
      height: size,
      position: 'relative',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.3,
        animation: `${pulse} 1.5s ease-in-out infinite`,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
  </Box>
);

// Full page loading overlay
export const LoadingOverlay = ({
  open,
  message = 'Carregando...',
  description,
  blur = true,
}) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: blur ? 'blur(8px)' : 'none',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
          p: 4,
          maxWidth: 320,
          textAlign: 'center',
        }}
      >
        <CircleSpinner size={48} thickness={4} />
        <Box>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111E5A',
              mb: description ? 0.5 : 0,
            }}
          >
            {message}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#666',
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Inline loading with text
export const InlineLoading = ({
  message = 'Carregando...',
  size = 'medium',
  color = '#1852FE',
}) => {
  const sizeMap = {
    small: { spinner: 16, text: '13px', gap: 1 },
    medium: { spinner: 20, text: '14px', gap: 1.5 },
    large: { spinner: 24, text: '15px', gap: 2 },
  };
  const config = sizeMap[size] || sizeMap.medium;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: config.gap,
        color: color,
      }}
    >
      <CircleSpinner size={config.spinner} thickness={2} color={color} />
      <Typography
        sx={{
          fontSize: config.text,
          fontWeight: 500,
          color: 'inherit',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

// Button loading state component
export const ButtonLoading = ({ color = '#fff', size = 20 }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircleSpinner
      size={size}
      thickness={2}
      color={color}
      secondaryColor={`${color}40`}
    />
  </Box>
);

// Skeleton loading for content
export const Skeleton = ({
  width = '100%',
  height = 20,
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  const borderRadius = variant === 'circular' ? '50%' : variant === 'text' ? 4 : 8;

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        backgroundColor: '#E9EFFF',
        animation: animation === 'pulse' ? `${pulse} 1.5s ease-in-out infinite` : 'none',
      }}
    />
  );
};

// Skeleton card for lists
export const SkeletonCard = ({ lines = 3 }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: '12px',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      backgroundColor: '#fff',
    }}
  >
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" height={16} />
        <Box sx={{ mt: 1 }}>
          <Skeleton width="40%" height={12} />
        </Box>
      </Box>
    </Box>
    {Array.from({ length: lines }).map((_, i) => (
      <Box key={i} sx={{ mt: 1 }}>
        <Skeleton width={i === lines - 1 ? '70%' : '100%'} height={14} />
      </Box>
    ))}
  </Box>
);

export default CircleSpinner;
