'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Skeleton,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Assessment as ReportIcon,
  Gavel as GlossaIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';
import GlossasList from './GlossasList';
import GlossasAnalytics from './GlossasAnalytics';
import GlossaForm from './GlossaForm';

// Format currency helper
const formatCurrencyValue = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// KPI Card Component - seguindo o padrao do FinancialDashboard
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
                {value}
              </Typography>
            )}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend !== undefined && trend !== null && (
                  <>
                    {trend > 0 ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : trend < 0 ? (
                      <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    ) : null}
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

// Progress Card Component
function ProgressCard({ title, value, total, color = 'primary', loading, subtitle }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
      />
      <Divider />
      <CardContent>
        {loading ? (
          <Skeleton height={60} />
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {subtitle || 'Progresso'}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={`${color}.main`}>
                {percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              color={color}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatCurrencyValue(value)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCurrencyValue(total)}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Urgent Glossas List Component
function UrgentGlossasList({ urgentes, loading, formatCurrency }) {
  const getDaysColor = (days) => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'info';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Prazo Expirando"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
        action={
          <Chip
            size="small"
            label={`${urgentes?.length || 0} urgentes`}
            color="error"
            variant="outlined"
          />
        }
      />
      <Divider />
      <CardContent sx={{ maxHeight: 300, overflow: 'auto' }}>
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          </>
        ) : !urgentes || urgentes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Nenhuma glossa com prazo proximo
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {urgentes.slice(0, 5).map((glossa, index) => (
              <Box
                key={glossa.id || index}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {glossa.codigoGlossa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(glossa.valorGlosado)}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={<TimerIcon sx={{ fontSize: 14 }} />}
                    label={`${glossa.diasRestantes} dias`}
                    color={getDaysColor(glossa.diasRestantes)}
                    variant="outlined"
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Status Summary Card
function StatusSummaryCard({ porStatus, loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Status das Glosas"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
      />
      <Divider />
      <CardContent>
        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Skeleton height={80} />
              </Grid>
            ))}
          </Grid>
        ) : !porStatus || porStatus.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Nenhum dado disponivel
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {porStatus.map((item, index) => (
              <Grid item xs={6} sm={4} md={3} key={item.status || index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {item.quantidade}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.status}
                  </Typography>
                  <Typography variant="caption" color="primary.main">
                    {formatCurrencyValue(item.valor)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`glossas-tabpanel-${index}`}
      aria-labelledby={`glossas-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Main Dashboard Component
export default function GlossasDashboard() {
  const {
    loading,
    error,
    clearError,
    dashboard,
    iaStatus,
    fetchDashboard,
    fetchIAStatus,
    formatCurrency,
  } = useGlossas();

  const [activeTab, setActiveTab] = useState(0);
  const [glossaFormOpen, setGlossaFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchIAStatus(),
    ]);
  }, [fetchDashboard, fetchIAStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateGlossa = () => {
    setGlossaFormOpen(true);
  };

  const handleGlossaFormClose = () => {
    setGlossaFormOpen(false);
  };

  const handleGlossaFormSuccess = () => {
    setGlossaFormOpen(false);
    loadData();
  };

  // Memoized data
  const metricas = useMemo(() => dashboard?.metricasGerais || {}, [dashboard]);
  const porStatus = useMemo(() => dashboard?.porStatus || [], [dashboard]);
  const urgentes = useMemo(() => dashboard?.urgentes || [], [dashboard]);
  const performance = useMemo(() => dashboard?.performance || {}, [dashboard]);

  // Calculate recovery stats
  const recursosDeferidos = performance.recursosDeferidos || 0;
  const recursosTotal = recursosDeferidos + (performance.recursosIndeferidos || 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Gestao de Glosas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie contestacoes e recupere valores glosados
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar dados">
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {iaStatus?.enabled && (
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              color="secondary"
              size="small"
            >
              Analise IA
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGlossa}
            size="small"
          >
            Nova Glossa
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* IA Status Alert */}
      {iaStatus?.enabled && (
        <Alert severity="info" icon={<AIIcon />} sx={{ mb: 3 }} variant="outlined">
          Analise com IA disponivel! Use para analisar glossas e gerar recursos automaticamente.
        </Alert>
      )}

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total de Glosas"
            value={metricas.totalGlossas || 0}
            subtitle={formatCurrencyValue(metricas.valorTotalGlosado)}
            icon={WarningIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Valor Recuperado"
            value={formatCurrencyValue(metricas.valorTotalRecuperado)}
            subtitle={`${(metricas.taxaRecuperacaoPercentual || 0).toFixed(1)}% de recuperacao`}
            icon={CheckIcon}
            color="success"
            loading={loading}
            trend={metricas.taxaRecuperacaoPercentual > 50 ? 1 : -1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Em Aberto"
            value={metricas.glossasEmAberto || 0}
            subtitle={formatCurrencyValue(metricas.valorEmAberto)}
            icon={TimerIcon}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Taxa de Sucesso"
            value={recursosDeferidos}
            total={recursosTotal}
            color="success"
            loading={loading}
            subtitle="Recursos deferidos"
          />
        </Grid>
      </Grid>

      {/* Status and Urgent Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <StatusSummaryCard porStatus={porStatus} loading={loading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <UrgentGlossasList
            urgentes={urgentes}
            loading={loading}
            formatCurrency={formatCurrency}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Glossas tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab icon={<GlossaIcon />} iconPosition="start" label="Glosas" />
            <Tab icon={<ReportIcon />} iconPosition="start" label="Analytics" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <TabPanel value={activeTab} index={0}>
            <GlossasList onCreate={handleCreateGlossa} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <GlossasAnalytics />
          </TabPanel>
        </Box>
      </Card>

      {/* Glossa Form Dialog */}
      <GlossaForm
        open={glossaFormOpen}
        onClose={handleGlossaFormClose}
        onSuccess={handleGlossaFormSuccess}
      />
    </Box>
  );
}
