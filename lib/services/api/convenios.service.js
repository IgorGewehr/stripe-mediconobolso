/**
 * @fileoverview Convenios API Service
 * @description Service for insurance/convenios management API calls
 */

import apiService from './apiService';
import { createCrudLogger } from '@/lib/utils/logger';

const API_BASE = '/convenios';
const logger = createCrudLogger('Convenio');

/**
 * List all convenios with pagination
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.perPage=20] - Items per page
 * @returns {Promise<{items: Array, total: number, page: number, perPage: number}>}
 */
export async function listConvenios(params = {}) {
  const requestId = logger.start('LIST');
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('per_page', params.perPage);

    const query = queryParams.toString();
    const url = query ? `${API_BASE}?${query}` : API_BASE;

    const response = await apiService.get(url);
    logger.success('LIST', requestId);
    return response;
  } catch (error) {
    logger.error('LIST', requestId, error);
    throw error;
  }
}

/**
 * Get convenio by ID
 * @param {string} id - Convenio ID
 * @returns {Promise<Object>} Convenio data
 */
export async function getConvenio(id) {
  const requestId = logger.start('GET', id);
  try {
    const response = await apiService.get(`${API_BASE}/${id}`);
    logger.success('GET', requestId, id);
    return response;
  } catch (error) {
    logger.error('GET', requestId, error, id);
    throw error;
  }
}

/**
 * Create new convenio
 * @param {Object} data - Convenio data
 * @param {string} data.nome - Nome do convenio
 * @param {string} data.codigoAns - Codigo ANS (6 digitos)
 * @param {string} data.cnpj - CNPJ (14 digitos)
 * @param {string} [data.telefone] - Telefone
 * @param {string} [data.email] - Email
 * @param {number} [data.prazoPagamentoDias=30] - Prazo de pagamento em dias
 * @param {boolean} [data.aceitaParticular=false] - Aceita pagamento particular
 * @returns {Promise<Object>} Created convenio
 */
export async function createConvenio(data) {
  const requestId = logger.start('CREATE');
  try {
    // Convert to snake_case for API
    const payload = {
      nome: data.nome,
      codigo_ans: data.codigoAns,
      cnpj: data.cnpj,
      telefone: data.telefone,
      email: data.email,
      prazo_pagamento_dias: data.prazoPagamentoDias || 30,
      aceita_particular: data.aceitaParticular || false,
    };

    const response = await apiService.post(API_BASE, payload);
    logger.success('CREATE', requestId);
    return response;
  } catch (error) {
    logger.error('CREATE', requestId, error);
    throw error;
  }
}

/**
 * Update existing convenio
 * @param {string} id - Convenio ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated convenio
 */
export async function updateConvenio(id, data) {
  const requestId = logger.start('UPDATE', id);
  try {
    // Convert to snake_case for API
    const payload = {};
    if (data.nome !== undefined) payload.nome = data.nome;
    if (data.codigoAns !== undefined) payload.codigo_ans = data.codigoAns;
    if (data.cnpj !== undefined) payload.cnpj = data.cnpj;
    if (data.telefone !== undefined) payload.telefone = data.telefone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.prazoPagamentoDias !== undefined) payload.prazo_pagamento_dias = data.prazoPagamentoDias;
    if (data.aceitaParticular !== undefined) payload.aceita_particular = data.aceitaParticular;
    if (data.ativo !== undefined) payload.ativo = data.ativo;

    const response = await apiService.put(`${API_BASE}/${id}`, payload);
    logger.success('UPDATE', requestId, id);
    return response;
  } catch (error) {
    logger.error('UPDATE', requestId, error, id);
    throw error;
  }
}

/**
 * Delete convenio (soft delete - sets ativo=false)
 * @param {string} id - Convenio ID
 * @returns {Promise<void>}
 */
export async function deleteConvenio(id) {
  const requestId = logger.start('DELETE', id);
  try {
    await apiService.delete(`${API_BASE}/${id}`);
    logger.success('DELETE', requestId, id);
  } catch (error) {
    logger.error('DELETE', requestId, error, id);
    throw error;
  }
}

const conveniosService = {
  list: listConvenios,
  get: getConvenio,
  create: createConvenio,
  update: updateConvenio,
  delete: deleteConvenio,
};

export default conveniosService;
