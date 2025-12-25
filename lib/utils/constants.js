/**
 * Application Constants
 *
 * Centralized constants to avoid magic strings and numbers.
 */

// Time constants in milliseconds
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365.25 * 24 * 60 * 60 * 1000
};

// User status filters
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECENT: 'recent',
  ALL: 'all'
};

// Status thresholds
export const THRESHOLDS = {
  RECENT_HOURS: 24,
  CACHE_CLEANUP_HOURS: 3,
  CACHE_MAX_AGE_HOURS: 24
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  ADMIN_PAGE_SIZE: 100
};

// Patient status
export const PATIENT_STATUS = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  HOSPITALIZED: 'Internado',
  PRIVATE: 'Particular'
};

// Health conditions for filtering
export const HEALTH_CONDITIONS = {
  SMOKER: 'fumante',
  DIABETES: 'diabetes',
  HYPERTENSION: 'hipertensao',
  OBESE: 'obeso',
  ALLERGY: 'alergia',
  CARDIOPATHY: 'cardiopatia',
  ASTHMA: 'asma',
  CANCER: 'cancer',
  HOSPITALIZED: 'internado'
};

// Appointment status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'agendada',
  CONFIRMED: 'confirmada',
  CANCELLED: 'cancelada',
  COMPLETED: 'realizada',
  NO_SHOW: 'faltou'
};

// Prescription status
export const PRESCRIPTION_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Exam status
export const EXAM_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_PARAM: (param) => `${param} is required`,
  NOT_FOUND: (entity) => `${entity} not found`,
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_DATA: 'Invalid data provided',
  OPERATION_FAILED: 'Operation failed'
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients',
  CONSULTATIONS: 'consultations',
  PRESCRIPTIONS: 'prescriptions',
  EXAMS: 'exams',
  NOTES: 'notes',
  ANAMNESIS: 'anamnesis',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  REPORTS: 'reports',
  STATUS_HISTORY: 'statusHistory',
  MEDICATIONS: 'medications'
};

// File size limits
export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,   // 5MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024 // 20MB
};

// Gender options
export const GENDER = {
  MALE: 'masculino',
  FEMALE: 'feminino',
  OTHER: 'outro',
  ALL: 'ambos'
};
