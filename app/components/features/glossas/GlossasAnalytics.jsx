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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  IconButton,
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
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  EmojiEvents as RankingIcon,
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';

// Format currency helper
const formatCurrencyValue = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// Trend Card Component - seguindo o padrao visual
function TrendCard({ mes, ano, valorGlosado, valorRecuperado, quantidade }) {
  const taxaRecuperacao = valorGlosado > 0 ? (valorRecuperado / valorGlosado) * 100 : 0;
  const isPositiveTrend = taxaRecuperacao >= 50;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minWidth: 160,
        position: 'relative',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {mes}/{ano}
        </Typography>
        {isPositiveTrend ? (
          <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
        )}
      </Box>
      <Typography variant="h6" fontWeight="bold" color="error.main">
        {formatCurrencyValue(valorGlosado)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Typography variant="body2" color="success.main" fontWeight="medium">
          {formatCurrencyValue(valorRecuperado)}
        </Typography>
        <Chip
          size="small"
          label={`${taxaRecuperacao.toFixed(0)}%`}
          color={isPositiveTrend ? 'success' : 'warning'}
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {quantidade} glosas
      </Typography>
    </Box>
  );
}

// Convenio Ranking Row Component
function ConvenioRankingRow({ convenio, index }) {
  const getRankColor = (idx) => {
    if (idx === 0) return 'warning.main';
    if (idx === 1) return 'text.secondary';
    if (idx === 2) return 'warning.dark';
    return 'text.disabled';
  };

  return (
    <TableRow
      hover
      sx={{
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: getRankColor(index),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {index + 1}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {convenio.convenioNome}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {convenio.totalGlossas} glosas
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="error.main" fontWeight="medium">
          {formatCurrencyValue(convenio.valorGlosado)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="success.main">
          {formatCurrencyValue(convenio.valorRecuperado)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          label={`${convenio.taxaRecuperacao?.toFixed(1) || 0}%`}
          color={convenio.taxaRecuperacao >= 50 ? 'success' : 'warning'}
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={convenio.percentualDoTotal || 0}
            sx={{ height: 6, borderRadius: 3, flex: 1, minWidth: 60 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
            {convenio.percentualDoTotal?.toFixed(0) || 0}%
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// AI Pattern Card Component - redesenhado
function AIPatternCard({ pattern }) {
  return (
    <Accordion
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        mb: 1,
        '&:before': { display: 'none' },
        borderRadius: 1,
        '&.Mui-expanded': { margin: 0, mb: 1 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
        }}
      >
        <WarningIcon color="warning" fontSize="small" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            {pattern.tipo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pattern.frequencia}
          </Typography>
        </Box>
        <Chip size="small" label={pattern.valorTotal} color="error" variant="outlined" />
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: 'action.hover', pt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Causa Provavel
          </Typography>
          <Typography variant="body2">
            {pattern.causaProvavel}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Solucao Sugerida
          </Typography>
          <Typography variant="body2">
            {pattern.solucaoSugerida}
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// Main Component
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

      {/* Tendencias Card */}
      <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'info.main' }}>
        <CardHeader
          title="Tendencias"
          subheader="Evolucao mensal das glosas nos ultimos 12 meses"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
          subheaderTypographyProps={{ variant: 'caption' }}
          avatar={<TimelineIcon sx={{ color: 'info.main' }} />}
          action={
            <Tooltip title="Atualizar">
              <IconButton onClick={loadData} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <Divider />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 1 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rectangular" width={160} height={120} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : tendencias.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TimelineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhum dado de tendencia disponivel
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflow: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
              }}
            >
              {tendencias.map((item) => (
                <TrendCard
                  key={`${item.mes}-${item.ano}`}
                  {...item}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Ranking de Convenios */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'warning.main' }}>
            <CardHeader
              title="Ranking de Convenios"
              subheader="Convenios com maior volume de glosas"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
              subheaderTypographyProps={{ variant: 'caption' }}
              avatar={<RankingIcon sx={{ color: 'warning.main' }} />}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 3 }}>
                  <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
                </Box>
              ) : rankingConvenios.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ConvenioIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nenhum dado de convenio disponivel
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: 'action.hover', fontWeight: 600 } }}>
                        <TableCell>Convenio</TableCell>
                        <TableCell align="right">Glosado</TableCell>
                        <TableCell align="right">Recuperado</TableCell>
                        <TableCell align="center">Taxa</TableCell>
                        <TableCell>% Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankingConvenios.map((convenio, index) => (
                        <ConvenioRankingRow
                          key={convenio.convenioId}
                          convenio={convenio}
                          index={index}
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
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'secondary.main' }}>
            <CardHeader
              title="Analise com IA"
              subheader="Identificacao de padroes e recomendacoes"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
              subheaderTypographyProps={{ variant: 'caption' }}
              avatar={<AIIcon sx={{ color: 'secondary.main' }} />}
              action={
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
              }
            />
            <Divider />
            <CardContent>
              {!iaStatus?.enabled && (
                <Alert severity="info" sx={{ mb: 2 }} variant="outlined">
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
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
                    <Typography variant="body2">
                      {aiAnalysis.resumo}
                    </Typography>
                  </Box>

                  {/* Padroes Identificados */}
                  {aiAnalysis.padroes?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon fontSize="small" color="warning" />
                        Padroes Identificados
                      </Typography>
                      {aiAnalysis.padroes.map((pattern, index) => (
                        <AIPatternCard key={index} pattern={pattern} />
                      ))}
                    </Box>
                  )}

                  {/* Recomendacoes */}
                  {aiAnalysis.recomendacoes?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LightbulbIcon fontSize="small" color="primary" />
                        Recomendacoes
                      </Typography>
                      <List dense disablePadding>
                        {aiAnalysis.recomendacoes.map((rec, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <LightbulbIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={rec}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Acoes Preventivas */}
                  {aiAnalysis.acoesPreventivas?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon fontSize="small" color="success" />
                        Acoes Preventivas
                      </Typography>
                      <List dense disablePadding>
                        {aiAnalysis.acoesPreventivas.map((acao, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={acao}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AIIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, mx: 'auto' }}>
                    Clique em "Analisar" para identificar padroes de glosas e receber recomendacoes personalizadas
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
