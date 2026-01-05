"use client";

/**
 * WebSocket Provider
 *
 * Provides WebSocket connection context to the entire application.
 * Manages connection lifecycle based on authentication state.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './authProvider';
import { auth } from '@/lib/config/firebase.config';
import webSocketService, { WS_STATE, WS_EVENT_TYPES } from '@/lib/services/websocket/WebSocketService';

// Context
const WebSocketContext = createContext(null);

/**
 * WebSocket Provider Component
 */
export function WebSocketProvider({ children }) {
  const { user, isSecretary, workingDoctorId } = useAuth();
  const [connectionState, setConnectionState] = useState(WS_STATE.DISCONNECTED);
  const [isReady, setIsReady] = useState(false);
  const connectionAttemptedRef = useRef(false);

  // Get effective doctor ID
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  /**
   * Connect to WebSocket when user is authenticated
   */
  useEffect(() => {
    const connectWebSocket = async () => {
      if (!user || !doctorId) {
        // Disconnect if no user
        if (webSocketService.isConnected()) {
          webSocketService.disconnect();
        }
        setIsReady(false);
        connectionAttemptedRef.current = false;
        return;
      }

      // Prevent duplicate connection attempts
      if (connectionAttemptedRef.current && webSocketService.getState() !== WS_STATE.DISCONNECTED) {
        return;
      }

      try {
        connectionAttemptedRef.current = true;

        // Get fresh Firebase token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          console.warn('[WebSocketProvider] No auth token available');
          return;
        }

        // Connect
        webSocketService.connect({
          token,
          doctorId,
        });

      } catch (error) {
        console.error('[WebSocketProvider] Connection error:', error);
        connectionAttemptedRef.current = false;
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on provider unmount - let it persist
    };
  }, [user, doctorId]);

  /**
   * Handle connection state changes
   */
  useEffect(() => {
    const unsubscribe = webSocketService.onStateChange((newState, oldState) => {
      console.log('[WebSocketProvider] State changed:', oldState, '->', newState);
      setConnectionState(newState);
      setIsReady(newState === WS_STATE.CONNECTED);
    });

    // Set initial state
    setConnectionState(webSocketService.getState());
    setIsReady(webSocketService.isConnected());

    return unsubscribe;
  }, []);

  /**
   * Handle token refresh
   */
  useEffect(() => {
    if (!user) return;

    // Refresh token periodically (every 50 minutes, tokens expire in 60)
    const refreshInterval = setInterval(async () => {
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (token && webSocketService.isConnected()) {
          webSocketService.updateToken(token);
        }
      } catch (error) {
        console.error('[WebSocketProvider] Token refresh error:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  /**
   * Subscribe to WebSocket events
   */
  const subscribe = useCallback((eventType, callback) => {
    return webSocketService.on(eventType, callback);
  }, []);

  /**
   * Subscribe to multiple event types
   */
  const subscribeMany = useCallback((eventTypes, callback) => {
    const unsubscribes = eventTypes.map(type => webSocketService.on(type, callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message) => {
    return webSocketService.send(message);
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(async () => {
    if (!user || !doctorId) return;

    webSocketService.disconnect();

    const token = await auth.currentUser?.getIdToken(true);
    if (token) {
      setTimeout(() => {
        webSocketService.connect({ token, doctorId });
      }, 100);
    }
  }, [user, doctorId]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const contextValue = {
    // State
    connectionState,
    isReady,
    isConnected: connectionState === WS_STATE.CONNECTED,
    isConnecting: connectionState === WS_STATE.CONNECTING,
    isReconnecting: connectionState === WS_STATE.RECONNECTING,
    hasError: connectionState === WS_STATE.ERROR,

    // Methods
    subscribe,
    subscribeMany,
    send,
    reconnect,
    disconnect,

    // Direct service access (for advanced use)
    service: webSocketService,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}

/**
 * Hook to subscribe to specific WebSocket events
 * @param {string|string[]} eventTypes - Event type(s) to subscribe to
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependencies for callback
 */
export function useWebSocketEvent(eventTypes, callback, deps = []) {
  const { subscribe, subscribeMany, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    if (types.length === 1) {
      return subscribe(types[0], callback);
    } else {
      return subscribeMany(types, callback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, subscribe, subscribeMany, ...deps]);
}

// Export event types for convenience
export { WS_EVENT_TYPES, WS_STATE };

export default WebSocketProvider;
