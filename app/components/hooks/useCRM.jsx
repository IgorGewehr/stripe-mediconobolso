"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { crmService } from '@/lib/services/api';

/**
 * Hook for CRM dashboard and statistics
 * Provides stats, inactive patients, and follow-up overview
 */
export const useCRMDashboard = (options = {}) => {
  const { autoLoad = true, period = 'month' } = options;
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async (statsPeriod = period) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await crmService.getStats({ period: statsPeriod });
      setStats(data);
    } catch (err) {
      console.error('[useCRMDashboard] Error loading stats:', err);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  const refresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (autoLoad && user) {
      loadStats();
    }
  }, [autoLoad, user]);

  return {
    stats,
    loading,
    error,
    loadStats,
    refresh,
  };
};

/**
 * Hook for managing follow-up rules
 * Provides CRUD operations for CRM automation rules
 */
export const useFollowUpRules = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    ruleType: null,
    active: null,
    ...initialFilters,
  });

  const loadRules = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await crmService.listRules({
        ...filters,
        page,
        perPage: pagination.perPage,
      });

      setRules(response.items);
      setPagination({
        page: response.page,
        perPage: response.per_page,
        total: response.total,
      });
    } catch (err) {
      console.error('[useFollowUpRules] Error loading:', err);
      setError('Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.perPage]);

  const getRule = useCallback(async (id) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const rule = await crmService.getRule(id);
      setSelectedRule(rule);
      return rule;
    } catch (err) {
      console.error('[useFollowUpRules] Error getting rule:', err);
      setError('Erro ao carregar detalhes');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRule = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await crmService.createRule(data);
      await loadRules(1);
      return result;
    } catch (err) {
      console.error('[useFollowUpRules] Error creating:', err);
      setError('Erro ao criar regra');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadRules]);

  const updateRule = useCallback(async (id, data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await crmService.updateRule(id, data);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
      if (selectedRule?.id === id) {
        setSelectedRule(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useFollowUpRules] Error updating:', err);
      setError('Erro ao atualizar regra');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedRule?.id]);

  const deleteRule = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await crmService.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      if (selectedRule?.id === id) {
        setSelectedRule(null);
      }
    } catch (err) {
      console.error('[useFollowUpRules] Error deleting:', err);
      setError('Erro ao excluir regra');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedRule?.id]);

  const toggleRuleActive = useCallback(async (id, active) => {
    return updateRule(id, { active });
  }, [updateRule]);

  const selectRule = useCallback(async (id) => {
    if (id) {
      await getRule(id);
    } else {
      setSelectedRule(null);
    }
  }, [getRule]);

  const refresh = useCallback(() => {
    loadRules(pagination.page);
  }, [loadRules, pagination.page]);

  // Group rules by type
  const rulesByType = useMemo(() => {
    const grouped = {
      post_consultation: [],
      pending_return: [],
      inactivity: [],
    };

    rules.forEach((rule) => {
      if (grouped[rule.rule_type]) {
        grouped[rule.rule_type].push(rule);
      }
    });

    return grouped;
  }, [rules]);

  // Count active rules
  const activeRulesCount = useMemo(() => {
    return rules.filter((r) => r.active).length;
  }, [rules]);

  useEffect(() => {
    if (autoLoad && user) {
      loadRules(1);
    }
  }, [autoLoad, user]);

  return {
    rules,
    selectedRule,
    loading,
    saving,
    error,
    pagination,
    filters,
    rulesByType,
    activeRulesCount,
    setFilters,
    loadRules,
    getRule,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    selectRule,
    refresh,
  };
};

/**
 * Hook for appointment reminder configuration
 */
export const useReminderConfig = (options = {}) => {
  const { autoLoad = true } = options;
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadConfig = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await crmService.getReminderConfig();
      setConfig(data);
    } catch (err) {
      console.error('[useReminderConfig] Error loading:', err);
      setError('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateConfig = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await crmService.updateReminderConfig(data);
      setConfig(updated);
      return updated;
    } catch (err) {
      console.error('[useReminderConfig] Error updating:', err);
      setError('Erro ao atualizar configuração');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const toggleActive = useCallback(async (active) => {
    if (!config) return;
    return updateConfig({
      reminderHours: config.reminder_hours,
      channels: config.channels,
      messageTemplate: config.message_template,
      active,
    });
  }, [config, updateConfig]);

  useEffect(() => {
    if (autoLoad && user) {
      loadConfig();
    }
  }, [autoLoad, user]);

  return {
    config,
    loading,
    saving,
    error,
    loadConfig,
    updateConfig,
    toggleActive,
  };
};

/**
 * Hook for managing pending follow-ups
 */
export const usePendingFollowUps = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    patientId: null,
    status: null,
    ...initialFilters,
  });

  const loadFollowUps = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await crmService.listPendingFollowUps({
        ...filters,
        page,
        perPage: pagination.perPage,
      });

      setFollowUps(response.items);
      setPagination({
        page: response.page,
        perPage: response.per_page,
        total: response.total,
      });
    } catch (err) {
      console.error('[usePendingFollowUps] Error loading:', err);
      setError('Erro ao carregar follow-ups');
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.perPage]);

  const cancelFollowUp = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await crmService.cancelFollowUp(id);
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? updated : f))
      );
      return updated;
    } catch (err) {
      console.error('[usePendingFollowUps] Error canceling:', err);
      setError('Erro ao cancelar follow-up');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const refresh = useCallback(() => {
    loadFollowUps(pagination.page);
  }, [loadFollowUps, pagination.page]);

  const goToPage = useCallback((page) => {
    loadFollowUps(page);
  }, [loadFollowUps]);

  // Group by status
  const followUpsByStatus = useMemo(() => {
    const grouped = {
      pending: [],
      sent: [],
      responded: [],
      completed: [],
      cancelled: [],
      failed: [],
    };

    followUps.forEach((fu) => {
      if (grouped[fu.status]) {
        grouped[fu.status].push(fu);
      }
    });

    return grouped;
  }, [followUps]);

  // Count pending
  const pendingCount = useMemo(() => {
    return followUps.filter((f) => f.status === 'pending').length;
  }, [followUps]);

  useEffect(() => {
    if (autoLoad && user) {
      loadFollowUps(1);
    }
  }, [autoLoad, user]);

  useEffect(() => {
    if (!autoLoad || !user) return;

    const timer = setTimeout(() => {
      loadFollowUps(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.status, filters.patientId]);

  return {
    followUps,
    loading,
    saving,
    error,
    pagination,
    filters,
    followUpsByStatus,
    pendingCount,
    setFilters,
    loadFollowUps,
    cancelFollowUp,
    refresh,
    goToPage,
  };
};

/**
 * Hook for inactive patients list
 */
export const useInactivePatients = (options = {}) => {
  const { autoLoad = true, inactiveDays = 90 } = options;
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(inactiveDays);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });

  const loadPatients = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await crmService.listInactivePatients({
        days,
        page,
        perPage: pagination.perPage,
      });

      setPatients(response.items);
      setPagination({
        page: response.page,
        perPage: response.per_page,
        total: response.total,
      });
    } catch (err) {
      console.error('[useInactivePatients] Error loading:', err);
      setError('Erro ao carregar pacientes inativos');
    } finally {
      setLoading(false);
    }
  }, [user, days, pagination.perPage]);

  const refresh = useCallback(() => {
    loadPatients(pagination.page);
  }, [loadPatients, pagination.page]);

  const goToPage = useCallback((page) => {
    loadPatients(page);
  }, [loadPatients]);

  useEffect(() => {
    if (autoLoad && user) {
      loadPatients(1);
    }
  }, [autoLoad, user]);

  useEffect(() => {
    if (!autoLoad || !user) return;

    const timer = setTimeout(() => {
      loadPatients(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [days]);

  return {
    patients,
    loading,
    error,
    days,
    setDays,
    pagination,
    loadPatients,
    refresh,
    goToPage,
  };
};

/**
 * Hook for default message templates
 */
export const useDefaultTemplates = (options = {}) => {
  const { autoLoad = true } = options;
  const { user } = useAuth();

  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTemplates = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await crmService.getDefaultTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('[useDefaultTemplates] Error loading:', err);
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (autoLoad && user) {
      loadTemplates();
    }
  }, [autoLoad, user]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
  };
};

// Default export for convenience
const useCRM = useCRMDashboard;
export default useCRM;
