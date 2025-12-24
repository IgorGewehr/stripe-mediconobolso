/**
 * AI Conversations Service
 *
 * Service for managing AI conversation history
 * Communicates with doctor-server AI conversations endpoints
 */

import apiService from './apiService';

class AiConversationsService {
  /**
   * List conversations with pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.perPage=20] - Items per page
   * @param {string} [options.conversationType] - Filter by type (chat, analysis, transcription)
   * @returns {Promise<Object>} Paginated conversations
   */
  async listConversations(options = {}) {
    const { page = 1, perPage = 20, conversationType } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (conversationType) {
      params.append('conversation_type', conversationType);
    }

    const response = await apiService.get(`/ai/conversations?${params.toString()}`);
    return response;
  }

  /**
   * Get a specific conversation with messages
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation with messages
   */
  async getConversation(conversationId) {
    const response = await apiService.get(`/ai/conversations/${conversationId}`);
    return response;
  }

  /**
   * Create a new conversation
   * @param {Object} data - Conversation data
   * @param {string} [data.title] - Conversation title
   * @param {string} [data.conversationType] - Type (chat, analysis, transcription, summary)
   * @param {string} [data.contextType] - Context type (patient, appointment, etc)
   * @param {string} [data.contextId] - Related entity ID
   * @param {string} [data.initialMessage] - Initial message content
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(data) {
    const payload = {
      title: data.title,
      conversation_type: data.conversationType || 'chat',
      context_type: data.contextType,
      context_id: data.contextId,
      initial_message: data.initialMessage,
    };

    const response = await apiService.post('/ai/conversations', payload);
    return response;
  }

  /**
   * Update conversation title
   * @param {string} conversationId - Conversation ID
   * @param {string} title - New title
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversation(conversationId, title) {
    const response = await apiService.put(`/ai/conversations/${conversationId}`, { title });
    return response;
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<void>}
   */
  async deleteConversation(conversationId) {
    await apiService.delete(`/ai/conversations/${conversationId}`);
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   * @param {string} messageData.role - Message role (user, assistant, system)
   * @param {string} messageData.content - Message content
   * @param {number} [messageData.tokensUsed] - Tokens used
   * @param {string} [messageData.model] - AI model used
   * @param {string} [messageData.analysisType] - Type of analysis
   * @returns {Promise<Object>} Created message
   */
  async addMessage(conversationId, messageData) {
    const payload = {
      role: messageData.role,
      content: messageData.content,
      tokens_used: messageData.tokensUsed,
      model: messageData.model,
      analysis_type: messageData.analysisType,
    };

    const response = await apiService.post(`/ai/conversations/${conversationId}/messages`, payload);
    return response;
  }

  /**
   * Search conversations
   * @param {string} query - Search query
   * @param {number} [limit=20] - Max results
   * @returns {Promise<Array>} Matching conversations
   */
  async searchConversations(query, limit = 20) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await apiService.get(`/ai/conversations/search?${params.toString()}`);
    return response;
  }

  /**
   * Get conversation statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    const response = await apiService.get('/ai/conversations/stats');
    return response;
  }

  /**
   * Clean up old conversations
   * @param {number} [daysOld=30] - Delete conversations older than this
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupConversations(daysOld = 30) {
    const response = await apiService.post(`/ai/conversations/cleanup?days_old=${daysOld}`);
    return response;
  }

  // ============================================
  // AI Processing endpoints
  // ============================================

  /**
   * Process audio for transcription
   * @param {File|Blob} audioFile - Audio file
   * @param {Object} options - Processing options
   * @param {string} [options.analysisType] - Type of analysis (consultation, anamnese, dictation, symptoms)
   * @param {boolean} [options.transcriptionOnly] - Only transcribe, no analysis
   * @returns {Promise<Object>} Transcription result
   */
  async processAudio(audioFile, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const params = new URLSearchParams();
    if (options.analysisType) {
      params.append('analysis_type', options.analysisType);
    }
    if (options.transcriptionOnly) {
      params.append('transcription_only', 'true');
    }

    const response = await apiService.upload(`/ai/audio-processing?${params.toString()}`, formData);
    return response;
  }

  /**
   * Medical chat
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<Object>} AI response
   */
  async medicalChat(message, conversationHistory = []) {
    const response = await apiService.post('/ai/chat', {
      message,
      conversation_history: conversationHistory,
    });
    return response;
  }

  /**
   * Analyze exam results
   * @param {File|Blob|string} examData - PDF file or text
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeExam(examData) {
    if (typeof examData === 'string') {
      // Text input
      const formData = new FormData();
      formData.append('text', examData);
      const response = await apiService.upload('/ai/analyze-exam', formData);
      return response;
    } else {
      // File input
      const formData = new FormData();
      formData.append('file', examData);
      const response = await apiService.upload('/ai/analyze-exam', formData);
      return response;
    }
  }

  /**
   * Generate clinical summary
   * @param {string} patientData - Patient data to summarize
   * @returns {Promise<Object>} Clinical summary
   */
  async generateClinicalSummary(patientData) {
    const response = await apiService.post('/ai/clinical-summary', {
      patient_data: patientData,
    });
    return response;
  }

  /**
   * Get AI service status
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    const response = await apiService.get('/ai/status');
    return response;
  }
}

export const aiConversationsService = new AiConversationsService();
export default aiConversationsService;
