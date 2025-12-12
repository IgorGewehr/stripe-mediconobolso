/**
 * Note Model
 *
 * Data structure for patient notes and anamnesis.
 */

/**
 * Note data model
 * @typedef {Object} Note
 */
export const NoteModel = {
  patientId: '',
  doctorId: '',

  // Note info
  noteTitle: '',
  noteText: '',

  // Dates
  createdAt: null,
  consultationDate: null,

  // Organization
  noteType: 'Rápida', // 'Rápida', 'Consulta', 'Exame', 'Procedimento', etc.
  isImportant: false,

  // Attachments
  attachments: [],

  // Metadata
  lastModified: null,
  modifiedBy: null,
  viewCount: 0
};

/**
 * Note attachment model
 * @typedef {Object} NoteAttachment
 */
export const NoteAttachmentModel = {
  fileName: '',
  fileType: '',
  fileSize: '',
  fileUrl: '',
  uploadedAt: null
};

/**
 * Anamnesis data model
 * @typedef {Object} Anamnesis
 */
export const AnamnesisModel = {
  patientId: '',
  doctorId: '',
  anamneseDate: null,

  // Main information
  chiefComplaint: '',
  illnessHistory: '',

  // History
  medicalHistory: [],
  surgicalHistory: [],
  familyHistory: '',

  // Lifestyle
  socialHistory: {
    isSmoker: false,
    cigarettesPerDay: 0,
    isAlcoholConsumer: false,
    alcoholFrequency: '',
    isDrugUser: false,
    drugDetails: '',
    physicalActivity: '',
    occupation: '',
    dietHabits: ''
  },

  // Medications and allergies
  currentMedications: [],
  allergies: [],

  // Systems review
  systemsReview: {
    cardiovascular: '',
    respiratory: '',
    gastrointestinal: '',
    genitourinary: '',
    neurological: '',
    musculoskeletal: '',
    endocrine: '',
    hematologic: '',
    psychiatric: '',
    dermatological: ''
  },

  // Physical exam
  physicalExam: {
    generalAppearance: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    },
    headAndNeck: '',
    cardiovascular: '',
    respiratory: '',
    abdomen: '',
    extremities: '',
    neurological: '',
    other: ''
  },

  // Conclusions
  diagnosis: '',
  treatmentPlan: '',
  additionalNotes: '',

  createdAt: null,
  updatedAt: null
};

/**
 * Create a new note object with defaults
 * @param {Partial<Note>} data - Note data
 * @returns {Note} Note object
 */
export function createNote(data = {}) {
  return {
    ...NoteModel,
    ...data,
    createdAt: data.createdAt || new Date(),
    lastModified: new Date()
  };
}

/**
 * Create a new anamnesis object with defaults
 * @param {Partial<Anamnesis>} data - Anamnesis data
 * @returns {Anamnesis} Anamnesis object
 */
export function createAnamnesis(data = {}) {
  return {
    ...AnamnesisModel,
    ...data,
    anamneseDate: data.anamneseDate || new Date(),
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a note attachment
 * @param {Partial<NoteAttachment>} data - Attachment data
 * @returns {NoteAttachment} Attachment object
 */
export function createNoteAttachment(data = {}) {
  return {
    ...NoteAttachmentModel,
    ...data,
    uploadedAt: data.uploadedAt || new Date()
  };
}

/**
 * Validate note data
 * @param {Partial<Note>} data - Note data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateNote(data) {
  const errors = [];

  if (!data.patientId) {
    errors.push('Paciente é obrigatório');
  }

  if (!data.noteText || data.noteText.trim().length === 0) {
    errors.push('Conteúdo da nota é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Note types
 */
export const NOTE_TYPES = [
  'Rápida',
  'Consulta',
  'Exame',
  'Procedimento',
  'Evolução',
  'Intercorrência',
  'Receita',
  'Atestado',
  'Encaminhamento',
  'Outro'
];

export default NoteModel;
