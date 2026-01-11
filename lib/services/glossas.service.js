/**
 * Glossas Service - Client-side service for Glosas (billing disputes) operations
 * Communicates with the Rust backend API for glossa management and AI analysis
 */

import { auth } from '@/lib/config/firebase.config';

const API_BASE = '/api/glossas';

/**
 * Get the current user's auth token
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  return user.getIdToken();
}

/**
 * Generic fetch wrapper with error handling and debug logging
 */
async function fetchApi(endpoint, options = {}) {
  const startTime = performance.now();
  const method = options.method || 'GET';

  console.log(`[Glossas] ${method} ${endpoint} - Iniciando requisicao...`);
  if (options.body) {
    console.log(`[Glossas] ${method} ${endpoint} - Body:`, JSON.parse(options.body));
  }

  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.warn(`[Glossas] ${method} ${endpoint} - Resposta nao e JSON valido:`, text.substring(0, 200));
      data = {};
    }

    const duration = (performance.now() - startTime).toFixed(0);

    if (!response.ok) {
      console.error(`[Glossas] ${method} ${endpoint} - Erro ${response.status} (${duration}ms):`, data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log(`[Glossas] ${method} ${endpoint} - Sucesso (${duration}ms)`, {
      status: response.status,
      dataKeys: Object.keys(data),
      itemsCount: Array.isArray(data) ? data.length : (data.items?.length || data.glossas?.length || null),
    });

    return data;
  } catch (error) {
    const duration = (performance.now() - startTime).toFixed(0);
    console.error(`[Glossas] ${method} ${endpoint} - Falha (${duration}ms):`, error.message);
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
  params.append('action', 'estatisticas');
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  return fetchApi(`?${params.toString()}`);
}

/**
 * Busca dashboard completo de glossas
 */
export async function getDashboard(dataInicio = null, dataFim = null, convenioId = null) {
  const params = new URLSearchParams();
  params.append('action', 'dashboard');
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  if (convenioId) params.append('convenioId', convenioId);
  return fetchApi(`?${params.toString()}`);
}

/**
 * Busca ranking de convenios por glosas
 */
export async function getRankingConvenios(dataInicio = null, dataFim = null) {
  const params = new URLSearchParams();
  params.append('action', 'ranking-convenios');
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  return fetchApi(`?${params.toString()}`);
}

/**
 * Busca tendencias de glossas (ultimos 12 meses)
 */
export async function getTendencias() {
  return fetchApi('?action=tendencias');
}

// ==================== IA - ANALISE E GERACAO ====================

/**
 * Verifica status do servico de IA
 */
export async function getIAStatus() {
  console.log('[Glossas IA] Verificando status do servico de IA...');
  const result = await fetchApi('?action=ia-status');
  console.log('[Glossas IA] Status:', result);
  return result;
}

/**
 * Analisa glossa com IA
 */
export async function analisarGlossaIA(id, contextoAdicional = null) {
  console.log(`[Glossas IA] Iniciando analise da glossa ${id}...`);
  const startTime = performance.now();
  const result = await fetchApi(`/${id}/ia/analisar`, {
    method: 'POST',
    body: JSON.stringify({ contextoAdicional }),
  });
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`[Glossas IA] Analise concluida em ${duration}s`, {
    probabilidadeSucesso: result.probabilidadeSucesso,
    tokensUsed: result.tokensUsed,
  });
  return result;
}

/**
 * Gera texto de recurso com IA
 */
export async function gerarRecursoIA(id, motivoRecurso, informacoesAdicionais = null) {
  console.log(`[Glossas IA] Gerando recurso para glossa ${id}...`);
  const startTime = performance.now();
  const result = await fetchApi(`/${id}/ia/gerar-recurso`, {
    method: 'POST',
    body: JSON.stringify({ motivoRecurso, informacoesAdicionais }),
  });
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`[Glossas IA] Recurso gerado em ${duration}s`, {
    fundamentacaoLength: result.fundamentacao?.length,
    tokensUsed: result.tokensUsed,
  });
  return result;
}

/**
 * Melhora texto de recurso existente com IA
 */
export async function melhorarRecursoIA(glossaId, recursoId) {
  console.log(`[Glossas IA] Melhorando recurso ${recursoId} da glossa ${glossaId}...`);
  const startTime = performance.now();
  const result = await fetchApi(`/${glossaId}/recursos/${recursoId}/ia/melhorar`, {
    method: 'POST',
  });
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`[Glossas IA] Recurso melhorado em ${duration}s`);
  return result;
}

/**
 * Analisa padroes de glossas com IA
 */
export async function analisarPadroesIA(convenioId = null, dataInicio = null, dataFim = null, limit = 50) {
  console.log('[Glossas IA] Iniciando analise de padroes...', { convenioId, dataInicio, dataFim, limit });
  const startTime = performance.now();
  const result = await fetchApi('/ia/analisar-padroes', {
    method: 'POST',
    body: JSON.stringify({ convenioId, dataInicio, dataFim, limit }),
  });
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`[Glossas IA] Analise de padroes concluida em ${duration}s`, {
    padroesIdentificados: result.padroes?.length,
    recomendacoes: result.recomendacoes?.length,
  });
  return result;
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
 * Retorna label do tipo de glossa (sincronizado com backend - codigos ANS)
 */
export function getTipoGlossaLabel(tipo) {
  const labels = {
    M01: 'M01 - Procedimento nao coberto pelo plano',
    M02: 'M02 - Procedimento nao autorizado previamente',
    M03: 'M03 - Quantidade excedida',
    M04: 'M04 - Valor divergente da tabela',
    M05: 'M05 - Duplicidade de cobranca',
    M06: 'M06 - Beneficiario inelegivel',
    M07: 'M07 - Prestador nao credenciado',
    M08: 'M08 - Falta de documentacao',
    M09: 'M09 - Prazo de apresentacao excedido',
    M10: 'M10 - CID incompativel com procedimento',
    M11: 'M11 - Procedimento incluido em pacote',
    M12: 'M12 - Material/Medicamento nao autorizado',
    OUT: 'Outros motivos',
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
