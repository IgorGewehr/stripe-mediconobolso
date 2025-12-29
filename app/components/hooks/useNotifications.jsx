"use client";

/**
 * useNotifications Hook
 *
 * Manages real-time notifications via WebSocket connection to the backend.
 * Features:
 * - WebSocket connection with auto-reconnect
 * - In-app notification state management
 * - Unread count tracking
 * - Mark as read functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
import { notificationsService } from '@/lib/services/api/notifications.service';

// WebSocket connection states
const WS_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

// Reconnection config
const RECONNECT_DELAY_BASE = 1000; // 1 second
const RECONNECT_DELAY_MAX = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Get WebSocket URL from environment
 */
function getWebSocketUrl(token) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  // Convert http(s) to ws(s)
  const wsUrl = baseUrl.replace(/^http/, 'ws').replace('/api/v1', '');
  return `${wsUrl}/api/v1/ws?token=${encodeURIComponent(token)}`;
}

export default function useNotifications(options = {}) {
  const { enabled = true, autoConnect = true } = options;
  const { user, token, isSecretary } = useAuth();

  // State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');

  // Refs for WebSocket management
  const wsRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isManualDisconnect = useRef(false);

  /**
   * Load initial notifications from API
   */
  const loadNotifications = useCallback(async (params = {}) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationsService.getNotifications(params);
      setNotifications(response.notifications || response.data || []);

      // Also get unread count
      const countResponse = await notificationsService.getUnreadCount();
      setUnreadCount(countResponse.count || 0);
    } catch (err) {
      console.error('[useNotifications] Error loading notifications:', err);
      setError('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Send heartbeat to keep connection alive
   */
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WS_STATE.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  /**
   * Start heartbeat interval
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }, [sendHeartbeat]);

  /**
   * Stop heartbeat interval
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Calculate reconnect delay with exponential backoff
   */
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttemptRef.current),
      RECONNECT_DELAY_MAX
    );
    return delay;
  }, []);

  /**
   * Handle incoming WebSocket message
   */
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'notification':
          // Add new notification to the list
          setNotifications(prev => [data.payload, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Dispatch custom event for other components
          window.dispatchEvent(
            new CustomEvent('notification:received', { detail: data.payload })
          );
          break;

        case 'pong':
          // Heartbeat response - connection is alive
          break;

        case 'unread_count':
          setUnreadCount(data.count);
          break;

        case 'notification_read':
          // Mark notification as read in local state
          setNotifications(prev =>
            prev.map(n =>
              n.id === data.notification_id
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          break;

        case 'all_read':
          // Mark all notifications as read
          setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
          );
          setUnreadCount(0);
          break;

        case 'error':
          console.error('[useNotifications] Server error:', data.message);
          setError(data.message);
          break;

        default:
          console.log('[useNotifications] Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('[useNotifications] Error parsing message:', err);
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!token || !enabled) {
      console.log('[useNotifications] Not connecting - missing token or disabled');
      return;
    }

    if (wsRef.current?.readyState === WS_STATE.OPEN) {
      console.log('[useNotifications] Already connected');
      return;
    }

    isManualDisconnect.current = false;
    setConnectionState('connecting');

    try {
      const url = getWebSocketUrl(token);
      console.log('[useNotifications] Connecting to WebSocket...');

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('[useNotifications] WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectAttemptRef.current = 0;
        startHeartbeat();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (event) => {
        console.error('[useNotifications] WebSocket error:', event);
        setError('Erro na conexão');
      };

      wsRef.current.onclose = (event) => {
        console.log('[useNotifications] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        stopHeartbeat();

        // Auto-reconnect if not a manual disconnect
        if (!isManualDisconnect.current && enabled) {
          reconnectAttemptRef.current += 1;
          const delay = getReconnectDelay();

          console.log(
            `[useNotifications] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`
          );

          setConnectionState('reconnecting');
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      console.error('[useNotifications] Error creating WebSocket:', err);
      setError('Erro ao conectar');
      setConnectionState('error');
    }
  }, [token, enabled, handleMessage, startHeartbeat, stopHeartbeat, getReconnectDelay]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('[useNotifications] Disconnecting...');
    isManualDisconnect.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
  }, [stopHeartbeat]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      return false;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      return false;
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsService.deleteNotification(notificationId);

      // Update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const newList = prev.filter(n => n.id !== notificationId);

        // Adjust unread count if deleted notification was unread
        if (notification && !notification.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }

        return newList;
      });

      return true;
    } catch (err) {
      console.error('[useNotifications] Error deleting notification:', err);
      return false;
    }
  }, []);

  /**
   * Refresh notifications from server
   */
  const refresh = useCallback(() => {
    return loadNotifications();
  }, [loadNotifications]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && token && enabled) {
      // Load initial data
      loadNotifications();

      // Connect WebSocket
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, token, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle visibility change (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && token && enabled) {
        console.log('[useNotifications] Tab visible, reconnecting...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, token, enabled, connect]);

  // Listen for notification clicks from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const { notification_id, url, navigate } = event.data;

        // Mark as read
        if (notification_id) {
          markAsRead(notification_id);
        }

        // Navigate if requested
        if (navigate && url && typeof window !== 'undefined') {
          window.location.href = url;
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [markAsRead]);

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    connectionState,

    // Actions
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadNotifications,
  };
}

// Export named for convenience
export { useNotifications };
