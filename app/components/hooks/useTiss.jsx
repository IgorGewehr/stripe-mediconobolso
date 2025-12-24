'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../providers/authProvider';

/**
 * TISS Module - DESABILITADO
 *
 * Este módulo está temporariamente desabilitado aguardando implementação
 * completa dos endpoints no doctor-server.
 *
 * Para habilitar, defina TISS_ENABLED = true
 */
const TISS_ENABLED = false;

/**
 * Hook para gerenciar operações TISS
 * Centraliza estado e lógica de negócios do módulo de faturamento
 *
 * NOTA: Módulo desabilitado - retorna dados vazios e funções no-op
 */
export function useTiss() {
  const { user } = useAuth();
  const doctorId = user?.uid;

  // Estado geral
  const [loading] = useState(false);
  const [error] = useState(null);

  // Estados específicos - sempre vazios quando desabilitado
  const [operadoras] = useState([]);
  const [guias] = useState([]);
  const [lotes] = useState([]);
  const [stats] = useState(null);

  // Se TISS estiver desabilitado, retornar funções que não fazem nada
  if (!TISS_ENABLED) {
    const noOp = async () => {
      console.warn('[TISS] Módulo desabilitado - funcionalidade em desenvolvimento');
      return null;
    };

    const noOpArray = async () => {
      console.warn('[TISS] Módulo desabilitado - funcionalidade em desenvolvimento');
      return [];
    };

    const noOpThrow = async () => {
      throw new Error('Módulo TISS temporariamente desabilitado. Em breve estará disponível.');
    };

    return {
      // Estado
      loading: false,
      error: null,
      clearError: () => {},
      operadoras: [],
      guias: [],
      lotes: [],
      stats: null,

      // Flag de status
      isEnabled: false,
      isDisabledMessage: 'Módulo de faturamento TISS em desenvolvimento. Em breve estará disponível.',

      // Operadoras
      fetchOperadoras: noOpArray,
      searchOperadoras: noOpArray,

      // Guias
      fetchGuias: noOp,
      createGuia: noOpThrow,
      updateGuia: noOpThrow,
      deleteGuia: noOpThrow,
      validarGuia: noOpThrow,
      addProcedimento: noOpThrow,

      // Lotes
      fetchLotes: noOp,
      createLote: noOpThrow,
      fecharLote: noOpThrow,
      downloadLoteXml: noOpThrow,

      // Beneficiários
      listConveniosPaciente: noOpArray,
      vincularPacienteConvenio: noOpThrow,

      // TUSS
      searchTussCodes: noOpArray,

      // Estatísticas
      fetchStats: noOp,

      // Financeiro
      getResumoFinanceiro: noOp,
      getPrevisaoRecebimento: noOpArray,
      criarContaDeLote: noOpThrow,
      registrarRecebimento: noOpThrow,
    };
  }

  // ===============================================================
  // CÓDIGO ORIGINAL - SÓ EXECUTA SE TISS_ENABLED = true
  // ===============================================================

  // Importação dinâmica do serviço (só quando habilitado)
  const [tissService, setTissService] = useState(null);

  useEffect(() => {
    if (TISS_ENABLED) {
      import('@/lib/services/tiss.service').then(module => {
        setTissService(module.default);
      });
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {}, []);

  // ==================== OPERADORAS ====================

  const fetchOperadoras = useCallback(async () => {
    if (!tissService) return [];
    try {
      const response = await tissService.listOperadoras();
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, [tissService]);

  const searchOperadoras = useCallback(async (termo) => {
    if (!tissService) return [];
    try {
      const response = await tissService.searchOperadoras(termo);
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, [tissService]);

  // ==================== GUIAS ====================

  const fetchGuias = useCallback(async (filters = {}) => {
    if (!doctorId || !tissService) return { items: [], pagination: null };
    try {
      const response = await tissService.listGuias({
        doctor_id: doctorId,
        ...filters,
      });
      return response.data;
    } catch (err) {
      return { items: [], pagination: null };
    }
  }, [doctorId, tissService]);

  const createGuia = useCallback(async (guiaData) => {
    if (!doctorId || !tissService) throw new Error('Serviço não disponível');
    const response = await tissService.createGuia({
      doctor_id: doctorId,
      ...guiaData,
    });
    return response.data;
  }, [doctorId, tissService]);

  const updateGuia = useCallback(async (id, data) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.updateGuia(id, data);
    return response.data;
  }, [tissService]);

  const deleteGuia = useCallback(async (id) => {
    if (!tissService) throw new Error('Serviço não disponível');
    await tissService.deleteGuia(id);
    return true;
  }, [tissService]);

  const validarGuia = useCallback(async (id) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.validarGuia(id);
    return response.data;
  }, [tissService]);

  const addProcedimento = useCallback(async (guiaId, procedimento) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.addProcedimentoToGuia(guiaId, procedimento);
    return response.data;
  }, [tissService]);

  // ==================== LOTES ====================

  const fetchLotes = useCallback(async (filters = {}) => {
    if (!doctorId || !tissService) return { items: [], pagination: null };
    try {
      const response = await tissService.listLotes({
        doctor_id: doctorId,
        ...filters,
      });
      return response.data;
    } catch (err) {
      return { items: [], pagination: null };
    }
  }, [doctorId, tissService]);

  const createLote = useCallback(async (loteData) => {
    if (!doctorId || !tissService) throw new Error('Serviço não disponível');
    const response = await tissService.createLote({
      doctor_id: doctorId,
      ...loteData,
    });
    return response.data;
  }, [doctorId, tissService]);

  const fecharLote = useCallback(async (id, gerarXml = true) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.fecharLote(id, gerarXml);
    return response.data;
  }, [tissService]);

  const downloadLoteXml = useCallback(async (id) => {
    if (!tissService) throw new Error('Serviço não disponível');
    await tissService.downloadLoteXml(id);
  }, [tissService]);

  // ==================== BENEFICIÁRIOS ====================

  const listConveniosPaciente = useCallback(async (patientId) => {
    if (!doctorId || !tissService) return [];
    try {
      const response = await tissService.listConveniosPaciente(doctorId, patientId);
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, [doctorId, tissService]);

  const vincularPacienteConvenio = useCallback(async (data) => {
    if (!doctorId || !tissService) throw new Error('Serviço não disponível');
    const response = await tissService.vincularPacienteConvenio({
      doctor_id: doctorId,
      ...data,
    });
    return response.data;
  }, [doctorId, tissService]);

  // ==================== TUSS ====================

  const searchTussCodes = useCallback(async (termo, tipo = null) => {
    if (!tissService) return [];
    try {
      const response = await tissService.searchTussCodes(termo, tipo);
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, [tissService]);

  // ==================== ESTATÍSTICAS ====================

  const fetchStats = useCallback(async () => {
    if (!doctorId || !tissService) return null;
    try {
      const response = await tissService.getStats(doctorId);
      return response.data;
    } catch (err) {
      return null;
    }
  }, [doctorId, tissService]);

  // ==================== FINANCEIRO ====================

  const getResumoFinanceiro = useCallback(async (dataInicio, dataFim) => {
    if (!doctorId || !tissService) return null;
    try {
      const response = await tissService.getResumoFinanceiro(doctorId, dataInicio, dataFim);
      return response.data;
    } catch (err) {
      return null;
    }
  }, [doctorId, tissService]);

  const getPrevisaoRecebimento = useCallback(async (meses = 3) => {
    if (!doctorId || !tissService) return [];
    try {
      const response = await tissService.getPrevisaoRecebimento(doctorId, meses);
      return response.data || [];
    } catch (err) {
      return [];
    }
  }, [doctorId, tissService]);

  const criarContaDeLote = useCallback(async (loteId, diasParaPagamento = 45) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.criarContaDeLote(loteId, diasParaPagamento);
    return response.data;
  }, [tissService]);

  const registrarRecebimento = useCallback(async (contaId, data) => {
    if (!tissService) throw new Error('Serviço não disponível');
    const response = await tissService.registrarRecebimento(contaId, data);
    return response.data;
  }, [tissService]);

  return {
    // Estado
    loading,
    error,
    clearError,
    operadoras,
    guias,
    lotes,
    stats,

    // Flag de status
    isEnabled: TISS_ENABLED,
    isDisabledMessage: null,

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
