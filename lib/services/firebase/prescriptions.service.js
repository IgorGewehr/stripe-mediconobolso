/**
 * Prescriptions Service
 *
 * Handles prescriptions and medications operations.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as limitFn
} from 'firebase/firestore';
import { BaseService } from './base.service';

class PrescriptionsService extends BaseService {
  /**
   * Create a new prescription
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} prescriptionData - Prescription data
   * @returns {Promise<string>} New prescription ID
   */
  async createPrescription(doctorId, patientId, prescriptionData) {
    try {
      const prescriptionRef = doc(
        collection(this.firestore, 'users', doctorId, 'patients', patientId, 'prescriptions')
      );

      const newPrescription = {
        ...prescriptionData,
        id: prescriptionRef.id,
        doctorId,
        patientId,
        medications: prescriptionData.medications || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: prescriptionData.status || 'active'
      };

      await setDoc(prescriptionRef, newPrescription);
      return prescriptionRef.id;
    } catch (error) {
      this.handleError(error, 'createPrescription');
    }
  }

  /**
   * Update a prescription
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} prescriptionData - Updated data
   * @returns {Promise<boolean>}
   */
  async updatePrescription(doctorId, patientId, prescriptionId, prescriptionData) {
    try {
      const prescriptionRef = doc(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'prescriptions',
        prescriptionId
      );

      await updateDoc(prescriptionRef, {
        ...prescriptionData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updatePrescription');
    }
  }

  /**
   * Delete a prescription
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<boolean>}
   */
  async deletePrescription(doctorId, patientId, prescriptionId) {
    try {
      await deleteDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'prescriptions', prescriptionId)
      );
      this.log('Prescription deleted:', prescriptionId);
      return true;
    } catch (error) {
      this.handleError(error, 'deletePrescription');
    }
  }

  /**
   * Get a prescription
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object|null>}
   */
  async getPrescription(doctorId, patientId, prescriptionId) {
    try {
      const docSnap = await getDoc(
        doc(this.firestore, 'users', doctorId, 'patients', patientId, 'prescriptions', prescriptionId)
      );
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getPrescription');
    }
  }

  /**
   * List prescriptions with details
   * @param {string} doctorId - Doctor's user ID
   * @param {number} [limitValue=50] - Maximum results
   * @returns {Promise<Array>}
   */
  async listPrescriptionsWithDetails(doctorId, limitValue = 50) {
    try {
      const q = query(
        collectionGroup(this.firestore, 'prescriptions'),
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc'),
        limitFn(limitValue)
      );

      const snapshot = await getDocs(q);
      const prescriptions = [];

      snapshot.forEach(docSnap => {
        prescriptions.push({ id: docSnap.id, ...docSnap.data() });
      });

      return prescriptions;
    } catch (error) {
      console.error('[PrescriptionsService] Error listing prescriptions:', error);
      return [];
    }
  }

  /**
   * Filter prescriptions
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>}
   */
  async filterPrescriptions(doctorId, filters = {}) {
    try {
      let q = query(
        collectionGroup(this.firestore, 'prescriptions'),
        where('doctorId', '==', doctorId)
      );

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      let prescriptions = [];

      snapshot.forEach(docSnap => {
        prescriptions.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Client-side filtering for complex queries
      if (filters.patientName) {
        const searchTerm = filters.patientName.toLowerCase();
        prescriptions = prescriptions.filter(p =>
          p.patientName?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.dateRange?.start) {
        const startDate = new Date(filters.dateRange.start);
        prescriptions = prescriptions.filter(p => {
          const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          return createdAt >= startDate;
        });
      }

      if (filters.dateRange?.end) {
        const endDate = new Date(filters.dateRange.end);
        prescriptions = prescriptions.filter(p => {
          const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          return createdAt <= endDate;
        });
      }

      return prescriptions;
    } catch (error) {
      console.error('[PrescriptionsService] Error filtering prescriptions:', error);
      return [];
    }
  }

  // ==========================================
  // MEDICATIONS
  // ==========================================

  /**
   * List medications
   * @param {string} doctorId - Doctor's user ID
   * @returns {Promise<Array>}
   */
  async listMedications(doctorId) {
    try {
      const q = query(
        collection(this.firestore, 'users', doctorId, 'medications'),
        orderBy('medicationName', 'asc')
      );

      const snapshot = await getDocs(q);
      const medications = [];

      snapshot.forEach(docSnap => {
        medications.push({ id: docSnap.id, ...docSnap.data() });
      });

      return medications;
    } catch (error) {
      console.error('[PrescriptionsService] Error listing medications:', error);
      return [];
    }
  }

  /**
   * Create a medication
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} medicationData - Medication data
   * @returns {Promise<string>} New medication ID
   */
  async createMedication(doctorId, medicationData) {
    try {
      const medicationsRef = collection(this.firestore, 'users', doctorId, 'medications');
      const docRef = await addDoc(medicationsRef, {
        ...medicationData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      this.handleError(error, 'createMedication');
    }
  }

  /**
   * Update a medication
   * @param {string} doctorId - Doctor's user ID
   * @param {string} medicationId - Medication ID
   * @param {Object} medicationData - Updated data
   * @returns {Promise<boolean>}
   */
  async updateMedication(doctorId, medicationId, medicationData) {
    try {
      const medicationRef = doc(this.firestore, 'users', doctorId, 'medications', medicationId);
      await updateDoc(medicationRef, {
        ...medicationData,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updateMedication');
    }
  }

  /**
   * Delete a medication
   * @param {string} doctorId - Doctor's user ID
   * @param {string} medicationId - Medication ID
   * @returns {Promise<boolean>}
   */
  async deleteMedication(doctorId, medicationId) {
    try {
      await deleteDoc(doc(this.firestore, 'users', doctorId, 'medications', medicationId));
      return true;
    } catch (error) {
      this.handleError(error, 'deleteMedication');
    }
  }

  /**
   * Get a medication
   * @param {string} doctorId - Doctor's user ID
   * @param {string} medicationId - Medication ID
   * @returns {Promise<Object|null>}
   */
  async getMedication(doctorId, medicationId) {
    try {
      const docSnap = await getDoc(doc(this.firestore, 'users', doctorId, 'medications', medicationId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getMedication');
    }
  }
}

export const prescriptionsService = new PrescriptionsService();
export default prescriptionsService;
