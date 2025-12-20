/**
 * Notification Settings Service
 *
 * Handles notification preferences for users (doctors and secretaries).
 * Each user can independently configure their notification preferences.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { BaseService } from './base.service';
import {
  createDefaultNotificationSettings,
  validateNotificationSettings
} from '../../models/NotificationSettings.model';

class NotificationSettingsService extends BaseService {
  /**
   * Get notification settings for a user
   * @param {string} userId - User ID
   * @param {string} doctorId - Doctor ID (for secretaries, this is the doctor they work for)
   * @returns {Promise<Object>} Notification settings
   */
  async getSettings(userId, doctorId) {
    try {
      const settingsRef = doc(
        this.firestore,
        'users',
        doctorId,
        'notificationSettings',
        userId
      );

      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      // Return default settings if none exist
      return createDefaultNotificationSettings(userId, doctorId, userId === doctorId ? 'doctor' : 'secretary');
    } catch (error) {
      console.error('[NotificationSettingsService] Error getting settings:', error);
      // Return defaults on error
      return createDefaultNotificationSettings(userId, doctorId, userId === doctorId ? 'doctor' : 'secretary');
    }
  }

  /**
   * Save notification settings for a user
   * @param {string} userId - User ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} settings - Settings to save
   * @returns {Promise<boolean>}
   */
  async saveSettings(userId, doctorId, settings) {
    try {
      if (!validateNotificationSettings({ ...settings, userId })) {
        throw new Error('Invalid notification settings');
      }

      const settingsRef = doc(
        this.firestore,
        'users',
        doctorId,
        'notificationSettings',
        userId
      );

      const dataToSave = {
        ...settings,
        userId,
        doctorId,
        updatedAt: new Date()
      };

      // Check if document exists
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        await updateDoc(settingsRef, dataToSave);
      } else {
        dataToSave.createdAt = new Date();
        await setDoc(settingsRef, dataToSave);
      }

      this.log('Notification settings saved for user:', userId);
      return true;
    } catch (error) {
      this.handleError(error, 'saveSettings');
    }
  }

  /**
   * Update specific notification channel settings
   * @param {string} userId - User ID
   * @param {string} doctorId - Doctor ID
   * @param {string} channel - Channel to update
   * @param {Object} channelSettings - New channel settings
   * @returns {Promise<boolean>}
   */
  async updateChannelSettings(userId, doctorId, channel, channelSettings) {
    try {
      const settingsRef = doc(
        this.firestore,
        'users',
        doctorId,
        'notificationSettings',
        userId
      );

      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        await updateDoc(settingsRef, {
          [`channels.${channel}`]: channelSettings,
          updatedAt: new Date()
        });
      } else {
        // Create with defaults and update channel
        const defaultSettings = createDefaultNotificationSettings(
          userId,
          doctorId,
          userId === doctorId ? 'doctor' : 'secretary'
        );
        defaultSettings.channels[channel] = channelSettings;
        await setDoc(settingsRef, defaultSettings);
      }

      return true;
    } catch (error) {
      this.handleError(error, 'updateChannelSettings');
    }
  }

  /**
   * Toggle global notifications enabled/disabled
   * @param {string} userId - User ID
   * @param {string} doctorId - Doctor ID
   * @param {boolean} enabled - Whether notifications are enabled
   * @returns {Promise<boolean>}
   */
  async toggleNotifications(userId, doctorId, enabled) {
    try {
      const settingsRef = doc(
        this.firestore,
        'users',
        doctorId,
        'notificationSettings',
        userId
      );

      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        await updateDoc(settingsRef, {
          enabled,
          updatedAt: new Date()
        });
      } else {
        const defaultSettings = createDefaultNotificationSettings(
          userId,
          doctorId,
          userId === doctorId ? 'doctor' : 'secretary'
        );
        defaultSettings.enabled = enabled;
        await setDoc(settingsRef, defaultSettings);
      }

      return true;
    } catch (error) {
      this.handleError(error, 'toggleNotifications');
    }
  }

  /**
   * Update quiet hours settings
   * @param {string} userId - User ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} quietHours - Quiet hours configuration
   * @returns {Promise<boolean>}
   */
  async updateQuietHours(userId, doctorId, quietHours) {
    try {
      const settingsRef = doc(
        this.firestore,
        'users',
        doctorId,
        'notificationSettings',
        userId
      );

      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        await updateDoc(settingsRef, {
          quietHours,
          updatedAt: new Date()
        });
      } else {
        const defaultSettings = createDefaultNotificationSettings(
          userId,
          doctorId,
          userId === doctorId ? 'doctor' : 'secretary'
        );
        defaultSettings.quietHours = quietHours;
        await setDoc(settingsRef, defaultSettings);
      }

      return true;
    } catch (error) {
      this.handleError(error, 'updateQuietHours');
    }
  }

  /**
   * Check if notifications should be sent based on quiet hours
   * @param {Object} settings - User's notification settings
   * @returns {boolean} Whether notifications should be sent
   */
  shouldSendNotification(settings) {
    if (!settings?.enabled) return false;

    const { quietHours } = settings;
    if (!quietHours?.enabled) return true;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { startTime, endTime } = quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      return currentTime < startTime && currentTime >= endTime;
    }

    // Same day quiet hours (e.g., 12:00 - 14:00)
    return currentTime < startTime || currentTime >= endTime;
  }

  /**
   * Check if a specific event notification is enabled
   * @param {Object} settings - User's notification settings
   * @param {string} channel - Notification channel
   * @param {string} eventType - Event type
   * @returns {boolean}
   */
  isEventEnabled(settings, channel, eventType) {
    if (!settings?.enabled) return false;
    if (!settings?.channels?.[channel]?.enabled) return false;
    return settings?.channels?.[channel]?.events?.[eventType] ?? false;
  }
}

export const notificationSettingsService = new NotificationSettingsService();
export default notificationSettingsService;
