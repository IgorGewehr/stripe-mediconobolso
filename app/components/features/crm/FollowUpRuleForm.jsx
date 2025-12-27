'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  FollowUpRuleType,
  FollowUpRuleTypeLabels,
  NotificationChannel,
  NotificationChannelLabels,
  crmService,
} from '@/lib/services/api';

const TRIGGER_DAYS_OPTIONS = [
  { value: 1, label: '1 dia' },
  { value: 3, label: '3 dias' },
  { value: 7, label: '1 semana' },
  { value: 14, label: '2 semanas' },
  { value: 30, label: '1 mês' },
  { value: 60, label: '2 meses' },
  { value: 90, label: '3 meses' },
  { value: 180, label: '6 meses' },
];

const DEFAULT_TEMPLATES = {
  [FollowUpRuleType.POST_CONSULTATION]:
    'Olá {{nome}}! Como você está se sentindo após a consulta do dia {{data}}? Estou à disposição para qualquer dúvida.',
  [FollowUpRuleType.PENDING_RETURN]:
    'Olá {{nome}}, notamos que seu retorno estava previsto. Gostaria de agendar uma nova consulta? Estou à disposição.',
  [FollowUpRuleType.INACTIVITY]:
    'Olá {{nome}}, faz tempo que não nos vemos! Que tal agendar uma consulta de rotina? Fico no aguardo.',
};

export default function FollowUpRuleForm({
  open,
  onClose,
  onSave,
  rule,
  saving,
}) {
  const isEditing = Boolean(rule?.id);
  const templateVariables = crmService.getTemplateVariables();

  const [formData, setFormData] = useState({
    name: '',
    ruleType: FollowUpRuleType.POST_CONSULTATION,
    triggerDays: 7,
    channels: [NotificationChannel.WHATSAPP],
    messageTemplate: '',
    active: true,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        ruleType: rule.rule_type || FollowUpRuleType.POST_CONSULTATION,
        triggerDays: rule.trigger_days || 7,
        channels: rule.channels || [NotificationChannel.WHATSAPP],
        messageTemplate: rule.message_template || '',
        active: rule.active !== false,
      });
    } else {
      setFormData({
        name: '',
        ruleType: FollowUpRuleType.POST_CONSULTATION,
        triggerDays: 7,
        channels: [NotificationChannel.WHATSAPP],
        messageTemplate: DEFAULT_TEMPLATES[FollowUpRuleType.POST_CONSULTATION],
        active: true,
      });
    }
    setError(null);
  }, [rule, open]);

  const handleRuleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      ruleType: newType,
      messageTemplate: prev.messageTemplate || DEFAULT_TEMPLATES[newType],
    }));
  };

  const handleChannelToggle = (channel) => {
    setFormData(prev => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Nome da regra é obrigatório');
      return;
    }

    if (formData.channels.length === 0) {
      setError('Selecione pelo menos um canal de notificação');
      return;
    }

    if (!formData.messageTemplate.trim()) {
      setError('Template da mensagem é obrigatório');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar regra');
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      messageTemplate: prev.messageTemplate + variable,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Editar Regra de Follow-up' : 'Nova Regra de Follow-up'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nome da Regra"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
            placeholder="Ex: Retorno 3 meses"
          />

          <FormControl fullWidth>
            <InputLabel>Tipo de Follow-up</InputLabel>
            <Select
              value={formData.ruleType}
              label="Tipo de Follow-up"
              onChange={(e) => handleRuleTypeChange(e.target.value)}
            >
              {Object.entries(FollowUpRuleTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Dias para Disparo</InputLabel>
            <Select
              value={formData.triggerDays}
              label="Dias para Disparo"
              onChange={(e) => setFormData(prev => ({ ...prev, triggerDays: e.target.value }))}
            >
              {TRIGGER_DAYS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
              onChange={(e) => setFormData(prev => ({ ...prev, messageTemplate: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="Digite a mensagem..."
              helperText="Clique nas variáveis acima para inserir no texto"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving && <CircularProgress size={16} />}
        >
          {saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
