/**
 * Features barrel export
 *
 * This module provides a centralized export for all feature components.
 * Import from this file for cleaner imports across the application.
 */

// Patients
export { default as PatientCard } from './patients/PatientCard';
export { default as PatientsList } from './patients/PatientsList';

// Appointments
export { default as AppointmentCalendar } from './appointments/AppointmentCalendar';

// Exams
export { default as ExamDialog } from './exams/ExamDialog';

// Anamnesis
export { default as AnamnesisDialog } from './anamnesis/AnamnesisDialog';

// Prescriptions
export { default as PrescriptionsTemplate } from './prescriptions/PrescriptionsTemplate';

// Checkout
export { default as CustomCheckout } from './checkout/CustomCheckout';
