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
      this.validateRequired({ doctorId });
      const patientsCollection = collection(this.firestore, 'users', doctorId, 'patients');
      const querySnapshot = await getDocs(patientsCollection);
      return this.mapSnapshotToDocs(querySnapshot);
    } catch (error) {
      return this.handleListError(error, 'listPatients');
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
      this.validateRequired({ doctorId, patientId });
      const docSnap = await getDoc(doc(this.firestore, 'users', doctorId, 'patients', patientId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      return this.handleGetError(error, 'getPatient');
    }
  }

  /**
   * Create a new patient
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} patientData - Patient data
   * @returns {Promise<string>} New patient ID
   */
  async createPatient(doctorId, patientData) {
    this.validateRequired({ doctorId, patientData });
    const patientsCollection = collection(this.firestore, 'users', doctorId, 'patients');
    const docRef = await addDoc(patientsCollection, {
      ...patientData,
      ...this.createTimestamps()
    });
    this.log('Patient created:', docRef.id);
    return docRef.id;
  }

  /**
   * Update a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {Object} patientData - Data to update
   * @returns {Promise<boolean>}
   */
  async updatePatient(doctorId, patientId, patientData) {
    this.validateRequired({ doctorId, patientId, patientData });
    const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
    await updateDoc(patientRef, {
      ...patientData,
      ...this.updateTimestamp()
    });
    return true;
  }

  /**
   * Delete a patient
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<boolean>}
   */
  async deletePatient(doctorId, patientId) {
    this.validateRequired({ doctorId, patientId });
    await deleteDoc(doc(this.firestore, 'users', doctorId, 'patients', patientId));
    this.log('Patient deleted:', patientId);
    return true;
  }

  /**
   * Filter patients with advanced criteria
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered patients
   */
  async filterPatients(doctorId, filters = {}) {
    try {
      this.validateRequired({ doctorId });
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
      let patients = this.mapSnapshotToDocs(snapshot);

      this.log(`Initial filter: ${patients.length} patients loaded`);

      // Apply client-side filters
      patients = this._applyClientFilters(patients, filters);

      this.log(`Returning ${patients.length} filtered patients`);
      return patients;
    } catch (error) {
      return this.handleListError(error, 'filterPatients');
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

    const birthDate = this.parseAnyDate(birthDateStr);
    if (!birthDate) return false;

    const age = this.calculateAge(birthDate);
    return this.matchesAgeRange(age, ageRange);
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
    this.validateRequired({ doctorId, patientId });
    const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
    await updateDoc(patientRef, { favorite: isFavorite, ...this.updateTimestamp() });
    return true;
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
      this.validateRequired({ doctorId, patientId });

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
      return this.mapSnapshotToDocs(querySnapshot);
    } catch (error) {
      return this.handleListError(error, 'getPatientStatusHistory');
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
      this.validateRequired({ doctorId, patientId, status });

      const statusHistoryRef = collection(
        this.firestore,
        'users',
        doctorId,
        'patients',
        patientId,
        'statusHistory'
      );

      await addDoc(statusHistoryRef, {
        status,
        timestamp: this.getTimestamp(),
        updatedBy: this.auth.currentUser?.displayName || 'User',
        notes
      });
      return true;
    } catch (error) {
      this.handleListError(error, 'addPatientStatusHistory');
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
    this.validateRequired({ doctorId, patientId, statusList });
    const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
    await updateDoc(patientRef, {
      statusList,
      ...this.updateTimestamp()
    });
    return true;
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
    this.validateRequired({ file, doctorId, patientId });

    const path = `users/${doctorId}/patients/${patientId}/documents/${file.name}`;
    const fileUrl = await storageService.uploadFile(file, path);

    const fileInfo = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      fileSize: this.formatFileSize(file.size),
      fileUrl,
      category: documentData?.category || 'General',
      description: documentData?.description || '',
      uploadedAt: this.getTimestamp()
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
      ...this.updateTimestamp()
    });

    return fileInfo;
  }

  /**
   * Remove patient document
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @param {string} documentId - Document ID
   * @returns {Promise<boolean>}
   */
  async removePatientDocument(doctorId, patientId, documentId) {
    this.validateRequired({ doctorId, patientId, documentId });

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
      ...this.updateTimestamp()
    });

    return true;
  }

  /**
   * Get patient documents
   * @param {string} doctorId - Doctor's user ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Documents list
   */
  async getPatientDocuments(doctorId, patientId) {
    try {
      this.validateRequired({ doctorId, patientId });

      const patientRef = doc(this.firestore, 'users', doctorId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);

      if (!patientDoc.exists()) {
        return [];
      }

      return patientDoc.data().documents || [];
    } catch (error) {
      return this.handleListError(error, 'getPatientDocuments');
    }
  }
}

export const patientsService = new PatientsService();
export default patientsService;
