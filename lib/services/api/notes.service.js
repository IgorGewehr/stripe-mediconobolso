/**
 * Notes Service - Gerenciamento de Notas e Anamneses
 *
 * Substitui o Firebase notes.service.js
 */

import apiService from './apiService';

const NOTES_ENDPOINT = '/clinical/notes';
const ANAMNESE_ENDPOINT = '/clinical/anamneses';

/**
 * Serviço de Notas e Anamneses
 */
const notesService = {
  // =========================================================================
  // Notas Clínicas
  // =========================================================================

  /**
   * Listar notas de um paciente
   */
  async listNotesByPatient(patientId) {
    const response = await apiService.get(`${NOTES_ENDPOINT}/patient/${patientId}`);
    return response.items.map(normalizeNote);
  },

  /**
   * Buscar nota por ID
   */
  async getNoteById(noteId) {
    const response = await apiService.get(`${NOTES_ENDPOINT}/${noteId}`);
    return normalizeNote(response);
  },

  /**
   * Criar nova nota
   */
  async createNote(patientId, noteData) {
    const payload = denormalizeNote(noteData);
    payload.paciente_id = patientId;
    const response = await apiService.post(NOTES_ENDPOINT, payload);
    return normalizeNote(response);
  },

  /**
   * Atualizar nota
   */
  async updateNote(noteId, noteData) {
    const payload = denormalizeNote(noteData);
    const response = await apiService.put(`${NOTES_ENDPOINT}/${noteId}`, payload);
    return normalizeNote(response);
  },

  /**
   * Excluir nota
   */
  async deleteNote(patientId, noteId) {
    await apiService.delete(`${NOTES_ENDPOINT}/${noteId}`);
    return { success: true };
  },

  /**
   * Marcar nota como importante
   * Nota: Usa o endpoint de update geral da nota
   */
  async markAsImportant(noteId, isImportant) {
    const response = await apiService.put(`${NOTES_ENDPOINT}/${noteId}`, {
      is_important: isImportant,
    });
    return normalizeNote(response);
  },

  /**
   * Listar notas importantes de um paciente
   */
  async listImportantNotes(patientId) {
    const response = await apiService.get(`${NOTES_ENDPOINT}/patient/${patientId}/important`);
    return response.items.map(normalizeNote);
  },

  /**
   * Upload de anexo da nota
   */
  async uploadNoteAttachment(noteId, file) {
    return apiService.upload(`${NOTES_ENDPOINT}/${noteId}/attachments`, file);
  },

  /**
   * Remover anexo da nota
   */
  async removeNoteAttachment(noteId, attachmentId) {
    await apiService.delete(`${NOTES_ENDPOINT}/${noteId}/attachments/${attachmentId}`);
    return { success: true };
  },

  // =========================================================================
  // Anamneses
  // =========================================================================

  /**
   * Listar anamneses de um paciente
   */
  async listAnamneseByPatient(patientId) {
    const response = await apiService.get(`${ANAMNESE_ENDPOINT}/patient/${patientId}`);
    return response.items.map(normalizeAnamnese);
  },

  /**
   * Buscar última anamnese de um paciente
   */
  async getLatestAnamnese(patientId) {
    const response = await apiService.get(`${ANAMNESE_ENDPOINT}/patient/${patientId}/latest`);
    return normalizeAnamnese(response);
  },

  /**
   * Buscar anamnese por ID
   */
  async getAnamneseById(anamneseId) {
    const response = await apiService.get(`${ANAMNESE_ENDPOINT}/${anamneseId}`);
    return normalizeAnamnese(response);
  },

  /**
   * Criar nova anamnese
   */
  async createAnamnese(patientId, anamneseData) {
    const payload = denormalizeAnamnese(anamneseData);
    payload.paciente_id = patientId;
    const response = await apiService.post(ANAMNESE_ENDPOINT, payload);
    return normalizeAnamnese(response);
  },

  /**
   * Atualizar anamnese
   */
  async updateAnamnese(anamneseId, anamneseData) {
    const payload = denormalizeAnamnese(anamneseData);
    const response = await apiService.put(`${ANAMNESE_ENDPOINT}/${anamneseId}`, payload);
    return normalizeAnamnese(response);
  },

  // =========================================================================
  // Compatibilidade com Firebase
  // =========================================================================

  /**
   * @deprecated Use listNotesByPatient()
   */
  async listNotes(doctorId, patientId) {
    return this.listNotesByPatient(patientId);
  },

  /**
   * @deprecated Use listAnamneseByPatient()
   */
  async listAnamneses(doctorId, patientId) {
    return this.listAnamneseByPatient(patientId);
  },
};

/**
 * Normaliza dados da nota do backend para o frontend
 * O backend usa campos em inglês conforme NoteResponse
 */
function normalizeNote(note) {
  if (!note) return null;

  return {
    id: note.id,
    patientId: note.paciente_id,
    professionalId: note.profissional_id,
    // Conteúdo
    title: note.title,
    content: note.content,
    noteType: note.note_type,
    // Organização
    isImportant: note.is_important,
    consultationDate: note.consultation_date,
    // Anexos
    attachments: (note.attachments || []).map((id) => ({ id })),
    viewCount: note.view_count,
    // Timestamps
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

/**
 * Denormaliza dados da nota do frontend para o backend
 */
function denormalizeNote(note) {
  const payload = {};

  if (note.title !== undefined) payload.title = note.title;
  if (note.content !== undefined) payload.content = note.content;
  if (note.noteType !== undefined) payload.note_type = note.noteType;
  if (note.isImportant !== undefined) payload.is_important = note.isImportant;
  if (note.consultationDate !== undefined) payload.consultation_date = note.consultationDate;

  return payload;
}

/**
 * Normaliza dados da anamnese do backend para o frontend
 * Backend usa campos em inglês conforme AnamnesisResponse
 */
function normalizeAnamnese(anamnese) {
  if (!anamnese) return null;

  return {
    id: anamnese.id,
    patientId: anamnese.paciente_id,
    professionalId: anamnese.profissional_id,
    anamnesisDate: anamnese.anamnesis_date,
    // Queixa principal
    chiefComplaint: anamnese.chief_complaint,
    historyOfPresentIllness: anamnese.illness_history,
    // Históricos
    medicalHistory: anamnese.medical_history || [],
    surgicalHistory: anamnese.surgical_history || [],
    familyHistory: anamnese.family_history,
    socialHistory: anamnese.social_history || {},
    currentMedications: anamnese.current_medications || [],
    allergies: anamnese.allergies || [],
    // Review of systems
    reviewOfSystems: anamnese.systems_review || {},
    // Exame físico
    physicalExamination: anamnese.physical_exam || {},
    // Diagnóstico e plano
    diagnosis: anamnese.diagnosis,
    treatmentPlan: anamnese.treatment_plan,
    // Timestamps
    createdAt: anamnese.created_at,
    updatedAt: anamnese.updated_at,
  };
}

/**
 * Denormaliza dados da anamnese do frontend para o backend
 */
function denormalizeAnamnese(anamnese) {
  const payload = {};

  if (anamnese.chiefComplaint !== undefined) payload.chief_complaint = anamnese.chiefComplaint;
  if (anamnese.historyOfPresentIllness !== undefined) payload.illness_history = anamnese.historyOfPresentIllness;
  if (anamnese.medicalHistory !== undefined) payload.medical_history = anamnese.medicalHistory;
  if (anamnese.surgicalHistory !== undefined) payload.surgical_history = anamnese.surgicalHistory;
  if (anamnese.familyHistory !== undefined) payload.family_history = anamnese.familyHistory;
  if (anamnese.socialHistory !== undefined) payload.social_history = anamnese.socialHistory;
  if (anamnese.currentMedications !== undefined) payload.current_medications = anamnese.currentMedications;
  if (anamnese.allergies !== undefined) payload.allergies = anamnese.allergies;
  if (anamnese.reviewOfSystems !== undefined) payload.systems_review = anamnese.reviewOfSystems;
  if (anamnese.physicalExamination !== undefined) payload.physical_exam = anamnese.physicalExamination;
  if (anamnese.diagnosis !== undefined) payload.diagnosis = anamnese.diagnosis;
  if (anamnese.treatmentPlan !== undefined) payload.treatment_plan = anamnese.treatmentPlan;

  return payload;
}

export default notesService;
