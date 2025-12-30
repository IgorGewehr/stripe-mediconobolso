'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';

/**
 * Hook para gerenciar operacoes de Glossas (contestacoes de faturamento)
 * Centraliza estado e logica de negocios do modulo de glosas
 */
export function useGlossas() {
  const { user } = useAuth();

  // Estado geral
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [glossasService, setGlossasService] = useState(null);

  // Estados de dados
  const [glossas, setGlossas] = useState([]);
  const [glossaAtual, setGlossaAtual] = useState(null);
  const [recursos, setRecursos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [tendencias, setTendencias] = useState([]);
  const [rankingConvenios, setRankingConvenios] = useState([]);
  const [iaStatus, setIaStatus] = useState({ enabled: false, message: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  // Carregar servico dinamicamente
  useEffect(() => {
    import('@/lib/services/glossas.service').then(module => {
      setGlossasService(module.default);
    });
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== GLOSSAS CRUD ====================

  const fetchGlossas = useCallback(async (filters = {}) => {
    if (!glossasService) return { items: [], pagination: null };
    setLoading(true);
    try {
      const response = await glossasService.listGlossas({
        page: pagination.page,
        perPage: pagination.per_page,
        ...filters,
      });
      setGlossas(response.items || []);
      setPagination({
        page: response.page || 1,
        perPage: response.perPage || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      });
      return response;
    } catch (err) {
      setError(err.message);
      return { items: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, [glossasService, pagination.page, pagination.per_page]);

  const getGlossa = useCallback(async (id) => {
    if (!glossasService) return null;
    setLoading(true);
    try {
      const response = await glossasService.getGlossa(id);
      setGlossaAtual(response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const createGlossa = useCallback(async (data) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.createGlossa(data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const updateGlossa = useCallback(async (id, data) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.updateGlossa(id, data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const deleteGlossa = useCallback(async (id) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      await glossasService.deleteGlossa(id);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  // ==================== ACOES DE GLOSSA ====================

  const aceitarGlossa = useCallback(async (id) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.aceitarGlossa(id);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const recuperarGlossa = useCallback(async (id, valorRecuperado) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.recuperarGlossa(id, valorRecuperado);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const perderGlossa = useCallback(async (id) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.perderGlossa(id);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  // ==================== RECURSOS ====================

  const fetchRecursos = useCallback(async (glossaId) => {
    if (!glossasService) return [];
    setLoading(true);
    try {
      const response = await glossasService.listRecursos(glossaId);
      setRecursos(response || []);
      return response;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const createRecurso = useCallback(async (glossaId, data) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.createRecurso(glossaId, data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const updateRecurso = useCallback(async (glossaId, recursoId, data) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.updateRecurso(glossaId, recursoId, data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const deleteRecurso = useCallback(async (glossaId, recursoId) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      await glossasService.deleteRecurso(glossaId, recursoId);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const iniciarElaboracao = useCallback(async (glossaId, recursoId) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.iniciarElaboracao(glossaId, recursoId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const enviarRecurso = useCallback(async (glossaId, recursoId) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.enviarRecurso(glossaId, recursoId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const registrarResposta = useCallback(async (glossaId, recursoId, data) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.registrarResposta(glossaId, recursoId, data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const adicionarDocumento = useCallback(async (glossaId, recursoId, documento) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.adicionarDocumento(glossaId, recursoId, documento);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  // ==================== DASHBOARD E ESTATISTICAS ====================

  const fetchDashboard = useCallback(async (dataInicio = null, dataFim = null, convenioId = null) => {
    if (!glossasService) return null;
    setLoading(true);
    try {
      const response = await glossasService.getDashboard(dataInicio, dataFim, convenioId);
      setDashboard(response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const fetchEstatisticas = useCallback(async (dataInicio = null, dataFim = null) => {
    if (!glossasService) return null;
    setLoading(true);
    try {
      const response = await glossasService.getEstatisticas(dataInicio, dataFim);
      setEstatisticas(response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const fetchTendencias = useCallback(async () => {
    if (!glossasService) return [];
    setLoading(true);
    try {
      const response = await glossasService.getTendencias();
      setTendencias(response || []);
      return response;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const fetchRankingConvenios = useCallback(async (dataInicio = null, dataFim = null) => {
    if (!glossasService) return [];
    setLoading(true);
    try {
      const response = await glossasService.getRankingConvenios(dataInicio, dataFim);
      setRankingConvenios(response?.convenios || []);
      return response;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  // ==================== IA ====================

  const fetchIAStatus = useCallback(async () => {
    if (!glossasService) return { enabled: false, message: '' };
    try {
      const response = await glossasService.getIAStatus();
      setIaStatus(response);
      return response;
    } catch (err) {
      setIaStatus({ enabled: false, message: 'Erro ao verificar status da IA' });
      return { enabled: false, message: err.message };
    }
  }, [glossasService]);

  const analisarGlossaIA = useCallback(async (id, contextoAdicional = null) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.analisarGlossaIA(id, contextoAdicional);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const gerarRecursoIA = useCallback(async (id, motivoRecurso, informacoesAdicionais = null) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.gerarRecursoIA(id, motivoRecurso, informacoesAdicionais);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const melhorarRecursoIA = useCallback(async (glossaId, recursoId) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.melhorarRecursoIA(glossaId, recursoId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  const analisarPadroesIA = useCallback(async (convenioId = null, dataInicio = null, dataFim = null, limit = 50) => {
    if (!glossasService) throw new Error('Servico nao disponivel');
    setLoading(true);
    try {
      const response = await glossasService.analisarPadroesIA(convenioId, dataInicio, dataFim, limit);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [glossasService]);

  // ==================== HELPERS ====================

  const helpers = useMemo(() => {
    if (!glossasService) {
      return {
        formatCurrency: (v) => `R$ ${v?.toFixed(2) || '0.00'}`,
        formatDate: (d) => d || '-',
        getStatusColor: () => 'default',
        getStatusLabel: (s) => s || '-',
        getTipoGlossaLabel: (t) => t || '-',
      };
    }
    return {
      formatCurrency: glossasService.formatCurrency,
      formatDate: glossasService.formatDate,
      getStatusColor: glossasService.getStatusColor,
      getStatusLabel: glossasService.getStatusLabel,
      getTipoGlossaLabel: glossasService.getTipoGlossaLabel,
    };
  }, [glossasService]);

  // Paginacao
  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPerPage = useCallback((perPage) => {
    setPagination(prev => ({ ...prev, perPage, page: 1 }));
  }, []);

  return {
    // Estado
    loading,
    error,
    clearError,
    isReady: !!glossasService,

    // Dados
    glossas,
    glossaAtual,
    recursos,
    dashboard,
    estatisticas,
    tendencias,
    rankingConvenios,
    iaStatus,
    pagination,
    setPage,
    setPerPage,

    // Glossas CRUD
    fetchGlossas,
    getGlossa,
    createGlossa,
    updateGlossa,
    deleteGlossa,

    // Acoes
    aceitarGlossa,
    recuperarGlossa,
    perderGlossa,

    // Recursos
    fetchRecursos,
    createRecurso,
    updateRecurso,
    deleteRecurso,
    iniciarElaboracao,
    enviarRecurso,
    registrarResposta,
    adicionarDocumento,

    // Dashboard
    fetchDashboard,
    fetchEstatisticas,
    fetchTendencias,
    fetchRankingConvenios,

    // IA
    fetchIAStatus,
    analisarGlossaIA,
    gerarRecursoIA,
    melhorarRecursoIA,
    analisarPadroesIA,

    // Helpers
    ...helpers,
  };
}

export default useGlossas;
