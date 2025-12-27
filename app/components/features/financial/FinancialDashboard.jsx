'use client';

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
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as RevenueIcon,
  AccountBalance as ReceivedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  Refresh as RefreshIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
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

// KPI Card Component
function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', loading, trend }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={120} height={40} />
            ) : (
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                sx={{ color: `${color}.main` }}
              >
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
            )}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend && (
                  <>
                    {trend > 0 ? (
                      <UpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <DownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                  </>
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

// Cash Flow Chart (simplified bar visualization)
function CashFlowChart({ data, loading }) {
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhum dado de fluxo de caixa disponível
        </Typography>
      </Box>
    );
  }

  // Get last 7 days for display
  const chartData = data.slice(-7);
  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.entradas || 0, d.saidas || 0])
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: 1 }} />
          <Typography variant="caption">Entradas</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: 1 }} />
          <Typography variant="caption">Saídas</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 150 }}>
        {chartData.map((item, index) => (
          <Box key={index} sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, height: 120, justifyContent: 'flex-end' }}>
              <Tooltip title={`Entradas: ${formatCurrency(item.entradas)}`}>
                <Box
                  sx={{
                    bgcolor: 'success.main',
                    height: `${maxValue > 0 ? ((item.entradas || 0) / maxValue) * 100 : 0}%`,
                    minHeight: item.entradas > 0 ? 4 : 0,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }}
                />
              </Tooltip>
              <Tooltip title={`Saídas: ${formatCurrency(item.saidas)}`}>
                <Box
                  sx={{
                    bgcolor: 'error.main',
                    height: `${maxValue > 0 ? ((item.saidas || 0) / maxValue) * 100 : 0}%`,
                    minHeight: item.saidas > 0 ? 4 : 0,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {formatDate(item.data).slice(0, 5)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Summary Card
function SummaryCard({ title, items, loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
      />
      <Divider />
      <CardContent>
        {loading ? (
          <>
            <Skeleton height={24} sx={{ mb: 1 }} />
            <Skeleton height={24} sx={{ mb: 1 }} />
            <Skeleton height={24} />
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((item, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Chip
                  label={typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
                  size="small"
                  color={item.color || 'default'}
                  variant={item.variant || 'filled'}
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Alerts Section
function AlertsSection({ dashboard, loading }) {
  if (loading) {
    return <Skeleton height={60} />;
  }

  const alerts = [];

  if (dashboard?.qtdVencidas > 0) {
    alerts.push({
      severity: 'error',
      message: `${dashboard.qtdVencidas} conta(s) vencida(s) totalizando ${formatCurrency(dashboard.totalVencido)}`,
    });
  }

  if (dashboard?.vencendo7Dias > 0) {
    alerts.push({
      severity: 'warning',
      message: `${formatCurrency(dashboard.vencendo7Dias)} vencendo nos próximos 7 dias`,
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {alerts.map((alert, index) => (
        <Alert key={index} severity={alert.severity} variant="outlined">
          {alert.message}
        </Alert>
      ))}
    </Box>
  );
}

// Progress indicator for receivables
function ReceivablesProgress({ received, total, loading }) {
  if (loading) {
    return <Skeleton height={40} />;
  }

  const percentage = total > 0 ? (received / total) * 100 : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Recebido do mês
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {percentage.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(received)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(total)}
        </Typography>
      </Box>
    </Box>
  );
}

// Main Dashboard Component
export default function FinancialDashboard() {
  const { dashboard, fluxoCaixa, loading, error, refresh } = useFinancialDashboard();

  // Calculate summary items
  const receivablesSummary = useMemo(() => [
    {
      label: 'Total Pendente',
      value: dashboard?.totalPendente || 0,
      color: 'warning',
    },
    {
      label: 'Total Vencido',
      value: dashboard?.totalVencido || 0,
      color: 'error',
    },
    {
      label: 'Vencendo em 7 dias',
      value: dashboard?.vencendo7Dias || 0,
      color: 'info',
      variant: 'outlined',
    },
    {
      label: 'Contas Pendentes',
      value: `${dashboard?.qtdPendentes || 0} contas`,
      color: 'default',
      variant: 'outlined',
    },
  ], [dashboard]);

  const expensesSummary = useMemo(() => [
    {
      label: 'Despesas do Mês',
      value: dashboard?.despesasMes || 0,
      color: 'error',
    },
    {
      label: 'Saldo em Contas',
      value: dashboard?.saldoContas || 0,
      color: 'success',
    },
  ], [dashboard]);

  // Calculate cash flow totals
  const cashFlowTotals = useMemo(() => {
    if (!fluxoCaixa || fluxoCaixa.length === 0) {
      return { entradas: 0, saidas: 0, saldo: 0 };
    }

    const last7Days = fluxoCaixa.slice(-7);
    return {
      entradas: last7Days.reduce((sum, d) => sum + (d.entradas || 0), 0),
      saidas: last7Days.reduce((sum, d) => sum + (d.saidas || 0), 0),
      saldo: last7Days.reduce((sum, d) => sum + (d.saldoDia || 0), 0),
    };
  }, [fluxoCaixa]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Dashboard Financeiro
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão geral das finanças da clínica
          </Typography>
        </Box>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={refresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerts */}
      <Box sx={{ mb: 3 }}>
        <AlertsSection dashboard={dashboard} loading={loading} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Receita do Mês"
            value={dashboard?.receitaMes}
            subtitle="Valor faturado"
            icon={RevenueIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Recebido"
            value={dashboard?.recebidoMes}
            subtitle="Pagamentos confirmados"
            icon={ReceivedIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pendente"
            value={dashboard?.totalPendente}
            subtitle={`${dashboard?.qtdPendentes || 0} contas`}
            icon={PendingIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Vencido"
            value={dashboard?.totalVencido}
            subtitle={`${dashboard?.qtdVencidas || 0} contas`}
            icon={OverdueIcon}
            color="error"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Progress and Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Progresso do Mês"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent>
              <ReceivablesProgress
                received={dashboard?.recebidoMes || 0}
                total={dashboard?.receitaMes || 0}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Fluxo de Caixa (Últimos 7 dias)"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
              action={
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    label={`Entradas: ${formatCurrency(cashFlowTotals.entradas)}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`Saídas: ${formatCurrency(cashFlowTotals.saidas)}`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Box>
              }
            />
            <Divider />
            <CashFlowChart data={fluxoCaixa} loading={loading} />
          </Card>
        </Grid>
      </Grid>

      {/* Summary Cards Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Contas a Receber"
            items={receivablesSummary}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SummaryCard
            title="Resumo Financeiro"
            items={expensesSummary}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
