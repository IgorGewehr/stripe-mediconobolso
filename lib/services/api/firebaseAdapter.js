/**
 * Firebase Adapter - Compatibilidade com código legado
 *
 * Este adapter permite que componentes que ainda usam a interface do FirebaseService
 * continuem funcionando enquanto os dados vêm do novo doctor-server.
 *
 * NOTA: Este é um adaptador de transição. Novos componentes devem usar
 * diretamente os hooks (usePatients, useAppointments, etc.) ou os services da API.
 */

import patientsService from './patients.service';
import appointmentsService from './appointments.service';
import prescriptionsService from './prescriptions.service';
import examsService from './exams.service';
import notesService from './notes.service';
import secretaryService from './secretary.service';

/**
 * Adapter que imita a interface do FirebaseService
 * mas usa os novos services da API do doctor-server
 */
const FirebaseAdapter = {
  // =========================================================================
  // Pacientes
  // =========================================================================

  /**
   * Listar pacientes
   * @deprecated Use usePatients hook ou patientsService.list()
   */
  async listPatients(doctorId, options = {}) {
    try {
      const response = await patientsService.list({
        search: options.search,
        includeInactive: options.includeInactive,
      });
      // Converter para formato esperado pelos componentes legados
      return response.items.map(convertPatientToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing patients:', error);
      return [];
    }
  },

  /**
   * Buscar paciente por ID
   * @deprecated Use usePatients hook ou patientsService.getById()
   */
  async getPatientDetails(doctorId, patientId) {
    try {
      const patient = await patientsService.getById(patientId);
      return convertPatientToLegacy(patient);
    } catch (error) {
      console.error('[FirebaseAdapter] Error getting patient:', error);
      return null;
    }
  },

  /**
   * Criar paciente
   * @deprecated Use usePatients hook ou patientsService.create()
   */
  async addPatient(doctorId, patientData) {
    try {
      const newData = convertLegacyToPatient(patientData);
      const patient = await patientsService.create(newData);
      return convertPatientToLegacy(patient);
    } catch (error) {
      console.error('[FirebaseAdapter] Error adding patient:', error);
      throw error;
    }
  },

  /**
   * Atualizar paciente
   * @deprecated Use usePatients hook ou patientsService.update()
   */
  async updatePatient(doctorId, patientId, patientData) {
    try {
      const newData = convertLegacyToPatient(patientData);
      const patient = await patientsService.update(patientId, newData);
      return convertPatientToLegacy(patient);
    } catch (error) {
      console.error('[FirebaseAdapter] Error updating patient:', error);
      throw error;
    }
  },

  /**
   * Excluir paciente
   * @deprecated Use usePatients hook ou patientsService.delete()
   */
  async deletePatient(doctorId, patientId) {
    try {
      await patientsService.delete(patientId);
      return { success: true };
    } catch (error) {
      console.error('[FirebaseAdapter] Error deleting patient:', error);
      throw error;
    }
  },

  /**
   * Atualizar status do paciente
   * @deprecated Use usePatients hook ou patientsService.updateStatus()
   */
  async updatePatientStatus(doctorId, patientId, statusList) {
    try {
      const status = Array.isArray(statusList) ? statusList[0] : statusList;
      const patient = await patientsService.updateStatus(patientId, status);
      return convertPatientToLegacy(patient);
    } catch (error) {
      console.error('[FirebaseAdapter] Error updating patient status:', error);
      throw error;
    }
  },

  /**
   * Obter histórico de status
   * @deprecated Use usePatients hook ou patientsService.getStatusHistory()
   */
  async getPatientStatusHistory(doctorId, patientId) {
    try {
      return await patientsService.getStatusHistory(patientId);
    } catch (error) {
      console.error('[FirebaseAdapter] Error getting status history:', error);
      return [];
    }
  },

  /**
   * Adicionar ao histórico de status
   * @deprecated Use usePatients hook ou patientsService.addStatusHistory()
   */
  async addPatientStatusHistory(doctorId, patientId, status, notes) {
    try {
      return await patientsService.addStatusHistory(patientId, status, notes);
    } catch (error) {
      console.error('[FirebaseAdapter] Error adding status history:', error);
      throw error;
    }
  },

  /**
   * Atualizar favorito
   * @deprecated Use usePatients hook ou patientsService.updateFavorite()
   */
  async updatePatientFavorite(doctorId, patientId, isFavorite) {
    try {
      await patientsService.updateFavorite(patientId, isFavorite);
      return { success: true };
    } catch (error) {
      console.error('[FirebaseAdapter] Error updating favorite:', error);
      throw error;
    }
  },

  // =========================================================================
  // Agendamentos / Consultas
  // =========================================================================

  /**
   * Listar todas as consultas
   * @deprecated Use useAppointments hook ou appointmentsService.list()
   */
  async listAllConsultations(doctorId, options = {}) {
    try {
      const response = await appointmentsService.list(options);
      return response.items.map(convertAppointmentToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing consultations:', error);
      return [];
    }
  },

  /**
   * Listar consultas do paciente
   * @deprecated Use useAppointments hook ou appointmentsService.getByPatient()
   */
  async listPatientConsultations(doctorId, patientId, options = {}) {
    try {
      const appointments = await appointmentsService.getByPatient(patientId);
      return appointments.map(convertAppointmentToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing patient consultations:', error);
      return [];
    }
  },

  /**
   * Criar consulta
   * @deprecated Use useAppointments hook ou appointmentsService.create()
   */
  async addConsultation(doctorId, consultationData) {
    try {
      const newData = convertLegacyToAppointment(consultationData);
      const appointment = await appointmentsService.create(newData);
      return convertAppointmentToLegacy(appointment);
    } catch (error) {
      console.error('[FirebaseAdapter] Error adding consultation:', error);
      throw error;
    }
  },

  /**
   * Atualizar consulta
   * @deprecated Use useAppointments hook ou appointmentsService.update()
   */
  async updateConsultation(doctorId, consultationId, consultationData) {
    try {
      const newData = convertLegacyToAppointment(consultationData);
      const appointment = await appointmentsService.update(consultationId, newData);
      return convertAppointmentToLegacy(appointment);
    } catch (error) {
      console.error('[FirebaseAdapter] Error updating consultation:', error);
      throw error;
    }
  },

  /**
   * Excluir consulta
   * @deprecated Use useAppointments hook ou appointmentsService.delete()
   */
  async deleteConsultation(doctorId, consultationId) {
    try {
      await appointmentsService.delete(consultationId);
      return { success: true };
    } catch (error) {
      console.error('[FirebaseAdapter] Error deleting consultation:', error);
      throw error;
    }
  },

  // =========================================================================
  // Prescrições
  // =========================================================================

  /**
   * Listar prescrições
   * @deprecated Use usePrescriptions hook ou prescriptionsService.list()
   */
  async listPrescriptionsWithDetails(doctorId, limit = 50) {
    try {
      const response = await prescriptionsService.list({ perPage: limit });
      return response.items.map(convertPrescriptionToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing prescriptions:', error);
      return [];
    }
  },

  /**
   * Criar prescrição
   * @deprecated Use usePrescriptions hook ou prescriptionsService.create()
   */
  async addPrescription(doctorId, patientId, prescriptionData) {
    try {
      const newData = convertLegacyToPrescription(prescriptionData);
      const prescription = await prescriptionsService.create(patientId, newData);
      return convertPrescriptionToLegacy(prescription);
    } catch (error) {
      console.error('[FirebaseAdapter] Error adding prescription:', error);
      throw error;
    }
  },

  // =========================================================================
  // Exames
  // =========================================================================

  /**
   * Listar exames do paciente
   * @deprecated Use useExams hook ou examsService.listByPatient()
   */
  async listExams(doctorId, patientId) {
    try {
      const exams = await examsService.listByPatient(patientId);
      return exams.map(convertExamToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing exams:', error);
      return [];
    }
  },

  /**
   * Criar exame
   * @deprecated Use useExams hook ou examsService.create()
   */
  async createExam(doctorId, patientId, examData) {
    try {
      const exam = await examsService.create(patientId, examData);
      return convertExamToLegacy(exam);
    } catch (error) {
      console.error('[FirebaseAdapter] Error creating exam:', error);
      throw error;
    }
  },

  // =========================================================================
  // Notas e Anamnese
  // =========================================================================

  /**
   * Listar notas do paciente
   * @deprecated Use useNotes hook ou notesService.listNotesByPatient()
   */
  async listNotes(doctorId, patientId) {
    try {
      const notes = await notesService.listNotesByPatient(patientId);
      return notes.map(convertNoteToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing notes:', error);
      return [];
    }
  },

  /**
   * Listar anamneses do paciente
   * @deprecated Use useNotes hook ou notesService.listAnamneseByPatient()
   */
  async listAnamneses(doctorId, patientId) {
    try {
      const anamneses = await notesService.listAnamneseByPatient(patientId);
      return anamneses.map(convertAnamneseToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing anamneses:', error);
      return [];
    }
  },

  // =========================================================================
  // Secretárias
  // =========================================================================

  /**
   * Listar secretárias
   * @deprecated Use useSecretary hook ou secretaryService.list()
   */
  async listDoctorSecretaries(doctorId, includeInactive = false) {
    try {
      const secretaries = await secretaryService.list(includeInactive);
      return secretaries.map(convertSecretaryToLegacy);
    } catch (error) {
      console.error('[FirebaseAdapter] Error listing secretaries:', error);
      return [];
    }
  },

  /**
   * Criar secretária
   * @deprecated Use useSecretary hook ou secretaryService.create()
   */
  async createSecretaryAccount(doctorId, secretaryData) {
    try {
      const secretary = await secretaryService.create(secretaryData);
      return convertSecretaryToLegacy(secretary);
    } catch (error) {
      console.error('[FirebaseAdapter] Error creating secretary:', error);
      throw error;
    }
  },
};

// =========================================================================
// Funções de Conversão: Novo formato -> Legado (camelCase -> patientName, etc.)
// =========================================================================

function convertPatientToLegacy(patient) {
  if (!patient) return null;

  return {
    id: patient.id,
    // Campos legados esperados pelos componentes
    patientName: patient.name,
    patientEmail: patient.email,
    patientPhone: patient.phone,
    patientCPF: patient.cpf,
    patientRG: patient.rg,
    patientPhotoUrl: patient.photoUrl,
    // Dados pessoais
    birthDate: patient.birthDate,
    gender: patient.gender,
    maritalStatus: patient.maritalStatus,
    profession: patient.profession,
    // Endereço
    address: patient.address,
    city: patient.city,
    state: patient.state,
    zipCode: patient.zipCode,
    // Dados médicos
    bloodType: patient.bloodType,
    height: patient.height,
    weight: patient.weight,
    allergies: patient.allergies,
    chronicDiseases: patient.chronicDiseases,
    medications: patient.medications,
    // Status e favoritos
    statusList: patient.status ? [patient.status] : [],
    favorite: patient.isFavorite,
    isActive: patient.isActive,
    // Consultas
    lastConsultationDate: patient.lastAppointment,
    nextConsultationDate: patient.nextAppointment,
    // Timestamps
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    // Manter o objeto original para acesso a campos adicionais
    _original: patient,
  };
}

function convertLegacyToPatient(legacy) {
  const patient = {};

  if (legacy.patientName !== undefined) patient.name = legacy.patientName;
  if (legacy.patientEmail !== undefined) patient.email = legacy.patientEmail;
  if (legacy.patientPhone !== undefined) patient.phone = legacy.patientPhone;
  if (legacy.patientCPF !== undefined) patient.cpf = legacy.patientCPF;
  if (legacy.patientRG !== undefined) patient.rg = legacy.patientRG;
  if (legacy.birthDate !== undefined) patient.birthDate = legacy.birthDate;
  if (legacy.gender !== undefined) patient.gender = legacy.gender;
  if (legacy.maritalStatus !== undefined) patient.maritalStatus = legacy.maritalStatus;
  if (legacy.profession !== undefined) patient.profession = legacy.profession;
  if (legacy.address !== undefined) patient.address = legacy.address;
  if (legacy.city !== undefined) patient.city = legacy.city;
  if (legacy.state !== undefined) patient.state = legacy.state;
  if (legacy.zipCode !== undefined) patient.zipCode = legacy.zipCode;
  if (legacy.bloodType !== undefined) patient.bloodType = legacy.bloodType;
  if (legacy.height !== undefined) patient.height = legacy.height;
  if (legacy.weight !== undefined) patient.weight = legacy.weight;
  if (legacy.allergies !== undefined) patient.allergies = legacy.allergies;
  if (legacy.chronicDiseases !== undefined) patient.chronicDiseases = legacy.chronicDiseases;
  if (legacy.medications !== undefined) patient.medications = legacy.medications;

  return patient;
}

function convertAppointmentToLegacy(appointment) {
  if (!appointment) return null;

  return {
    id: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    // Datas
    consultationDate: appointment.startTime,
    consultationEndDate: appointment.endTime,
    // Detalhes
    consultationType: appointment.type,
    status: appointment.status,
    notes: appointment.notes,
    // Telemedicina
    isTelemedicine: appointment.isTelemedicine,
    telemedicineLink: appointment.telemedicineLink,
    // Financeiro
    value: appointment.value,
    paid: appointment.paid,
    // Timestamps
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    _original: appointment,
  };
}

function convertLegacyToAppointment(legacy) {
  const appointment = {};

  if (legacy.patientId !== undefined) appointment.patientId = legacy.patientId;
  if (legacy.consultationDate !== undefined) appointment.startTime = legacy.consultationDate;
  if (legacy.consultationEndDate !== undefined) appointment.endTime = legacy.consultationEndDate;
  if (legacy.consultationType !== undefined) appointment.type = legacy.consultationType;
  if (legacy.notes !== undefined) appointment.notes = legacy.notes;
  if (legacy.isTelemedicine !== undefined) appointment.isTelemedicine = legacy.isTelemedicine;
  if (legacy.telemedicineLink !== undefined) appointment.telemedicineLink = legacy.telemedicineLink;
  if (legacy.value !== undefined) appointment.value = legacy.value;

  return appointment;
}

function convertPrescriptionToLegacy(prescription) {
  if (!prescription) return null;

  return {
    id: prescription.id,
    patientId: prescription.patientId,
    patientName: prescription.patientName,
    prescriptionDate: prescription.prescriptionDate,
    medications: prescription.medications,
    status: prescription.status,
    isSigned: prescription.isSigned,
    createdAt: prescription.createdAt,
    _original: prescription,
  };
}

function convertLegacyToPrescription(legacy) {
  const prescription = {};

  if (legacy.prescriptionDate !== undefined) prescription.prescriptionDate = legacy.prescriptionDate;
  if (legacy.medications !== undefined) prescription.medications = legacy.medications;
  if (legacy.diagnosis !== undefined) prescription.diagnosis = legacy.diagnosis;
  if (legacy.notes !== undefined) prescription.notes = legacy.notes;

  return prescription;
}

function convertExamToLegacy(exam) {
  if (!exam) return null;

  return {
    id: exam.id,
    patientId: exam.patientId,
    examName: exam.examName,
    examType: exam.examType,
    examinationDate: exam.examinationDate,
    result: exam.result,
    status: exam.status,
    createdAt: exam.createdAt,
    _original: exam,
  };
}

function convertNoteToLegacy(note) {
  if (!note) return null;

  return {
    id: note.id,
    patientId: note.patientId,
    title: note.title,
    content: note.content,
    noteType: note.noteType,
    isImportant: note.isImportant,
    createdAt: note.createdAt,
    _original: note,
  };
}

function convertAnamneseToLegacy(anamnese) {
  if (!anamnese) return null;

  return {
    id: anamnese.id,
    patientId: anamnese.patientId,
    chiefComplaint: anamnese.chiefComplaint,
    historyOfPresentIllness: anamnese.historyOfPresentIllness,
    pastMedicalHistory: anamnese.pastMedicalHistory,
    familyHistory: anamnese.familyHistory,
    createdAt: anamnese.createdAt,
    _original: anamnese,
  };
}

function convertSecretaryToLegacy(secretary) {
  if (!secretary) return null;

  return {
    id: secretary.id,
    name: secretary.name,
    email: secretary.email,
    phone: secretary.phone,
    isActive: secretary.isActive,
    permissions: secretary.permissions,
    createdAt: secretary.createdAt,
    _original: secretary,
  };
}

export default FirebaseAdapter;

// Exportar também as funções de conversão para uso externo
export {
  convertPatientToLegacy,
  convertLegacyToPatient,
  convertAppointmentToLegacy,
  convertLegacyToAppointment,
  convertPrescriptionToLegacy,
  convertLegacyToPrescription,
  convertExamToLegacy,
  convertNoteToLegacy,
  convertAnamneseToLegacy,
  convertSecretaryToLegacy,
};
