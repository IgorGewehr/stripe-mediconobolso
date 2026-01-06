"use client";

/**
 * useWhatsAppStatus Hook
 *
 * Manages WhatsApp connection status using WebSocket for real-time updates.
 * Replaces the old polling-based approach with efficient WebSocket events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
import { useWebSocket, WS_EVENT_TYPES } from '../providers/WebSocketProvider';
import { auth } from '@/lib/config/firebase.config';

/**
 * WhatsApp connection status types
 */
export const WhatsAppStatusType = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  QR: 'qr',
  CONNECTED: 'connected',
  ERROR: 'error'
};

/**
 * Get current user's Firebase auth token
 */
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
};

/**
 * Hook for managing WhatsApp connection status via WebSocket
 */
const useWhatsAppStatus = () => {
  const { user, isSecretary, workingDoctorId } = useAuth();
  const { subscribe, isConnected: wsConnected } = useWebSocket();

  // Get effective doctor ID
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [status, setStatus] = useState(WhatsAppStatusType.DISCONNECTED);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [profileName, setProfileName] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);

  // Ref to track if we've done initial fetch
  const initialFetchDone = useRef(false);

  // Ref to track QR timeout
  const qrTimeoutRef = useRef(null);

  /**
   * Map backend status to frontend status
   */
  const mapStatus = useCallback((backendStatus, connected) => {
    if (connected) return WhatsAppStatusType.CONNECTED;

    const statusLower = String(backendStatus || '').toLowerCase();
    switch (statusLower) {
      case 'connected':
        return WhatsAppStatusType.CONNECTED;
      case 'qr_code':
      case 'qrcode':
      case 'qr':
        return WhatsAppStatusType.QR;
      case 'connecting':
      case 'reconnecting':
        return WhatsAppStatusType.CONNECTING;
      case 'error':
        return WhatsAppStatusType.ERROR;
      default:
        return WhatsAppStatusType.DISCONNECTED;
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

      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Doctor-Id': doctorId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/whatsapp/session', { headers });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};

        const mappedStatus = mapStatus(data.status, data.connected);
        setStatus(mappedStatus);
        setPhoneNumber(data.phoneNumber || null);
        setProfileName(data.businessName || null);
        setQrCode(data.qrCode || null);
        setLastUpdated(new Date());

        return data;
      } else {
        setStatus(WhatsAppStatusType.DISCONNECTED);
        return null;
      }
    } catch (err) {
      console.warn('[useWhatsAppStatus] Error fetching status:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, doctorId, mapStatus]);

  /**
   * Request QR code for connection
   */
  const requestQRCode = useCallback(async () => {
    if (!doctorId) return null;

    try {
      setIsLoading(true);
      setError(null);
      // Set connecting status immediately so UI shows we're working
      setStatus(WhatsAppStatusType.CONNECTING);

      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Doctor-Id': doctorId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[useWhatsAppStatus] QR request response:', result);

        // QR code will arrive via WebSocket, but we also get it in response
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setStatus(WhatsAppStatusType.QR);
          setIsLoading(false);
        } else {
          // No QR in response - keep connecting status and wait for WebSocket
          // Set a timeout to avoid infinite loading
          console.log('[useWhatsAppStatus] No QR in response, waiting for WebSocket...');

          // Clear any existing timeout
          if (qrTimeoutRef.current) {
            clearTimeout(qrTimeoutRef.current);
          }

          // Set timeout - if no QR arrives in 30 seconds, show error
          qrTimeoutRef.current = setTimeout(() => {
            if (status === WhatsAppStatusType.CONNECTING && !qrCode) {
              console.warn('[useWhatsAppStatus] QR code timeout');
              setError('Tempo esgotado aguardando QR Code. Tente novamente.');
              setStatus(WhatsAppStatusType.ERROR);
              setIsLoading(false);
            }
          }, 30000);
        }
        return result.qrCode;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar QR code');
      }
    } catch (err) {
      console.error('[useWhatsAppStatus] Error requesting QR:', err);
      setError(err.message);
      setStatus(WhatsAppStatusType.ERROR);
      setIsLoading(false);
      throw err;
    }
  }, [doctorId]);

  /**
   * Disconnect WhatsApp session
   */
  const disconnect = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);

      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Doctor-Id': doctorId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/whatsapp/session/reset', {
        method: 'POST',
        headers
      });

      if (response.ok) {
        setStatus(WhatsAppStatusType.DISCONNECTED);
        setPhoneNumber(null);
        setProfileName(null);
        setQrCode(null);
      }
    } catch (err) {
      console.error('[useWhatsAppStatus] Error disconnecting:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  /**
   * Refresh status manually
   */
  const refreshStatus = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  /**
   * Get visual indicator configuration
   */
  const getIndicator = useCallback(() => {
    switch (status) {
      case WhatsAppStatusType.CONNECTED:
        return {
          text: phoneNumber ? `Conectado (${phoneNumber})` : 'WhatsApp Conectado',
          color: 'success.main',
          bgColor: '#25D366',
          status: 'connected'
        };

      case WhatsAppStatusType.QR:
        return {
          text: 'Aguardando QR Code',
          color: 'warning.main',
          bgColor: '#FFA726',
          status: 'qr'
        };

      case WhatsAppStatusType.CONNECTING:
        return {
          text: 'Conectando...',
          color: 'info.main',
          bgColor: '#29B6F6',
          status: 'connecting'
        };

      case WhatsAppStatusType.ERROR:
        return {
          text: 'Erro na Conexão',
          color: 'error.main',
          bgColor: '#EF5350',
          status: 'error'
        };

      default: // disconnected
        return {
          text: 'WhatsApp Desconectado',
          color: 'error.main',
          bgColor: '#EF5350',
          status: 'disconnected'
        };
    }
  }, [status, phoneNumber]);

  /**
   * Subscribe to WebSocket events for WhatsApp status updates
   */
  useEffect(() => {
    if (!wsConnected || !doctorId) return;

    // Subscribe to WhatsApp status events
    // Note: WebSocket já filtra eventos por tenant no backend (send_to_tenant)
    const unsubStatus = subscribe(WS_EVENT_TYPES.WHATSAPP_STATUS, (event) => {
      const { payload } = event;
      console.log('[useWhatsAppStatus] Status update via WebSocket:', payload);

      const mappedStatus = mapStatus(payload.status, payload.connected);
      setStatus(mappedStatus);
      setPhoneNumber(payload.phone_number || null);
      setProfileName(payload.profile_name || null);
      setLastUpdated(new Date());

      // Clear QR code if connected
      if (mappedStatus === WhatsAppStatusType.CONNECTED) {
        setQrCode(null);
      }
    });

    // Subscribe to QR code events
    // Note: WebSocket já filtra eventos por tenant no backend (send_to_tenant)
    const unsubQr = subscribe(WS_EVENT_TYPES.WHATSAPP_QR_CODE, (event) => {
      const { payload } = event;
      console.log('[useWhatsAppStatus] QR Code via WebSocket:', payload);

      // Clear timeout since QR arrived
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
      }

      setQrCode(payload.qr_code);
      setStatus(WhatsAppStatusType.QR);
      setIsLoading(false); // Clear loading when QR arrives
      setLastUpdated(new Date());
    });

    return () => {
      unsubStatus();
      unsubQr();
      // Clear timeout on cleanup
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
      }
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
    lastUpdated,
    phoneNumber,
    businessName: profileName,
    qrCode,
    error,

    // Actions
    checkStatus: fetchStatus,
    requestQRCode,
    disconnect,
    refreshStatus,
    getIndicator,

    // Helpers
    isConnected: status === WhatsAppStatusType.CONNECTED,
    isConnecting: status === WhatsAppStatusType.CONNECTING,
    needsQR: status === WhatsAppStatusType.QR,
    hasError: status === WhatsAppStatusType.ERROR,
    isDisconnected: status === WhatsAppStatusType.DISCONNECTED,

    // WebSocket status
    isWebSocketConnected: wsConnected
  };
};

export default useWhatsAppStatus;
