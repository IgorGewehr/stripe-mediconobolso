/**
 * Patients Service
 *
 * Handles patient management operations.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { BaseService } from './base.service';
import { storageService } from './storage.service';

class PatientsService extends BaseService {
  /**
   * List all patients for a doctor
   * @param {string} doctorId - Doctor's user ID
   * @returns {Promise<Array>} List of patients
   */
  async listPatients(doctorId) {
    try {
      const patientsCollection = collection(this.firestore, 'users', doctorId, 'patients');
      const querySnapshot = await getDocs(patientsCollection);
      const patients = [];
      querySnapshot.forEach(docSnap => {
        patients.push({ id: docSnap.id, ...docSnap.data() });
      });
      return patients;
    } catch (error) {
      console.error('[PatientsService] Error listing patients:', error);
      return [];
    }
  }

  /**
   * Get a specific patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object|null>} Patient data
   */
  async getPatient(doctorId, patientId) {
    try {
      const docSnap = await getDoc(doc(this.firestore, 'users', doctorId, 'patients', patientId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      this.handleError(error, 'getPatient');
    }
  }

  /**
   * Create a new patient
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} patientData - Patient data
   * @returns {Promise<string>} New patient ID
   */
  async createPatient(doctorId, patientData) {
    try {
      const patientsCollection = collection(this.firestore, 'users', doctorId, 'patients');
      const docRef = await addDoc(patientsCollection, {
        ...patientData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      this.log('Patient created:', docRef.id);
      return docRef.id;
    } catch (error) {
      this.handleError(error, 'createPatient');
    }
  }

  /**
   * Update a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} patientData - Data to update
   * @returns {Promise<boolean>}
   */
  async updatePatient(doctorId, patientId, patientData) {
    try {
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      const updatedData = {
        ...patientData,
        updatedAt: new Date()
      };
      await updateDoc(patientRef, updatedData);
      return true;
    } catch (error) {
      this.handleError(error, 'updatePatient');
    }
  }

  /**
   * Delete a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<boolean>}
   */
  async deletePatient(doctorId, patientId) {
    try {
      await deleteDoc(doc(this.firestore, 'users', doctorId, 'patients', patientId));
      this.log('Patient deleted:', patientId);
      return true;
    } catch (error) {
      this.handleError(error, 'deletePatient');
    }
  }

  /**
   * Filter patients with advanced criteria
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered patients
   */
  async filterPatients(doctorId, filters = {}) {
    try {
      let patientsRef = collection(this.firestore, 'users', doctorId, 'patients');
      let queryRef = patientsRef;

      // Apply Firestore-supported filters
      if (filters.status) {
        queryRef = query(queryRef, where('statusList', 'array-contains', filters.status));
      }

      if (filters.gender && filters.gender.toLowerCase() !== 'ambos') {
        queryRef = query(queryRef, where('gender', '==', filters.gender.toLowerCase()));
      }

      const snapshot = await getDocs(queryRef);
      let patients = [];

      snapshot.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() });
      });

      this.log(`Initial filter: ${patients.length} patients loaded`);

      // Apply client-side filters
      patients = this._applyClientFilters(patients, filters);

      this.log(`Returning ${patients.length} filtered patients`);
      return patients;
    } catch (error) {
      console.error('[PatientsService] Error filtering patients:', error);
      return [];
    }
  }

  /**
   * Apply client-side filters
   * @private
   */
  _applyClientFilters(patients, filters) {
    let result = [...patients];

    // Conditions filter
    if (filters.conditions?.length > 0) {
      result = result.filter(patient => {
        const patientConditions = this._extractPatientConditions(patient);
        return filters.conditions.some(condition => patientConditions.includes(condition));
      });
    }

    // Health plan filter
    if (filters.healthPlan) {
      const healthPlanFilter = filters.healthPlan.toLowerCase();
      result = result.filter(patient => {
        if (Array.isArray(patient.healthPlans) && patient.healthPlans.length > 0) {
          return patient.healthPlans.some(plan =>
            plan.name?.toLowerCase().includes(healthPlanFilter));
        }
        if (patient.healthPlan?.name) {
          return patient.healthPlan.name.toLowerCase().includes(healthPlanFilter);
        }
        if (healthPlanFilter === 'particular' && patient.statusList?.includes('Particular')) {
          return true;
        }
        return false;
      });
    }

    // Age range filter
    if (filters.ageRange) {
      result = result.filter(patient => this._matchesAgeRange(patient, filters.ageRange));
    }

    // Region filter
    if (filters.region?.state || filters.region?.city) {
      result = result.filter(patient => {
        let match = true;
        if (filters.region.state) {
          const patientState = patient.state || patient.endereco?.estado;
          match = match && patientState?.toUpperCase() === filters.region.state.toUpperCase();
        }
        if (filters.region.city) {
          const patientCity = patient.city || patient.endereco?.cidade;
          match = match && patientCity?.toLowerCase().includes(filters.region.city.toLowerCase());
        }
        return match;
      });
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      result = result.filter(patient => this._matchesDateRange(patient, filters.dateRange));
    }

    return result;
  }

  /**
   * Extract patient conditions for filtering
   * @private
   */
  _extractPatientConditions(patient) {
    const conditions = [];

    // Smoker check
    if (patient.isSmoker || patient.condicoesClinicas?.ehFumante === 'Sim') {
      conditions.push('fumante');
    }

    // Chronic diseases
    const chronicDiseases = [
      ...(Array.isArray(patient.chronicDiseases) ? patient.chronicDiseases : []),
      ...(Array.isArray(patient.condicoesClinicas?.doencas) ? patient.condicoesClinicas.doencas : [])
    ];

    chronicDiseases.forEach(disease => {
      if (!disease || typeof disease !== 'string') return;
      const lower = disease.toLowerCase();

      if (lower.includes('diabet')) conditions.push('diabetes');
      if (lower.includes('hipertens') || lower.includes('pressão alta')) conditions.push('hipertensao');
      if (lower.includes('obes')) conditions.push('obeso');
      if (lower.includes('alergi')) conditions.push('alergia');
      if (lower.includes('cardio') || lower.includes('coração')) conditions.push('cardiopatia');
      if (lower.includes('asma') || lower.includes('respirat')) conditions.push('asma');
      if (lower.includes('cancer')) conditions.push('cancer');
    });

    if (patient.statusList?.includes('Internado')) {
      conditions.push('internado');
    }

    return conditions;
  }

  /**
   * Check if patient matches age range
   * @private
   */
  _matchesAgeRange(patient, ageRange) {
    const birthDateStr = patient.birthDate || patient.dataNascimento;
    if (!birthDateStr) return false;

    try {
      let birthDate;
      if (typeof birthDateStr === 'string') {
        const parts = birthDateStr.split('/');
        if (parts.length === 3) {
          birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          birthDate = new Date(birthDateStr);
        }
      } else {
        birthDate = new Date(birthDateStr);
      }

      if (isNaN(birthDate.getTime())) return false;

      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (ageRange.includes('-')) {
        const [minAge, maxAge] = ageRange.split('-').map(Number);
        return age >= minAge && age <= maxAge;
      } else if (ageRange.includes('+')) {
        return age >= parseInt(ageRange);
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if patient matches date range
   * @private
   */
  _matchesDateRange(patient, dateRange) {
    const nextConsultDate = this.parseDate(patient.nextConsultationDate);
    const lastConsultDate = this.parseDate(patient.lastConsultationDate);

    if (!nextConsultDate && !lastConsultDate) return false;

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    const checkDate = nextConsultDate || lastConsultDate;

    if (startDate && endDate) {
      return checkDate >= startDate && checkDate <= endDate;
    } else if (startDate) {
      return checkDate >= startDate;
    } else if (endDate) {
      return checkDate <= endDate;
    }

    return true;
  }

  /**
   * Update favorite status
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {boolean} isFavorite - Favorite status
   * @returns {Promise<boolean>}
   */
  async updateFavoriteStatus(doctorId, patientId, isFavorite) {
    try {
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      await updateDoc(patientRef, { favorite: isFavorite, updatedAt: new Date() });
      return true;
    } catch (error) {
      this.handleError(error, 'updateFavoriteStatus');
    }
  }

  /**
   * Get patients by doctor (alias for listPatients)
   */
  async getPatientsByDoctor(doctorId) {
    return this.listPatients(doctorId);
  }

  /**
   * Get patient status history
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Status history
   */
  async getPatientStatusHistory(doctorId, patientId) {
    try {
      if (!doctorId || !patientId) {
        this.warn('Invalid parameters for getPatientStatusHistory');
        return [];
      }

      const statusHistoryRef = collection(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'statusHistory'
      );

      const q = query(statusHistoryRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const history = [];
      querySnapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });

      return history;
    } catch (error) {
      console.error('[PatientsService] Error getting status history:', error);
      return [];
    }
  }

  /**
   * Add patient status history entry
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} status - New status
   * @param {string} [notes] - Optional notes
   * @returns {Promise<boolean>}
   */
  async addPatientStatusHistory(doctorId, patientId, status, notes = '') {
    try {
      const statusHistoryRef = collection(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'statusHistory'
      );

      const newHistoryRecord = {
        status,
        timestamp: new Date(),
        updatedBy: this.auth.currentUser?.displayName || 'User',
        notes
      };

      await addDoc(statusHistoryRef, newHistoryRecord);
      return true;
    } catch (error) {
      console.error('[PatientsService] Error adding status history:', error);
      return false;
    }
  }

  /**
   * Update patient status list
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Array} statusList - New status list
   * @returns {Promise<boolean>}
   */
  async updatePatientStatus(doctorId, patientId, statusList) {
    try {
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      await updateDoc(patientRef, {
        statusList,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updatePatientStatus');
    }
  }

  // ==========================================
  // PATIENT DOCUMENTS
  // ==========================================

  /**
   * Upload patient document
   * @param {File} file - File to upload
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} documentData - Document metadata
   * @returns {Promise<Object>} File info
   */
  async uploadPatientDocument(file, doctorId, patientId, documentData) {
    try {
      const path = `users/${doctorId}/patients/${patientId}/documents/${file.name}`;
      const fileUrl = await storageService.uploadFile(file, path);

      const fileInfo = {
        id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type,
        fileSize: this.formatFileSize(file.size),
        fileUrl,
        category: documentData.category || 'General',
        description: documentData.description || '',
        uploadedAt: new Date()
      };

      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const patientData = patientDoc.data();
      const documents = patientData.documents || [];

      await updateDoc(patientRef, {
        documents: [...documents, fileInfo],
        updatedAt: new Date()
      });

      return fileInfo;
    } catch (error) {
      this.handleError(error, 'uploadPatientDocument');
    }
  }

  /**
   * Remove patient document
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} documentId - Document ID
   * @returns {Promise<boolean>}
   */
  async removePatientDocument(doctorId, patientId, documentId) {
    try {
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const patientData = patientDoc.data();
      const documents = patientData.documents || [];
      const documentToDelete = documents.find(d => d.id === documentId);

      if (!documentToDelete) {
        throw new Error('Document not found');
      }

      if (documentToDelete.fileUrl) {
        await storageService.deleteFile(documentToDelete.fileUrl);
      }

      const updatedDocuments = documents.filter(d => d.id !== documentId);

      await updateDoc(patientRef, {
        documents: updatedDocuments,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      this.handleError(error, 'removePatientDocument');
    }
  }

  /**
   * Get patient documents
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Documents list
   */
  async getPatientDocuments(doctorId, patientId) {
    try {
      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      return patientDoc.data().documents || [];
    } catch (error) {
      console.error('[PatientsService] Error getting documents:', error);
      return [];
    }
  }
}

export const patientsService = new PatientsService();
export default patientsService;
