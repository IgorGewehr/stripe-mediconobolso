'use client';

import { useState, useCallback, useRef } from 'react';
import tissService from '@/lib/services/tiss.service';

/**
 * Hook para autocomplete de códigos TUSS
 * Inclui debounce e cache para melhor performance
 */
export function useTussAutocomplete(options = {}) {
  const { tipo = null, minChars = 2, debounceMs = 300 } = options;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());

  const search = useCallback(async (termo) => {
    // Limpar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Não buscar se termo for muito curto
    if (!termo || termo.length < minChars) {
      setResults([]);
      return;
    }

    // Verificar cache
    const cacheKey = `${termo}-${tipo || 'all'}`;
    if (cacheRef.current.has(cacheKey)) {
      setResults(cacheRef.current.get(cacheKey));
      return;
    }

    // Debounce
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await tissService.searchTussCodes(termo, tipo);
        const data = response.data || [];

        // Salvar no cache
        cacheRef.current.set(cacheKey, data);

        // Limitar tamanho do cache
        if (cacheRef.current.size > 100) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }

        setResults(data);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [tipo, minChars, debounceMs]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear,
    clearCache,
  };
}

export default useTussAutocomplete;
