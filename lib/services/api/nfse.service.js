/**
 * @fileoverview NFSe API Service
 * @description Service for NFSe (Nota Fiscal de Serviço Eletrônica) management
 * Includes certificate management, RPS creation, and NFSe emission
 */

import apiService from './apiService';

const API_BASE = '/nfse';

// =============================================================================
// ENUMS
// =============================================================================

export const StatusNfse = {
  RASCUNHO: 'rascunho',
  PROCESSANDO: 'processando',
  EMITIDA: 'emitida',
  CANCELADA: 'cancelada',
  ERRO: 'erro',
};

export const AmbienteNfse = {
  HOMOLOGACAO: 'homologacao',
  PRODUCAO: 'producao',
};

export const TipoCertificado = {
  A1: 'a1',
  A3: 'a3',
};

export const UsoCertificado = {
  NFSE: 'nfse',
  TISS: 'tiss',
  PRESCRICAO: 'prescricao',
  GERAL: 'geral',
};

// =============================================================================
// DASHBOARD FISCAL
// =============================================================================

/**
 * Get fiscal dashboard data
 * @returns {Promise<{
 *   resumo_mes: {
 *     notas_emitidas: number,
 *     valor_total: number,
 *     iss_retido: number,
 *     notas_canceladas: number
 *   },
 *   notas_recentes: Array,
 *   certificado_status: Object
 * }>}
 */
export async function getDashboard() {
  return apiService.get(`${API_BASE}/dashboard`);
}

/**
 * Get list of supported municipalities
 * @returns {Promise<Array<{
 *   codigo_ibge: string,
 *   nome: string,
 *   uf: string,
 *   provedor: string
 * }>>}
 */
export async function getMunicipios() {
  return apiService.get(`${API_BASE}/municipios`);
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Get NFSe configuration
 * @returns {Promise<{
 *   id: string,
 *   codigo_municipio: string,
 *   ambiente: string,
 *   serie_rps: string,
 *   proximo_numero_rps: number,
 *   configurado: boolean,
 *   certificado_id: string | null,
 *   certificado_valido: boolean,
 *   dias_expiracao_certificado: number | null,
 *   habilitar_adn: boolean
 * }>}
 */
export async function getConfiguracao() {
  return apiService.get(`${API_BASE}/configuracao`);
}

/**
 * Update NFSe configuration
 * @param {Object} config
 * @param {string} config.codigoMunicipio - IBGE municipality code
 * @param {string} config.ambiente - 'homologacao' or 'producao'
 * @param {string} config.serieRps - RPS series (default: 'RPS')
 * @param {string} [config.tokenAutenticacao] - Authentication token for some providers
 * @param {string} [config.certificadoId] - Certificate UUID to use
 * @param {boolean} [config.habilitarAdn] - Enable ADN 2026
 * @param {number} [config.aliquotaIbsPadrao] - Default IBS rate
 * @param {number} [config.aliquotaCbsPadrao] - Default CBS rate
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function updateConfiguracao(config) {
  return apiService.put(`${API_BASE}/configuracao`, config);
}

// =============================================================================
// CERTIFICADOS DIGITAIS
// =============================================================================

/**
 * List certificates
 * @param {Object} [options]
 * @param {boolean} [options.apenasAtivos] - Only active certificates
 * @param {boolean} [options.apenasValidos] - Only valid (not expired) certificates
 * @param {string} [options.usoPrincipal] - Filter by primary use (nfse, tiss, prescricao, geral)
 * @returns {Promise<Array<{
 *   id: string,
 *   common_name: string,
 *   documento: string,
 *   emissor: string,
 *   data_emissao: string,
 *   data_expiracao: string,
 *   tipo_certificado: string,
 *   uso_principal: string,
 *   ativo: boolean,
 *   status_validade: string,
 *   dias_restantes: number
 * }>>}
 */
export async function listCertificados(options = {}) {
  return apiService.get(`${API_BASE}/certificados`, {
    apenas_ativos: options.apenasAtivos,
    apenas_validos: options.apenasValidos,
    uso_principal: options.usoPrincipal,
  });
}

/**
 * Get certificate by ID
 * @param {string} id - Certificate UUID
 * @returns {Promise<Object>}
 */
export async function getCertificado(id) {
  return apiService.get(`${API_BASE}/certificados/${id}`);
}

/**
 * Upload a new certificate
 * @param {File} file - PFX file
 * @param {string} password - Certificate password
 * @param {string} usoPrincipal - Primary use (nfse, tiss, prescricao, geral)
 * @returns {Promise<{ id: string, common_name: string, data_expiracao: string }>}
 */
export async function uploadCertificado(file, password, usoPrincipal = 'nfse') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  formData.append('uso_principal', usoPrincipal);

  return apiService.post(`${API_BASE}/certificados`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Validate a certificate file without uploading
 * @param {File} file - PFX file
 * @param {string} password - Certificate password
 * @returns {Promise<{
 *   valido: boolean,
 *   common_name: string,
 *   documento: string,
 *   emissor: string,
 *   data_emissao: string,
 *   data_expiracao: string,
 *   dias_restantes: number,
 *   erros: string[]
 * }>}
 */
export async function validateCertificado(file, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  return apiService.post(`${API_BASE}/certificados/validate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Deactivate a certificate
 * @param {string} id - Certificate UUID
 * @returns {Promise<{ success: boolean }>}
 */
export async function desativarCertificado(id) {
  return apiService.post(`${API_BASE}/certificados/${id}/desativar`);
}

/**
 * Delete a certificate
 * @param {string} id - Certificate UUID
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteCertificado(id) {
  return apiService.delete(`${API_BASE}/certificados/${id}`);
}

// =============================================================================
// RPS (RECIBO PROVISÓRIO DE SERVIÇO)
// =============================================================================

/**
 * List RPS
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array,
 *   total: number,
 *   page: number,
 *   per_page: number
 * }>}
 */
export async function listRps(options = {}) {
  return apiService.get(`${API_BASE}/rps`, {
    page: options.page || 1,
    per_page: options.perPage || 20,
  });
}

/**
 * Create a new RPS
 * @param {Object} rps
 * @param {string} rps.tomadorId - Tomador (customer) UUID
 * @param {number} [rps.naturezaOperacao=1] - Nature of operation (1-6)
 * @param {string} rps.competencia - Competence date (YYYY-MM-DD)
 * @param {string} rps.codigoServico - Service code
 * @param {string} [rps.codigoCnae] - CNAE code
 * @param {string} [rps.codigoNbs] - NBS code (Reforma 2026)
 * @param {string} rps.discriminacao - Service description
 * @param {number} rps.valorServicos - Service value
 * @param {number} [rps.valorDeducoes] - Deductions value
 * @param {number} rps.aliquotaIss - ISS tax rate (%)
 * @param {boolean} [rps.issRetido=false] - ISS retained by tomador
 * @param {number} [rps.descontoIncondicionado] - Unconditional discount
 * @param {string} [rps.observacoes] - Notes
 * @param {string} [rps.guiaId] - Related guide UUID
 * @param {string} [rps.contaReceberId] - Related receivable UUID
 * @returns {Promise<{
 *   id: string,
 *   numero: number,
 *   serie: string,
 *   valor_servicos: number,
 *   valor_iss: number,
 *   valor_liquido: number,
 *   status: string
 * }>}
 */
export async function createRps(rps) {
  return apiService.post(`${API_BASE}/rps`, rps);
}

// =============================================================================
// NFSe
// =============================================================================

/**
 * List NFSe
 * @param {Object} [options]
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.dataInicio] - Start date (YYYY-MM-DD)
 * @param {string} [options.dataFim] - End date (YYYY-MM-DD)
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array,
 *   total: number,
 *   page: number,
 *   per_page: number
 * }>}
 */
export async function listNfse(options = {}) {
  return apiService.get(`${API_BASE}`, {
    status: options.status,
    data_inicio: options.dataInicio,
    data_fim: options.dataFim,
    page: options.page || 1,
    per_page: options.perPage || 20,
  });
}

/**
 * Get NFSe by ID
 * @param {string} id - NFSe UUID
 * @returns {Promise<Object>}
 */
export async function getNfse(id) {
  return apiService.get(`${API_BASE}/${id}`);
}

/**
 * Get NFSe XML
 * @param {string} id - NFSe UUID
 * @returns {Promise<{ xml: string }>}
 */
export async function getNfseXml(id) {
  return apiService.get(`${API_BASE}/${id}/xml`);
}

/**
 * Emit NFSe (send RPS batch to municipal webservice)
 * @param {string[]} rpsIds - Array of RPS UUIDs to emit
 * @returns {Promise<{
 *   lote_id: string,
 *   protocolo: string,
 *   situacao: string,
 *   nfses: Array<{
 *     rps_numero: number,
 *     nfse_numero: number | null,
 *     codigo_verificacao: string | null,
 *     status: string
 *   }>,
 *   erros: Array
 * }>}
 */
export async function emitirNfse(rpsIds) {
  return apiService.post(`${API_BASE}/emit`, { rpsIds });
}

/**
 * Emit NFSe from financial receivable
 * @param {string} contaReceberId - Receivable UUID
 * @param {Object} [options]
 * @param {string} [options.discriminacao] - Service description override
 * @returns {Promise<Object>}
 */
export async function emitirNfseFromFinanceiro(contaReceberId, options = {}) {
  return apiService.post(`${API_BASE}/from-financeiro`, {
    contaReceberId,
    ...options,
  });
}

/**
 * Check batch status
 * @param {string} loteId - Batch UUID
 * @returns {Promise<{
 *   lote_id: string,
 *   protocolo: string,
 *   situacao: string,
 *   nfses: Array,
 *   erros: Array
 * }>}
 */
export async function consultarStatusLote(loteId) {
  return apiService.get(`${API_BASE}/lotes/${loteId}/status`);
}

/**
 * Cancel NFSe
 * @param {string} id - NFSe UUID
 * @param {string} motivo - Cancellation reason
 * @returns {Promise<{ success: boolean, data_cancelamento: string }>}
 */
export async function cancelarNfse(id, motivo) {
  return apiService.post(`${API_BASE}/${id}/cancelar`, { motivo });
}

// =============================================================================
// EXPORTS
// =============================================================================

const nfseService = {
  // Dashboard
  getDashboard,
  getMunicipios,
  // Configuração
  getConfiguracao,
  updateConfiguracao,
  // Certificados
  listCertificados,
  getCertificado,
  uploadCertificado,
  validateCertificado,
  desativarCertificado,
  deleteCertificado,
  // RPS
  listRps,
  createRps,
  // NFSe
  listNfse,
  getNfse,
  getNfseXml,
  emitirNfse,
  emitirNfseFromFinanceiro,
  consultarStatusLote,
  cancelarNfse,
};

export default nfseService;
