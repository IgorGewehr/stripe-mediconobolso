/**
 * API Service - Base para comunicação com o doctor-server
 *
 * Este serviço gerencia todas as chamadas HTTP para o backend Rust,
 * incluindo autenticação via Firebase tokens, retry com exponential backoff,
 * e tratamento específico de rate limiting (429).
 */

import { auth } from '@/lib/config/firebase.config';
import { config } from './config';

// Configuração do servidor
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Status codes que devem ser retried
const RETRYABLE_STATUS_CODES = config.retry?.retryStatusCodes || [408, 429, 500, 502, 503, 504];

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
   * Obtém o token de autenticação do Firebase
   */
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return user.getIdToken();
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
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Tratamento especial para 429
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        const error = new RateLimitError(retryAfter, errorData.message);
        error.data = errorData;
        throw error;
      }

      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = errorData;
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
   * Executa uma requisição com retry automático e exponential backoff
   * @param {Function} requestFn - Função que executa a requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Resposta da API
   */
  async fetchWithRetry(requestFn, options = {}) {
    const { maxRetries = MAX_RETRIES, endpoint = '' } = options;
    let lastError;
    let isRateLimited = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();

        // Se estava rate limited, notificar que terminou
        if (isRateLimited && this.onRateLimitEnd) {
          this.onRateLimitEnd();
        }

        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;

        // Se é um erro de rede (fetch falhou), tentar novamente
        const isNetworkError = error.name === 'TypeError' && error.message.includes('fetch');
        const statusToCheck = error.status || (isNetworkError ? 503 : 0);

        // Verificar se deve fazer retry
        if (this.shouldRetry(statusToCheck, attempt) || (isNetworkError && attempt < maxRetries)) {
          // Se é 429, notificar sobre rate limiting
          if (statusToCheck === 429) {
            isRateLimited = true;
            if (this.onRateLimitStart) {
              this.onRateLimitStart();
            }
          }

          const retryAfter = error.retryAfter || null;
          const delay = this.calculateRetryDelay(attempt, retryAfter);

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

          if (config.debug) {
            console.log(
              `[API] Retry ${attempt + 1}/${maxRetries} para ${endpoint} ` +
              `após ${Math.round(delay)}ms (status: ${statusToCheck})`
            );
          }

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
      { endpoint }
    );
  }

  /**
   * POST request com retry automático
   */
  async post(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);

    return this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint }
    );
  }

  /**
   * PUT request com retry automático
   */
  async put(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);

    return this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint }
    );
  }

  /**
   * PATCH request com retry automático
   */
  async patch(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);

    return this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }),
      { endpoint }
    );
  }

  /**
   * DELETE request com retry automático
   */
  async delete(endpoint, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);

    return this.fetchWithRetry(
      () => fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      }),
      { endpoint }
    );
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
      { endpoint, maxRetries: 2 } // Menos retries para uploads grandes
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
