"use client";

/**
 * ChannelConnectionButton
 *
 * Unified component for managing channel connections (WhatsApp & Facebook).
 * Shows connection status with a clean, minimal design.
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  alpha,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  WhatsApp,
  Facebook,
  Close,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  QrCode2,
  SmartToy,
  Forum
} from '@mui/icons-material';
import useWhatsAppStatus from '../../hooks/useWhatsAppStatus';
import useFacebookStatus from '../../hooks/useFacebookStatus';

/**
 * Main ChannelConnectionButton Component
 */
const ChannelConnectionButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // WhatsApp hook
  const whatsapp = useWhatsAppStatus();

  // Facebook hook
  const facebook = useFacebookStatus();

  // Calculate overall status
  const getOverallStatus = () => {
    const connected = [];
    if (whatsapp.isConnected) connected.push('wa');
    if (facebook.isConnected) connected.push('fb');

    if (connected.length === 2) {
      return { color: '#10B981', label: 'Canais', status: 'all' };
    }
    if (connected.length === 1) {
      return { color: '#F59E0B', label: 'Canais', status: 'partial' };
    }
    return { color: '#EF4444', label: 'Canais', status: 'none' };
  };

  const overall = getOverallStatus();

  return (
    <>
      <Tooltip
        title={
          overall.status === 'all' ? 'WhatsApp e Facebook conectados' :
          overall.status === 'partial' ? 'Alguns canais desconectados' :
          'Nenhum canal conectado'
        }
      >
        <Button
          onClick={() => setDialogOpen(true)}
          startIcon={<Forum sx={{ fontSize: 14 }} />}
          sx={{
            borderRadius: '20px',
            height: '32px',
            minHeight: '32px',
            px: 1.5,
            py: 0,
            fontSize: '12px',
            bgcolor: alpha(overall.color, 0.1),
            color: overall.color,
            fontWeight: 600,
            textTransform: 'none',
            border: `1px solid ${alpha(overall.color, 0.3)}`,
            gap: 0.5,
            '& .MuiButton-startIcon': {
              marginRight: '4px',
            },
            '&:hover': {
              bgcolor: alpha(overall.color, 0.2),
            },
          }}
        >
          {overall.label}
          <Box
            component="span"
            sx={{
              display: 'flex',
              gap: 0.25,
              ml: 0.5,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: whatsapp.isConnected ? '#25D366' : '#9CA3AF',
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: facebook.isConnected ? '#1877F2' : '#9CA3AF',
              }}
            />
          </Box>
        </Button>
      </Tooltip>

      <ChannelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        activeTab={activeTab}
        onTabChange={(_, newValue) => setActiveTab(newValue)}
        whatsapp={whatsapp}
        facebook={facebook}
      />
    </>
  );
};

/**
 * Channel Connection Dialog
 */
const ChannelDialog = ({
  open,
  onClose,
  activeTab,
  onTabChange,
  whatsapp,
  facebook
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 0,
        }}
      >
        <Typography variant="h6" component="span" fontWeight={600}>
          Canais de Comunicação
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<WhatsApp sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                WhatsApp
                <StatusDot connected={whatsapp.isConnected} />
              </Box>
            }
          />
          <Tab
            icon={<Facebook sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Facebook
                <StatusDot connected={facebook.isConnected} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {activeTab === 0 ? (
          <WhatsAppPanel
            isConnected={whatsapp.isConnected}
            isConnecting={whatsapp.isConnecting}
            isLoading={whatsapp.isLoading}
            phoneNumber={whatsapp.phoneNumber}
            businessName={whatsapp.businessName}
            qrCode={whatsapp.qrCode}
            requestQRCode={whatsapp.requestQRCode}
            disconnect={whatsapp.disconnect}
            refreshStatus={whatsapp.refreshStatus}
            needsQR={whatsapp.needsQR}
            hasError={whatsapp.hasError}
          />
        ) : (
          <FacebookPanel {...facebook} />
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Status dot indicator
 */
const StatusDot = ({ connected }) => (
  <Box
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: connected ? '#10B981' : '#9CA3AF',
    }}
  />
);

/**
 * WhatsApp Connection Panel
 */
const WhatsAppPanel = ({
  isConnected,
  isConnecting,
  isLoading,
  phoneNumber,
  businessName,
  qrCode,
  requestQRCode,
  disconnect,
  refreshStatus,
  needsQR,
  hasError
}) => {
  const [isRequestingQR, setIsRequestingQR] = useState(false);

  const handleRequestQR = useCallback(async () => {
    if (isRequestingQR || isLoading || isConnecting) return; // Prevent multiple clicks
    setIsRequestingQR(true);
    try {
      await requestQRCode();
    } catch (err) {
      console.error('Failed to request QR:', err);
    } finally {
      setIsRequestingQR(false);
    }
  }, [requestQRCode, isRequestingQR, isLoading, isConnecting]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      await refreshStatus();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, [disconnect, refreshStatus]);

  const loading = isLoading || isRequestingQR || isConnecting;

  if (isConnected) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha('#25D366', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CheckCircle sx={{ fontSize: 48, color: '#25D366' }} />
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          WhatsApp Conectado
        </Typography>

        {(phoneNumber || businessName) && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {businessName || phoneNumber}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" mb={3}>
          Você está pronto para enviar e receber mensagens
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={refreshStatus}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Close />}
            onClick={handleDisconnect}
          >
            Desconectar
          </Button>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography color="text.secondary">
          {isConnecting ? 'Aguardando QR Code do servidor...' :
           isRequestingQR ? 'Gerando QR Code...' : 'Carregando...'}
        </Typography>
        {isConnecting && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            O QR Code aparecerá automaticamente
          </Typography>
        )}
      </Box>
    );
  }

  if (qrCode) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Escaneie o QR Code com seu WhatsApp
        </Typography>

        <Box
          sx={{
            display: 'inline-block',
            p: 2,
            bgcolor: '#fff',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <img
            src={qrCode}
            alt="QR Code"
            style={{ width: 180, height: 180, display: 'block' }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          WhatsApp → Configurações → Dispositivos conectados
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={handleRequestQR}
        >
          Atualizar QR Code
        </Button>
      </Box>
    );
  }

  // Disconnected state
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha('#25D366', 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <WhatsApp sx={{ fontSize: 48, color: '#25D366' }} />
      </Box>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Conectar WhatsApp
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Conecte seu WhatsApp para receber e enviar mensagens pelo sistema
      </Typography>

      <Button
        variant="contained"
        startIcon={<QrCode2 />}
        onClick={handleRequestQR}
        sx={{
          bgcolor: '#25D366',
          '&:hover': { bgcolor: '#22c55e' },
        }}
      >
        Gerar QR Code
      </Button>

      {hasError && (
        <Typography variant="caption" color="error" display="block" mt={2}>
          Ocorreu um erro. Tente novamente.
        </Typography>
      )}
    </Box>
  );
};

/**
 * Facebook Connection Panel
 */
const FacebookPanel = ({
  isConnected,
  isLoading,
  pageId,
  pageName,
  aiEnabled,
  startOAuth,
  disconnect,
  toggleAI,
  refreshStatus,
  formatTokenExpiry,
  hasError,
  error
}) => {
  const [isTogglingAI, setIsTogglingAI] = useState(false);

  const handleConnect = useCallback(async () => {
    try {
      await startOAuth();
    } catch (err) {
      console.error('Failed to start OAuth:', err);
    }
  }, [startOAuth]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, [disconnect]);

  const handleToggleAI = useCallback(async (event) => {
    setIsTogglingAI(true);
    try {
      await toggleAI(event.target.checked);
    } catch (err) {
      console.error('Failed to toggle AI:', err);
    } finally {
      setIsTogglingAI(false);
    }
  }, [toggleAI]);

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography color="text.secondary">Carregando...</Typography>
      </Box>
    );
  }

  if (isConnected) {
    const tokenExpiry = formatTokenExpiry();

    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha('#1877F2', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CheckCircle sx={{ fontSize: 48, color: '#1877F2' }} />
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          Facebook Conectado
        </Typography>

        {pageName && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {pageName}
          </Typography>
        )}

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
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={aiEnabled}
                onChange={handleToggleAI}
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

        {tokenExpiry && (
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Token expira em: {tokenExpiry}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={refreshStatus}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Close />}
            onClick={handleDisconnect}
          >
            Desconectar
          </Button>
        </Box>
      </Box>
    );
  }

  // Disconnected state
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha('#1877F2', 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <Facebook sx={{ fontSize: 48, color: '#1877F2' }} />
      </Box>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Conectar Facebook
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Conecte sua página do Facebook para receber e enviar mensagens pelo Messenger
      </Typography>

      <Button
        variant="contained"
        startIcon={<Facebook />}
        onClick={handleConnect}
        disabled={isLoading}
        sx={{
          bgcolor: '#1877F2',
          '&:hover': { bgcolor: '#166FE5' },
        }}
      >
        Conectar com Facebook
      </Button>

      {hasError && (
        <Typography variant="caption" color="error" display="block" mt={2}>
          {error || 'Ocorreu um erro. Tente novamente.'}
        </Typography>
      )}
    </Box>
  );
};

export default ChannelConnectionButton;
