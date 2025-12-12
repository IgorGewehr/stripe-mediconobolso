/**
 * Exams Service
 *
 * Handles exam management operations.
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

class ExamsService extends BaseService {
  /**
   * List exams for a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>}
   */
  async listExams(doctorId, patientId) {
    try {
      const q = query(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'exams'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const exams = [];
      snapshot.forEach(docSnap => {
        exams.push({ id: docSnap.id, ...docSnap.data() });
      });
      return exams;
    } catch (error) {
      console.error('[ExamsService] Error listing exams:', error);
      return [];
    }
  }

  /**
   * Get a specific exam
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} examId - Exam ID
   * @returns {Promise<Object|null>}
   */
  async getExam(doctorId, patientId, examId) {
    try {
      const docSnap = await getDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'exams', examId)
      );
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getExam');
    }
  }

  /**
   * Create an exam
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} examData - Exam data
   * @returns {Promise<string>} New exam ID
   */
  async createExam(doctorId, patientId, examData) {
    try {
      const examRef = doc(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'exams')
      );
      const newExam = {
        ...examData,
        id: examRef.id,
        attachments: examData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(examRef, newExam);
      return examRef.id;
    } catch (error) {
      this.handleError(error, 'createExam');
    }
  }

  /**
   * Update an exam
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} examId - Exam ID
   * @param {Object} examData - Updated data
   * @returns {Promise<boolean>}
   */
  async updateExam(doctorId, patientId, examId, examData) {
    try {
      const examRef = doc(this.firestore, 'users', doctorId, 'patients', patientId, 'exams', examId);
      await updateDoc(examRef, {
        ...examData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updateExam');
    }
  }

  /**
   * Delete an exam
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} examId - Exam ID
   * @returns {Promise<boolean>}
   */
  async deleteExam(doctorId, patientId, examId) {
    try {
      // Get exam to delete attachments
      const examData = await this.getExam(doctorId, patientId, examId);
      if (examData?.resultFileUrl) {
        await storageService.deleteFile(examData.resultFileUrl);
      }
      if (examData?.attachments) {
        for (const attachment of examData.attachments) {
          if (attachment.fileUrl) {
            await storageService.deleteFile(attachment.fileUrl);
          }
        }
      }

      await deleteDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'exams', examId)
      );
      this.log('Exam deleted:', examId);
      return true;
    } catch (error) {
      this.handleError(error, 'deleteExam');
    }
  }

  /**
   * Upload exam attachment
   * @param {File} file - File to upload
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} Attachment info
   */
  async uploadExamAttachment(file, doctorId, patientId, examId) {
    try {
      const path = `users/${doctorId}/patients/${patientId}/exams/${examId}/${file.name}`;
      const fileUrl = await storageService.uploadFile(file, path);

      const attachmentInfo = {
        fileName: file.name,
        fileType: file.type,
        fileSize: this.formatFileSize(file.size),
        fileUrl,
        uploadedAt: new Date()
      };

      // Update exam with new attachment
      const examRef = doc(this.firestore, 'users', doctorId, 'patients', patientId, 'exams', examId);
      const examDoc = await getDoc(examRef);

      if (examDoc.exists()) {
        const examData = examDoc.data();
        const attachments = examData.attachments || [];
        await updateDoc(examRef, {
          attachments: [...attachments, attachmentInfo],
          updatedAt: new Date()
        });
      }

      return attachmentInfo;
    } catch (error) {
      this.handleError(error, 'uploadExamAttachment');
    }
  }

  /**
   * Remove exam attachment
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} examId - Exam ID
   * @param {string} attachmentUrl - Attachment URL to remove
   * @param {number} attachmentIndex - Index in attachments array
   * @returns {Promise<boolean>}
   */
  async removeExamAttachment(doctorId, patientId, examId, attachmentUrl, attachmentIndex) {
    try {
      await storageService.deleteFile(attachmentUrl);

      const examRef = doc(this.firestore, 'users', doctorId, 'patients', patientId, 'exams', examId);
      const examDoc = await getDoc(examRef);

      if (examDoc.exists()) {
        const examData = examDoc.data();
        const attachments = examData.attachments || [];
        attachments.splice(attachmentIndex, 1);
        await updateDoc(examRef, {
          attachments,
          updatedAt: new Date()
        });
      }

      return true;
    } catch (error) {
      this.handleError(error, 'removeExamAttachment');
    }
  }
}

export const examsService = new ExamsService();
export default examsService;
