/**
 * @fileoverview Financial API Service
 * @description Service for financial management API calls (Sistema Financeiro)
 */

import apiService from './apiService';

const API_BASE = '/financial';

// =============================================================================
// ENUMS
// =============================================================================

export const OrigemContaReceber = {
  CONVENIO: 'convenio',
  PARTICULAR: 'particular',
  GUIA: 'guia',
  OUTROS: 'outros',
};

export const StatusContaReceber = {
  PENDENTE: 'pendente',
  PARCIAL: 'parcial',
  PAGO: 'pago',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
};

export const FormaPagamento = {
  DINHEIRO: 'dinheiro',
  PIX: 'pix',
  CARTAO_CREDITO: 'cartao_credito',
  CARTAO_DEBITO: 'cartao_debito',
  BOLETO: 'boleto',
  TRANSFERENCIA: 'transferencia',
  CHEQUE: 'cheque',
  CONVENIO: 'convenio',
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
  return apiService.get(`${API_BASE}/dashboard`);
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
  return apiService.get(`${API_BASE}/fluxo-caixa`, {
    data_inicio: dataInicio,
    data_fim: dataFim,
  });
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
  const params = {};

  if (options.pacienteId) params.paciente_id = options.pacienteId;
  if (options.profissionalId) params.profissional_id = options.profissionalId;
  if (options.convenioId) params.convenio_id = options.convenioId;
  if (options.origem) params.origem = options.origem;
  if (options.status) params.status = options.status;
  if (options.dataVencimentoInicio) params.data_vencimento_inicio = options.dataVencimentoInicio;
  if (options.dataVencimentoFim) params.data_vencimento_fim = options.dataVencimentoFim;
  if (options.dataCompetenciaInicio) params.data_competencia_inicio = options.dataCompetenciaInicio;
  if (options.dataCompetenciaFim) params.data_competencia_fim = options.dataCompetenciaFim;
  if (options.apenasVencidos !== undefined) params.apenas_vencidos = options.apenasVencidos;
  if (options.apenasPendentes !== undefined) params.apenas_pendentes = options.apenasPendentes;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/contas-receber`, params);
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

  return apiService.post(`${API_BASE}/contas-receber`, payload);
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
  return apiService.post(`${API_BASE}/contas-receber/${contaId}/receber`, data);
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
  const params = {};

  if (options.fornecedorId) params.fornecedor_id = options.fornecedorId;
  if (options.status) params.status = options.status;
  if (options.dataVencimentoInicio) params.data_vencimento_inicio = options.dataVencimentoInicio;
  if (options.dataVencimentoFim) params.data_vencimento_fim = options.dataVencimentoFim;
  if (options.apenasVencidos !== undefined) params.apenas_vencidos = options.apenasVencidos;
  if (options.apenasPendentes !== undefined) params.apenas_pendentes = options.apenasPendentes;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/contas-pagar`, params);
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
 * @param {string} data.descricao - Description
 * @param {number} data.valor - Value
 * @param {string} data.dataVencimento - Due date (YYYY-MM-DD)
 * @param {string} [data.dataCompetencia] - Competence date (YYYY-MM-DD)
 * @param {string} [data.tipoDespesa] - Expense type
 * @param {string} [data.recorrencia] - Recurrence (unica, mensal, etc)
 * @param {string} [data.categoriaId] - Category ID
 * @param {string} [data.centroCustoId] - Cost center ID
 * @param {string} [data.numeroDocumento] - Document number
 * @param {string} [data.observacoes] - Notes
 * @returns {Promise<{ id: string }>}
 */
export async function createContaPagar(data) {
  return apiService.post(`${API_BASE}/contas-pagar`, data);
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

  if (options.nome) params.nome = options.nome;
  if (options.apenasAtivos !== undefined) params.apenas_ativos = options.apenasAtivos;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

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

  if (options.profissionalId) params.profissional_id = options.profissionalId;
  if (options.status) params.status = options.status;
  if (options.dataInicio) params.data_inicio = options.dataInicio;
  if (options.dataFim) params.data_fim = options.dataFim;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

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
  return apiService.get(`${API_BASE}/relatorios/por-convenio`, {
    data_inicio: dataInicio,
    data_fim: dataFim,
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
  return apiService.get(`${API_BASE}/relatorios/por-medico`, {
    data_inicio: dataInicio,
    data_fim: dataFim,
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
  return apiService.get(`${API_BASE}/relatorios/dre`, {
    data_inicio: dataInicio,
    data_fim: dataFim,
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

  // Relatórios
  getReceitaPorConvenio,
  getReceitaPorMedico,
  getDRE,
  getFluxoCaixaProjecao,

  // Enums
  OrigemContaReceber,
  StatusContaReceber,
  FormaPagamento,
};

export default financialService;
