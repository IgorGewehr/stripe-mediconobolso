/**
 * Notifications Service - Backend API
 *
 * Handles notifications via the doctor-server backend:
 * - In-app notifications
 * - Notification settings
 * - Push subscriptions
 * - WebSocket real-time updates
 */

import apiService from './apiService';

class NotificationsService {
  constructor() {
    this.basePath = '/notifications';
  }

  // ==========================================================================
  // In-App Notifications
  // ==========================================================================

  /**
   * Get paginated list of in-app notifications
   * @param {Object} params - Query parameters
   * @param {string} [params.category] - Filter by category
   * @param {string} [params.priority] - Filter by priority
   * @param {boolean} [params.is_read] - Filter by read status
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @returns {Promise<Object>} Paginated notifications
   */
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.is_read !== undefined) queryParams.append('is_read', params.is_read);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    const url = `${this.basePath}/in-app${query ? `?${query}` : ''}`;

    return apiService.get(url);
  }

  /**
   * Get unread notifications count
   * @returns {Promise<{count: number}>}
   */
  async getUnreadCount() {
    return apiService.get(`${this.basePath}/in-app/unread-count`);
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    return apiService.post(`${this.basePath}/in-app/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>}
   */
  async markAllAsRead() {
    return apiService.post(`${this.basePath}/in-app/read-all`);
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    return apiService.delete(`${this.basePath}/in-app/${notificationId}`);
  }

  // ==========================================================================
  // User Notification Settings
  // ==========================================================================

  /**
   * Get user notification settings
   * @returns {Promise<Object>} User settings
   */
  async getSettings() {
    return apiService.get(`${this.basePath}/settings`);
  }

  /**
   * Update user notification settings
   * @param {Object} settings - Settings to update
   * @param {boolean} [settings.enabled] - Global notifications enabled
   * @param {boolean} [settings.desktop_enabled] - Desktop notifications enabled
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    return apiService.put(`${this.basePath}/settings`, settings);
  }

  /**
   * Update quiet hours settings
   * @param {Object} quietHours - Quiet hours config
   * @param {boolean} quietHours.enabled - Quiet hours enabled
   * @param {string} quietHours.start_time - Start time (HH:MM)
   * @param {string} quietHours.end_time - End time (HH:MM)
   * @returns {Promise<Object>} Updated settings
   */
  async updateQuietHours(quietHours) {
    return apiService.put(`${this.basePath}/settings/quiet-hours`, quietHours);
  }

  /**
   * Update channel settings
   * @param {string} channel - Channel name (in_app, email, push)
   * @param {Object} channelSettings - Channel configuration
   * @param {boolean} [channelSettings.enabled] - Channel enabled
   * @param {boolean} [channelSettings.sound] - Sound enabled
   * @param {string[]} [channelSettings.categories] - Enabled categories
   * @returns {Promise<Object>} Updated settings
   */
  async updateChannelSettings(channel, channelSettings) {
    return apiService.put(`${this.basePath}/settings/channels/${channel}`, channelSettings);
  }

  // ==========================================================================
  // Push Subscriptions
  // ==========================================================================

  /**
   * Get VAPID public key for push subscriptions
   * @returns {Promise<{public_key: string}>}
   */
  async getVapidKey() {
    return apiService.get(`${this.basePath}/push/vapid-key`);
  }

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription data
   * @param {string} subscription.endpoint - Push endpoint URL
   * @param {string} subscription.p256dh_key - P256DH key
   * @param {string} subscription.auth_key - Auth key
   * @param {string} [subscription.device_name] - Device name
   * @returns {Promise<Object>} Created subscription
   */
  async subscribePush(subscription) {
    return apiService.post(`${this.basePath}/push/subscribe`, subscription);
  }

  /**
   * Unsubscribe from push notifications
   * @param {string} endpoint - Push endpoint to remove
   * @returns {Promise<void>}
   */
  async unsubscribePush(endpoint) {
    return apiService.delete(`${this.basePath}/push/unsubscribe`, { endpoint });
  }

  /**
   * Get user's push subscriptions
   * @returns {Promise<Object[]>} List of subscriptions
   */
  async getPushSubscriptions() {
    return apiService.get(`${this.basePath}/push/subscriptions`);
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
