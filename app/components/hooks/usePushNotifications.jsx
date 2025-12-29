"use client";

/**
 * usePushNotifications Hook
 *
 * Manages Web Push notification permission and subscription.
 * Features:
 * - Permission request flow
 * - Service worker registration
 * - Push subscription management
 * - VAPID key handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import { notificationsService } from '@/lib/services/api/notifications.service';

// Permission states
export const PushPermission = {
  DEFAULT: 'default',
  GRANTED: 'granted',
  DENIED: 'denied',
  NOT_SUPPORTED: 'not_supported',
};

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Get device name from user agent
 */
function getDeviceName() {
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'iOS Device';
  } else if (/Android/.test(ua)) {
    return 'Android Device';
  } else if (/Windows/.test(ua)) {
    return 'Windows Browser';
  } else if (/Mac/.test(ua)) {
    return 'Mac Browser';
  } else if (/Linux/.test(ua)) {
    return 'Linux Browser';
  }

  return 'Unknown Device';
}

export default function usePushNotifications() {
  const { token, user } = useAuth();

  // State
  const [permission, setPermission] = useState(PushPermission.DEFAULT);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  /**
   * Check if push notifications are supported
   */
  const checkSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setPermission(PushPermission.NOT_SUPPORTED);
    }

    return supported;
  }, []);

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(() => {
    if (!isSupported) return PushPermission.NOT_SUPPORTED;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    return currentPermission;
  }, [isSupported]);

  /**
   * Get current push subscription
   */
  const getSubscription = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
      return sub;
    } catch (err) {
      console.error('[usePushNotifications] Error getting subscription:', err);
      return null;
    }
  }, [isSupported]);

  /**
   * Load user's push subscriptions from server
   */
  const loadSubscriptions = useCallback(async () => {
    if (!token) return;

    try {
      const response = await notificationsService.getPushSubscriptions();
      setSubscriptions(response.subscriptions || response || []);
    } catch (err) {
      console.error('[usePushNotifications] Error loading subscriptions:', err);
    }
  }, [token]);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[usePushNotifications] Service Worker registered:', registration.scope);
      return registration;
    } catch (err) {
      console.error('[usePushNotifications] Service Worker registration failed:', err);
      setError('Erro ao registrar Service Worker');
      return null;
    }
  }, [isSupported]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Notificações push não são suportadas neste navegador');
      return PushPermission.NOT_SUPPORTED;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Auto-subscribe after permission granted
        await subscribeToPush();
      }

      return result;
    } catch (err) {
      console.error('[usePushNotifications] Error requesting permission:', err);
      setError('Erro ao solicitar permissão');
      return PushPermission.DENIED;
    }
  }, [isSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Subscribe to push notifications
   */
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || !token) {
      console.log('[usePushNotifications] Cannot subscribe - not supported or no token');
      return false;
    }

    if (permission !== PushPermission.GRANTED) {
      console.log('[usePushNotifications] Cannot subscribe - permission not granted');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure service worker is registered
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const vapidResponse = await notificationsService.getVapidKey();
      const vapidPublicKey = vapidResponse.public_key;

      if (!vapidPublicKey) {
        throw new Error('VAPID key not available');
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Extract keys from subscription
      const subJson = sub.toJSON();
      const p256dhKey = subJson.keys?.p256dh || '';
      const authKey = subJson.keys?.auth || '';

      // Send subscription to server
      await notificationsService.subscribePush({
        endpoint: sub.endpoint,
        p256dh_key: p256dhKey,
        auth_key: authKey,
        device_name: getDeviceName(),
      });

      setSubscription(sub);
      setIsSubscribed(true);

      console.log('[usePushNotifications] Subscribed to push notifications');
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Error subscribing:', err);
      setError('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, token, permission]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) {
      console.log('[usePushNotifications] No subscription to unsubscribe');
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe locally
      await subscription.unsubscribe();

      // Remove from server
      await notificationsService.unsubscribePush(subscription.endpoint);

      setSubscription(null);
      setIsSubscribed(false);

      console.log('[usePushNotifications] Unsubscribed from push notifications');
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Error unsubscribing:', err);
      setError('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  /**
   * Toggle push notifications
   */
  const togglePush = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribeFromPush();
    } else {
      if (permission !== PushPermission.GRANTED) {
        await requestPermission();
      }
      return subscribeToPush();
    }
  }, [isSubscribed, permission, requestPermission, subscribeToPush, unsubscribeFromPush]);

  /**
   * Send test notification (for debugging)
   */
  const sendTestNotification = useCallback(async () => {
    if (!isSupported || permission !== PushPermission.GRANTED) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Teste de Notificacao', {
        body: 'Esta e uma notificacao de teste do Medico no Bolso',
        icon: '/logo.png',
        badge: '/ico.svg',
        tag: 'test-notification',
        requireInteraction: false,
      });
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Error sending test notification:', err);
      return false;
    }
  }, [isSupported, permission]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // Check support
      const supported = checkSupport();
      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Check permission
      checkPermission();

      // Register service worker
      await registerServiceWorker();

      // Get current subscription
      await getSubscription();

      // Load subscriptions from server
      if (token) {
        await loadSubscriptions();
      }

      setIsLoading(false);
    };

    init();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh subscription when permission changes
  useEffect(() => {
    if (permission === PushPermission.GRANTED) {
      getSubscription();
    } else if (permission === PushPermission.DENIED) {
      setIsSubscribed(false);
      setSubscription(null);
    }
  }, [permission, getSubscription]);

  return {
    // State
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscription,
    subscriptions,

    // Computed
    canSubscribe: isSupported && permission !== PushPermission.DENIED,
    shouldShowPermissionBanner:
      isSupported &&
      permission === PushPermission.DEFAULT &&
      !isSubscribed,

    // Actions
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    togglePush,
    loadSubscriptions,
    sendTestNotification,

    // Constants
    PushPermission,
  };
}

// Export named for convenience
export { usePushNotifications };
