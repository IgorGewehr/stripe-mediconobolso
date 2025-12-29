"use client";

/**
 * ScheduleSetupDialog Component
 * Dialog para configurar agenda no onboarding
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { X, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const DIAS_SEMANA = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
  { id: 'dom', label: 'Domingo' },
];

const HORARIOS = Array.from({ length: 24 }, (_, i) => {
  const hora = i.toString().padStart(2, '0');
  return [`${hora}:00`, `${hora}:30`];
}).flat();

export default function ScheduleSetupDialog({
  open,
  onClose,
  onComplete,
  onSkip,
}) {
  const [formData, setFormData] = useState({
    diasAtendimento: ['seg', 'ter', 'qua', 'qui', 'sex'],
    horarioInicio: '08:00',
    horarioFim: '18:00',
    duracaoConsulta: 30,
    intervaloAlmoco: true,
    horarioAlmocoInicio: '12:00',
    horarioAlmocoFim: '13:00',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiaToggle = (diaId) => {
    setFormData(prev => {
      const dias = prev.diasAtendimento.includes(diaId)
        ? prev.diasAtendimento.filter(d => d !== diaId)
        : [...prev.diasAtendimento, diaId];
      return { ...prev, diasAtendimento: dias };
    });
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (formData.diasAtendimento.length === 0) {
      setError('Selecione pelo menos um dia de atendimento');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Aqui você faria a chamada para salvar no backend
      // await updateScheduleSettings(formData);

      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete();
    } catch (err) {
      console.error('[ScheduleSetup] Erro ao salvar:', err);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
          my: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            backgroundColor: 'rgba(29, 78, 216, 0.04)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(29, 78, 216, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={24} color="#1D4ED8" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                  Configure sua Agenda
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Defina seus horários de atendimento
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} sx={{ color: '#6B7280' }}>
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        {/* Conteúdo */}
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {error && (
              <Alert
                severity="error"
                icon={<AlertCircle size={18} />}
                sx={{ borderRadius: '10px' }}
              >
                {error}
              </Alert>
            )}

            {/* Dias da semana */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}
              >
                Dias de Atendimento
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {DIAS_SEMANA.map(dia => (
                  <Button
                    key={dia.id}
                    variant={formData.diasAtendimento.includes(dia.id) ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleDiaToggle(dia.id)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      minWidth: 'auto',
                      px: 2,
                      py: 0.75,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: formData.diasAtendimento.includes(dia.id)
                        ? '#1D4ED8'
                        : 'transparent',
                      borderColor: formData.diasAtendimento.includes(dia.id)
                        ? '#1D4ED8'
                        : 'rgba(0, 0, 0, 0.2)',
                      color: formData.diasAtendimento.includes(dia.id)
                        ? '#FFFFFF'
                        : '#374151',
                      '&:hover': {
                        backgroundColor: formData.diasAtendimento.includes(dia.id)
                          ? '#1E40AF'
                          : 'rgba(29, 78, 216, 0.04)',
                        borderColor: '#1D4ED8',
                      },
                    }}
                  >
                    {dia.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Horários */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}
              >
                Horário de Atendimento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Início</InputLabel>
                    <Select
                      value={formData.horarioInicio}
                      onChange={handleChange('horarioInicio')}
                      label="Início"
                      sx={{ borderRadius: '10px' }}
                    >
                      {HORARIOS.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Término</InputLabel>
                    <Select
                      value={formData.horarioFim}
                      onChange={handleChange('horarioFim')}
                      label="Término"
                      sx={{ borderRadius: '10px' }}
                    >
                      {HORARIOS.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Duração da consulta */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}
              >
                Duração Padrão da Consulta
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.duracaoConsulta}
                  onChange={handleChange('duracaoConsulta')}
                  sx={{ borderRadius: '10px' }}
                  startAdornment={
                    <Clock size={16} style={{ marginRight: 8, color: '#6B7280' }} />
                  }
                >
                  <MenuItem value={15}>15 minutos</MenuItem>
                  <MenuItem value={20}>20 minutos</MenuItem>
                  <MenuItem value={30}>30 minutos</MenuItem>
                  <MenuItem value={45}>45 minutos</MenuItem>
                  <MenuItem value={60}>1 hora</MenuItem>
                  <MenuItem value={90}>1 hora e 30 minutos</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Intervalo de almoço */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.intervaloAlmoco}
                    onChange={handleChange('intervaloAlmoco')}
                    sx={{
                      color: '#1D4ED8',
                      '&.Mui-checked': { color: '#1D4ED8' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                    Adicionar intervalo de almoço
                  </Typography>
                }
              />

              {formData.intervaloAlmoco && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Início</InputLabel>
                      <Select
                        value={formData.horarioAlmocoInicio}
                        onChange={handleChange('horarioAlmocoInicio')}
                        label="Início"
                        sx={{ borderRadius: '10px' }}
                      >
                        {HORARIOS.map(h => (
                          <MenuItem key={h} value={h}>{h}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Término</InputLabel>
                      <Select
                        value={formData.horarioAlmocoFim}
                        onChange={handleChange('horarioAlmocoFim')}
                        label="Término"
                        sx={{ borderRadius: '10px' }}
                      >
                        {HORARIOS.map(h => (
                          <MenuItem key={h} value={h}>{h}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* Info box */}
            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                backgroundColor: 'rgba(29, 78, 216, 0.04)',
                border: '1px solid rgba(29, 78, 216, 0.1)',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <CheckCircle size={18} color="#1D4ED8" style={{ marginTop: 2 }} />
                <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.5 }}>
                  Você pode ajustar esses horários a qualquer momento
                  nas configurações da agenda.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            pt: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            variant="text"
            onClick={handleSkip}
            disabled={loading}
            sx={{
              textTransform: 'none',
              color: '#6B7280',
              fontWeight: 500,
            }}
          >
            Configurar depois
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              px: 4,
              py: 1,
              backgroundColor: '#1D4ED8',
              boxShadow: '0 2px 8px rgba(29, 78, 216, 0.2)',
              '&:hover': {
                backgroundColor: '#1E40AF',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
