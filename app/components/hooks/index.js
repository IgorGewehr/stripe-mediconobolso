/**
 * Hooks barrel export
 *
 * Exports all custom React hooks for the application.
 * These hooks encapsulate reusable stateful logic.
 */

// Shared/Utility Hooks
export {
  useAsyncOperation,
  useMultipleAsyncOperations
} from './useAsyncOperation';

export {
  useDialogState,
  useConfirmDialog,
  useSnackbar
} from './useDialogState';

// Module Access Hook
export { default as useModuleAccess } from './useModuleAccess';

// UI Scaling Hook
export { useResponsiveScale } from './useScale';

// Conversation Hooks
export { default as useConversations } from './useConversations';
export { default as useWhatsAppStatus, WhatsAppStatusType } from './useWhatsAppStatus';
export { default as useAIBlockStatus } from './useAIBlockStatus';
export { default as useNotificationSettings } from './useNotificationSettings';

// Domain Hooks (API-based)
export { default as usePatients } from './usePatients';
export { default as useAppointments } from './useAppointments';
export { default as usePrescriptions } from './usePrescriptions';
export { default as useExams } from './useExams';
export { default as useNotes } from './useNotes';
export { default as useSecretary } from './useSecretary';

// TISS/TUSS Hooks
export { default as useTiss } from './useTiss';
export { default as useTussAutocomplete } from './useTussAutocomplete';

// Clinic/Multi-Doctor Hooks
export { default as useClinicDoctors } from './useClinicDoctors';
export { default as useClinicPermissions } from './useClinicPermissions';

// Financial Hooks
export {
  default as useFinancial,
  useFinancialDashboard,
  useContasReceber,
  useContasPagar,
  useFornecedores,
  useCategorias,
  useRepasses,
  useFinancialReports,
} from './useFinancial';

// CRM Hooks
export {
  default as useCRM,
  useCRMDashboard,
  useFollowUpRules,
  useReminderConfig,
  usePendingFollowUps,
  useInactivePatients,
  useDefaultTemplates,
} from './useCRM';

// Re-export auth hook from providers for convenience
export { useAuth } from '../providers';
