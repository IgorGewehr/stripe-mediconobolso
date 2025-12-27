/**
 * AI Blocks Service - API Layer
 *
 * Serviço para gerenciar bloqueios de IA por conversa via doctor-server.
 * Substitui as funções de AI Block do Firebase.
 */

import apiService from './apiService';

class AiBlocksService {
  constructor() {
    this.endpoint = '/ai-blocks';
  }

  /**
   * Obtém status de bloqueio de uma conversa
   * @param {string} conversationId - ID da conversa (ex: WhatsApp JID)
   * @returns {Promise<{isBlocked: boolean, blockedAt: string|null, reason: string|null}>}
   */
  async getAIBlockStatus(conversationId) {
    try {
      const response = await apiService.get(`${this.endpoint}/status`, {
        conversation_id: conversationId,
      });

      return {
        isBlocked: response.is_blocked || false,
        blockedAt: response.blocked_at || null,
        blockReason: response.block_reason || null,
        conversationId: response.conversation_id,
      };
    } catch (error) {
      console.error('[AiBlocksService] Error getting block status:', error);
      return { isBlocked: false, blockedAt: null, blockReason: null };
    }
  }

  /**
   * Bloqueia IA para uma conversa
   * @param {string} conversationId - ID da conversa
   * @param {string} conversationType - Tipo: 'whatsapp', 'chat', 'agent'
   * @param {string} reason - Motivo do bloqueio (opcional)
   * @returns {Promise<Object>}
   */
  async blockAI(conversationId, conversationType = 'whatsapp', reason = null) {
    try {
      const response = await apiService.post(this.endpoint, {
        conversation_id: conversationId,
        conversation_type: conversationType,
        reason: reason,
      });

      console.log(`[AiBlocksService] AI blocked for conversation: ${conversationId}`);
      return {
        success: true,
        block: response,
      };
    } catch (error) {
      console.error('[AiBlocksService] Error blocking AI:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Desbloqueia IA para uma conversa
   * @param {string} conversationId - ID da conversa
   * @returns {Promise<Object>}
   */
  async unblockAI(conversationId) {
    try {
      const response = await apiService.delete(this.endpoint, {
        conversation_id: conversationId,
      });

      console.log(`[AiBlocksService] AI unblocked for conversation: ${conversationId}`);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error('[AiBlocksService] Error unblocking AI:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista todos os bloqueios do usuário
   * @returns {Promise<{blocks: Array, totalBlocked: number}>}
   */
  async listBlocks() {
    try {
      const response = await apiService.get(this.endpoint);

      return {
        blocks: response.blocks || [],
        totalBlocked: response.total_blocked || 0,
      };
    } catch (error) {
      console.error('[AiBlocksService] Error listing blocks:', error);
      return { blocks: [], totalBlocked: 0 };
    }
  }

  /**
   * Lista apenas bloqueios ativos
   * @returns {Promise<Array>}
   */
  async listActiveBlocks() {
    try {
      const response = await apiService.get(`${this.endpoint}/active`);
      return response.blocks || [];
    } catch (error) {
      console.error('[AiBlocksService] Error listing active blocks:', error);
      return [];
    }
  }

  /**
   * Verifica se uma conversa está bloqueada (retorna apenas boolean)
   * @param {string} conversationId - ID da conversa
   * @returns {Promise<boolean>}
   */
  async isBlocked(conversationId) {
    const status = await this.getAIBlockStatus(conversationId);
    return status.isBlocked;
  }
}

const aiBlocksService = new AiBlocksService();

export { aiBlocksService };
export default aiBlocksService;
