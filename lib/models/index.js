/**
 * Models Index
 *
 * Re-exports all data models for convenient imports.
 */

// Patient
export {
  PatientModel,
  createPatient,
  validatePatient
} from './Patient.model';

// Prescription
export {
  PrescriptionModel,
  MedicationItemModel,
  createPrescription,
  createMedicationItem,
  validatePrescription
} from './Prescription.model';

// Appointment
export {
  AppointmentModel,
  ScheduleSlotModel,
  createAppointment,
  createScheduleSlot,
  validateAppointment,
  getStatusColor
} from './Appointment.model';

// Exam
export {
  ExamModel,
  ExamAttachmentModel,
  createExam,
  createExamAttachment,
  validateExam,
  getExamStatusColor,
  EXAM_CATEGORIES,
  EXAM_TYPES
} from './Exam.model';

// Note
export {
  NoteModel,
  NoteAttachmentModel,
  AnamnesisModel,
  createNote,
  createAnamnesis,
  createNoteAttachment,
  validateNote,
  NOTE_TYPES
} from './Note.model';

// User
export {
  UserModel,
  SecretaryModel,
  createUser,
  createSecretary,
  validateUser,
  getUserDisplayName,
  getUserPlanLabel,
  PLAN_TYPES,
  USER_ROLES
} from './User.model';

// Legacy models (for backward compatibility)
export {
  patientModel,
  anamneseModel,
  noteModel,
  consultationModel,
  examModel,
  medicationModel,
  prescriptionModel,
  scheduleSlotModel,
  scheduleModel,
  medicalRecordModel
} from '../modelObjects';
