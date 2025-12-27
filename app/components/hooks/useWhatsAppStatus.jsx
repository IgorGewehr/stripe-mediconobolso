"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
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

// Cache configuration based on status
const CACHE_TTL = {
  connected: 300000,    // 5 minutes when connected
  disconnected: 60000,  // 1 minute when disconnected
  error: 30000,         // 30 seconds on error
  connecting: 8000,     // 8 seconds when connecting
  qr: 8000              // 8 seconds waiting for QR
};

// Shared cache between hook instances
const statusCache = new Map();

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
 * Hook for managing WhatsApp connection status
 * Provides status monitoring, QR code handling, and connection management
 */
const useWhatsAppStatus = (autoRefresh = false) => {
  const { user, isSecretary, workingDoctorId } = useAuth();

  // Get effective doctor ID
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [status, setStatus] = useState(WhatsAppStatusType.DISCONNECTED);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [businessName, setBusinessName] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const autoRefreshIntervalRef = useRef(null);
  const lastCheckRef = useRef(0);

  /**
   * Check WhatsApp connection status
   */
  const checkStatus = useCallback(async (forceRefresh = false) => {
    if (!user || !doctorId) return null;

    const cacheKey = `whatsapp-status-${doctorId}`;
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = statusCache.get(cacheKey);
      if (cached) {
        const ttl = CACHE_TTL[cached.status] || 30000;
        if (now - cached.timestamp < ttl) {
          // Use cached data
          setStatus(cached.status);
          setPhoneNumber(cached.data.phoneNumber || null);
          setBusinessName(cached.data.businessName || null);
          setQrCode(cached.data.qrCode || null);
          setLastUpdated(new Date(cached.timestamp));
          return cached.data;
        }
      }
    }

    // Throttle requests
    if (!forceRefresh && now - lastCheckRef.current < 5000) {
      return null;
    }
    lastCheckRef.current = now;

    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Doctor-Id': doctorId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/whatsapp/session', {
        headers
      });

      if (response.ok) {
        const result = await response.json();
        const statusData = result.data || {};

        // Map status from backend
        let mappedStatus = WhatsAppStatusType.DISCONNECTED;

        if (statusData.connected) {
          mappedStatus = WhatsAppStatusType.CONNECTED;
        } else if (statusData.status === 'qr' || statusData.status === 'qr_ready') {
          mappedStatus = WhatsAppStatusType.QR;
        } else if (statusData.status === 'connecting' || statusData.status === 'initializing') {
          mappedStatus = WhatsAppStatusType.CONNECTING;
        } else if (statusData.status === 'error') {
          mappedStatus = WhatsAppStatusType.ERROR;
        }

        // Update state
        setStatus(mappedStatus);
        setPhoneNumber(statusData.phoneNumber || null);
        setBusinessName(statusData.businessName || null);
        setQrCode(statusData.qrCode || null);
        setLastUpdated(new Date());

        // Save to cache
        statusCache.set(cacheKey, {
          data: statusData,
          timestamp: now,
          status: mappedStatus
        });

        return statusData;
      } else {
        setStatus(WhatsAppStatusType.DISCONNECTED);
        setPhoneNumber(null);
        setBusinessName(null);
        setQrCode(null);
        return null;
      }
    } catch (err) {
      console.warn('[useWhatsAppStatus] Error checking status:', err);
      setStatus(WhatsAppStatusType.ERROR);
      setError(err.message || 'Erro ao verificar status');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, doctorId]);

  /**
   * Request QR code for connection
   */
  const requestQRCode = useCallback(async () => {
    if (!doctorId) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
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
        setQrCode(result.qrCode || null);
        setStatus(WhatsAppStatusType.QR);
        return result.qrCode;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar QR code');
      }
    } catch (err) {
      console.error('[useWhatsAppStatus] Error requesting QR:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  /**
   * Disconnect WhatsApp session
   */
  const disconnect = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);

      // Get auth token
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
        setBusinessName(null);
        setQrCode(null);

        // Clear cache
        statusCache.delete(`whatsapp-status-${doctorId}`);
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
    return checkStatus(true);
  }, [checkStatus]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    if (doctorId) {
      statusCache.delete(`whatsapp-status-${doctorId}`);
    }
  }, [doctorId]);

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

  // Initial status check
  useEffect(() => {
    if (user && doctorId) {
      checkStatus();
    }
  }, [user, doctorId, checkStatus]);

  // Auto refresh based on status
  useEffect(() => {
    if (!autoRefresh || !user || !doctorId) return;

    const getRefreshInterval = () => {
      switch (status) {
        case WhatsAppStatusType.CONNECTED:
          return 300000; // 5 minutes
        case WhatsAppStatusType.CONNECTING:
        case WhatsAppStatusType.QR:
          return 10000;  // 10 seconds
        default:
          return 60000;  // 1 minute
      }
    };

    autoRefreshIntervalRef.current = setInterval(() => {
      checkStatus();
    }, getRefreshInterval());

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, user, doctorId, status, checkStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // Status
    status,
    isLoading,
    lastUpdated,
    phoneNumber,
    businessName,
    qrCode,
    error,

    // Actions
    checkStatus,
    requestQRCode,
    disconnect,
    refreshStatus,
    clearCache,
    getIndicator,

    // Helpers
    isConnected: status === WhatsAppStatusType.CONNECTED,
    isConnecting: status === WhatsAppStatusType.CONNECTING,
    needsQR: status === WhatsAppStatusType.QR,
    hasError: status === WhatsAppStatusType.ERROR,
    isDisconnected: status === WhatsAppStatusType.DISCONNECTED
  };
};

export default useWhatsAppStatus;
