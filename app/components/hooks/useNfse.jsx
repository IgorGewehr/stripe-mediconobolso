'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import nfseService from '@/lib/services/api/nfse.service';

// =============================================================================
// DASHBOARD HOOK
// =============================================================================

/**
 * Hook for fiscal dashboard data
 */
export function useFiscalDashboard() {
  return useQuery({
    queryKey: ['nfse', 'dashboard'],
    queryFn: nfseService.getDashboard,
    refetchInterval: 60000, // Refresh every minute
  });
}

// =============================================================================
// CONFIGURAÇÃO HOOKS
// =============================================================================

/**
 * Hook for NFSe configuration
 */
export function useNfseConfiguracao() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nfse', 'configuracao'],
    queryFn: nfseService.getConfiguracao,
  });

  const updateMutation = useMutation({
    mutationFn: nfseService.updateConfiguracao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse', 'configuracao'] });
    },
  });

  return {
    ...query,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

/**
 * Hook for supported municipalities
 */
export function useMunicipios() {
  return useQuery({
    queryKey: ['nfse', 'municipios'],
    queryFn: nfseService.getMunicipios,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

// =============================================================================
// CERTIFICADOS HOOKS
// =============================================================================

/**
 * Hook for certificate management
 */
export function useCertificados(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nfse', 'certificados', options],
    queryFn: () => nfseService.listCertificados(options),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, password, usoPrincipal }) =>
      nfseService.uploadCertificado(file, password, usoPrincipal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse', 'certificados'] });
      queryClient.invalidateQueries({ queryKey: ['nfse', 'configuracao'] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: ({ file, password }) =>
      nfseService.validateCertificado(file, password),
  });

  const desativarMutation = useMutation({
    mutationFn: nfseService.desativarCertificado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse', 'certificados'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: nfseService.deleteCertificado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse', 'certificados'] });
    },
  });

  return {
    ...query,
    certificados: query.data || [],
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    validate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationResult: validateMutation.data,
    desativar: desativarMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
  };
}

// =============================================================================
// RPS HOOKS
// =============================================================================

/**
 * Hook for RPS management
 */
export function useRps(options = {}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(options.page || 1);
  const [perPage, setPerPage] = useState(options.perPage || 20);

  const query = useQuery({
    queryKey: ['nfse', 'rps', { page, perPage }],
    queryFn: () => nfseService.listRps({ page, perPage }),
  });

  const createMutation = useMutation({
    mutationFn: nfseService.createRps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse', 'rps'] });
    },
  });

  return {
    ...query,
    rps: query.data?.items || [],
    total: query.data?.total || 0,
    page,
    perPage,
    setPage,
    setPerPage,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}

// =============================================================================
// NFSe HOOKS
// =============================================================================

/**
 * Hook for NFSe management
 */
export function useNfse(options = {}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(options.page || 1);
  const [perPage, setPerPage] = useState(options.perPage || 20);
  const [filters, setFilters] = useState({
    status: options.status,
    dataInicio: options.dataInicio,
    dataFim: options.dataFim,
  });

  const query = useQuery({
    queryKey: ['nfse', 'list', { page, perPage, ...filters }],
    queryFn: () => nfseService.listNfse({ page, perPage, ...filters }),
  });

  const emitirMutation = useMutation({
    mutationFn: nfseService.emitirNfse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse'] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }) => nfseService.cancelarNfse(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse'] });
    },
  });

  return {
    ...query,
    nfses: query.data?.items || [],
    total: query.data?.total || 0,
    page,
    perPage,
    filters,
    setPage,
    setPerPage,
    setFilters,
    emitir: emitirMutation.mutateAsync,
    isEmitting: emitirMutation.isPending,
    emitError: emitirMutation.error,
    cancelar: cancelarMutation.mutateAsync,
    isCanceling: cancelarMutation.isPending,
  };
}

/**
 * Hook for single NFSe details
 */
export function useNfseDetails(id) {
  return useQuery({
    queryKey: ['nfse', 'details', id],
    queryFn: () => nfseService.getNfse(id),
    enabled: !!id,
  });
}

/**
 * Hook for NFSe XML
 */
export function useNfseXml(id) {
  return useQuery({
    queryKey: ['nfse', 'xml', id],
    queryFn: () => nfseService.getNfseXml(id),
    enabled: !!id,
  });
}

/**
 * Hook for batch status polling
 */
export function useLoteStatus(loteId, options = {}) {
  const { pollInterval = 5000, enabled = true } = options;

  return useQuery({
    queryKey: ['nfse', 'lote', loteId],
    queryFn: () => nfseService.consultarStatusLote(loteId),
    enabled: enabled && !!loteId,
    refetchInterval: (data) => {
      // Stop polling when batch is processed
      if (data?.situacao === 'processado' || data?.situacao === 'erro') {
        return false;
      }
      return pollInterval;
    },
  });
}

// =============================================================================
// EMISSÃO FROM FINANCEIRO
// =============================================================================

/**
 * Hook for emitting NFSe from financial receivable
 */
export function useEmitirFromFinanceiro() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ contaReceberId, options }) =>
      nfseService.emitirNfseFromFinanceiro(contaReceberId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfse'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });

  return {
    emitir: mutation.mutateAsync,
    isEmitting: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}
