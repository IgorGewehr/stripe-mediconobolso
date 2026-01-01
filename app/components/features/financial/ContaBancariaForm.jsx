'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { useContasBancarias } from '../../hooks/useFinancial';
import { useFeedback, StyledInput, CurrencyInput, LoadingButton } from '../../ui/feedback';

const TIPOS_CONTA = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Conta Poupanca' },
  { value: 'investimento', label: 'Conta Investimento' },
  { value: 'caixa', label: 'Caixa' },
];

const BANCOS = [
  'Banco do Brasil',
  'Bradesco',
  'Caixa Economica',
  'Itau',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'BTG Pactual',
  'Sicoob',
  'Sicredi',
  'Outro',
];

export default function ContaBancariaForm({
  open,
  onClose,
  contaToEdit = null,
  onSuccess,
}) {
  const { createConta, updateConta, saving, error: saveError } = useContasBancarias({ autoLoad: false });
  const { success, error: showError } = useFeedback();

  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'corrente',
    descricao: '',
    saldoInicial: '',
  });

  const [errors, setErrors] = useState({});

  // Load data when editing
  useEffect(() => {
    if (contaToEdit) {
      setFormData({
        banco: contaToEdit.banco || '',
        agencia: contaToEdit.agencia || '',
        conta: contaToEdit.conta || '',
        tipoConta: contaToEdit.tipoConta || 'corrente',
        descricao: contaToEdit.descricao || '',
        saldoInicial: contaToEdit.saldoInicial?.toString() || '',
      });
    } else {
      resetForm();
    }
  }, [contaToEdit, open]);

  const resetForm = () => {
    setFormData({
      banco: '',
      agencia: '',
      conta: '',
      tipoConta: 'corrente',
      descricao: '',
      saldoInicial: '',
    });
    setErrors({});
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.banco?.trim()) {
      newErrors.banco = 'Banco e obrigatorio';
    }

    if (!formData.agencia?.trim()) {
      newErrors.agencia = 'Agencia e obrigatoria';
    }

    if (!formData.conta?.trim()) {
      newErrors.conta = 'Conta e obrigatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      banco: formData.banco.trim(),
      agencia: formData.agencia.trim(),
      conta: formData.conta.trim(),
      tipoConta: formData.tipoConta,
      descricao: formData.descricao?.trim() || null,
      saldoInicial: formData.saldoInicial ? parseFloat(formData.saldoInicial.replace(/\./g, '').replace(',', '.')) : 0,
    };

    try {
      if (contaToEdit) {
        await updateConta(contaToEdit.id, payload);
        success('Conta atualizada!', {
          description: 'As informações da conta foram salvas.'
        });
      } else {
        await createConta(payload);
        success('Conta criada!', {
          description: 'A nova conta bancária foi adicionada.'
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving conta bancaria:', err);
      showError('Erro ao salvar', {
        description: err.message || 'Tente novamente.'
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        fontWeight: 600,
        fontSize: '18px',
        color: '#111E5A'
      }}>
        {contaToEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
          {contaToEdit
            ? 'Atualize as informações da conta bancária.'
            : 'Adicione uma nova conta para gerenciar suas finanças.'}
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <FormControl
              fullWidth
              error={!!errors.banco}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            >
              <InputLabel>Banco</InputLabel>
              <Select
                value={formData.banco}
                onChange={handleChange('banco')}
                label="Banco"
              >
                {BANCOS.map((banco) => (
                  <MenuItem key={banco} value={banco}>{banco}</MenuItem>
                ))}
              </Select>
              {errors.banco && (
                <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5, ml: 1 }}>
                  {errors.banco}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            >
              <InputLabel>Tipo de Conta</InputLabel>
              <Select
                value={formData.tipoConta}
                onChange={handleChange('tipoConta')}
                label="Tipo de Conta"
              >
                {TIPOS_CONTA.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledInput
              label="Agência"
              value={formData.agencia}
              onChange={handleChange('agencia')}
              required
              error={!!errors.agencia}
              helperText={errors.agencia}
              placeholder="0000"
            />
          </Grid>

          <Grid item xs={12}>
            <StyledInput
              label="Número da Conta"
              value={formData.conta}
              onChange={handleChange('conta')}
              required
              error={!!errors.conta}
              helperText={errors.conta}
              placeholder="00000-0"
            />
          </Grid>

          <Grid item xs={12}>
            <StyledInput
              label="Descrição (opcional)"
              value={formData.descricao}
              onChange={handleChange('descricao')}
              placeholder="Ex: Conta principal da clínica"
            />
          </Grid>

          {!contaToEdit && (
            <Grid item xs={12}>
              <CurrencyInput
                label="Saldo Inicial"
                value={formData.saldoInicial}
                onChange={handleChange('saldoInicial')}
                helperText="Deixe em branco ou 0 para iniciar sem saldo"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 500,
            color: '#666',
            px: 3,
          }}
        >
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={saving}
          loadingText={contaToEdit ? 'Salvando...' : 'Criando...'}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            boxShadow: '0 2px 8px rgba(24, 82, 254, 0.25)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(24, 82, 254, 0.35)',
            }
          }}
        >
          {contaToEdit ? 'Salvar' : 'Criar Conta'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
