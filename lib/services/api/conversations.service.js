/**
 * Conversations Service
 *
 * Service for managing WhatsApp conversations
 * Communicates with doctor-server conversations endpoints
 *
 * Note: Real-time updates are now handled via WebSocket.
 * The polling methods are kept for backward compatibility but no longer poll.
 */

import apiService from './apiService';

class ConversationsService {
  /**
   * List conversations for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.channel] - Filter by channel
   * @param {number} [options.limit] - Max results
   * @returns {Promise<Array>} List of conversations
   */
  async listConversations(doctorId, options = {}) {
    const params = new URLSearchParams();

    if (options.status) params.append('status', options.status);
    if (options.channel) params.append('channel', options.channel);
    if (options.limit) params.append('limit', options.limit.toString());

    try {
      const response = await apiService.get(`/conversations?${params.toString()}`);
      return this._normalizeConversations(response.items || response || []);
    } catch (error) {
      console.warn('[ConversationsService] Error listing conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array>} List of messages
   */
  async listMessages(doctorId, conversationId) {
    try {
      const response = await apiService.get(`/conversations/${conversationId}/messages`);
      return this._normalizeMessages(response.items || response || []);
    } catch (error) {
      console.warn('[ConversationsService] Error listing messages:', error);
      return [];
    }
  }

  /**
   * Mark conversation as read
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   */
  async markAsRead(doctorId, conversationId) {
    try {
      await apiService.post(`/conversations/${conversationId}/read`);
    } catch (error) {
      console.warn('[ConversationsService] Error marking as read:', error);
    }
  }

  /**
   * Mark conversation as unread
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   */
  async markAsUnread(doctorId, conversationId) {
    try {
      await apiService.post(`/conversations/${conversationId}/unread`);
    } catch (error) {
      console.warn('[ConversationsService] Error marking as unread:', error);
    }
  }

  /**
   * Update conversation status
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {string} status - New status
   */
  async updateStatus(doctorId, conversationId, status) {
    try {
      await apiService.patch(`/conversations/${conversationId}`, { status });
    } catch (error) {
      console.warn('[ConversationsService] Error updating status:', error);
    }
  }

  /**
   * Rename conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {string} newName - New name
   */
  async renameConversation(doctorId, conversationId, newName) {
    try {
      await apiService.patch(`/conversations/${conversationId}`, {
        client_name: newName
      });
    } catch (error) {
      console.warn('[ConversationsService] Error renaming conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   */
  async addMessage(doctorId, conversationId, messageData) {
    try {
      const response = await apiService.post(`/conversations/${conversationId}/messages`, {
        content: messageData.doctorMessage,
        sender: messageData.sender || 'doctor',
        sender_name: messageData.senderName || ''
      });
      return this._normalizeMessage(response);
    } catch (error) {
      console.warn('[ConversationsService] Error adding message:', error);
      throw error;
    }
  }

  /**
   * Normalize conversations from API format to frontend format
   */
  _normalizeConversations(conversations) {
    if (!Array.isArray(conversations)) return [];

    return conversations.map(conv => ({
      id: conv.id,
      clientName: conv.client_name || conv.clientName || 'Desconhecido',
      clientPhone: conv.client_phone || conv.clientPhone || '',
      channel: conv.channel || 'whatsapp',
      status: conv.status || 'active',
      isRead: conv.is_read ?? conv.isRead ?? true,
      unreadCount: conv.unread_count || conv.unreadCount || 0,
      messageCount: conv.message_count || conv.messageCount || 0,
      lastMessage: conv.last_message || conv.lastMessage || '',
      lastMessageAt: conv.last_message_at || conv.lastMessageAt || new Date(),
      tags: conv.tags || [],
      createdAt: conv.created_at || conv.createdAt || new Date(),
      updatedAt: conv.updated_at || conv.updatedAt || new Date()
    }));
  }

  /**
   * Normalize messages from API format to frontend format
   */
  _normalizeMessages(messages) {
    if (!Array.isArray(messages)) return [];

    return messages.map(msg => this._normalizeMessage(msg));
  }

  /**
   * Normalize a single message
   */
  _normalizeMessage(msg) {
    return {
      id: msg.id,
      content: msg.content || msg.text || '',
      sender: msg.sender || 'user',
      senderName: msg.sender_name || msg.senderName || '',
      timestamp: msg.timestamp || msg.created_at || new Date(),
      isFromUser: msg.sender === 'user' || msg.is_from_user || msg.isFromUser,
      whatsappMessageId: msg.whatsapp_message_id || msg.whatsappMessageId || null
    };
  }

  /**
   * @deprecated Use WebSocket for real-time updates instead
   * This method is kept for backward compatibility but does nothing
   */
  cleanup() {
    // No-op - WebSocket handles cleanup automatically
  }
}

export const conversationsService = new ConversationsService();
export default conversationsService;
