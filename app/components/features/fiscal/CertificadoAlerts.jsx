'use client';

/**
 * CertificadoAlerts - Sistema de Alertas de Expiração de Certificado Digital
 *
 * Funcionalidades:
 * - Alerta visual quando certificado está próximo de expirar
 * - Notificações push/email configuráveis
 * - Dashboard de status do certificado
 * - Integração com sistema de NFSe
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Tooltip,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Security as CertIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Notifications as NotifyIcon,
  NotificationsOff as NotifyOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { format, differenceInDays, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configuracoes de alerta
const ALERT_THRESHOLDS = {
  critical: 7, // 7 dias ou menos = critico
  warning: 30, // 30 dias ou menos = aviso
  info: 60, // 60 dias ou menos = informativo
};

// Helper para calcular status do certificado
const getCertificateStatus = (expirationDate) => {
  if (!expirationDate) return { status: 'unknown', color: 'default', message: 'Sem certificado' };

  const today = new Date();
  const expDate = new Date(expirationDate);
  const daysRemaining = differenceInDays(expDate, today);

  if (isBefore(expDate, today)) {
    return {
      status: 'expired',
      color: 'error',
      severity: 'error',
      message: 'Certificado expirado',
      daysRemaining: 0,
    };
  }

  if (daysRemaining <= ALERT_THRESHOLDS.critical) {
    return {
      status: 'critical',
      color: 'error',
      severity: 'error',
      message: `Expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`,
      daysRemaining,
    };
  }

  if (daysRemaining <= ALERT_THRESHOLDS.warning) {
    return {
      status: 'warning',
      color: 'warning',
      severity: 'warning',
      message: `Expira em ${daysRemaining} dias`,
      daysRemaining,
    };
  }

  if (daysRemaining <= ALERT_THRESHOLDS.info) {
    return {
      status: 'info',
      color: 'info',
      severity: 'info',
      message: `Expira em ${daysRemaining} dias`,
      daysRemaining,
    };
  }

  return {
    status: 'ok',
    color: 'success',
    severity: 'success',
    message: `Valido por ${daysRemaining} dias`,
    daysRemaining,
  };
};

// Componente de Status do Certificado
const CertificateStatusCard = memo(({ certificate, onUpload, onRefresh, loading }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const status = getCertificateStatus(certificate?.expirationDate);
  const progressValue = certificate?.expirationDate
    ? Math.min(100, Math.max(0, (status.daysRemaining / 365) * 100))
    : 0;

  const StatusIcon = {
    expired: ErrorIcon,
    critical: ErrorIcon,
    warning: WarningIcon,
    info: ScheduleIcon,
    ok: CheckIcon,
    unknown: CertIcon,
  }[status.status];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: status.status === 'ok' ? 'divider' : `${status.color}.main`,
        borderRadius: 2,
        bgcolor: status.status !== 'ok' ? alpha(theme.palette[status.color]?.main || theme.palette.grey[500], 0.04) : 'background.paper',
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette[status.color]?.main || theme.palette.grey[500], 0.1),
            }}
          >
            <StatusIcon sx={{ color: `${status.color}.main`, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Certificado Digital A1
            </Typography>
            <Chip
              size="small"
              label={status.message}
              color={status.color}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        <Box display="flex" gap={0.5}>
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? 'Recolher' : 'Expandir'}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Barra de Progresso */}
      {certificate?.expirationDate && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Validade
            </Typography>
            <Typography variant="caption" color={`${status.color}.main`} fontWeight={500}>
              {status.daysRemaining} dias restantes
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color={status.color}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {/* Detalhes Expandidos */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          {certificate ? (
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Titular:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {certificate.commonName || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  CNPJ/CPF:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {certificate.documento || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Emissor:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {certificate.emissor || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Expiracao:
                </Typography>
                <Typography variant="body2" fontWeight={500} color={`${status.color}.main`}>
                  {certificate.expirationDate
                    ? format(new Date(certificate.expirationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '-'}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Nenhum certificado digital configurado. Faca upload para habilitar a emissao de NFSe.
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onUpload}
              fullWidth
            >
              {certificate ? 'Substituir Certificado' : 'Fazer Upload'}
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
});
CertificateStatusCard.displayName = 'CertificateStatusCard';

// Dialog de Configuracao de Alertas
const AlertConfigDialog = memo(({ open, onClose, config, onSave }) => {
  const [settings, setSettings] = useState({
    enablePush: config?.enablePush ?? true,
    enableEmail: config?.enableEmail ?? true,
    emailAddress: config?.emailAddress || '',
    alertDays: config?.alertDays || [7, 15, 30, 60],
    dailyReminder: config?.dailyReminder ?? false,
  });

  const handleSave = () => {
    onSave?.(settings);
    onClose?.();
  };

  const toggleAlertDay = (day) => {
    setSettings(prev => ({
      ...prev,
      alertDays: prev.alertDays.includes(day)
        ? prev.alertDays.filter(d => d !== day)
        : [...prev.alertDays, day].sort((a, b) => b - a),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Configurar Alertas de Certificado
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Notificacoes Push */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enablePush}
                  onChange={(e) => setSettings(prev => ({ ...prev, enablePush: e.target.checked }))}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <NotifyIcon fontSize="small" />
                  Notificacoes Push
                </Box>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 6 }}>
              Receba alertas no navegador quando o certificado estiver proximo de expirar
            </Typography>
          </Box>

          {/* Notificacoes Email */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableEmail: e.target.checked }))}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" />
                  Notificacoes por Email
                </Box>
              }
            />
            {settings.enableEmail && (
              <TextField
                fullWidth
                size="small"
                label="Email para alertas"
                value={settings.emailAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, emailAddress: e.target.value }))}
                sx={{ mt: 1, ml: 6, width: 'calc(100% - 48px)' }}
                placeholder="seu@email.com"
              />
            )}
          </Box>

          <Divider />

          {/* Dias de Alerta */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Alertar quando faltar:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {[7, 15, 30, 45, 60, 90].map((day) => (
                <Chip
                  key={day}
                  label={`${day} dias`}
                  size="small"
                  onClick={() => toggleAlertDay(day)}
                  color={settings.alertDays.includes(day) ? 'primary' : 'default'}
                  variant={settings.alertDays.includes(day) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          {/* Lembrete Diario */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dailyReminder}
                  onChange={(e) => setSettings(prev => ({ ...prev, dailyReminder: e.target.checked }))}
                />
              }
              label="Lembrete diario quando expirar em menos de 7 dias"
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
});
AlertConfigDialog.displayName = 'AlertConfigDialog';

// Componente Principal de Alertas
export default function CertificadoAlerts({
  certificate,
  alertConfig,
  onUpload,
  onRefresh,
  onSaveAlertConfig,
  loading = false,
  compact = false,
}) {
  const theme = useTheme();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const status = getCertificateStatus(certificate?.expirationDate);
  const showAlert = status.status !== 'ok' && status.status !== 'unknown' && !dismissed;

  // Reset dismissed quando status muda
  useEffect(() => {
    setDismissed(false);
  }, [status.status]);

  if (compact) {
    // Versao compacta para header/sidebar
    if (!showAlert) return null;

    return (
      <Alert
        severity={status.severity}
        icon={<CertIcon />}
        sx={{ mb: 2 }}
        action={
          <IconButton size="small" onClick={() => setDismissed(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>Certificado Digital</AlertTitle>
        {status.message}
        {status.status === 'expired' && ' - NFSe bloqueada'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Alerta Principal (se necessario) */}
      {showAlert && (
        <Alert
          severity={status.severity}
          icon={<CertIcon />}
          sx={{ mb: 2 }}
          action={
            <Box display="flex" gap={1}>
              <Button
                size="small"
                color="inherit"
                onClick={onUpload}
              >
                Renovar
              </Button>
              <IconButton size="small" onClick={() => setDismissed(true)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <AlertTitle>
            {status.status === 'expired' ? 'Certificado Expirado!' : 'Atencao com seu Certificado Digital'}
          </AlertTitle>
          {status.status === 'expired' ? (
            <>
              Seu certificado digital expirou. A emissao de NFSe esta bloqueada ate que um novo certificado seja configurado.
            </>
          ) : (
            <>
              Seu certificado digital {status.message.toLowerCase()}.
              {status.daysRemaining <= ALERT_THRESHOLDS.critical && ' Renove o quanto antes para evitar interrupcoes na emissao de NFSe.'}
            </>
          )}
        </Alert>
      )}

      {/* Card de Status */}
      <CertificateStatusCard
        certificate={certificate}
        onUpload={onUpload}
        onRefresh={onRefresh}
        loading={loading}
      />

      {/* Botao de Configuracoes */}
      <Box display="flex" justifyContent="flex-end" mt={1}>
        <Button
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => setConfigDialogOpen(true)}
        >
          Configurar Alertas
        </Button>
      </Box>

      {/* Dialog de Configuracao */}
      <AlertConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        config={alertConfig}
        onSave={onSaveAlertConfig}
      />
    </Box>
  );
}

// Export helper para uso externo
export { getCertificateStatus, ALERT_THRESHOLDS };
