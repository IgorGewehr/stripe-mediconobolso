'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Skeleton,
  Chip,
  Divider,
  Tab,
  Tabs,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Receipt as NfseIcon,
  TrendingUp as RevenueIcon,
  Security as CertIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useFiscalDashboard, useNfseConfiguracao } from '../../hooks/useNfse';
import CertificadoUpload from './CertificadoUpload';
import ConfiguracaoFiscal from './ConfiguracaoFiscal';
import NfseList from './NfseList';
import EmissaoNfse from './EmissaoNfse';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// KPI Card
function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', loading }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: 4,
        borderColor: `${color}.main`,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={36} sx={{ borderRadius: 1 }} />
            ) : (
              <Typography variant="h5" fontWeight="bold" sx={{ color: `${color}.main` }}>
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: `inset 0 0 0 1px ${color === 'primary' ? 'rgba(0,0,0,0.04)' : 'transparent'}`,
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 24 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Tab Panel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Main Component
export default function FiscalDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const { data: dashboard, isLoading } = useFiscalDashboard();
  const { data: config } = useNfseConfiguracao();

  const handleTabChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const resumoMes = dashboard?.resumo_mes || {};
  const certStatus = dashboard?.certificado_status || {};

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Fiscal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerenciamento de NFSe e certificados digitais
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCurrentTab(1)}
            sx={{
              borderRadius: '99px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Emitir NFSe
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {config && !config.configurado && (
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2.5,
            bgcolor: 'warning.lighter',
            borderColor: 'warning.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Configuracao necessaria
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure o municipio e certificado digital para comecar a emitir NFSe.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setCurrentTab(3)}
            startIcon={<SettingsIcon />}
            sx={{
              borderRadius: '99px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Configurar
          </Button>
        </Paper>
      )}

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Notas Emitidas (Mes)"
            value={resumoMes.notas_emitidas || 0}
            subtitle={`${resumoMes.notas_canceladas || 0} canceladas`}
            icon={NfseIcon}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Valor Total (Mes)"
            value={resumoMes.valor_total || 0}
            icon={RevenueIcon}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="ISS Retido (Mes)"
            value={resumoMes.iss_retido || 0}
            icon={RevenueIcon}
            color="info"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Certificado"
            value={
              certStatus.valido ? (
                <Chip size="small" label="Valido" color="success" />
              ) : (
                <Chip size="small" label="Invalido" color="error" />
              )
            }
            subtitle={certStatus.dias_restantes ? `${certStatus.dias_restantes} dias` : 'Nao configurado'}
            icon={CertIcon}
            color={certStatus.valido ? 'success' : 'error'}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ borderRadius: isMobile ? 2 : 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 56,
              },
            }}
          >
            <Tab icon={<NfseIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Notas Emitidas" />
            <Tab icon={<AddIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Emitir NFSe" />
            <Tab icon={<CertIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Certificados" />
            <Tab icon={<SettingsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Configuracao" />
          </Tabs>
        </Box>

        <Box sx={{ p: isMobile ? 2 : 3 }}>
          <TabPanel value={currentTab} index={0}>
            <NfseList />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <EmissaoNfse />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <CertificadoUpload />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <ConfiguracaoFiscal />
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}
