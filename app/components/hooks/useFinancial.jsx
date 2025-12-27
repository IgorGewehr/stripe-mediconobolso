"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { financialService } from '@/lib/services/api';

/**
 * Hook for financial dashboard data
 * Provides KPIs, cash flow, and summary data
 */
export const useFinancialDashboard = (options = {}) => {
  const { autoLoad = true, periodoFluxoCaixa = 30 } = options;
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await financialService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('[useFinancialDashboard] Error loading dashboard:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadFluxoCaixa = useCallback(async (dataInicio, dataFim) => {
    if (!user) return;

    try {
      const data = await financialService.getFluxoCaixa({ dataInicio, dataFim });
      setFluxoCaixa(data);
      return data;
    } catch (err) {
      console.error('[useFinancialDashboard] Error loading cash flow:', err);
      setError('Erro ao carregar fluxo de caixa');
      return [];
    }
  }, [user]);

  const loadFluxoCaixaUltimoDias = useCallback(async (dias = periodoFluxoCaixa) => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);

    const dataInicio = inicio.toISOString().split('T')[0];
    const dataFim = hoje.toISOString().split('T')[0];

    return loadFluxoCaixa(dataInicio, dataFim);
  }, [loadFluxoCaixa, periodoFluxoCaixa]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadDashboard(),
      loadFluxoCaixaUltimoDias(),
    ]);
  }, [loadDashboard, loadFluxoCaixaUltimoDias]);

  useEffect(() => {
    if (autoLoad && user) {
      refresh();
    }
  }, [autoLoad, user]);

  return {
    dashboard,
    fluxoCaixa,
    loading,
    error,
    loadDashboard,
    loadFluxoCaixa,
    loadFluxoCaixaUltimoDias,
    refresh,
  };
};

/**
 * Hook for managing contas a receber
 * Provides CRUD operations and filtering
 */
export const useContasReceber = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [contas, setContas] = useState([]);
  const [selectedConta, setSelectedConta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    pacienteId: null,
    profissionalId: null,
    convenioId: null,
    origem: null,
    status: null,
    dataVencimentoInicio: null,
    dataVencimentoFim: null,
    apenasVencidos: false,
    apenasPendentes: true,
    ...initialFilters,
  });

  const loadContas = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await financialService.listContasReceber({
        ...filters,
        page,
        perPage: pagination.perPage,
      });

      setContas(response.items);
      setPagination({
        page: response.page,
        perPage: response.perPage,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      console.error('[useContasReceber] Error loading:', err);
      setError('Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.perPage]);

  const getConta = useCallback(async (id) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const conta = await financialService.getContaReceber(id);
      setSelectedConta(conta);
      return conta;
    } catch (err) {
      console.error('[useContasReceber] Error getting conta:', err);
      setError('Erro ao carregar detalhes');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConta = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await financialService.createContaReceber(data);
      await loadContas(1);
      return result;
    } catch (err) {
      console.error('[useContasReceber] Error creating:', err);
      setError('Erro ao criar conta a receber');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadContas]);

  const updateConta = useCallback(async (id, data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.updateContaReceber(id, data);
      setContas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      if (selectedConta?.id === id) {
        setSelectedConta(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useContasReceber] Error updating:', err);
      setError('Erro ao atualizar conta a receber');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const deleteConta = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await financialService.deleteContaReceber(id);
      setContas((prev) => prev.filter((c) => c.id !== id));
      if (selectedConta?.id === id) {
        setSelectedConta(null);
      }
    } catch (err) {
      console.error('[useContasReceber] Error deleting:', err);
      setError('Erro ao excluir conta a receber');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const registrarRecebimento = useCallback(async (contaId, recebimentoData) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const recebimento = await financialService.registrarRecebimento(contaId, recebimentoData);
      // Reload the conta to get updated values
      const updated = await financialService.getContaReceber(contaId);
      setContas((prev) =>
        prev.map((c) => (c.id === contaId ? updated : c))
      );
      if (selectedConta?.id === contaId) {
        setSelectedConta(updated);
      }
      return recebimento;
    } catch (err) {
      console.error('[useContasReceber] Error registering payment:', err);
      setError('Erro ao registrar recebimento');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const selectConta = useCallback(async (id) => {
    if (id) {
      await getConta(id);
    } else {
      setSelectedConta(null);
    }
  }, [getConta]);

  const refresh = useCallback(() => {
    loadContas(pagination.page);
  }, [loadContas, pagination.page]);

  const goToPage = useCallback((page) => {
    loadContas(page);
  }, [loadContas]);

  // Stats
  const stats = useMemo(() => {
    const pendentes = contas.filter((c) => ['pendente', 'parcial'].includes(c.status));
    const vencidos = contas.filter((c) => c.status === 'vencido');

    return {
      totalPendente: pendentes.reduce((sum, c) => sum + (c.valorPendente || 0), 0),
      totalVencido: vencidos.reduce((sum, c) => sum + (c.valorPendente || 0), 0),
      qtdPendentes: pendentes.length,
      qtdVencidos: vencidos.length,
    };
  }, [contas]);

  useEffect(() => {
    if (autoLoad && user) {
      loadContas(1);
    }
  }, [autoLoad, user]);

  // Reload when filters change (debounced)
  useEffect(() => {
    if (!autoLoad || !user) return;

    const timer = setTimeout(() => {
      loadContas(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.apenasPendentes, filters.apenasVencidos, filters.pacienteId, filters.convenioId, filters.origem]);

  return {
    contas,
    selectedConta,
    loading,
    saving,
    error,
    pagination,
    stats,
    filters,
    setFilters,
    loadContas,
    getConta,
    createConta,
    updateConta,
    deleteConta,
    registrarRecebimento,
    selectConta,
    refresh,
    goToPage,
  };
};

/**
 * Hook for managing contas a pagar
 */
export const useContasPagar = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [contas, setContas] = useState([]);
  const [selectedConta, setSelectedConta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    fornecedorId: null,
    status: null,
    dataVencimentoInicio: null,
    dataVencimentoFim: null,
    apenasVencidos: false,
    apenasPendentes: true,
    ...initialFilters,
  });

  const loadContas = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await financialService.listContasPagar({
        ...filters,
        page,
        perPage: pagination.perPage,
      });

      setContas(response.items);
      setPagination({
        page: response.page,
        perPage: response.perPage,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      console.error('[useContasPagar] Error loading:', err);
      setError('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.perPage]);

  const getConta = useCallback(async (id) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const conta = await financialService.getContaPagar(id);
      setSelectedConta(conta);
      return conta;
    } catch (err) {
      console.error('[useContasPagar] Error getting conta:', err);
      setError('Erro ao carregar detalhes');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConta = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await financialService.createContaPagar(data);
      await loadContas(1);
      return result;
    } catch (err) {
      console.error('[useContasPagar] Error creating:', err);
      setError('Erro ao criar conta a pagar');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadContas]);

  const updateConta = useCallback(async (id, data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.updateContaPagar(id, data);
      setContas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      if (selectedConta?.id === id) {
        setSelectedConta(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useContasPagar] Error updating:', err);
      setError('Erro ao atualizar conta a pagar');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const deleteConta = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await financialService.deleteContaPagar(id);
      setContas((prev) => prev.filter((c) => c.id !== id));
      if (selectedConta?.id === id) {
        setSelectedConta(null);
      }
    } catch (err) {
      console.error('[useContasPagar] Error deleting:', err);
      setError('Erro ao excluir conta a pagar');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const registrarPagamento = useCallback(async (contaId, pagamentoData) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const pagamento = await financialService.registrarPagamento(contaId, pagamentoData);
      const updated = await financialService.getContaPagar(contaId);
      setContas((prev) =>
        prev.map((c) => (c.id === contaId ? updated : c))
      );
      if (selectedConta?.id === contaId) {
        setSelectedConta(updated);
      }
      return pagamento;
    } catch (err) {
      console.error('[useContasPagar] Error registering payment:', err);
      setError('Erro ao registrar pagamento');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedConta?.id]);

  const selectConta = useCallback(async (id) => {
    if (id) {
      await getConta(id);
    } else {
      setSelectedConta(null);
    }
  }, [getConta]);

  const refresh = useCallback(() => {
    loadContas(pagination.page);
  }, [loadContas, pagination.page]);

  const goToPage = useCallback((page) => {
    loadContas(page);
  }, [loadContas]);

  useEffect(() => {
    if (autoLoad && user) {
      loadContas(1);
    }
  }, [autoLoad, user]);

  useEffect(() => {
    if (!autoLoad || !user) return;

    const timer = setTimeout(() => {
      loadContas(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.apenasPendentes, filters.apenasVencidos, filters.fornecedorId]);

  return {
    contas,
    selectedConta,
    loading,
    saving,
    error,
    pagination,
    filters,
    setFilters,
    loadContas,
    getConta,
    createConta,
    updateConta,
    deleteConta,
    registrarPagamento,
    selectConta,
    refresh,
    goToPage,
  };
};

/**
 * Hook for managing fornecedores
 */
export const useFornecedores = (options = {}) => {
  const { autoLoad = true } = options;
  const { user } = useAuth();

  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadFornecedores = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await financialService.listFornecedores({
        nome: searchTerm || undefined,
        apenasAtivos: true,
      });
      setFornecedores(data);
    } catch (err) {
      console.error('[useFornecedores] Error loading:', err);
      setError('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);

  const createFornecedor = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await financialService.createFornecedor(data);
      await loadFornecedores();
      return result;
    } catch (err) {
      console.error('[useFornecedores] Error creating:', err);
      setError('Erro ao criar fornecedor');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadFornecedores]);

  const updateFornecedor = useCallback(async (id, data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.updateFornecedor(id, data);
      setFornecedores((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updated } : f))
      );
      return updated;
    } catch (err) {
      console.error('[useFornecedores] Error updating:', err);
      setError('Erro ao atualizar fornecedor');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const deactivateFornecedor = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await financialService.deactivateFornecedor(id);
      setFornecedores((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('[useFornecedores] Error deactivating:', err);
      setError('Erro ao desativar fornecedor');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    if (autoLoad && user) {
      loadFornecedores();
    }
  }, [autoLoad, user]);

  useEffect(() => {
    if (!autoLoad || !user) return;

    const timer = setTimeout(() => {
      loadFornecedores();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return {
    fornecedores,
    loading,
    saving,
    error,
    searchTerm,
    setSearchTerm,
    loadFornecedores,
    createFornecedor,
    updateFornecedor,
    deactivateFornecedor,
  };
};

/**
 * Hook for managing categorias financeiras
 */
export const useCategorias = (options = {}) => {
  const { autoLoad = true, tipo = null } = options;
  const { user } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCategorias = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await financialService.listCategorias({ tipo });
      setCategorias(data);
    } catch (err) {
      console.error('[useCategorias] Error loading:', err);
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [user, tipo]);

  const seedCategorias = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await financialService.seedCategorias();
      await loadCategorias();
    } catch (err) {
      console.error('[useCategorias] Error seeding:', err);
      throw err;
    }
  }, [user, loadCategorias]);

  const createCategoria = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const result = await financialService.createCategoria(data);
      await loadCategorias();
      return result;
    } catch (err) {
      console.error('[useCategorias] Error creating:', err);
      throw err;
    }
  }, [user, loadCategorias]);

  // Build hierarchical structure
  const categoriasHierarchy = useMemo(() => {
    const map = new Map();
    const roots = [];

    categorias.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categorias.forEach((cat) => {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(map.get(cat.id));
      } else {
        roots.push(map.get(cat.id));
      }
    });

    return roots;
  }, [categorias]);

  // Separate by type
  const categoriasReceita = useMemo(() =>
    categorias.filter((c) => c.tipo === 'receita'),
    [categorias]
  );

  const categoriasDespesa = useMemo(() =>
    categorias.filter((c) => c.tipo === 'despesa'),
    [categorias]
  );

  useEffect(() => {
    if (autoLoad && user) {
      loadCategorias();
    }
  }, [autoLoad, user]);

  return {
    categorias,
    categoriasHierarchy,
    categoriasReceita,
    categoriasDespesa,
    loading,
    error,
    loadCategorias,
    seedCategorias,
    createCategoria,
  };
};

/**
 * Hook for managing repasses (doctor payouts)
 */
export const useRepasses = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [repasses, setRepasses] = useState([]);
  const [selectedRepasse, setSelectedRepasse] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    profissionalId: null,
    status: null,
    dataInicio: null,
    dataFim: null,
    ...initialFilters,
  });

  const loadRepasses = useCallback(async (page = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await financialService.listRepasses({
        ...filters,
        page,
        perPage: pagination.perPage,
      });

      setRepasses(response.items);
      setPagination({
        page: response.page,
        perPage: response.perPage,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      console.error('[useRepasses] Error loading:', err);
      setError('Erro ao carregar repasses');
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.perPage]);

  const getRepasse = useCallback(async (id) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const repasse = await financialService.getRepasse(id);
      setSelectedRepasse(repasse);

      const itensData = await financialService.getItensRepasse(id);
      setItens(itensData);

      return repasse;
    } catch (err) {
      console.error('[useRepasses] Error getting repasse:', err);
      setError('Erro ao carregar detalhes');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRepasse = useCallback(async (data) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const result = await financialService.createRepasse(data);
      await loadRepasses(1);
      return result;
    } catch (err) {
      console.error('[useRepasses] Error creating:', err);
      setError('Erro ao criar repasse');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, loadRepasses]);

  const fecharRepasse = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.fecharRepasse(id);
      setRepasses((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      if (selectedRepasse?.id === id) {
        setSelectedRepasse(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useRepasses] Error closing:', err);
      setError('Erro ao fechar repasse');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedRepasse?.id]);

  const aprovarRepasse = useCallback(async (id) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.aprovarRepasse(id);
      setRepasses((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      if (selectedRepasse?.id === id) {
        setSelectedRepasse(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useRepasses] Error approving:', err);
      setError('Erro ao aprovar repasse');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedRepasse?.id]);

  const pagarRepasse = useCallback(async (id, pagamentoData) => {
    if (!user) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await financialService.pagarRepasse(id, pagamentoData);
      setRepasses((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      if (selectedRepasse?.id === id) {
        setSelectedRepasse(updated);
      }
      return updated;
    } catch (err) {
      console.error('[useRepasses] Error paying:', err);
      setError('Erro ao pagar repasse');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, selectedRepasse?.id]);

  const selectRepasse = useCallback(async (id) => {
    if (id) {
      await getRepasse(id);
    } else {
      setSelectedRepasse(null);
      setItens([]);
    }
  }, [getRepasse]);

  const refresh = useCallback(() => {
    loadRepasses(pagination.page);
  }, [loadRepasses, pagination.page]);

  const goToPage = useCallback((page) => {
    loadRepasses(page);
  }, [loadRepasses]);

  useEffect(() => {
    if (autoLoad && user) {
      loadRepasses(1);
    }
  }, [autoLoad, user]);

  return {
    repasses,
    selectedRepasse,
    itens,
    loading,
    saving,
    error,
    pagination,
    filters,
    setFilters,
    loadRepasses,
    getRepasse,
    createRepasse,
    fecharRepasse,
    aprovarRepasse,
    pagarRepasse,
    selectRepasse,
    refresh,
    goToPage,
  };
};

/**
 * Hook for financial reports
 */
export const useFinancialReports = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReceitaPorConvenio = useCallback(async (dataInicio, dataFim) => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      return await financialService.getReceitaPorConvenio({ dataInicio, dataFim });
    } catch (err) {
      console.error('[useFinancialReports] Error:', err);
      setError('Erro ao carregar relatório');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getReceitaPorMedico = useCallback(async (dataInicio, dataFim) => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      return await financialService.getReceitaPorMedico({ dataInicio, dataFim });
    } catch (err) {
      console.error('[useFinancialReports] Error:', err);
      setError('Erro ao carregar relatório');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDRE = useCallback(async (dataInicio, dataFim) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      return await financialService.getDRE({ dataInicio, dataFim });
    } catch (err) {
      console.error('[useFinancialReports] Error:', err);
      setError('Erro ao carregar DRE');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getFluxoCaixaProjecao = useCallback(async (dias = 30) => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      return await financialService.getFluxoCaixaProjecao({ dias });
    } catch (err) {
      console.error('[useFinancialReports] Error:', err);
      setError('Erro ao carregar projeção');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    getReceitaPorConvenio,
    getReceitaPorMedico,
    getDRE,
    getFluxoCaixaProjecao,
  };
};

// Default export for convenience
const useFinancial = useFinancialDashboard;
export default useFinancial;
