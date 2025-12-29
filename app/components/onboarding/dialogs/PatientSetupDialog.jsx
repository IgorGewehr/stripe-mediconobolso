"use client";

/**
 * PatientSetupDialog Component
 * Dialog para adicionar primeiro paciente no onboarding
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
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { X, UserPlus, CheckCircle, AlertCircle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export default function PatientSetupDialog({
  open,
  onClose,
  onComplete,
  onSkip,
}) {
  const [mode, setMode] = useState('select'); // 'select' | 'manual' | 'import'

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    email: '',
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
    if (!formData.nomeCompleto.trim()) {
      setError('Nome completo é obrigatório');
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
      // await createPatient(formData);

      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete();
    } catch (err) {
      console.error('[PatientSetup] Erro ao salvar:', err);
      setError('Erro ao cadastrar paciente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    onClose();
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'import') {
      // Aqui você poderia abrir um file picker ou redirecionar para importação
      // Por enquanto, vamos apenas completar o passo
      onComplete();
    }
  };

  // Renderiza a seleção de modo
  const renderModeSelection = () => (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        {/* Opção: Cadastrar manualmente */}
        <MotionCard
          whileHover={{ y: -2 }}
          sx={{
            cursor: 'pointer',
            border: '1px solid rgba(29, 78, 216, 0.2)',
            borderRadius: '12px',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'rgba(29, 78, 216, 0.4)',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.1)',
            },
          }}
          onClick={() => handleSelectMode('manual')}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(29, 78, 216, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={22} color="#1D4ED8" />
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
                      Cadastrar Manualmente
                    </Typography>
                    <Chip
                      label="Recomendado"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(29, 78, 216, 0.1)',
                        color: '#1D4ED8',
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Adicione os dados do paciente agora
                  </Typography>
                </Box>
              </Stack>
              <ArrowRight size={20} color="#6B7280" />
            </Stack>
          </CardContent>
        </MotionCard>

        {/* Opção: Importar planilha */}
        <MotionCard
          whileHover={{ y: -2 }}
          sx={{
            cursor: 'pointer',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'rgba(16, 185, 129, 0.4)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            },
          }}
          onClick={() => handleSelectMode('import')}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileSpreadsheet size={22} color="#10b981" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
                    Importar Planilha
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Importe vários pacientes de uma vez
                  </Typography>
                </Box>
              </Stack>
              <ArrowRight size={20} color="#6B7280" />
            </Stack>
          </CardContent>
        </MotionCard>

        <Button
          variant="text"
          onClick={handleSkip}
          sx={{
            textTransform: 'none',
            color: '#9CA3AF',
            mt: 1,
          }}
        >
          Fazer isso depois
        </Button>
      </Stack>
    </Box>
  );

  // Renderiza o formulário manual
  const renderManualForm = () => (
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
          value={formData.nomeCompleto}
          onChange={handleChange('nomeCompleto')}
          fullWidth
          required
          placeholder="Maria da Silva"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Data de Nascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleChange('dataNascimento')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Sexo</InputLabel>
              <Select
                value={formData.sexo}
                onChange={handleChange('sexo')}
                label="Sexo"
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
                <MenuItem value="O">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TextField
          label="Telefone"
          value={formData.telefone}
          onChange={handleChange('telefone')}
          fullWidth
          placeholder="(11) 99999-9999"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        />

        <TextField
          label="E-mail"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          fullWidth
          placeholder="paciente@email.com"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        />

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
              Você poderá adicionar mais informações como histórico médico,
              alergias e convênio depois no cadastro completo.
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

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
                <UserPlus size={24} color="#1D4ED8" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                  {mode === 'select' ? 'Adicionar Paciente' : 'Novo Paciente'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {mode === 'select'
                    ? 'Como deseja adicionar?'
                    : 'Preencha os dados básicos'}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} sx={{ color: '#6B7280' }}>
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        {/* Conteúdo */}
        {mode === 'select' ? renderModeSelection() : renderManualForm()}

        {/* Footer (apenas no modo manual) */}
        {mode === 'manual' && (
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
              onClick={() => setMode('select')}
              disabled={loading}
              sx={{
                textTransform: 'none',
                color: '#6B7280',
                fontWeight: 500,
              }}
            >
              Voltar
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
                'Cadastrar Paciente'
              )}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
