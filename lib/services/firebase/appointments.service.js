/**
 * Appointments Service
 *
 * Handles consultations and scheduling operations.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { BaseService } from './base.service';

class AppointmentsService extends BaseService {
  /**
   * List consultations for a specific patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} List of consultations
   */
  async listPatientConsultations(doctorId, patientId, options = {}) {
    try {
      const consultationsRef = collection(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'consultations'
      );

      const q = query(
        consultationsRef,
        orderBy('consultationDate', options.order || 'desc')
      );

      const querySnapshot = await getDocs(q);
      const consultations = [];

      querySnapshot.forEach(docSnap => {
        const consultation = this.processConsultationDates({
          id: docSnap.id,
          ...docSnap.data()
        });
        consultations.push(consultation);
      });

      return consultations;
    } catch (error) {
      console.error('[AppointmentsService] Error listing patient consultations:', error);
      return [];
    }
  }

  /**
   * List all consultations for a doctor
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} List of all consultations
   */
  async listAllConsultations(doctorId, options = {}) {
    try {
      let q = query(
        collectionGroup(this.firestore, 'consultations'),
        where('doctorId', '==', doctorId)
      );

      q = query(q, orderBy('consultationDate', options.order || 'desc'));

      const querySnapshot = await getDocs(q);
      const consultations = [];

      querySnapshot.forEach(docSnap => {
        const consultation = this.processConsultationDates({
          id: docSnap.id,
          ...docSnap.data()
        });
        consultations.push(consultation);
      });

      return consultations;
    } catch (error) {
      console.error('[AppointmentsService] Error listing all consultations:', error);
      return [];
    }
  }

  /**
   * Create a new consultation
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} consultation - Consultation data
   * @returns {Promise<string>} New consultation ID
   */
  async createConsultation(doctorId, patientId, consultation) {
    try {
      const consultationRef = doc(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'consultations')
      );

      let consultationDateStr = consultation.consultationDate;
      if (typeof consultationDateStr !== 'string') {
        consultationDateStr = this.formatDate(consultation.consultationDate);
      }

      const dataToSave = {
        ...consultation,
        id: consultationRef.id,
        createdAt: new Date(),
        doctorId,
        consultationDate: consultationDateStr
      };

      await setDoc(consultationRef, dataToSave);

      // Update patient's last consultation date
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      await updateDoc(patientRef, {
        lastConsultationDate: dataToSave.consultationDate
      });

      return consultationRef.id;
    } catch (error) {
      this.handleError(error, 'createConsultation');
    }
  }

  /**
   * Update a consultation
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} consultationId - Consultation ID
   * @param {Object} consultation - Updated data
   * @returns {Promise<boolean>}
   */
  async updateConsultation(doctorId, patientId, consultationId, consultation) {
    try {
      const consultationRef = doc(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'consultations',
        consultationId
      );

      const updatedData = {
        ...consultation,
        updatedAt: new Date()
      };

      if (consultation.consultationDate != null) {
        updatedData.consultationDate = this.formatDate(consultation.consultationDate);
      } else {
        delete updatedData.consultationDate;
      }

      await updateDoc(consultationRef, updatedData);
      return true;
    } catch (error) {
      this.handleError(error, 'updateConsultation');
    }
  }

  /**
   * Get a specific consultation
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} consultationId - Consultation ID
   * @returns {Promise<Object|null>}
   */
  async getConsultation(doctorId, patientId, consultationId) {
    try {
      const docSnap = await getDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'consultations', consultationId)
      );
      return docSnap.exists() ? this.processConsultationDates({ id: docSnap.id, ...docSnap.data() }) : null;
    } catch (error) {
      this.handleError(error, 'getConsultation');
    }
  }
}

export const appointmentsService = new AppointmentsService();
export default appointmentsService;
