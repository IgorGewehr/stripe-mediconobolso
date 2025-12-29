"use client";

/**
 * useNotificationSettings Hook
 *
 * Manages notification settings state for the current user.
 * Supports both doctors and secretaries with independent configuration.
 *
 * MIGRATED: Now uses backend PostgreSQL via API instead of Firebase.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import { notificationsService } from '@/lib/services/api/notifications.service';
import {
  NotificationChannel,
  NotificationEventType,
  createDefaultNotificationSettings
} from '@/lib/models/NotificationSettings.model';

export default function useNotificationSettings() {
  const { user, token, isSecretary, doctorData } = useAuth();

  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Determine the doctor ID (for secretaries, it's the doctor they work for)
  const getDoctorId = useCallback(() => {
    if (!user) return null;
    if (isSecretary && doctorData?.doctorId) {
      return doctorData.doctorId;
    }
    return user.uid;
  }, [user, isSecretary, doctorData]);

  /**
   * Transform backend settings to frontend format
   */
  const transformFromBackend = useCallback((backendSettings) => {
    if (!backendSettings) return null;

    // Backend format uses snake_case, frontend uses camelCase
    return {
      id: backendSettings.id,
      userId: backendSettings.user_id || user?.uid,
      doctorId: backendSettings.doctor_id || getDoctorId(),
      role: isSecretary ? 'secretary' : 'doctor',
      enabled: backendSettings.enabled ?? true,
      desktopEnabled: backendSettings.desktop_enabled ?? true,
      quietHours: {
        enabled: backendSettings.quiet_hours?.enabled ?? false,
        startTime: backendSettings.quiet_hours?.start_time || '22:00',
        endTime: backendSettings.quiet_hours?.end_time || '08:00',
      },
      channels: {
        [NotificationChannel.IN_APP]: backendSettings.channels?.in_app || {
          enabled: true,
          sound: true,
          categories: [],
        },
        [NotificationChannel.EMAIL]: backendSettings.channels?.email || {
          enabled: false,
          categories: [],
        },
        [NotificationChannel.PUSH]: backendSettings.channels?.push || {
          enabled: false,
          categories: [],
        },
        [NotificationChannel.WHATSAPP]: backendSettings.channels?.whatsapp || {
          enabled: true,
          categories: [],
        },
      },
      conversations: {
        showPreview: true,
        groupByPatient: true,
        autoMarkAsRead: false,
        desktopNotifications: backendSettings.desktop_enabled ?? true,
      },
      updatedAt: backendSettings.updated_at,
    };
  }, [user, getDoctorId, isSecretary]);

  /**
   * Transform frontend settings to backend format
   */
  const transformToBackend = useCallback((frontendSettings) => {
    if (!frontendSettings) return null;

    return {
      enabled: frontendSettings.enabled,
      desktop_enabled: frontendSettings.desktopEnabled ?? frontendSettings.conversations?.desktopNotifications,
      quiet_hours: {
        enabled: frontendSettings.quietHours?.enabled ?? false,
        start_time: frontendSettings.quietHours?.startTime || '22:00',
        end_time: frontendSettings.quietHours?.endTime || '08:00',
      },
      channels: {
        in_app: frontendSettings.channels?.[NotificationChannel.IN_APP],
        email: frontendSettings.channels?.[NotificationChannel.EMAIL],
        push: frontendSettings.channels?.[NotificationChannel.PUSH],
        whatsapp: frontendSettings.channels?.[NotificationChannel.WHATSAPP],
      },
    };
  }, []);

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const backendSettings = await notificationsService.getSettings();
      const transformed = transformFromBackend(backendSettings);
      setSettings(transformed);
    } catch (err) {
      console.error('[useNotificationSettings] Error loading settings:', err);
      setError('Erro ao carregar configurações de notificação');
      // Set defaults on error
      setSettings(createDefaultNotificationSettings(
        user?.uid,
        getDoctorId(),
        isSecretary ? 'secretary' : 'doctor'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [token, user, getDoctorId, isSecretary, transformFromBackend]);

  // Load on mount and when token changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save all settings
  const saveSettings = useCallback(async (newSettings) => {
    if (!token) return false;

    setIsSaving(true);
    setError(null);

    try {
      const backendSettings = transformToBackend(newSettings);
      await notificationsService.updateSettings(backendSettings);
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error saving settings:', err);
      setError('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [token, transformToBackend]);

  // Toggle global notifications
  const toggleNotifications = useCallback(async (enabled) => {
    if (!token) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationsService.updateSettings({ enabled });
      setSettings(prev => ({ ...prev, enabled }));
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error toggling notifications:', err);
      setError('Erro ao alterar configuração');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [token]);

  // Update channel settings
  const updateChannelSettings = useCallback(async (channel, channelSettings) => {
    if (!token) return false;

    setIsSaving(true);
    setError(null);

    try {
      // Map frontend channel name to backend channel name
      const channelMap = {
        [NotificationChannel.IN_APP]: 'in_app',
        [NotificationChannel.EMAIL]: 'email',
        [NotificationChannel.PUSH]: 'push',
        [NotificationChannel.WHATSAPP]: 'whatsapp',
        'in_app': 'in_app',
        'email': 'email',
        'push': 'push',
        'whatsapp': 'whatsapp',
      };

      const backendChannel = channelMap[channel] || channel;

      await notificationsService.updateChannelSettings(backendChannel, channelSettings);

      setSettings(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          [channel]: channelSettings
        }
      }));
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error updating channel:', err);
      setError('Erro ao atualizar canal');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [token]);

  // Toggle specific event
  const toggleEvent = useCallback(async (channel, eventType, enabled) => {
    if (!settings) return false;

    const currentChannelSettings = settings.channels[channel] || {};
    const channelSettings = {
      ...currentChannelSettings,
      events: {
        ...currentChannelSettings.events,
        [eventType]: enabled
      }
    };

    return updateChannelSettings(channel, channelSettings);
  }, [settings, updateChannelSettings]);

  // Toggle channel enabled
  const toggleChannel = useCallback(async (channel, enabled) => {
    if (!settings) return false;

    const currentChannelSettings = settings.channels[channel] || {};
    const channelSettings = {
      ...currentChannelSettings,
      enabled
    };

    return updateChannelSettings(channel, channelSettings);
  }, [settings, updateChannelSettings]);

  // Update quiet hours
  const updateQuietHours = useCallback(async (quietHours) => {
    if (!token) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationsService.updateQuietHours({
        enabled: quietHours.enabled,
        start_time: quietHours.startTime,
        end_time: quietHours.endTime,
      });
      setSettings(prev => ({ ...prev, quietHours }));
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error updating quiet hours:', err);
      setError('Erro ao atualizar horário silencioso');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [token]);

  // Check if event is enabled (local check)
  const isEventEnabled = useCallback((channel, eventType) => {
    if (!settings?.enabled) return false;
    if (!settings?.channels?.[channel]?.enabled) return false;
    return settings?.channels?.[channel]?.events?.[eventType] ?? false;
  }, [settings]);

  // Check if should send notification now (respecting quiet hours)
  const shouldNotify = useCallback(() => {
    if (!settings?.enabled) return false;

    const { quietHours } = settings;
    if (!quietHours?.enabled) return true;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const startTime = quietHours.startTime;
    const endTime = quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      return currentTime < startTime && currentTime >= endTime;
    }

    // Same day quiet hours (e.g., 12:00 - 14:00)
    return currentTime < startTime || currentTime >= endTime;
  }, [settings]);

  return {
    // State
    settings,
    isLoading,
    isSaving,
    error,

    // Actions
    loadSettings,
    saveSettings,
    toggleNotifications,
    updateChannelSettings,
    toggleEvent,
    toggleChannel,
    updateQuietHours,

    // Helpers
    isEventEnabled,
    shouldNotify,

    // Constants for convenience
    NotificationChannel,
    NotificationEventType
  };
}
