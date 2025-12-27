"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import facebookService from '@/lib/services/api/facebook.service';

/**
 * Hook para gerenciar o status da conexão Facebook
 * @param {boolean} autoRefresh - Se deve atualizar automaticamente
 * @returns {Object} Status e funções de controle
 */
const useFacebookStatus = (autoRefresh = false) => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const lastFetchRef = useRef(0);

  // Configuração de cache
  const CACHE_TTL = {
    connected: 5 * 60 * 1000,      // 5 minutos se conectado
    disconnected: 60 * 1000,        // 1 minuto se desconectado
    error: 30 * 1000,               // 30 segundos em caso de erro
  };

  // Buscar status
  const fetchStatus = useCallback(async (force = false) => {
    // Throttle de requisições
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await facebookService.getStatus();
      setStatus(data);
      lastFetchRef.current = now;
    } catch (err) {
      console.error('Error fetching Facebook status:', err);
      setError(err.message);
      setStatus({
        connected: false,
        status: 'error',
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualizar status
  const refreshStatus = useCallback(() => {
    return fetchStatus(true);
  }, [fetchStatus]);

  // Iniciar OAuth
  const startOAuth = useCallback(async () => {
    try {
      // Obtém o tenantId do usuário atual
      const { auth } = await import('@/lib/config/firebase.config');
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { authUrl } = await facebookService.startOAuth(user.uid);

      // Redireciona para o Facebook
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error starting OAuth:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Conectar página
  const connectPage = useCallback(async (pageData) => {
    try {
      setIsLoading(true);
      await facebookService.connectPage(pageData);
      await refreshStatus();
    } catch (err) {
      console.error('Error connecting page:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Desconectar
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      await facebookService.disconnectPage();
      setStatus({
        connected: false,
        status: 'disconnected',
      });
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle IA
  const toggleAI = useCallback(async (enabled) => {
    try {
      await facebookService.toggleAI(enabled);
      setStatus(prev => ({
        ...prev,
        ai_enabled: enabled,
      }));
    } catch (err) {
      console.error('Error toggling AI:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (messageData) => {
    try {
      return await facebookService.sendMessage(messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Estado derivado
  const isConnected = status?.connected === true && status?.status === 'connected';
  const isConnecting = status?.status === 'connecting';
  const hasError = status?.status === 'error' || !!error;
  const isDisconnected = !isConnected && !isConnecting;
  const aiEnabled = status?.ai_enabled || false;
  const pageName = status?.page_name;
  const pageId = status?.page_id;
  const tokenExpiry = status?.token_expires_at
    ? facebookService.formatTokenExpiry(status)
    : null;

  // Efeito para busca inicial
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    // Determina intervalo baseado no status
    const getInterval = () => {
      if (isConnected) return CACHE_TTL.connected;
      if (hasError) return CACHE_TTL.error;
      return CACHE_TTL.disconnected;
    };

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchStatus, getInterval());
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isConnected, hasError, fetchStatus]);

  // Indicador visual
  const getIndicator = useCallback(() => {
    if (isConnected) {
      return {
        color: 'success',
        label: 'Conectado',
        tooltip: `Facebook conectado: ${pageName || 'Página'}`,
      };
    }
    if (isConnecting) {
      return {
        color: 'warning',
        label: 'Conectando',
        tooltip: 'Conectando ao Facebook...',
      };
    }
    if (hasError) {
      return {
        color: 'error',
        label: 'Erro',
        tooltip: error || 'Erro na conexão',
      };
    }
    return {
      color: 'default',
      label: 'Desconectado',
      tooltip: 'Facebook não conectado',
    };
  }, [isConnected, isConnecting, hasError, pageName, error]);

  return {
    // Estado
    status,
    isLoading,
    error,
    isConnected,
    isConnecting,
    hasError,
    isDisconnected,
    aiEnabled,
    pageName,
    pageId,
    tokenExpiry,

    // Ações
    refreshStatus,
    startOAuth,
    connectPage,
    disconnect,
    toggleAI,
    sendMessage,

    // Helpers
    getIndicator,
  };
};

export default useFacebookStatus;
