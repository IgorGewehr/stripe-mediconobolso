'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import conveniosService from '@/lib/services/api/convenios.service';

/**
 * Hook for managing convenios (insurance providers) state and operations
 * Provides CRUD operations for clinic-level insurance management
 */
const useConvenios = (options = {}) => {
  const { autoLoad = true } = options;
  const { user } = useAuth();

  // State
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0,
  });

  /**
   * Load convenios list
   */
  const loadConvenios = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await conveniosService.list({
        page,
        perPage: pagination.perPage,
      });

      setConvenios(response.items || []);
      setPagination((prev) => ({
        ...prev,
        page: response.page || 1,
        total: response.total || 0,
      }));
    } catch (err) {
      console.error('[useConvenios] Error loading convenios:', err);
      setError('Erro ao carregar convenios');
    } finally {
      setLoading(false);
    }
  }, [user, pagination.perPage]);

  /**
   * Get convenio by ID
   */
  const getConvenio = useCallback(async (id) => {
    if (!user) return null;

    try {
      return await conveniosService.get(id);
    } catch (err) {
      console.error('[useConvenios] Error getting convenio:', err);
      setError('Erro ao carregar convenio');
      return null;
    }
  }, [user]);

  /**
   * Create new convenio
   */
  const createConvenio = useCallback(async (data) => {
    if (!user) return null;

    setSaving(true);
    setError(null);

    try {
      const result = await conveniosService.create(data);
      // Reload list to include new item
      await loadConvenios(pagination.page);
      return result;
    } catch (err) {
      console.error('[useConvenios] Error creating convenio:', err);
      setError('Erro ao criar convenio');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadConvenios, pagination.page]);

  /**
   * Update existing convenio
   */
  const updateConvenio = useCallback(async (id, data) => {
    if (!user) return null;

    setSaving(true);
    setError(null);

    try {
      const result = await conveniosService.update(id, data);
      // Reload list to reflect changes
      await loadConvenios(pagination.page);
      return result;
    } catch (err) {
      console.error('[useConvenios] Error updating convenio:', err);
      setError('Erro ao atualizar convenio');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadConvenios, pagination.page]);

  /**
   * Delete convenio
   */
  const deleteConvenio = useCallback(async (id) => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      await conveniosService.delete(id);
      // Reload list
      await loadConvenios(pagination.page);
    } catch (err) {
      console.error('[useConvenios] Error deleting convenio:', err);
      setError('Erro ao excluir convenio');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadConvenios, pagination.page]);

  /**
   * Change page
   */
  const changePage = useCallback((newPage) => {
    loadConvenios(newPage);
  }, [loadConvenios]);

  /**
   * Refresh list
   */
  const refresh = useCallback(() => {
    loadConvenios(pagination.page);
  }, [loadConvenios, pagination.page]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && user) {
      loadConvenios();
    }
  }, [autoLoad, user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    convenios,
    pagination,

    // Loading states
    loading,
    saving,
    error,

    // Actions
    loadConvenios,
    getConvenio,
    createConvenio,
    updateConvenio,
    deleteConvenio,
    changePage,
    refresh,
  };
};

export default useConvenios;
export { useConvenios };
