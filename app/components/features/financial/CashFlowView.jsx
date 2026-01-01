'use client';

/**
 * @fileoverview Cash Flow View Component
 * @description Visualização detalhada do fluxo de caixa com projeções
 */

import { useState, useMemo } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  AccountBalance as BalanceIcon,
  CalendarMonth as CalendarIcon,
  Refresh as RefreshIcon,
  ArrowUpward,
  ArrowDownward,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useFinancialDashboard } from '../../hooks/useFinancial';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

// Format weekday
const formatWeekday = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { weekday: 'short' });
};

// Summary Card
function SummaryCard({ title, value, subtitle, icon: Icon, color = 'primary', loading, trend }) {
  const trendColor = trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%', borderTop: 3, borderColor: `${color}.main` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={120} height={40} />
            ) : (
              <Typography variant="h5" component="div" fontWeight="bold" sx={{ color: `${color}.main` }}>
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
            )}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend !== undefined && trend !== 0 && (
                  trend > 0 ? (
                    <ArrowUpward sx={{ fontSize: 14, color: trendColor }} />
                  ) : (
                    <ArrowDownward sx={{ fontSize: 14, color: trendColor }} />
                  )
                )}
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Daily Flow Bar Chart
function DailyFlowChart({ data, loading }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={250} />;
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Nenhum dado disponível</Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...data.flatMap((d) => [Math.abs(d.entradas || 0), Math.abs(d.saidas || 0)]));

  return (
    <Box sx={{ p: 2 }}>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 1 }} />
          <Typography variant="body2">Entradas</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: 1 }} />
          <Typography variant="body2">Saídas</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
          <Typography variant="body2">Saldo</Typography>
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 200 }}>
        {data.map((item, index) => {
          const saldo = (item.entradas || 0) - (item.saidas || 0);
          return (
            <Box key={index} sx={{ flex: 1, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.5, height: 160, justifyContent: 'center', alignItems: 'flex-end' }}>
                {/* Entradas */}
                <Tooltip title={`Entradas: ${formatCurrency(item.entradas)}`}>
                  <Box
                    sx={{
                      bgcolor: 'success.main',
                      width: '30%',
                      height: `${maxValue > 0 ? ((item.entradas || 0) / maxValue) * 100 : 0}%`,
                      minHeight: item.entradas > 0 ? 4 : 0,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                </Tooltip>
                {/* Saídas */}
                <Tooltip title={`Saídas: ${formatCurrency(item.saidas)}`}>
                  <Box
                    sx={{
                      bgcolor: 'error.main',
                      width: '30%',
                      height: `${maxValue > 0 ? ((item.saidas || 0) / maxValue) * 100 : 0}%`,
                      minHeight: item.saidas > 0 ? 4 : 0,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                </Tooltip>
              </Box>
              {/* Saldo indicator */}
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={formatCurrency(saldo).replace('R$', '')}
                  size="small"
                  color={saldo >= 0 ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
              </Box>
              {/* Date */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {formatWeekday(item.data)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {formatDate(item.data).slice(0, 5)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Projection Table
function ProjectionTable({ data, loading }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  // Group by week
  const weeklyData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const weeks = [];
    let currentWeek = { entradas: 0, saidas: 0, items: [] };

    data.forEach((item, index) => {
      currentWeek.entradas += item.entradas || 0;
      currentWeek.saidas += item.saidas || 0;
      currentWeek.items.push(item);

      if ((index + 1) % 7 === 0 || index === data.length - 1) {
        weeks.push({
          ...currentWeek,
          saldo: currentWeek.entradas - currentWeek.saidas,
          periodo: `${formatDate(currentWeek.items[0]?.data)} - ${formatDate(currentWeek.items[currentWeek.items.length - 1]?.data)}`,
        });
        currentWeek = { entradas: 0, saidas: 0, items: [] };
      }
    });

    return weeks;
  }, [data]);

  if (weeklyData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Nenhuma projeção disponível</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>Período</TableCell>
            <TableCell align="right">Entradas</TableCell>
            <TableCell align="right">Saídas</TableCell>
            <TableCell align="right">Saldo</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {weeklyData.map((week, index) => (
            <TableRow key={index} hover>
              <TableCell>{week.periodo}</TableCell>
              <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>
                {formatCurrency(week.entradas)}
              </TableCell>
              <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>
                {formatCurrency(week.saidas)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: week.saldo >= 0 ? 'success.main' : 'error.main' }}>
                {formatCurrency(week.saldo)}
              </TableCell>
              <TableCell align="center">
                {week.saldo >= 0 ? (
                  <Chip label="Positivo" size="small" color="success" variant="outlined" />
                ) : (
                  <Chip label="Negativo" size="small" color="error" variant="outlined" icon={<WarningIcon />} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Main Component
export default function CashFlowView() {
  const { dashboard, fluxoCaixa, loading, error, refresh } = useFinancialDashboard();
  const [period, setPeriod] = useState('7');

  // Filter data by period
  const filteredData = useMemo(() => {
    if (!fluxoCaixa) return [];
    const days = parseInt(period, 10);
    return fluxoCaixa.slice(-days);
  }, [fluxoCaixa, period]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { entradas: 0, saidas: 0, saldo: 0, mediaEntrada: 0, mediaSaida: 0 };
    }

    const entradas = filteredData.reduce((sum, d) => sum + (d.entradas || 0), 0);
    const saidas = filteredData.reduce((sum, d) => sum + (d.saidas || 0), 0);
    const days = filteredData.length || 1;

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      mediaEntrada: entradas / days,
      mediaSaida: saidas / days,
    };
  }, [filteredData]);

  // Calculate trend (comparing first half vs second half)
  const trend = useMemo(() => {
    if (filteredData.length < 4) return 0;

    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midpoint);
    const secondHalf = filteredData.slice(midpoint);

    const firstSaldo = firstHalf.reduce((sum, d) => sum + ((d.entradas || 0) - (d.saidas || 0)), 0);
    const secondSaldo = secondHalf.reduce((sum, d) => sum + ((d.entradas || 0) - (d.saidas || 0)), 0);

    return secondSaldo - firstSaldo;
  }, [filteredData]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Fluxo de Caixa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análise de entradas e saídas do período
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(e, v) => v && setPeriod(v)}
            size="small"
          >
            <ToggleButton value="7">7 dias</ToggleButton>
            <ToggleButton value="15">15 dias</ToggleButton>
            <ToggleButton value="30">30 dias</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Atualizar">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Entradas"
            value={totals.entradas}
            subtitle={`Média: ${formatCurrency(totals.mediaEntrada)}/dia`}
            icon={UpIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Saídas"
            value={totals.saidas}
            subtitle={`Média: ${formatCurrency(totals.mediaSaida)}/dia`}
            icon={DownIcon}
            color="error"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Saldo do Período"
            value={totals.saldo}
            subtitle={trend >= 0 ? 'Tendência positiva' : 'Tendência negativa'}
            trend={trend}
            icon={BalanceIcon}
            color={totals.saldo >= 0 ? 'success' : 'error'}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Saldo Projetado (30d)"
            value={(totals.mediaEntrada - totals.mediaSaida) * 30}
            subtitle="Baseado na média diária"
            icon={CalendarIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Fluxo Diário"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
              action={
                <Chip
                  label={`Últimos ${period} dias`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              }
            />
            <Divider />
            <DailyFlowChart data={filteredData} loading={loading} />
          </Card>
        </Grid>
      </Grid>

      {/* Projection Table */}
      <Card>
        <CardHeader
          title="Projeção Semanal"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
        />
        <Divider />
        <CardContent>
          <ProjectionTable data={fluxoCaixa} loading={loading} />
        </CardContent>
      </Card>

      {/* Alert for negative balance */}
      {totals.saldo < 0 && !loading && (
        <Alert severity="warning" sx={{ mt: 3 }} icon={<WarningIcon />}>
          <Typography variant="body2">
            <strong>Atenção:</strong> O fluxo de caixa do período está negativo em{' '}
            {formatCurrency(Math.abs(totals.saldo))}. Considere revisar os recebimentos pendentes ou adiar pagamentos não essenciais.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
