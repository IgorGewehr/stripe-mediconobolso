/**
 * PatientCard - Patient information display and editing component
 *
 * This module exports the patient card components for displaying and editing patient data.
 *
 * Components:
 * - PatientCard (default): Main patient card with all sections
 *
 * Utilities:
 * - patient-card.utils.js: Masks and value helpers
 * - patient-card.constants.js: Theme colors and field configuration
 */

// Re-export from original file for backward compatibility
export { default } from '../CardPaciente';

// Export utilities
export * from './patient-card.utils';
export * from './patient-card.constants';
