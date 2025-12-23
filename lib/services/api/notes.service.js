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
   */
  async markAsImportant(noteId, isImportant) {
    const response = await apiService.put(`${NOTES_ENDPOINT}/${noteId}/important`, {
      importante: isImportant,
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
 */
function normalizeNote(note) {
  if (!note) return null;

  return {
    id: note.id,
    patientId: note.paciente_id,
    patientName: note.paciente_nome,
    // Conteúdo
    title: note.titulo,
    content: note.conteudo,
    noteType: note.tipo_nota,
    // Organização
    tags: note.tags || [],
    priority: note.prioridade,
    isImportant: note.importante,
    // Anexos
    attachments: (note.anexos || []).map((a) => ({
      id: a.id,
      fileName: a.nome_arquivo,
      fileType: a.tipo_arquivo,
      fileSize: a.tamanho,
      fileUrl: a.url,
      uploadedAt: a.uploaded_at,
    })),
    // Timestamps
    lastModified: note.ultima_modificacao,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

/**
 * Denormaliza dados da nota do frontend para o backend
 */
function denormalizeNote(note) {
  const payload = {};

  if (note.title !== undefined) payload.titulo = note.title;
  if (note.content !== undefined) payload.conteudo = note.content;
  if (note.noteType !== undefined) payload.tipo_nota = note.noteType;
  if (note.tags !== undefined) payload.tags = note.tags;
  if (note.priority !== undefined) payload.prioridade = note.priority;
  if (note.isImportant !== undefined) payload.importante = note.isImportant;

  return payload;
}

/**
 * Normaliza dados da anamnese do backend para o frontend
 */
function normalizeAnamnese(anamnese) {
  if (!anamnese) return null;

  return {
    id: anamnese.id,
    patientId: anamnese.paciente_id,
    patientName: anamnese.paciente_nome,
    // Queixa principal
    chiefComplaint: anamnese.queixa_principal,
    historyOfPresentIllness: anamnese.historia_doenca_atual,
    // Históricos
    pastMedicalHistory: anamnese.antecedentes_pessoais,
    familyHistory: anamnese.antecedentes_familiares,
    socialHistory: anamnese.habitos_vida,
    // Review of systems
    reviewOfSystems: anamnese.revisao_sistemas,
    // Exame físico
    physicalExamination: anamnese.exame_fisico,
    // Hipótese diagnóstica
    diagnosticHypothesis: anamnese.hipotese_diagnostica,
    // Conduta
    plan: anamnese.conduta,
    // Sinais vitais
    vitalSigns: anamnese.sinais_vitais,
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

  if (anamnese.chiefComplaint !== undefined) payload.queixa_principal = anamnese.chiefComplaint;
  if (anamnese.historyOfPresentIllness !== undefined) payload.historia_doenca_atual = anamnese.historyOfPresentIllness;
  if (anamnese.pastMedicalHistory !== undefined) payload.antecedentes_pessoais = anamnese.pastMedicalHistory;
  if (anamnese.familyHistory !== undefined) payload.antecedentes_familiares = anamnese.familyHistory;
  if (anamnese.socialHistory !== undefined) payload.habitos_vida = anamnese.socialHistory;
  if (anamnese.reviewOfSystems !== undefined) payload.revisao_sistemas = anamnese.reviewOfSystems;
  if (anamnese.physicalExamination !== undefined) payload.exame_fisico = anamnese.physicalExamination;
  if (anamnese.diagnosticHypothesis !== undefined) payload.hipotese_diagnostica = anamnese.diagnosticHypothesis;
  if (anamnese.plan !== undefined) payload.conduta = anamnese.plan;
  if (anamnese.vitalSigns !== undefined) payload.sinais_vitais = anamnese.vitalSigns;

  return payload;
}

export default notesService;
