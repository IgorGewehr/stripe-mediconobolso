/**
 * Serviço de API para Facebook Messenger
 * Gerencia conexão, status e envio de mensagens via Facebook
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Obtém os headers de autenticação
 */
async function getAuthHeaders() {
  // Importa dinamicamente para evitar problemas de SSR
  const { auth } = await import('@/lib/config/firebase.config');
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Inicia o fluxo OAuth do Facebook
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<{authUrl: string}>} URL de autorização
 */
export async function startOAuth(tenantId) {
  const response = await fetch(`${API_BASE_URL}/api/facebook/oauth/start?tenantId=${tenantId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start OAuth');
  }

  return response.json();
}

/**
 * Conecta uma página do Facebook
 * @param {Object} params - Parâmetros de conexão
 * @param {string} params.pageId - ID da página
 * @param {string} params.pageAccessToken - Token de acesso da página
 * @param {string} [params.pageName] - Nome da página
 * @param {string} [params.pageCategory] - Categoria da página
 * @param {boolean} [params.aiEnabled] - Se IA está habilitada
 * @returns {Promise<Object>} Status da conexão
 */
export async function connectPage({ pageId, pageAccessToken, pageName, pageCategory, aiEnabled = false }) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/facebook/auth`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pageId,
      pageAccessToken,
      pageName,
      pageCategory,
      aiEnabled,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to connect Facebook page');
  }

  return response.json();
}

/**
 * Desconecta a página do Facebook
 * @returns {Promise<{success: boolean}>}
 */
export async function disconnectPage() {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/facebook/auth`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to disconnect Facebook page');
  }

  return response.json();
}

/**
 * Obtém o status da conexão Facebook
 * @returns {Promise<Object>} Status da conexão
 */
export async function getStatus() {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/facebook/auth`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get Facebook status');
  }

  return response.json();
}

/**
 * Ativa/desativa IA para Facebook
 * @param {boolean} enabled - Se IA deve ser habilitada
 * @returns {Promise<{success: boolean, ai_enabled: boolean}>}
 */
export async function toggleAI(enabled) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/facebook/ai`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle AI');
  }

  return response.json();
}

/**
 * Envia uma mensagem via Facebook
 * @param {Object} params - Parâmetros da mensagem
 * @param {string} params.recipientId - ID do destinatário (PSID)
 * @param {string} params.message - Texto da mensagem
 * @param {string} [params.mediaUrl] - URL da mídia (opcional)
 * @param {string} [params.mediaType] - Tipo de mídia: image, video, audio, file (opcional)
 * @returns {Promise<{success: boolean, message_id?: string, error?: string}>}
 */
export async function sendMessage({ recipientId, message, mediaUrl, mediaType }) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/facebook/messages/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipient_id: recipientId,
      message,
      media_url: mediaUrl,
      media_type: mediaType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Decodifica o token de páginas retornado pelo OAuth
 * @param {string} pagesToken - Token base64url com dados das páginas
 * @returns {Object} Dados das páginas { tenantId, pages }
 */
export function decodePagesToken(pagesToken) {
  try {
    const decoded = Buffer.from(pagesToken, 'base64url').toString();
    return JSON.parse(decoded);
  } catch {
    throw new Error('Invalid pages token');
  }
}

/**
 * Verifica se o status indica conexão ativa
 * @param {Object} status - Objeto de status
 * @returns {boolean}
 */
export function isConnected(status) {
  return status?.connected === true && status?.status === 'connected';
}

/**
 * Verifica se o token está expirando em breve
 * @param {Object} status - Objeto de status
 * @param {number} daysThreshold - Dias antes de considerar "expirando"
 * @returns {boolean}
 */
export function isTokenExpiringSoon(status, daysThreshold = 30) {
  if (!status?.token_expires_at) return false;

  const expiresAt = new Date(status.token_expires_at);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);

  return expiresAt <= threshold;
}

/**
 * Formata o tempo restante até expiração do token
 * @param {Object} status - Objeto de status
 * @returns {string} Tempo formatado ou vazio
 */
export function formatTokenExpiry(status) {
  if (!status?.token_expires_at) return '';

  const expiresAt = new Date(status.token_expires_at);
  const now = new Date();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) return 'Expirado';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 30) return `${days} dias`;
  if (days > 1) return `${days} dias`;
  if (days === 1) return '1 dia';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours > 1) return `${hours} horas`;
  if (hours === 1) return '1 hora';

  return 'Menos de 1 hora';
}

// Export default com todos os métodos
const facebookService = {
  startOAuth,
  connectPage,
  disconnectPage,
  getStatus,
  toggleAI,
  sendMessage,
  decodePagesToken,
  isConnected,
  isTokenExpiringSoon,
  formatTokenExpiry,
};

export default facebookService;
