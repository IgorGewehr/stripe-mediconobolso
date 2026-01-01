'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LoadingButton from './LoadingButton';

// Styled Dialog wrapper with consistent design
const StyledDialog = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  showCloseButton = true,
  actions,
  // Shorthand for common action patterns
  onConfirm,
  confirmText = 'Confirmar',
  confirmLoading = false,
  confirmLoadingText,
  confirmVariant = 'primary', // 'primary' | 'success' | 'danger'
  onCancel,
  cancelText = 'Cancelar',
  hideCancel = false,
  disableConfirm = false,
  ...props
}) => {
  const getConfirmStyles = () => {
    switch (confirmVariant) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          },
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          },
        };
      default:
        return {
          boxShadow: '0 2px 8px rgba(24, 82, 254, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(24, 82, 254, 0.35)',
          },
        };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
        }
      }}
      {...props}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          p: 3,
          pb: subtitle ? 1 : 2,
        }}
      >
        <Box>
          <DialogTitle
            sx={{
              p: 0,
              fontWeight: 600,
              fontSize: '18px',
              color: '#111E5A',
              lineHeight: 1.3,
            }}
          >
            {title}
          </DialogTitle>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                mt: 0.5,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {showCloseButton && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#9CA3AF',
              ml: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#666',
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 2 }}>
        {children}
      </DialogContent>

      {/* Actions */}
      {(actions || onConfirm) && (
        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          {actions || (
            <>
              {!hideCancel && (
                <Button
                  onClick={onCancel || onClose}
                  disabled={confirmLoading}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#666',
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {cancelText}
                </Button>
              )}
              <LoadingButton
                variant="contained"
                onClick={onConfirm}
                loading={confirmLoading}
                loadingText={confirmLoadingText}
                disabled={disableConfirm}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  ...getConfirmStyles(),
                }}
              >
                {confirmText}
              </LoadingButton>
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

// Confirmation dialog for delete/dangerous actions
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => (
  <StyledDialog
    open={open}
    onClose={onClose}
    title={title}
    maxWidth="xs"
    onConfirm={onConfirm}
    confirmText={confirmText}
    confirmVariant={variant}
    confirmLoading={loading}
    cancelText={cancelText}
  >
    <Typography sx={{ color: '#4B5574', lineHeight: 1.6 }}>
      {message}
    </Typography>
  </StyledDialog>
);

// Success dialog for completion messages
export const SuccessDialog = ({
  open,
  onClose,
  title = 'Sucesso!',
  message,
  buttonText = 'Fechar',
}) => (
  <StyledDialog
    open={open}
    onClose={onClose}
    title={title}
    maxWidth="xs"
    hideCancel
    onConfirm={onClose}
    confirmText={buttonText}
    confirmVariant="success"
  >
    <Typography sx={{ color: '#4B5574', lineHeight: 1.6 }}>
      {message}
    </Typography>
  </StyledDialog>
);

export default StyledDialog;
