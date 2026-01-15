'use client';

import { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useContasReceber, useCategorias } from '../../hooks/useFinancial';
import { OrigemContaReceber } from '@/lib/services/api/financial.service';

const initialFormData = {
  origem: 'particular',
  pacienteId: '',
  profissionalId: '',
  convenioId: '',
  descricao: '',
  valorBruto: '',
  valorDesconto: '',
  valorAcrescimo: '',
  dataVencimento: null,
  dataCompetencia: null,
  categoriaId: '',
  emitirNfse: false,
  observacoes: '',
  // Campos NFSe (quando emitirNfse = true)
  nfseCodigoServico: '06.01', // Código padrão para serviços médicos
  nfseAliquotaIss: '2',
  nfseDiscriminacao: '',
};

export default function ContaReceberForm({
  open,
  onClose,
  contaToEdit = null,
  onSuccess,
  pacientes = [],
  convenios = [],
  profissionais = [],
}) {
  const { createConta, updateConta, saving } = useContasReceber({ autoLoad: false });
  const { categorias, loading: loadingCategorias } = useCategorias({ tipo: 'receita' });

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const isEditing = Boolean(contaToEdit);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (contaToEdit) {
      setFormData({
        origem: contaToEdit.origem || 'particular',
        pacienteId: contaToEdit.pacienteId || '',
        profissionalId: contaToEdit.profissionalId || '',
        convenioId: contaToEdit.convenioId || '',
        descricao: contaToEdit.descricao || '',
        valorBruto: contaToEdit.valorBruto?.toString() || '',
        valorDesconto: contaToEdit.valorDesconto?.toString() || '',
        valorAcrescimo: contaToEdit.valorAcrescimo?.toString() || '',
        dataVencimento: contaToEdit.dataVencimento ? dayjs(contaToEdit.dataVencimento) : null,
        dataCompetencia: contaToEdit.dataCompetencia ? dayjs(contaToEdit.dataCompetencia) : null,
        categoriaId: contaToEdit.categoriaId || '',
        emitirNfse: contaToEdit.emitirNfse || false,
        observacoes: contaToEdit.observacoes || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setSubmitError(null);
  }, [contaToEdit, open]);

  // Handle field change
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Handle date change
  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Calculate net value
  const valorLiquido = () => {
    const bruto = parseFloat(formData.valorBruto) || 0;
    const desconto = parseFloat(formData.valorDesconto) || 0;
    const acrescimo = parseFloat(formData.valorAcrescimo) || 0;
    return bruto - desconto + acrescimo;
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valorBruto || parseFloat(formData.valorBruto) <= 0) {
      newErrors.valorBruto = 'Valor deve ser maior que zero';
    }

    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    }

    if (formData.origem === 'guia_convenio' && !formData.convenioId) {
      newErrors.convenioId = 'Convênio é obrigatório para esta origem';
    }

    // Validação NFSe
    if (formData.emitirNfse) {
      if (!formData.pacienteId) {
        newErrors.pacienteId = 'Paciente é obrigatório para emissão de NFSe';
      }
      if (!formData.nfseAliquotaIss || parseFloat(formData.nfseAliquotaIss) <= 0) {
        newErrors.nfseAliquotaIss = 'Alíquota ISS deve ser maior que zero';
      }
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
        origem: formData.origem,
        descricao: formData.descricao,
        valorBruto: parseFloat(formData.valorBruto),
        dataVencimento: formData.dataVencimento.format('YYYY-MM-DD'),
      };

      if (formData.pacienteId) data.pacienteId = formData.pacienteId;
      if (formData.profissionalId) data.profissionalId = formData.profissionalId;
      if (formData.convenioId) data.convenioId = formData.convenioId;
      if (formData.valorDesconto) data.valorDesconto = parseFloat(formData.valorDesconto);
      if (formData.valorAcrescimo) data.valorAcrescimo = parseFloat(formData.valorAcrescimo);
      if (formData.dataCompetencia) {
        data.dataCompetencia = formData.dataCompetencia.format('YYYY-MM-DD');
      }
      if (formData.categoriaId) data.categoriaId = formData.categoriaId;
      data.emitirNfse = formData.emitirNfse;
      if (formData.observacoes) data.observacoes = formData.observacoes;

      // Dados específicos NFSe (quando emitirNfse = true)
      if (formData.emitirNfse) {
        data.nfseCodigoServico = formData.nfseCodigoServico;
        data.nfseAliquotaIss = parseFloat(formData.nfseAliquotaIss);
        data.nfseDiscriminacao = formData.nfseDiscriminacao || formData.descricao;
      }

      if (isEditing) {
        await updateConta(contaToEdit.id, data);
      } else {
        await createConta(data);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving conta:', err);
      setSubmitError(err.message || 'Erro ao salvar conta a receber');
    }
  };

  // Handle close
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' },
        }}
      >
        <DialogTitle>
          {isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
        </DialogTitle>

        <DialogContent dividers>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Origem */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Origem</InputLabel>
                <Select
                  value={formData.origem}
                  label="Origem"
                  onChange={handleChange('origem')}
                  disabled={isEditing}
                >
                  <MenuItem value="particular">Particular</MenuItem>
                  <MenuItem value="consulta">Consulta</MenuItem>
                  <MenuItem value="procedimento">Procedimento</MenuItem>
                  <MenuItem value="guia_convenio">Guia Convênio/TISS</MenuItem>
                  <MenuItem value="exame">Exame</MenuItem>
                  <MenuItem value="pacote">Pacote</MenuItem>
                  <MenuItem value="retorno">Retorno</MenuItem>
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="outros">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Forma de Pagamento - Adicionado conforme solicitação */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select
                  value={formData.formaPagamento || 'dinheiro'}
                  label="Forma de Pagamento"
                  onChange={handleChange('formaPagamento')}
                >
                  <MenuItem value="dinheiro">Dinheiro</MenuItem>
                  <MenuItem value="pix">Pix</MenuItem>
                  <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                  <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                  <MenuItem value="boleto">Boleto</MenuItem>
                  <MenuItem value="transferencia">Transferência</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Convênio (only for guia_convenio origem) */}
            {formData.origem === 'guia_convenio' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.convenioId)}>
                  <InputLabel>Convênio</InputLabel>
                  <Select
                    value={formData.convenioId}
                    label="Convênio"
                    onChange={handleChange('convenioId')}
                  >
                    {convenios.map((conv) => (
                      <MenuItem key={conv.id} value={conv.id}>
                        {conv.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Paciente */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Paciente</InputLabel>
                <Select
                  value={formData.pacienteId}
                  label="Paciente"
                  onChange={handleChange('pacienteId')}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {pacientes.map((pac) => (
                    <MenuItem key={pac.id} value={pac.id}>
                      {pac.name || pac.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Profissional */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Profissional</InputLabel>
                <Select
                  value={formData.profissionalId}
                  label="Profissional"
                  onChange={handleChange('profissionalId')}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {profissionais.map((prof) => (
                    <MenuItem key={prof.id} value={prof.id}>
                      {prof.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={formData.descricao}
                onChange={handleChange('descricao')}
                fullWidth
                required
                error={Boolean(errors.descricao)}
                helperText={errors.descricao}
                placeholder="Descreva o serviço ou procedimento"
              />
            </Grid>

            {/* Valores */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Valor Bruto"
                value={formData.valorBruto}
                onChange={handleChange('valorBruto')}
                fullWidth
                required
                type="number"
                error={Boolean(errors.valorBruto)}
                helperText={errors.valorBruto}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

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

            <Grid item xs={12} sm={4}>
              <TextField
                label="Acréscimo"
                value={formData.valorAcrescimo}
                onChange={handleChange('valorAcrescimo')}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Valor Líquido (calculated) */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.lighter',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="subtitle1">Valor Líquido:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(valorLiquido())}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Datas */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Data de Vencimento *"
                value={formData.dataVencimento}
                onChange={handleDateChange('dataVencimento')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.dataVencimento),
                    helperText: errors.dataVencimento,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Data de Competência"
                value={formData.dataCompetencia}
                onChange={handleDateChange('dataCompetencia')}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>

            {/* Categoria */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoriaId}
                  label="Categoria"
                  onChange={handleChange('categoriaId')}
                  disabled={loadingCategorias}
                >
                  <MenuItem value="">
                    <em>Nenhuma</em>
                  </MenuItem>
                  {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.codigo} - {cat.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* NFSe toggle */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.emitirNfse}
                    onChange={handleChange('emitirNfse')}
                  />
                }
                label="Emitir NFSe automaticamente"
              />
            </Grid>

            {/* Campos NFSe (somente quando emitirNfse está ativo) */}
            {formData.emitirNfse && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="caption" color="text.secondary">
                      Dados para NFSe
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Código do Serviço</InputLabel>
                    <Select
                      value={formData.nfseCodigoServico}
                      label="Código do Serviço"
                      onChange={handleChange('nfseCodigoServico')}
                    >
                      <MenuItem value="06.01">06.01 - Medicina e biomedicina</MenuItem>
                      <MenuItem value="06.02">06.02 - Análises clínicas</MenuItem>
                      <MenuItem value="06.03">06.03 - Hospitais e clínicas</MenuItem>
                      <MenuItem value="06.04">06.04 - Instrumentação cirúrgica</MenuItem>
                      <MenuItem value="06.05">06.05 - Acupuntura e fisioterapia</MenuItem>
                      <MenuItem value="06.06">06.06 - Ambulância e UTI móvel</MenuItem>
                      <MenuItem value="06.07">06.07 - Banco de sangue/órgãos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Alíquota ISS (%)"
                    value={formData.nfseAliquotaIss}
                    onChange={handleChange('nfseAliquotaIss')}
                    fullWidth
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Consulte a alíquota do seu município"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Discriminação dos Serviços"
                    value={formData.nfseDiscriminacao}
                    onChange={handleChange('nfseDiscriminacao')}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Descreva os serviços prestados (será exibido na NFSe)"
                    helperText="Se vazio, será usado a descrição da conta"
                  />
                </Grid>

                {!formData.pacienteId && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Para emitir NFSe, é necessário selecionar um paciente (tomador do serviço).
                    </Alert>
                  </Grid>
                )}
              </>
            )}

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                label="Observações"
                value={formData.observacoes}
                onChange={handleChange('observacoes')}
                fullWidth
                multiline
                rows={3}
                placeholder="Observações adicionais..."
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
            startIcon={saving && <CircularProgress size={20} />}
          >
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
