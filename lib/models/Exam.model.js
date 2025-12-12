/**
 * Exam Model
 *
 * Data structure for medical exams and test results.
 */

/**
 * Exam data model
 * @typedef {Object} Exam
 */
export const ExamModel = {
  patientId: '',
  patientName: '',
  doctorId: '',

  // Exam info
  examName: '',
  examType: '', // Sangue, Imagem, Eletro, etc.
  examCategory: '', // Laboratorial, Radiológico, etc.
  examDate: null,

  // Status
  status: 'Solicitado', // 'Solicitado', 'Agendado', 'Coletado', 'Em Análise', 'Concluído'

  // Request details
  requestDetails: {
    clinicalIndication: '',
    urgency: 'Normal', // 'Normal', 'Urgente', 'Emergência'
    requiredPreparation: '',
    additionalInstructions: ''
  },

  // Results
  results: {
    conclusionText: '',
    isAbnormal: false,
    performedBy: '',
    performedAt: '',
    resultDate: null,
    referenceValues: '',
    resultFileUrl: '',
    aiAnalysis: '' // AI-generated analysis
  },

  // Attachments
  attachments: [],

  // Additional notes
  additionalNotes: '',

  // Control fields
  createdAt: null,
  updatedAt: null
};

/**
 * Exam attachment model
 * @typedef {Object} ExamAttachment
 */
export const ExamAttachmentModel = {
  fileName: '',
  fileType: '',
  fileSize: 0,
  fileUrl: '',
  uploadedAt: null
};

/**
 * Create a new exam object with defaults
 * @param {Partial<Exam>} data - Exam data
 * @returns {Exam} Exam object
 */
export function createExam(data = {}) {
  return {
    ...ExamModel,
    ...data,
    examDate: data.examDate || new Date(),
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create an exam attachment
 * @param {Partial<ExamAttachment>} data - Attachment data
 * @returns {ExamAttachment} Attachment object
 */
export function createExamAttachment(data = {}) {
  return {
    ...ExamAttachmentModel,
    ...data,
    uploadedAt: data.uploadedAt || new Date()
  };
}

/**
 * Validate exam data
 * @param {Partial<Exam>} data - Exam data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateExam(data) {
  const errors = [];

  if (!data.patientId) {
    errors.push('Paciente é obrigatório');
  }

  if (!data.examName) {
    errors.push('Nome do exame é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get exam status color
 * @param {string} status - Exam status
 * @returns {string} MUI color name
 */
export function getExamStatusColor(status) {
  const colors = {
    'Solicitado': 'info',
    'Agendado': 'primary',
    'Coletado': 'warning',
    'Em Análise': 'warning',
    'Concluído': 'success'
  };
  return colors[status] || 'default';
}

/**
 * Exam categories
 */
export const EXAM_CATEGORIES = [
  'Laboratorial',
  'Radiológico',
  'Cardiológico',
  'Oftalmológico',
  'Audiológico',
  'Neurológico',
  'Endoscópico',
  'Ultrassonográfico',
  'Outro'
];

/**
 * Common exam types
 */
export const EXAM_TYPES = [
  'Sangue',
  'Urina',
  'Fezes',
  'Raio-X',
  'Tomografia',
  'Ressonância',
  'Ultrassom',
  'Eletrocardiograma',
  'Ecocardiograma',
  'Endoscopia',
  'Colonoscopia',
  'Mamografia',
  'Densitometria',
  'Outro'
];

export default ExamModel;
