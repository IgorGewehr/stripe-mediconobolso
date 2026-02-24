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
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useContasPagar, useFornecedores, useCategorias } from '../../hooks/useFinancial';

const TIPOS_DESPESA = [
  { value: 'fixa', label: 'Despesa Fixa' },
  { value: 'variavel', label: 'Despesa Variavel' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'tributo', label: 'Tributo' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'outros', label: 'Outros' },
];

const RECORRENCIAS = [
  { value: 'unica', label: 'Pagamento Unico' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export default function ContaPagarForm({
  open,
  onClose,
  contaToEdit = null,
  onSuccess,
}) {
  const { createConta, updateConta, saving, error: saveError } = useContasPagar({ autoLoad: false });
  const { fornecedores, loading: loadingFornecedores } = useFornecedores();
  const { categoriasDespesa, loading: loadingCategorias } = useCategorias({ tipo: 'despesa' });

  const [formData, setFormData] = useState({
    tipoDespesa: 'variavel',
    fornecedorId: null,
    fornecedorNome: '',
    descricao: '',
    valorOriginal: '',
    valorDesconto: '',
    valorAcrescimo: '',
    dataVencimento: dayjs(),
    dataCompetencia: dayjs(),
    recorrencia: 'unica',
    totalParcelas: 1,
    categoriaId: null,
    observacoes: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);

  // Load data when editing
  useEffect(() => {
    if (contaToEdit) {
      setFormData({
        tipoDespesa: contaToEdit.tipoDespesa || 'variavel',
        fornecedorId: contaToEdit.fornecedorId || null,
        fornecedorNome: contaToEdit.fornecedorNome || '',
        descricao: contaToEdit.descricao || '',
        valorOriginal: contaToEdit.valorOriginal?.toString() || '',
        valorDesconto: contaToEdit.valorDesconto?.toString() || '',
        valorAcrescimo: contaToEdit.valorAcrescimo?.toString() || '',
        dataVencimento: contaToEdit.dataVencimento ? dayjs(contaToEdit.dataVencimento) : dayjs(),
        dataCompetencia: contaToEdit.dataCompetencia ? dayjs(contaToEdit.dataCompetencia) : dayjs(),
        recorrencia: contaToEdit.recorrencia || 'unica',
        totalParcelas: contaToEdit.totalParcelas || 1,
        categoriaId: contaToEdit.categoriaId || null,
        observacoes: contaToEdit.observacoes || '',
      });

      if (contaToEdit.fornecedorId) {
        const fornecedor = fornecedores.find(f => f.id === contaToEdit.fornecedorId);
        setSelectedFornecedor(fornecedor || null);
      }
    } else {
      resetForm();
    }
  }, [contaToEdit, open, fornecedores]);

  const resetForm = () => {
    setFormData({
      tipoDespesa: 'variavel',
      fornecedorId: null,
      fornecedorNome: '',
      descricao: '',
      valorOriginal: '',
      valorDesconto: '',
      valorAcrescimo: '',
      dataVencimento: dayjs(),
      dataCompetencia: dayjs(),
      recorrencia: 'unica',
      totalParcelas: 1,
      categoriaId: null,
      observacoes: '',
    });
    setSelectedFornecedor(null);
    setErrors({});
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFornecedorChange = (event, newValue) => {
    setSelectedFornecedor(newValue);
    setFormData((prev) => ({
      ...prev,
      fornecedorId: newValue?.id || null,
      fornecedorNome: newValue?.nome || '',
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.descricao?.trim()) {
      newErrors.descricao = 'Descricao e obrigatoria';
    }

    if (!formData.valorOriginal || parseFloat(formData.valorOriginal) <= 0) {
      newErrors.valorOriginal = 'Valor deve ser maior que zero';
    }

    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento e obrigatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      tipoDespesa: formData.tipoDespesa,
      fornecedorId: formData.fornecedorId,
      fornecedorNome: formData.fornecedorNome || null,
      descricao: formData.descricao.trim(),
      valorOriginal: parseFloat(formData.valorOriginal),
      valorDesconto: formData.valorDesconto ? parseFloat(formData.valorDesconto) : 0,
      valorAcrescimo: formData.valorAcrescimo ? parseFloat(formData.valorAcrescimo) : 0,
      dataVencimento: formData.dataVencimento.format('YYYY-MM-DD'),
      dataCompetencia: formData.dataCompetencia?.format('YYYY-MM-DD'),
      recorrencia: formData.recorrencia,
      totalParcelas: formData.recorrencia !== 'unica' ? formData.totalParcelas : 1,
      categoriaId: formData.categoriaId,
      observacoes: formData.observacoes?.trim() || null,
    };

    try {
      if (contaToEdit) {
        await updateConta(contaToEdit.id, payload);
      } else {
        await createConta(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving conta:', err);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate valor liquido
  const valorOriginal = parseFloat(formData.valorOriginal) || 0;
  const valorDesconto = parseFloat(formData.valorDesconto) || 0;
  const valorAcrescimo = parseFloat(formData.valorAcrescimo) || 0;
  const valorLiquido = valorOriginal - valorDesconto + valorAcrescimo;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {contaToEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
        </DialogTitle>

        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Tipo Despesa */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Despesa</InputLabel>
                <Select
                  value={formData.tipoDespesa}
                  onChange={handleChange('tipoDespesa')}
                  label="Tipo de Despesa"
                >
                  {TIPOS_DESPESA.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fornecedor */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={fornecedores}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.nomeFantasia || option.razaoSocial || option.nome || '';
                }}
                value={selectedFornecedor}
                onChange={handleFornecedorChange}
                loading={loadingFornecedores}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.nomeFantasia || option.razaoSocial}
                    {option.nomeFantasia && option.razaoSocial && (
                      <span style={{ marginLeft: 8, color: '#666', fontSize: '0.85em' }}>
                        ({option.razaoSocial})
                      </span>
                    )}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fornecedor"
                    size="small"
                    placeholder="Selecione ou digite"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingFornecedores && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                freeSolo
                onInputChange={(event, value, reason) => {
                  if (reason === 'input') {
                    setFormData((prev) => ({ ...prev, fornecedorNome: value }));
                  }
                }}
              />
            </Grid>

            {/* Descricao */}
            <Grid item xs={12}>
              <TextField
                label="Descricao"
                value={formData.descricao}
                onChange={handleChange('descricao')}
                fullWidth
                size="small"
                required
                error={!!errors.descricao}
                helperText={errors.descricao}
                placeholder="Ex: Aluguel do consultorio"
              />
            </Grid>

            {/* Valor Original */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Valor"
                value={formData.valorOriginal}
                onChange={handleChange('valorOriginal')}
                fullWidth
                size="small"
                type="number"
                required
                error={!!errors.valorOriginal}
                helperText={errors.valorOriginal}
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
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Acrescimo */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Acrescimo/Juros"
                value={formData.valorAcrescimo}
                onChange={handleChange('valorAcrescimo')}
                fullWidth
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Valor Liquido (readonly) */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Valor Liquido"
                value={valorLiquido.toFixed(2)}
                fullWidth
                size="small"
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Data Vencimento */}
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Data Vencimento"
                value={formData.dataVencimento}
                onChange={handleDateChange('dataVencimento')}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    required: true,
                    error: !!errors.dataVencimento,
                    helperText: errors.dataVencimento,
                  },
                }}
              />
            </Grid>

            {/* Data Competencia */}
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Data Competencia"
                value={formData.dataCompetencia}
                onChange={handleDateChange('dataCompetencia')}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {/* Recorrencia */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Recorrencia</InputLabel>
                <Select
                  value={formData.recorrencia}
                  onChange={handleChange('recorrencia')}
                  label="Recorrencia"
                >
                  {RECORRENCIAS.map((rec) => (
                    <MenuItem key={rec.value} value={rec.value}>
                      {rec.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Total Parcelas */}
            {formData.recorrencia !== 'unica' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Numero de Parcelas"
                  value={formData.totalParcelas}
                  onChange={handleChange('totalParcelas')}
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 1, max: 60 }}
                />
              </Grid>
            )}

            {/* Categoria */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoriaId || ''}
                  onChange={handleChange('categoriaId')}
                  label="Categoria"
                >
                  <MenuItem value="">Sem categoria</MenuItem>
                  {categoriasDespesa.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Observacoes */}
            <Grid item xs={12}>
              <TextField
                label="Observacoes"
                value={formData.observacoes}
                onChange={handleChange('observacoes')}
                fullWidth
                size="small"
                multiline
                rows={2}
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
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : contaToEdit ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
