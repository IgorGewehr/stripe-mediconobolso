/**
 * Firebase Services - Aggregator
 *
 * This file re-exports all Firebase services for easy importing.
 * It also provides a backward-compatible facade for the original firebaseService.
 */

// Export individual services
export { storageService } from './storage.service';
export { weatherService } from './weather.service';
export { aiService } from './ai.service';
export { authService } from './auth.service';
export { patientsService } from './patients.service';
export { appointmentsService } from './appointments.service';
export { prescriptionsService } from './prescriptions.service';
export { examsService } from './exams.service';
export { notesService } from './notes.service';
export { secretaryService } from './secretary.service';
export { adminService } from './admin.service';
export { conversationService } from './conversation.service';
export { notificationSettingsService } from './notificationSettings.service';

// Import all services for the facade
import { storageService } from './storage.service';
import { weatherService } from './weather.service';
import { aiService } from './ai.service';
import { authService } from './auth.service';
import { patientsService } from './patients.service';
import { appointmentsService } from './appointments.service';
import { prescriptionsService } from './prescriptions.service';
import { examsService } from './exams.service';
import { notesService } from './notes.service';
import { secretaryService } from './secretary.service';
import { adminService } from './admin.service';
import { conversationService } from './conversation.service';
import { notificationSettingsService } from './notificationSettings.service';

/**
 * Backward-compatible facade that delegates to individual services.
 * This allows existing code using firebaseService to continue working.
 *
 * @deprecated Use individual services directly for better code organization.
 */
export const firebaseServices = {
  // Storage Service
  uploadFile: (...args) => storageService.uploadFile(...args),
  deleteFile: (...args) => storageService.deleteFile(...args),
  getFileUrl: (...args) => storageService.getFileUrl(...args),

  // Weather Service
  saveWeatherData: (...args) => weatherService.saveWeatherData(...args),
  getWeatherData: (...args) => weatherService.getWeatherData(...args),

  // AI Service
  saveAIConversation: (...args) => aiService.saveConversation(...args),
  getAIConversation: (...args) => aiService.getConversation(...args),
  getAIConversations: (...args) => aiService.listConversations(...args),
  updateAIConversation: (...args) => aiService.updateConversation(...args),
  deleteAIConversation: (...args) => aiService.deleteConversation(...args),
  searchAIConversations: (...args) => aiService.searchConversations(...args),
  cleanOldConversations: (...args) => aiService.cleanOldConversations(...args),
  getAIStats: (...args) => aiService.getConversationStats(...args),

  // Auth Service
  login: (...args) => authService.login(...args),
  signUp: (...args) => authService.signUp(...args),
  loginWithGoogle: (...args) => authService.loginWithGoogle(...args),
  signUpFreeWithGoogle: (...args) => authService.signUpFreeWithGoogle(...args),
  completeGoogleProfile: (...args) => authService.completeGoogleProfile(...args),
  sendPasswordResetEmail: (...args) => authService.sendPasswordResetEmail(...args),
  registerDetailedLogin: (...args) => authService.registerDetailedLogin(...args),
  getUserData: (...args) => authService.getUserData(...args),
  editUserData: (...args) => authService.editUserData(...args),
  sendGoogleWelcomeEmails: (...args) => authService.sendGoogleWelcomeEmails(...args),
  initializeUserModules: (...args) => authService.initializeUserModules(...args),
  checkModuleLimitations: (...args) => authService.checkModuleLimitations(...args),
  updateUserPlan: (...args) => authService.updateUserPlan(...args),

  // Patients Service
  listPatients: (...args) => patientsService.listPatients(...args),
  getPatient: (...args) => patientsService.getPatient(...args),
  createPatient: (...args) => patientsService.createPatient(...args),
  updatePatient: (...args) => patientsService.updatePatient(...args),
  deletePatient: (...args) => patientsService.deletePatient(...args),
  filterPatients: (...args) => patientsService.filterPatients(...args),
  updateFavoriteStatus: (...args) => patientsService.updateFavoriteStatus(...args),
  getPatientsByDoctor: (...args) => patientsService.getPatientsByDoctor(...args),
  getPatientStatusHistory: (...args) => patientsService.getPatientStatusHistory(...args),
  addPatientStatusHistory: (...args) => patientsService.addPatientStatusHistory(...args),
  updatePatientStatus: (...args) => patientsService.updatePatientStatus(...args),
  uploadPatientDocument: (...args) => patientsService.uploadPatientDocument(...args),
  removePatientDocument: (...args) => patientsService.removePatientDocument(...args),
  getPatientDocuments: (...args) => patientsService.getPatientDocuments(...args),

  // Appointments Service
  listPatientConsultations: (...args) => appointmentsService.listPatientConsultations(...args),
  listAllConsultations: (...args) => appointmentsService.listAllConsultations(...args),
  createConsultation: (...args) => appointmentsService.createConsultation(...args),
  updateConsultation: (...args) => appointmentsService.updateConsultation(...args),
  getConsultation: (...args) => appointmentsService.getConsultation(...args),

  // Prescriptions Service
  createPrescription: (...args) => prescriptionsService.createPrescription(...args),
  updatePrescription: (...args) => prescriptionsService.updatePrescription(...args),
  deletePrescription: (...args) => prescriptionsService.deletePrescription(...args),
  getPrescription: (...args) => prescriptionsService.getPrescription(...args),
  listPrescriptionsWithDetails: (...args) => prescriptionsService.listPrescriptionsWithDetails(...args),
  filterPrescriptions: (...args) => prescriptionsService.filterPrescriptions(...args),
  listMedications: (...args) => prescriptionsService.listMedications(...args),
  createMedication: (...args) => prescriptionsService.createMedication(...args),
  updateMedication: (...args) => prescriptionsService.updateMedication(...args),
  deleteMedication: (...args) => prescriptionsService.deleteMedication(...args),
  getMedication: (...args) => prescriptionsService.getMedication(...args),

  // Exams Service
  listExams: (...args) => examsService.listExams(...args),
  getExam: (...args) => examsService.getExam(...args),
  createExam: (...args) => examsService.createExam(...args),
  updateExam: (...args) => examsService.updateExam(...args),
  deleteExam: (...args) => examsService.deleteExam(...args),
  uploadExamAttachment: (...args) => examsService.uploadExamAttachment(...args),
  removeExamAttachment: (...args) => examsService.removeExamAttachment(...args),

  // Notes Service
  listAnamneses: (...args) => notesService.listAnamneses(...args),
  createAnamnese: (...args) => notesService.createAnamnese(...args),
  updateAnamnese: (...args) => notesService.updateAnamnese(...args),
  getAnamnese: (...args) => notesService.getAnamnese(...args),
  listNotes: (...args) => notesService.listNotes(...args),
  getNote: (...args) => notesService.getNote(...args),
  createNote: (...args) => notesService.createNote(...args),
  updateNote: (...args) => notesService.updateNote(...args),
  deleteNote: (...args) => notesService.deleteNote(...args),
  uploadNoteAttachment: (...args) => notesService.uploadNoteAttachment(...args),
  removeNoteAttachment: (...args) => notesService.removeNoteAttachment(...args),

  // Secretary Service
  createSecretaryAccount: (...args) => secretaryService.createSecretaryAccount(...args),
  validateSecretaryCreation: (...args) => secretaryService.validateSecretaryCreation(...args),
  countDoctorSecretaries: (...args) => secretaryService.countDoctorSecretaries(...args),
  checkEmailExistsInSystem: (...args) => secretaryService.checkEmailExistsInSystem(...args),
  checkEmailExistsInSystemSimplified: (...args) => secretaryService.checkEmailExistsInSystem(...args),
  updateDoctorConfiguration: (...args) => secretaryService.updateDoctorConfiguration(...args),
  getDoctorSecretaryInfo: (...args) => secretaryService.getDoctorSecretaryInfo(...args),
  listDoctorSecretaries: (...args) => secretaryService.listDoctorSecretaries(...args),
  updateSecretaryPermissions: (...args) => secretaryService.updateSecretaryPermissions(...args),
  deactivateSecretaryAccount: (...args) => secretaryService.deactivateSecretaryAccount(...args),
  reactivateSecretaryAccount: (...args) => secretaryService.reactivateSecretaryAccount(...args),
  getSecretaryDetails: (...args) => secretaryService.getSecretaryDetails(...args),
  checkIfUserIsSecretary: (...args) => secretaryService.checkIfUserIsSecretary(...args),
  validateSecretaryOperation: (...args) => secretaryService.validateSecretaryOperation(...args),
  generateSecretaryReport: (...args) => secretaryService.generateSecretaryReport(...args),

  // Admin Service
  listAllUsers: (...args) => adminService.listAllUsers(...args),
  getUsersWithPresenceData: (...args) => adminService.getUsersWithPresenceData(...args),
  enrichUserData: (...args) => adminService.enrichUserData(...args),
  getUserDetailedStats: (...args) => adminService.getUserDetailedStats(...args),
  getEnhancedPlatformStats: (...args) => adminService.getEnhancedPlatformStats(...args),
  updateUserAdminStatus: (...args) => adminService.updateUserAdminStatus(...args),
  getAllUsersMessages: (...args) => adminService.getAllUsersMessages(...args),
  createReport: (...args) => adminService.createReport(...args),
  getUserReports: (...args) => adminService.getUserReports(...args),
  addReportResponse: (...args) => adminService.addReportResponse(...args),
  getAllReports: (...args) => adminService.getAllReports(...args),
  updateReportStatus: (...args) => adminService.updateReportStatus(...args),
  markReportAsReadByUser: (...args) => adminService.markReportAsReadByUser(...args),
  markReportAsReadByAdmin: (...args) => adminService.markReportAsReadByAdmin(...args),
  getReportsStats: (...args) => adminService.getReportsStats(...args),
  getReport: (...args) => adminService.getReport(...args),
  getAdminUserConversation: (...args) => adminService.getAdminUserConversation(...args),
  createAdminUserConversation: (...args) => adminService.createAdminUserConversation(...args),
  sendAdminMessage: (...args) => adminService.sendAdminMessage(...args),
  getAllAdminUserConversations: (...args) => adminService.getAllAdminUserConversations(...args),

  // Conversation Service
  listConversations: (...args) => conversationService.listConversations(...args),
  getConversation: (...args) => conversationService.getConversation(...args),
  findConversationByPhone: (...args) => conversationService.findByPhone(...args),
  findConversationBySocialId: (...args) => conversationService.findBySocialId(...args),
  createConversation: (...args) => conversationService.createConversation(...args),
  updateConversation: (...args) => conversationService.updateConversation(...args),
  markConversationAsRead: (...args) => conversationService.markAsRead(...args),
  markConversationAsUnread: (...args) => conversationService.markAsUnread(...args),
  updateConversationStatus: (...args) => conversationService.updateStatus(...args),
  renameConversation: (...args) => conversationService.renameConversation(...args),
  subscribeToConversations: (...args) => conversationService.subscribeToConversations(...args),
  listMessages: (...args) => conversationService.listMessages(...args),
  addMessage: (...args) => conversationService.addMessage(...args),
  subscribeToMessages: (...args) => conversationService.subscribeToMessages(...args),
  getAIBlockStatus: (...args) => conversationService.getAIBlockStatus(...args),
  blockAI: (...args) => conversationService.blockAI(...args),
  unblockAI: (...args) => conversationService.unblockAI(...args),
  getConversationStats: (...args) => conversationService.getStats(...args),

  // Notification Settings Service
  getNotificationSettings: (...args) => notificationSettingsService.getSettings(...args),
  saveNotificationSettings: (...args) => notificationSettingsService.saveSettings(...args),
  updateNotificationChannelSettings: (...args) => notificationSettingsService.updateChannelSettings(...args),
  toggleNotifications: (...args) => notificationSettingsService.toggleNotifications(...args),
  updateQuietHours: (...args) => notificationSettingsService.updateQuietHours(...args),

  // Legacy aliases
  debugUserReports: (...args) => adminService.getUserReports(...args),
};

// Default export for backward compatibility
export default firebaseServices;
