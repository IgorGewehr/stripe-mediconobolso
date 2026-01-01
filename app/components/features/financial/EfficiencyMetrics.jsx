'use client';

/**
 * @fileoverview Efficiency Metrics Component
 * @description Métricas de eficiência operacional para clínicas médicas
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Speed as EfficiencyIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalHospital as ConsultaIcon,
  EventAvailable as AgendaIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../providers/authProvider';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// Format percentage
const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

// Gauge Chart Component
function GaugeChart({ value, max, label, color = 'primary', size = 120, loading }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const normalizedValue = Math.min(Math.max(percentage, 0), 100);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Skeleton variant="circular" width={size} height={size} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: 'grey.200' }}
        />
        <CircularProgress
          variant="determinate"
          value={normalizedValue}
          size={size}
          thickness={4}
          sx={{
            color: `${color}.main`,
            position: 'absolute',
            left: 0,
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" component="div" fontWeight="bold" color={`${color}.main`}>
            {formatPercent(normalizedValue)}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {label}
      </Typography>
    </Box>
  );
}

// KPI Card with trend
function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', loading, trend, format = 'currency' }) {
  const displayValue = format === 'currency' ? formatCurrency(value) : format === 'percent' ? formatPercent(value) : value;
  const trendColor = trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={36} />
            ) : (
              <Typography variant="h5" component="div" fontWeight="bold" color={`${color}.main`}>
                {displayValue}
              </Typography>
            )}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend !== undefined && trend !== 0 && (
                  trend > 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 14, color: trendColor }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14, color: trendColor }} />
                  )
                )}
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main` }}>
            <Icon />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

// Efficiency Score Card
function EfficiencyScoreCard({ metrics, loading }) {
  // Calculate overall efficiency score (0-100)
  const score = useMemo(() => {
    if (!metrics) return 0;

    const weights = {
      taxaOcupacao: 0.25,      // Taxa de ocupação da agenda
      taxaConversao: 0.2,      // Pacientes que pagaram
      ticketMedio: 0.15,       // Ticket médio vs meta
      dso: 0.2,                // Dias para receber (menor é melhor)
      taxaRetorno: 0.2,        // Taxa de retorno de pacientes
    };

    // Normalize each metric to 0-100
    const ocupacao = Math.min((metrics.taxaOcupacao || 0), 100);
    const conversao = Math.min((metrics.taxaConversao || 0), 100);
    const ticket = Math.min(((metrics.ticketMedio || 0) / (metrics.ticketMeta || 1)) * 100, 100);
    const dso = Math.max(100 - ((metrics.dso || 30) / 60) * 100, 0); // 60 days = 0%
    const retorno = Math.min((metrics.taxaRetorno || 0), 100);

    return (
      ocupacao * weights.taxaOcupacao +
      conversao * weights.taxaConversao +
      ticket * weights.ticketMedio +
      dso * weights.dso +
      retorno * weights.taxaRetorno
    );
  }, [metrics]);

  const getScoreColor = (s) => {
    if (s >= 80) return 'success';
    if (s >= 60) return 'primary';
    if (s >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return 'Excelente';
    if (s >= 60) return 'Bom';
    if (s >= 40) return 'Regular';
    return 'Precisa melhorar';
  };

  return (
    <Card sx={{ height: '100%', textAlign: 'center' }}>
      <CardHeader
        title="Score de Eficiência"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
      />
      <Divider />
      <CardContent>
        <Box sx={{ py: 2 }}>
          <GaugeChart
            value={score}
            max={100}
            label={getScoreLabel(score)}
            color={getScoreColor(score)}
            size={140}
            loading={loading}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Baseado em ocupação, conversão, ticket médio, tempo de recebimento e retenção.
        </Typography>
      </CardContent>
    </Card>
  );
}

// Metrics Breakdown
function MetricsBreakdown({ metrics, loading }) {
  const items = [
    {
      label: 'Taxa de Ocupação',
      value: metrics?.taxaOcupacao || 0,
      target: 80,
      description: 'Horários preenchidos vs disponíveis',
      icon: AgendaIcon,
    },
    {
      label: 'Taxa de Conversão',
      value: metrics?.taxaConversao || 0,
      target: 90,
      description: 'Consultas realizadas que foram pagas',
      icon: CheckIcon,
    },
    {
      label: 'Taxa de Retorno',
      value: metrics?.taxaRetorno || 0,
      target: 70,
      description: 'Pacientes que retornaram em 6 meses',
      icon: PeopleIcon,
    },
    {
      label: 'Taxa de No-Show',
      value: metrics?.taxaNoShow || 0,
      target: 5,
      description: 'Faltas sem aviso prévio',
      icon: WarningIcon,
      inverse: true,
    },
  ];

  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isGood = item.inverse
          ? item.value <= item.target
          : item.value >= item.target;
        const progress = item.inverse
          ? Math.max(0, 100 - (item.value / item.target) * 50)
          : Math.min(100, (item.value / item.target) * 100);

        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ fontSize: 18, color: isGood ? 'success.main' : 'warning.main' }} />
                <Typography variant="body2" fontWeight="medium">
                  {item.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" color={isGood ? 'success.main' : 'warning.main'}>
                  {formatPercent(item.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {formatPercent(item.target)} meta
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isGood ? 'success.main' : 'warning.main',
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {item.description}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// Revenue Analysis
function RevenueAnalysis({ metrics, loading }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const data = [
    { label: 'Consultas Particulares', value: metrics?.receitaParticular || 0, percent: 0 },
    { label: 'Convênios', value: metrics?.receitaConvenio || 0, percent: 0 },
    { label: 'Procedimentos', value: metrics?.receitaProcedimentos || 0, percent: 0 },
    { label: 'Outros', value: metrics?.receitaOutros || 0, percent: 0 },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  data.forEach((d) => {
    d.percent = total > 0 ? (d.value / total) * 100 : 0;
  });

  const colors = ['primary.main', 'success.main', 'warning.main', 'info.main'];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total do Período
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {formatCurrency(total)}
        </Typography>
      </Box>

      {data.map((item, index) => (
        <Box key={index} sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(item.value)} ({formatPercent(item.percent)})
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={item.percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': {
                bgcolor: colors[index],
                borderRadius: 4,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

// Main Component
export default function EfficiencyMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Simulated data - in production this would come from API
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock data - replace with actual API call
        setMetrics({
          // Taxa de Ocupação
          taxaOcupacao: 72.5,
          horariosDisponiveis: 160,
          horariosPreenchidos: 116,

          // Taxa de Conversão
          taxaConversao: 85.3,
          consultasRealizadas: 98,
          consultasPagas: 84,

          // Taxa de Retorno
          taxaRetorno: 65.2,
          pacientesRetornaram: 45,
          totalPacientes: 69,

          // Taxa de No-Show
          taxaNoShow: 8.2,
          faltasSemAviso: 8,

          // Financeiro
          ticketMedio: 280.50,
          ticketMeta: 300.00,
          dso: 22, // Days Sales Outstanding
          receitaParticular: 28500,
          receitaConvenio: 15200,
          receitaProcedimentos: 8900,
          receitaOutros: 2100,

          // Comparação período anterior
          variacaoReceita: 12.5,
          variacaoConsultas: 8.3,
          variacaoPacientes: 5.7,
        });
      } catch (err) {
        setError('Erro ao carregar métricas');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Métricas de Eficiência
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análise de performance operacional da clínica
          </Typography>
        </Box>
        <Tooltip title="Atualizar métricas">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Ticket Médio"
            value={metrics?.ticketMedio}
            subtitle={`Meta: ${formatCurrency(metrics?.ticketMeta)}`}
            icon={MoneyIcon}
            color="primary"
            loading={loading}
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="DSO (Dias p/ Receber)"
            value={metrics?.dso}
            subtitle="Média de dias até pagamento"
            icon={TimeIcon}
            color={metrics?.dso <= 30 ? 'success' : 'warning'}
            loading={loading}
            format="number"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Consultas/Mês"
            value={metrics?.consultasRealizadas}
            subtitle={`${formatPercent(metrics?.variacaoConsultas)} vs anterior`}
            icon={ConsultaIcon}
            color="success"
            loading={loading}
            format="number"
            trend={metrics?.variacaoConsultas}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pacientes Ativos"
            value={metrics?.totalPacientes}
            subtitle={`${formatPercent(metrics?.variacaoPacientes)} vs anterior`}
            icon={PeopleIcon}
            color="info"
            loading={loading}
            format="number"
            trend={metrics?.variacaoPacientes}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Efficiency Score */}
        <Grid item xs={12} md={4}>
          <EfficiencyScoreCard metrics={metrics} loading={loading} />
        </Grid>

        {/* Metrics Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Indicadores de Performance"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <MetricsBreakdown metrics={metrics} loading={loading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Composição da Receita"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <RevenueAnalysis metrics={metrics} loading={loading} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            <strong>Insight:</strong> A taxa de ocupação está em {formatPercent(metrics?.taxaOcupacao || 0)}.
            {(metrics?.taxaOcupacao || 0) < 80 && ' Considere otimizar a agenda ou investir em marketing para aumentar a demanda.'}
            {(metrics?.taxaOcupacao || 0) >= 80 && ' Excelente aproveitamento! Considere expandir horários ou adicionar profissionais.'}
          </Typography>
        </Alert>
      </Box>

      {metrics?.taxaNoShow > 10 && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="body2">
              <strong>Atenção:</strong> A taxa de no-show está em {formatPercent(metrics?.taxaNoShow)}.
              Considere implementar lembretes automáticos por WhatsApp ou cobrar taxa de agendamento.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
