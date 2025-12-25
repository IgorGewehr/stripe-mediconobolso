'use client';

import { useState, useCallback } from 'react';

/**
 * useAsyncOperation Hook
 *
 * Provides standardized async operation handling with loading, error, and data states.
 * Reduces boilerplate for try-catch-finally patterns across components.
 *
 * @param {Object} options - Configuration options
 * @param {any} options.initialData - Initial data value (default: null)
 * @param {Function} options.onSuccess - Callback on successful operation
 * @param {Function} options.onError - Callback on error
 * @returns {Object} Async operation state and handlers
 *
 * @example
 * const { isLoading, error, data, execute, reset } = useAsyncOperation();
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     return await apiService.createItem(formData);
 *   });
 * };
 */
export function useAsyncOperation(options = {}) {
  const {
    initialData = null,
    onSuccess = null,
    onError = null
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(initialData);

  /**
   * Execute an async operation with automatic state management
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise<any>} Result of the async function
   */
  const execute = useCallback(async (asyncFn) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  /**
   * Execute without throwing errors (safe mode)
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
   */
  const executeSafe = useCallback(async (asyncFn) => {
    try {
      const result = await execute(asyncFn);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [execute]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(initialData);
  }, [initialData]);

  /**
   * Clear only the error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set data manually
   */
  const setDataManually = useCallback((newData) => {
    setData(newData);
  }, []);

  return {
    // State
    isLoading,
    error,
    data,
    hasError: !!error,
    hasData: data !== null && data !== undefined,

    // Actions
    execute,
    executeSafe,
    reset,
    clearError,
    setData: setDataManually,

    // Aliases for common patterns
    loading: isLoading,
    isPending: isLoading
  };
}

/**
 * useMultipleAsyncOperations Hook
 *
 * Manages multiple named async operations independently.
 * Useful when a component has several async actions.
 *
 * @example
 * const ops = useMultipleAsyncOperations(['save', 'delete', 'refresh']);
 *
 * const handleSave = async () => {
 *   await ops.execute('save', () => api.save(data));
 * };
 *
 * // Check individual operation state
 * if (ops.isLoading('save')) { ... }
 */
export function useMultipleAsyncOperations(operationNames = []) {
  const [states, setStates] = useState(() => {
    const initial = {};
    operationNames.forEach(name => {
      initial[name] = { isLoading: false, error: null, data: null };
    });
    return initial;
  });

  const execute = useCallback(async (name, asyncFn) => {
    setStates(prev => ({
      ...prev,
      [name]: { ...prev[name], isLoading: true, error: null }
    }));

    try {
      const result = await asyncFn();
      setStates(prev => ({
        ...prev,
        [name]: { isLoading: false, error: null, data: result }
      }));
      return result;
    } catch (err) {
      setStates(prev => ({
        ...prev,
        [name]: { isLoading: false, error: err.message, data: null }
      }));
      throw err;
    }
  }, []);

  const isLoading = useCallback((name) => {
    return states[name]?.isLoading || false;
  }, [states]);

  const getError = useCallback((name) => {
    return states[name]?.error || null;
  }, [states]);

  const getData = useCallback((name) => {
    return states[name]?.data || null;
  }, [states]);

  const isAnyLoading = Object.values(states).some(s => s.isLoading);

  return {
    states,
    execute,
    isLoading,
    getError,
    getData,
    isAnyLoading
  };
}

export default useAsyncOperation;
