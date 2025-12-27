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
  Tooltip
} from '@mui/material';
import {
  WhatsApp,
  Close,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  QrCode2
} from '@mui/icons-material';
import useWhatsAppStatus from '../../hooks/useWhatsAppStatus';

const WhatsAppStatusButton = ({ variant = 'button' }) => {
  const {
    status,
    isLoading,
    phoneNumber,
    qrCode,
    requestQRCode,
    refreshStatus,
    disconnect,
    isConnected,
    isConnecting,
    needsQR,
    hasError,
    isDisconnected
  } = useWhatsAppStatus(true); // Auto-refresh enabled

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRequestingQR, setIsRequestingQR] = useState(false);

  // Handle button click
  const handleClick = useCallback(async () => {
    if (isConnected) {
      // If connected, just open dialog to show status
      setDialogOpen(true);
    } else {
      // If not connected, open dialog and request QR
      setDialogOpen(true);
      if (!qrCode && !isRequestingQR) {
        setIsRequestingQR(true);
        try {
          await requestQRCode();
        } catch (error) {
          console.error('Failed to request QR:', error);
        } finally {
          setIsRequestingQR(false);
        }
      }
    }
  }, [isConnected, qrCode, isRequestingQR, requestQRCode]);

  // Handle refresh QR
  const handleRefreshQR = useCallback(async () => {
    setIsRequestingQR(true);
    try {
      await requestQRCode();
    } catch (error) {
      console.error('Failed to refresh QR:', error);
    } finally {
      setIsRequestingQR(false);
    }
  }, [requestQRCode]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      await refreshStatus();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [disconnect, refreshStatus]);

  // Get button configuration
  const getButtonConfig = () => {
    if (isConnected) {
      return {
        color: '#25D366',
        bgColor: alpha('#25D366', 0.1),
        hoverBgColor: alpha('#25D366', 0.2),
        label: 'WhatsApp',
        hoverLabel: 'Conectado',
        icon: <CheckCircle sx={{ fontSize: 16 }} />
      };
    }
    if (isConnecting || needsQR) {
      return {
        color: '#FFA726',
        bgColor: alpha('#FFA726', 0.1),
        hoverBgColor: alpha('#FFA726', 0.2),
        label: 'WhatsApp',
        hoverLabel: 'Conectando...',
        icon: <QrCode2 sx={{ fontSize: 16 }} />
      };
    }
    // Disconnected or error
    return {
      color: '#EF5350',
      bgColor: alpha('#EF5350', 0.1),
      hoverBgColor: alpha('#EF5350', 0.2),
      label: 'WhatsApp',
      hoverLabel: 'Conectar',
      icon: <WhatsApp sx={{ fontSize: 16 }} />
    };
  };

  const config = getButtonConfig();

  // Render compact chip variant
  if (variant === 'chip') {
    return (
      <>
        <Tooltip title={isConnected ? `Conectado: ${phoneNumber || 'WhatsApp'}` : 'Clique para conectar'}>
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

        <QRDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          status={status}
          isConnected={isConnected}
          phoneNumber={phoneNumber}
          qrCode={qrCode}
          isLoading={isLoading || isRequestingQR}
          onRefreshQR={handleRefreshQR}
          onDisconnect={handleDisconnect}
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
            <CircularProgress size={14} sx={{ color: config.color }} />
          ) : (
            React.cloneElement(config.icon, { sx: { fontSize: 14 } })
          )
        }
        sx={{
          borderRadius: '20px',
          height: '32px',
          minHeight: '32px',
          px: 1.5,
          py: 0,
          fontSize: '12px',
          bgcolor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          textTransform: 'none',
          border: `1px solid ${alpha(config.color, 0.3)}`,
          '& .MuiButton-startIcon': {
            marginRight: '4px',
          },
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

      <QRDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        status={status}
        isConnected={isConnected}
        phoneNumber={phoneNumber}
        qrCode={qrCode}
        isLoading={isLoading || isRequestingQR}
        onRefreshQR={handleRefreshQR}
        onDisconnect={handleDisconnect}
      />
    </>
  );
};

// QR Code Dialog Component
const QRDialog = ({
  open,
  onClose,
  status,
  isConnected,
  phoneNumber,
  qrCode,
  isLoading,
  onRefreshQR,
  onDisconnect
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
          bgcolor: isConnected ? '#25D366' : '#4285F4',
          color: '#FFFFFF',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <WhatsApp />
          <Typography variant="h6">
            {isConnected ? 'WhatsApp Conectado' : 'Conectar WhatsApp'}
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
            <CheckCircle sx={{ fontSize: 64, color: '#25D366', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Conectado com sucesso!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {phoneNumber || 'WhatsApp Web'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Você está pronto para receber e enviar mensagens
            </Typography>
          </Box>
        ) : isLoading ? (
          // Loading state
          <Box>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Gerando QR Code...
            </Typography>
          </Box>
        ) : qrCode ? (
          // QR Code display
          <Box>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Escaneie o QR Code com seu WhatsApp para conectar
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                p: 2,
                bgcolor: '#FFFFFF',
                borderRadius: 2,
                border: '1px solid #E5E7EB',
                mb: 2,
              }}
            >
              <img
                src={qrCode}
                alt="QR Code"
                style={{
                  width: 200,
                  height: 200,
                  display: 'block',
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Abra o WhatsApp no seu celular, vá em Configurações {'>'} Dispositivos conectados
            </Typography>
          </Box>
        ) : (
          // Error or no QR
          <Box>
            <ErrorIcon sx={{ fontSize: 64, color: '#EF5350', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" mb={2}>
              Não foi possível gerar o QR Code
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefreshQR}
            >
              Tentar novamente
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        {isConnected ? (
          <Button
            variant="outlined"
            color="error"
            onClick={onDisconnect}
            startIcon={<Close />}
          >
            Desconectar
          </Button>
        ) : qrCode && !isLoading ? (
          <Button
            variant="outlined"
            onClick={onRefreshQR}
            startIcon={<Refresh />}
          >
            Atualizar QR Code
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppStatusButton;
