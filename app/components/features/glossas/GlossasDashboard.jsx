'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  Paper,
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
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';
import GlossasList from './GlossasList';
import GlossasAnalytics from './GlossasAnalytics';
import GlossaForm from './GlossaForm';

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', loading, trend }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} />
            ) : (
              <Typography variant="h4" component="div" fontWeight="bold">
                {value}
              </Typography>
            )}
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
                {trend && (
                  <Chip
                    size="small"
                    label={trend}
                    color={trend.startsWith('+') ? 'success' : 'error'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: 2,
              p: 1,
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

function ProgressCard({ title, value, total, color = 'primary', loading }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton width="100%" height={40} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" component="div" fontWeight="bold">
                {percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({value} de {total})
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={color}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UrgentGlossaCard({ glossa, formatCurrency }) {
  const getDaysColor = (days) => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'info';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {glossa.codigoGlossa}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(glossa.valorGlosado)}
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={<TimerIcon />}
          label={`${glossa.diasRestantes} dias`}
          color={getDaysColor(glossa.diasRestantes)}
        />
      </Box>
    </Paper>
  );
}

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

  const metricas = dashboard?.metricasGerais || {};
  const porStatus = dashboard?.porStatus || [];
  const urgentes = dashboard?.urgentes || [];
  const performance = dashboard?.performance || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestao de Glosas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie contestacoes e recupere valores glosados
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
            >
              Analise IA
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateGlossa}>
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

      {/* IA Status */}
      {iaStatus?.enabled && (
        <Alert severity="info" icon={<AIIcon />} sx={{ mb: 3 }}>
          Analise com IA disponivel! Use para analisar glossas e gerar recursos automaticamente.
        </Alert>
      )}

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Glosas"
            value={metricas.totalGlossas || 0}
            subtitle={`R$ ${formatCurrency(metricas.valorTotalGlosado)}`}
            icon={WarningIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Recuperado"
            value={formatCurrency(metricas.valorTotalRecuperado)}
            subtitle={`${metricas.taxaRecuperacaoPercentual?.toFixed(1) || 0}% de recuperacao`}
            icon={CheckIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Em Aberto"
            value={metricas.glossasEmAberto || 0}
            subtitle={formatCurrency(metricas.valorEmAberto)}
            icon={TimerIcon}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Taxa de Sucesso em Recursos"
            value={performance.recursosDeferidos || 0}
            total={(performance.recursosDeferidos || 0) + (performance.recursosIndeferidos || 0)}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status das Glosas
              </Typography>
              <Grid container spacing={2}>
                {porStatus.map((item) => (
                  <Grid item xs={6} sm={4} md={3} key={item.status}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="h5" fontWeight="bold">
                        {item.quantidade}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.valor)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Prazo Expirando
                </Typography>
                <Chip
                  size="small"
                  label={`${urgentes.length} urgentes`}
                  color="error"
                />
              </Box>
              {loading ? (
                <>
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} />
                </>
              ) : urgentes.length > 0 ? (
                urgentes.slice(0, 5).map((glossa) => (
                  <UrgentGlossaCard
                    key={glossa.id}
                    glossa={glossa}
                    formatCurrency={formatCurrency}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Nenhuma glossa com prazo proximo
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Glossas tabs">
            <Tab icon={<GlossaIcon />} iconPosition="start" label="Glosas" />
            <Tab icon={<ReportIcon />} iconPosition="start" label="Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <GlossasList onCreate={handleCreateGlossa} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <GlossasAnalytics />
        </TabPanel>
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
