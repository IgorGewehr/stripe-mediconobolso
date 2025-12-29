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
  Skeleton,
  Paper,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Receipt as NfseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  AutoAwesome as AIIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useRps, useNfse, useLoteStatus, useClassifyServiceAI, useCodigosServico, useCalcularIbsCbs } from '../../hooks/useNfse';
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

// Loading skeleton for RPS table
function RpsTableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <TableRow key={i}>
          <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={150} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// New RPS Dialog with AI Classification
function NewRpsDialog({ open, onClose, onCreate, isCreating }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const { patients = [] } = usePatients();
  const { data: codigosServico = [], isLoading: loadingCodigos } = useCodigosServico();
  const { classify, isClassifying, classification, reset: resetClassification } = useClassifyServiceAI();
  const { calculate: calcularIbsCbs, isCalculating: isCalculatingIbsCbs, result: ibsCbsResult } = useCalcularIbsCbs();

  const [formData, setFormData] = useState({
    tomadorId: '',
    competencia: new Date().toISOString().split('T')[0],
    codigoServico: '04.01',
    codigoCnae: '8630-5/03',
    codigoNbs: '',
    discriminacao: '',
    valorServicos: '',
    aliquotaIss: '2',
    issRetido: false,
    observacoes: '',
    especialidade: '',
    tipoAtendimento: 'consulta',
  });

  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIClassify = async () => {
    if (!formData.discriminacao) return;

    try {
      const result = await classify({
        descricao: formData.discriminacao,
        tipoAtendimento: formData.tipoAtendimento,
        especialidade: formData.especialidade,
      });

      if (result) {
        setShowAiSuggestion(true);
      }
    } catch (err) {
      console.error('Erro na classificacao IA:', err);
    }
  };

  const applyAiSuggestion = () => {
    if (classification) {
      setFormData((prev) => ({
        ...prev,
        codigoServico: classification.codigoServico || prev.codigoServico,
        codigoCnae: classification.codigoCnae || prev.codigoCnae,
        codigoNbs: classification.codigoNbs || prev.codigoNbs,
        discriminacao: classification.descricaoServico || prev.discriminacao,
      }));
      setShowAiSuggestion(false);
    }
  };

  const handleCalculateIbsCbs = async () => {
    if (!formData.valorServicos || !formData.codigoServico) return;

    try {
      await calcularIbsCbs({
        valorServicos: parseFloat(formData.valorServicos),
        codigoServico: formData.codigoServico,
      });
    } catch (err) {
      console.error('Erro no calculo IBS/CBS:', err);
    }
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
      codigoServico: '04.01',
      codigoCnae: '8630-5/03',
      codigoNbs: '',
      discriminacao: '',
      valorServicos: '',
      aliquotaIss: '2',
      issRetido: false,
      observacoes: '',
      especialidade: '',
      tipoAtendimento: 'consulta',
    });
    setShowAiSuggestion(false);
    resetClassification();
    onClose();
  };

  // Find selected code details
  const selectedCodigo = codigosServico.find((c) => c.codigo === formData.codigoServico);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : isTablet ? '16px' : '24px',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.lighter',
          py: 2,
        }}
      >
        <NfseIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">Novo RPS</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip label="Reforma 2026" size="small" color="info" />
          <Tooltip title="O novo padrão nacional com IBS/CBS entra em vigor em 2026">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Tomador */}
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

          {/* Data e Tipo */}
          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Atendimento</InputLabel>
              <Select
                value={formData.tipoAtendimento}
                label="Tipo de Atendimento"
                onChange={handleChange('tipoAtendimento')}
              >
                <MenuItem value="consulta">Consulta</MenuItem>
                <MenuItem value="procedimento">Procedimento</MenuItem>
                <MenuItem value="exame">Exame</MenuItem>
                <MenuItem value="retorno">Retorno</MenuItem>
                <MenuItem value="urgencia">Urgencia</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Especialidade"
              value={formData.especialidade}
              onChange={handleChange('especialidade')}
              fullWidth
              placeholder="Ex: Cardiologia"
            />
          </Grid>

          {/* Descricao com IA */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Discriminacao do Servico"
                value={formData.discriminacao}
                onChange={handleChange('discriminacao')}
                fullWidth
                required
                multiline
                rows={2}
                helperText="Descreva o servico para classificacao automatica"
              />
              <Button
                variant="outlined"
                onClick={handleAIClassify}
                disabled={!formData.discriminacao || isClassifying}
                sx={{ minWidth: 120 }}
                startIcon={<AIIcon />}
              >
                {isClassifying ? 'Classificando...' : 'IA Classificar'}
              </Button>
            </Box>
          </Grid>

          {/* AI Suggestion */}
          {showAiSuggestion && classification && (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: 'info.main',
                  bgcolor: 'info.lighter',
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <AIIcon color="info" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="info.dark" gutterBottom>
                      Sugestao da IA
                    </Typography>
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      <Grid item>
                        <Chip label={`Servico: ${classification.codigoServico}`} size="small" variant="outlined" />
                      </Grid>
                      <Grid item>
                        <Chip label={`CNAE: ${classification.codigoCnae}`} size="small" variant="outlined" />
                      </Grid>
                      {classification.codigoNbs && (
                        <Grid item>
                          <Chip label={`NBS: ${classification.codigoNbs}`} size="small" variant="outlined" />
                        </Grid>
                      )}
                    </Grid>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {classification.justificativa}
                    </Typography>
                    {classification.regimeEspecifico && (
                      <Chip
                        label="Regime Especifico Saude (Reducao 60%)"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={applyAiSuggestion}
                    sx={{
                      borderRadius: '99px',
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Aplicar
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Codigos de Servico */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={codigosServico}
              getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
              value={selectedCodigo || null}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  codigoServico: newValue?.codigo || '04.01',
                  codigoCnae: newValue?.cnaeSugerido || prev.codigoCnae,
                  codigoNbs: newValue?.nbsSugerido || prev.codigoNbs,
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Codigo do Servico (LC 116)" required />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="CNAE"
              value={formData.codigoCnae}
              onChange={handleChange('codigoCnae')}
              fullWidth
              helperText={selectedCodigo?.cnaeSugerido ? `Sugerido: ${selectedCodigo.cnaeSugerido}` : ''}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="NBS (Reforma 2026)"
              value={formData.codigoNbs}
              onChange={handleChange('codigoNbs')}
              fullWidth
              helperText={selectedCodigo?.nbsSugerido ? `Sugerido: ${selectedCodigo.nbsSugerido}` : ''}
            />
          </Grid>

          {/* Valores */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={formData.issRetido} onChange={handleChange('issRetido')} />
                }
                label="ISS Retido"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleCalculateIbsCbs}
                disabled={!formData.valorServicos || isCalculatingIbsCbs}
                startIcon={<CalculateIcon />}
              >
                IBS/CBS
              </Button>
            </Box>
          </Grid>

          {/* IBS/CBS Result */}
          {ibsCbsResult && (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: 'success.main',
                  bgcolor: 'success.lighter',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CalculateIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                    Simulacao IBS/CBS (Reforma Tributaria 2026)
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">IBS</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(ibsCbsResult.valorIbs)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({ibsCbsResult.aliquotaIbs}%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">CBS</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(ibsCbsResult.valorCbs)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({ibsCbsResult.aliquotaCbs}%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">CST</Typography>
                    <Typography variant="body2" fontWeight="medium">{ibsCbsResult.cstIbs}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Regime</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={ibsCbsResult.regimeEspecificoSaude ? 'Saude (-60%)' : 'Normal'}
                        color={ibsCbsResult.regimeEspecificoSaude ? 'success' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Observacoes */}
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
      <DialogActions
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: isMobile ? 2 : 3,
          py: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: '99px',
            textTransform: 'none',
            px: 3,
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.tomadorId || !formData.valorServicos || isCreating}
          startIcon={isCreating ? null : <NfseIcon />}
          sx={{
            borderRadius: '99px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isCreating ? 'Criando...' : 'Criar RPS'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function EmissaoNfse() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [selectedRps, setSelectedRps] = useState([]);
  const [newRpsOpen, setNewRpsOpen] = useState(false);
  const [loteId, setLoteId] = useState(null);
  const [emitError, setEmitError] = useState(null);

  const { rps, isLoading: rpsLoading, create, isCreating, refetch } = useRps();
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
        <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
          <CardHeader
            title={
              <Typography variant="h6" fontWeight="bold">
                Selecione os RPS para emissao
              </Typography>
            }
            action={
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setNewRpsOpen(true)}
                sx={{
                  borderRadius: '99px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Novo RPS
              </Button>
            }
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          />
          <CardContent>
            {rpsLoading ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                    <RpsTableSkeleton />
                  </TableBody>
                </Table>
              </TableContainer>
            ) : rascunhos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <NfseIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                  Nenhum RPS em rascunho
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Crie um novo RPS para comecar a emitir notas fiscais
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNewRpsOpen(true)}
                  sx={{
                    borderRadius: '99px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Criar Novo RPS
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedRps.length === rascunhos.length && rascunhos.length > 0}
                        indeterminate={selectedRps.length > 0 && selectedRps.length < rascunhos.length}
                        onChange={handleSelectAll}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={500}>Selecionar todos</Typography>}
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<NfseIcon />}
                      label={`${selectedRps.length} selecionado(s)`}
                      color={selectedRps.length > 0 ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <Chip
                      label={`Total: ${formatCurrency(valorTotal)}`}
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
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
                          selected={selectedRps.includes(item.id)}
                          sx={{
                            cursor: 'pointer',
                            '&.Mui-selected': {
                              bgcolor: 'primary.lighter',
                            },
                            '&:hover': {
                              bgcolor: selectedRps.includes(item.id) ? 'primary.light' : undefined,
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedRps.includes(item.id)} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {item.numero}/{item.serie}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(item.data_emissao)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {item.discriminacao}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(item.valor_servicos)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(item.valor_iss)}
                            </Typography>
                          </TableCell>
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
        <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
          <CardHeader
            title={<Typography variant="h6" fontWeight="bold">Revisar Emissao</Typography>}
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          />
          <CardContent>
            <Alert
              severity="warning"
              icon={<InfoIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="subtitle2">Atencao</Typography>
              <Typography variant="body2">
                Voce esta prestes a enviar {selectedRps.length} RPS para a prefeitura. Esta acao nao pode ser desfeita.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Quantidade de RPS
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="text.primary">
                    {selectedRps.length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'primary.lighter', borderColor: 'primary.main' }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Valor Total
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary.main">
                    {formatCurrency(valorTotal)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'info.lighter', borderColor: 'info.main' }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    ISS Total
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="info.main">
                    {formatCurrency(
                      selectedRps.reduce((acc, id) => {
                        const item = rps.find((r) => r.id === id);
                        return acc + (item?.valor_iss || 0);
                      }, 0)
                    )}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {emitError && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                {emitError}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Resultado */}
      {activeStep === 2 && (
        <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
          <CardHeader
            title={<Typography variant="h6" fontWeight="bold">Resultado da Emissao</Typography>}
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          />
          <CardContent>
            {isEmitting ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
                <NfseIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Processando emissao...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aguarde enquanto enviamos os RPS para a prefeitura
                </Typography>
              </Box>
            ) : loteStatus ? (
              <Box>
                <Alert
                  severity={loteStatus.situacao === 'processado' ? 'success' : 'info'}
                  icon={loteStatus.situacao === 'processado' ? <SuccessIcon /> : undefined}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {loteStatus.situacao === 'processado'
                      ? 'Lote processado com sucesso!'
                      : `Status: ${loteStatus.situacao}`}
                  </Typography>
                </Alert>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Protocolo:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                      {loteStatus.protocolo}
                    </Typography>
                  </Box>
                </Paper>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>RPS</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>NFSe</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Cod. Verificacao</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loteStatus.nfses?.map((nfse, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {nfse.rps_numero}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" color="primary.main">
                              {nfse.nfse_numero || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                bgcolor: 'grey.100',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {nfse.codigo_verificacao || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={nfse.status}
                              color={nfse.status === 'emitida' ? 'success' : nfse.status === 'erro' ? 'error' : 'default'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {loteStatus.erros?.length > 0 && (
                  <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }} icon={<ErrorIcon />}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Erros encontrados:
                    </Typography>
                    {loteStatus.erros.map((erro, idx) => (
                      <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                        <strong>{erro.codigo}:</strong> {erro.mensagem}
                      </Typography>
                    ))}
                  </Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <NfseIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
                  <Typography variant="body2">Aguardando resultado da prefeitura...</Typography>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Button
          disabled={activeStep === 0}
          onClick={activeStep === 2 ? handleReset : handleBack}
          variant={activeStep === 2 ? 'contained' : 'outlined'}
          color={activeStep === 2 ? 'primary' : 'inherit'}
          startIcon={activeStep === 2 ? <AddIcon /> : undefined}
          sx={{
            borderRadius: '99px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            ...(activeStep === 2 && {
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }),
          }}
        >
          {activeStep === 2 ? 'Nova Emissao' : 'Voltar'}
        </Button>
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={selectedRps.length === 0 || isEmitting}
            startIcon={activeStep === 1 ? <SendIcon /> : undefined}
            sx={{
              borderRadius: '99px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
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
