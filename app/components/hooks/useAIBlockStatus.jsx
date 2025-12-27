"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
import { aiBlocksService } from '@/lib/services/api';

/**
 * Hook for managing AI block status for a specific phone number
 * Allows pausing AI responses to enable manual replies
 */
const useAIBlockStatus = ({ phone }) => {
  const { user, isSecretary, workingDoctorId } = useAuth();

  // Get effective doctor ID
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [reason, setReason] = useState('');

  // Refs
  const lastCheckRef = useRef(0);
  const abortControllerRef = useRef(null);
  const phoneRef = useRef(phone);

  /**
   * Check AI block status
   */
  const checkStatus = useCallback(async (force = false) => {
    if (!phone || !doctorId) {
      setBlocked(false);
      setLoading(false);
      setError(null);
      return;
    }

    // Throttle requests - minimum 10 seconds between checks unless forced
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 10000) {
      return;
    }

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastCheckRef.current = now;

    setLoading(true);

    try {
      const result = await aiBlocksService.getAIBlockStatus(phone);

      // Only update if phone hasn't changed
      if (phoneRef.current === phone) {
        setBlocked(result.isBlocked || false);
        setExpiresAt(result.blockedAt || null);
        setReason(result.blockReason || '');
        setError(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      console.error('[useAIBlockStatus] Error checking status:', err);
      setError('Falha ao verificar status da IA');
    } finally {
      setLoading(false);
    }
  }, [phone, doctorId]);

  /**
   * Enable manual mode (block AI)
   * @param {number} duration - Duration in hours (default: 1)
   * @param {string} blockReason - Reason for blocking (optional)
   */
  const enableManualMode = useCallback(async (duration = 1, blockReason = '') => {
    if (!phone || !doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiBlocksService.blockAI(phone, 'whatsapp', blockReason || 'Modo manual ativado pelo usuário');

      setBlocked(true);
      setExpiresAt(result.block?.blocked_at || null);
      setReason(result.block?.block_reason || blockReason);

      console.log('[useAIBlockStatus] Manual mode enabled:', { phone, duration });
    } catch (err) {
      console.error('[useAIBlockStatus] Error enabling manual mode:', err);
      setError(err.message || 'Falha ao ativar modo manual');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [phone, doctorId, user?.uid]);

  /**
   * Disable manual mode (unblock AI)
   */
  const disableManualMode = useCallback(async () => {
    if (!phone || !doctorId) return;

    setLoading(true);
    setError(null);

    try {
      await aiBlocksService.unblockAI(phone);

      setBlocked(false);
      setExpiresAt(null);
      setReason('');

      console.log('[useAIBlockStatus] Manual mode disabled:', { phone });
    } catch (err) {
      console.error('[useAIBlockStatus] Error disabling manual mode:', err);
      setError(err.message || 'Falha ao desativar modo manual');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [phone, doctorId]);

  /**
   * Toggle manual mode
   */
  const toggleManualMode = useCallback(async (duration = 1, blockReason = '') => {
    if (blocked) {
      await disableManualMode();
    } else {
      await enableManualMode(duration, blockReason);
    }
  }, [blocked, enableManualMode, disableManualMode]);

  /**
   * Refresh status
   */
  const refresh = useCallback(() => {
    return checkStatus(true);
  }, [checkStatus]);

  /**
   * Get time remaining until expiry
   */
  const getTimeRemaining = useCallback(() => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, [expiresAt]);

  /**
   * Format expiry time for display
   */
  const getExpiryDisplay = useCallback(() => {
    if (!expiresAt) return null;

    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    return expiry.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [expiresAt]);

  // Reset when phone changes
  useEffect(() => {
    phoneRef.current = phone;

    if (!phone || !doctorId) {
      setBlocked(false);
      setLoading(false);
      setError(null);
      setExpiresAt(null);
      setReason('');
      return;
    }

    // Check immediately when phone changes
    checkStatus(true);

    // Poll every 60 seconds
    const interval = setInterval(() => checkStatus(), 60000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [phone, doctorId, checkStatus]);

  return {
    // Status
    blocked,
    loading,
    error,
    expiresAt,
    reason,

    // Actions
    enableManualMode,
    disableManualMode,
    toggleManualMode,
    refresh,

    // Helpers
    getTimeRemaining,
    getExpiryDisplay,
    isManualMode: blocked
  };
};

export default useAIBlockStatus;
