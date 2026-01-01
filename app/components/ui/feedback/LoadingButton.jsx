'use client';

import React from 'react';
import { Button, Box } from '@mui/material';
import { ButtonLoading } from './LoadingSpinner';

const LoadingButton = ({
  children,
  loading = false,
  loadingText,
  disabled,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  sx = {},
  ...props
}) => {
  const isDisabled = loading || disabled;

  // Determine loading spinner color based on variant
  const getSpinnerColor = () => {
    if (variant === 'contained') {
      return '#fff';
    }
    if (color === 'primary') return '#1852FE';
    if (color === 'error') return '#EF4444';
    if (color === 'success') return '#10B981';
    return '#666';
  };

  const getSpinnerSize = () => {
    if (size === 'small') return 16;
    if (size === 'large') return 24;
    return 20;
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      sx={{
        position: 'relative',
        minWidth: loading ? 120 : undefined,
        transition: 'all 0.2s ease',
        '&.Mui-disabled': {
          backgroundColor: variant === 'contained' ? undefined : 'transparent',
          opacity: loading ? 1 : 0.6,
        },
        ...sx,
      }}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          visibility: loading ? 'visible' : 'visible',
        }}
      >
        {loading && (
          <ButtonLoading
            color={getSpinnerColor()}
            size={getSpinnerSize()}
          />
        )}
        <span style={{ opacity: loading && loadingText ? 1 : loading ? 0 : 1 }}>
          {loading && loadingText ? loadingText : children}
        </span>
      </Box>
    </Button>
  );
};

export default LoadingButton;
