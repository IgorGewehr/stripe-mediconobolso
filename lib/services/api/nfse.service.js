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
  PRODUCAO_RESTRITA: 'producao_restrita', // Padrão Nacional 2026 - ambiente de testes gov.br
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
 * Get NFSe support info
 * @description Com o Padrão Nacional 2026, todos os municípios brasileiros são suportados
 * através da API unificada gov.br. Esta função retorna informações sobre o sistema.
 * @returns {Promise<{
 *   message: string,
 *   info: string,
 *   url_producao: string,
 *   url_producao_restrita: string,
 *   municipios: Array
 * }>}
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
  console.log('[NFSe] uploadCertificado - Iniciando upload', {
    fileName: file.name,
    fileSize: file.size,
    usoPrincipal,
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  formData.append('uso_principal', usoPrincipal);

  try {
    const result = await apiService.post(`${API_BASE}/certificados`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('[NFSe] uploadCertificado - Sucesso', {
      id: result.id,
      commonName: result.common_name,
      dataExpiracao: result.data_expiracao,
    });
    return result;
  } catch (error) {
    console.error('[NFSe] uploadCertificado - Erro', {
      error: error.message,
      response: error.response?.data,
    });
    throw error;
  }
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
  console.log('[NFSe] createRps - Criando RPS', {
    tomadorId: rps.tomadorId,
    codigoServico: rps.codigoServico,
    valorServicos: rps.valorServicos,
    aliquotaIss: rps.aliquotaIss,
    codigoNbs: rps.codigoNbs,
  });

  try {
    const result = await apiService.post(`${API_BASE}/rps`, rps);
    console.log('[NFSe] createRps - Sucesso', {
      id: result.id,
      numero: result.numero,
      serie: result.serie,
      valorServicos: result.valor_servicos,
      valorIss: result.valor_iss,
      status: result.status,
    });
    return result;
  } catch (error) {
    console.error('[NFSe] createRps - Erro', {
      error: error.message,
      response: error.response?.data,
      rps,
    });
    throw error;
  }
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
  console.log('[NFSe] emitirNfse - Iniciando emissao', {
    rpsIds,
    quantidade: rpsIds.length,
    timestamp: new Date().toISOString(),
  });

  const startTime = performance.now();

  try {
    const result = await apiService.post(`${API_BASE}/emit`, { rpsIds });
    const duration = (performance.now() - startTime).toFixed(2);

    console.log('[NFSe] emitirNfse - Sucesso', {
      loteId: result.lote_id,
      protocolo: result.protocolo,
      situacao: result.situacao,
      nfsesEmitidas: result.nfses?.length || 0,
      erros: result.erros?.length || 0,
      duracaoMs: duration,
    });

    // Log detalhado de cada NFSe
    if (result.nfses?.length > 0) {
      console.log('[NFSe] emitirNfse - Detalhes das NFSe:');
      result.nfses.forEach((nfse, idx) => {
        console.log(`  [${idx + 1}] RPS ${nfse.rps_numero} -> NFSe ${nfse.nfse_numero || 'PENDENTE'} | ${nfse.status}`);
      });
    }

    // Log de erros se houver
    if (result.erros?.length > 0) {
      console.warn('[NFSe] emitirNfse - Erros encontrados:');
      result.erros.forEach((erro, idx) => {
        console.warn(`  [${idx + 1}] ${erro.codigo}: ${erro.mensagem}`);
      });
    }

    return result;
  } catch (error) {
    const duration = (performance.now() - startTime).toFixed(2);

    console.error('[NFSe] emitirNfse - ERRO na emissao', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      rpsIds,
      duracaoMs: duration,
    });
    throw error;
  }
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
  console.log('[NFSe] cancelarNfse - Iniciando cancelamento', {
    nfseId: id,
    motivo,
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await apiService.post(`${API_BASE}/${id}/cancelar`, { motivo });
    console.log('[NFSe] cancelarNfse - Sucesso', {
      success: result.success,
      dataCancelamento: result.data_cancelamento,
    });
    return result;
  } catch (error) {
    console.error('[NFSe] cancelarNfse - Erro', {
      error: error.message,
      response: error.response?.data,
      nfseId: id,
      motivo,
    });
    throw error;
  }
}

/**
 * Get NFSe by access key (Padrão Nacional 2026)
 * @param {string} chaveAcesso - 50-character access key
 * @returns {Promise<Object>}
 */
export async function getNfseByChave(chaveAcesso) {
  return apiService.get(`${API_BASE}/chave/${chaveAcesso}`);
}

/**
 * Get DANFSe PDF (Padrão Nacional 2026)
 * @param {string} id - NFSe UUID
 * @returns {Promise<Blob>}
 */
export async function getDanfse(id) {
  return apiService.get(`${API_BASE}/${id}/danfse`, {}, { responseType: 'blob' });
}

/**
 * List NFSe events (Padrão Nacional 2026)
 * @param {string} id - NFSe UUID
 * @returns {Promise<Array<{
 *   tipo_evento: string,
 *   sequencial: number,
 *   data_evento: string,
 *   motivo: string,
 *   status: string
 * }>>}
 */
export async function listEventosNfse(id) {
  return apiService.get(`${API_BASE}/${id}/eventos`);
}

// =============================================================================
// INTEGRAÇÃO COM AGENDAMENTOS
// =============================================================================

/**
 * Create RPS from completed appointment
 * @param {Object} options
 * @param {string} options.appointmentId - Appointment UUID
 * @param {boolean} [options.usarIa=false] - Use AI for automatic classification
 * @param {string} [options.codigoServico] - Service code (if not using AI)
 * @param {string} [options.discriminacao] - Service description (if not using AI)
 * @param {number} [options.aliquotaIss] - Custom ISS rate
 * @returns {Promise<{
 *   id: string,
 *   numero: number,
 *   serie: string,
 *   codigo_servico: string,
 *   discriminacao: string,
 *   valor_servicos: number,
 *   valor_iss: number,
 *   valor_liquido: number,
 *   tomador_id: string,
 *   status: string
 * }>}
 */
export async function createRpsFromAppointment(options) {
  return apiService.post(`${API_BASE}/from-appointment`, options);
}

// =============================================================================
// IA - CLASSIFICAÇÃO AUTOMÁTICA (REFORMA TRIBUTÁRIA 2026)
// =============================================================================

/**
 * Classify medical service using AI
 * @param {Object} options
 * @param {string} options.descricao - Service description
 * @param {string} [options.tipoAtendimento] - Appointment type
 * @param {string} [options.especialidade] - Medical specialty
 * @returns {Promise<{
 *   codigoServico: string,
 *   codigoCnae: string,
 *   codigoNbs: string,
 *   descricaoServico: string,
 *   classificacaoTributaria: string,
 *   cstIbs: string,
 *   cstCbs: string,
 *   aliquotaIbsSugerida: number,
 *   aliquotaCbsSugerida: number,
 *   regimeEspecifico: boolean,
 *   justificativa: string
 * }>}
 */
export async function classifyServiceAI(options) {
  console.log('[NFSe] classifyServiceAI - Classificando servico', {
    descricao: options.descricao?.substring(0, 100),
    tipoAtendimento: options.tipoAtendimento,
    especialidade: options.especialidade,
  });

  try {
    const result = await apiService.post(`${API_BASE}/ai/classify`, options);
    console.log('[NFSe] classifyServiceAI - Sucesso', {
      codigoServico: result.codigoServico,
      codigoCnae: result.codigoCnae,
      codigoNbs: result.codigoNbs,
      regimeEspecifico: result.regimeEspecifico,
      aliquotaIbs: result.aliquotaIbsSugerida,
      aliquotaCbs: result.aliquotaCbsSugerida,
    });
    return result;
  } catch (error) {
    console.error('[NFSe] classifyServiceAI - Erro', {
      error: error.message,
      response: error.response?.data,
      options,
    });
    throw error;
  }
}

/**
 * Calculate IBS/CBS for health services (Reforma Tributária 2026)
 * @param {Object} options
 * @param {number} options.valorServicos - Service value
 * @param {string} options.codigoServico - Service code
 * @param {boolean} [options.ibsRetido=false] - IBS retained
 * @param {boolean} [options.cbsRetido=false] - CBS retained
 * @param {number} [options.aliquotaIbs] - Custom IBS rate
 * @param {number} [options.aliquotaCbs] - Custom CBS rate
 * @returns {Promise<{
 *   valorBase: number,
 *   valorIbs: number,
 *   valorCbs: number,
 *   valorIbsRetido: number,
 *   valorCbsRetido: number,
 *   aliquotaIbs: number,
 *   aliquotaCbs: number,
 *   cstIbs: string,
 *   cstCbs: string,
 *   regimeEspecificoSaude: boolean
 * }>}
 */
export async function calcularIbsCbs(options) {
  return apiService.post(`${API_BASE}/calcular-ibs-cbs`, options);
}

/**
 * Get available medical service codes (LC 116/2003)
 * @returns {Promise<Array<{
 *   codigo: string,
 *   descricao: string,
 *   cnaeSugerido: string,
 *   nbsSugerido: string
 * }>>}
 */
export async function listCodigosServico() {
  return apiService.get(`${API_BASE}/codigos-servico`);
}

// =============================================================================
// NUVEM FISCAL INTEGRATION
// =============================================================================

const NUVEM_FISCAL_BASE = '/nfse/nuvem-fiscal';

/**
 * Get Nuvem Fiscal integration status
 * @returns {Promise<{
 *   habilitado: boolean,
 *   ambiente: string,
 *   empresa_cadastrada: boolean,
 *   certificado_cadastrado: boolean,
 *   certificado_valido_ate: string | null
 * }>}
 */
export async function getNuvemFiscalStatus() {
  return apiService.get(`${NUVEM_FISCAL_BASE}/status`);
}

/**
 * Sync company with Nuvem Fiscal
 * @param {Object} empresa
 * @param {string} empresa.cnpj - Company CNPJ
 * @param {string} empresa.razaoSocial - Legal name
 * @param {string} [empresa.nomeFantasia] - Trade name
 * @param {string} [empresa.inscricaoMunicipal] - Municipal registration
 * @param {string} [empresa.inscricaoEstadual] - State registration
 * @param {string} [empresa.email] - Email
 * @param {string} [empresa.telefone] - Phone
 * @param {string} empresa.logradouro - Street
 * @param {string} empresa.numero - Number
 * @param {string} [empresa.complemento] - Complement
 * @param {string} empresa.bairro - Neighborhood
 * @param {string} empresa.cidade - City
 * @param {string} empresa.uf - State
 * @param {string} empresa.cep - Zip code
 * @param {string} empresa.codigoMunicipio - IBGE municipality code
 * @returns {Promise<{
 *   success: boolean,
 *   nuvemFiscalId: string,
 *   message: string
 * }>}
 */
export async function syncEmpresaNuvemFiscal(empresa) {
  return apiService.post(`${NUVEM_FISCAL_BASE}/empresa/sync`, empresa);
}

/**
 * Send digital certificate to Nuvem Fiscal
 * @param {string} certificadoId - Local certificate ID
 * @returns {Promise<{
 *   success: boolean,
 *   commonName: string,
 *   validUntil: string,
 *   message: string
 * }>}
 */
export async function enviarCertificadoNuvemFiscal(certificadoId) {
  return apiService.post(`${NUVEM_FISCAL_BASE}/certificado/enviar`, {
    certificadoId,
  });
}

/**
 * Emit NFSe via Nuvem Fiscal
 * @param {string[]} rpsIds - Array of RPS IDs to emit
 * @returns {Promise<{
 *   loteId: string,
 *   protocolo: string,
 *   situacao: string,
 *   nfses: Array<{
 *     rpsNumero: number,
 *     nfseNumero: number | null,
 *     codigoVerificacao: string | null,
 *     status: string
 *   }>,
 *   erros: Array<{
 *     rpsNumero: number | null,
 *     codigo: string,
 *     mensagem: string
 *   }>
 * }>}
 */
export async function emitirNfseNuvemFiscal(rpsIds) {
  return apiService.post(`${NUVEM_FISCAL_BASE}/emitir`, { rpsIds });
}

/**
 * Cancel NFSe via Nuvem Fiscal
 * @param {string} nfseId - NFSe ID
 * @param {string} motivo - Cancellation reason
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   status: string,
 *   dataCancelamento: string | null
 * }>}
 */
export async function cancelarNfseNuvemFiscal(nfseId, motivo) {
  return apiService.post(`${NUVEM_FISCAL_BASE}/${nfseId}/cancelar`, { motivo });
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
  // Padrão Nacional 2026
  getNfseByChave,
  getDanfse,
  listEventosNfse,
  // Integração com Agendamentos
  createRpsFromAppointment,
  // IA - Reforma Tributária 2026
  classifyServiceAI,
  calcularIbsCbs,
  listCodigosServico,
  // Nuvem Fiscal Integration
  getNuvemFiscalStatus,
  syncEmpresaNuvemFiscal,
  enviarCertificadoNuvemFiscal,
  emitirNfseNuvemFiscal,
  cancelarNfseNuvemFiscal,
};

export default nfseService;
