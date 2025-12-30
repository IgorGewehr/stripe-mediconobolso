'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useContasPagar } from '../../hooks/useFinancial';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Payment method labels
const formasPagamentoLabels = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  transferencia: 'Transferencia',
  boleto: 'Boleto',
  cheque: 'Cheque',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  debito_automatico: 'Debito Automatico',
};

const initialFormData = {
  valor: '',
  valorJuros: '',
  valorMulta: '',
  valorDesconto: '',
  formaPagamento: 'pix',
  dataPagamento: dayjs(),
  observacoes: '',
};

export default function PagamentoDialog({
  open,
  onClose,
  conta,
  onSuccess,
}) {
  const { registrarPagamento, saving } = useContasPagar({ autoLoad: false });

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && conta) {
      setFormData({
        ...initialFormData,
        valor: conta.valorPendente?.toString() || '',
        dataPagamento: dayjs(),
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, conta]);

  // Handle field change
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dataPagamento: date }));
  };

  // Calculate total value
  const valorTotal = useMemo(() => {
    const valor = parseFloat(formData.valor) || 0;
    const juros = parseFloat(formData.valorJuros) || 0;
    const multa = parseFloat(formData.valorMulta) || 0;
    const desconto = parseFloat(formData.valorDesconto) || 0;
    return valor + juros + multa - desconto;
  }, [formData.valor, formData.valorJuros, formData.valorMulta, formData.valorDesconto]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (parseFloat(formData.valor) > (conta?.valorPendente || 0)) {
      newErrors.valor = 'Valor nao pode ser maior que o pendente';
    }

    if (!formData.formaPagamento) {
      newErrors.formaPagamento = 'Forma de pagamento e obrigatoria';
    }

    if (!formData.dataPagamento) {
      newErrors.dataPagamento = 'Data e obrigatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitError(null);

    try {
      const data = {
        valor: parseFloat(formData.valor),
        formaPagamento: formData.formaPagamento,
        dataPagamento: formData.dataPagamento.format('YYYY-MM-DD'),
      };

      if (formData.valorJuros) data.valorJuros = parseFloat(formData.valorJuros);
      if (formData.valorMulta) data.valorMulta = parseFloat(formData.valorMulta);
      if (formData.valorDesconto) data.valorDesconto = parseFloat(formData.valorDesconto);
      if (formData.observacoes) data.observacoes = formData.observacoes;

      await registrarPagamento(conta.id, data);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error registering payment:', err);
      setSubmitError(err.message || 'Erro ao registrar pagamento');
    }
  };

  // Handle close
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!conta) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar Pagamento</DialogTitle>

        <DialogContent dividers>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          {/* Conta Info */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Conta a Pagar
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {conta.descricao}
            </Typography>
            {conta.fornecedorNome && (
              <Typography variant="body2" color="text.secondary">
                Fornecedor: {conta.fornecedorNome}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Valor: ${formatCurrency(conta.valorLiquido)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Pendente: ${formatCurrency(conta.valorPendente)}`}
                size="small"
                color="error"
              />
              {conta.valorPago > 0 && (
                <Chip
                  label={`Pago: ${formatCurrency(conta.valorPago)}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Valor Principal */}
            <Grid item xs={12}>
              <TextField
                label="Valor do Pagamento"
                value={formData.valor}
                onChange={handleChange('valor')}
                fullWidth
                required
                type="number"
                error={Boolean(errors.valor)}
                helperText={errors.valor || `Maximo: ${formatCurrency(conta.valorPendente)}`}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Ajustes (opcional)
                </Typography>
              </Divider>
            </Grid>

            {/* Juros */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Juros"
                value={formData.valorJuros}
                onChange={handleChange('valorJuros')}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Multa */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Multa"
                value={formData.valorMulta}
                onChange={handleChange('valorMulta')}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Desconto */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Desconto"
                value={formData.valorDesconto}
                onChange={handleChange('valorDesconto')}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Valor Total */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'error.lighter',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="subtitle1">Total a Pagar:</Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {formatCurrency(valorTotal)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Forma de Pagamento */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.formaPagamento)}>
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select
                  value={formData.formaPagamento}
                  label="Forma de Pagamento"
                  onChange={handleChange('formaPagamento')}
                >
                  {Object.entries(formasPagamentoLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Data */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Data do Pagamento"
                value={formData.dataPagamento}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.dataPagamento),
                    helperText: errors.dataPagamento,
                  },
                }}
              />
            </Grid>

            {/* Observacoes */}
            <Grid item xs={12}>
              <TextField
                label="Observacoes"
                value={formData.observacoes}
                onChange={handleChange('observacoes')}
                fullWidth
                multiline
                rows={2}
                placeholder="Observacoes sobre o pagamento..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} />}
          >
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
