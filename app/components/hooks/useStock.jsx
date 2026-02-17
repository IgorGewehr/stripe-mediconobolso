"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import { stockService } from '@/lib/services/api';

/**
 * Hook para gerenciar o estado e operações de estoque
 */
const useStock = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // Estados
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    ...initialFilters,
  });

  /**
   * Load stock list
   */
  const loadStock = useCallback(async (page = 1) => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await stockService.getAll({
        page,
        perPage: pagination.perPage,
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
      });

      setItems(response.items || response || []);
      setPagination((prev) => ({
        ...prev,
        page: response.page || 1,
        total: response.total || 0,
      }));
    } catch (err) {
      console.error('[useStock] Error loading stock:', err);
      setError('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  }, [doctorId, filters, pagination.perPage]);

  /**
   * Create new item
   */
  const createItem = useCallback(async (stockData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newItem = await stockService.create(stockData);
      setItems((prev) => [newItem, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      return newItem;
    } catch (err) {
      console.error('[useStock] Error creating stock item:', err);
      setError('Erro ao criar item no estoque');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update existing item
   */
  const updateItem = useCallback(async (itemId, stockData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updatedItem = await stockService.update(itemId, stockData);

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updatedItem : item))
      );

      if (selectedItem?.id === itemId) {
        setSelectedItem(updatedItem);
      }

      return updatedItem;
    } catch (err) {
      console.error('[useStock] Error updating stock item:', err);
      setError('Erro ao atualizar item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedItem?.id]);

  /**
   * Delete item (soft delete)
   */
  const deleteItem = useCallback(async (itemId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await stockService.delete(itemId);

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }

      return true;
    } catch (err) {
      console.error('[useStock] Error deleting stock item:', err);
      setError('Erro ao excluir item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedItem?.id]);

  /**
   * Register movement (IN/OUT)
   */
  const registerMovement = useCallback(async (itemId, type, quantity, notes) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await stockService.addMovement(itemId, type, quantity, notes);
      
      await loadStock(pagination.page);
      return result;
    } catch (err) {
      console.error('[useStock] Error registering movement:', err);
      setError('Erro ao registrar movimentação');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, loadStock, pagination.page]);

  useEffect(() => {
    if (autoLoad && doctorId) {
      loadStock();
    }
  }, [autoLoad, doctorId, loadStock]);

  return {
    items,
    selectedItem,
    loading,
    saving,
    error,
    pagination,
    filters,
    setFilters,
    loadStock,
    createItem,
    updateItem,
    deleteItem,
    registerMovement,
    setSelectedItem
  };
};

export default useStock;