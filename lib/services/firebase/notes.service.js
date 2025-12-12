/**
 * Notes Service
 *
 * Handles notes and anamnesis operations.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { BaseService } from './base.service';
import { storageService } from './storage.service';

class NotesService extends BaseService {
  // ==========================================
  // ANAMNESIS
  // ==========================================

  /**
   * List anamneses for a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async listAnamneses(doctorId, patientId) {
    try {
      const q = query(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'anamneses'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const anamneses = [];
      snapshot.forEach(docSnap => {
        anamneses.push({ id: docSnap.id, ...docSnap.data() });
      });
      return anamneses;
    } catch (error) {
      console.error('[NotesService] Error listing anamneses:', error);
      return [];
    }
  }

  /**
   * Create anamnesis
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} anamnesis - Anamnesis data
   * @returns {Promise<string>} New anamnesis ID
   */
  async createAnamnese(doctorId, patientId, anamnesis) {
    try {
      const anamneseRef = doc(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'anamneses')
      );
      const newAnamnese = {
        ...anamnesis,
        id: anamneseRef.id,
        createdAt: new Date()
      };
      await setDoc(anamneseRef, newAnamnese);
      return anamneseRef.id;
    } catch (error) {
      this.handleError(error, 'createAnamnese');
    }
  }

  /**
   * Update anamnesis
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} anamneseId - Anamnesis ID
   * @param {Object} anamnesis - Updated data
   * @returns {Promise<boolean>}
   */
  async updateAnamnese(doctorId, patientId, anamneseId, anamnesis) {
    try {
      const anamneseRef = doc(
        this.firestore, 'users', doctorId, 'patients', patientId, 'anamneses', anamneseId
      );
      await updateDoc(anamneseRef, {
        ...anamnesis,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updateAnamnese');
    }
  }

  /**
   * Get anamnesis
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} anamneseId - Anamnesis ID
   * @returns {Promise<Object|null>}
   */
  async getAnamnese(doctorId, patientId, anamneseId) {
    try {
      const docSnap = await getDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'anamneses', anamneseId)
      );
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getAnamnese');
    }
  }

  // ==========================================
  // NOTES
  // ==========================================

  /**
   * List notes for a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async listNotes(doctorId, patientId) {
    try {
      const q = query(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'notes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const notes = [];
      snapshot.forEach(docSnap => {
        notes.push({ id: docSnap.id, ...docSnap.data() });
      });
      return notes;
    } catch (error) {
      console.error('[NotesService] Error listing notes:', error);
      return [];
    }
  }

  /**
   * Get a note
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object|null>}
   */
  async getNote(doctorId, patientId, noteId) {
    try {
      const docSnap = await getDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'notes', noteId)
      );
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getNote');
    }
  }

  /**
   * Create a note
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} noteData - Note data
   * @returns {Promise<string>} New note ID
   */
  async createNote(doctorId, patientId, noteData) {
    try {
      const noteRef = doc(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'notes')
      );
      const newNote = {
        ...noteData,
        id: noteRef.id,
        attachments: noteData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(noteRef, newNote);
      return noteRef.id;
    } catch (error) {
      this.handleError(error, 'createNote');
    }
  }

  /**
   * Update a note
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} noteId - Note ID
   * @param {Object} noteData - Updated data
   * @returns {Promise<boolean>}
   */
  async updateNote(doctorId, patientId, noteId, noteData) {
    try {
      const noteRef = doc(
        this.firestore, 'users', doctorId, 'patients', patientId, 'notes', noteId
      );
      await updateDoc(noteRef, {
        ...noteData,
        lastModified: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updateNote');
    }
  }

  /**
   * Delete a note
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} noteId - Note ID
   * @returns {Promise<boolean>}
   */
  async deleteNote(doctorId, patientId, noteId) {
    try {
      // Get note to delete attachments
      const noteData = await this.getNote(doctorId, patientId, noteId);
      if (noteData?.attachments) {
        for (const attachment of noteData.attachments) {
          if (attachment.fileUrl) {
            await storageService.deleteFile(attachment.fileUrl);
          }
        }
      }

      await deleteDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'notes', noteId)
      );
      this.log('Note deleted:', noteId);
      return true;
    } catch (error) {
      this.handleError(error, 'deleteNote');
    }
  }

  /**
   * Upload note attachment
   * @param {File} file - File to upload
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Attachment info
   */
  async uploadNoteAttachment(file, doctorId, patientId, noteId) {
    try {
      const path = `users/${doctorId}/patients/${patientId}/notes/${noteId}/${file.name}`;
      const fileUrl = await storageService.uploadFile(file, path);

      const attachmentInfo = {
        fileName: file.name,
        fileType: file.type,
        fileSize: this.formatFileSize(file.size),
        fileUrl,
        uploadedAt: new Date()
      };

      // Update note with new attachment
      const noteRef = doc(this.firestore, 'users', doctorId, 'patients', patientId, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        const attachments = noteData.attachments || [];
        await updateDoc(noteRef, {
          attachments: [...attachments, attachmentInfo],
          lastModified: new Date()
        });
      }

      return attachmentInfo;
    } catch (error) {
      this.handleError(error, 'uploadNoteAttachment');
    }
  }

  /**
   * Remove note attachment
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} noteId - Note ID
   * @param {string} attachmentUrl - Attachment URL
   * @param {number} attachmentIndex - Index in array
   * @returns {Promise<boolean>}
   */
  async removeNoteAttachment(doctorId, patientId, noteId, attachmentUrl, attachmentIndex) {
    try {
      await storageService.deleteFile(attachmentUrl);

      const noteRef = doc(this.firestore, 'users', doctorId, 'patients', patientId, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        const attachments = noteData.attachments || [];
        attachments.splice(attachmentIndex, 1);
        await updateDoc(noteRef, {
          attachments,
          lastModified: new Date()
        });
      }

      return true;
    } catch (error) {
      this.handleError(error, 'removeNoteAttachment');
    }
  }
}

export const notesService = new NotesService();
export default notesService;
