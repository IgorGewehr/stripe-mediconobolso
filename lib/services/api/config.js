/**
 * API Configuration
 *
 * Configurações para o novo backend (doctor-server)
 */

// Ambiente atual
const ENV = process.env.NODE_ENV || 'development';

// URLs base por ambiente
const API_URLS = {
  development: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  staging: process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.mediconobolso.com.br/api/v1',
  production: process.env.NEXT_PUBLIC_API_URL || 'https://api.mediconobolso.com.br/api/v1',
};

// Configuração de migração
// Quando true, usa o novo doctor-server. Quando false, usa Firebase (legado)
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true' || false;

// Configuração de timeout (em milissegundos)
const REQUEST_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);

// Configuração de retry
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.NEXT_PUBLIC_API_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000', 10),
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Configuração de cache
const CACHE_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_API_CACHE_ENABLED !== 'false',
  ttl: parseInt(process.env.NEXT_PUBLIC_API_CACHE_TTL || '300000', 10), // 5 minutos
};

// Exportar configurações
export const config = {
  // URL base da API
  apiUrl: API_URLS[ENV] || API_URLS.development,

  // Flag para usar a nova API
  useNewApi: USE_NEW_API,

  // Timeout de requisições
  timeout: REQUEST_TIMEOUT,

  // Configuração de retry
  retry: RETRY_CONFIG,

  // Configuração de cache
  cache: CACHE_CONFIG,

  // Ambiente atual
  env: ENV,

  // Flag de debug
  debug: ENV === 'development',
};

export default config;
