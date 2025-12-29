"use client";

/**
 * ProfileSetupDialog Component
 * Dialog para completar o perfil profissional no onboarding
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { X, UserCog, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/components/providers/authProvider';

const ESPECIALIDADES = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Geriatria',
  'Ginecologia e Obstetrícia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Urologia',
  'Clínica Geral',
  'Medicina de Família',
  'Outra',
];

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function ProfileSetupDialog({
  open,
  onClose,
  onComplete,
  onSkip,
}) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    crm: user?.crm || '',
    ufCrm: user?.ufCrm || '',
    especialidade: user?.especialidade || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (!formData.crm.trim()) {
      setError('CRM é obrigatório');
      return false;
    }
    if (!formData.ufCrm) {
      setError('UF do CRM é obrigatório');
      return false;
    }
    if (!formData.especialidade) {
      setError('Especialidade é obrigatória');
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
      // await updateUserProfile(formData);

      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete();
    } catch (err) {
      console.error('[ProfileSetup] Erro ao salvar:', err);
      setError('Erro ao salvar perfil. Tente novamente.');
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
                <UserCog size={24} color="#1D4ED8" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                  Complete seu Perfil
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Informações para emissão de documentos
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

            <TextField
              label="Nome Completo"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              fullWidth
              required
              placeholder="Dr. João da Silva"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  label="CRM"
                  value={formData.crm}
                  onChange={handleChange('crm')}
                  fullWidth
                  required
                  placeholder="123456"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth required>
                  <InputLabel>UF</InputLabel>
                  <Select
                    value={formData.ufCrm}
                    onChange={handleChange('ufCrm')}
                    label="UF"
                    sx={{ borderRadius: '10px' }}
                  >
                    {UF_OPTIONS.map(uf => (
                      <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel>Especialidade</InputLabel>
              <Select
                value={formData.especialidade}
                onChange={handleChange('especialidade')}
                label="Especialidade"
                sx={{ borderRadius: '10px' }}
              >
                {ESPECIALIDADES.map(esp => (
                  <MenuItem key={esp} value={esp}>{esp}</MenuItem>
                ))}
              </Select>
            </FormControl>

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
                  Essas informações serão usadas para gerar receitas,
                  atestados e outros documentos médicos.
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
              'Salvar e Continuar'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
