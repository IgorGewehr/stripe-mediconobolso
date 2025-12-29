/**
 * Glossas Service - Client-side service for Glosas (billing disputes) operations
 * Communicates with the Rust backend API for glossa management and AI analysis
 */

const API_BASE = '/api/glossas';

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
    console.error(`Glossas API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== GLOSSAS CRUD ====================

/**
 * Lista glossas com filtros e paginacao
 */
export async function listGlossas(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  return fetchApi(`?${params.toString()}`);
}

/**
 * Busca glossa por ID
 */
export async function getGlossa(id) {
  return fetchApi(`/${id}`);
}

/**
 * Cria nova glossa
 */
export async function createGlossa(data) {
  return fetchApi('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza glossa
 */
export async function updateGlossa(id, data) {
  return fetchApi(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deleta glossa (apenas pendentes)
 */
export async function deleteGlossa(id) {
  return fetchApi(`/${id}`, {
    method: 'DELETE',
  });
}

// ==================== ACOES DE GLOSSA ====================

/**
 * Aceita a glossa (desiste de contestar)
 */
export async function aceitarGlossa(id) {
  return fetchApi(`/${id}/aceitar`, {
    method: 'POST',
  });
}

/**
 * Marca glossa como recuperada
 */
export async function recuperarGlossa(id, valorRecuperado) {
  return fetchApi(`/${id}/recuperar`, {
    method: 'POST',
    body: JSON.stringify({ valorRecuperado }),
  });
}

/**
 * Marca glossa como perdida
 */
export async function perderGlossa(id) {
  return fetchApi(`/${id}/perder`, {
    method: 'POST',
  });
}

// ==================== RECURSOS (CONTESTACOES) ====================

/**
 * Lista recursos de uma glossa
 */
export async function listRecursos(glossaId) {
  return fetchApi(`/${glossaId}/recursos`);
}

/**
 * Busca recurso por ID
 */
export async function getRecurso(glossaId, recursoId) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}`);
}

/**
 * Cria novo recurso
 */
export async function createRecurso(glossaId, data) {
  return fetchApi(`/${glossaId}/recursos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza recurso
 */
export async function updateRecurso(glossaId, recursoId, data) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deleta recurso (apenas pendentes)
 */
export async function deleteRecurso(glossaId, recursoId) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}`, {
    method: 'DELETE',
  });
}

/**
 * Inicia elaboracao do recurso
 */
export async function iniciarElaboracao(glossaId, recursoId) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}/iniciar`, {
    method: 'POST',
  });
}

/**
 * Envia recurso para operadora
 */
export async function enviarRecurso(glossaId, recursoId) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}/enviar`, {
    method: 'POST',
  });
}

/**
 * Registra resposta da operadora
 */
export async function registrarResposta(glossaId, recursoId, data) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}/resposta`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Adiciona documento ao recurso
 */
export async function adicionarDocumento(glossaId, recursoId, documento) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}/documentos`, {
    method: 'POST',
    body: JSON.stringify(documento),
  });
}

// ==================== ESTATISTICAS E DASHBOARD ====================

/**
 * Busca estatisticas de glossas
 */
export async function getEstatisticas(dataInicio = null, dataFim = null) {
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  return fetchApi(`/estatisticas?${params.toString()}`);
}

/**
 * Busca dashboard completo de glossas
 */
export async function getDashboard(dataInicio = null, dataFim = null, convenioId = null) {
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  if (convenioId) params.append('convenioId', convenioId);
  return fetchApi(`/dashboard?${params.toString()}`);
}

/**
 * Busca ranking de convenios por glosas
 */
export async function getRankingConvenios(dataInicio = null, dataFim = null) {
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  return fetchApi(`/ranking-convenios?${params.toString()}`);
}

/**
 * Busca tendencias de glossas (ultimos 12 meses)
 */
export async function getTendencias() {
  return fetchApi('/tendencias');
}

// ==================== IA - ANALISE E GERACAO ====================

/**
 * Verifica status do servico de IA
 */
export async function getIAStatus() {
  return fetchApi('/ia/status');
}

/**
 * Analisa glossa com IA
 */
export async function analisarGlossaIA(id, contextoAdicional = null) {
  return fetchApi(`/${id}/ia/analisar`, {
    method: 'POST',
    body: JSON.stringify({ contextoAdicional }),
  });
}

/**
 * Gera texto de recurso com IA
 */
export async function gerarRecursoIA(id, motivoRecurso, informacoesAdicionais = null) {
  return fetchApi(`/${id}/ia/gerar-recurso`, {
    method: 'POST',
    body: JSON.stringify({ motivoRecurso, informacoesAdicionais }),
  });
}

/**
 * Melhora texto de recurso existente com IA
 */
export async function melhorarRecursoIA(glossaId, recursoId) {
  return fetchApi(`/${glossaId}/recursos/${recursoId}/ia/melhorar`, {
    method: 'POST',
  });
}

/**
 * Analisa padroes de glossas com IA
 */
export async function analisarPadroesIA(convenioId = null, dataInicio = null, dataFim = null, limit = 50) {
  return fetchApi('/ia/analisar-padroes', {
    method: 'POST',
    body: JSON.stringify({ convenioId, dataInicio, dataFim, limit }),
  });
}

// ==================== HELPERS ====================

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

/**
 * Formata data para padrao brasileiro
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Retorna cor baseada no status da glossa
 */
export function getStatusColor(status) {
  const colors = {
    pendente: 'warning',
    em_recurso: 'info',
    recuperada: 'success',
    perdida: 'error',
    prazo_expirado: 'error',
    aceita: 'default',
  };
  return colors[status?.toLowerCase()] || 'default';
}

/**
 * Retorna label legivel do status
 */
export function getStatusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    em_recurso: 'Em Recurso',
    recuperada: 'Recuperada',
    perdida: 'Perdida',
    prazo_expirado: 'Prazo Expirado',
    aceita: 'Aceita',
  };
  return labels[status?.toLowerCase()] || status;
}

/**
 * Retorna label do tipo de glossa
 */
export function getTipoGlossaLabel(tipo) {
  const labels = {
    M01: 'M01 - Procedimento nao autorizado',
    M02: 'M02 - Procedimento fora da cobertura',
    M03: 'M03 - Ausencia de documentacao',
    M04: 'M04 - Procedimento duplicado',
    M05: 'M05 - Erro de codificacao',
    M06: 'M06 - Falta de justificativa clinica',
    M07: 'M07 - Valor acima do contratado',
    M08: 'M08 - Data inconsistente',
    M09: 'M09 - Beneficiario invalido',
    M10: 'M10 - Prestador invalido',
    M11: 'M11 - Carencia nao cumprida',
    M12: 'M12 - Procedimento nao compativel com CID',
    OUTROS: 'Outros motivos',
  };
  return labels[tipo?.toUpperCase()] || tipo;
}

// Export default object with all methods
const glossasService = {
  // CRUD
  listGlossas,
  getGlossa,
  createGlossa,
  updateGlossa,
  deleteGlossa,

  // Acoes
  aceitarGlossa,
  recuperarGlossa,
  perderGlossa,

  // Recursos
  listRecursos,
  getRecurso,
  createRecurso,
  updateRecurso,
  deleteRecurso,
  iniciarElaboracao,
  enviarRecurso,
  registrarResposta,
  adicionarDocumento,

  // Estatisticas
  getEstatisticas,
  getDashboard,
  getRankingConvenios,
  getTendencias,

  // IA
  getIAStatus,
  analisarGlossaIA,
  gerarRecursoIA,
  melhorarRecursoIA,
  analisarPadroesIA,

  // Helpers
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getTipoGlossaLabel,
};

export default glossasService;
