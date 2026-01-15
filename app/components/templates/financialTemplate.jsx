'use client';

/**
 * @fileoverview Financial Management Template - Redesign Minimalista
 * @description Interface limpa e focada: 3 abas principais + configurações
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Drawer,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as ReceitasIcon,
  TrendingDown as DespesasIcon,
  Settings as SettingsIcon,
  Business as FornecedoresIcon,
  CreditCard as ContasBancariasIcon,
  Category as CategoriasIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  LocalHospital as ConveniosIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/authProvider';
import { useSnackbar } from '../hooks/useDialogState';
import { usePatients } from '../hooks/usePatients';
import { useConvenios } from '../hooks/useConvenios';
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
  RepassesList,
  ConveniosList,
  ConvenioForm,
} from '../features/financial';
import { useSugestoesFinanceiras } from '../hooks/useFinancial';

// Theme colors - Design system minimalista
const theme = {
  primary: '#1852FE',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
  },
};

/**
 * TabPanel - Renderiza conteudo da aba ativa
 */
function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

/**
 * ConfigDrawer - Drawer lateral para configuracoes
 */
function ConfigDrawer({ open, onClose, onSelectOption }) {
  const configOptions = [
    { id: 'convenios', label: 'Convenios', icon: ConveniosIcon, description: 'Gerenciar convenios/planos' },
    { id: 'fornecedores', label: 'Fornecedores', icon: FornecedoresIcon, description: 'Gerenciar fornecedores' },
    { id: 'contas-bancarias', label: 'Contas Bancarias', icon: ContasBancariasIcon, description: 'Gerenciar contas' },
    { id: 'categorias', label: 'Categorias', icon: CategoriasIcon, description: 'Categorias financeiras' },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          bgcolor: theme.surface,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Configuracoes
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ pt: 1 }}>
        {configOptions.map((option) => (
          <ListItemButton
            key={option.id}
            onClick={() => onSelectOption(option.id)}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { bgcolor: 'rgba(24, 82, 254, 0.04)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <option.icon sx={{ color: theme.text.secondary }} />
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.description}
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
              secondaryTypographyProps={{ fontSize: '0.8rem' }}
            />
            <ChevronRightIcon sx={{ color: theme.text.secondary, fontSize: 20 }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

/**
 * DespesasUnificadas - Aba de Despesas com toggle para Repasses
 */
function DespesasUnificadas({
  onAddContaPagar,
  onViewContaPagar,
  onEditContaPagar,
  onDeleteContaPagar,
  onPaymentContaPagar,
  onAddRepasse,
  onViewRepasse,
  onPayRepasse,
}) {
  const [viewMode, setViewMode] = useState('despesas'); // 'despesas' | 'repasses'

  return (
    <Box>
      {/* Toggle simples */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Box
          onClick={() => setViewMode('despesas')}
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: viewMode === 'despesas' ? theme.primary : 'transparent',
            color: viewMode === 'despesas' ? '#fff' : theme.text.secondary,
            fontWeight: 500,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: viewMode === 'despesas' ? theme.primary : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          Despesas
        </Box>
        <Box
          onClick={() => setViewMode('repasses')}
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: viewMode === 'repasses' ? theme.primary : 'transparent',
            color: viewMode === 'repasses' ? '#fff' : theme.text.secondary,
            fontWeight: 500,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: viewMode === 'repasses' ? theme.primary : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          Repasses
        </Box>
      </Box>

      {/* Conteudo */}
      {viewMode === 'despesas' ? (
        <ContasPagarList
          onAdd={onAddContaPagar}
          onView={onViewContaPagar}
          onEdit={onEditContaPagar}
          onDelete={onDeleteContaPagar}
          onPayment={onPaymentContaPagar}
        />
      ) : (
        <RepassesList
          onAdd={onAddRepasse}
          onView={onViewRepasse}
          onPay={onPayRepasse}
        />
      )}
    </Box>
  );
}

/**
 * Financial Management Template - Versao Minimalista
 */
export default function FinancialTemplate() {
  const { user } = useAuth();
  const snackbar = useSnackbar();

  // Debug: Log user info on mount
  console.log('[FinancialTemplate] Rendered with user:', user?.email, 'clinicMode:', user?.clinicMode);

  // Tab state - apenas 3 abas
  const [activeTab, setActiveTab] = useState(0);

  // Config drawer state
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [configView, setConfigView] = useState(null); // 'fornecedores' | 'contas-bancarias' | null

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

  // Dialog states - Convenios
  const [convenioFormOpen, setConvenioFormOpen] = useState(false);
  const [convenioToEdit, setConvenioToEdit] = useState(null);

  // Sugestoes count
  const { sugestoes } = useSugestoesFinanceiras();

  // Load patients and convenios for ContaReceberForm
  const { patients, loading: loadingPatients } = usePatients({ autoLoad: true });
  const { convenios, loading: loadingConvenios } = useConvenios({ autoLoad: true });

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    console.log('[FinancialTemplate] Tab changed to:', newValue === 0 ? 'Resumo' : newValue === 1 ? 'Receber' : 'Pagar');
    setActiveTab(newValue);
  };

  // Config drawer handlers
  const handleConfigSelect = useCallback((option) => {
    setConfigView(option);
  }, []);

  const handleConfigBack = useCallback(() => {
    setConfigView(null);
  }, []);

  // Conta a Receber handlers
  const handleAddConta = useCallback(() => {
    console.log('[FinancialTemplate] handleAddConta - Opening form');
    setContaToEdit(null);
    setContaFormOpen(true);
  }, []);

  const handleViewConta = useCallback((conta) => {
    console.log('[FinancialTemplate] handleViewConta:', conta?.id, conta?.descricao);
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
    snackbar.showSuccess(contaToEdit ? 'Conta atualizada!' : 'Conta criada!');
  }, [contaToEdit, snackbar]);

  const handleRecebimentoClose = useCallback(() => {
    setRecebimentoDialogOpen(false);
    setSelectedConta(null);
  }, []);

  const handleRecebimentoSuccess = useCallback(() => {
    snackbar.showSuccess('Recebimento registrado!');
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
    snackbar.showSuccess(contaPagarToEdit ? 'Conta atualizada!' : 'Conta criada!');
  }, [contaPagarToEdit, snackbar]);

  const handlePagamentoClose = useCallback(() => {
    setPagamentoDialogOpen(false);
    setSelectedContaPagar(null);
  }, []);

  const handlePagamentoSuccess = useCallback(() => {
    snackbar.showSuccess('Pagamento registrado!');
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
    snackbar.showSuccess(fornecedorToEdit ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
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
    snackbar.showSuccess(contaBancariaToEdit ? 'Conta atualizada!' : 'Conta criada!');
  }, [contaBancariaToEdit, snackbar]);

  const handleTransferenciaClose = useCallback(() => {
    setTransferenciaDialogOpen(false);
    setSelectedContaBancaria(null);
  }, []);

  const handleTransferenciaSuccess = useCallback(() => {
    snackbar.showSuccess('Transferencia realizada!');
  }, [snackbar]);

  // Convenio handlers
  const handleAddConvenio = useCallback(() => {
    setConvenioToEdit(null);
    setConvenioFormOpen(true);
  }, []);

  const handleEditConvenio = useCallback((convenio) => {
    setConvenioToEdit(convenio);
    setConvenioFormOpen(true);
  }, []);

  const handleDeleteConvenio = useCallback((convenio) => {
    console.log('Delete convenio:', convenio);
  }, []);

  const handleConvenioFormClose = useCallback(() => {
    setConvenioFormOpen(false);
    setConvenioToEdit(null);
  }, []);

  const handleConvenioFormSuccess = useCallback(() => {
    snackbar.showSuccess(convenioToEdit ? 'Convenio atualizado!' : 'Convenio criado!');
  }, [convenioToEdit, snackbar]);

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

  // Tabs config - apenas 3 abas principais
  const tabs = [
    { label: 'Visao Geral', icon: <DashboardIcon /> },
    { label: 'Receitas', icon: <ReceitasIcon /> },
    { label: 'Despesas', icon: <DespesasIcon /> },
  ];

  // Render config content
  const renderConfigContent = () => {
    if (configView === 'fornecedores') {
      return (
        <Box>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleConfigBack} size="small">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              Fornecedores
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <FornecedoresList
              onAdd={handleAddFornecedor}
              onView={handleViewFornecedor}
              onEdit={handleEditFornecedor}
              onDeactivate={handleDeactivateFornecedor}
            />
          </Box>
        </Box>
      );
    }

    if (configView === 'contas-bancarias') {
      return (
        <Box>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleConfigBack} size="small">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              Contas Bancarias
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <ContasBancariasList
              onAdd={handleAddContaBancaria}
              onEdit={handleEditContaBancaria}
              onTransfer={handleTransfer}
              onExtrato={handleExtrato}
            />
          </Box>
        </Box>
      );
    }

    if (configView === 'convenios') {
      return (
        <Box>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleConfigBack} size="small">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              Convenios
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <ConveniosList
              onAdd={handleAddConvenio}
              onEdit={handleEditConvenio}
              onDelete={handleDeleteConvenio}
            />
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.background,
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Container principal */}
      <Box
        sx={{
          bgcolor: theme.surface,
          borderRadius: 3,
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Header com tabs e config */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.border}`,
            px: 2,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.925rem',
                color: theme.text.secondary,
                '&.Mui-selected': {
                  color: theme.primary,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.primary,
                height: 2,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                sx={{ gap: 1 }}
              />
            ))}
          </Tabs>

          {/* Botao de configuracoes */}
          <Tooltip title="Configuracoes">
            <IconButton
              onClick={() => setConfigDrawerOpen(true)}
              sx={{
                color: theme.text.secondary,
                '&:hover': {
                  bgcolor: 'rgba(24, 82, 254, 0.08)',
                  color: theme.primary,
                },
              }}
            >
              <Badge
                badgeContent={sugestoes?.length || 0}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
              >
                <SettingsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Conteudo das abas */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Visao Geral */}
          <TabPanel value={activeTab} index={0}>
            <FinancialDashboard />
          </TabPanel>

          {/* Receitas */}
          <TabPanel value={activeTab} index={1}>
            <ContasReceberList
              onAdd={handleAddConta}
              onView={handleViewConta}
              onEdit={handleEditConta}
              onDelete={handleDeleteConta}
              onPayment={handlePaymentConta}
            />
          </TabPanel>

          {/* Despesas (unificado com Repasses) */}
          <TabPanel value={activeTab} index={2}>
            <DespesasUnificadas
              onAddContaPagar={handleAddContaPagar}
              onViewContaPagar={handleViewContaPagar}
              onEditContaPagar={handleEditContaPagar}
              onDeleteContaPagar={handleDeleteContaPagar}
              onPaymentContaPagar={handlePaymentContaPagar}
              onAddRepasse={handleAddRepasse}
              onViewRepasse={handleViewRepasse}
              onPayRepasse={handlePayRepasse}
            />
          </TabPanel>
        </Box>
      </Box>

      {/* Config Drawer */}
      <Drawer
        anchor="right"
        open={configDrawerOpen}
        onClose={() => {
          setConfigDrawerOpen(false);
          setConfigView(null);
        }}
        PaperProps={{
          sx: {
            width: configView ? 600 : 320,
            bgcolor: theme.surface,
            transition: 'width 0.3s',
          },
        }}
      >
        {configView ? (
          renderConfigContent()
        ) : (
          <ConfigDrawer
            open={true}
            onClose={() => setConfigDrawerOpen(false)}
            onSelectOption={handleConfigSelect}
          />
        )}
      </Drawer>

      {/* Dialogs - Contas a Receber */}
      <ContaReceberForm
        open={contaFormOpen}
        onClose={handleContaFormClose}
        contaToEdit={contaToEdit}
        onSuccess={handleContaFormSuccess}
        pacientes={patients}
        convenios={convenios}
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

      {/* Dialogs - Convenios */}
      <ConvenioForm
        open={convenioFormOpen}
        onClose={handleConvenioFormClose}
        convenioToEdit={convenioToEdit}
        onSuccess={handleConvenioFormSuccess}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={snackbar.handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={snackbar.handleClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
