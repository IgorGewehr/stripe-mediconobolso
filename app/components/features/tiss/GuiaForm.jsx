'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import OperadoraSelect from './OperadoraSelect';
import TussAutocomplete from './TussAutocomplete';
import { useTiss } from '../../hooks/useTiss';

const TIPO_GUIA_OPTIONS = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'sadt', label: 'SP/SADT' },
  { value: 'internacao', label: 'Internação' },
  { value: 'honorarios', label: 'Honorários' },
];

const TIPO_CONSULTA_OPTIONS = [
  { value: '1', label: 'Primeira consulta' },
  { value: '2', label: 'Retorno' },
];

export default function GuiaForm({ guia, onSave, onCancel }) {
  const { createGuia, updateGuia, loading } = useTiss();
  const isEditing = !!guia?.id;

  const [formData, setFormData] = useState({
    tipo_guia: guia?.tipo_guia || 'consulta',
    operadora: guia?.operadora || null,
    beneficiario_id: guia?.beneficiario_id || null,
    data_atendimento: guia?.data_atendimento ? new Date(guia.data_atendimento) : new Date(),
    hora_inicial: guia?.hora_inicial ? new Date(`2000-01-01T${guia.hora_inicial}`) : null,
    hora_final: guia?.hora_final ? new Date(`2000-01-01T${guia.hora_final}`) : null,
    tipo_consulta: guia?.tipo_consulta || '1',
    cid_principal: guia?.cid_principal || '',
    cid_secundario: guia?.cid_secundario || '',
    indicacao_clinica: guia?.indicacao_clinica || '',
    numero_guia_operadora: guia?.numero_guia_operadora || '',
    senha_autorizacao: guia?.senha_autorizacao || '',
    observacoes: guia?.observacoes || '',
  });

  const [procedimentos, setProcedimentos] = useState(guia?.procedimentos || []);
  const [novoProcedimento, setNovoProcedimento] = useState({
    tuss: null,
    quantidade: 1,
    valor_unitario: '',
  });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target?.value ?? event,
    }));
  };

  const handleAddProcedimento = () => {
    if (!novoProcedimento.tuss) return;

    const proc = {
      id: Date.now(),
      codigo_tuss: novoProcedimento.tuss.codigo,
      descricao_procedimento: novoProcedimento.tuss.termo,
      quantidade: novoProcedimento.quantidade,
      valor_unitario: parseFloat(novoProcedimento.valor_unitario) || novoProcedimento.tuss.valor_referencia || 0,
      valor_total: (parseFloat(novoProcedimento.valor_unitario) || novoProcedimento.tuss.valor_referencia || 0) * novoProcedimento.quantidade,
    };

    setProcedimentos((prev) => [...prev, proc]);
    setNovoProcedimento({ tuss: null, quantidade: 1, valor_unitario: '' });
  };

  const handleRemoveProcedimento = (id) => {
    setProcedimentos((prev) => prev.filter((p) => p.id !== id));
  };

  const calcularValorTotal = () => {
    return procedimentos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      tipo_guia: formData.tipo_guia,
      operadora_id: formData.operadora?.id,
      beneficiario_id: formData.beneficiario_id,
      data_atendimento: formData.data_atendimento?.toISOString().split('T')[0],
      hora_inicial: formData.hora_inicial?.toTimeString().slice(0, 8),
      hora_final: formData.hora_final?.toTimeString().slice(0, 8),
      tipo_consulta: formData.tipo_consulta,
      cid_principal: formData.cid_principal,
      cid_secundario: formData.cid_secundario,
      indicacao_clinica: formData.indicacao_clinica,
      numero_guia_operadora: formData.numero_guia_operadora,
      senha_autorizacao: formData.senha_autorizacao,
      observacoes: formData.observacoes,
      procedimentos: procedimentos.map((p) => ({
        codigo_tuss: p.codigo_tuss,
        descricao_procedimento: p.descricao_procedimento,
        quantidade: p.quantidade,
        valor_unitario: p.valor_unitario,
      })),
    };

    try {
      if (isEditing) {
        await updateGuia(guia.id, data);
      } else {
        await createGuia(data);
      }
      onSave?.();
    } catch (err) {
      console.error('Erro ao salvar guia:', err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box component="form" onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {isEditing ? 'Editar Guia' : 'Nova Guia'}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Tipo de Guia */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Guia</InputLabel>
                  <Select
                    value={formData.tipo_guia}
                    label="Tipo de Guia"
                    onChange={handleChange('tipo_guia')}
                  >
                    {TIPO_GUIA_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Operadora */}
              <Grid item xs={12} md={8}>
                <OperadoraSelect
                  value={formData.operadora}
                  onChange={handleChange('operadora')}
                  required
                />
              </Grid>

              {/* Data e Hora */}
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Data do Atendimento"
                  value={formData.data_atendimento}
                  onChange={handleChange('data_atendimento')}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TimePicker
                  label="Hora Inicial"
                  value={formData.hora_inicial}
                  onChange={handleChange('hora_inicial')}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TimePicker
                  label="Hora Final"
                  value={formData.hora_final}
                  onChange={handleChange('hora_final')}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                />
              </Grid>

              {/* Tipo Consulta */}
              {formData.tipo_guia === 'consulta' && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Consulta</InputLabel>
                    <Select
                      value={formData.tipo_consulta}
                      label="Tipo de Consulta"
                      onChange={handleChange('tipo_consulta')}
                    >
                      {TIPO_CONSULTA_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* CID */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="CID Principal"
                  value={formData.cid_principal}
                  onChange={handleChange('cid_principal')}
                  fullWidth
                  placeholder="Ex: J18.9"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="CID Secundário"
                  value={formData.cid_secundario}
                  onChange={handleChange('cid_secundario')}
                  fullWidth
                />
              </Grid>

              {/* Indicação Clínica */}
              <Grid item xs={12}>
                <TextField
                  label="Indicação Clínica"
                  value={formData.indicacao_clinica}
                  onChange={handleChange('indicacao_clinica')}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Autorização */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número da Guia na Operadora"
                  value={formData.numero_guia_operadora}
                  onChange={handleChange('numero_guia_operadora')}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Senha de Autorização"
                  value={formData.senha_autorizacao}
                  onChange={handleChange('senha_autorizacao')}
                  fullWidth
                />
              </Grid>

              {/* Observações */}
              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  value={formData.observacoes}
                  onChange={handleChange('observacoes')}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Procedimentos */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Procedimentos
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Adicionar Procedimento */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <TussAutocomplete
                  value={novoProcedimento.tuss}
                  onChange={(value) => setNovoProcedimento((prev) => ({ ...prev, tuss: value }))}
                  label="Código TUSS"
                />
              </Box>
              <TextField
                label="Qtd"
                type="number"
                value={novoProcedimento.quantidade}
                onChange={(e) =>
                  setNovoProcedimento((prev) => ({
                    ...prev,
                    quantidade: parseInt(e.target.value) || 1,
                  }))
                }
                sx={{ width: 80 }}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Valor Unit."
                type="number"
                value={novoProcedimento.valor_unitario}
                onChange={(e) =>
                  setNovoProcedimento((prev) => ({ ...prev, valor_unitario: e.target.value }))
                }
                sx={{ width: 120 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProcedimento}
                disabled={!novoProcedimento.tuss}
              >
                Adicionar
              </Button>
            </Box>

            {/* Lista de Procedimentos */}
            {procedimentos.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="center">Qtd</TableCell>
                      <TableCell align="right">Valor Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {procedimentos.map((proc) => (
                      <TableRow key={proc.id}>
                        <TableCell>{proc.codigo_tuss}</TableCell>
                        <TableCell>{proc.descricao_procedimento}</TableCell>
                        <TableCell align="center">{proc.quantidade}</TableCell>
                        <TableCell align="right">{formatCurrency(proc.valor_unitario)}</TableCell>
                        <TableCell align="right">{formatCurrency(proc.valor_total)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveProcedimento(proc.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {formatCurrency(calcularValorTotal())}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Guia'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
