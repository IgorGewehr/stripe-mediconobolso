/**
 * API Service - Base para comunicação com o doctor-server
 *
 * Este serviço gerencia todas as chamadas HTTP para o backend Rust,
 * incluindo autenticação via Firebase tokens, retry com exponential backoff,
 * e tratamento específico de rate limiting (429).
 *
 * Logging detalhado para debugging em produção.
 */

import { auth } from '@/lib/config/firebase.config';
import { config } from './config';
import { apiLogger, generateRequestId, sanitizeData } from '@/lib/utils/logger';

// Configuração do servidor
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Token refresh threshold - 5 minutes before expiration
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Status codes que devem ser retried (includes 401 for token refresh)
const RETRYABLE_STATUS_CODES = config.retry?.retryStatusCodes || [401, 408, 429, 500, 502, 503, 504];

// Configuração de retry
const MAX_RETRIES = config.retry?.maxRetries || 3;
const BASE_RETRY_DELAY = config.retry?.retryDelay || 1000;

/**
 * Erro customizado para rate limiting
 */
class RateLimitError extends Error {
  constructor(retryAfter, message = 'Muitas requisições. Por favor, aguarde um momento.') {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
    this.retryAfter = retryAfter;
  }
}

/**
 * Classe base para o serviço de API
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    // Callbacks para notificar sobre rate limiting
    this.onRateLimitStart = null;
    this.onRateLimitEnd = null;
    this.onRetrying = null;
  }

  /**
   * Registra callbacks para eventos de rate limiting
   */
  setRateLimitCallbacks({ onStart, onEnd, onRetrying }) {
    this.onRateLimitStart = onStart;
    this.onRateLimitEnd = onEnd;
    this.onRetrying = onRetrying;
  }

  /**
   * Calcula o delay para retry com exponential backoff
   * @param {number} attempt - Número da tentativa (0-indexed)
   * @param {number} retryAfter - Valor do header Retry-After em segundos
   * @returns {number} Delay em milissegundos
   */
  calculateRetryDelay(attempt, retryAfter = null) {
    // Se o servidor especificou um Retry-After, respeitar
    if (retryAfter) {
      return retryAfter * 1000;
    }
    // Exponential backoff: 1s, 2s, 4s, 8s... com jitter
    const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, attempt);
    const jitter = Math.random() * 500; // Adiciona 0-500ms de jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 segundos
  }

  /**
   * Aguarda um determinado tempo
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se um status code deve ser retried
   */
  shouldRetry(status, attempt) {
    return RETRYABLE_STATUS_CODES.includes(status) && attempt < MAX_RETRIES;
  }

  /**
   * Verifica se o token está próximo de expirar
   * @param {string} token - JWT token
   * @returns {boolean}
   */
  isTokenExpiringSoon(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const timeUntilExpiry = expirationTime - Date.now();
      return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS;
    } catch {
      return true;
    }
  }

  /**
   * Obtém o token de autenticação do Firebase, forçando renovação se necessário
   * @param {boolean} forceRefresh - Força renovação do token
   */
  async getAuthToken(forceRefresh = false) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!forceRefresh) {
      try {
        const cachedToken = await user.getIdToken(false);
        if (!this.isTokenExpiringSoon(cachedToken)) {
          return cachedToken;
        }
        apiLogger.debug('Token expiring soon, refreshing...');
      } catch {
        // Force refresh on error
      }
    }

    apiLogger.debug('Refreshing Firebase token...');
    return user.getIdToken(true);
  }

  /**
   * Constrói os headers da requisição com autenticação
   */
  async buildHeaders(customHeaders = {}) {
    const token = await this.getAuthToken();
    return {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
      ...customHeaders,
    };
  }

  /**
   * Processa a resposta da API
   */
  async handleResponse(response, requestId = null) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Tratamento especial para 429
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        const error = new RateLimitError(retryAfter, errorData.message);
        error.data = errorData;
        error.requestId = requestId;
        throw error;
      }

      // Construir mensagem de erro detalhada
      console.log('🔴 [API Error] Status:', response.status, 'ErrorData:', errorData);
      const errorMessage = this.buildErrorMessage(response.status, errorData);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      error.requestId = requestId;

      // Log detalhado do erro
      apiLogger.error(`Response error: ${response.status}`, null, {
        requestId,
        status: response.status,
        errorMessage: errorData.message,
        errorDetails: errorData.details || errorData.error,
        validationErrors: errorData.validation_errors || errorData.errors,
      });

      throw error;
    }

    // Verifica se há conteúdo na resposta
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  /**
   * Constrói mensagem de erro amigável baseada no status e dados
   */
  buildErrorMessage(status, errorData) {
    // Se o backend enviou uma mensagem específica, usar ela
    if (errorData.message) {
      return errorData.message;
    }

    // Se há erros de validação, formatar
    if (errorData.validation_errors || errorData.errors) {
      const errors = errorData.validation_errors || errorData.errors;
      if (Array.isArray(errors)) {
        return `Erros de validação: ${errors.join(', ')}`;
      }
      if (typeof errors === 'object') {
        const messages = Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('; ');
        return `Erros de validação: ${messages}`;
      }
    }

    // Mensagens padrão por status
    const statusMessages = {
      400: 'Dados inválidos. Verifique os campos obrigatórios.',
      401: 'Sessão expirada. Faça login novamente.',
      403: 'Sem permissão para esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Conflito: este registro já existe.',
      422: 'Dados não puderam ser processados.',
      429: 'Muitas requisições. Aguarde um momento.',
      500: 'Erro interno do servidor.',
      502: 'Servidor temporariamente indisponível.',
      503: 'Serviço temporariamente indisponível.',
      504: 'Tempo de resposta esgotado.',
    };

    return statusMessages[status] || `Erro HTTP ${status}`;
  }

  /**
   * Executa uma requisição com retry automático e exponential backoff
   * @param {Function} requestFn - Função que executa a requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Resposta da API
   */
  async fetchWithRetry(requestFn, options = {}) {
    const { maxRetries = MAX_RETRIES, endpoint = '', method = 'GET', body = null } = options;
    const requestId = generateRequestId();
    const startTime = performance.now();
    let lastError;
    let isRateLimited = false;

    // Log de início da requisição
    apiLogger.info(`>>> ${method} ${endpoint}`, {
      requestId,
      hasBody: !!body,
    });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();

        // Se estava rate limited, notificar que terminou
        if (isRateLimited && this.onRateLimitEnd) {
          this.onRateLimitEnd();
        }

        const result = await this.handleResponse(response, requestId);

        // Log de sucesso
        const duration = Math.round(performance.now() - startTime);
        apiLogger.info(`<<< ${method} ${endpoint} [${duration}ms] OK`, {
          requestId,
          duration,
          attempt: attempt > 0 ? attempt + 1 : undefined,
        });

        return result;
      } catch (error) {
        lastError = error;
        lastError.requestId = requestId;

        // Se é um erro de rede (fetch falhou), tentar novamente
        const isNetworkError = error.name === 'TypeError' && error.message.includes('fetch');
        const statusToCheck = error.status || (isNetworkError ? 503 : 0);

        // Verificar se deve fazer retry
        if (this.shouldRetry(statusToCheck, attempt) || (isNetworkError && attempt < maxRetries)) {
          // Se é 401, forçar refresh do token antes do retry
          if (statusToCheck === 401 && attempt === 0) {
            apiLogger.warn('Token expired or invalid, refreshing and retrying...', { requestId });
            try {
              await this.getAuthToken(true); // Force refresh
            } catch (refreshError) {
              apiLogger.error('Failed to refresh token', refreshError, { requestId });
              throw error; // Token refresh failed, propagate original error
            }
          }

          // Se é 429, notificar sobre rate limiting
          if (statusToCheck === 429) {
            isRateLimited = true;
            if (this.onRateLimitStart) {
              this.onRateLimitStart();
            }
          }

          const retryAfter = error.retryAfter || null;
          // For 401, retry immediately after token refresh
          const delay = statusToCheck === 401 ? 100 : this.calculateRetryDelay(attempt, retryAfter);

          // Notificar sobre retry
          if (this.onRetrying) {
            this.onRetrying({
              attempt: attempt + 1,
              maxRetries,
              delay,
              endpoint,
              status: statusToCheck,
            });
          }

          // Log de retry
          apiLogger.warn(`Retry ${attempt + 1}/${maxRetries} para ${endpoint}`, {
            requestId,
            delay: Math.round(delay),
            status: statusToCheck,
            isNetworkError,
            tokenRefreshed: statusToCheck === 401,
          });

          await this.sleep(delay);
          continue;
        }

        // Não deve fazer retry, propagar erro
        break;
      }
    }

    // Se estava rate limited, notificar que terminou (mesmo com erro)
    if (isRateLimited && this.onRateLimitEnd) {
      this.onRateLimitEnd();
    }

    // Log final de falha
    const duration = Math.round(performance.now() - startTime);
    apiLogger.error(`<<< ${method} ${endpoint} [${duration}ms] FAILED`, lastError, {
      requestId,
      duration,
      status: lastError.status,
      retriesAttempted: maxRetries,
    });

    // Todos os retries falharam - criar mensagem amigável
    if (lastError.status === 429) {
      lastError.message = 'O servidor está temporariamente sobrecarregado. Por favor, aguarde alguns segundos e tente novamente.';
    } else if (lastError.status >= 500) {
      lastError.message = 'Erro no servidor. Nossa equipe foi notificada. Tente novamente em instantes.';
    } else if (lastError.name === 'TypeError') {
      lastError.message = 'Erro de conexão. Verifique sua internet e tente novamente.';
      lastError.status = 0;
    }

    throw lastError;
  }

  /**
   * GET request com retry automático
   */
  async get(endpoint, params = {}, customHeaders = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const headers = await this.buildHeaders(customHeaders);

    return this.fetchWithRetry(
      () => fetch(url.toString(), { method: 'GET', headers }),
      { endpoint, method: 'GET' }
    );
  }

  /**
   * POST request com retry automático
   */
  async post(endpoint, data = {}, customHeaders = {}) {
    // DEBUG: Log da requisição POST
    console.log('\n' + '='.repeat(60));
    console.log('[POST] ' + this.baseUrl + endpoint);
    console.log('Request Body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    const headers = await this.buildHeaders(customHeaders);

    const result = await this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint, method: 'POST', body: data }
    );

    // DEBUG: Log da resposta
    console.log('[POST Response] ' + endpoint);
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(60) + '\n');

    return result;
  }

  /**
   * PUT request com retry automático
   */
  async put(endpoint, data = {}, customHeaders = {}) {
    // DEBUG: Log da requisição PUT
    console.log('\n' + '='.repeat(60));
    console.log('[PUT] ' + this.baseUrl + endpoint);
    console.log('Request Body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    const headers = await this.buildHeaders(customHeaders);

    const result = await this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint, method: 'PUT', body: data }
    );

    // DEBUG: Log da resposta
    console.log('[PUT Response] ' + endpoint);
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(60) + '\n');

    return result;
  }

  /**
   * PATCH request com retry automático
   */
  async patch(endpoint, data = {}, customHeaders = {}) {
    // DEBUG: Log da requisição PATCH
    console.log('\n' + '='.repeat(60));
    console.log('[PATCH] ' + this.baseUrl + endpoint);
    console.log('Request Body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    const headers = await this.buildHeaders(customHeaders);

    const result = await this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint, method: 'PATCH', body: data }
    );

    // DEBUG: Log da resposta
    console.log('[PATCH Response] ' + endpoint);
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(60) + '\n');

    return result;
  }

  /**
   * DELETE request com retry automático
   */
  async delete(endpoint, customHeaders = {}) {
    // DEBUG: Log da requisição DELETE
    console.log('\n' + '='.repeat(60));
    console.log('[DELETE] ' + this.baseUrl + endpoint);
    console.log('='.repeat(60));

    const headers = await this.buildHeaders(customHeaders);

    const result = await this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      }),
      { endpoint, method: 'DELETE' }
    );

    // DEBUG: Log da resposta
    console.log('[DELETE Response] ' + endpoint);
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(60) + '\n');

    return result;
  }

  /**
   * Upload de arquivo (multipart/form-data) com retry automático
   */
  async upload(endpoint, file, additionalData = {}) {
    const token = await this.getAuthToken();

    return this.fetchWithRetry(
      () => {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        return fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      },
      { endpoint, method: "POST", maxRetries: 2 } // Menos retries para uploads grandes
    );
  }

  /**
   * Download de arquivo com retry automático
   */
  async download(endpoint) {
    const headers = await this.buildHeaders();
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const error = new Error(`Download failed: ${response.status}`);
          error.status = response.status;

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
            error.retryAfter = retryAfter;
          }

          throw error;
        }

        return response.blob();
      } catch (error) {
        lastError = error;

        if (this.shouldRetry(error.status, attempt)) {
          const delay = this.calculateRetryDelay(attempt, error.retryAfter);
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    throw lastError;
  }
}

// Instância singleton
const apiService = new ApiService();

export default apiService;
export { ApiService, API_BASE_URL, RateLimitError };
