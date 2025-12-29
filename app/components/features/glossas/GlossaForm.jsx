'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';

const TIPO_GLOSSA_OPTIONS = [
  { value: 'M01', label: 'M01 - Procedimento nao autorizado' },
  { value: 'M02', label: 'M02 - Procedimento fora da cobertura' },
  { value: 'M03', label: 'M03 - Ausencia de documentacao' },
  { value: 'M04', label: 'M04 - Procedimento duplicado' },
  { value: 'M05', label: 'M05 - Erro de codificacao' },
  { value: 'M06', label: 'M06 - Falta de justificativa clinica' },
  { value: 'M07', label: 'M07 - Valor acima do contratado' },
  { value: 'M08', label: 'M08 - Data inconsistente' },
  { value: 'M09', label: 'M09 - Beneficiario invalido' },
  { value: 'M10', label: 'M10 - Prestador invalido' },
  { value: 'M11', label: 'M11 - Carencia nao cumprida' },
  { value: 'M12', label: 'M12 - Procedimento nao compativel com CID' },
  { value: 'OUTROS', label: 'Outros motivos' },
];

export default function GlossaForm({ open, onClose, glossa, guiaId, convenioId, onSuccess }) {
  const { createGlossa, updateGlossa, loading, error, clearError } = useGlossas();
  const isEditing = !!glossa?.id;

  const [formData, setFormData] = useState({
    guiaId: glossa?.guiaId || guiaId || '',
    convenioId: glossa?.convenioId || convenioId || '',
    itemProcedimentoId: glossa?.itemProcedimentoId || '',
    numeroLote: glossa?.numeroLote || '',
    tipoGlossa: glossa?.tipoGlossa || 'M01',
    descricaoGlossa: glossa?.descricaoGlossa || '',
    valorOriginal: glossa?.valorOriginal || '',
    valorGlosado: glossa?.valorGlosado || '',
    dataGlossa: glossa?.dataGlossa ? new Date(glossa.dataGlossa) : new Date(),
    prazoDias: glossa?.prazoDias || 30,
    observacoesInternas: glossa?.observacoesInternas || '',
  });

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      valorOriginal: parseFloat(formData.valorOriginal) || 0,
      valorGlosado: parseFloat(formData.valorGlosado) || 0,
      dataGlossa: formData.dataGlossa?.toISOString().split('T')[0],
      prazoDias: parseInt(formData.prazoDias, 10) || 30,
    };

    try {
      if (isEditing) {
        await updateGlossa(glossa.id, payload);
      } else {
        await createGlossa(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar glossa:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Glossa' : 'Nova Glossa'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Identificacao */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Identificacao
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID da Guia"
                  value={formData.guiaId}
                  onChange={handleChange('guiaId')}
                  required
                  disabled={!!guiaId}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID do Convenio"
                  value={formData.convenioId}
                  onChange={handleChange('convenioId')}
                  required
                  disabled={!!convenioId}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Numero do Lote"
                  value={formData.numeroLote}
                  onChange={handleChange('numeroLote')}
                  placeholder="Opcional"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID do Item/Procedimento"
                  value={formData.itemProcedimentoId}
                  onChange={handleChange('itemProcedimentoId')}
                  placeholder="Opcional"
                />
              </Grid>

              {/* Tipo e Descricao */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Classificacao
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Glossa</InputLabel>
                  <Select
                    value={formData.tipoGlossa}
                    label="Tipo de Glossa"
                    onChange={handleChange('tipoGlossa')}
                  >
                    {TIPO_GLOSSA_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Data da Glossa"
                  value={formData.dataGlossa}
                  onChange={handleChange('dataGlossa')}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descricao da Glossa"
                  value={formData.descricaoGlossa}
                  onChange={handleChange('descricaoGlossa')}
                  multiline
                  rows={2}
                  placeholder="Descreva o motivo da glossa conforme informado pela operadora"
                />
              </Grid>

              {/* Valores */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Valores
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Valor Original"
                  type="number"
                  value={formData.valorOriginal}
                  onChange={handleChange('valorOriginal')}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Valor Glosado"
                  type="number"
                  value={formData.valorGlosado}
                  onChange={handleChange('valorGlosado')}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Prazo para Recurso (dias)"
                  type="number"
                  value={formData.prazoDias}
                  onChange={handleChange('prazoDias')}
                  inputProps={{ min: '1', max: '365' }}
                />
              </Grid>

              {/* Observacoes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observacoes Internas"
                  value={formData.observacoesInternas}
                  onChange={handleChange('observacoesInternas')}
                  multiline
                  rows={2}
                  placeholder="Anotacoes internas para controle (nao enviadas para operadora)"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} startIcon={<CancelIcon />} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Glossa'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
