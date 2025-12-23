'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../providers/authProvider';
import tissService from '@/lib/services/tiss.service';

/**
 * Hook para gerenciar operações TISS
 * Centraliza estado e lógica de negócios do módulo de faturamento
 */
export function useTiss() {
  const { user } = useAuth();
  const doctorId = user?.uid;

  // Estado geral
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados específicos
  const [operadoras, setOperadoras] = useState([]);
  const [guias, setGuias] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [stats, setStats] = useState(null);

  // Limpar erro
  const clearError = useCallback(() => setError(null), []);

  // ==================== OPERADORAS ====================

  const fetchOperadoras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tissService.listOperadoras();
      setOperadoras(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchOperadoras = useCallback(async (termo) => {
    try {
      const response = await tissService.searchOperadoras(termo);
      return response.data || [];
    } catch (err) {
      console.error('Erro ao buscar operadoras:', err);
      return [];
    }
  }, []);

  // ==================== GUIAS ====================

  const fetchGuias = useCallback(async (filters = {}) => {
    if (!doctorId) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await tissService.listGuias({
        doctor_id: doctorId,
        ...filters,
      });
      setGuias(response.data?.items || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      return { items: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const createGuia = useCallback(async (guiaData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setLoading(true);
    setError(null);
    try {
      const response = await tissService.createGuia({
        doctor_id: doctorId,
        ...guiaData,
      });
      // Atualizar lista
      await fetchGuias();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [doctorId, fetchGuias]);

  const updateGuia = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tissService.updateGuia(id, data);
      await fetchGuias();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchGuias]);

  const deleteGuia = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await tissService.deleteGuia(id);
      await fetchGuias();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchGuias]);

  const validarGuia = useCallback(async (id) => {
    try {
      const response = await tissService.validarGuia(id);
      return response.data;
    } catch (err) {
      console.error('Erro ao validar guia:', err);
      throw err;
    }
  }, []);

  const addProcedimento = useCallback(async (guiaId, procedimento) => {
    try {
      const response = await tissService.addProcedimentoToGuia(guiaId, procedimento);
      return response.data;
    } catch (err) {
      console.error('Erro ao adicionar procedimento:', err);
      throw err;
    }
  }, []);

  // ==================== LOTES ====================

  const fetchLotes = useCallback(async (filters = {}) => {
    if (!doctorId) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await tissService.listLotes({
        doctor_id: doctorId,
        ...filters,
      });
      setLotes(response.data?.items || []);
      return response.data;
    } catch (err) {
      setError(err.message);
      return { items: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const createLote = useCallback(async (loteData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setLoading(true);
    setError(null);
    try {
      const response = await tissService.createLote({
        doctor_id: doctorId,
        ...loteData,
      });
      await fetchLotes();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [doctorId, fetchLotes]);

  const fecharLote = useCallback(async (id, gerarXml = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tissService.fecharLote(id, gerarXml);
      await fetchLotes();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLotes]);

  const downloadLoteXml = useCallback(async (id) => {
    try {
      await tissService.downloadLoteXml(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ==================== BENEFICIÁRIOS ====================

  const listConveniosPaciente = useCallback(async (patientId) => {
    if (!doctorId) return [];

    try {
      const response = await tissService.listConveniosPaciente(doctorId, patientId);
      return response.data || [];
    } catch (err) {
      console.error('Erro ao buscar convênios do paciente:', err);
      return [];
    }
  }, [doctorId]);

  const vincularPacienteConvenio = useCallback(async (data) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    try {
      const response = await tissService.vincularPacienteConvenio({
        doctor_id: doctorId,
        ...data,
      });
      return response.data;
    } catch (err) {
      console.error('Erro ao vincular paciente:', err);
      throw err;
    }
  }, [doctorId]);

  // ==================== TUSS ====================

  const searchTussCodes = useCallback(async (termo, tipo = null) => {
    try {
      const response = await tissService.searchTussCodes(termo, tipo);
      return response.data || [];
    } catch (err) {
      console.error('Erro ao buscar códigos TUSS:', err);
      return [];
    }
  }, []);

  // ==================== ESTATÍSTICAS ====================

  const fetchStats = useCallback(async () => {
    if (!doctorId) return null;

    try {
      const response = await tissService.getStats(doctorId);
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    }
  }, [doctorId]);

  // ==================== FINANCEIRO ====================

  const getResumoFinanceiro = useCallback(async (dataInicio, dataFim) => {
    if (!doctorId) return null;

    try {
      const response = await tissService.getResumoFinanceiro(doctorId, dataInicio, dataFim);
      return response.data;
    } catch (err) {
      console.error('Erro ao buscar resumo financeiro:', err);
      return null;
    }
  }, [doctorId]);

  const getPrevisaoRecebimento = useCallback(async (meses = 3) => {
    if (!doctorId) return [];

    try {
      const response = await tissService.getPrevisaoRecebimento(doctorId, meses);
      return response.data || [];
    } catch (err) {
      console.error('Erro ao buscar previsão:', err);
      return [];
    }
  }, [doctorId]);

  const criarContaDeLote = useCallback(async (loteId, diasParaPagamento = 45) => {
    try {
      const response = await tissService.criarContaDeLote(loteId, diasParaPagamento);
      return response.data;
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      throw err;
    }
  }, []);

  const registrarRecebimento = useCallback(async (contaId, data) => {
    try {
      const response = await tissService.registrarRecebimento(contaId, data);
      return response.data;
    } catch (err) {
      console.error('Erro ao registrar recebimento:', err);
      throw err;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (doctorId) {
      fetchOperadoras();
      fetchStats();
    }
  }, [doctorId, fetchOperadoras, fetchStats]);

  return {
    // Estado
    loading,
    error,
    clearError,
    operadoras,
    guias,
    lotes,
    stats,

    // Operadoras
    fetchOperadoras,
    searchOperadoras,

    // Guias
    fetchGuias,
    createGuia,
    updateGuia,
    deleteGuia,
    validarGuia,
    addProcedimento,

    // Lotes
    fetchLotes,
    createLote,
    fecharLote,
    downloadLoteXml,

    // Beneficiários
    listConveniosPaciente,
    vincularPacienteConvenio,

    // TUSS
    searchTussCodes,

    // Estatísticas
    fetchStats,

    // Financeiro
    getResumoFinanceiro,
    getPrevisaoRecebimento,
    criarContaDeLote,
    registrarRecebimento,
  };
}

export default useTiss;
