'use client';

/**
 * @fileoverview Financial Management Template
 * @description Gestão Financeira completa com todos os recursos
 * Separado de TISS/Glossas/NFSe que possuem páginas próprias
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Typography,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as ReceitasIcon,
  TrendingDown as DespesasIcon,
  AccountBalance as FluxoCaixaIcon,
  Business as FornecedoresIcon,
  CreditCard as ContasBancariasIcon,
  Lightbulb as SugestoesIcon,
  PeopleAlt as RepassesIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/authProvider';
import { useSnackbar } from '../hooks/useDialogState';
import {
  FinancialDashboard,
  ContasReceberList,
  ContaReceberForm,
  RecebimentoDialog,
  ContasPagarList,
  ContaPagarForm,
  PagamentoDialog,
  FornecedoresList,
  FornecedorForm,
  ContasBancariasList,
  ContaBancariaForm,
  TransferenciaDialog,
  SugestoesFinanceirasList,
  RepassesList,
} from '../features/financial';
import CashFlowView from '../features/financial/CashFlowView';
import { useSugestoesFinanceiras } from '../hooks/useFinancial';

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
 * Focado em Fluxo de Caixa e Eficiência Operacional
 */
export default function FinancialTemplate() {
  const { user } = useAuth();
  const snackbar = useSnackbar();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states - Contas a Receber
  const [contaFormOpen, setContaFormOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState(null);
  const [recebimentoDialogOpen, setRecebimentoDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);

  // Dialog states - Contas a Pagar
  const [contaPagarFormOpen, setContaPagarFormOpen] = useState(false);
  const [contaPagarToEdit, setContaPagarToEdit] = useState(null);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [selectedContaPagar, setSelectedContaPagar] = useState(null);

  // Dialog states - Fornecedores
  const [fornecedorFormOpen, setFornecedorFormOpen] = useState(false);
  const [fornecedorToEdit, setFornecedorToEdit] = useState(null);

  // Dialog states - Contas Bancarias
  const [contaBancariaFormOpen, setContaBancariaFormOpen] = useState(false);
  const [contaBancariaToEdit, setContaBancariaToEdit] = useState(null);
  const [transferenciaDialogOpen, setTransferenciaDialogOpen] = useState(false);
  const [selectedContaBancaria, setSelectedContaBancaria] = useState(null);

  // Sugestoes count for badge
  const { sugestoes } = useSugestoesFinanceiras();

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
    console.log('View conta:', conta);
  }, []);

  const handleEditConta = useCallback((conta) => {
    setContaToEdit(conta);
    setContaFormOpen(true);
  }, []);

  const handleDeleteConta = useCallback((conta) => {
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

  // Conta a Pagar handlers
  const handleAddContaPagar = useCallback(() => {
    setContaPagarToEdit(null);
    setContaPagarFormOpen(true);
  }, []);

  const handleViewContaPagar = useCallback((conta) => {
    console.log('View conta a pagar:', conta);
  }, []);

  const handleEditContaPagar = useCallback((conta) => {
    setContaPagarToEdit(conta);
    setContaPagarFormOpen(true);
  }, []);

  const handleDeleteContaPagar = useCallback((conta) => {
    console.log('Delete conta a pagar:', conta);
  }, []);

  const handlePaymentContaPagar = useCallback((conta) => {
    setSelectedContaPagar(conta);
    setPagamentoDialogOpen(true);
  }, []);

  const handleContaPagarFormClose = useCallback(() => {
    setContaPagarFormOpen(false);
    setContaPagarToEdit(null);
  }, []);

  const handleContaPagarFormSuccess = useCallback(() => {
    snackbar.success(contaPagarToEdit ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
  }, [contaPagarToEdit, snackbar]);

  const handlePagamentoClose = useCallback(() => {
    setPagamentoDialogOpen(false);
    setSelectedContaPagar(null);
  }, []);

  const handlePagamentoSuccess = useCallback(() => {
    snackbar.success('Pagamento registrado com sucesso!');
  }, [snackbar]);

  // Fornecedor handlers
  const handleAddFornecedor = useCallback(() => {
    setFornecedorToEdit(null);
    setFornecedorFormOpen(true);
  }, []);

  const handleViewFornecedor = useCallback((fornecedor) => {
    console.log('View fornecedor:', fornecedor);
  }, []);

  const handleEditFornecedor = useCallback((fornecedor) => {
    setFornecedorToEdit(fornecedor);
    setFornecedorFormOpen(true);
  }, []);

  const handleDeactivateFornecedor = useCallback((fornecedor) => {
    console.log('Deactivate fornecedor:', fornecedor);
  }, []);

  const handleFornecedorFormClose = useCallback(() => {
    setFornecedorFormOpen(false);
    setFornecedorToEdit(null);
  }, []);

  const handleFornecedorFormSuccess = useCallback(() => {
    snackbar.success(fornecedorToEdit ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!');
  }, [fornecedorToEdit, snackbar]);

  // Conta Bancaria handlers
  const handleAddContaBancaria = useCallback(() => {
    setContaBancariaToEdit(null);
    setContaBancariaFormOpen(true);
  }, []);

  const handleEditContaBancaria = useCallback((conta) => {
    setContaBancariaToEdit(conta);
    setContaBancariaFormOpen(true);
  }, []);

  const handleTransfer = useCallback((conta) => {
    setSelectedContaBancaria(conta);
    setTransferenciaDialogOpen(true);
  }, []);

  const handleExtrato = useCallback((conta) => {
    console.log('View extrato:', conta);
  }, []);

  const handleContaBancariaFormClose = useCallback(() => {
    setContaBancariaFormOpen(false);
    setContaBancariaToEdit(null);
  }, []);

  const handleContaBancariaFormSuccess = useCallback(() => {
    snackbar.success(contaBancariaToEdit ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
  }, [contaBancariaToEdit, snackbar]);

  const handleTransferenciaClose = useCallback(() => {
    setTransferenciaDialogOpen(false);
    setSelectedContaBancaria(null);
  }, []);

  const handleTransferenciaSuccess = useCallback(() => {
    snackbar.success('Transferencia realizada com sucesso!');
  }, [snackbar]);

  // Repasses handlers
  const handleAddRepasse = useCallback(() => {
    console.log('Add repasse');
  }, []);

  const handleViewRepasse = useCallback((repasse) => {
    console.log('View repasse:', repasse);
  }, []);

  const handlePayRepasse = useCallback((repasse) => {
    console.log('Pay repasse:', repasse);
  }, []);

  const tabs = [
    { label: 'Visão Geral', icon: <DashboardIcon />, index: 0 },
    { label: 'Receitas', icon: <ReceitasIcon />, index: 1 },
    { label: 'Despesas', icon: <DespesasIcon />, index: 2 },
    { label: 'Fluxo de Caixa', icon: <FluxoCaixaIcon />, index: 3 },
    { label: 'Contas Bancarias', icon: <ContasBancariasIcon />, index: 4 },
    { label: 'Fornecedores', icon: <FornecedoresIcon />, index: 5 },
    { label: 'Repasses', icon: <RepassesIcon />, index: 6 },
    {
      label: 'Sugestoes',
      icon: sugestoes.length > 0 ? (
        <Badge badgeContent={sugestoes.length} color="error">
          <SugestoesIcon />
        </Badge>
      ) : (
        <SugestoesIcon />
      ),
      index: 7
    },
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

          {/* Receitas (Contas a Receber) Tab */}
          <TabPanel value={activeTab} index={1}>
            <ContasReceberList
              onAdd={handleAddConta}
              onView={handleViewConta}
              onEdit={handleEditConta}
              onDelete={handleDeleteConta}
              onPayment={handlePaymentConta}
            />
          </TabPanel>

          {/* Despesas (Contas a Pagar) Tab */}
          <TabPanel value={activeTab} index={2}>
            <ContasPagarList
              onAdd={handleAddContaPagar}
              onView={handleViewContaPagar}
              onEdit={handleEditContaPagar}
              onDelete={handleDeleteContaPagar}
              onPayment={handlePaymentContaPagar}
            />
          </TabPanel>

          {/* Fluxo de Caixa Tab */}
          <TabPanel value={activeTab} index={3}>
            <CashFlowView />
          </TabPanel>

          {/* Contas Bancarias Tab */}
          <TabPanel value={activeTab} index={4}>
            <ContasBancariasList
              onAdd={handleAddContaBancaria}
              onEdit={handleEditContaBancaria}
              onTransfer={handleTransfer}
              onExtrato={handleExtrato}
            />
          </TabPanel>

          {/* Fornecedores Tab */}
          <TabPanel value={activeTab} index={5}>
            <FornecedoresList
              onAdd={handleAddFornecedor}
              onView={handleViewFornecedor}
              onEdit={handleEditFornecedor}
              onDeactivate={handleDeactivateFornecedor}
            />
          </TabPanel>

          {/* Repasses Tab */}
          <TabPanel value={activeTab} index={6}>
            <RepassesList
              onAdd={handleAddRepasse}
              onView={handleViewRepasse}
              onPay={handlePayRepasse}
            />
          </TabPanel>

          {/* Sugestoes Tab */}
          <TabPanel value={activeTab} index={7}>
            <SugestoesFinanceirasList />
          </TabPanel>
        </Box>
      </Box>

      {/* Dialogs - Contas a Receber */}
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

      {/* Dialogs - Contas a Pagar */}
      <ContaPagarForm
        open={contaPagarFormOpen}
        onClose={handleContaPagarFormClose}
        contaToEdit={contaPagarToEdit}
        onSuccess={handleContaPagarFormSuccess}
      />

      <PagamentoDialog
        open={pagamentoDialogOpen}
        onClose={handlePagamentoClose}
        conta={selectedContaPagar}
        onSuccess={handlePagamentoSuccess}
      />

      {/* Dialogs - Fornecedores */}
      <FornecedorForm
        open={fornecedorFormOpen}
        onClose={handleFornecedorFormClose}
        fornecedorToEdit={fornecedorToEdit}
        onSuccess={handleFornecedorFormSuccess}
      />

      {/* Dialogs - Contas Bancarias */}
      <ContaBancariaForm
        open={contaBancariaFormOpen}
        onClose={handleContaBancariaFormClose}
        contaToEdit={contaBancariaToEdit}
        onSuccess={handleContaBancariaFormSuccess}
      />

      <TransferenciaDialog
        open={transferenciaDialogOpen}
        onClose={handleTransferenciaClose}
        contaOrigem={selectedContaBancaria}
        onSuccess={handleTransferenciaSuccess}
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
