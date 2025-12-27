'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Chip,
  Button,
  TextField,
  Skeleton,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import {
  NotificationChannel,
  NotificationChannelLabels,
  crmService,
} from '@/lib/services/api';

const DEFAULT_REMINDER_TEMPLATE =
  'Olá {{nome}}, lembrando que sua consulta está marcada para {{data}} às {{hora}}. Confirma sua presença?';

export default function ReminderConfigCard({
  config,
  loading,
  saving,
  error,
  onSave,
}) {
  const reminderHourOptions = crmService.getReminderHourOptions();
  const templateVariables = crmService.getTemplateVariables();

  const [formData, setFormData] = useState({
    reminderHours: [24],
    channels: [NotificationChannel.WHATSAPP],
    messageTemplate: DEFAULT_REMINDER_TEMPLATE,
    active: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        reminderHours: config.reminder_hours || [24],
        channels: config.channels || [NotificationChannel.WHATSAPP],
        messageTemplate: config.message_template || DEFAULT_REMINDER_TEMPLATE,
        active: config.active !== false,
      });
      setHasChanges(false);
    }
  }, [config]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleReminderHourToggle = (hour) => {
    const hours = formData.reminderHours.includes(hour)
      ? formData.reminderHours.filter(h => h !== hour)
      : [...formData.reminderHours, hour].sort((a, b) => a - b);
    handleChange('reminderHours', hours);
  };

  const handleChannelToggle = (channel) => {
    const channels = formData.channels.includes(channel)
      ? formData.channels.filter(c => c !== channel)
      : [...formData.channels, channel];
    handleChange('channels', channels);
  };

  const handleSubmit = async () => {
    await onSave(formData);
    setHasChanges(false);
  };

  const insertVariable = (variable) => {
    handleChange('messageTemplate', formData.messageTemplate + variable);
  };

  if (loading && !config) {
    return (
      <Card>
        <CardHeader title="Lembretes de Agendamento" />
        <Divider />
        <CardContent>
          <Skeleton height={40} sx={{ mb: 2 }} />
          <Skeleton height={100} sx={{ mb: 2 }} />
          <Skeleton height={80} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Lembretes de Agendamento"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                disabled={saving}
              />
            }
            label={formData.active ? 'Ativo' : 'Inativo'}
          />
        }
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Quando Enviar Lembrete
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {reminderHourOptions.map(opt => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  variant={formData.reminderHours.includes(opt.value) ? 'filled' : 'outlined'}
                  color={formData.reminderHours.includes(opt.value) ? 'primary' : 'default'}
                  onClick={() => handleReminderHourToggle(opt.value)}
                  disabled={saving}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Selecione um ou mais horários para envio do lembrete
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Canais de Notificação
            </Typography>
            <FormGroup row>
              {Object.entries(NotificationChannelLabels).map(([value, label]) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={formData.channels.includes(value)}
                      onChange={() => handleChannelToggle(value)}
                      disabled={saving}
                    />
                  }
                  label={label}
                />
              ))}
            </FormGroup>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Template da Mensagem
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {templateVariables.map(v => (
                <Chip
                  key={v.key}
                  label={v.key}
                  size="small"
                  variant="outlined"
                  onClick={() => insertVariable(v.key)}
                  sx={{ cursor: 'pointer' }}
                  title={v.description}
                />
              ))}
            </Box>
            <TextField
              value={formData.messageTemplate}
              onChange={(e) => handleChange('messageTemplate', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Digite a mensagem de lembrete..."
              disabled={saving}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || !hasChanges}
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
