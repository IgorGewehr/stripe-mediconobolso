/**
 * Patients barrel export
 *
 * Exports all patient-related components for the application.
 */

// Main Components
export { default as PatientCard } from './PatientCard';
export { default as PatientsList } from './PatientsList';
// Note: PatientManagement is disabled until PatientsTable and PacienteTemplate are created
// export { default as PatientManagement } from './PatientManagement';

// Patient Details
export { default as CardPaciente } from './CardPaciente';
export { default as InformacoesBasicas } from './InformacoesBasicas';
export { default as CondicoesClinicas } from './CondicoesClinicas';

// English aliases
export { default as PatientInfoCard } from './CardPaciente';
export { default as BasicInformation } from './InformacoesBasicas';
export { default as ClinicalConditions } from './CondicoesClinicas';

// Utilities
export * from './PatientCard/patient-card.utils';
export * from './PatientCard/patient-card.constants';
