/**
 * Hooks barrel export
 *
 * Exports all custom hooks for the application.
 */

// Re-export from current locations for backward compatibility
export { default as useModuleAccess } from '../useModuleAccess';
export { default as useScale } from '../useScale';

// Re-export auth hook from providers
export { useAuth } from '../authProvider';
