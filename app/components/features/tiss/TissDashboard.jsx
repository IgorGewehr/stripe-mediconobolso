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
  Alert,
} from '@mui/material';
import {
  Description as GuiaIcon,
  Folder as LoteIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon,
  Gavel as GlossaIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';
import GuiasList from './GuiasList';
import LotesList from './LotesList';
import FinanceiroResumo from './FinanceiroResumo';
import { GlossasDashboard } from '../glossas';

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', loading }) {
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tiss-tabpanel-${index}`}
      aria-labelledby={`tiss-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TissDashboard() {
  const { stats, loading, fetchStats, error, isEnabled, isDisabledMessage } = useTiss();
  const [activeTab, setActiveTab] = useState(0);

  const loadStats = useCallback(() => {
    if (isEnabled) {
      fetchStats();
    }
  }, [fetchStats, isEnabled]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Faturamento TISS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie guias, lotes, faturamento de convenios e glosas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<GuiaIcon />}>
            Nova Guia
          </Button>
          <Button variant="contained" startIcon={<LoteIcon />}>
            Novo Lote
          </Button>
        </Box>
      </Box>

      {/* Module Status Alert */}
      {!isEnabled && isDisabledMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {isDisabledMessage}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Guias Pendentes"
            value={stats?.guias?.guias_pendentes || 0}
            subtitle="Aguardando envio"
            icon={GuiaIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lotes Abertos"
            value={stats?.lotes?.lotes_abertos || 0}
            subtitle="Prontos para fechar"
            icon={LoteIcon}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Enviado"
            value={formatCurrency(stats?.lotes?.valor_total_enviado)}
            subtitle="Aguardando pagamento"
            icon={SendIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Glosado"
            value={formatCurrency(stats?.lotes?.valor_total_glosado)}
            subtitle="Total de glosas"
            icon={WarningIcon}
            color="error"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Additional Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total de Guias"
            value={stats?.guias?.total_guias || 0}
            icon={GuiaIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Guias Pagas"
            value={stats?.guias?.guias_pagas || 0}
            icon={CheckIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Valor Total Recebido"
            value={formatCurrency(stats?.lotes?.valor_total_recebido)}
            icon={MoneyIcon}
            color="success"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="TISS tabs">
            <Tab icon={<GuiaIcon />} iconPosition="start" label="Guias" />
            <Tab icon={<LoteIcon />} iconPosition="start" label="Lotes" />
            <Tab icon={<MoneyIcon />} iconPosition="start" label="Financeiro" />
            <Tab icon={<GlossaIcon />} iconPosition="start" label="Glosas" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <GuiasList />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <LotesList />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <FinanceiroResumo />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <GlossasDashboard />
        </TabPanel>
      </Card>
    </Box>
  );
}
