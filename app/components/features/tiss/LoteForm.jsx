'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import OperadoraSelect from './OperadoraSelect';
import { useTiss } from '../../hooks/useTiss';

export default function LoteForm({ onSave, onCancel }) {
  const { createLote, fetchGuias, guias, loading } = useTiss();

  const [formData, setFormData] = useState({
    operadora: null,
    data_inicio_competencia: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    data_fim_competencia: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  const [selectedGuias, setSelectedGuias] = useState([]);
  const [availableGuias, setAvailableGuias] = useState([]);

  // Buscar guias pendentes quando operadora mudar
  useEffect(() => {
    if (formData.operadora) {
      fetchGuias({
        operadora_id: formData.operadora.id,
        status: 'validado',
      });
    }
  }, [formData.operadora, fetchGuias]);

  useEffect(() => {
    setAvailableGuias(guias.filter((g) => g.status === 'validado' || g.status === 'rascunho'));
  }, [guias]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target?.value ?? event,
    }));
  };

  const handleSelectGuia = (guiaId) => {
    setSelectedGuias((prev) =>
      prev.includes(guiaId)
        ? prev.filter((id) => id !== guiaId)
        : [...prev, guiaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGuias.length === availableGuias.length) {
      setSelectedGuias([]);
    } else {
      setSelectedGuias(availableGuias.map((g) => g.id));
    }
  };

  const calcularValorTotal = () => {
    return availableGuias
      .filter((g) => selectedGuias.includes(g.id))
      .reduce((sum, g) => sum + (g.valor_total || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.operadora) {
      alert('Selecione a operadora');
      return;
    }

    if (selectedGuias.length === 0) {
      alert('Selecione pelo menos uma guia');
      return;
    }

    try {
      await createLote({
        operadora_id: formData.operadora.id,
        data_inicio_competencia: formData.data_inicio_competencia.toISOString().split('T')[0],
        data_fim_competencia: formData.data_fim_competencia.toISOString().split('T')[0],
        guia_ids: selectedGuias,
      });
      onSave?.();
    } catch (err) {
      console.error('Erro ao criar lote:', err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box component="form" onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Novo Lote de Faturamento
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <OperadoraSelect
                  value={formData.operadora}
                  onChange={handleChange('operadora')}
                  required
                  label="Operadora"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Início da Competência"
                  value={formData.data_inicio_competencia}
                  onChange={handleChange('data_inicio_competencia')}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fim da Competência"
                  value={formData.data_fim_competencia}
                  onChange={handleChange('data_fim_competencia')}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Guias para incluir */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Guias Disponíveis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedGuias.length} de {availableGuias.length} selecionadas
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {!formData.operadora ? (
              <Alert severity="info">
                Selecione uma operadora para ver as guias disponíveis
              </Alert>
            ) : availableGuias.length === 0 ? (
              <Alert severity="warning">
                Nenhuma guia validada disponível para esta operadora
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              selectedGuias.length > 0 &&
                              selectedGuias.length < availableGuias.length
                            }
                            checked={selectedGuias.length === availableGuias.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Guia</TableCell>
                        <TableCell>Beneficiário</TableCell>
                        <TableCell>Data Atendimento</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableGuias.map((guia) => (
                        <TableRow
                          key={guia.id}
                          hover
                          onClick={() => handleSelectGuia(guia.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedGuias.includes(guia.id)} />
                          </TableCell>
                          <TableCell>{guia.numero_guia_prestador}</TableCell>
                          <TableCell>{guia.beneficiario_nome || '-'}</TableCell>
                          <TableCell>{formatDate(guia.data_atendimento)}</TableCell>
                          <TableCell align="right">{formatCurrency(guia.valor_total)}</TableCell>
                          <TableCell>
                            <Chip
                              label={guia.status}
                              size="small"
                              color={guia.status === 'validado' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedGuias.length} guia(s) selecionada(s)
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    Total: {formatCurrency(calcularValorTotal())}
                  </Typography>
                </Box>
              </>
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
            disabled={loading || selectedGuias.length === 0}
          >
            Criar Lote
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
