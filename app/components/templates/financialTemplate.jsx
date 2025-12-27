'use client';

/**
 * @fileoverview Financial Management Template
 * @description Main page template for financial system (Sistema Financeiro)
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Typography,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/authProvider';
import { useSnackbar } from '../hooks/useDialogState';
import {
  FinancialDashboard,
  ContasReceberList,
  ContaReceberForm,
  RecebimentoDialog,
} from '../features/financial';

// Theme colors
const themeColors = {
  primary: '#1852FE',
  primaryLight: '#E9EFFF',
  primaryDark: '#0A3AA8',
  success: '#0CAF60',
  error: '#FF4B55',
  warning: '#FFAB2B',
  textPrimary: '#111E5A',
  textSecondary: '#4B5574',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F4F7FF',
  borderColor: 'rgba(17, 30, 90, 0.1)',
};

/**
 * TabPanel component
 */
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Financial Management Template
 */
export default function FinancialTemplate() {
  const { user } = useAuth();
  const snackbar = useSnackbar();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [contaFormOpen, setContaFormOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState(null);
  const [recebimentoDialogOpen, setRecebimentoDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Conta a Receber handlers
  const handleAddConta = useCallback(() => {
    setContaToEdit(null);
    setContaFormOpen(true);
  }, []);

  const handleViewConta = useCallback((conta) => {
    // TODO: Implement view dialog
    console.log('View conta:', conta);
  }, []);

  const handleEditConta = useCallback((conta) => {
    setContaToEdit(conta);
    setContaFormOpen(true);
  }, []);

  const handleDeleteConta = useCallback((conta) => {
    // TODO: Implement delete confirmation
    console.log('Delete conta:', conta);
  }, []);

  const handlePaymentConta = useCallback((conta) => {
    setSelectedConta(conta);
    setRecebimentoDialogOpen(true);
  }, []);

  const handleContaFormClose = useCallback(() => {
    setContaFormOpen(false);
    setContaToEdit(null);
  }, []);

  const handleContaFormSuccess = useCallback(() => {
    snackbar.success(contaToEdit ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
  }, [contaToEdit, snackbar]);

  const handleRecebimentoClose = useCallback(() => {
    setRecebimentoDialogOpen(false);
    setSelectedConta(null);
  }, []);

  const handleRecebimentoSuccess = useCallback(() => {
    snackbar.success('Recebimento registrado com sucesso!');
  }, [snackbar]);

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { label: 'Contas a Receber', icon: <ReceiptIcon />, index: 1 },
    { label: 'Contas a Pagar', icon: <PaymentIcon />, index: 2 },
    { label: 'Fornecedores', icon: <StoreIcon />, index: 3 },
    { label: 'Repasses', icon: <TrendingUpIcon />, index: 4 },
    { label: 'Relatórios', icon: <ReportIcon />, index: 5 },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: themeColors.backgroundSecondary,
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          bgcolor: themeColors.backgroundPrimary,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: themeColors.borderColor,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.index}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Dashboard Tab */}
          <TabPanel value={activeTab} index={0}>
            <FinancialDashboard />
          </TabPanel>

          {/* Contas a Receber Tab */}
          <TabPanel value={activeTab} index={1}>
            <ContasReceberList
              onAdd={handleAddConta}
              onView={handleViewConta}
              onEdit={handleEditConta}
              onDelete={handleDeleteConta}
              onPayment={handlePaymentConta}
            />
          </TabPanel>

          {/* Contas a Pagar Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PaymentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Contas a Pagar
              </Typography>
              <Typography color="text.secondary">
                Gerencie suas despesas e contas a pagar
              </Typography>
              <Button variant="outlined" sx={{ mt: 3 }} disabled>
                Em breve
              </Button>
            </Box>
          </TabPanel>

          {/* Fornecedores Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <StoreIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Fornecedores
              </Typography>
              <Typography color="text.secondary">
                Cadastre e gerencie seus fornecedores
              </Typography>
              <Button variant="outlined" sx={{ mt: 3 }} disabled>
                Em breve
              </Button>
            </Box>
          </TabPanel>

          {/* Repasses Tab */}
          <TabPanel value={activeTab} index={4}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TrendingUpIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Repasses Médicos
              </Typography>
              <Typography color="text.secondary">
                Acompanhe e gerencie os repasses dos profissionais
              </Typography>
              <Button variant="outlined" sx={{ mt: 3 }} disabled>
                Em breve
              </Button>
            </Box>
          </TabPanel>

          {/* Relatórios Tab */}
          <TabPanel value={activeTab} index={5}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ReportIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Relatórios Financeiros
              </Typography>
              <Typography color="text.secondary">
                DRE, fluxo de caixa, receita por convênio e mais
              </Typography>
              <Button variant="outlined" sx={{ mt: 3 }} disabled>
                Em breve
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Box>

      {/* Dialogs */}
      <ContaReceberForm
        open={contaFormOpen}
        onClose={handleContaFormClose}
        contaToEdit={contaToEdit}
        onSuccess={handleContaFormSuccess}
      />

      <RecebimentoDialog
        open={recebimentoDialogOpen}
        onClose={handleRecebimentoClose}
        conta={selectedConta}
        onSuccess={handleRecebimentoSuccess}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={snackbar.handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={snackbar.handleClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
