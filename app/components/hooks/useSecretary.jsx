"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { secretaryService } from '@/lib/services/api';

/**
 * Hook for managing secretaries state and operations
 * Provides CRUD, permissions management, and validation
 */
const useSecretary = (options = {}) => {
  const { autoLoad = true } = options;
  const { user, isSecretary: currentUserIsSecretary, workingDoctorId } = useAuth();

  const doctorId = currentUserIsSecretary ? workingDoctorId : user?.uid;

  // State
  const [secretaries, setSecretaries] = useState([]);
  const [selectedSecretary, setSelectedSecretary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    includeInactive: false,
  });

  /**
   * Load secretaries list
   */
  const loadSecretaries = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await secretaryService.list(filters.includeInactive);
      setSecretaries(data);

      // Also get count
      const activeCount = await secretaryService.count();
      setCount(activeCount);
    } catch (err) {
      console.error('[useSecretary] Error loading secretaries:', err);
      setError('Erro ao carregar secretárias');
    } finally {
      setLoading(false);
    }
  }, [doctorId, filters.includeInactive]);

  /**
   * Get secretary by ID
   */
  const getSecretary = useCallback(async (secretaryId) => {
    if (!doctorId) return null;

    setLoading(true);

    try {
      const secretary = await secretaryService.getById(secretaryId);
      setSelectedSecretary(secretary);
      return secretary;
    } catch (err) {
      console.error('[useSecretary] Error getting secretary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Create new secretary
   */
  const createSecretary = useCallback(async (secretaryData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newSecretary = await secretaryService.create(secretaryData);
      setSecretaries((prev) => [...prev, newSecretary]);
      setCount((prev) => prev + 1);
      return newSecretary;
    } catch (err) {
      console.error('[useSecretary] Error creating secretary:', err);
      setError('Erro ao criar secretária');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update secretary
   */
  const updateSecretary = useCallback(async (secretaryId, secretaryData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await secretaryService.update(secretaryId, secretaryData);

      setSecretaries((prev) =>
        prev.map((s) => (s.id === secretaryId ? updated : s))
      );

      if (selectedSecretary?.id === secretaryId) {
        setSelectedSecretary(updated);
      }

      return updated;
    } catch (err) {
      console.error('[useSecretary] Error updating secretary:', err);
      setError('Erro ao atualizar secretária');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedSecretary?.id]);

  /**
   * Update secretary permissions
   */
  const updatePermissions = useCallback(async (secretaryId, permissions) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await secretaryService.updatePermissions(secretaryId, permissions);

      setSecretaries((prev) =>
        prev.map((s) => (s.id === secretaryId ? updated : s))
      );

      if (selectedSecretary?.id === secretaryId) {
        setSelectedSecretary(updated);
      }

      return updated;
    } catch (err) {
      console.error('[useSecretary] Error updating permissions:', err);
      setError('Erro ao atualizar permissões');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedSecretary?.id]);

  /**
   * Deactivate secretary
   */
  const deactivateSecretary = useCallback(async (secretaryId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await secretaryService.deactivate(secretaryId);

      setSecretaries((prev) =>
        prev.map((s) => (s.id === secretaryId ? updated : s))
      );

      if (selectedSecretary?.id === secretaryId) {
        setSelectedSecretary(updated);
      }

      setCount((prev) => prev - 1);

      return updated;
    } catch (err) {
      console.error('[useSecretary] Error deactivating secretary:', err);
      setError('Erro ao desativar secretária');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedSecretary?.id]);

  /**
   * Reactivate secretary
   */
  const reactivateSecretary = useCallback(async (secretaryId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await secretaryService.reactivate(secretaryId);

      setSecretaries((prev) =>
        prev.map((s) => (s.id === secretaryId ? updated : s))
      );

      if (selectedSecretary?.id === secretaryId) {
        setSelectedSecretary(updated);
      }

      setCount((prev) => prev + 1);

      return updated;
    } catch (err) {
      console.error('[useSecretary] Error reactivating secretary:', err);
      setError('Erro ao reativar secretária');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedSecretary?.id]);

  /**
   * Check if email exists
   */
  const checkEmailExists = useCallback(async (email) => {
    if (!doctorId) return false;

    try {
      return await secretaryService.checkEmailExists(email);
    } catch (err) {
      console.error('[useSecretary] Error checking email:', err);
      return false;
    }
  }, [doctorId]);

  /**
   * Validate operation for current secretary
   */
  const validateOperation = useCallback(async (requiredModule, requiredAction) => {
    if (!doctorId || !currentUserIsSecretary) return true;

    try {
      return await secretaryService.validateOperation(user?.uid, requiredModule, requiredAction);
    } catch (err) {
      console.error('[useSecretary] Error validating operation:', err);
      return false;
    }
  }, [doctorId, currentUserIsSecretary, user?.uid]);

  /**
   * Generate secretaries report
   */
  const generateReport = useCallback(async () => {
    if (!doctorId) return null;

    try {
      return await secretaryService.generateReport();
    } catch (err) {
      console.error('[useSecretary] Error generating report:', err);
      return null;
    }
  }, [doctorId]);

  /**
   * Select a secretary
   */
  const selectSecretary = useCallback((secretaryId) => {
    if (secretaryId) {
      const secretary = secretaries.find((s) => s.id === secretaryId);
      setSelectedSecretary(secretary || null);
    } else {
      setSelectedSecretary(null);
    }
  }, [secretaries]);

  /**
   * Refresh secretaries list
   */
  const refresh = useCallback(() => {
    loadSecretaries();
  }, [loadSecretaries]);

  // Filter secretaries client-side
  const filteredSecretaries = useMemo(() => {
    if (!filters.search) return secretaries;

    const searchLower = filters.search.toLowerCase();
    return secretaries.filter((secretary) => {
      const nameMatch = secretary.name?.toLowerCase().includes(searchLower);
      const emailMatch = secretary.email?.toLowerCase().includes(searchLower);
      const phoneMatch = secretary.phone?.includes(filters.search);
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [secretaries, filters.search]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: secretaries.length,
    active: secretaries.filter((s) => s.isActive).length,
    inactive: secretaries.filter((s) => !s.isActive).length,
  }), [secretaries]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && doctorId) {
      loadSecretaries();
    }
  }, [autoLoad, doctorId]);

  // Reload when includeInactive changes
  useEffect(() => {
    if (doctorId) {
      loadSecretaries();
    }
  }, [filters.includeInactive]);

  return {
    // State
    secretaries: filteredSecretaries,
    allSecretaries: secretaries,
    selectedSecretary,
    loading,
    saving,
    error,
    count,
    stats,

    // Filters
    filters,
    setFilters,

    // Actions
    loadSecretaries,
    getSecretary,
    createSecretary,
    updateSecretary,
    updatePermissions,
    deactivateSecretary,
    reactivateSecretary,
    checkEmailExists,
    validateOperation,
    generateReport,
    selectSecretary,
    refresh,

    // Context
    doctorId,
    isSecretary: currentUserIsSecretary,
  };
};

export default useSecretary;
