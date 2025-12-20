/**
 * Hooks barrel export
 *
 * Exports all custom React hooks for the application.
 * These hooks encapsulate reusable stateful logic.
 */

// Module Access Hook
export { default as useModuleAccess } from './useModuleAccess';

// UI Scaling Hook
export { useResponsiveScale } from './useScale';

// Conversation Hooks
export { default as useConversations } from './useConversations';
export { default as useWhatsAppStatus, WhatsAppStatusType } from './useWhatsAppStatus';
export { default as useAIBlockStatus } from './useAIBlockStatus';
export { default as useNotificationSettings } from './useNotificationSettings';

// Re-export auth hook from providers for convenience
export { useAuth } from '../providers';
