'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Alert,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Business as BusinessIcon,
  Security as CertificateIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  Send as SendIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import {
  useNuvemFiscalStatus,
  useSyncEmpresaNuvemFiscal,
  useEnviarCertificadoNuvemFiscal,
  useCertificados,
} from '../../hooks/useNfse';

// Brazilian states
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function NuvemFiscalSetup() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Hooks
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useNuvemFiscalStatus();
  const { sync: syncEmpresa, isSyncing, error: syncError, reset: resetSyncError } = useSyncEmpresaNuvemFiscal();
  const { enviar: enviarCertificado, isEnviando, error: certError, reset: resetCertError } = useEnviarCertificadoNuvemFiscal();
  const { certificados = [] } = useCertificados({ apenasAtivos: true, apenasValidos: true });

  // Form state
  const [empresaForm, setEmpresaForm] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoMunicipal: '',
    inscricaoEstadual: '',
    email: '',
    telefone: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    cep: '',
    codigoMunicipio: '',
  });

  const [selectedCertificadoId, setSelectedCertificadoId] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedSection, setExpandedSection] = useState('empresa');

  // Determine active step based on status
  useEffect(() => {
    if (status) {
      if (!status.prestador_configurado) {
        setActiveStep(0);
      } else if (!status.certificado_cadastrado) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }
    }
  }, [status]);

  const handleEmpresaChange = (field) => (event) => {
    setEmpresaForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const formatCNPJ = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const formatCEP = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatTelefone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleCNPJChange = (event) => {
    setEmpresaForm((prev) => ({ ...prev, cnpj: formatCNPJ(event.target.value) }));
  };

  const handleCEPChange = (event) => {
    setEmpresaForm((prev) => ({ ...prev, cep: formatCEP(event.target.value) }));
  };

  const handleTelefoneChange = (event) => {
    setEmpresaForm((prev) => ({ ...prev, telefone: formatTelefone(event.target.value) }));
  };

  const handleSyncEmpresa = async () => {
    resetSyncError();
    setSuccessMessage('');

    try {
      await syncEmpresa(empresaForm);
      setSuccessMessage('Empresa sincronizada com sucesso na API gov.br!');
      refetchStatus();
      setActiveStep(1);
    } catch (err) {
      console.error('Erro ao salvar dados do prestador:', err);
    }
  };

  const handleEnviarCertificado = async () => {
    if (!selectedCertificadoId) return;
    resetCertError();
    setSuccessMessage('');

    try {
      await enviarCertificado(selectedCertificadoId);
      setSuccessMessage('Certificado enviado com sucesso para a API gov.br!');
      refetchStatus();
      setActiveStep(2);
    } catch (err) {
      console.error('Erro ao enviar certificado:', err);
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Verificando configuração...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Configuração Prestador NFSe</Typography>
          </Box>
        }
        subheader="Configure sua empresa e certificado para emissao de NFSe"
        action={
          <Tooltip title="Atualizar status">
            <IconButton onClick={() => refetchStatus()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      />
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        {/* Status Overview */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            bgcolor: status?.habilitado ? 'success.lighter' : 'warning.lighter',
            borderColor: status?.habilitado ? 'success.main' : 'warning.main',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {status?.habilitado ? (
              <SuccessIcon color="success" sx={{ fontSize: 32 }} />
            ) : (
              <ErrorIcon color="warning" sx={{ fontSize: 32 }} />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {status?.habilitado ? 'Prestador Configurado' : 'Configuração Pendente'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ambiente: {status?.ambiente || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={status?.prestador_configurado ? <SuccessIcon /> : <ErrorIcon />}
                label={status?.prestador_configurado ? 'Prestador OK' : 'Prestador pendente'}
                color={status?.prestador_configurado ? 'success' : 'warning'}
              />
              <Chip
                size="small"
                icon={status?.certificado_cadastrado ? <SuccessIcon /> : <ErrorIcon />}
                label={status?.certificado_cadastrado ? 'Certificado OK' : 'Certificado pendente'}
                color={status?.certificado_cadastrado ? 'success' : 'warning'}
              />
            </Box>
          </Box>
        </Paper>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {syncError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => resetSyncError()}>
            {syncError.message || 'Erro ao salvar dados do prestador'}
          </Alert>
        )}
        {certError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => resetCertError()}>
            {certError.message || 'Erro ao enviar certificado'}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Cadastrar Empresa */}
          <Step>
            <StepLabel
              optional={
                status?.prestador_configurado && (
                  <Typography variant="caption" color="success.main">Concluido</Typography>
                )
              }
            >
              <Typography fontWeight="medium">Cadastrar Dados do Prestador</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Preencha os dados da clinica/medico que sera o prestador de servicos nas notas fiscais.
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Chip label="Dados da Empresa" size="small" />
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="CNPJ"
                      value={empresaForm.cnpj}
                      onChange={handleCNPJChange}
                      fullWidth
                      required
                      placeholder="00.000.000/0001-00"
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Razao Social"
                      value={empresaForm.razaoSocial}
                      onChange={handleEmpresaChange('razaoSocial')}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nome Fantasia"
                      value={empresaForm.nomeFantasia}
                      onChange={handleEmpresaChange('nomeFantasia')}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Inscricao Municipal"
                      value={empresaForm.inscricaoMunicipal}
                      onChange={handleEmpresaChange('inscricaoMunicipal')}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Inscricao Estadual"
                      value={empresaForm.inscricaoEstadual}
                      onChange={handleEmpresaChange('inscricaoEstadual')}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Chip label="Contato" size="small" />
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      type="email"
                      value={empresaForm.email}
                      onChange={handleEmpresaChange('email')}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Telefone"
                      value={empresaForm.telefone}
                      onChange={handleTelefoneChange}
                      fullWidth
                      placeholder="(00) 00000-0000"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Chip label="Endereco" size="small" />
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      label="CEP"
                      value={empresaForm.cep}
                      onChange={handleCEPChange}
                      fullWidth
                      required
                      placeholder="00000-000"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Logradouro"
                      value={empresaForm.logradouro}
                      onChange={handleEmpresaChange('logradouro')}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Numero"
                      value={empresaForm.numero}
                      onChange={handleEmpresaChange('numero')}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Complemento"
                      value={empresaForm.complemento}
                      onChange={handleEmpresaChange('complemento')}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Bairro"
                      value={empresaForm.bairro}
                      onChange={handleEmpresaChange('bairro')}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Cidade"
                      value={empresaForm.cidade}
                      onChange={handleEmpresaChange('cidade')}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth required>
                      <InputLabel>UF</InputLabel>
                      <Select
                        value={empresaForm.uf}
                        label="UF"
                        onChange={handleEmpresaChange('uf')}
                      >
                        {ESTADOS_BR.map((uf) => (
                          <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Cod. IBGE"
                      value={empresaForm.codigoMunicipio}
                      onChange={handleEmpresaChange('codigoMunicipio')}
                      fullWidth
                      required
                      helperText="7 digitos"
                      inputProps={{ maxLength: 7 }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSyncEmpresa}
                    disabled={isSyncing || !empresaForm.cnpj || !empresaForm.razaoSocial}
                    startIcon={isSyncing ? null : <SyncIcon />}
                  >
                    {isSyncing ? 'Salvando...' : 'Salvar Dados do Prestador'}
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Enviar Certificado */}
          <Step>
            <StepLabel
              optional={
                status?.certificado_cadastrado && (
                  <Typography variant="caption" color="success.main">
                    Valido ate: {status.certificado_valido_ate ? new Date(status.certificado_valido_ate).toLocaleDateString('pt-BR') : 'N/A'}
                  </Typography>
                )
              }
            >
              <Typography fontWeight="medium">Enviar Certificado Digital</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selecione um certificado A1 ja cadastrado no sistema e envie para a API gov.br.
                  O certificado e necessario para assinar as notas fiscais.
                </Alert>

                {certificados.length === 0 ? (
                  <Alert severity="warning">
                    Nenhum certificado valido encontrado. Faca upload de um certificado A1 na aba "Certificados".
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <FormControl fullWidth>
                        <InputLabel>Certificado Digital</InputLabel>
                        <Select
                          value={selectedCertificadoId}
                          label="Certificado Digital"
                          onChange={(e) => setSelectedCertificadoId(e.target.value)}
                        >
                          {certificados.map((cert) => (
                            <MenuItem key={cert.id} value={cert.id}>
                              {cert.common_name} - {cert.documento || 'S/Doc'} - Valido ate{' '}
                              {new Date(cert.data_expiracao).toLocaleDateString('pt-BR')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleEnviarCertificado}
                        disabled={isEnviando || !selectedCertificadoId}
                        startIcon={isEnviando ? null : <SendIcon />}
                        sx={{ height: '56px' }}
                      >
                        {isEnviando ? 'Enviando...' : 'Enviar Certificado'}
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Pronto */}
          <Step>
            <StepLabel>
              <Typography fontWeight="medium">Pronto para Emitir</Typography>
            </StepLabel>
            <StepContent>
              <Alert severity="success" icon={<SuccessIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Integracao configurada com sucesso!
                </Typography>
                <Typography variant="body2">
                  Voce ja pode emitir NFSe usando a API gov.br. Acesse a aba "Notas Fiscais" e use a opcao
                  "Emitir NFSe" para enviar suas notas.
                </Typography>
              </Alert>
            </StepContent>
          </Step>
        </Stepper>
      </CardContent>
    </Card>
  );
}
