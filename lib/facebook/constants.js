/**
 * Constantes para integração com Facebook Messenger
 */

// Versão da Graph API
export const GRAPH_API_VERSION = 'v21.0';

// URL base da Graph API
export const GRAPH_API_BASE_URL = 'https://graph.facebook.com';

// URL base do OAuth
export const FACEBOOK_OAUTH_BASE_URL = 'https://www.facebook.com';

// Escopos necessários para a integração
export const FACEBOOK_OAUTH_SCOPES = [
  'pages_show_list',        // Listar páginas do usuário
  'pages_messaging',        // Enviar/receber mensagens
  'pages_manage_metadata',  // Gerenciar webhooks
];

// Campos para inscrição no webhook
export const WEBHOOK_SUBSCRIPTION_FIELDS = [
  'messages',               // Mensagens recebidas
  'messaging_postbacks',    // Cliques em botões
  'messaging_optins',       // Opt-ins
  'message_deliveries',     // Confirmações de entrega
  'message_reads',          // Confirmações de leitura
];

// Configuração de tokens
export const TOKEN_REFRESH_THRESHOLD_DAYS = 30;
export const LONG_LIVED_TOKEN_DURATION_DAYS = 60;

// Configuração de rate limiting
export const RATE_LIMIT_CONFIG = {
  windowMs: 60000,   // 1 minuto
  maxRequests: 30,   // Máximo de requisições por janela
};

// Configuração de retry para webhook
export const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

// Configuração de cache
export const CACHE_CONFIG = {
  tenantLookupTtlMs: 5 * 60 * 1000,  // 5 minutos
  userProfileTtlMs: 24 * 60 * 60 * 1000, // 24 horas
};

// Status de conexão
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  TOKEN_EXPIRED: 'token_expired',
  ERROR: 'error',
};

// Tipos de mensagem
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
  SHARE: 'share',
  QUICK_REPLY: 'quick_reply',
  POSTBACK: 'postback',
};

/**
 * Constrói URL de autorização OAuth
 * @param {string} appId - ID do app Facebook
 * @param {string} redirectUri - URL de callback
 * @param {string} state - Token de estado para CSRF
 * @returns {string} URL completa de autorização
 */
export function buildOAuthUrl(appId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: FACEBOOK_OAUTH_SCOPES.join(','),
    response_type: 'code',
  });

  return `${FACEBOOK_OAUTH_BASE_URL}/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Constrói URL da Graph API
 * @param {string} path - Caminho da API
 * @returns {string} URL completa
 */
export function buildGraphApiUrl(path) {
  return `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}${path}`;
}
