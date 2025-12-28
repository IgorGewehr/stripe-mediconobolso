'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Receipt as NfseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRps, useNfse, useLoteStatus } from '../../hooks/useNfse';
import { usePatients } from '../../hooks/usePatients';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Steps
const steps = ['Selecionar RPS', 'Revisar', 'Resultado'];

// New RPS Dialog
function NewRpsDialog({ open, onClose, onCreate, isCreating }) {
  const { patients = [] } = usePatients();

  const [formData, setFormData] = useState({
    tomadorId: '',
    competencia: new Date().toISOString().split('T')[0],
    codigoServico: '8630-5/04',
    codigoCnae: '8630504',
    discriminacao: 'Consulta medica',
    valorServicos: '',
    aliquotaIss: '5',
    issRetido: false,
    observacoes: '',
  });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await onCreate({
        ...formData,
        valorServicos: parseFloat(formData.valorServicos),
        aliquotaIss: parseFloat(formData.aliquotaIss),
      });
      handleClose();
    } catch (err) {
      console.error('Erro ao criar RPS:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      tomadorId: '',
      competencia: new Date().toISOString().split('T')[0],
      codigoServico: '8630-5/04',
      codigoCnae: '8630504',
      discriminacao: 'Consulta medica',
      valorServicos: '',
      aliquotaIss: '5',
      issRetido: false,
      observacoes: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Novo RPS</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={patients}
              getOptionLabel={(option) => `${option.nome} - ${option.cpf || option.email || ''}`}
              value={patients.find((p) => p.id === formData.tomadorId) || null}
              onChange={(_, newValue) => {
                setFormData((prev) => ({ ...prev, tomadorId: newValue?.id || '' }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Tomador (Paciente)" required />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Data Competencia"
              type="date"
              value={formData.competencia}
              onChange={handleChange('competencia')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Codigo do Servico"
              value={formData.codigoServico}
              onChange={handleChange('codigoServico')}
              fullWidth
              required
              helperText="Ex: 8630-5/04"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Discriminacao do Servico"
              value={formData.discriminacao}
              onChange={handleChange('discriminacao')}
              fullWidth
              required
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Valor do Servico"
              type="number"
              value={formData.valorServicos}
              onChange={handleChange('valorServicos')}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{ startAdornment: 'R$ ' }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Aliquota ISS (%)"
              type="number"
              value={formData.aliquotaIss}
              onChange={handleChange('aliquotaIss')}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0', max: '5' }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox checked={formData.issRetido} onChange={handleChange('issRetido')} />
              }
              label="ISS Retido pelo Tomador"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observacoes"
              value={formData.observacoes}
              onChange={handleChange('observacoes')}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.tomadorId || !formData.valorServicos || isCreating}
        >
          {isCreating ? 'Criando...' : 'Criar RPS'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function EmissaoNfse() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRps, setSelectedRps] = useState([]);
  const [newRpsOpen, setNewRpsOpen] = useState(false);
  const [loteId, setLoteId] = useState(null);
  const [emitError, setEmitError] = useState(null);

  const { rps, isLoading: rpsLoading, create, isCreating } = useRps();
  const { emitir, isEmitting } = useNfse();
  const { data: loteStatus } = useLoteStatus(loteId);

  const rascunhos = rps.filter((r) => r.status === 'rascunho');

  const handleToggleRps = (rpsItem) => {
    setSelectedRps((prev) =>
      prev.includes(rpsItem.id)
        ? prev.filter((id) => id !== rpsItem.id)
        : [...prev, rpsItem.id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRps.length === rascunhos.length) {
      setSelectedRps([]);
    } else {
      setSelectedRps(rascunhos.map((r) => r.id));
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      handleEmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleEmit = async () => {
    try {
      setEmitError(null);
      const result = await emitir(selectedRps);
      if (result.lote_id) {
        setLoteId(result.lote_id);
      }
      setActiveStep(2);
    } catch (err) {
      setEmitError(err.message || 'Erro ao emitir NFSe');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedRps([]);
    setLoteId(null);
    setEmitError(null);
  };

  const valorTotal = selectedRps.reduce((acc, id) => {
    const item = rps.find((r) => r.id === id);
    return acc + (item?.valor_servicos || 0);
  }, 0);

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Selecionar RPS */}
      {activeStep === 0 && (
        <Card>
          <CardHeader
            title="Selecione os RPS para emissao"
            action={
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setNewRpsOpen(true)}>
                Novo RPS
              </Button>
            }
          />
          <CardContent>
            {rpsLoading ? (
              <LinearProgress />
            ) : rascunhos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NfseIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  Nenhum RPS em rascunho
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNewRpsOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Criar Novo RPS
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRps.length === rascunhos.length && rascunhos.length > 0}
                        indeterminate={selectedRps.length > 0 && selectedRps.length < rascunhos.length}
                        onChange={handleSelectAll}
                      />
                    }
                    label="Selecionar todos"
                  />
                  <Typography variant="subtitle2">
                    {selectedRps.length} selecionado(s) - Total: {formatCurrency(valorTotal)}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell>Numero</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Discriminacao</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="right">ISS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rascunhos.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          onClick={() => handleToggleRps(item)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedRps.includes(item.id)} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {item.numero}/{item.serie}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(item.data_emissao)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {item.discriminacao}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.valor_servicos)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.valor_iss)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Revisar */}
      {activeStep === 1 && (
        <Card>
          <CardHeader title="Revisar Emissao" />
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Voce esta prestes a enviar {selectedRps.length} RPS para a prefeitura. Esta acao nao pode ser desfeita.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quantidade de RPS
                </Typography>
                <Typography variant="h4">{selectedRps.length}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Valor Total
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {formatCurrency(valorTotal)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  ISS Total
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(
                    selectedRps.reduce((acc, id) => {
                      const item = rps.find((r) => r.id === id);
                      return acc + (item?.valor_iss || 0);
                    }, 0)
                  )}
                </Typography>
              </Grid>
            </Grid>

            {emitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {emitError}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Resultado */}
      {activeStep === 2 && (
        <Card>
          <CardHeader title="Resultado da Emissao" />
          <CardContent>
            {isEmitting ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography>Processando emissao...</Typography>
              </Box>
            ) : loteStatus ? (
              <Box>
                <Alert
                  severity={loteStatus.situacao === 'processado' ? 'success' : 'info'}
                  icon={loteStatus.situacao === 'processado' ? <SuccessIcon /> : undefined}
                  sx={{ mb: 2 }}
                >
                  {loteStatus.situacao === 'processado'
                    ? 'Lote processado com sucesso!'
                    : `Status: ${loteStatus.situacao}`}
                </Alert>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Protocolo: {loteStatus.protocolo}
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>RPS</TableCell>
                        <TableCell>NFSe</TableCell>
                        <TableCell>Cod. Verificacao</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loteStatus.nfses?.map((nfse, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{nfse.rps_numero}</TableCell>
                          <TableCell>{nfse.nfse_numero || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {nfse.codigo_verificacao || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={nfse.status}
                              color={nfse.status === 'emitida' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {loteStatus.erros?.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Erros:</Typography>
                    {loteStatus.erros.map((erro, idx) => (
                      <Typography key={idx} variant="body2">
                        {erro.codigo}: {erro.mensagem}
                      </Typography>
                    ))}
                  </Alert>
                )}
              </Box>
            ) : (
              <Alert severity="info">Aguardando resultado...</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={activeStep === 2 ? handleReset : handleBack}>
          {activeStep === 2 ? 'Nova Emissao' : 'Voltar'}
        </Button>
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={selectedRps.length === 0 || isEmitting}
            startIcon={activeStep === 1 ? <SendIcon /> : undefined}
          >
            {activeStep === 1 ? (isEmitting ? 'Emitindo...' : 'Emitir NFSe') : 'Continuar'}
          </Button>
        )}
      </Box>

      {/* New RPS Dialog */}
      <NewRpsDialog
        open={newRpsOpen}
        onClose={() => setNewRpsOpen(false)}
        onCreate={create}
        isCreating={isCreating}
      />
    </Box>
  );
}
