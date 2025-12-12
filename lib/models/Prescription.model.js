/**
 * Prescription Model
 *
 * Data structure for medical prescriptions.
 */

/**
 * Medication item in prescription
 * @typedef {Object} MedicationItem
 */
export const MedicationItemModel = {
  medicationName: '',
  activeIngredient: '',
  dosage: '',
  form: '', // Comprimido, Cápsula, Solução, etc.
  route: '', // Oral, Intravenoso, etc.
  frequency: '',
  duration: '',
  instructions: '',
  isControlled: false,
  controlledType: '' // Receita azul, amarela, etc.
};

/**
 * Prescription data model
 * @typedef {Object} Prescription
 */
export const PrescriptionModel = {
  patientId: '',
  patientName: '',
  doctorId: '',
  consultationId: '',

  // Prescription info
  prescriptionDate: null,
  expirationDate: null,

  // Medications list
  medications: [],

  // Instructions
  generalInstructions: '',

  // Status
  status: 'Ativa', // 'Ativa', 'Renovada', 'Suspensa', 'Concluída'

  // Notes
  additionalNotes: '',

  // Control fields
  createdAt: null,
  updatedAt: null
};

/**
 * Create a new prescription object with defaults
 * @param {Partial<Prescription>} data - Prescription data
 * @returns {Prescription} Prescription object
 */
export function createPrescription(data = {}) {
  return {
    ...PrescriptionModel,
    ...data,
    prescriptionDate: data.prescriptionDate || new Date(),
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a medication item
 * @param {Partial<MedicationItem>} data - Medication data
 * @returns {MedicationItem} Medication item
 */
export function createMedicationItem(data = {}) {
  return {
    ...MedicationItemModel,
    ...data
  };
}

/**
 * Validate prescription data
 * @param {Partial<Prescription>} data - Prescription data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePrescription(data) {
  const errors = [];

  if (!data.patientId) {
    errors.push('Paciente é obrigatório');
  }

  if (!data.medications || data.medications.length === 0) {
    errors.push('Pelo menos um medicamento é obrigatório');
  }

  if (data.medications) {
    data.medications.forEach((med, index) => {
      if (!med.medicationName) {
        errors.push(`Medicamento ${index + 1}: Nome é obrigatório`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export default PrescriptionModel;
