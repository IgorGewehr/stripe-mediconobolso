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

// Re-export auth hook from providers for convenience
export { useAuth } from '../providers';
