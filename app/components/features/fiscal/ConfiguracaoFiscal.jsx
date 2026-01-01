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
import { useNfseConfiguracao, useCertificados } from '../../hooks/useNfse';

export default function ConfiguracaoFiscal() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: config, isLoading, update, isUpdating, updateError } = useNfseConfiguracao();
  const { certificados = [] } = useCertificados({ apenasAtivos: true, apenasValidos: true });

  const [formData, setFormData] = useState({
    codigoMunicipio: '',
    inscricaoMunicipal: '',
    ambiente: 'producao_restrita', // Padrão Nacional 2026
    serieRps: 'RPS',
    certificadoId: null,
    habilitarIbsCbs: true, // IBS/CBS da Reforma Tributária 2026
    aliquotaIss: '',
    aliquotaIbsPadrao: '',
    aliquotaCbsPadrao: '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  // Load config into form
  useEffect(() => {
    if (config && config.configurado) {
      setFormData({
        codigoMunicipio: config.codigo_municipio || '',
        inscricaoMunicipal: config.inscricao_municipal || '',
        ambiente: config.ambiente || 'producao_restrita',
        serieRps: config.serie_rps || 'RPS',
        certificadoId: config.certificado_id || null,
        habilitarIbsCbs: config.habilitar_ibs_cbs !== false,
        aliquotaIss: config.aliquota_iss || '',
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
          <Tooltip title="Padrão Nacional NFSe 2026 - Todos os municípios brasileiros são suportados via API unificada gov.br">
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
            <Grid item xs={12} md={4}>
              <TextField
                label="Codigo IBGE do Municipio"
                value={formData.codigoMunicipio}
                onChange={handleChange('codigoMunicipio')}
                fullWidth
                required
                helperText="Codigo IBGE com 7 digitos (ex: 3550308 = Sao Paulo)"
                inputProps={{ maxLength: 7 }}
              />
            </Grid>

            {/* Inscricao Municipal */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Inscricao Municipal"
                value={formData.inscricaoMunicipal}
                onChange={handleChange('inscricaoMunicipal')}
                fullWidth
                helperText="Inscricao municipal do prestador"
              />
            </Grid>

            {/* Ambiente */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Ambiente</InputLabel>
                <Select value={formData.ambiente} label="Ambiente" onChange={handleChange('ambiente')}>
                  <MenuItem value="producao_restrita">Producao Restrita (Testes gov.br)</MenuItem>
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

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Aliquotas - Reforma Tributaria 2026" size="small" color="info" sx={{ fontWeight: 600 }} />
              </Divider>
            </Grid>

            {/* Info sobre Padrao Nacional */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Padrao Nacional NFSe 2026:</strong> Todos os municipios brasileiros sao suportados
                  atraves da API unificada gov.br. A autenticacao e feita via certificado digital A1 (mTLS).
                </Typography>
              </Alert>
            </Grid>

            {/* Habilitar IBS/CBS */}
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: formData.habilitarIbsCbs ? 'info.lighter' : 'grey.50',
                  borderColor: formData.habilitarIbsCbs ? 'info.main' : 'divider',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.habilitarIbsCbs}
                      onChange={handleChange('habilitarIbsCbs')}
                      color="info"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" fontWeight="medium">
                      Habilitar campos IBS/CBS (Reforma Tributaria 2026)
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                  Inclui campos de IBS e CBS nas notas fiscais (Lei Complementar 214/2025)
                </Typography>
              </Paper>
            </Grid>

            {/* Aliquotas padrao */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Aliquota ISS Padrao (%)"
                value={formData.aliquotaIss}
                onChange={handleChange('aliquotaIss')}
                fullWidth
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '100' }}
                helperText="Aliquota ISS do municipio (ex: 2.00)"
              />
            </Grid>
            {formData.habilitarIbsCbs && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Aliquota IBS Padrao (%)"
                    value={formData.aliquotaIbsPadrao}
                    onChange={handleChange('aliquotaIbsPadrao')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                    helperText="10% para saude com reducao 60%"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Aliquota CBS Padrao (%)"
                    value={formData.aliquotaCbsPadrao}
                    onChange={handleChange('aliquotaCbsPadrao')}
                    fullWidth
                    type="number"
                    inputProps={{ step: '0.01', min: '0', max: '100' }}
                    helperText="3.52% para saude com reducao 60%"
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
