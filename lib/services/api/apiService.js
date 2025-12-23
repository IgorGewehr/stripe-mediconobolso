/**
 * API Service - Base para comunicação com o doctor-server
 *
 * Este serviço gerencia todas as chamadas HTTP para o backend Rust,
 * incluindo autenticação via Firebase tokens.
 */

import { auth } from '@/lib/config/firebase.config';

// Configuração do servidor
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Classe base para o serviço de API
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
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
   * GET request
   */
  async get(endpoint, params = {}, customHeaders = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const headers = await this.buildHeaders(customHeaders);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    return this.handleResponse(response);
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, customHeaders = {}) {
    const headers = await this.buildHeaders(customHeaders);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse(response);
  }

  /**
   * Upload de arquivo (multipart/form-data)
   */
  async upload(endpoint, file, additionalData = {}) {
    const token = await this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return this.handleResponse(response);
  }

  /**
   * Download de arquivo
   */
  async download(endpoint) {
    const headers = await this.buildHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }
}

// Instância singleton
const apiService = new ApiService();

export default apiService;
export { ApiService, API_BASE_URL };
