'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Chip,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Receipt as NfseIcon,
  TrendingUp as RevenueIcon,
  Security as CertIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { useFiscalDashboard, useNfseConfiguracao } from '../../hooks/useNfse';
import CertificadoUpload from './CertificadoUpload';
import ConfiguracaoFiscal from './ConfiguracaoFiscal';
import NfseList from './NfseList';
import EmissaoNfse from './EmissaoNfse';
import NuvemFiscalSetup from './NuvemFiscalSetup';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Compact KPI Card
function KPICard({ title, value, icon: Icon, color = 'primary', loading }) {
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
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
            )}
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
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Main Component
export default function FiscalDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const { data: dashboard, isLoading, refetch } = useFiscalDashboard();
  const { data: config } = useNfseConfiguracao();

  const handleTabChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const resumoMes = dashboard?.resumo_mes || {};
  const certStatus = dashboard?.certificado_status || {};

  return (
    <Box>
      {/* Compact Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={() => refetch()}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {currentTab !== 1 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCurrentTab(1)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Nova NFSe
            </Button>
          )}
        </Box>
      </Box>

      {/* Compact KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Emitidas (Mês)"
            value={resumoMes.notas_emitidas || 0}
            icon={NfseIcon}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Valor Total"
            value={resumoMes.valor_total || 0}
            icon={RevenueIcon}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="ISS Retido"
            value={resumoMes.iss_retido || 0}
            icon={RevenueIcon}
            color="info"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard
            title="Certificado"
            value={certStatus.valido ? (
              <Chip size="small" label="OK" color="success" sx={{ height: 20, fontSize: 11 }} />
            ) : (
              <Chip size="small" label="Pendente" color="warning" sx={{ height: 20, fontSize: 11 }} />
            )}
            icon={CertIcon}
            color={certStatus.valido ? 'success' : 'warning'}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card variant="outlined" sx={{ borderRadius: 2, mt: 5 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
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
            <Tab icon={<NfseIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Notas" />
            <Tab icon={<AddIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Emitir" />
            <Tab icon={<CertIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Certificado" />
            <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Config" />
            <Tab icon={<CloudIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Nuvem Fiscal" />
          </Tabs>
        </Box>

        <Box sx={{ p: isMobile ? 1.5 : 2 }}>
          <TabPanel value={currentTab} index={0}>
            <NfseList compact />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <EmissaoNfse onSuccess={() => setCurrentTab(0)} />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <CertificadoUpload />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <ConfiguracaoFiscal />
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <NuvemFiscalSetup />
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}
