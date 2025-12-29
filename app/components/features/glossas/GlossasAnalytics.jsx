'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AIIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Business as ConvenioIcon,
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';

function TrendCard({ mes, ano, valorGlosado, valorRecuperado, quantidade, formatCurrency }) {
  const taxaRecuperacao = valorGlosado > 0 ? (valorRecuperado / valorGlosado) * 100 : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        minWidth: 150,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {mes}/{ano}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color="error.main">
        {formatCurrency(valorGlosado)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Typography variant="body2" color="success.main">
          {formatCurrency(valorRecuperado)}
        </Typography>
        <Chip
          size="small"
          label={`${taxaRecuperacao.toFixed(0)}%`}
          color={taxaRecuperacao >= 50 ? 'success' : 'warning'}
          sx={{ height: 20 }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {quantidade} glosas
      </Typography>
    </Paper>
  );
}

function ConvenioRankingRow({ convenio, formatCurrency }) {
  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ConvenioIcon color="action" fontSize="small" />
          <Typography variant="body2" fontWeight="medium">
            {convenio.convenioNome}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">{convenio.totalGlossas}</TableCell>
      <TableCell align="right">
        <Typography color="error.main" fontWeight="medium">
          {formatCurrency(convenio.valorGlosado)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color="success.main">
          {formatCurrency(convenio.valorRecuperado)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          label={`${convenio.taxaRecuperacao?.toFixed(1) || 0}%`}
          color={convenio.taxaRecuperacao >= 50 ? 'success' : 'warning'}
        />
      </TableCell>
      <TableCell align="center">
        <LinearProgress
          variant="determinate"
          value={convenio.percentualDoTotal || 0}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption">
          {convenio.percentualDoTotal?.toFixed(1) || 0}%
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function AIPatternCard({ pattern }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <WarningIcon color="warning" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">{pattern.tipo}</Typography>
            <Typography variant="caption" color="text.secondary">
              {pattern.frequencia}
            </Typography>
          </Box>
          <Chip size="small" label={pattern.valorTotal} color="error" />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" paragraph>
          <strong>Causa Provavel:</strong> {pattern.causaProvavel}
        </Typography>
        <Typography variant="body2">
          <strong>Solucao Sugerida:</strong> {pattern.solucaoSugerida}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

export default function GlossasAnalytics() {
  const {
    loading,
    error,
    tendencias,
    rankingConvenios,
    iaStatus,
    fetchTendencias,
    fetchRankingConvenios,
    analisarPadroesIA,
    formatCurrency,
  } = useGlossas();

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTendencias(),
      fetchRankingConvenios(),
    ]);
  }, [fetchTendencias, fetchRankingConvenios]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAnaliseIA = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analisarPadroesIA();
      setAiAnalysis(result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tendencias */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tendencias (Ultimos 12 meses)
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', gap: 2, overflow: 'auto' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rectangular" width={150} height={100} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 1 }}>
              {tendencias.map((item, index) => (
                <TrendCard
                  key={`${item.mes}-${item.ano}`}
                  {...item}
                  formatCurrency={formatCurrency}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Ranking de Convenios */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ranking de Convenios por Glosas
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Convenio</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Glosado</TableCell>
                        <TableCell align="right">Recuperado</TableCell>
                        <TableCell align="center">Taxa</TableCell>
                        <TableCell align="center">% Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankingConvenios.map((convenio) => (
                        <ConvenioRankingRow
                          key={convenio.convenioId}
                          convenio={convenio}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analise IA */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Analise de Padroes com IA
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
                  onClick={handleAnaliseIA}
                  disabled={!iaStatus?.enabled || aiLoading}
                  size="small"
                >
                  Analisar
                </Button>
              </Box>

              {!iaStatus?.enabled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Configure a API OpenAI para habilitar analise com IA
                </Alert>
              )}

              {aiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aiError}
                </Alert>
              )}

              {aiAnalysis ? (
                <Box>
                  {/* Resumo */}
                  <Typography variant="body2" paragraph>
                    {aiAnalysis.resumo}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Padroes Identificados */}
                  {aiAnalysis.padroes?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Padroes Identificados
                      </Typography>
                      {aiAnalysis.padroes.map((pattern, index) => (
                        <AIPatternCard key={index} pattern={pattern} />
                      ))}
                    </Box>
                  )}

                  {/* Recomendacoes */}
                  {aiAnalysis.recomendacoes?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recomendacoes
                      </Typography>
                      <List dense>
                        {aiAnalysis.recomendacoes.map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <LightbulbIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Acoes Preventivas */}
                  {aiAnalysis.acoesPreventivas?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Acoes Preventivas
                      </Typography>
                      <List dense>
                        {aiAnalysis.acoesPreventivas.map((acao, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={acao} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AIIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Analisar" para identificar padroes de glosas
                    e receber recomendacoes personalizadas com IA
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
