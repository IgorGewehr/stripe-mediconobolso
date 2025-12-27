/**
 * Features barrel export
 *
 * Main entry point for all feature components.
 * Organized by domain for cleaner imports across the application.
 *
 * @example
 * import { PatientCard, ExamDialog, AdminDashboard } from '@/components/features';
 */

// Admin Features
export * from './admin';

// Authentication Features
export * from './auth';

// Checkout & Payments
export * from './checkout/CustomCheckout';

// Dialogs & Modals
export * from './dialogs';

// Forms
export * from './forms';

// Mobile Components
export * from './mobile';

// Patient Management
export * from './patients';

// Shared Components
export * from './shared';

// Appointments (re-export from subdirectory)
export { default as AppointmentCalendar } from './appointments/AppointmentCalendar';

// Anamnesis (re-export from subdirectory)
export { default as AnamnesisDialog } from './anamnesis/AnamnesisDialog';

// Exams (re-export from subdirectory)
export { default as ExamDialogFeature } from './exams/ExamDialog';

// Prescriptions (re-export from subdirectory)
export { default as PrescriptionsTemplateFeature } from './prescriptions/PrescriptionsTemplate';

// Conversations (WhatsApp/Social Media)
export * from './conversations';

// Clinic Management (Multi-Doctor)
export * from './clinic';

// Financial System
export * from './financial';

// CRM System
export * from './crm';
