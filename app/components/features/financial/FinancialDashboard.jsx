'use client';

/**
 * @fileoverview Financial Dashboard - Redesign Minimalista
 * @description Dashboard limpo com KPIs essenciais e widget de sugestoes integrado
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  TrendingUp as RevenueIcon,
  AccountBalance as ReceivedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  Refresh as RefreshIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Lightbulb as SuggestionIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { useFinancialDashboard, useSugestoesFinanceiras } from '../../hooks/useFinancial';

// Theme minimalista
const theme = {
  primary: '#1852FE',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
  },
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

/**
 * KPI Card - Design minimalista
 */
function KPICard({ title, value, subtitle, color = theme.primary, loading }) {
  return (
    <Card
      sx={{
        height: '100%',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.text.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={100} height={36} sx={{ mt: 0.5 }} />
        ) : (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: color,
              mt: 0.5,
              fontSize: '1.5rem',
            }}
          >
            {typeof value === 'number' ? formatCurrency(value) : value}
          </Typography>
        )}
        {subtitle && (
          <Typography
            variant="caption"
            sx={{ color: theme.text.secondary, display: 'block', mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Mini Cash Flow Chart - Ultimos 7 dias
 */
function MiniCashFlow({ data, loading }) {
  if (loading) {
    return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Sem dados de fluxo
        </Typography>
      </Box>
    );
  }

  const chartData = data.slice(-7);
  const maxValue = Math.max(...chartData.flatMap((d) => [d.entradas || 0, d.saidas || 0]), 1);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', height: 60 }}>
      {chartData.map((item, index) => {
        const saldo = (item.entradas || 0) - (item.saidas || 0);
        return (
          <Tooltip
            key={index}
            title={`${formatDate(item.data)}: ${formatCurrency(saldo)}`}
          >
            <Box
              sx={{
                flex: 1,
                bgcolor: saldo >= 0 ? theme.success : theme.error,
                height: `${Math.max((Math.abs(saldo) / maxValue) * 100, 8)}%`,
                borderRadius: 0.5,
                opacity: 0.8,
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': { opacity: 1 },
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

/**
 * Alert Banner - Contas vencidas
 */
function AlertBanner({ dashboard, loading }) {
  if (loading || !dashboard?.qtdVencidas) return null;

  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 2,
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Typography variant="body2">
          <strong>{dashboard.qtdVencidas}</strong> conta(s) vencida(s) - {formatCurrency(dashboard.totalVencido)}
        </Typography>
        <Chip
          label="Ver detalhes"
          size="small"
          color="error"
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
      </Box>
    </Alert>
  );
}

/**
 * Suggestions Widget - Colapsavel
 */
function SuggestionsWidget() {
  const { sugestoes, loading, saving, aceitarSugestao, rejeitarSugestao } = useSugestoesFinanceiras();
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />;
  }

  if (!sugestoes || sugestoes.length === 0) {
    return null;
  }

  const handleAccept = async (id) => {
    try {
      await aceitarSugestao(id);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejeitarSugestao(id);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <Card
      sx={{
        border: `1px solid ${theme.warning}40`,
        bgcolor: `${theme.warning}08`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: `${theme.warning}10` },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SuggestionIcon sx={{ color: theme.warning }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {sugestoes.length} sugestao(es) pendente(s)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lancamentos automaticos para revisar
            </Typography>
          </Box>
        </Box>
        <IconButton size="small">
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {sugestoes.slice(0, 3).map((sugestao) => {
            const dados = sugestao.dadosSugeridos || {};
            const isReceita = sugestao.tipo === 'conta_receber';

            return (
              <Box
                key={sugestao.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {dados.descricao || 'Lancamento'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isReceita ? 'Receita' : 'Despesa'} - {formatDate(dados.dataVencimento)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: isReceita ? theme.success : theme.error,
                    mx: 2,
                  }}
                >
                  {formatCurrency(dados.valor || dados.valorBruto || 0)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleReject(sugestao.id)}
                    disabled={saving}
                    sx={{ color: theme.error }}
                  >
                    <RejectIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleAccept(sugestao.id)}
                    disabled={saving}
                    sx={{ color: theme.success }}
                  >
                    <AcceptIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}

          {sugestoes.length > 3 && (
            <Button
              size="small"
              sx={{ mt: 1, color: theme.warning }}
            >
              Ver todas ({sugestoes.length})
            </Button>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

/**
 * Main Dashboard Component
 */
export default function FinancialDashboard() {
  const { dashboard, fluxoCaixa, loading, error, refresh } = useFinancialDashboard();

  // Calcular saldo do periodo
  const saldoPeriodo = useMemo(() => {
    if (!fluxoCaixa || fluxoCaixa.length === 0) return 0;
    const last7 = fluxoCaixa.slice(-7);
    return last7.reduce((sum, d) => sum + ((d.entradas || 0) - (d.saidas || 0)), 0);
  }, [fluxoCaixa]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={theme.text.primary}>
            Financeiro
          </Typography>
          <Typography variant="body2" color={theme.text.secondary}>
            Resumo do mes atual
          </Typography>
        </Box>
        <Tooltip title="Atualizar">
          <IconButton onClick={refresh} disabled={loading} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alert de contas vencidas */}
      <AlertBanner dashboard={dashboard} loading={loading} />

      {/* KPI Cards - 4 principais */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Receita do Mes"
            value={dashboard?.receitaMes}
            subtitle="Total faturado"
            color={theme.primary}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Recebido"
            value={dashboard?.recebidoMes}
            subtitle="Confirmado"
            color={theme.success}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Pendente"
            value={dashboard?.totalPendente}
            subtitle={`${dashboard?.qtdPendentes || 0} contas`}
            color={theme.warning}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Vencido"
            value={dashboard?.totalVencido}
            subtitle={`${dashboard?.qtdVencidas || 0} contas`}
            color={theme.error}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Segunda linha: Fluxo de Caixa + Sugestoes */}
      <Grid container spacing={2}>
        {/* Fluxo de Caixa mini */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Fluxo de Caixa (7 dias)
                </Typography>
                <Chip
                  label={formatCurrency(saldoPeriodo)}
                  size="small"
                  sx={{
                    bgcolor: saldoPeriodo >= 0 ? `${theme.success}15` : `${theme.error}15`,
                    color: saldoPeriodo >= 0 ? theme.success : theme.error,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <MiniCashFlow data={fluxoCaixa} loading={loading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Resumo rapido */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Resumo Rapido
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Despesas do mes
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={theme.error}>
                    {formatCurrency(dashboard?.despesasMes || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo em contas
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={theme.success}>
                    {formatCurrency(dashboard?.saldoContas || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Vencendo em 7 dias
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={theme.warning}>
                    {formatCurrency(dashboard?.vencendo7Dias || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Widget de Sugestoes */}
        <Grid item xs={12}>
          <SuggestionsWidget />
        </Grid>
      </Grid>
    </Box>
  );
}
