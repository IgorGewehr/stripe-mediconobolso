/**
 * Patient Model
 *
 * Data structure for patient records.
 */

/**
 * Patient data model
 * @typedef {Object} Patient
 */
export const PatientModel = {
  // Basic information
  patientName: '',
  patientAge: null,
  patientGender: '', // 'Masculino', 'Feminino', 'Outro'
  patientPhone: '',
  patientEmail: '',
  patientAddress: '',
  patientCPF: '',
  patientRG: '',
  birthDate: null,

  // Medical data
  bloodType: '', // 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  heightCm: null,
  weightKg: null,
  isSmoker: false,
  isAlcoholConsumer: false,
  allergies: [],
  congenitalDiseases: [],
  chronicDiseases: [],
  medications: [],
  surgicalHistory: [],
  familyHistory: [],

  // Vital signs
  vitalSigns: {
    bloodPressure: '',
    heartRate: null,
    temperature: null,
    respiratoryRate: null,
    oxygenSaturation: null
  },

  // Emergency contact
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },

  // Health insurance
  healthInsurance: {
    name: '',
    number: '',
    validUntil: null
  },

  // Control fields
  doctorId: '',
  notes: '',
  isFavorite: false,
  status: [], // Status tags
  photoURL: '',
  lastConsultationDate: null,
  createdAt: null,
  updatedAt: null
};

/**
 * Create a new patient object with defaults
 * @param {Partial<Patient>} data - Patient data
 * @returns {Patient} Patient object
 */
export function createPatient(data = {}) {
  return {
    ...PatientModel,
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Validate patient data
 * @param {Partial<Patient>} data - Patient data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePatient(data) {
  const errors = [];

  if (!data.patientName || data.patientName.trim().length < 2) {
    errors.push('Nome do paciente é obrigatório');
  }

  if (data.patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.patientEmail)) {
    errors.push('Email inválido');
  }

  if (data.patientCPF) {
    const cpf = data.patientCPF.replace(/\D/g, '');
    if (cpf.length !== 11) {
      errors.push('CPF inválido');
    }
  }

  return { valid: errors.length === 0, errors };
}

export default PatientModel;
