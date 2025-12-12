/**
 * Appointment Model
 *
 * Data structure for consultations and appointments.
 */

/**
 * Appointment/Consultation data model
 * @typedef {Object} Appointment
 */
export const AppointmentModel = {
  patientId: '',
  patientName: '',
  doctorId: '',

  // Scheduling info
  consultationDate: null,
  consultationTime: '',
  consultationDuration: 30, // minutes
  consultationType: 'Presencial', // 'Presencial', 'Telemedicina'
  roomLink: '', // For telemedicine

  // Status and control
  status: 'Agendada', // 'Agendada', 'Em Andamento', 'Concluída', 'Cancelada', 'Faltou'
  reasonForVisit: '',

  // Clinical evaluation
  clinicalNotes: '',
  diagnosis: '',

  // Procedures
  proceduresPerformed: [],

  // Referrals
  referrals: [],

  // Related records
  prescriptionId: '',
  examsRequested: [],

  // Follow-up
  followUp: {
    required: false,
    timeframe: '',
    instructions: ''
  },

  // Additional notes
  additionalNotes: '',

  // Control fields
  createdAt: null,
  updatedAt: null
};

/**
 * Schedule slot model
 * @typedef {Object} ScheduleSlot
 */
export const ScheduleSlotModel = {
  slotId: '',
  patientId: '',

  // Time info
  startTime: '',
  endTime: '',
  duration: 30,

  // Status
  status: 'Disponível', // 'Disponível', 'Agendado', 'Bloqueado', 'Concluído', 'Cancelado'

  // Details (filled when scheduled)
  patientName: '',
  patientPhone: '',
  appointmentType: '',
  appointmentReason: '',
  notes: '',

  createdAt: null
};

/**
 * Create a new appointment object with defaults
 * @param {Partial<Appointment>} data - Appointment data
 * @returns {Appointment} Appointment object
 */
export function createAppointment(data = {}) {
  return {
    ...AppointmentModel,
    ...data,
    consultationDate: data.consultationDate || new Date(),
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a schedule slot
 * @param {Partial<ScheduleSlot>} data - Slot data
 * @returns {ScheduleSlot} Schedule slot
 */
export function createScheduleSlot(data = {}) {
  return {
    ...ScheduleSlotModel,
    ...data,
    slotId: data.slotId || `slot_${Date.now()}`,
    createdAt: data.createdAt || new Date()
  };
}

/**
 * Validate appointment data
 * @param {Partial<Appointment>} data - Appointment data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAppointment(data) {
  const errors = [];

  if (!data.patientId && !data.patientName) {
    errors.push('Paciente é obrigatório');
  }

  if (!data.consultationDate) {
    errors.push('Data da consulta é obrigatória');
  }

  if (!data.consultationTime) {
    errors.push('Horário da consulta é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get appointment status color
 * @param {string} status - Appointment status
 * @returns {string} MUI color name
 */
export function getStatusColor(status) {
  const colors = {
    'Agendada': 'info',
    'Em Andamento': 'warning',
    'Concluída': 'success',
    'Cancelada': 'error',
    'Faltou': 'error'
  };
  return colors[status] || 'default';
}

export default AppointmentModel;
