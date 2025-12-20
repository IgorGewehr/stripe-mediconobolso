"use client";

/**
 * useNotificationSettings Hook
 *
 * Manages notification settings state for the current user.
 * Supports both doctors and secretaries with independent configuration.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import { notificationSettingsService } from '@/lib/services/firebase';
import {
  NotificationChannel,
  NotificationEventType,
  createDefaultNotificationSettings
} from '@/lib/models/NotificationSettings.model';

export default function useNotificationSettings() {
  const { user, isSecretary, doctorData } = useAuth();

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

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user?.uid) return;

    const doctorId = getDoctorId();
    if (!doctorId) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedSettings = await notificationSettingsService.getSettings(
        user.uid,
        doctorId
      );
      setSettings(loadedSettings);
    } catch (err) {
      console.error('[useNotificationSettings] Error loading settings:', err);
      setError('Erro ao carregar configurações de notificação');
      // Set defaults on error
      setSettings(createDefaultNotificationSettings(
        user.uid,
        doctorId,
        isSecretary ? 'secretary' : 'doctor'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, getDoctorId, isSecretary]);

  // Load on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save all settings
  const saveSettings = useCallback(async (newSettings) => {
    if (!user?.uid) return false;

    const doctorId = getDoctorId();
    if (!doctorId) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationSettingsService.saveSettings(
        user.uid,
        doctorId,
        newSettings
      );
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error saving settings:', err);
      setError('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getDoctorId]);

  // Toggle global notifications
  const toggleNotifications = useCallback(async (enabled) => {
    if (!user?.uid) return false;

    const doctorId = getDoctorId();
    if (!doctorId) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationSettingsService.toggleNotifications(
        user.uid,
        doctorId,
        enabled
      );
      setSettings(prev => ({ ...prev, enabled }));
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error toggling notifications:', err);
      setError('Erro ao alterar configuração');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getDoctorId]);

  // Update channel settings
  const updateChannelSettings = useCallback(async (channel, channelSettings) => {
    if (!user?.uid) return false;

    const doctorId = getDoctorId();
    if (!doctorId) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationSettingsService.updateChannelSettings(
        user.uid,
        doctorId,
        channel,
        channelSettings
      );
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
  }, [user, getDoctorId]);

  // Toggle specific event
  const toggleEvent = useCallback(async (channel, eventType, enabled) => {
    if (!settings) return false;

    const channelSettings = {
      ...settings.channels[channel],
      events: {
        ...settings.channels[channel]?.events,
        [eventType]: enabled
      }
    };

    return updateChannelSettings(channel, channelSettings);
  }, [settings, updateChannelSettings]);

  // Toggle channel enabled
  const toggleChannel = useCallback(async (channel, enabled) => {
    if (!settings) return false;

    const channelSettings = {
      ...settings.channels[channel],
      enabled
    };

    return updateChannelSettings(channel, channelSettings);
  }, [settings, updateChannelSettings]);

  // Update quiet hours
  const updateQuietHours = useCallback(async (quietHours) => {
    if (!user?.uid) return false;

    const doctorId = getDoctorId();
    if (!doctorId) return false;

    setIsSaving(true);
    setError(null);

    try {
      await notificationSettingsService.updateQuietHours(
        user.uid,
        doctorId,
        quietHours
      );
      setSettings(prev => ({ ...prev, quietHours }));
      return true;
    } catch (err) {
      console.error('[useNotificationSettings] Error updating quiet hours:', err);
      setError('Erro ao atualizar horário silencioso');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getDoctorId]);

  // Check if event is enabled
  const isEventEnabled = useCallback((channel, eventType) => {
    if (!settings?.enabled) return false;
    return notificationSettingsService.isEventEnabled(settings, channel, eventType);
  }, [settings]);

  // Check if should send notification now (respecting quiet hours)
  const shouldNotify = useCallback(() => {
    if (!settings) return false;
    return notificationSettingsService.shouldSendNotification(settings);
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
