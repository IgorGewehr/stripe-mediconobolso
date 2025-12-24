/**
 * WhatsApp Service
 *
 * Service for WhatsApp session management and messaging
 * Communicates with doctor-server WhatsApp endpoints
 */

import apiService from './apiService';

class WhatsAppService {
  /**
   * Start a new WhatsApp session
   * @param {string} tenantId - Tenant ID (doctor ID)
   * @returns {Promise<Object>} Session data with QR code
   */
  async startSession(tenantId) {
    const response = await apiService.post(`/whatsapp/sessions/${tenantId}/start`);
    return response;
  }

  /**
   * Get session status
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Session status
   */
  async getStatus(tenantId) {
    const response = await apiService.get(`/whatsapp/sessions/${tenantId}/status`);
    return response;
  }

  /**
   * Get QR code for session
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} QR code data
   */
  async getQrCode(tenantId) {
    const response = await apiService.get(`/whatsapp/sessions/${tenantId}/qr`);
    return response;
  }

  /**
   * Disconnect session
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Success response
   */
  async disconnect(tenantId) {
    const response = await apiService.delete(`/whatsapp/sessions/${tenantId}`);
    return response;
  }

  /**
   * Restart session
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} New session data
   */
  async restartSession(tenantId) {
    const response = await apiService.post(`/whatsapp/sessions/${tenantId}/restart`);
    return response;
  }

  /**
   * List all active sessions
   * @returns {Promise<Object>} List of active sessions
   */
  async listActiveSessions() {
    const response = await apiService.get('/whatsapp/sessions/active');
    return response;
  }

  /**
   * Poll for status changes (long polling)
   * @param {string} tenantId - Tenant ID
   * @param {number} timeout - Timeout in ms (max 60000)
   * @returns {Promise<Object>} Updated status
   */
  async pollStatus(tenantId, timeout = 30000) {
    const response = await apiService.get(`/whatsapp/sessions/${tenantId}/poll?timeout=${timeout}`);
    return response;
  }

  /**
   * Send a message
   * @param {string} tenantId - Tenant ID
   * @param {Object} messageData - Message data
   * @param {string} messageData.to - Recipient phone number
   * @param {string} messageData.text - Message text
   * @param {string} [messageData.type] - Message type (text, image, document)
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(tenantId, messageData) {
    const response = await apiService.post(`/whatsapp/messages/${tenantId}/send`, messageData);
    return response;
  }

  /**
   * Send bulk messages
   * @param {string} tenantId - Tenant ID
   * @param {Object} bulkData - Bulk message data
   * @param {Array<string>} bulkData.recipients - List of phone numbers
   * @param {string} bulkData.message - Message to send
   * @param {number} [bulkData.delay_ms] - Delay between messages
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulk(tenantId, bulkData) {
    const response = await apiService.post(`/whatsapp/messages/${tenantId}/send-bulk`, bulkData);
    return response;
  }

  /**
   * Check if phone number exists on WhatsApp
   * @param {string} tenantId - Tenant ID
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object>} Check result
   */
  async checkNumber(tenantId, phoneNumber) {
    const response = await apiService.get(`/whatsapp/messages/${tenantId}/check-number/${phoneNumber}`);
    return response;
  }

  /**
   * Register webhook for tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} webhookData - Webhook configuration
   * @param {string} webhookData.url - Webhook URL
   * @param {string} [webhookData.secret] - Webhook secret
   * @param {Array<string>} [webhookData.events] - Events to listen for
   * @returns {Promise<Object>} Registration result
   */
  async registerWebhook(tenantId, webhookData) {
    const response = await apiService.post(`/whatsapp/webhooks/${tenantId}`, webhookData);
    return response;
  }

  /**
   * Remove webhook from tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Removal result
   */
  async removeWebhook(tenantId) {
    const response = await apiService.delete(`/whatsapp/webhooks/${tenantId}`);
    return response;
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
