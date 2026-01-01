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
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { SwapHoriz as TransferIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useContasBancarias, useMovimentacoesBancarias } from '../../hooks/useFinancial';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export default function TransferenciaDialog({
  open,
  onClose,
  contaOrigem = null,
  onSuccess,
}) {
  const { contas, loading: loadingContas } = useContasBancarias();
  const { createTransferencia, saving, error: saveError } = useMovimentacoesBancarias({ autoLoad: false });

  const [formData, setFormData] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: '',
    dataMovimentacao: dayjs(),
    descricao: '',
  });

  const [errors, setErrors] = useState({});

  // Set initial conta origem if provided
  useEffect(() => {
    if (contaOrigem) {
      setFormData((prev) => ({ ...prev, contaOrigemId: contaOrigem.id }));
    } else {
      resetForm();
    }
  }, [contaOrigem, open]);

  const resetForm = () => {
    setFormData({
      contaOrigemId: '',
      contaDestinoId: '',
      valor: '',
      dataMovimentacao: dayjs(),
      descricao: '',
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

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dataMovimentacao: date }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.contaOrigemId) {
      newErrors.contaOrigemId = 'Selecione a conta de origem';
    }

    if (!formData.contaDestinoId) {
      newErrors.contaDestinoId = 'Selecione a conta de destino';
    }

    if (formData.contaOrigemId === formData.contaDestinoId) {
      newErrors.contaDestinoId = 'Conta de destino deve ser diferente da origem';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    // Check if origin account has sufficient balance
    const contaOrigem = contas.find((c) => c.id === formData.contaOrigemId);
    if (contaOrigem && parseFloat(formData.valor) > (contaOrigem.saldoAtual || 0)) {
      newErrors.valor = 'Saldo insuficiente na conta de origem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      contaOrigemId: formData.contaOrigemId,
      contaDestinoId: formData.contaDestinoId,
      valor: parseFloat(formData.valor),
      dataMovimentacao: formData.dataMovimentacao.format('YYYY-MM-DD'),
      descricao: formData.descricao?.trim() || null,
    };

    try {
      await createTransferencia(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating transfer:', err);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get selected accounts for display
  const contaOrigemSelected = contas.find((c) => c.id === formData.contaOrigemId);
  const contaDestinoSelected = contas.find((c) => c.id === formData.contaDestinoId);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransferIcon color="primary" />
            Transferencia entre Contas
          </Box>
        </DialogTitle>

        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Conta Origem */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!errors.contaOrigemId}>
                <InputLabel>Conta de Origem</InputLabel>
                <Select
                  value={formData.contaOrigemId}
                  onChange={handleChange('contaOrigemId')}
                  label="Conta de Origem"
                  disabled={loadingContas}
                >
                  {contas.map((conta) => (
                    <MenuItem key={conta.id} value={conta.id}>
                      {conta.descricao || `${conta.banco} - ${conta.conta}`} ({formatCurrency(conta.saldoAtual)})
                    </MenuItem>
                  ))}
                </Select>
                {errors.contaOrigemId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.contaOrigemId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Visual Transfer Indicator */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <TransferIcon sx={{ fontSize: 32, color: 'primary.main', transform: 'rotate(90deg)' }} />
              </Box>
            </Grid>

            {/* Conta Destino */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!errors.contaDestinoId}>
                <InputLabel>Conta de Destino</InputLabel>
                <Select
                  value={formData.contaDestinoId}
                  onChange={handleChange('contaDestinoId')}
                  label="Conta de Destino"
                  disabled={loadingContas}
                >
                  {contas
                    .filter((c) => c.id !== formData.contaOrigemId)
                    .map((conta) => (
                      <MenuItem key={conta.id} value={conta.id}>
                        {conta.descricao || `${conta.banco} - ${conta.conta}`} ({formatCurrency(conta.saldoAtual)})
                      </MenuItem>
                    ))}
                </Select>
                {errors.contaDestinoId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.contaDestinoId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* Valor */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Valor"
                value={formData.valor}
                onChange={handleChange('valor')}
                fullWidth
                size="small"
                type="number"
                required
                error={!!errors.valor}
                helperText={errors.valor}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Data */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Data"
                value={formData.dataMovimentacao}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Descricao */}
            <Grid item xs={12}>
              <TextField
                label="Descricao (opcional)"
                value={formData.descricao}
                onChange={handleChange('descricao')}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Ex: Transferencia para pagamento de fornecedor"
              />
            </Grid>

            {/* Preview */}
            {contaOrigemSelected && contaDestinoSelected && formData.valor && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Transferindo <strong>{formatCurrency(parseFloat(formData.valor))}</strong> de{' '}
                    <strong>{contaOrigemSelected.descricao || contaOrigemSelected.banco}</strong> para{' '}
                    <strong>{contaDestinoSelected.descricao || contaDestinoSelected.banco}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || loadingContas}
          >
            {saving ? <CircularProgress size={24} /> : 'Transferir'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
