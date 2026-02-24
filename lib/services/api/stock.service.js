import apiService from './apiService';
import { createCrudLogger } from '@/lib/utils/logger';

const ENDPOINT = '/stock';
const logger = createCrudLogger('Estoque');

const emptyToNull = (val) => (val === '' || val === undefined ? null : val);

/**
 * Normalize backend camelCase response → frontend model
 * Backend sends: nomeItem, categoria, quantidadeAtual, tipoUltimaMovimentacao, observacoes, updatedAt
 */
function normalizeStock(item) {
  if (!item) return null;
  return {
    id: item.id,
    itemName: item.nomeItem,
    category: item.categoria,
    currentQuantity: item.quantidadeAtual,
    minimumQuantity: item.quantidadeMinima,
    unit: item.unidade,
    lastMovementType: item.tipoUltimaMovimentacao,
    notes: item.observacoes,
    active: item.ativo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

/**
 * Denormalize frontend model → backend snake_case request
 * Backend expects: nome_item, categoria, quantidade_atual, quantidade_minima, unidade, observacoes
 */
function denormalizeStock(data) {
  const payload = {};
  if (data.itemName !== undefined) payload.nome_item = emptyToNull(data.itemName);
  if (data.category !== undefined) payload.categoria = emptyToNull(data.category);
  if (data.currentQuantity !== undefined) payload.quantidade_atual = Number(data.currentQuantity);
  if (data.minimumQuantity !== undefined) payload.quantidade_minima = Number(data.minimumQuantity);
  if (data.unit !== undefined) payload.unidade = emptyToNull(data.unit);
  if (data.notes !== undefined) payload.observacoes = emptyToNull(data.notes);
  return payload;
}

const stockService = {

  async getAll(params = {}) {
    const { requestId, startTime } = logger.operationStart('GET_ALL', null, params);
    try {
      const response = await apiService.get(ENDPOINT, { params });

      const data = Array.isArray(response) ? response : (response.items || []);
      const result = data.map(normalizeStock);

      logger.operationSuccess(requestId, startTime, 'GET_ALL');

      return Array.isArray(response) ? result : { ...response, items: result };
    } catch (error) {
      logger.operationError(requestId, startTime, 'GET_ALL', error);
      throw error;
    }
  },

  async create(stockData) {
    const { requestId, startTime } = logger.operationStart('CREATE', null, stockData);
    try {
      const payload = denormalizeStock(stockData);
      const response = await apiService.post(ENDPOINT, payload);
      const result = normalizeStock(response);
      logger.operationSuccess(requestId, startTime, 'CREATE', result.id);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'CREATE', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  async getMovementHistory(itemId) {
    const { requestId, startTime } = logger.operationStart('GET_MOVEMENT_HISTORY', itemId);
    try {
      const response = await apiService.get(`${ENDPOINT}/${itemId}/movements`);
      logger.operationSuccess(requestId, startTime, 'GET_MOVEMENT_HISTORY', itemId);
      return response;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET_MOVEMENT_HISTORY', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  async addMovement(itemId, type, quantity, notes) {
    const { requestId, startTime } = logger.operationStart('ADD_MOVEMENT', itemId, { type, quantity });
    try {
      const payload = {
        tipo: type,
        quantidade: Number(quantity),
        observacoes: notes
      };
      const result = await apiService.post(`${ENDPOINT}/${itemId}/movements`, payload);
      logger.operationSuccess(requestId, startTime, 'ADD_MOVEMENT', itemId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'ADD_MOVEMENT', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  async update(itemId, stockData) {
    const { requestId, startTime } = logger.operationStart('UPDATE', itemId, stockData);
    try {
      const payload = denormalizeStock(stockData);
      const response = await apiService.put(`${ENDPOINT}/${itemId}`, payload);
      const result = normalizeStock(response);
      logger.operationSuccess(requestId, startTime, 'UPDATE', itemId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'UPDATE', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  async delete(itemId) {
    const { requestId, startTime } = logger.operationStart('DELETE', itemId);
    try {
      await apiService.delete(`${ENDPOINT}/${itemId}`);
      logger.operationSuccess(requestId, startTime, 'DELETE', itemId);
      return { success: true };
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'DELETE', error);
      error.userMessage = userMessage;
      throw error;
    }
  }
};

export default stockService;
