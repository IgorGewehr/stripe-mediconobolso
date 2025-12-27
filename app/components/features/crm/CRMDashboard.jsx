'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  useCRMDashboard,
  useFollowUpRules,
  useReminderConfig,
  usePendingFollowUps,
  useInactivePatients,
} from '../../hooks/useCRM';

import CRMStatsCards from './CRMStatsCards';
import FollowUpRulesList from './FollowUpRulesList';
import FollowUpRuleForm from './FollowUpRuleForm';
import ReminderConfigCard from './ReminderConfigCard';
import PendingFollowUpsList from './PendingFollowUpsList';
import InactivePatientsTable from './InactivePatientsTable';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`crm-tabpanel-${index}`}
      aria-labelledby={`crm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Hooks
  const dashboard = useCRMDashboard();
  const rules = useFollowUpRules();
  const reminderConfig = useReminderConfig();
  const pendingFollowUps = usePendingFollowUps();
  const inactivePatients = useInactivePatients();

  // Show notification
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Rule handlers
  const handleAddRule = () => {
    setEditingRule(null);
    setRuleFormOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleFormOpen(true);
  };

  const handleSaveRule = async (data) => {
    try {
      if (editingRule?.id) {
        await rules.updateRule(editingRule.id, data);
        showNotification('Regra atualizada com sucesso');
      } else {
        await rules.createRule(data);
        showNotification('Regra criada com sucesso');
      }
      setRuleFormOpen(false);
      setEditingRule(null);
    } catch {
      showNotification('Erro ao salvar regra', 'error');
      throw new Error('Erro ao salvar');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta regra?')) {
      return;
    }
    try {
      await rules.deleteRule(id);
      showNotification('Regra excluída com sucesso');
    } catch {
      showNotification('Erro ao excluir regra', 'error');
    }
  };

  const handleToggleRuleActive = async (id, active) => {
    try {
      await rules.toggleRuleActive(id, active);
      showNotification(active ? 'Regra ativada' : 'Regra desativada');
    } catch {
      showNotification('Erro ao alterar status da regra', 'error');
    }
  };

  // Reminder config handlers
  const handleSaveReminderConfig = async (data) => {
    try {
      await reminderConfig.updateConfig(data);
      showNotification('Configuração de lembretes salva com sucesso');
    } catch {
      showNotification('Erro ao salvar configuração', 'error');
    }
  };

  // Follow-up handlers
  const handleCancelFollowUp = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar este follow-up?')) {
      return;
    }
    try {
      await pendingFollowUps.cancelFollowUp(id);
      showNotification('Follow-up cancelado com sucesso');
    } catch {
      showNotification('Erro ao cancelar follow-up', 'error');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          CRM - Gestão de Relacionamento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie follow-ups, lembretes e engajamento de pacientes
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 3 }}>
        <CRMStatsCards
          stats={dashboard.stats}
          loading={dashboard.loading}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="CRM tabs"
        >
          <Tab label="Regras de Follow-up" />
          <Tab label="Lembretes" />
          <Tab label="Pendentes" />
          <Tab label="Inativos" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <FollowUpRulesList
          rules={rules.rules}
          rulesByType={rules.rulesByType}
          loading={rules.loading}
          saving={rules.saving}
          error={rules.error}
          onAdd={handleAddRule}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onToggleActive={handleToggleRuleActive}
          onRefresh={rules.refresh}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ReminderConfigCard
          config={reminderConfig.config}
          loading={reminderConfig.loading}
          saving={reminderConfig.saving}
          error={reminderConfig.error}
          onSave={handleSaveReminderConfig}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <PendingFollowUpsList
          followUps={pendingFollowUps.followUps}
          loading={pendingFollowUps.loading}
          saving={pendingFollowUps.saving}
          error={pendingFollowUps.error}
          pagination={pendingFollowUps.pagination}
          filters={pendingFollowUps.filters}
          onCancel={handleCancelFollowUp}
          onRefresh={pendingFollowUps.refresh}
          onPageChange={pendingFollowUps.goToPage}
          onFilterChange={pendingFollowUps.setFilters}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <InactivePatientsTable
          patients={inactivePatients.patients}
          loading={inactivePatients.loading}
          error={inactivePatients.error}
          pagination={inactivePatients.pagination}
          days={inactivePatients.days}
          onDaysChange={inactivePatients.setDays}
          onRefresh={inactivePatients.refresh}
          onPageChange={inactivePatients.goToPage}
        />
      </TabPanel>

      {/* Rule Form Dialog */}
      <FollowUpRuleForm
        open={ruleFormOpen}
        onClose={() => {
          setRuleFormOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        rule={editingRule}
        saving={rules.saving}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
