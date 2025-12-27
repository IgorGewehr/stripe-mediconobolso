"use client";

import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Chip,
  alpha,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Facebook,
  Close,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  SmartToy
} from '@mui/icons-material';
import useFacebookStatus from '../../hooks/useFacebookStatus';

const FacebookStatusButton = ({ variant = 'button', onConnect }) => {
  const {
    status,
    isLoading,
    pageName,
    pageId,
    aiEnabled,
    refreshStatus,
    disconnect,
    toggleAI,
    startOAuth,
    isConnected,
    isConnecting,
    hasError,
    tokenExpiry
  } = useFacebookStatus(true); // Auto-refresh enabled

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);

  // Handle button click
  const handleClick = useCallback(async () => {
    setDialogOpen(true);
  }, []);

  // Handle connect
  const handleConnect = useCallback(async () => {
    try {
      await startOAuth();
    } catch (error) {
      console.error('Failed to start OAuth:', error);
    }
  }, [startOAuth]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      await refreshStatus();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [disconnect, refreshStatus]);

  // Handle AI toggle
  const handleToggleAI = useCallback(async (event) => {
    setIsTogglingAI(true);
    try {
      await toggleAI(event.target.checked);
    } catch (error) {
      console.error('Failed to toggle AI:', error);
    } finally {
      setIsTogglingAI(false);
    }
  }, [toggleAI]);

  // Get button configuration
  const getButtonConfig = () => {
    if (isConnected) {
      return {
        color: '#1877F2', // Facebook blue
        bgColor: alpha('#1877F2', 0.1),
        hoverBgColor: alpha('#1877F2', 0.2),
        label: 'Facebook',
        hoverLabel: 'Conectado',
        icon: <CheckCircle sx={{ fontSize: 16 }} />
      };
    }
    if (isConnecting) {
      return {
        color: '#FFA726',
        bgColor: alpha('#FFA726', 0.1),
        hoverBgColor: alpha('#FFA726', 0.2),
        label: 'Facebook',
        hoverLabel: 'Conectando...',
        icon: <CircularProgress size={16} />
      };
    }
    // Disconnected or error
    return {
      color: hasError ? '#EF5350' : '#9E9E9E',
      bgColor: alpha(hasError ? '#EF5350' : '#9E9E9E', 0.1),
      hoverBgColor: alpha(hasError ? '#EF5350' : '#9E9E9E', 0.2),
      label: 'Facebook',
      hoverLabel: 'Conectar',
      icon: <Facebook sx={{ fontSize: 16 }} />
    };
  };

  const config = getButtonConfig();

  // Render compact chip variant
  if (variant === 'chip') {
    return (
      <>
        <Tooltip title={isConnected ? `Conectado: ${pageName || 'Página'}` : 'Clique para conectar'}>
          <Chip
            icon={config.icon}
            label={config.label}
            onClick={handleClick}
            sx={{
              bgcolor: config.bgColor,
              color: config.color,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${alpha(config.color, 0.3)}`,
              '& .MuiChip-icon': { color: config.color },
              '&:hover': {
                bgcolor: config.hoverBgColor,
              },
            }}
          />
        </Tooltip>

        <FacebookDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          status={status}
          isConnected={isConnected}
          pageName={pageName}
          pageId={pageId}
          aiEnabled={aiEnabled}
          tokenExpiry={tokenExpiry}
          isLoading={isLoading}
          isTogglingAI={isTogglingAI}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onToggleAI={handleToggleAI}
          onRefresh={refreshStatus}
        />
      </>
    );
  }

  // Render button variant (default)
  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} sx={{ color: config.color }} />
          ) : (
            config.icon
          )
        }
        sx={{
          borderRadius: '20px',
          px: 2,
          py: 0.75,
          bgcolor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          textTransform: 'none',
          border: `1px solid ${alpha(config.color, 0.3)}`,
          '&:hover': {
            bgcolor: config.hoverBgColor,
            '& .button-label': {
              display: 'none',
            },
            '& .button-hover-label': {
              display: 'block',
            },
          },
        }}
      >
        <Box component="span" className="button-label">
          {config.label}
        </Box>
        <Box component="span" className="button-hover-label" sx={{ display: 'none' }}>
          {config.hoverLabel}
        </Box>
      </Button>

      <FacebookDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        status={status}
        isConnected={isConnected}
        pageName={pageName}
        pageId={pageId}
        aiEnabled={aiEnabled}
        tokenExpiry={tokenExpiry}
        isLoading={isLoading}
        isTogglingAI={isTogglingAI}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onToggleAI={handleToggleAI}
        onRefresh={refreshStatus}
      />
    </>
  );
};

// Facebook Dialog Component
const FacebookDialog = ({
  open,
  onClose,
  status,
  isConnected,
  pageName,
  pageId,
  aiEnabled,
  tokenExpiry,
  isLoading,
  isTogglingAI,
  onConnect,
  onDisconnect,
  onToggleAI,
  onRefresh
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isConnected ? '#1877F2' : '#4285F4',
          color: '#FFFFFF',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Facebook />
          <Typography variant="h6">
            {isConnected ? 'Facebook Conectado' : 'Conectar Facebook'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3, textAlign: 'center' }}>
        {isConnected ? (
          // Connected state
          <Box>
            <CheckCircle sx={{ fontSize: 64, color: '#1877F2', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Conectado com sucesso!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {pageName || 'Página do Facebook'}
            </Typography>
            {pageId && (
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                ID: {pageId}
              </Typography>
            )}

            {/* AI Toggle */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: alpha('#6366F1', 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha('#6366F1', 0.2)}`,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={aiEnabled}
                    onChange={onToggleAI}
                    disabled={isTogglingAI}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <SmartToy sx={{ fontSize: 20, color: '#6366F1' }} />
                    <Typography variant="body2">
                      Respostas automáticas com IA
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Token expiry info */}
            {tokenExpiry && (
              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                Token expira em: {tokenExpiry}
              </Typography>
            )}
          </Box>
        ) : isLoading ? (
          // Loading state
          <Box>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Carregando...
            </Typography>
          </Box>
        ) : (
          // Disconnected state
          <Box>
            <Facebook sx={{ fontSize: 64, color: '#1877F2', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Conecte sua página do Facebook
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Conecte sua página do Facebook Messenger para receber e enviar mensagens diretamente pelo sistema.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Facebook />}
              onClick={onConnect}
              sx={{
                bgcolor: '#1877F2',
                '&:hover': {
                  bgcolor: '#166FE5',
                },
              }}
            >
              Conectar com Facebook
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        {isConnected ? (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={onRefresh}
              startIcon={<Refresh />}
            >
              Atualizar
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onDisconnect}
              startIcon={<Close />}
            >
              Desconectar
            </Button>
          </Box>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default FacebookStatusButton;
