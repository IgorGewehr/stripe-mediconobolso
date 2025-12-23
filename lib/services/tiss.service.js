/**
 * TISS Service - Client-side service for TISS operations
 * Communicates with the Next.js API routes which proxy to the Rust microservice
 */

const API_BASE = '/api/tiss';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`TISS API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== OPERADORAS ====================

/**
 * Lista todas as operadoras ativas
 */
export async function listOperadoras() {
  return fetchApi('/operadoras');
}

/**
 * Busca operadoras por texto
 */
export async function searchOperadoras(termo) {
  return fetchApi(`/operadoras?search=${encodeURIComponent(termo)}`);
}

/**
 * Busca operadora por ID
 */
export async function getOperadora(id) {
  return fetchApi(`/operadoras/${id}`);
}

/**
 * Cria nova operadora
 */
export async function createOperadora(data) {
  return fetchApi('/operadoras', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza operadora
 */
export async function updateOperadora(id, data) {
  return fetchApi(`/operadoras/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Desativa operadora
 */
export async function deleteOperadora(id) {
  return fetchApi(`/operadoras/${id}`, {
    method: 'DELETE',
  });
}

// ==================== BENEFICIÁRIOS ====================

/**
 * Lista beneficiários de um médico
 */
export async function listBeneficiarios(doctorId) {
  return fetchApi(`/beneficiarios?doctor_id=${doctorId}`);
}

/**
 * Lista convênios de um paciente
 */
export async function listConveniosPaciente(doctorId, patientId) {
  return fetchApi(`/beneficiarios?doctor_id=${doctorId}&patient_id=${patientId}`);
}

/**
 * Busca beneficiários por número de carteira
 */
export async function searchBeneficiariosByCarteira(doctorId, carteira) {
  return fetchApi(`/beneficiarios?doctor_id=${doctorId}&carteira=${encodeURIComponent(carteira)}`);
}

/**
 * Vincula paciente a convênio
 */
export async function vincularPacienteConvenio(data) {
  return fetchApi('/beneficiarios/vincular', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Cria novo beneficiário
 */
export async function createBeneficiario(data) {
  return fetchApi('/beneficiarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== TUSS ====================

/**
 * Busca códigos TUSS para autocomplete
 */
export async function searchTussCodes(termo, tipo = null, limit = 20) {
  let endpoint = `/tuss?termo=${encodeURIComponent(termo)}&limit=${limit}`;
  if (tipo) {
    endpoint += `&tipo=${tipo}`;
  }
  return fetchApi(endpoint);
}

/**
 * Lista códigos TUSS com filtros
 */
export async function listTussCodes(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchApi(`/tuss?${params.toString()}`);
}

/**
 * Busca código TUSS por código exato
 */
export async function getTussByCodigo(codigo) {
  return fetchApi(`/tuss?codigo=${codigo}`);
}

/**
 * Importa códigos TUSS em massa
 */
export async function importTussCodes(items, sobrescreverExistentes = false) {
  return fetchApi('/tuss/import', {
    method: 'POST',
    body: JSON.stringify({
      items,
      sobrescrever_existentes: sobrescreverExistentes,
    }),
  });
}

// ==================== GUIAS ====================

/**
 * Lista guias com filtros
 */
export async function listGuias(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  return fetchApi(`/guias?${params.toString()}`);
}

/**
 * Busca guia completa por ID
 */
export async function getGuia(id) {
  return fetchApi(`/guias/${id}`);
}

/**
 * Cria nova guia
 */
export async function createGuia(data) {
  return fetchApi('/guias', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza guia
 */
export async function updateGuia(id, data) {
  return fetchApi(`/guias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deleta guia
 */
export async function deleteGuia(id) {
  return fetchApi(`/guias/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Valida guia antes do envio
 */
export async function validarGuia(id) {
  return fetchApi(`/guias/${id}/validar`);
}

/**
 * Adiciona procedimento à guia
 */
export async function addProcedimentoToGuia(guiaId, procedimento) {
  return fetchApi(`/guias/${guiaId}/procedimentos`, {
    method: 'POST',
    body: JSON.stringify(procedimento),
  });
}

/**
 * Lista procedimentos de uma guia
 */
export async function listProcedimentosGuia(guiaId) {
  return fetchApi(`/guias/${guiaId}/procedimentos`);
}

// ==================== LOTES ====================

/**
 * Lista lotes com filtros
 */
export async function listLotes(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  return fetchApi(`/lotes?${params.toString()}`);
}

/**
 * Busca lote completo por ID
 */
export async function getLote(id) {
  return fetchApi(`/lotes/${id}`);
}

/**
 * Cria novo lote
 */
export async function createLote(data) {
  return fetchApi('/lotes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fecha lote e gera XML
 */
export async function fecharLote(id, gerarXml = true) {
  return fetchApi(`/lotes/${id}/fechar`, {
    method: 'POST',
    body: JSON.stringify({ gerar_xml: gerarXml }),
  });
}

/**
 * Baixa XML do lote
 */
export async function downloadLoteXml(id) {
  const response = await fetch(`${API_BASE}/lotes/${id}/xml`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao baixar XML');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lote_${id}.xml`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

/**
 * Deleta lote
 */
export async function deleteLote(id) {
  return fetchApi(`/lotes/${id}`, {
    method: 'DELETE',
  });
}

// ==================== FINANCEIRO ====================

/**
 * Lista contas a receber
 */
export async function listContasReceber(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchApi(`/financeiro?${params.toString()}`);
}

/**
 * Busca resumo financeiro por período
 */
export async function getResumoFinanceiro(doctorId, dataInicio, dataFim) {
  return fetchApi(
    `/financeiro?action=resumo&doctor_id=${doctorId}&data_inicio=${dataInicio}&data_fim=${dataFim}`
  );
}

/**
 * Busca previsão de recebimento
 */
export async function getPrevisaoRecebimento(doctorId, meses = 3) {
  return fetchApi(`/financeiro?action=previsao&doctor_id=${doctorId}&meses=${meses}`);
}

/**
 * Cria conta a receber a partir de lote
 */
export async function criarContaDeLote(loteId, diasParaPagamento = 45) {
  return fetchApi('/financeiro', {
    method: 'POST',
    body: JSON.stringify({
      action: 'criar_de_lote',
      lote_id: loteId,
      dias_para_pagamento: diasParaPagamento,
    }),
  });
}

/**
 * Registra recebimento
 */
export async function registrarRecebimento(contaId, data) {
  return fetchApi('/financeiro', {
    method: 'POST',
    body: JSON.stringify({
      action: 'registrar_recebimento',
      conta_id: contaId,
      ...data,
    }),
  });
}

// ==================== ESTATÍSTICAS ====================

/**
 * Busca estatísticas de guias e lotes
 */
export async function getStats(doctorId) {
  return fetchApi(`/stats/${doctorId}`);
}

/**
 * Health check do serviço TISS
 */
export async function healthCheck() {
  return fetchApi('');
}

// Export default object with all methods
const tissService = {
  // Operadoras
  listOperadoras,
  searchOperadoras,
  getOperadora,
  createOperadora,
  updateOperadora,
  deleteOperadora,

  // Beneficiários
  listBeneficiarios,
  listConveniosPaciente,
  searchBeneficiariosByCarteira,
  vincularPacienteConvenio,
  createBeneficiario,

  // TUSS
  searchTussCodes,
  listTussCodes,
  getTussByCodigo,
  importTussCodes,

  // Guias
  listGuias,
  getGuia,
  createGuia,
  updateGuia,
  deleteGuia,
  validarGuia,
  addProcedimentoToGuia,
  listProcedimentosGuia,

  // Lotes
  listLotes,
  getLote,
  createLote,
  fecharLote,
  downloadLoteXml,
  deleteLote,

  // Financeiro
  listContasReceber,
  getResumoFinanceiro,
  getPrevisaoRecebimento,
  criarContaDeLote,
  registrarRecebimento,

  // Stats
  getStats,
  healthCheck,
};

export default tissService;
