'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

// Format currency helper
const formatCurrencyValue = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

// Compact KPI Card
function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', loading }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 1.5,
              p: 1,
              display: 'flex',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: `${color}.main` }}>
                {value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
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

  const handleTabChange = (_, newValue) => {
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
  const urgentes = useMemo(() => dashboard?.urgentes || [], [dashboard]);

  return (
    <Box>
      {/* Compact Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={loadData} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {activeTab !== 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleCreateGlossa}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Nova Glossa
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Compact KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Total Glosas"
            value={metricas.totalGlossas || 0}
            subtitle={formatCurrencyValue(metricas.valorTotalGlosado)}
            icon={WarningIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Recuperado"
            value={formatCurrencyValue(metricas.valorTotalRecuperado)}
            subtitle={`${(metricas.taxaRecuperacaoPercentual || 0).toFixed(0)}%`}
            icon={CheckIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Em Aberto"
            value={metricas.glossasEmAberto || 0}
            subtitle={formatCurrencyValue(metricas.valorEmAberto)}
            icon={TimerIcon}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Urgentes"
            value={urgentes?.length || 0}
            subtitle="prazo < 7 dias"
            icon={WarningIcon}
            color={urgentes?.length > 0 ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                minHeight: 44,
                py: 1,
              },
            }}
          >
            <Tab icon={<GlossaIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Lista" />
            <Tab icon={<ReportIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Analytics" />
            {iaStatus?.enabled && (
              <Tab icon={<AIIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="IA" />
            )}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
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
