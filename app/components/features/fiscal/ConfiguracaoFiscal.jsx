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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  Autocomplete,
  Paper,
  Skeleton,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNfseConfiguracao, useMunicipios, useCertificados } from '../../hooks/useNfse';

export default function ConfiguracaoFiscal() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: config, isLoading, update, isUpdating, updateError } = useNfseConfiguracao();
  const { data: municipios = [] } = useMunicipios();
  const { certificados = [] } = useCertificados({ apenasAtivos: true, apenasValidos: true });

  const [formData, setFormData] = useState({
    codigoMunicipio: '',
    ambiente: 'homologacao',
    serieRps: 'RPS',
    tokenAutenticacao: '',
    certificadoId: null,
    habilitarAdn: false,
    aliquotaIbsPadrao: '',
    aliquotaCbsPadrao: '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  // Load config into form
  useEffect(() => {
    if (config && config.configurado) {
      setFormData({
        codigoMunicipio: config.codigo_municipio || '',
        ambiente: config.ambiente || 'homologacao',
        serieRps: config.serie_rps || 'RPS',
        tokenAutenticacao: '',
        certificadoId: config.certificado_id || null,
        habilitarAdn: config.habilitar_adn || false,
        aliquotaIbsPadrao: config.aliquota_ibs_padrao || '',
        aliquotaCbsPadrao: config.aliquota_cbs_padrao || '',
      });
    }
  }, [config]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    try {
      await update(formData);
      setSuccessMessage('Configuracao salva com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar configuracao:', err);
    }
  };

  const selectedMunicipio = municipios.find((m) => m.codigo_ibge === formData.codigoMunicipio);

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
        <CardHeader
          title={<Skeleton width={200} />}
          subheader={<Skeleton width={300} />}
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rounded" height={80} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Configuracao Fiscal</Typography>
          </Box>
        }
        subheader="Configure as opcoes de emissao de NFSe"
        action={
          <Tooltip title="O novo padrao nacional (ADN) com IBS/CBS entra em vigor em 2026">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      />
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Status atual */}
            {config && (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: config.configurado ? 'success.lighter' : 'warning.lighter',
                    borderColor: config.configurado ? 'success.main' : 'warning.main',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {config.configurado ? (
                    <ValidIcon color="success" sx={{ fontSize: 32 }} />
                  ) : (
                    <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {config.configurado ? 'Sistema configurado' : 'Configuracao pendente'}
                    </Typography>
                    {config.configurado && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={`Proximo RPS: ${config.proximo_numero_rps}`}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                        {config.certificado_valido ? (
                          <Chip
                            size="small"
                            icon={<ValidIcon sx={{ fontSize: 16 }} />}
                            label={`Certificado valido (${config.dias_expiracao_certificado} dias)`}
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<WarningIcon sx={{ fontSize: 16 }} />}
                            label="Certificado nao configurado"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Alerts */}
            {successMessage && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ borderRadius: 2 }} icon={<ValidIcon />}>
                  <Typography variant="body2" fontWeight="medium">{successMessage}</Typography>
                </Alert>
              </Grid>
            )}
            {updateError && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="medium">{updateError.message}</Typography>
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Dados do Prestador" size="small" sx={{ fontWeight: 600 }} />
              </Divider>
            </Grid>

            {/* Municipio */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={municipios}
                getOptionLabel={(option) => `${option.nome} - ${option.uf} (${option.codigo_ibge})`}
                value={selectedMunicipio || null}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    codigoMunicipio: newValue?.codigo_ibge || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Municipio" required helperText="Selecione o municipio do prestador" />
                )}
              />
            </Grid>

            {/* Ambiente */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ambiente</InputLabel>
                <Select value={formData.ambiente} label="Ambiente" onChange={handleChange('ambiente')}>
                  <MenuItem value="homologacao">Homologacao (Testes)</MenuItem>
                  <MenuItem value="producao">Producao</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Serie RPS */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Serie RPS"
                value={formData.serieRps}
                onChange={handleChange('serieRps')}
                fullWidth
                helperText="Ex: RPS, 001, A"
              />
            </Grid>

            {/* Certificado */}
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Certificado Digital</InputLabel>
                <Select
                  value={formData.certificadoId || ''}
                  label="Certificado Digital"
                  onChange={handleChange('certificadoId')}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {certificados.map((cert) => (
                    <MenuItem key={cert.id} value={cert.id}>
                      {cert.common_name} - valido ate {new Date(cert.data_expiracao).toLocaleDateString('pt-BR')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Token (alguns provedores) */}
            <Grid item xs={12}>
              <TextField
                label="Token de Autenticacao (opcional)"
                value={formData.tokenAutenticacao}
                onChange={handleChange('tokenAutenticacao')}
                fullWidth
                helperText="Alguns municipios requerem token adicional"
                type="password"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Reforma Tributaria 2026 (ADN)" size="small" color="info" sx={{ fontWeight: 600 }} />
              </Divider>
            </Grid>

            {/* Habilitar ADN */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: formData.habilitarAdn ? 'info.lighter' : 'grey.50',
                  borderColor: formData.habilitarAdn ? 'info.main' : 'divider',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.habilitarAdn}
                      onChange={handleChange('habilitarAdn')}
                      color="info"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" fontWeight="medium">
                      Habilitar envio para Ambiente de Dados Nacional (ADN)
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                  Ativa o envio de NFSe para o novo padrao nacional com IBS e CBS (Lei Complementar 214/2025)
                </Typography>
              </Paper>
            </Grid>

            {/* Aliquotas padrao */}
            {formData.habilitarAdn && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Aliquota IBS Padrao (%)"
                    value={formData.aliquotaIbsPadrao}
                    onChange={handleChange('aliquotaIbsPadrao')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                    helperText="Aliquota do Imposto sobre Bens e Servicos"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Aliquota CBS Padrao (%)"
                    value={formData.aliquotaCbsPadrao}
                    onChange={handleChange('aliquotaCbsPadrao')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                    helperText="Contribuicao sobre Bens e Servicos"
                  />
                </Grid>
              </>
            )}

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isUpdating ? null : <SaveIcon />}
                  disabled={isUpdating}
                  sx={{
                    borderRadius: '99px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.25,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Configuracao'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
