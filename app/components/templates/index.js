/**
 * Templates barrel export
 *
 * Exports all page template components for the application.
 * These are the main page-level components that compose features and UI elements.
 */

// Authentication
export { default as AuthTemplate } from './authTemplate';

// Dashboard
export { default as DashboardTemplate } from './dashboardTemplate';

// Help & Support
export { default as HelpCenterTemplate } from './centralAjudaTemplate';
export { default as HelpCenter } from './helpCenter';

// AI Features
export { default as DoctorAITemplate } from './doctorAITemplate';

// Patient Management
export { default as PatientTemplate } from './pacienteTemplate';
export { default as PatientRegistrationTemplate } from './pacienteCadastroTemplate';
export { default as PatientsListTemplate } from './patientsListTemplate';

// Prescriptions
export { default as PrescriptionsTemplate } from './receitasTemplate';
export { default as PrescriptionListTemplate } from './prescriptionListTemplate';

// User Management
export { default as UserDataTemplate } from './userDataTemplate';
export { default as UserProfileTemplate } from './userProfileTemplate';

// Checkout & Payments
export { default as CheckoutTemplate } from './checkout';
export { default as CustomCheckout } from './customCheckout';