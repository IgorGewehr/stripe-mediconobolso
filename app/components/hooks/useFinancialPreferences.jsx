'use client';

/**
 * @fileoverview Hook for Financial Preferences
 * @description Manages user financial preferences (auto-generate account after consultation)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import financialService from '@/lib/services/api/financial.service';

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for managing user financial preferences
 * @returns {Object} Financial preferences state and actions
 */
export function useFinancialPreferences() {
  const queryClient = useQueryClient();

  // Fetch preferences
  const query = useQuery({
    queryKey: ['financial', 'preferences'],
    queryFn: financialService.getFinancialPreferences,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: financialService.updateFinancialPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial', 'preferences'] });
    },
  });

  // Helper to transform snake_case to camelCase
  const preferences = query.data
    ? {
        gerarContaAutomatica: query.data.gerar_conta_automatica,
        valorConsultaPadrao: query.data.valor_consulta_padrao,
        categoriaId: query.data.categoria_id,
        diasVencimento: query.data.dias_vencimento,
      }
    : null;

  return {
    // State
    preferences,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Refetch
    refetch: query.refetch,
  };
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to get dias vencimento options
 * @returns {Array<{value: number, label: string}>}
 */
export function getDiasVencimentoOptions() {
  return [
    { value: 0, label: 'No dia da consulta' },
    { value: 7, label: '7 dias' },
    { value: 15, label: '15 dias' },
    { value: 30, label: '30 dias' },
    { value: 60, label: '60 dias' },
  ];
}

export default useFinancialPreferences;
