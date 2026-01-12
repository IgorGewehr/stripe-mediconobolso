'use client';

/**
 * @fileoverview CRM Management Template - Elegant & Minimal
 * @description Modern CRM template with email campaigns, follow-ups, and patient engagement
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Users,
  Mail,
  TrendingUp,
  Clock,
  UserX,
  Send,
  Settings,
  Bell,
  RefreshCw,
  ChevronRight,
  Check,
  MailPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// CRM Components
import {
  useCRMDashboard,
  useFollowUpRules,
  useReminderConfig,
  usePendingFollowUps,
  useInactivePatients,
} from '../hooks/useCRM';
import FollowUpRulesList from '../features/crm/FollowUpRulesList';
import FollowUpRuleForm from '../features/crm/FollowUpRuleForm';
import ReminderConfigCard from '../features/crm/ReminderConfigCard';
import PendingFollowUpsList from '../features/crm/PendingFollowUpsList';
import InactivePatientsTable from '../features/crm/InactivePatientsTable';

// Email Campaign Component
import EmailCampaignSection from '../features/crm/EmailCampaignSection';

// ============================================================================
// Elegant UI Components (Shadcn-inspired)
// ============================================================================

const Card = ({ className, children, onClick }) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200/60 bg-white text-slate-900 shadow-sm hover:shadow-md transition-all duration-300',
      className
    )}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
  >
    {children}
  </div>
);

const CardContent = ({ className, children }) => (
  <div className={cn('p-5', className)}>{children}</div>
);

// ============================================================================
// Stats Card Component
// ============================================================================

const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  borderClass,
  bgClass,
  iconClass,
  loading,
}) => (
  <Card
    className={cn(
      'border-l-4 relative overflow-hidden group',
      borderClass,
      'hover:translate-y-[-2px]'
    )}
  >
    <div
      className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        bgClass?.replace('bg-', 'bg-gradient-to-br from-') + '/10 to-white'
      )}
    />
    <CardContent className="flex items-center justify-between relative z-10">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
          {title}
        </p>
        {loading ? (
          <div className="h-9 w-20 bg-slate-200 rounded animate-pulse mt-1" />
        ) : (
          <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
          bgClass
        )}
      >
        <Icon className={cn('w-5 h-5', iconClass)} />
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Tab Navigation Component
// ============================================================================

const TabButton = ({ active, icon: Icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative',
      active
        ? 'bg-primary text-white shadow-md shadow-primary/25'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={cn(
          'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
          active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
        )}
      >
        {badge}
      </span>
    )}
  </button>
);

// ============================================================================
// Main CRM Template Component
// ============================================================================

export default function CRMTemplate() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // CRM Hooks
  const dashboard = useCRMDashboard();
  const rules = useFollowUpRules();
  const reminderConfig = useReminderConfig();
  const pendingFollowUps = usePendingFollowUps();
  const inactivePatients = useInactivePatients();

  // Notification handler
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta regra?')) return;
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
    if (!window.confirm('Tem certeza que deseja cancelar este follow-up?'))
      return;
    try {
      await pendingFollowUps.cancelFollowUp(id);
      showNotification('Follow-up cancelado com sucesso');
    } catch {
      showNotification('Erro ao cancelar follow-up', 'error');
    }
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Tab definitions
  const tabs = [
    { icon: Settings, label: 'Regras', badge: rules.rules?.length },
    { icon: Bell, label: 'Lembretes' },
    { icon: Clock, label: 'Pendentes', badge: pendingFollowUps.followUps?.length },
    { icon: UserX, label: 'Inativos', badge: inactivePatients.patients?.length },
    { icon: MailPlus, label: 'Email em Massa' },
  ];

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/80 bg-fixed">
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-slate-500 mt-1">
              Gerencie follow-ups, campanhas e relacionamento com pacientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Atualizar dados">
              <IconButton
                onClick={() => {
                  dashboard.refresh?.();
                  rules.refresh?.();
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <RefreshCw className="w-5 h-5" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Taxa de Retorno"
            value={formatPercentage(dashboard.stats?.return_rate)}
            subtitle="Pacientes que retornaram"
            icon={TrendingUp}
            borderClass="border-l-blue-500"
            bgClass="bg-blue-50"
            iconClass="text-blue-600"
            loading={dashboard.loading}
          />
          <StatsCard
            title="Follow-ups Enviados"
            value={dashboard.stats?.total_follow_ups_sent || 0}
            subtitle="No periodo"
            icon={Send}
            borderClass="border-l-emerald-500"
            bgClass="bg-emerald-50"
            iconClass="text-emerald-600"
            loading={dashboard.loading}
          />
          <StatsCard
            title="Taxa de Resposta"
            value={formatPercentage(dashboard.stats?.response_rate)}
            subtitle="Mensagens respondidas"
            icon={Mail}
            borderClass="border-l-violet-500"
            bgClass="bg-violet-50"
            iconClass="text-violet-600"
            loading={dashboard.loading}
          />
          <StatsCard
            title="Pacientes Inativos"
            value={dashboard.stats?.total_inactive_patients || 0}
            subtitle="Sem consulta 90+ dias"
            icon={UserX}
            borderClass="border-l-amber-500"
            bgClass="bg-amber-50"
            iconClass="text-amber-600"
            loading={dashboard.loading}
          />
        </div>

        {/* Main Content Card */}
        <Card className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200/60 bg-slate-50/50 px-4 py-3">
            <div className={cn(
              'flex gap-2',
              isMobile ? 'overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide' : 'flex-wrap'
            )}>
              {tabs.map((tab, index) => (
                <TabButton
                  key={index}
                  active={activeTab === index}
                  icon={tab.icon}
                  label={tab.label}
                  badge={tab.badge}
                  onClick={() => setActiveTab(index)}
                />
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {/* Regras de Follow-up */}
            {activeTab === 0 && (
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
            )}

            {/* Lembretes */}
            {activeTab === 1 && (
              <ReminderConfigCard
                config={reminderConfig.config}
                loading={reminderConfig.loading}
                saving={reminderConfig.saving}
                error={reminderConfig.error}
                onSave={handleSaveReminderConfig}
              />
            )}

            {/* Pendentes */}
            {activeTab === 2 && (
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
            )}

            {/* Inativos */}
            {activeTab === 3 && (
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
            )}

            {/* Email em Massa */}
            {activeTab === 4 && (
              <EmailCampaignSection
                onSuccess={(msg) => showNotification(msg, 'success')}
                onError={(msg) => showNotification(msg, 'error')}
              />
            )}
          </div>
        </Card>
      </div>

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

      {/* Snackbar */}
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
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
