'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Skeleton,
  LinearProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Receipt as NfseIcon,
  TrendingUp as RevenueIcon,
  Security as CertIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Upload as UploadIcon,
  Send as SendIcon,
  CloudUpload as CloudIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  useFiscalDashboard,
  useNuvemFiscalStatus,
  useSyncEmpresaNuvemFiscal,
  useEnviarCertificadoNuvemFiscal,
  useCertificados,
} from '../../hooks/useNfse';
import NfseList from './NfseList';
import EmissaoNfse from './EmissaoNfse';

// Brazilian states
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

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

// Compact KPI Card
function KPICard({ title, value, icon: Icon, color = 'primary', loading }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 1.5,
              p: 1,
              display: 'flex',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: `${color}.main` }}>
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Tab Panel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Status badge helper
const getStatusColor = (status) => {
  switch (status) {
    case 'valido': return 'success';
    case 'expirando': return 'warning';
    case 'expirado': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'valido': return 'Valido';
    case 'expirando': return 'Expirando';
    case 'expirado': return 'Expirado';
    default: return status;
  }
};

// ============================================================================
// TAB 1: CERTIFICADO DIGITAL
// ============================================================================
function CertificadoTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useNuvemFiscalStatus();
  const { enviar: enviarCertificado, isEnviando, error: certError, reset: resetCertError } = useEnviarCertificadoNuvemFiscal();
  const {
    certificados = [],
    isLoading: certLoading,
    upload,
    isUploading,
    validate,
    isValidating,
    delete: deleteCert,
  } = useCertificados({ apenasAtivos: true });

  const [selectedCertificadoId, setSelectedCertificadoId] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pfx') && !selectedFile.name.endsWith('.p12')) {
        setUploadError('Arquivo deve ser um certificado .pfx ou .p12');
        return;
      }
      setFile(selectedFile);
      setValidationResult(null);
      setUploadError(null);
    }
  };

  const handleValidate = async () => {
    if (!file || !password) {
      setUploadError('Informe o arquivo e a senha');
      return;
    }
    try {
      setUploadError(null);
      const result = await validate({ file, password });
      setValidationResult(result);
      if (!result.valido && result.erros?.length > 0) {
        setUploadError(result.erros.join(', '));
      }
    } catch (err) {
      setUploadError(err.message || 'Erro ao validar certificado');
    }
  };

  const handleUpload = async () => {
    if (!file || !password) {
      setUploadError('Informe o arquivo e a senha');
      return;
    }
    try {
      await upload({ file, password, usoPrincipal: 'nfse' });
      setUploadOpen(false);
      setFile(null);
      setPassword('');
      setValidationResult(null);
      setSuccessMessage('Certificado cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setUploadError(err.message || 'Erro ao fazer upload do certificado');
    }
  };

  const handleEnviarParaEmissao = async () => {
    if (!selectedCertificadoId) return;
    resetCertError();
    setSuccessMessage('');
    try {
      await enviarCertificado(selectedCertificadoId);
      setSuccessMessage('Certificado ativado para emissao de NFSe!');
      refetchStatus();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erro ao enviar certificado:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este certificado?')) {
      await deleteCert(id);
    }
  };

  if (statusLoading || certLoading) {
    return <LinearProgress sx={{ borderRadius: 2 }} />;
  }

  return (
    <Box>
      {/* Status do Certificado */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: status?.certificado_cadastrado ? 'success.lighter' : 'warning.lighter',
          borderColor: status?.certificado_cadastrado ? 'success.main' : 'warning.main',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {status?.certificado_cadastrado ? (
            <SuccessIcon color="success" sx={{ fontSize: 32 }} />
          ) : (
            <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {status?.certificado_cadastrado ? 'Certificado Ativo' : 'Certificado Pendente'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status?.certificado_cadastrado
                ? `Valido ate: ${status.certificado_valido_ate ? formatDate(status.certificado_valido_ate) : 'N/A'}`
                : 'Cadastre e ative um certificado digital A1 para emitir NFSe'}
            </Typography>
          </Box>
          <Tooltip title="Atualizar status">
            <IconButton onClick={() => refetchStatus()} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Alertas */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {certError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => resetCertError()}>
          {certError.message || 'Erro ao processar certificado'}
        </Alert>
      )}

      {/* Lista de Certificados */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CertIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">Certificados Cadastrados</Typography>
            </Box>
          }
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Novo Certificado
            </Button>
          }
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        />
        <CardContent>
          {certificados.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CertIcon sx={{ fontSize: 64, color: 'grey.400' }} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Nenhum certificado cadastrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Faca upload de um certificado digital A1 para emitir NFSe
              </Typography>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setUploadOpen(true)}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
              >
                Adicionar Certificado
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {certificados.map((cert) => (
                <ListItem
                  key={cert.id}
                  sx={{
                    border: 1,
                    borderColor: selectedCertificadoId === cert.id ? 'primary.main' : 'grey.200',
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedCertificadoId === cert.id ? 'primary.lighter' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setSelectedCertificadoId(cert.id)}
                >
                  <ListItemIcon>
                    <CertIcon color={cert.status_validade === 'expirado' ? 'error' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{cert.common_name}</Typography>
                        <Chip
                          size="small"
                          label={getStatusLabel(cert.status_validade)}
                          color={getStatusColor(cert.status_validade)}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="div">
                          Documento: {cert.documento || '-'} | Emissor: {cert.emissor}
                        </Typography>
                        <Typography variant="caption" component="div">
                          Valido ate: {formatDate(cert.data_expiracao)} ({cert.dias_restantes} dias restantes)
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Excluir">
                      <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleDelete(cert.id); }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Botao Ativar para Emissao */}
          {certificados.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleEnviarParaEmissao}
                disabled={!selectedCertificadoId || isEnviando}
                startIcon={isEnviando ? null : <SendIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {isEnviando ? 'Ativando...' : 'Ativar para Emissao'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog Upload */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Upload de Certificado Digital</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            <Box
              sx={{
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' },
              }}
              onClick={() => document.getElementById('cert-file-input').click()}
            >
              <input
                id="cert-file-input"
                type="file"
                accept=".pfx,.p12"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <CloudIcon sx={{ fontSize: 48, color: file ? 'primary.main' : 'grey.400' }} />
              <Typography variant="body1" sx={{ mt: 1 }}>
                {file ? file.name : 'Clique para selecionar o arquivo .pfx'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Certificado digital A1 (arquivo .pfx ou .p12)
              </Typography>
            </Box>

            <TextField
              label="Senha do Certificado"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />

            {validationResult && validationResult.valido && (
              <Alert severity="success" icon={<SuccessIcon />}>
                <Typography variant="subtitle2">Certificado Valido</Typography>
                <Typography variant="body2">
                  <strong>Titular:</strong> {validationResult.common_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Validade:</strong> {formatDate(validationResult.data_emissao)} ate{' '}
                  {formatDate(validationResult.data_expiracao)}
                </Typography>
              </Alert>
            )}

            {(isValidating || isUploading) && <LinearProgress />}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadOpen(false)}>Cancelar</Button>
          <Button onClick={handleValidate} disabled={!file || !password || isValidating} variant="outlined">
            Validar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !password || isUploading}
            variant="contained"
            startIcon={<UploadIcon />}
          >
            {isUploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================================
// TAB 2: DADOS FISCAIS
// ============================================================================
function DadosFiscaisTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useNuvemFiscalStatus();
  const { sync: syncEmpresa, isSyncing, error: syncError, reset: resetSyncError } = useSyncEmpresaNuvemFiscal();

  const [successMessage, setSuccessMessage] = useState('');
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

  const handleSyncEmpresa = async () => {
    resetSyncError();
    setSuccessMessage('');
    try {
      await syncEmpresa(empresaForm);
      setSuccessMessage('Dados fiscais salvos com sucesso!');
      refetchStatus();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erro ao salvar dados fiscais:', err);
    }
  };

  if (statusLoading) {
    return <LinearProgress sx={{ borderRadius: 2 }} />;
  }

  return (
    <Box>
      {/* Status */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: status?.prestador_configurado ? 'success.lighter' : 'warning.lighter',
          borderColor: status?.prestador_configurado ? 'success.main' : 'warning.main',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {status?.prestador_configurado ? (
            <SuccessIcon color="success" sx={{ fontSize: 32 }} />
          ) : (
            <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {status?.prestador_configurado ? 'Empresa Configurada' : 'Configuracao Pendente'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status?.prestador_configurado
                ? 'Os dados fiscais da empresa estao configurados para emissao'
                : 'Preencha os dados fiscais da empresa para emitir NFSe'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alertas */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {syncError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => resetSyncError()}>
          {syncError.message || 'Erro ao salvar dados fiscais'}
        </Alert>
      )}

      {/* Formulario */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">Dados da Empresa</Typography>
            </Box>
          }
          subheader="Informacoes fiscais da empresa para emissao de NFSe"
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        />
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={2}>
            {/* Dados da Empresa */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Identificacao" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="CNPJ"
                value={empresaForm.cnpj}
                onChange={(e) => setEmpresaForm(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
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

            {/* Contato */}
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
                onChange={(e) => setEmpresaForm(prev => ({ ...prev, telefone: formatTelefone(e.target.value) }))}
                fullWidth
                placeholder="(00) 00000-0000"
              />
            </Grid>

            {/* Endereco */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Endereco" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                label="CEP"
                value={empresaForm.cep}
                onChange={(e) => setEmpresaForm(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
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

            {/* Botao Salvar */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSyncEmpresa}
                  disabled={isSyncing || !empresaForm.cnpj || !empresaForm.razaoSocial}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4 }}
                >
                  {isSyncing ? 'Salvando...' : 'Salvar Dados Fiscais'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

// ============================================================================
// TAB 3: NOTAS FISCAIS (Emissao + Lista)
// ============================================================================
function NotasFiscaisTab() {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 40,
          },
        }}
      >
        <Tab label="Consultar Notas" />
        <Tab label="Emitir NFSe" />
      </Tabs>

      {subTab === 0 && <NfseList compact />}
      {subTab === 1 && <EmissaoNfse />}
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function FiscalDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const { data: dashboard, isLoading, refetch } = useFiscalDashboard();
  const { data: status } = useNuvemFiscalStatus();

  const handleTabChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const resumoMes = dashboard?.resumo_mes || {};
  const certStatus = dashboard?.certificado_status || {};

  // Verificar configuracao
  const isConfigured = status?.habilitado;

  return (
    <Box>
      {/* Header com KPIs */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Tooltip title="Atualizar">
          <IconButton size="small" onClick={() => refetch()}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* KPIs compactos */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Emitidas (Mes)"
            value={resumoMes.notas_emitidas || 0}
            icon={NfseIcon}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Valor Total"
            value={resumoMes.valor_total || 0}
            icon={RevenueIcon}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="ISS Retido"
            value={resumoMes.iss_retido || 0}
            icon={RevenueIcon}
            color="info"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Status"
            value={
              isConfigured ? (
                <Chip size="small" label="Ativo" color="success" sx={{ height: 20, fontSize: 11 }} />
              ) : (
                <Chip size="small" label="Pendente" color="warning" sx={{ height: 20, fontSize: 11 }} />
              )
            }
            icon={CertIcon}
            color={isConfigured ? 'success' : 'warning'}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Alerta se nao configurado */}
      {!isConfigured && (
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">Configuracao necessaria</Typography>
          <Typography variant="body2">
            Para emitir NFSe, configure primeiro o certificado digital e os dados fiscais da empresa.
          </Typography>
        </Alert>
      )}

      {/* Tabs Principais */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 48,
                py: 1.5,
              },
            }}
          >
            <Tab icon={<CertIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Certificado" />
            <Tab icon={<BusinessIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Dados Fiscais" />
            <Tab icon={<NfseIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Notas Fiscais" />
          </Tabs>
        </Box>

        <Box sx={{ p: isMobile ? 2 : 3 }}>
          <TabPanel value={currentTab} index={0}>
            <CertificadoTab />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <DadosFiscaisTab />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <NotasFiscaisTab />
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}
