'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoAwesome as AIIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Lightbulb as LightbulbIcon,
  Gavel as GavelIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';

export default function RecursoForm({ open, onClose, glossa, recurso, onSuccess }) {
  const {
    createRecurso,
    updateRecurso,
    gerarRecursoIA,
    analisarGlossaIA,
    iaStatus,
    loading,
    error,
    clearError,
    formatCurrency,
    getTipoGlossaLabel,
  } = useGlossas();

  const isEditing = !!recurso?.id;

  const [formData, setFormData] = useState({
    motivoRecurso: recurso?.motivoRecurso || '',
    textoRecurso: recurso?.textoRecurso || '',
    fundamentacaoLegal: recurso?.fundamentacaoLegal || '',
    documentosAnexos: recurso?.documentosAnexos || [],
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && glossa && iaStatus?.enabled && !aiAnalysis) {
      handleAnalyzeGlossa();
    }
  }, [open, glossa, iaStatus?.enabled]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleAnalyzeGlossa = async () => {
    if (!glossa?.id) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analisarGlossaIA(glossa.id);
      setAiAnalysis(result);
      setShowAnalysis(true);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateRecurso = async () => {
    if (!glossa?.id) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await gerarRecursoIA(
        glossa.id,
        formData.motivoRecurso || 'Contestacao do valor glosado',
        formData.textoRecurso ? `Texto existente: ${formData.textoRecurso}` : null
      );

      if (result?.textoSugerido) {
        setFormData((prev) => ({
          ...prev,
          textoRecurso: result.textoSugerido,
          fundamentacaoLegal: result.fundamentacaoLegal || prev.fundamentacaoLegal,
        }));
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formData.textoRecurso);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (isEditing) {
        await updateRecurso(glossa.id, recurso.id, formData);
      } else {
        await createRecurso(glossa.id, formData);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar recurso:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GavelIcon color="primary" />
            {isEditing ? 'Editar Recurso' : 'Criar Recurso de Glossa'}
            {iaStatus?.enabled && (
              <Chip
                size="small"
                icon={<AIIcon />}
                label="IA Disponivel"
                color="secondary"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {(error || aiError) && (
            <Alert
              severity="error"
              onClose={() => {
                clearError();
                setAiError(null);
              }}
              sx={{ mb: 2 }}
            >
              {error || aiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Info da Glossa */}
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Dados da Glossa
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Codigo</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {glossa?.codigoGlossa || '-'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Tipo</Typography>
                  <Chip
                    size="small"
                    label={getTipoGlossaLabel(glossa?.tipoGlossa)}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Valor Glosado</Typography>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {formatCurrency(glossa?.valorGlosado)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Descricao</Typography>
                  <Typography variant="body2">
                    {glossa?.descricaoGlossa || 'Nao informada'}
                  </Typography>
                </Box>
              </Paper>

              {/* Analise IA */}
              {iaStatus?.enabled && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={aiLoading ? <CircularProgress size={16} /> : <AIIcon />}
                    onClick={handleAnalyzeGlossa}
                    disabled={aiLoading}
                  >
                    Analisar Glossa
                  </Button>

                  <Collapse in={showAnalysis && !!aiAnalysis}>
                    <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'secondary.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Analise IA
                      </Typography>

                      {aiAnalysis?.probabilidadeSucesso !== undefined && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Probabilidade de Sucesso
                          </Typography>
                          <Chip
                            label={`${aiAnalysis.probabilidadeSucesso}%`}
                            color={
                              aiAnalysis.probabilidadeSucesso >= 70 ? 'success' :
                              aiAnalysis.probabilidadeSucesso >= 40 ? 'warning' : 'error'
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      )}

                      {aiAnalysis?.pontosFortes?.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Pontos Fortes
                          </Typography>
                          <List dense>
                            {aiAnalysis.pontosFortes.slice(0, 3).map((ponto, i) => (
                              <ListItem key={i} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={ponto} primaryTypographyProps={{ variant: 'caption' }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {aiAnalysis?.citacoesLegais?.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Fundamentacao Sugerida
                          </Typography>
                          {aiAnalysis.citacoesLegais.slice(0, 2).map((citacao, i) => (
                            <Chip
                              key={i}
                              size="small"
                              label={citacao}
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Collapse>
                </Box>
              )}
            </Grid>

            {/* Formulario */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Motivo do Recurso"
                value={formData.motivoRecurso}
                onChange={handleChange('motivoRecurso')}
                required
                multiline
                rows={2}
                placeholder="Descreva brevemente o motivo da contestacao"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Texto do Recurso
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={copied ? 'Copiado!' : 'Copiar texto'}>
                    <IconButton size="small" onClick={handleCopyText}>
                      {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                    </IconButton>
                  </Tooltip>
                  {iaStatus?.enabled && (
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={aiLoading ? <CircularProgress size={14} /> : <AIIcon />}
                      onClick={handleGenerateRecurso}
                      disabled={aiLoading}
                    >
                      Gerar com IA
                    </Button>
                  )}
                </Box>
              </Box>

              <TextField
                fullWidth
                value={formData.textoRecurso}
                onChange={handleChange('textoRecurso')}
                required
                multiline
                rows={12}
                placeholder="Digite o texto completo do recurso ou clique em 'Gerar com IA' para criar automaticamente..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Fundamentacao Legal"
                value={formData.fundamentacaoLegal}
                onChange={handleChange('fundamentacaoLegal')}
                multiline
                rows={3}
                placeholder="RN 259/2011, RN 465/2021, Lei 9656/98, etc."
                helperText="Cite as normas e legislacoes que embasam o recurso"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} startIcon={<CancelIcon />} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.textoRecurso}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Recurso'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
