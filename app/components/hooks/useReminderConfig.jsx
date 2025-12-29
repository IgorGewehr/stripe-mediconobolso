'use client';

/**
 * @fileoverview Hook for Appointment Reminder Configuration
 * @description Manages appointment reminder settings (configurable per doctor)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import crmService from '@/lib/services/api/crm.service';

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for managing appointment reminder configuration
 * @returns {Object} Reminder config state and actions
 */
export function useReminderConfig() {
  const queryClient = useQueryClient();

  // Fetch config
  const query = useQuery({
    queryKey: ['crm', 'reminder-config'],
    queryFn: crmService.getReminderConfig,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: crmService.updateReminderConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'reminder-config'] });
    },
  });

  // Helper to transform snake_case to camelCase
  const config = query.data
    ? {
        reminderHours: query.data.reminder_hours || [24],
        channels: query.data.channels || ['whatsapp'],
        messageTemplate: query.data.message_template || null,
        active: query.data.active !== false,
      }
    : null;

  return {
    // State
    config,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Refetch
    refetch: query.refetch,

    // Helpers
    getReminderHourOptions: crmService.getReminderHourOptions,
    getTemplateVariables: crmService.getTemplateVariables,
    NotificationChannel: crmService.NotificationChannel,
    NotificationChannelLabels: crmService.NotificationChannelLabels,
  };
}

export default useReminderConfig;
