/**
 * @fileoverview Financial API Service
 * @description Service for financial management API calls (Sistema Financeiro)
 * Inclui logging detalhado para debugging em produção.
 */

import apiService from './apiService';
import { createCrudLogger } from '@/lib/utils/logger';

const API_BASE = '/financial';
const contasReceberLogger = createCrudLogger('ContaReceber');
const contasPagarLogger = createCrudLogger('ContaPagar');
const fornecedorLogger = createCrudLogger('Fornecedor');

// =============================================================================
// ENUMS - Aligned with backend expectations
// =============================================================================

/**
 * Origem da Conta a Receber - Backend enum values
 * Note: Backend expects these exact snake_case values
 */
export const OrigemContaReceber = {
  CONSULTA: 'consulta',
  PROCEDIMENTO: 'procedimento',
  GUIA_CONVENIO: 'guia_convenio',
  EXAME: 'exame',
  PACOTE: 'pacote',
  RETORNO: 'retorno',
  MATERIAL: 'material',
  PARTICULAR: 'particular',
  OUTROS: 'outros',
};

/**
 * Status da Conta a Receber - Backend enum values
 * Includes glosa-related statuses
 */
export const StatusContaReceber = {
  PENDENTE: 'pendente',
  PARCIAL: 'parcial',
  PAGO: 'pago',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
  GLOSADO_PARCIAL: 'glosado_parcial',
  GLOSADO_TOTAL: 'glosado_total',
  EM_RECURSO: 'em_recurso',
};

/**
 * Forma de Pagamento - Backend enum values
 */
export const FormaPagamento = {
  DINHEIRO: 'dinheiro',
  PIX: 'pix',
  CARTAO_CREDITO: 'cartao_credito',
  CARTAO_DEBITO: 'cartao_debito',
  BOLETO: 'boleto',
  TRANSFERENCIA: 'transferencia',
  CHEQUE: 'cheque',
  CONVENIO: 'convenio',
  OUTROS: 'outros',
};

// =============================================================================
// DASHBOARD
// =============================================================================

/**
 * Get financial dashboard data
 * @returns {Promise<{
 *   receitaMes: number,
 *   recebidoMes: number,
 *   totalPendente: number,
 *   totalVencido: number,
 *   vencendo7Dias: number,
 *   qtdVencidas: number,
 *   qtdPendentes: number,
 *   despesasMes: number,
 *   saldoContas: number
 * }>}
 */
export async function getDashboard() {
  console.log('[Financial API] getDashboard - Fetching dashboard data...');
  const result = await apiService.get(`${API_BASE}/dashboard`);
  console.log('[Financial API] getDashboard - Response:', result);
  return result;
}

/**
 * Get cash flow data for a date range
 * @param {Object} params
 * @param {string} params.dataInicio - Start date (YYYY-MM-DD)
 * @param {string} params.dataFim - End date (YYYY-MM-DD)
 * @returns {Promise<Array<{
 *   data: string,
 *   entradas: number,
 *   saidas: number,
 *   saldoDia: number
 * }>>}
 */
export async function getFluxoCaixa({ dataInicio, dataFim }) {
  console.log('[Financial API] getFluxoCaixa - Fetching:', { dataInicio, dataFim });
  const result = await apiService.get(`${API_BASE}/fluxo-caixa`, {
    dataInicio,
    dataFim,
  });
  console.log('[Financial API] getFluxoCaixa - Response:', result?.length, 'dias');
  return result;
}

// =============================================================================
// CONTAS A RECEBER
// =============================================================================

/**
 * List contas a receber with filters
 * @param {Object} [options]
 * @param {string} [options.pacienteId] - Filter by patient
 * @param {string} [options.profissionalId] - Filter by professional
 * @param {string} [options.convenioId] - Filter by insurance provider
 * @param {string} [options.origem] - Filter by origem (convenio, particular, guia, outros)
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.dataVencimentoInicio] - Due date start (YYYY-MM-DD)
 * @param {string} [options.dataVencimentoFim] - Due date end (YYYY-MM-DD)
 * @param {string} [options.dataCompetenciaInicio] - Competence date start (YYYY-MM-DD)
 * @param {string} [options.dataCompetenciaFim] - Competence date end (YYYY-MM-DD)
 * @param {boolean} [options.apenasVencidos] - Only overdue
 * @param {boolean} [options.apenasPendentes] - Only pending
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<ContaReceber>,
 *   total: number,
 *   page: number,
 *   perPage: number,
 *   totalPages: number
 * }>}
 */
export async function listContasReceber(options = {}) {
  console.log('[Financial API] listContasReceber - Options:', options);

  const params = {};

  // Backend uses #[serde(rename_all = "camelCase")] for query params
  if (options.pacienteId) params.pacienteId = options.pacienteId;
  if (options.profissionalId) params.profissionalId = options.profissionalId;
  if (options.convenioId) params.convenioId = options.convenioId;
  if (options.origem) params.origem = options.origem;
  if (options.status) params.status = options.status;
  if (options.dataVencimentoInicio) params.dataVencimentoInicio = options.dataVencimentoInicio;
  if (options.dataVencimentoFim) params.dataVencimentoFim = options.dataVencimentoFim;
  if (options.dataCompetenciaInicio) params.dataCompetenciaInicio = options.dataCompetenciaInicio;
  if (options.dataCompetenciaFim) params.dataCompetenciaFim = options.dataCompetenciaFim;
  if (options.apenasVencidos !== undefined) params.apenasVencidos = options.apenasVencidos;
  if (options.apenasPendentes !== undefined) params.apenasPendentes = options.apenasPendentes;
  if (options.page) params.page = options.page;
  if (options.perPage) params.perPage = options.perPage;

  const result = await apiService.get(`${API_BASE}/contas-receber`, params);
  console.log('[Financial API] listContasReceber - Response:', result?.items?.length, 'itens, total:', result?.total);
  return result;
}

/**
 * Get a specific conta a receber by ID
 * @param {string} id - Conta ID
 * @returns {Promise<ContaReceber>}
 */
export async function getContaReceber(id) {
  return apiService.get(`${API_BASE}/contas-receber/${id}`);
}

/**
 * Create a new conta a receber
 * @param {Object} data
 * @param {string} data.origem - Origem (convenio, particular, guia, outros)
 * @param {string} [data.pacienteId] - Patient ID
 * @param {string} [data.profissionalId] - Professional ID
 * @param {string} [data.convenioId] - Insurance provider ID
 * @param {string} [data.guiaId] - Guia ID
 * @param {string} data.descricao - Description
 * @param {number} data.valorBruto - Gross value
 * @param {number} [data.valorDesconto] - Discount
 * @param {number} [data.valorAcrescimo] - Additional value
 * @param {string} data.dataVencimento - Due date (YYYY-MM-DD)
 * @param {string} [data.dataCompetencia] - Competence date (YYYY-MM-DD)
 * @param {string} [data.categoriaId] - Category ID
 * @param {string} [data.centroCustoId] - Cost center ID
 * @param {boolean} [data.emitirNfse] - Generate NFSe
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<{ id: string, numeroDocumento: string }>}
 */
export async function createContaReceber(data) {
  const { requestId, startTime } = contasReceberLogger.operationStart('CREATE', null, data);

  try {
    // Validação básica
    if (!data.origem) {
      const error = new Error('Origem da conta é obrigatória');
      error.status = 400;
      error.validationErrors = { origem: 'Campo obrigatório' };
      throw error;
    }
    if (!data.descricao) {
      const error = new Error('Descrição é obrigatória');
      error.status = 400;
      error.validationErrors = { descricao: 'Campo obrigatório' };
      throw error;
    }
    if (data.valorBruto === undefined || data.valorBruto <= 0) {
      const error = new Error('Valor bruto deve ser maior que zero');
      error.status = 400;
      error.validationErrors = { valorBruto: 'Deve ser maior que zero' };
      throw error;
    }

    const payload = {
      origem: data.origem,
      descricao: data.descricao,
      valorBruto: data.valorBruto,
      dataVencimento: data.dataVencimento,
    };

    if (data.pacienteId) payload.pacienteId = data.pacienteId;
    if (data.profissionalId) payload.profissionalId = data.profissionalId;
    if (data.convenioId) payload.convenioId = data.convenioId;
    if (data.guiaId) payload.guiaId = data.guiaId;
    if (data.valorDesconto !== undefined) payload.valorDesconto = data.valorDesconto;
    if (data.valorAcrescimo !== undefined) payload.valorAcrescimo = data.valorAcrescimo;
    if (data.dataCompetencia) payload.dataCompetencia = data.dataCompetencia;
    if (data.categoriaId) payload.categoriaId = data.categoriaId;
    if (data.centroCustoId) payload.centroCustoId = data.centroCustoId;
    if (data.emitirNfse !== undefined) payload.emitirNfse = data.emitirNfse;
    if (data.observacoes) payload.observacoes = data.observacoes;

    // Campos específicos NFSe (quando emitirNfse = true)
    if (data.nfseCodigoServico) payload.nfseCodigoServico = data.nfseCodigoServico;
    if (data.nfseAliquotaIss !== undefined) payload.nfseAliquotaIss = data.nfseAliquotaIss;
    if (data.nfseDiscriminacao) payload.nfseDiscriminacao = data.nfseDiscriminacao;

    const result = await apiService.post(`${API_BASE}/contas-receber`, payload);
    contasReceberLogger.operationSuccess(requestId, startTime, 'CREATE', result.id);
    return result;
  } catch (error) {
    const { userMessage } = contasReceberLogger.operationError(requestId, startTime, 'CREATE', error, null, data);
    error.userMessage = userMessage;
    throw error;
  }
}

/**
 * Update an existing conta a receber
 * @param {string} id - Conta ID
 * @param {Object} data
 * @param {string} [data.descricao] - Description
 * @param {number} [data.valorDesconto] - Discount
 * @param {number} [data.valorAcrescimo] - Additional value
 * @param {number} [data.valorGlosa] - Glosa value
 * @param {string} [data.dataVencimento] - Due date (YYYY-MM-DD)
 * @param {string} [data.categoriaId] - Category ID
 * @param {string} [data.centroCustoId] - Cost center ID
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<ContaReceber>}
 */
export async function updateContaReceber(id, data) {
  return apiService.put(`${API_BASE}/contas-receber/${id}`, data);
}

/**
 * Delete a conta a receber (only if no payments registered)
 * @param {string} id - Conta ID
 * @returns {Promise<void>}
 */
export async function deleteContaReceber(id) {
  return apiService.delete(`${API_BASE}/contas-receber/${id}`);
}

/**
 * Register a payment for a conta a receber
 * @param {string} contaId - Conta ID
 * @param {Object} data
 * @param {number} data.valor - Payment value
 * @param {number} [data.valorJuros] - Interest
 * @param {number} [data.valorMulta] - Fine
 * @param {number} [data.valorDesconto] - Discount
 * @param {string} data.formaPagamento - Payment method
 * @param {string} [data.contaBancariaId] - Bank account ID
 * @param {string} [data.dataRecebimento] - Payment date (YYYY-MM-DD)
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<Recebimento>}
 */
export async function registrarRecebimento(contaId, data) {
  const { requestId, startTime } = contasReceberLogger.operationStart('RECEBIMENTO', contaId, data);

  try {
    if (!data.valor || data.valor <= 0) {
      const error = new Error('Valor do recebimento deve ser maior que zero');
      error.status = 400;
      error.validationErrors = { valor: 'Deve ser maior que zero' };
      throw error;
    }
    if (!data.formaPagamento) {
      const error = new Error('Forma de pagamento é obrigatória');
      error.status = 400;
      error.validationErrors = { formaPagamento: 'Campo obrigatório' };
      throw error;
    }

    const result = await apiService.post(`${API_BASE}/contas-receber/${contaId}/receber`, data);
    contasReceberLogger.operationSuccess(requestId, startTime, 'RECEBIMENTO', contaId, { valor: data.valor });
    return result;
  } catch (error) {
    const { userMessage } = contasReceberLogger.operationError(requestId, startTime, 'RECEBIMENTO', error, contaId, data);
    error.userMessage = userMessage;
    throw error;
  }
}

/**
 * Get payments for a conta a receber
 * @param {string} contaId - Conta ID
 * @returns {Promise<Array<Recebimento>>}
 */
export async function getRecebimentos(contaId) {
  return apiService.get(`${API_BASE}/contas-receber/${contaId}/recebimentos`);
}

// =============================================================================
// CONTAS A PAGAR
// =============================================================================

/**
 * List contas a pagar with filters
 * @param {Object} [options]
 * @param {string} [options.fornecedorId] - Filter by supplier
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.dataVencimentoInicio] - Due date start (YYYY-MM-DD)
 * @param {string} [options.dataVencimentoFim] - Due date end (YYYY-MM-DD)
 * @param {boolean} [options.apenasVencidos] - Only overdue
 * @param {boolean} [options.apenasPendentes] - Only pending
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<ContaPagar>,
 *   total: number,
 *   page: number,
 *   perPage: number,
 *   totalPages: number
 * }>}
 */
export async function listContasPagar(options = {}) {
  console.log('[Financial API] listContasPagar - Options:', options);

  const params = {};

  // Backend uses #[serde(rename_all = "camelCase")] for query params
  if (options.fornecedorId) params.fornecedorId = options.fornecedorId;
  if (options.status) params.status = options.status;
  if (options.dataVencimentoInicio) params.dataVencimentoInicio = options.dataVencimentoInicio;
  if (options.dataVencimentoFim) params.dataVencimentoFim = options.dataVencimentoFim;
  if (options.apenasVencidos !== undefined) params.apenasVencidos = options.apenasVencidos;
  if (options.apenasPendentes !== undefined) params.apenasPendentes = options.apenasPendentes;
  if (options.page) params.page = options.page;
  if (options.perPage) params.perPage = options.perPage;

  const result = await apiService.get(`${API_BASE}/contas-pagar`, params);
  console.log('[Financial API] listContasPagar - Response:', result?.items?.length, 'itens, total:', result?.total);
  return result;
}

/**
 * Get a specific conta a pagar by ID
 * @param {string} id - Conta ID
 * @returns {Promise<ContaPagar>}
 */
export async function getContaPagar(id) {
  return apiService.get(`${API_BASE}/contas-pagar/${id}`);
}

/**
 * Create a new conta a pagar
 * @param {Object} data
 * @param {string} [data.fornecedorId] - Supplier ID
 * @param {string} [data.fornecedorNome] - Supplier name (alternative to ID)
 * @param {string} data.descricao - Description
 * @param {number} data.valor - Value (will be sent as valor_original to backend)
 * @param {string} data.dataVencimento - Due date (YYYY-MM-DD)
 * @param {string} [data.dataCompetencia] - Competence date (YYYY-MM-DD)
 * @param {string} data.tipoDespesa - Expense type (REQUIRED by backend)
 * @param {string} [data.recorrencia] - Recurrence (unica, mensal, etc)
 * @param {number} [data.totalParcelas] - Total installments
 * @param {string} [data.categoriaId] - Category ID
 * @param {string} [data.centroCustoId] - Cost center ID
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<{ id: string }>}
 */
export async function createContaPagar(data) {
  const { requestId, startTime } = contasPagarLogger.operationStart('CREATE', null, data);

  try {
    if (!data.descricao) {
      const error = new Error('Descrição é obrigatória');
      error.status = 400;
      error.validationErrors = { descricao: 'Campo obrigatório' };
      throw error;
    }
    if (data.valor === undefined || data.valor <= 0) {
      const error = new Error('Valor deve ser maior que zero');
      error.status = 400;
      error.validationErrors = { valor: 'Deve ser maior que zero' };
      throw error;
    }
    if (!data.dataVencimento) {
      const error = new Error('Data de vencimento é obrigatória');
      error.status = 400;
      error.validationErrors = { dataVencimento: 'Campo obrigatório' };
      throw error;
    }
    if (!data.tipoDespesa) {
      const error = new Error('Tipo de despesa é obrigatório');
      error.status = 400;
      error.validationErrors = { tipoDespesa: 'Campo obrigatório' };
      throw error;
    }

    // Build payload with camelCase field names (backend uses #[serde(rename_all = "camelCase")])
    const payload = {
      descricao: data.descricao,
      valorOriginal: data.valor, // Backend expects 'valorOriginal' (camelCase)
      dataVencimento: data.dataVencimento,
      tipoDespesa: data.tipoDespesa, // Required by backend
    };

    // Optional fields (camelCase to match backend serde config)
    if (data.fornecedorId) payload.fornecedorId = data.fornecedorId;
    if (data.fornecedorNome) payload.fornecedorNome = data.fornecedorNome;
    if (data.dataCompetencia) payload.dataCompetencia = data.dataCompetencia;
    if (data.recorrencia) payload.recorrencia = data.recorrencia;
    if (data.totalParcelas) payload.totalParcelas = data.totalParcelas;
    if (data.categoriaId) payload.categoriaId = data.categoriaId;
    if (data.centroCustoId) payload.centroCustoId = data.centroCustoId;
    if (data.observacoes) payload.observacoes = data.observacoes;

    const result = await apiService.post(`${API_BASE}/contas-pagar`, payload);
    contasPagarLogger.operationSuccess(requestId, startTime, 'CREATE', result.id);
    return result;
  } catch (error) {
    const { userMessage } = contasPagarLogger.operationError(requestId, startTime, 'CREATE', error, null, data);
    error.userMessage = userMessage;
    throw error;
  }
}

/**
 * Update an existing conta a pagar
 * @param {string} id - Conta ID
 * @param {Object} data - Fields to update
 * @returns {Promise<ContaPagar>}
 */
export async function updateContaPagar(id, data) {
  return apiService.put(`${API_BASE}/contas-pagar/${id}`, data);
}

/**
 * Delete a conta a pagar (only if no payments registered)
 * @param {string} id - Conta ID
 * @returns {Promise<void>}
 */
export async function deleteContaPagar(id) {
  return apiService.delete(`${API_BASE}/contas-pagar/${id}`);
}

/**
 * Register a payment for a conta a pagar
 * @param {string} contaId - Conta ID
 * @param {Object} data
 * @param {number} data.valor - Payment value
 * @param {number} [data.valorJuros] - Interest
 * @param {number} [data.valorMulta] - Fine
 * @param {number} [data.valorDesconto] - Discount
 * @param {string} data.formaPagamento - Payment method
 * @param {string} [data.contaBancariaId] - Bank account ID
 * @param {string} [data.dataPagamento] - Payment date (YYYY-MM-DD)
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<Pagamento>}
 */
export async function registrarPagamento(contaId, data) {
  return apiService.post(`${API_BASE}/contas-pagar/${contaId}/pagar`, data);
}

// =============================================================================
// FORNECEDORES
// =============================================================================

/**
 * List fornecedores (suppliers)
 * @param {Object} [options]
 * @param {string} [options.nome] - Search by name
 * @param {boolean} [options.apenasAtivos=true] - Only active suppliers
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<Array<Fornecedor>>}
 */
export async function listFornecedores(options = {}) {
  const params = {};

  // Backend uses #[serde(rename_all = "camelCase")] for query params
  if (options.nome) params.nome = options.nome;
  if (options.apenasAtivos !== undefined) params.apenasAtivos = options.apenasAtivos;
  if (options.page) params.page = options.page;
  if (options.perPage) params.perPage = options.perPage;

  return apiService.get(`${API_BASE}/fornecedores`, params);
}

/**
 * Get a specific fornecedor by ID
 * @param {string} id - Fornecedor ID
 * @returns {Promise<Fornecedor>}
 */
export async function getFornecedor(id) {
  return apiService.get(`${API_BASE}/fornecedores/${id}`);
}

/**
 * Create a new fornecedor
 * @param {Object} data
 * @param {string} data.razaoSocial - Company name
 * @param {string} [data.nomeFantasia] - Trade name
 * @param {string} [data.cpfCnpj] - CPF or CNPJ
 * @param {string} [data.telefone] - Phone
 * @param {string} [data.celular] - Mobile
 * @param {string} [data.email] - Email
 * @param {string} [data.cep] - Postal code
 * @param {string} [data.logradouro] - Street
 * @param {string} [data.numero] - Number
 * @param {string} [data.bairro] - Neighborhood
 * @param {string} [data.cidade] - City
 * @param {string} [data.uf] - State
 * @param {string} [data.banco] - Bank
 * @param {string} [data.agencia] - Agency
 * @param {string} [data.conta] - Account
 * @param {string} [data.chavePix] - PIX key
 * @param {string} [data.categoria] - Category
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<{ id: string }>}
 */
export async function createFornecedor(data) {
  return apiService.post(`${API_BASE}/fornecedores`, data);
}

/**
 * Update a fornecedor
 * @param {string} id - Fornecedor ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Fornecedor>}
 */
export async function updateFornecedor(id, data) {
  return apiService.put(`${API_BASE}/fornecedores/${id}`, data);
}

/**
 * Deactivate a fornecedor
 * @param {string} id - Fornecedor ID
 * @returns {Promise<void>}
 */
export async function deactivateFornecedor(id) {
  return apiService.post(`${API_BASE}/fornecedores/${id}/deactivate`);
}

// =============================================================================
// CATEGORIAS
// =============================================================================

/**
 * List financial categories
 * @param {Object} [options]
 * @param {string} [options.tipo] - Filter by type (receita, despesa)
 * @returns {Promise<Array<Categoria>>}
 */
export async function listCategorias(options = {}) {
  const params = {};
  if (options.tipo) params.tipo = options.tipo;
  return apiService.get(`${API_BASE}/categorias`, params);
}

/**
 * Create default categories for the tenant
 * @returns {Promise<{ message: string }>}
 */
export async function seedCategorias() {
  return apiService.post(`${API_BASE}/categorias/seed`);
}

/**
 * Create a custom category
 * @param {Object} data
 * @param {string} data.codigo - Code
 * @param {string} data.nome - Name
 * @param {string} data.tipo - Type (receita, despesa)
 * @param {string} [data.parentId] - Parent category ID
 * @param {string} [data.descricao] - Description
 * @param {string} [data.cor] - Color
 * @param {string} [data.icone] - Icon
 * @param {number} [data.ordem] - Order
 * @returns {Promise<{ id: string }>}
 */
export async function createCategoria(data) {
  return apiService.post(`${API_BASE}/categorias`, data);
}

// =============================================================================
// CENTROS DE CUSTO
// =============================================================================

/**
 * List cost centers
 * @returns {Promise<Array<CentroCusto>>}
 */
export async function listCentrosCusto() {
  return apiService.get(`${API_BASE}/centros-custo`);
}

/**
 * Create a cost center
 * @param {Object} data
 * @param {string} data.codigo - Code
 * @param {string} data.nome - Name
 * @param {string} [data.descricao] - Description
 * @returns {Promise<{ id: string }>}
 */
export async function createCentroCusto(data) {
  return apiService.post(`${API_BASE}/centros-custo`, data);
}

// =============================================================================
// REPASSES
// =============================================================================

/**
 * List repasses (doctor payouts)
 * @param {Object} [options]
 * @param {string} [options.profissionalId] - Filter by professional
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.dataInicio] - Start date (YYYY-MM-DD)
 * @param {string} [options.dataFim] - End date (YYYY-MM-DD)
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<RepasseConsolidado>,
 *   total: number,
 *   page: number,
 *   perPage: number,
 *   totalPages: number
 * }>}
 */
export async function listRepasses(options = {}) {
  const params = {};

  // Backend uses #[serde(rename_all = "camelCase")] for query params
  if (options.profissionalId) params.profissionalId = options.profissionalId;
  if (options.status) params.status = options.status;
  if (options.dataInicio) params.dataInicio = options.dataInicio;
  if (options.dataFim) params.dataFim = options.dataFim;
  if (options.page) params.page = options.page;
  if (options.perPage) params.perPage = options.perPage;

  return apiService.get(`${API_BASE}/repasses`, params);
}

/**
 * Get a specific repasse by ID
 * @param {string} id - Repasse ID
 * @returns {Promise<RepasseConsolidado>}
 */
export async function getRepasse(id) {
  return apiService.get(`${API_BASE}/repasses/${id}`);
}

/**
 * Create a new repasse consolidado
 * @param {Object} data
 * @param {string} data.profissionalId - Professional ID
 * @param {string} data.periodoInicio - Period start (YYYY-MM-DD)
 * @param {string} data.periodoFim - Period end (YYYY-MM-DD)
 * @param {number} data.percentual - Default percentage
 * @returns {Promise<{ id: string }>}
 */
export async function createRepasse(data) {
  return apiService.post(`${API_BASE}/repasses`, data);
}

/**
 * Close a repasse (calculate values and mark as pending approval)
 * @param {string} id - Repasse ID
 * @returns {Promise<RepasseConsolidado>}
 */
export async function fecharRepasse(id) {
  return apiService.put(`${API_BASE}/repasses/${id}/fechar`);
}

/**
 * Approve a repasse
 * @param {string} id - Repasse ID
 * @returns {Promise<RepasseConsolidado>}
 */
export async function aprovarRepasse(id) {
  return apiService.put(`${API_BASE}/repasses/${id}/aprovar`);
}

/**
 * Register payment for a repasse
 * @param {string} id - Repasse ID
 * @param {Object} data
 * @param {string} data.formaPagamento - Payment method
 * @param {string} [data.contaBancariaId] - Bank account ID
 * @param {string} [data.dataPagamento] - Payment date (YYYY-MM-DD)
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<RepasseConsolidado>}
 */
export async function pagarRepasse(id, data) {
  return apiService.post(`${API_BASE}/repasses/${id}/pagar`, data);
}

/**
 * Get repasse items
 * @param {string} repasseId - Repasse ID
 * @returns {Promise<Array<ItemRepasse>>}
 */
export async function getItensRepasse(repasseId) {
  return apiService.get(`${API_BASE}/repasses/${repasseId}/itens`);
}

// =============================================================================
// CONTAS BANCARIAS
// =============================================================================

/**
 * List bank accounts
 * @returns {Promise<Array<ContaBancaria>>}
 */
export async function listContasBancarias() {
  return apiService.get(`${API_BASE}/contas-bancarias`);
}

/**
 * Get a specific bank account by ID
 * @param {string} id - Bank account ID
 * @returns {Promise<ContaBancaria>}
 */
export async function getContaBancaria(id) {
  return apiService.get(`${API_BASE}/contas-bancarias/${id}`);
}

/**
 * Create a bank account
 * @param {Object} data
 * @param {string} data.banco - Bank name
 * @param {string} data.agencia - Agency
 * @param {string} data.conta - Account number
 * @param {string} [data.tipoConta] - Account type
 * @param {string} [data.descricao] - Description
 * @param {number} [data.saldoInicial] - Initial balance
 * @returns {Promise<{ id: string }>}
 */
export async function createContaBancaria(data) {
  return apiService.post(`${API_BASE}/contas-bancarias`, data);
}

/**
 * Update a bank account
 * @param {string} id - Bank account ID
 * @param {Object} data - Fields to update
 * @returns {Promise<ContaBancaria>}
 */
export async function updateContaBancaria(id, data) {
  return apiService.put(`${API_BASE}/contas-bancarias/${id}`, data);
}

// =============================================================================
// MOVIMENTAÇÕES BANCÁRIAS
// =============================================================================

/**
 * List movimentações bancárias (bank movements)
 * @param {Object} [options]
 * @param {string} [options.contaBancariaId] - Filter by bank account
 * @param {string} [options.tipo] - Filter by type (entrada, saida, transferencia)
 * @param {string} [options.dataInicio] - Start date (YYYY-MM-DD)
 * @param {string} [options.dataFim] - End date (YYYY-MM-DD)
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<MovimentacaoBancaria>,
 *   total: number,
 *   page: number,
 *   perPage: number,
 *   totalPages: number
 * }>}
 */
export async function listMovimentacoesBancarias(options = {}) {
  const params = {};

  // Backend uses #[serde(rename_all = "camelCase")] for query params
  if (options.contaBancariaId) params.contaBancariaId = options.contaBancariaId;
  if (options.tipo) params.tipo = options.tipo;
  if (options.dataInicio) params.dataInicio = options.dataInicio;
  if (options.dataFim) params.dataFim = options.dataFim;
  if (options.page) params.page = options.page;
  if (options.perPage) params.perPage = options.perPage;

  return apiService.get(`${API_BASE}/movimentacoes-bancarias`, params);
}

/**
 * Get a specific movimentação by ID
 * @param {string} id - Movimentação ID
 * @returns {Promise<MovimentacaoBancaria>}
 */
export async function getMovimentacaoBancaria(id) {
  return apiService.get(`${API_BASE}/movimentacoes-bancarias/${id}`);
}

/**
 * Create a bank transfer between accounts
 * @param {Object} data
 * @param {string} data.contaOrigemId - Source account ID
 * @param {string} data.contaDestinoId - Destination account ID
 * @param {number} data.valor - Transfer value
 * @param {string} [data.dataMovimentacao] - Movement date (YYYY-MM-DD)
 * @param {string} [data.descricao] - Description
 * @returns {Promise<{ id: string }>}
 */
export async function createTransferenciaBancaria(data) {
  return apiService.post(`${API_BASE}/movimentacoes-bancarias/transferencia`, data);
}

/**
 * Get bank account statement (extrato)
 * @param {string} contaBancariaId - Bank account ID
 * @param {Object} params
 * @param {string} params.dataInicio - Start date (YYYY-MM-DD)
 * @param {string} params.dataFim - End date (YYYY-MM-DD)
 * @returns {Promise<{
 *   saldoInicial: number,
 *   saldoFinal: number,
 *   movimentacoes: Array<MovimentacaoBancaria>
 * }>}
 */
export async function getExtratoBancario(contaBancariaId, { dataInicio, dataFim }) {
  // Backend uses #[serde(rename_all = "camelCase")] for query params
  return apiService.get(`${API_BASE}/contas-bancarias/${contaBancariaId}/extrato`, {
    dataInicio,
    dataFim,
  });
}

// =============================================================================
// SUGESTÕES FINANCEIRAS
// =============================================================================

/**
 * List sugestões financeiras pendentes
 * @returns {Promise<Array<SugestaoFinanceira>>}
 */
export async function listSugestoesFinanceiras() {
  return apiService.get(`${API_BASE}/sugestoes`);
}

/**
 * Get a specific sugestão by ID
 * @param {string} id - Sugestão ID
 * @returns {Promise<SugestaoFinanceira>}
 */
export async function getSugestaoFinanceira(id) {
  return apiService.get(`${API_BASE}/sugestoes/${id}`);
}

/**
 * Accept a financial suggestion (creates the related record)
 * @param {string} id - Sugestão ID
 * @returns {Promise<{ registroId: string }>}
 */
export async function aceitarSugestao(id) {
  return apiService.post(`${API_BASE}/sugestoes/${id}/aceitar`);
}

/**
 * Reject a financial suggestion
 * @param {string} id - Sugestão ID
 * @param {Object} data
 * @param {string} data.motivo - Rejection reason
 * @returns {Promise<void>}
 */
export async function rejeitarSugestao(id, data) {
  return apiService.post(`${API_BASE}/sugestoes/${id}/rejeitar`, data);
}

// =============================================================================
// RELATÓRIOS
// =============================================================================

/**
 * Get revenue by insurance provider
 * @param {Object} params
 * @param {string} params.dataInicio - Start date (YYYY-MM-DD)
 * @param {string} params.dataFim - End date (YYYY-MM-DD)
 * @returns {Promise<Array<{
 *   convenioId: string,
 *   convenioNome: string,
 *   valorBruto: number,
 *   valorGlosa: number,
 *   valorLiquido: number,
 *   valorRecebido: number,
 *   quantidadeGuias: number
 * }>>}
 */
export async function getReceitaPorConvenio({ dataInicio, dataFim }) {
  // Backend uses #[serde(rename_all = "camelCase")] for query params
  return apiService.get(`${API_BASE}/relatorios/por-convenio`, {
    dataInicio,
    dataFim,
  });
}

/**
 * Get revenue by doctor
 * @param {Object} params
 * @param {string} params.dataInicio - Start date (YYYY-MM-DD)
 * @param {string} params.dataFim - End date (YYYY-MM-DD)
 * @returns {Promise<Array<{
 *   profissionalId: string,
 *   profissionalNome: string,
 *   valorBruto: number,
 *   valorRepasse: number,
 *   quantidadeProcedimentos: number
 * }>>}
 */
export async function getReceitaPorMedico({ dataInicio, dataFim }) {
  // Backend uses #[serde(rename_all = "camelCase")] for query params
  return apiService.get(`${API_BASE}/relatorios/por-medico`, {
    dataInicio,
    dataFim,
  });
}

/**
 * Get DRE (Income Statement)
 * @param {Object} params
 * @param {string} params.dataInicio - Start date (YYYY-MM-DD)
 * @param {string} params.dataFim - End date (YYYY-MM-DD)
 * @returns {Promise<{
 *   receitaBruta: number,
 *   deducoes: number,
 *   receitaLiquida: number,
 *   despesas: Array<{ categoria: string, valor: number }>,
 *   totalDespesas: number,
 *   resultadoOperacional: number
 * }>}
 */
export async function getDRE({ dataInicio, dataFim }) {
  // Backend uses #[serde(rename_all = "camelCase")] for query params
  return apiService.get(`${API_BASE}/relatorios/dre`, {
    dataInicio,
    dataFim,
  });
}

/**
 * Get cash flow projection
 * @param {Object} params
 * @param {number} [params.dias=30] - Days to project
 * @returns {Promise<Array<{
 *   data: string,
 *   entradasPrevistas: number,
 *   saidasPrevistas: number,
 *   saldoProjetado: number
 * }>>}
 */
export async function getFluxoCaixaProjecao({ dias = 30 } = {}) {
  return apiService.get(`${API_BASE}/fluxo-caixa/projecao`, { dias });
}

// =============================================================================
// USER FINANCIAL PREFERENCES (Configurações por Usuário)
// =============================================================================

/**
 * Get user financial preferences
 * @returns {Promise<{
 *   gerar_conta_automatica: boolean,
 *   valor_consulta_padrao: number|null,
 *   categoria_id: string|null,
 *   dias_vencimento: number
 * }>}
 */
export async function getFinancialPreferences() {
  return apiService.get(`${API_BASE}/preferences`);
}

/**
 * Update user financial preferences
 * @param {Object} data
 * @param {boolean} data.gerarContaAutomatica - Generate account automatically after consultation
 * @param {number|null} data.valorConsultaPadrao - Default consultation value
 * @param {string|null} data.categoriaId - Default category ID
 * @param {number} data.diasVencimento - Days until due date (default: 0)
 * @returns {Promise<{
 *   gerar_conta_automatica: boolean,
 *   valor_consulta_padrao: number|null,
 *   categoria_id: string|null,
 *   dias_vencimento: number
 * }>}
 */
export async function updateFinancialPreferences(data) {
  const payload = {};

  if (data.gerarContaAutomatica !== undefined) {
    payload.gerar_conta_automatica = data.gerarContaAutomatica;
  }
  if (data.valorConsultaPadrao !== undefined) {
    payload.valor_consulta_padrao = data.valorConsultaPadrao;
  }
  if (data.categoriaId !== undefined) {
    payload.categoria_id = data.categoriaId;
  }
  if (data.diasVencimento !== undefined) {
    payload.dias_vencimento = data.diasVencimento;
  }

  return apiService.put(`${API_BASE}/preferences`, payload);
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

const financialService = {
  // Dashboard
  getDashboard,
  getFluxoCaixa,

  // Contas a Receber
  listContasReceber,
  getContaReceber,
  createContaReceber,
  updateContaReceber,
  deleteContaReceber,
  registrarRecebimento,
  getRecebimentos,

  // Contas a Pagar
  listContasPagar,
  getContaPagar,
  createContaPagar,
  updateContaPagar,
  deleteContaPagar,
  registrarPagamento,

  // Fornecedores
  listFornecedores,
  getFornecedor,
  createFornecedor,
  updateFornecedor,
  deactivateFornecedor,

  // Categorias
  listCategorias,
  seedCategorias,
  createCategoria,

  // Centros de Custo
  listCentrosCusto,
  createCentroCusto,

  // Repasses
  listRepasses,
  getRepasse,
  createRepasse,
  fecharRepasse,
  aprovarRepasse,
  pagarRepasse,
  getItensRepasse,

  // Contas Bancárias
  listContasBancarias,
  getContaBancaria,
  createContaBancaria,
  updateContaBancaria,

  // Movimentações Bancárias
  listMovimentacoesBancarias,
  getMovimentacaoBancaria,
  createTransferenciaBancaria,
  getExtratoBancario,

  // Sugestões Financeiras
  listSugestoesFinanceiras,
  getSugestaoFinanceira,
  aceitarSugestao,
  rejeitarSugestao,

  // Relatórios
  getReceitaPorConvenio,
  getReceitaPorMedico,
  getDRE,
  getFluxoCaixaProjecao,

  // User Preferences
  getFinancialPreferences,
  updateFinancialPreferences,

  // Enums
  OrigemContaReceber,
  StatusContaReceber,
  FormaPagamento,
};

export default financialService;
