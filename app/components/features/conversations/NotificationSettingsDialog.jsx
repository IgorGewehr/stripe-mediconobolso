"use client";

/**
 * NotificationSettingsDialog Component
 *
 * Dialog for configuring notification preferences per user.
 * Both doctors and secretaries can independently configure their settings.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  alpha
} from '@mui/material';
import {
  Close,
  ExpandMore,
  Notifications,
  NotificationsOff,
  WhatsApp,
  Email,
  PhoneAndroid,
  DesktopWindows,
  Schedule,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import useNotificationSettings from '../../hooks/useNotificationSettings';
import {
  NotificationChannel,
  NotificationEventType,
  EventTypeLabels,
  ChannelLabels
} from '@/lib/models/NotificationSettings.model';

const NotificationSettingsDialog = ({ open, onClose }) => {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    toggleNotifications,
    toggleChannel,
    toggleEvent,
    updateQuietHours
  } = useNotificationSettings();

  const [localSettings, setLocalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with loaded settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
      setHasChanges(false);
    }
  }, [settings]);

  // Handle global toggle
  const handleGlobalToggle = (event) => {
    const enabled = event.target.checked;
    setLocalSettings(prev => ({ ...prev, enabled }));
    setHasChanges(true);
  };

  // Handle channel toggle
  const handleChannelToggle = (channel) => (event) => {
    const enabled = event.target.checked;
    setLocalSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled
        }
      }
    }));
    setHasChanges(true);
  };

  // Handle event toggle
  const handleEventToggle = (channel, eventType) => (event) => {
    const enabled = event.target.checked;
    setLocalSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          events: {
            ...prev.channels[channel]?.events,
            [eventType]: enabled
          }
        }
      }
    }));
    setHasChanges(true);
  };

  // Handle quiet hours toggle
  const handleQuietHoursToggle = (event) => {
    const enabled = event.target.checked;
    setLocalSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));
    setHasChanges(true);
  };

  // Handle quiet hours time change
  const handleQuietHoursTimeChange = (field) => (event) => {
    setLocalSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: event.target.value
      }
    }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!localSettings) return;

    const success = await saveSettings(localSettings);
    if (success) {
      setHasChanges(false);
      onClose();
    }
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    switch (channel) {
      case NotificationChannel.WHATSAPP:
        return <WhatsApp sx={{ color: '#25D366' }} />;
      case NotificationChannel.EMAIL:
        return <Email sx={{ color: '#EA4335' }} />;
      case NotificationChannel.PUSH:
        return <PhoneAndroid sx={{ color: '#4285F4' }} />;
      case NotificationChannel.IN_APP:
        return <DesktopWindows sx={{ color: '#4285F4' }} />;
      default:
        return <Notifications />;
    }
  };

  // Get events for a channel
  const getChannelEvents = (channel) => {
    switch (channel) {
      case NotificationChannel.WHATSAPP:
        return [
          NotificationEventType.NEW_MESSAGE,
          NotificationEventType.NEW_CONVERSATION,
          NotificationEventType.AI_BLOCKED,
          NotificationEventType.AI_UNBLOCKED
        ];
      case NotificationChannel.IN_APP:
        return [
          NotificationEventType.NEW_MESSAGE,
          NotificationEventType.NEW_CONVERSATION,
          NotificationEventType.AI_BLOCKED,
          NotificationEventType.APPOINTMENT_CREATED,
          NotificationEventType.PATIENT_WAITING
        ];
      case NotificationChannel.PUSH:
        return [
          NotificationEventType.NEW_MESSAGE,
          NotificationEventType.NEW_CONVERSATION,
          NotificationEventType.APPOINTMENT_REMINDER
        ];
      case NotificationChannel.EMAIL:
        return [
          NotificationEventType.APPOINTMENT_CREATED,
          NotificationEventType.APPOINTMENT_REMINDER
        ];
      default:
        return [];
    }
  };

  if (isLoading || !localSettings) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#4285F4',
          color: '#FFFFFF'
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Notifications />
          <Typography variant="h6">Configurar Notificações</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Global Toggle */}
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: localSettings.enabled ? alpha('#4285F4', 0.1) : alpha('#EF5350', 0.1),
            border: `1px solid ${localSettings.enabled ? alpha('#4285F4', 0.3) : alpha('#EF5350', 0.3)}`
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enabled}
                onChange={handleGlobalToggle}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {localSettings.enabled ? (
                  <Notifications sx={{ color: '#4285F4' }} />
                ) : (
                  <NotificationsOff sx={{ color: '#EF5350' }} />
                )}
                <Typography fontWeight={600}>
                  {localSettings.enabled ? 'Notificações Ativadas' : 'Notificações Desativadas'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Quiet Hours */}
        <Accordion defaultExpanded={localSettings.quietHours?.enabled}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule sx={{ color: '#757575' }} />
              <Typography fontWeight={500}>Horário Silencioso</Typography>
              {localSettings.quietHours?.enabled && (
                <Chip
                  label={`${localSettings.quietHours.startTime} - ${localSettings.quietHours.endTime}`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.quietHours?.enabled || false}
                  onChange={handleQuietHoursToggle}
                  size="small"
                />
              }
              label="Ativar horário silencioso"
            />
            {localSettings.quietHours?.enabled && (
              <Box display="flex" gap={2} mt={2}>
                <TextField
                  label="Início"
                  type="time"
                  value={localSettings.quietHours?.startTime || '22:00'}
                  onChange={handleQuietHoursTimeChange('startTime')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fim"
                  type="time"
                  value={localSettings.quietHours?.endTime || '08:00'}
                  onChange={handleQuietHoursTimeChange('endTime')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Durante este período, você não receberá notificações sonoras
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Channel Settings */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Canais de Notificação
        </Typography>

        {Object.values(NotificationChannel).map((channel) => (
          <Accordion key={channel}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1} width="100%">
                {getChannelIcon(channel)}
                <Typography fontWeight={500} flex={1}>
                  {ChannelLabels[channel]}
                </Typography>
                <Switch
                  checked={localSettings.channels?.[channel]?.enabled || false}
                  onChange={handleChannelToggle(channel)}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {localSettings.channels?.[channel]?.enabled ? (
                <Box sx={{ pl: 2 }}>
                  {getChannelEvents(channel).map((eventType) => (
                    <FormControlLabel
                      key={eventType}
                      control={
                        <Switch
                          checked={localSettings.channels?.[channel]?.events?.[eventType] || false}
                          onChange={handleEventToggle(channel, eventType)}
                          size="small"
                        />
                      }
                      label={EventTypeLabels[eventType]}
                      sx={{ display: 'block', mb: 0.5 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ative o canal para configurar eventos
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Sound Settings */}
        <Box sx={{ mt: 2, p: 2, bgcolor: '#F5F5F5', borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.conversations?.desktopNotifications || false}
                onChange={(e) => {
                  setLocalSettings(prev => ({
                    ...prev,
                    conversations: {
                      ...prev.conversations,
                      desktopNotifications: e.target.checked
                    }
                  }));
                  setHasChanges(true);
                }}
                size="small"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {localSettings.conversations?.desktopNotifications ? (
                  <VolumeUp sx={{ fontSize: 20, color: '#4285F4' }} />
                ) : (
                  <VolumeOff sx={{ fontSize: 20, color: '#757575' }} />
                )}
                <Typography variant="body2">Notificações do navegador</Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges || isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
          sx={{
            bgcolor: '#4285F4',
            '&:hover': { bgcolor: '#3367D6' }
          }}
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettingsDialog;
