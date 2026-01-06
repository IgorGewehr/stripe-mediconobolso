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
      // Backend returns { conversations: [...], total: ... }
      const conversations = response.conversations || response.items || response || [];
      return this._normalizeConversations(conversations);
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
      // Backend returns { messages: [...], has_more: bool }
      const messages = response.messages || response.items || response || [];
      return this._normalizeMessages(messages);
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
   * Supports both whatsapp_conversations and unified_conversations formats
   */
  _normalizeConversations(conversations) {
    if (!Array.isArray(conversations)) return [];

    return conversations.map(conv => ({
      id: conv.id,
      // Support both whatsapp (contact_name) and unified (client_name) formats
      clientName: conv.client_name || conv.clientName || conv.contact_name || conv.contactName || conv.contact_push_name || 'Desconhecido',
      clientPhone: conv.client_phone || conv.clientPhone || conv.contact_phone || conv.contactPhone || conv.remote_jid?.replace('@s.whatsapp.net', '') || '',
      channel: conv.channel || 'whatsapp',
      status: conv.status || 'active',
      isRead: conv.is_read ?? conv.isRead ?? (conv.unread_count === 0),
      unreadCount: conv.unread_count || conv.unreadCount || 0,
      messageCount: conv.message_count || conv.messageCount || conv.total_messages || 0,
      // Support both formats for last message
      lastMessage: conv.last_message || conv.lastMessage || conv.last_message_content || conv.last_message_preview || '',
      lastMessageAt: conv.last_message_at || conv.lastMessageAt || new Date(),
      tags: conv.tags || [],
      createdAt: conv.created_at || conv.createdAt || new Date(),
      updatedAt: conv.updated_at || conv.updatedAt || new Date(),
      // Keep original data for reference
      remoteJid: conv.remote_jid || conv.remoteJid || null
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
   * Handles both backend and frontend message formats
   */
  _normalizeMessage(msg) {
    // Determine if message is from user (customer) based on direction field
    const isIncoming = msg.direction === 'incoming' || msg.direction === 'in';
    const isFromUser = msg.sender === 'user' || msg.is_from_user || msg.isFromUser || isIncoming;

    return {
      id: msg.id,
      content: msg.content || msg.text || '',
      // Map direction to sender type
      sender: isFromUser ? 'user' : 'doctor',
      senderName: msg.sender_name || msg.senderName || msg.from || '',
      timestamp: msg.timestamp || msg.created_at || new Date(),
      isFromUser: isFromUser,
      whatsappMessageId: msg.whatsapp_message_id || msg.whatsappMessageId || msg.message_id || msg.messageId || null,
      // Keep additional fields from backend
      messageType: msg.message_type || msg.messageType || 'text',
      mediaUrl: msg.media_url || msg.mediaUrl || null,
      caption: msg.caption || null
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
