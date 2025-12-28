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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNfseConfiguracao, useMunicipios, useCertificados } from '../../hooks/useNfse';

export default function ConfiguracaoFiscal() {
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
      <Card>
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Configuracao Fiscal"
        subheader="Configure as opcoes de emissao de NFSe"
        avatar={<SettingsIcon />}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Status atual */}
            {config && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: config.configurado ? 'success.lighter' : 'warning.lighter',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {config.configurado ? (
                    <ValidIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                  <Box>
                    <Typography variant="subtitle2">
                      {config.configurado ? 'Sistema configurado' : 'Configuracao pendente'}
                    </Typography>
                    {config.configurado && (
                      <Typography variant="body2" color="text.secondary">
                        Proximo RPS: {config.proximo_numero_rps} | Certificado:{' '}
                        {config.certificado_valido ? (
                          <Chip size="small" label={`Valido (${config.dias_expiracao_certificado} dias)`} color="success" />
                        ) : (
                          <Chip size="small" label="Nao configurado" color="warning" />
                        )}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Alerts */}
            {successMessage && (
              <Grid item xs={12}>
                <Alert severity="success">{successMessage}</Alert>
              </Grid>
            )}
            {updateError && (
              <Grid item xs={12}>
                <Alert severity="error">{updateError.message}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider>Dados do Prestador</Divider>
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
              <Divider>Reforma Tributaria 2026 (ADN)</Divider>
            </Grid>

            {/* Habilitar ADN */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch checked={formData.habilitarAdn} onChange={handleChange('habilitarAdn')} />
                }
                label="Habilitar envio para Ambiente de Dados Nacional (ADN)"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Ativa o envio de NFSe para o novo padrao nacional com IBS e CBS (Lei Complementar 214/2025)
              </Typography>
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
                  />
                </Grid>
              </>
            )}

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isUpdating}
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
