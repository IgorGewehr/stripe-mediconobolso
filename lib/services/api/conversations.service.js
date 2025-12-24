/**
 * Conversations Service
 *
 * Service for managing WhatsApp conversations
 * Communicates with doctor-server conversations endpoints
 *
 * Note: This service is prepared for when the doctor-server
 * implements the /conversations endpoints. For now, it provides
 * a polling-based alternative to Firebase real-time.
 */

import apiService from './apiService';

class ConversationsService {
  constructor() {
    this.pollingIntervals = new Map();
    this.listeners = new Map();
  }

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
   * Subscribe to conversations (polling-based)
   * @param {string} doctorId - Doctor ID
   * @param {Function} callback - Callback function
   * @param {number} limit - Max results
   * @returns {Function} Unsubscribe function
   */
  subscribeToConversations(doctorId, callback, limit = 50) {
    const key = `conversations-${doctorId}`;

    // Clear existing interval if any
    if (this.pollingIntervals.has(key)) {
      clearInterval(this.pollingIntervals.get(key));
    }

    // Initial load
    this.listConversations(doctorId, { limit }).then(callback);

    // Start polling (every 10 seconds)
    const interval = setInterval(async () => {
      try {
        const conversations = await this.listConversations(doctorId, { limit });
        callback(conversations);
      } catch (error) {
        console.warn('[ConversationsService] Polling error:', error);
      }
    }, 10000);

    this.pollingIntervals.set(key, interval);

    // Return unsubscribe function
    return () => {
      if (this.pollingIntervals.has(key)) {
        clearInterval(this.pollingIntervals.get(key));
        this.pollingIntervals.delete(key);
      }
    };
  }

  /**
   * Subscribe to messages (polling-based)
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToMessages(doctorId, conversationId, callback) {
    const key = `messages-${doctorId}-${conversationId}`;

    // Clear existing interval if any
    if (this.pollingIntervals.has(key)) {
      clearInterval(this.pollingIntervals.get(key));
    }

    // Initial load
    this.listMessages(doctorId, conversationId).then(callback);

    // Start polling (every 5 seconds for messages)
    const interval = setInterval(async () => {
      try {
        const messages = await this.listMessages(doctorId, conversationId);
        callback(messages);
      } catch (error) {
        console.warn('[ConversationsService] Message polling error:', error);
      }
    }, 5000);

    this.pollingIntervals.set(key, interval);

    // Return unsubscribe function
    return () => {
      if (this.pollingIntervals.has(key)) {
        clearInterval(this.pollingIntervals.get(key));
        this.pollingIntervals.delete(key);
      }
    };
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
   * Cleanup all polling intervals
   */
  cleanup() {
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
  }
}

export const conversationsService = new ConversationsService();
export default conversationsService;
