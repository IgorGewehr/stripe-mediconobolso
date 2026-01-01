'use client';

import React, { forwardRef, useCallback } from 'react';
import { Snackbar, Box, Typography, IconButton, keyframes } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// Animation keyframes
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const progressShrink = keyframes`
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
`;

// Toast configuration by type
const toastConfig = {
  success: {
    icon: CheckCircleRoundedIcon,
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#065F46',
  },
  error: {
    icon: ErrorRoundedIcon,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
  },
  warning: {
    icon: WarningRoundedIcon,
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#92400E',
  },
  info: {
    icon: InfoRoundedIcon,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
  },
};

const Toast = forwardRef(({
  open,
  onClose,
  message,
  description,
  type = 'info',
  duration = 4000,
  showProgress = true,
  action,
  position = { vertical: 'top', horizontal: 'center' },
}, ref) => {
  const config = toastConfig[type] || toastConfig.info;
  const IconComponent = config.icon;

  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    onClose?.(event, reason);
  }, [onClose]);

  return (
    <Snackbar
      ref={ref}
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
      sx={{
        '& .MuiSnackbarContent-root': {
          padding: 0,
          minWidth: 'auto',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          minWidth: 320,
          maxWidth: 420,
          p: 2,
          pr: 2.5,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
          animation: `${slideIn} 0.25s ease-out`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: `${config.color}15`,
            flexShrink: 0,
          }}
        >
          <IconComponent
            sx={{
              fontSize: 20,
              color: config.color,
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: config.textColor,
              lineHeight: 1.4,
              mb: description ? 0.5 : 0,
            }}
          >
            {message}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 400,
                color: `${config.textColor}CC`,
                lineHeight: 1.4,
              }}
            >
              {description}
            </Typography>
          )}
          {action && (
            <Box sx={{ mt: 1.5 }}>
              {action}
            </Box>
          )}
        </Box>

        {/* Close button */}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            color: config.textColor,
            opacity: 0.5,
            '&:hover': {
              opacity: 1,
              backgroundColor: `${config.color}10`,
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Progress bar */}
        {showProgress && duration && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: `${config.color}20`,
            }}
          >
            <Box
              sx={{
                height: '100%',
                backgroundColor: config.color,
                transformOrigin: 'left',
                animation: `${progressShrink} ${duration}ms linear forwards`,
              }}
            />
          </Box>
        )}
      </Box>
    </Snackbar>
  );
});

Toast.displayName = 'Toast';

export default Toast;
