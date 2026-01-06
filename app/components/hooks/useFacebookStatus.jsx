"use client";

/**
 * useFacebookStatus Hook
 *
 * Manages Facebook connection status using WebSocket for real-time updates.
 * Replaces the old polling-based approach with efficient WebSocket events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
import { useWebSocket, WS_EVENT_TYPES } from '../providers/WebSocketProvider';
import facebookService from '@/lib/services/api/facebook.service';

/**
 * Facebook connection status types
 */
export const FacebookStatusType = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  TOKEN_EXPIRED: 'token_expired',
  ERROR: 'error'
};

/**
 * Hook for managing Facebook connection status via WebSocket
 */
const useFacebookStatus = () => {
  const { user, isSecretary, workingDoctorId } = useAuth();
  const { subscribe, isConnected: wsConnected } = useWebSocket();

  // Get effective doctor ID
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [status, setStatus] = useState(FacebookStatusType.DISCONNECTED);
  const [isLoading, setIsLoading] = useState(false);
  const [pageId, setPageId] = useState(null);
  const [pageName, setPageName] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [error, setError] = useState(null);

  // Ref to track if we've done initial fetch
  const initialFetchDone = useRef(false);

  /**
   * Map backend status to frontend status
   */
  const mapStatus = useCallback((backendStatus, connected) => {
    if (connected) return FacebookStatusType.CONNECTED;

    const statusLower = String(backendStatus || '').toLowerCase();
    switch (statusLower) {
      case 'connected':
        return FacebookStatusType.CONNECTED;
      case 'connecting':
        return FacebookStatusType.CONNECTING;
      case 'token_expired':
        return FacebookStatusType.TOKEN_EXPIRED;
      case 'error':
        return FacebookStatusType.ERROR;
      default:
        return FacebookStatusType.DISCONNECTED;
    }
  }, []);

  /**
   * Fetch current status from API (initial load only)
   */
  const fetchStatus = useCallback(async () => {
    if (!user || !doctorId) return null;

    try {
      setIsLoading(true);
      setError(null);

      const data = await facebookService.getStatus();

      const mappedStatus = mapStatus(data.status, data.connected);
      setStatus(mappedStatus);
      setPageId(data.page_id || null);
      setPageName(data.page_name || null);
      setAiEnabled(data.ai_enabled || false);
      setTokenExpiresAt(data.token_expires_at || null);

      return data;
    } catch (err) {
      console.warn('[useFacebookStatus] Error fetching status:', err);
      setError(err.message);
      setStatus(FacebookStatusType.ERROR);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, doctorId, mapStatus]);

  /**
   * Start OAuth flow
   */
  const startOAuth = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      const { authUrl } = await facebookService.startOAuth(doctorId);
      window.location.href = authUrl;
    } catch (err) {
      console.error('[useFacebookStatus] Error starting OAuth:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  /**
   * Connect a Facebook page
   */
  const connectPage = useCallback(async (pageData) => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      setError(null);

      await facebookService.connectPage(pageData);
      // Status will be updated via WebSocket
      await fetchStatus();
    } catch (err) {
      console.error('[useFacebookStatus] Error connecting page:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, fetchStatus]);

  /**
   * Disconnect Facebook page
   */
  const disconnect = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      await facebookService.disconnectPage();

      setStatus(FacebookStatusType.DISCONNECTED);
      setPageId(null);
      setPageName(null);
      setAiEnabled(false);
      setTokenExpiresAt(null);
    } catch (err) {
      console.error('[useFacebookStatus] Error disconnecting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  /**
   * Toggle AI for Facebook
   */
  const toggleAI = useCallback(async (enabled) => {
    if (!doctorId) return;

    try {
      await facebookService.toggleAI(enabled);
      setAiEnabled(enabled);
    } catch (err) {
      console.error('[useFacebookStatus] Error toggling AI:', err);
      setError(err.message);
      throw err;
    }
  }, [doctorId]);

  /**
   * Refresh status manually
   */
  const refreshStatus = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  /**
   * Format token expiry for display
   */
  const formatTokenExpiry = useCallback(() => {
    if (!tokenExpiresAt) return null;
    return facebookService.formatTokenExpiry({ token_expires_at: tokenExpiresAt });
  }, [tokenExpiresAt]);

  /**
   * Get visual indicator configuration
   */
  const getIndicator = useCallback(() => {
    switch (status) {
      case FacebookStatusType.CONNECTED:
        return {
          color: 'success',
          label: 'Conectado',
          tooltip: `Facebook conectado: ${pageName || 'Página'}`,
          bgColor: '#1877F2'
        };

      case FacebookStatusType.CONNECTING:
        return {
          color: 'warning',
          label: 'Conectando',
          tooltip: 'Conectando ao Facebook...',
          bgColor: '#FFA726'
        };

      case FacebookStatusType.TOKEN_EXPIRED:
        return {
          color: 'warning',
          label: 'Token Expirado',
          tooltip: 'Token expirado - reconecte',
          bgColor: '#FFA726'
        };

      case FacebookStatusType.ERROR:
        return {
          color: 'error',
          label: 'Erro',
          tooltip: error || 'Erro na conexão',
          bgColor: '#EF5350'
        };

      default: // disconnected
        return {
          color: 'default',
          label: 'Desconectado',
          tooltip: 'Facebook não conectado',
          bgColor: '#9E9E9E'
        };
    }
  }, [status, pageName, error]);

  /**
   * Subscribe to WebSocket events for Facebook status updates
   */
  useEffect(() => {
    if (!wsConnected || !doctorId) return;

    // Subscribe to Facebook status events
    const unsubStatus = subscribe(WS_EVENT_TYPES.FACEBOOK_STATUS, (event) => {
      const { payload } = event;
      console.log('[useFacebookStatus] Status update via WebSocket:', payload);

      // Note: Tenant filtering is done server-side by WebSocket routing

      const mappedStatus = mapStatus(payload.status, payload.connected);
      setStatus(mappedStatus);
      setPageId(payload.page_id || null);
      setPageName(payload.page_name || null);
      setAiEnabled(payload.ai_enabled || false);

      // Clear error on successful connection
      if (mappedStatus === FacebookStatusType.CONNECTED) {
        setError(null);
      }
    });

    return () => {
      unsubStatus();
    };
  }, [wsConnected, doctorId, subscribe, mapStatus]);

  /**
   * Initial status fetch when component mounts or doctorId changes
   */
  useEffect(() => {
    if (user && doctorId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchStatus();
    }
  }, [user, doctorId, fetchStatus]);

  /**
   * Reset initial fetch flag when doctorId changes
   */
  useEffect(() => {
    initialFetchDone.current = false;
  }, [doctorId]);

  return {
    // Status
    status,
    isLoading,
    pageId,
    pageName,
    aiEnabled,
    tokenExpiresAt,
    error,

    // Actions
    startOAuth,
    connectPage,
    disconnect,
    toggleAI,
    refreshStatus,

    // Helpers
    isConnected: status === FacebookStatusType.CONNECTED,
    isConnecting: status === FacebookStatusType.CONNECTING,
    isDisconnected: status === FacebookStatusType.DISCONNECTED,
    hasError: status === FacebookStatusType.ERROR,
    isTokenExpired: status === FacebookStatusType.TOKEN_EXPIRED,
    formatTokenExpiry,
    getIndicator,

    // WebSocket status
    isWebSocketConnected: wsConnected
  };
};

export default useFacebookStatus;
