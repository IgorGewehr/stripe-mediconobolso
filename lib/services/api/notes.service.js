/**
 * Notes Service - Gerenciamento de Notas e Anamneses
 *
 * Substitui o Firebase notes.service.js
 */

import apiService from './apiService';
import storageService from './storage.service';

const NOTES_ENDPOINT = '/clinical/notes';
const ANAMNESE_ENDPOINT = '/clinical/anamneses';
const STORAGE_ENDPOINT = '/storage';

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
    const notes = response.items.map(normalizeNote);
    // Enriquecer anexos com detalhes completos
    return Promise.all(notes.map((note) => this._enrichAttachments(note)));
  },

  /**
   * Buscar nota por ID
   */
  async getNoteById(noteId) {
    const response = await apiService.get(`${NOTES_ENDPOINT}/${noteId}`);
    const note = normalizeNote(response);
    // Enriquecer anexos com detalhes completos
    return this._enrichAttachments(note);
  },

  /**
   * Criar nova nota
   */
  async createNote(patientId, noteData) {
    const payload = denormalizeNote(noteData);
    payload.paciente_id = patientId;
    const response = await apiService.post(NOTES_ENDPOINT, payload);

    // Se houver anexos com arquivos File, fazer upload e vincular
    if (noteData.attachments && noteData.attachments.length > 0) {
      await this._processAttachments(response.id, patientId, noteData.attachments);
      // Re-buscar a nota para obter anexos atualizados e enriquecidos
      return this.getNoteById(response.id);
    }

    const note = normalizeNote(response);
    return this._enrichAttachments(note);
  },

  /**
   * Atualizar nota
   */
  async updateNote(noteId, noteData) {
    const payload = denormalizeNote(noteData);
    const response = await apiService.put(`${NOTES_ENDPOINT}/${noteId}`, payload);

    // Se houver novos anexos com arquivos File, fazer upload e vincular
    if (noteData.attachments && noteData.attachments.length > 0) {
      const newAttachments = noteData.attachments.filter((att) => att.file instanceof File);
      if (newAttachments.length > 0) {
        await this._processAttachments(noteId, response.paciente_id, newAttachments);
      }
    }

    // Re-buscar a nota para obter anexos atualizados e enriquecidos
    return this.getNoteById(noteId);
  },

  /**
   * Enriquecer anexos com detalhes completos do arquivo
   * @private
   */
  async _enrichAttachments(note) {
    if (!note || !note.attachments || note.attachments.length === 0) {
      return note;
    }

    const enrichedAttachments = await Promise.all(
      note.attachments.map(async (attachment) => {
        // Se já tem detalhes completos, retorna como está
        if (attachment.fileName || attachment.originalName || attachment.publicUrl) {
          return attachment;
        }

        // Se só tem o ID, busca os detalhes do arquivo
        const fileId = attachment.id || attachment;
        if (!fileId) return attachment;

        try {
          const fileDetails = await storageService.getFile(fileId);
          return {
            id: fileId,
            fileName: fileDetails.originalName,
            originalName: fileDetails.originalName,
            fileUrl: fileDetails.publicUrl,
            publicUrl: fileDetails.publicUrl,
            fileType: fileDetails.fileType,
            contentType: fileDetails.contentType,
            sizeBytes: fileDetails.sizeBytes,
            fileSize: formatFileSize(fileDetails.sizeBytes),
            category: fileDetails.category,
            createdAt: fileDetails.createdAt,
          };
        } catch (error) {
          console.warn(`[NotesService] Could not fetch attachment details for ${fileId}:`, error);
          return { id: fileId };
        }
      })
    );

    return {
      ...note,
      attachments: enrichedAttachments,
    };
  },

  /**
   * Processar e fazer upload de anexos
   * @private
   */
  async _processAttachments(noteId, patientId, attachments) {
    for (const attachment of attachments) {
      if (attachment.file instanceof File) {
        try {
          // Fazer upload do arquivo
          const uploadResponse = await storageService.uploadFile(attachment.file, {
            category: 'note_attachment',
            entityType: 'Note',
            entityId: noteId,
          });

          // Extrair o ID do arquivo da resposta ou do cache
          let fileId = null;
          if (typeof uploadResponse === 'object' && uploadResponse.id) {
            fileId = uploadResponse.id;
          } else if (typeof uploadResponse === 'string') {
            // Se retornou URL, precisamos obter o ID do último arquivo
            const files = await storageService.listEntityFiles('Note', noteId);
            const uploadedFile = files.find(
              (f) => f.originalName === attachment.file.name || f.originalName === attachment.fileName
            );
            if (uploadedFile) {
              fileId = uploadedFile.id;
            }
          }

          // Vincular arquivo à nota
          if (fileId) {
            await apiService.post(`${NOTES_ENDPOINT}/${noteId}/attachments`, {
              document_id: fileId,
            });
          }
        } catch (error) {
          console.error('[NotesService] Error uploading attachment:', error);
        }
      }
    }
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
    await apiService.put(`${NOTES_ENDPOINT}/${noteId}`, {
      is_important: isImportant,
    });
    // Re-buscar a nota para obter dados enriquecidos
    return this.getNoteById(noteId);
  },

  /**
   * Listar notas importantes de um paciente
   */
  async listImportantNotes(patientId) {
    const response = await apiService.get(`${NOTES_ENDPOINT}/patient/${patientId}/important`);
    const notes = response.items.map(normalizeNote);
    // Enriquecer anexos com detalhes completos
    return Promise.all(notes.map((note) => this._enrichAttachments(note)));
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
 * Mapeia tipos de nota do backend (snake_case) para o frontend (pt-BR)
 */
const NOTE_TYPE_TO_FRONTEND = {
  'quick': 'Rápida',
  'consultation': 'Consulta',
  'exam': 'Exame',
  'procedure': 'Procedimento',
  'evolution': 'Evolução',
  'intercurrence': 'Intercorrência',
  'prescription': 'Receita',
  'certificate': 'Atestado',
  'referral': 'Encaminhamento',
  'other': 'Outro',
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
    // Conteúdo - campos novos e legados para compatibilidade
    title: note.title,
    noteTitle: note.title, // Compatibilidade com ViewNoteDialog
    content: note.content,
    noteText: note.content, // Compatibilidade com ViewNoteDialog
    // Map note type from backend snake_case to Portuguese
    noteType: NOTE_TYPE_TO_FRONTEND[note.note_type] || note.note_type,
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
 * Mapeia tipos de nota do frontend (pt-BR) para o backend (snake_case)
 */
const NOTE_TYPE_TO_BACKEND = {
  'Rápida': 'quick',
  'Consulta': 'consultation',
  'Exame': 'exam',
  'Procedimento': 'procedure',
  'Evolução': 'evolution',
  'Intercorrência': 'intercurrence',
  'Receita': 'prescription',
  'Atestado': 'certificate',
  'Encaminhamento': 'referral',
  'Outro': 'other',
};

/**
 * Denormaliza dados da nota do frontend para o backend
 * Aceita tanto o formato novo (title/content) quanto o legado (noteTitle/noteText)
 */
function denormalizeNote(note) {
  const payload = {};

  // Handle both property naming conventions (new: title/content, legacy: noteTitle/noteText)
  const title = note.title ?? note.noteTitle;
  const content = note.content ?? note.noteText;

  if (title !== undefined) payload.title = title;
  if (content !== undefined) payload.content = content || ''; // Ensure content is always a string

  // Map note type from Portuguese to backend snake_case
  if (note.noteType !== undefined) {
    payload.note_type = NOTE_TYPE_TO_BACKEND[note.noteType] || note.noteType;
  }

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

  // Mapeamentos corrigidos para bater com AnamneseDialog.jsx
  if (anamnese.illnessHistory !== undefined) payload.illness_history = anamnese.illnessHistory;
  if (anamnese.historyOfPresentIllness !== undefined) payload.illness_history = anamnese.historyOfPresentIllness; // Compatibilidade duplicada

  if (anamnese.medicalHistory !== undefined) payload.medical_history = anamnese.medicalHistory;
  if (anamnese.surgicalHistory !== undefined) payload.surgical_history = anamnese.surgicalHistory;
  if (anamnese.familyHistory !== undefined) payload.family_history = anamnese.familyHistory;
  if (anamnese.socialHistory !== undefined) payload.social_history = anamnese.socialHistory;
  if (anamnese.currentMedications !== undefined) payload.current_medications = anamnese.currentMedications;
  if (anamnese.allergies !== undefined) payload.allergies = anamnese.allergies;

  if (anamnese.systemsReview !== undefined) payload.systems_review = anamnese.systemsReview;
  if (anamnese.reviewOfSystems !== undefined) payload.systems_review = anamnese.reviewOfSystems; // Compatibilidade duplicada

  if (anamnese.physicalExam !== undefined) payload.physical_exam = anamnese.physicalExam;
  if (anamnese.physicalExamination !== undefined) payload.physical_exam = anamnese.physicalExamination; // Compatibilidade duplicada

  if (anamnese.diagnosis !== undefined) payload.diagnosis = anamnese.diagnosis;
  if (anamnese.treatmentPlan !== undefined) payload.treatment_plan = anamnese.treatmentPlan;

  console.log('[NotesService] Payload Anamnese Denormalizado:', payload);
  return payload;
}

/**
 * Formata tamanho de arquivo em bytes para string legível
 */
function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) return '';
  if (sizeInBytes < 1024) {
    return sizeInBytes + ' bytes';
  } else if (sizeInBytes < 1024 * 1024) {
    return (sizeInBytes / 1024).toFixed(1) + 'KB';
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
  } else {
    return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
  }
}

export default notesService;
