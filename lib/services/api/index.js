/**
 * API Services - Barrel Export
 *
 * Serviços de API para comunicação com o doctor-server
 */

// Configuração
export { default as config } from './config';

// Serviço base
export { default as apiService } from './apiService';

// Serviços de domínio
export { default as patientsService } from './patients.service';
export { default as appointmentsService } from './appointments.service';
export { default as prescriptionsService } from './prescriptions.service';
export { default as examsService } from './exams.service';
export { default as notesService } from './notes.service';
export { default as secretaryService } from './secretary.service';
export { default as whatsappService } from './whatsapp.service';
export { default as aiConversationsService } from './ai-conversations.service';
export { default as conversationsService } from './conversations.service';
export { default as subscriptionsService } from './subscriptions.service';
export { default as authApiService } from './auth.service';
export { default as adminService } from './admin.service';
export { default as weatherService } from './weather.service';
export { default as aiBlocksService } from './ai-blocks.service';
export { default as storageService } from './storage.service';
export { FileCategories } from './storage.service';
export { default as clinicService } from './clinic.service';
export { default as financialService } from './financial.service';
export {
  OrigemContaReceber,
  StatusContaReceber,
  FormaPagamento,
} from './financial.service';
export { default as crmService } from './crm.service';
export {
  FollowUpRuleType,
  FollowUpRuleTypeLabels,
  FollowUpStatus,
  FollowUpStatusLabels,
  NotificationChannel,
  NotificationChannelLabels,
} from './crm.service';

// Adapter de compatibilidade com Firebase
export { default as FirebaseAdapter } from './firebaseAdapter';
export {
  convertPatientToLegacy,
  convertLegacyToPatient,
  convertAppointmentToLegacy,
  convertLegacyToAppointment,
} from './firebaseAdapter';

// Re-export para compatibilidade
export {
  patientsService as patientService,
  appointmentsService as appointmentService,
  prescriptionsService as prescriptionService,
  examsService as examService,
  notesService as noteService,
};
