'use client';

/**
 * @fileoverview WhatsApp Campaigns Hook
 * @description Custom hooks for managing WhatsApp campaigns state
 */

import { useState, useEffect, useCallback } from 'react';
import whatsappCampaignService from '@/lib/services/api/whatsappCampaign.service';

/**
 * Hook for managing WhatsApp campaigns list
 * @param {Object} [options]
 * @param {boolean} [options.autoLoad=true] - Auto load on mount
 * @param {number} [options.refreshInterval=0] - Auto refresh interval in ms (0 = disabled)
 * @returns {Object} Campaigns state and actions
 */
export function useWhatsAppCampaigns(options = {}) {
  const { autoLoad = true, refreshInterval = 0 } = options;

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });

  // Load campaigns
  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await whatsappCampaignService.listCampaigns({
        page: params.page || pagination.page,
        perPage: params.perPage || pagination.perPage,
        ...params,
      });
      setCampaigns(result.items || []);
      setPagination((prev) => ({
        ...prev,
        page: result.page || 1,
        total: result.total || 0,
      }));
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao carregar campanhas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage]);

  // Create campaign
  const create = useCallback(async (data) => {
    setError(null);
    try {
      const campaign = await whatsappCampaignService.createCampaign(data);
      setCampaigns((prev) => [campaign, ...prev]);
      return campaign;
    } catch (err) {
      setError(err.message || 'Erro ao criar campanha');
      throw err;
    }
  }, []);

  // Start campaign
  const start = useCallback(async (id) => {
    setError(null);
    try {
      const result = await whatsappCampaignService.startCampaign(id);
      await load();
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao iniciar campanha');
      throw err;
    }
  }, [load]);

  // Pause campaign
  const pause = useCallback(async (id) => {
    setError(null);
    try {
      const campaign = await whatsappCampaignService.pauseCampaign(id);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? campaign : c))
      );
      return campaign;
    } catch (err) {
      setError(err.message || 'Erro ao pausar campanha');
      throw err;
    }
  }, []);

  // Resume campaign
  const resume = useCallback(async (id) => {
    setError(null);
    try {
      const campaign = await whatsappCampaignService.resumeCampaign(id);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? campaign : c))
      );
      return campaign;
    } catch (err) {
      setError(err.message || 'Erro ao retomar campanha');
      throw err;
    }
  }, []);

  // Cancel campaign
  const cancel = useCallback(async (id) => {
    setError(null);
    try {
      const campaign = await whatsappCampaignService.cancelCampaign(id);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? campaign : c))
      );
      return campaign;
    } catch (err) {
      setError(err.message || 'Erro ao cancelar campanha');
      throw err;
    }
  }, []);

  // Schedule campaign
  const schedule = useCallback(async (id, scheduledAt) => {
    setError(null);
    try {
      const campaign = await whatsappCampaignService.scheduleCampaign(id, scheduledAt);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? campaign : c))
      );
      return campaign;
    } catch (err) {
      setError(err.message || 'Erro ao agendar campanha');
      throw err;
    }
  }, []);

  // Delete campaign
  const remove = useCallback(async (id) => {
    setError(null);
    try {
      await whatsappCampaignService.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || 'Erro ao excluir campanha');
      throw err;
    }
  }, []);

  // Go to page
  const goToPage = useCallback((page) => {
    load({ page });
  }, [load]);

  // Check if there are active campaigns
  const hasActiveCampaigns = campaigns.some(
    (c) => c.status === 'running' || c.status === 'scheduled'
  );

  // Auto load on mount
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh when there are active campaigns
  useEffect(() => {
    const interval = refreshInterval > 0 ? refreshInterval : (hasActiveCampaigns ? 30000 : 0);
    if (interval > 0) {
      const timer = setInterval(load, interval);
      return () => clearInterval(timer);
    }
  }, [hasActiveCampaigns, refreshInterval, load]);

  return {
    campaigns,
    loading,
    error,
    pagination,
    hasActiveCampaigns,
    load,
    create,
    start,
    pause,
    resume,
    cancel,
    schedule,
    remove,
    goToPage,
    refresh: load,
  };
}

/**
 * Hook for managing a single WhatsApp campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Campaign state and actions
 */
export function useWhatsAppCampaign(campaignId) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load campaign
  const load = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await whatsappCampaignService.getCampaign(campaignId);
      setCampaign(result);
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao carregar campanha');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Update campaign
  const update = useCallback(async (data) => {
    if (!campaignId) return;
    setError(null);
    try {
      const result = await whatsappCampaignService.updateCampaign(campaignId, data);
      setCampaign(result);
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao atualizar campanha');
      throw err;
    }
  }, [campaignId]);

  // Get stats
  const getStats = useCallback(async () => {
    if (!campaignId) return;
    try {
      return await whatsappCampaignService.getCampaignStats(campaignId);
    } catch (err) {
      setError(err.message || 'Erro ao carregar estatisticas');
      throw err;
    }
  }, [campaignId]);

  // Load on mount and when ID changes
  useEffect(() => {
    if (campaignId) {
      load();
    }
  }, [campaignId, load]);

  return {
    campaign,
    loading,
    error,
    load,
    update,
    getStats,
    refresh: load,
  };
}

/**
 * Hook for managing campaign recipients
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Recipients state and actions
 */
export function useWhatsAppRecipients(campaignId) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0,
  });

  // Load recipients
  const load = useCallback(async (params = {}) => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await whatsappCampaignService.listRecipients(campaignId, {
        page: params.page || pagination.page,
        perPage: params.perPage || pagination.perPage,
        ...params,
      });
      setRecipients(result.items || []);
      setPagination((prev) => ({
        ...prev,
        page: result.page || 1,
        total: result.total || 0,
      }));
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao carregar destinatarios');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId, pagination.page, pagination.perPage]);

  // Go to page
  const goToPage = useCallback((page) => {
    load({ page });
  }, [load]);

  // Load on mount and when ID changes
  useEffect(() => {
    if (campaignId) {
      load();
    }
  }, [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    recipients,
    loading,
    error,
    pagination,
    load,
    goToPage,
    refresh: load,
  };
}

export default {
  useWhatsAppCampaigns,
  useWhatsAppCampaign,
  useWhatsAppRecipients,
};
