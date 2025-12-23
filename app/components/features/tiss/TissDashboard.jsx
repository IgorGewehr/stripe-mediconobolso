'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Description as GuiaIcon,
  Folder as LoteIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';

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
  const { stats, loading, fetchStats, error } = useTiss();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
            Gerencie guias, lotes e faturamento de convênios
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
            <Tab label="Guias Recentes" />
            <Tab label="Lotes" />
            <Tab label="Financeiro" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
            Carregue o componente GuiasList aqui
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
            Carregue o componente LotesList aqui
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
            Carregue o componente FinanceiroResumo aqui
          </Typography>
        </TabPanel>
      </Card>
    </Box>
  );
}
