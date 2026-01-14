/**
 * Prescriptions Service - Gerenciamento de Prescrições/Receitas
 *
 * Substitui o Firebase prescriptions.service.js
 * Inclui logging detalhado para debugging em produção.
 */

import apiService from './apiService';
import { createCrudLogger } from '@/lib/utils/logger';

const ENDPOINT = '/prescriptions';
const logger = createCrudLogger('Receita');

/**
 * Serviço de Prescrições
 */
const prescriptionsService = {
  /**
   * Listar prescrições com filtros
   */
  async list(filters = {}) {
    const { requestId, startTime } = logger.operationStart('LIST', null, filters);

    try {
      // Backend uses limit/offset, not page/per_page
      const limit = filters.perPage || 50;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;

      const params = {
        limit,
        offset,
        patient_id: filters.patientId, // Backend expects 'patient_id' not 'paciente_id'
        status: filters.status,
      };

      const response = await apiService.get(ENDPOINT, params);
      const items = Array.isArray(response) ? response : (response.items || []);
      const result = {
        items: items.map(normalizePrescription),
        total: response.total || items.length,
        page: page,
        perPage: limit,
      };

      logger.operationSuccess(requestId, startTime, 'LIST', null, { count: result.items.length });
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'LIST', error, null, filters);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Buscar prescrições de um paciente
   */
  async getByPatient(patientId) {
    const { requestId, startTime } = logger.operationStart('GET_BY_PATIENT', patientId);

    try {
      const response = await apiService.get(`${ENDPOINT}/patient/${patientId}`);
      const result = response.items.map(normalizePrescription);
      logger.operationSuccess(requestId, startTime, 'GET_BY_PATIENT', patientId, { count: result.length });
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET_BY_PATIENT', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Buscar prescrição por ID
   */
  async getById(prescriptionId) {
    const { requestId, startTime } = logger.operationStart('GET', prescriptionId);

    try {
      const response = await apiService.get(`${ENDPOINT}/${prescriptionId}`);
      const result = normalizePrescription(response);
      logger.operationSuccess(requestId, startTime, 'GET', prescriptionId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET', error, prescriptionId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Criar nova prescrição
   */
  async create(patientId, prescriptionData) {
    const { requestId, startTime } = logger.operationStart('CREATE', null, { patientId, ...prescriptionData });

    try {
      if (!patientId) {
        const error = new Error('ID do paciente é obrigatório para criar receita');
        error.status = 400;
        throw error;
      }

      const payload = denormalizePrescription(prescriptionData);
      payload.patient_id = patientId; // Backend expects 'patient_id' not 'paciente_id'

      // Validação de medicamentos
      if (!payload.items || payload.items.length === 0) {
        const error = new Error('A receita deve conter pelo menos um medicamento');
        error.status = 400;
        error.validationErrors = { medications: 'Adicione pelo menos um medicamento' };
        throw error;
      }

      const response = await apiService.post(ENDPOINT, payload);
      const result = normalizePrescription(response);

      logger.operationSuccess(requestId, startTime, 'CREATE', result.id, { patientId });
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'CREATE', error, null, { patientId, ...prescriptionData });
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Atualizar prescrição
   */
  async update(prescriptionId, prescriptionData) {
    const { requestId, startTime } = logger.operationStart('UPDATE', prescriptionId, prescriptionData);

    try {
      const payload = denormalizePrescription(prescriptionData);
      const response = await apiService.put(`${ENDPOINT}/${prescriptionId}`, payload);
      const result = normalizePrescription(response);

      logger.operationSuccess(requestId, startTime, 'UPDATE', prescriptionId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'UPDATE', error, prescriptionId, prescriptionData);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Excluir prescrição
   */
  async delete(patientId, prescriptionId) {
    const { requestId, startTime } = logger.operationStart('DELETE', prescriptionId, { patientId });

    try {
      await apiService.delete(`${ENDPOINT}/${prescriptionId}`);
      logger.operationSuccess(requestId, startTime, 'DELETE', prescriptionId);
      return { success: true };
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'DELETE', error, prescriptionId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Cancelar prescrição
   */
  async cancel(prescriptionId, reason) {
    const { requestId, startTime } = logger.operationStart('CANCEL', prescriptionId, { reason });

    try {
      const response = await apiService.post(`${ENDPOINT}/${prescriptionId}/cancel`, {
        reason: reason, // Backend expects 'reason' not 'motivo'
      });
      const result = normalizePrescription(response);

      logger.operationSuccess(requestId, startTime, 'CANCEL', prescriptionId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'CANCEL', error, prescriptionId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Assinar prescrição digitalmente
   * @param {string} prescriptionId - ID da prescrição
   * @param {Object} signatureData - Dados da assinatura
   * @param {string} signatureData.certificateId - ID do certificado do médico
   * @param {string} signatureData.signatureHash - Hash da assinatura (obrigatório)
   */
  async sign(prescriptionId, signatureData = {}) {
    const { requestId, startTime } = logger.operationStart('SIGN', prescriptionId);

    try {
      const payload = {
        certificate_id: signatureData.certificateId,
        signature_hash: signatureData.signatureHash, // Backend requires 'signature_hash'
      };
      const response = await apiService.post(`${ENDPOINT}/${prescriptionId}/sign`, payload);
      const result = normalizePrescription(response);

      logger.operationSuccess(requestId, startTime, 'SIGN', prescriptionId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'SIGN', error, prescriptionId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Download do PDF da prescrição
   */
  async downloadPdf(prescriptionId) {
    const { requestId, startTime } = logger.operationStart('DOWNLOAD_PDF', prescriptionId);

    try {
      const result = await apiService.download(`${ENDPOINT}/${prescriptionId}/pdf`);
      logger.operationSuccess(requestId, startTime, 'DOWNLOAD_PDF', prescriptionId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'DOWNLOAD_PDF', error, prescriptionId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  // =========================================================================
  // Certificados Digitais do Médico
  // =========================================================================

  /**
   * Listar certificados digitais do médico logado
   */
  async listDoctorCertificates() {
    const certLogger = createCrudLogger('Certificado Digital');
    const { requestId, startTime } = certLogger.operationStart('LIST');

    try {
      const response = await apiService.get('/doctor-certificates');
      const result = (response.items || response || []).map(normalizeDoctorCertificate);
      certLogger.operationSuccess(requestId, startTime, 'LIST', null, { count: result.length });
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'LIST', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Upload de certificado digital (.pfx/.p12)
   * @param {File} file - Arquivo do certificado
   * @param {string} password - Senha do certificado
   * @param {boolean} usoPrincipal - Define como certificado principal
   */
  async uploadCertificate(file, password, usoPrincipal = true) {
    const certLogger = createCrudLogger('Certificado Digital');
    const { requestId, startTime } = certLogger.operationStart('UPLOAD', null, { fileName: file.name });

    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('password', password);
      formData.append('uso_principal', usoPrincipal);

      const response = await apiService.postForm('/doctor-certificates/upload', formData);
      const result = normalizeDoctorCertificate(response);

      certLogger.operationSuccess(requestId, startTime, 'UPLOAD', result.id);
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'UPLOAD', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Revogar/Desativar certificado digital
   */
  async revokeCertificate(certificateId) {
    const certLogger = createCrudLogger('Certificado Digital');
    const { requestId, startTime } = certLogger.operationStart('REVOKE', certificateId);

    try {
      await apiService.delete(`/doctor-certificates/${certificateId}`);
      certLogger.operationSuccess(requestId, startTime, 'REVOKE', certificateId);
      return { success: true };
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'REVOKE', error, certificateId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  // =========================================================================
  // Verificação de Documentos
  // =========================================================================

  /**
   * Verificar autenticidade de documento pelo código de verificação
   * @param {string} code - Código de verificação (formato: XXXX-XXXX-XXXX-XXXX)
   */
  async verifyDocument(code) {
    const verifyLogger = createCrudLogger('Verificação');
    const { requestId, startTime } = verifyLogger.operationStart('VERIFY', code);

    try {
      // Endpoint público - não precisa de autenticação
      const response = await apiService.get(`/verify/${code}`);
      verifyLogger.operationSuccess(requestId, startTime, 'VERIFY', code);
      return {
        valid: response.valid,
        documentType: response.document_type,
        documentId: response.document_id,
        status: response.status,
        issuedAt: response.issued_at,
        signedAt: response.signed_at,
        verificationCode: response.verification_code,
      };
    } catch (error) {
      const { userMessage } = verifyLogger.operationError(requestId, startTime, 'VERIFY', error, code);
      error.userMessage = userMessage;
      throw error;
    }
  },

  // =========================================================================
  // Atestados Médicos
  // =========================================================================

  /**
   * Listar atestados médicos
   */
  async listCertificates(filters = {}) {
    const certLogger = createCrudLogger('Atestado');
    const { requestId, startTime } = certLogger.operationStart('LIST', null, filters);

    try {
      const params = {
        page: filters.page || 1,
        per_page: filters.perPage || 50,
        paciente_id: filters.patientId,
        status: filters.status,
      };

      const response = await apiService.get('/medical-certificates', params);
      const result = {
        items: (response.items || []).map(normalizeMedicalCertificate),
        total: response.total,
        page: response.page,
        perPage: response.per_page,
      };

      certLogger.operationSuccess(requestId, startTime, 'LIST', null, { count: result.items.length });
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'LIST', error, null, filters);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Criar atestado médico
   */
  async createCertificate(patientId, certificateData) {
    const certLogger = createCrudLogger('Atestado');
    const { requestId, startTime } = certLogger.operationStart('CREATE', null, { patientId, ...certificateData });

    try {
      const payload = {
        patient_id: patientId,
        certificate_type: certificateData.type,
        content: certificateData.content,
        icd10_code: certificateData.icd10Code,
        start_date: convertDateToBackendFormat(certificateData.startDate),
        end_date: convertDateToBackendFormat(certificateData.endDate),
        days_off: certificateData.daysOff,
        purpose: certificateData.purpose,
        companion_name: certificateData.companionName,
        companion_cpf: certificateData.companionCpf,
        clinical_note_id: certificateData.clinicalNoteId,
      };

      const response = await apiService.post('/medical-certificates', payload);
      const result = normalizeMedicalCertificate(response);

      certLogger.operationSuccess(requestId, startTime, 'CREATE', result.id);
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'CREATE', error, null, { patientId, ...certificateData });
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Assinar atestado médico
   * Backend expects: SignCertificateRequest { certificate_id, password }
   */
  async signCertificate(certificateId, signatureData = {}) {
    const certLogger = createCrudLogger('Atestado');
    const { requestId, startTime } = certLogger.operationStart('SIGN', certificateId);

    try {
      const payload = {
        certificate_id: signatureData.certificateId,
        password: signatureData.certificatePassword || signatureData.password,
      };
      const response = await apiService.post(`/medical-certificates/${certificateId}/sign`, payload);
      const result = normalizeMedicalCertificate(response);

      certLogger.operationSuccess(requestId, startTime, 'SIGN', certificateId);
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'SIGN', error, certificateId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Download do PDF do atestado
   */
  async downloadCertificatePdf(certificateId) {
    const certLogger = createCrudLogger('Atestado');
    const { requestId, startTime } = certLogger.operationStart('DOWNLOAD_PDF', certificateId);

    try {
      const result = await apiService.download(`/medical-certificates/${certificateId}/pdf`);
      certLogger.operationSuccess(requestId, startTime, 'DOWNLOAD_PDF', certificateId);
      return result;
    } catch (error) {
      const { userMessage } = certLogger.operationError(requestId, startTime, 'DOWNLOAD_PDF', error, certificateId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  // =========================================================================
  // Medicamentos
  // =========================================================================

  /**
   * Listar medicamentos cadastrados
   * Nota: Endpoint é /prescriptions/drugs no backend
   */
  async listMedications() {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('LIST');

    try {
      const response = await apiService.get(`${ENDPOINT}/drugs`);
      const result = (response.items || []).map(normalizeMedication);
      medLogger.operationSuccess(requestId, startTime, 'LIST', null, { count: result.length });
      return result;
    } catch (error) {
      const { userMessage } = medLogger.operationError(requestId, startTime, 'LIST', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Buscar medicamentos
   * Nota: Endpoint é /prescriptions/drugs/search no backend
   */
  async searchMedications(term) {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('SEARCH', null, { term });

    try {
      const response = await apiService.get(`${ENDPOINT}/drugs/search`, { q: term });
      const result = (response.items || []).map(normalizeMedication);
      medLogger.operationSuccess(requestId, startTime, 'SEARCH', null, { count: result.length });
      return result;
    } catch (error) {
      const { userMessage } = medLogger.operationError(requestId, startTime, 'SEARCH', error, null, { term });
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Criar/Salvar medicamento para uso futuro
   * Usa o endpoint de favoritos pois não existe endpoint para criar medicamentos
   * Backend: POST /prescriptions/drugs/favorites
   */
  async createMedication(medicationData) {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('CREATE', null, medicationData);

    try {
      // Usa o endpoint de favoritos para salvar o medicamento
      const payload = {
        drug_id: medicationData.id || null,
        drug_name: medicationData.name || medicationData.drugName,
        active_ingredient: medicationData.activeIngredient || null,
        concentration: medicationData.dosages?.[0] || medicationData.concentration || null,
        pharmaceutical_form: medicationData.form || medicationData.pharmaceuticalForm || null,
      };

      const response = await apiService.post(`${ENDPOINT}/drugs/favorites`, payload);
      const result = {
        id: response.id,
        name: response.drug_name,
        drugName: response.drug_name,
        concentration: response.concentration,
        ...response,
      };
      medLogger.operationSuccess(requestId, startTime, 'CREATE', result.id);
      return result;
    } catch (error) {
      const { userMessage } = medLogger.operationError(requestId, startTime, 'CREATE', error, null, medicationData);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Atualizar medicamento
   * Nota: Este endpoint pode não existir no backend - verificar
   */
  async updateMedication(medicationId, medicationData) {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('UPDATE', medicationId, medicationData);

    try {
      const response = await apiService.put(`${ENDPOINT}/drugs/${medicationId}`, medicationData);
      const result = normalizeMedication(response);
      medLogger.operationSuccess(requestId, startTime, 'UPDATE', medicationId);
      return result;
    } catch (error) {
      const { userMessage } = medLogger.operationError(requestId, startTime, 'UPDATE', error, medicationId, medicationData);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Excluir medicamento
   * Nota: Este endpoint pode não existir no backend - verificar
   */
  async deleteMedication(medicationId) {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('DELETE', medicationId);

    try {
      await apiService.delete(`${ENDPOINT}/drugs/${medicationId}`);
      medLogger.operationSuccess(requestId, startTime, 'DELETE', medicationId);
      return { success: true };
    } catch (error) {
      const { userMessage } = medLogger.operationError(requestId, startTime, 'DELETE', error, medicationId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  // =========================================================================
  // Medicamentos Favoritos e Recentes
  // =========================================================================

  /**
   * Listar medicamentos favoritos do medico
   * Fallback para localStorage se endpoint nao existir
   */
  async listFavoriteMedications() {
    const medLogger = createCrudLogger('Medicamento Favorito');
    const { requestId, startTime } = medLogger.operationStart('LIST_FAVORITES');

    try {
      const response = await apiService.get(`${ENDPOINT}/drugs/favorites`);
      const result = (response.items || response || []).map(normalizeMedication);
      medLogger.operationSuccess(requestId, startTime, 'LIST_FAVORITES', null, { count: result.length });
      return result;
    } catch (error) {
      // Se 404, tenta localStorage como fallback
      if (error.status === 404) {
        console.log('Endpoint favoritos nao disponivel, usando localStorage');
        return this._getLocalFavorites();
      }
      const { userMessage } = medLogger.operationError(requestId, startTime, 'LIST_FAVORITES', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Adicionar medicamento aos favoritos
   * Backend expects: POST /prescriptions/drugs/favorites
   */
  async addFavoriteMedication(medication) {
    const medLogger = createCrudLogger('Medicamento Favorito');
    const { requestId, startTime } = medLogger.operationStart('ADD_FAVORITE', medication.id);

    try {
      // Backend expects these exact field names (AddFavoriteRequest struct)
      const response = await apiService.post(`${ENDPOINT}/drugs/favorites`, {
        drug_id: medication.id || null,
        drug_name: medication.name || medication.drugName,
        active_ingredient: medication.activeIngredient || medication.principioAtivo || null,
        concentration: medication.concentration || null,
        pharmaceutical_form: medication.form || medication.pharmaceuticalForm || null,
      });
      medLogger.operationSuccess(requestId, startTime, 'ADD_FAVORITE', medication.id);
      return response;
    } catch (error) {
      // Se 404, salva em localStorage
      if (error.status === 404) {
        console.log('Endpoint favoritos nao disponivel, salvando em localStorage');
        return this._addLocalFavorite(medication);
      }
      const { userMessage } = medLogger.operationError(requestId, startTime, 'ADD_FAVORITE', error, medication.id);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Remover medicamento dos favoritos
   * Backend expects: DELETE /prescriptions/drugs/favorites/{favorite_id}
   * Note: favoriteId is the ID of the favorite entry, not the drug_id
   */
  async removeFavoriteMedication(favoriteId) {
    const medLogger = createCrudLogger('Medicamento Favorito');
    const { requestId, startTime } = medLogger.operationStart('REMOVE_FAVORITE', favoriteId);

    try {
      await apiService.delete(`${ENDPOINT}/drugs/favorites/${favoriteId}`);
      medLogger.operationSuccess(requestId, startTime, 'REMOVE_FAVORITE', favoriteId);
      return { success: true };
    } catch (error) {
      // Se 404, remove de localStorage
      if (error.status === 404) {
        console.log('Endpoint favoritos nao disponivel, removendo de localStorage');
        return this._removeLocalFavorite(favoriteId);
      }
      const { userMessage } = medLogger.operationError(requestId, startTime, 'REMOVE_FAVORITE', error, favoriteId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Listar medicamentos usados recentemente
   */
  async getRecentMedications(limit = 10) {
    const medLogger = createCrudLogger('Medicamento Recente');
    const { requestId, startTime } = medLogger.operationStart('LIST_RECENT', null, { limit });

    try {
      const response = await apiService.get(`${ENDPOINT}/drugs/recent`, { limit });
      const result = (response.items || response || []).map(normalizeMedication);
      medLogger.operationSuccess(requestId, startTime, 'LIST_RECENT', null, { count: result.length });
      return result;
    } catch (error) {
      // Se 404, tenta localStorage como fallback
      if (error.status === 404) {
        console.log('Endpoint recentes nao disponivel, usando localStorage');
        return this._getLocalRecent(limit);
      }
      const { userMessage } = medLogger.operationError(requestId, startTime, 'LIST_RECENT', error);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Registrar uso de medicamento (para recentes)
   */
  async trackMedicationUsage(medication) {
    // Adiciona ao localStorage de recentes
    this._addLocalRecent(medication);

    // Tenta registrar no backend (opcional)
    try {
      await apiService.post(`${ENDPOINT}/drugs/${medication.id}/track-usage`, {
        medication_name: medication.name || medication.drugName,
        dosage: medication.dosage,
        quantity: medication.quantity,
      });
    } catch (error) {
      // Ignora erro - localStorage ja salvo
      console.log('Tracking de uso nao disponivel no backend');
    }
  },

  // =========================================================================
  // LocalStorage Helpers (fallback quando backend nao suporta)
  // =========================================================================

  _getLocalFavorites() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('medication_favorites');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _addLocalFavorite(medication) {
    if (typeof window === 'undefined') return medication;
    try {
      const favorites = this._getLocalFavorites();
      const exists = favorites.some(f => f.id === medication.id || f.name === medication.name);
      if (!exists) {
        favorites.unshift({
          id: medication.id || `local_${Date.now()}`,
          name: medication.name || medication.drugName,
          drugName: medication.name || medication.drugName,
          concentration: medication.concentration,
          defaultDosage: medication.defaultDosage || medication.dosage,
          defaultQuantity: medication.defaultQuantity || medication.quantity,
          controlledType: medication.controlledType || 'none',
          isFavorite: true,
          addedAt: new Date().toISOString(),
        });
        localStorage.setItem('medication_favorites', JSON.stringify(favorites.slice(0, 20)));
      }
      return medication;
    } catch {
      return medication;
    }
  },

  _removeLocalFavorite(medicationId) {
    if (typeof window === 'undefined') return { success: true };
    try {
      const favorites = this._getLocalFavorites();
      const filtered = favorites.filter(f => f.id !== medicationId && f.name !== medicationId);
      localStorage.setItem('medication_favorites', JSON.stringify(filtered));
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  _getLocalRecent(limit = 10) {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('medication_recent');
      const recent = data ? JSON.parse(data) : [];
      return recent.slice(0, limit);
    } catch {
      return [];
    }
  },

  _addLocalRecent(medication) {
    if (typeof window === 'undefined') return;
    try {
      const recent = this._getLocalRecent(50);
      // Remove se ja existe
      const filtered = recent.filter(r => r.id !== medication.id && r.name !== medication.name);
      // Adiciona no inicio
      filtered.unshift({
        id: medication.id || `local_${Date.now()}`,
        name: medication.name || medication.drugName,
        drugName: medication.name || medication.drugName,
        concentration: medication.concentration,
        dosage: medication.dosage,
        quantity: medication.quantity,
        controlledType: medication.controlledType || 'none',
        usedAt: new Date().toISOString(),
      });
      // Mantém apenas os 20 mais recentes
      localStorage.setItem('medication_recent', JSON.stringify(filtered.slice(0, 20)));
    } catch {
      // Ignora erros de localStorage
    }
  },

  // =========================================================================
  // Compatibilidade com Firebase
  // =========================================================================

  /**
   * @deprecated Use list() com filtros
   */
  async listPrescriptionsWithDetails(limit = 50) {
    return this.list({ perPage: limit });
  },

  /**
   * @deprecated Use list() com filtros
   */
  async filterPrescriptions(filters = {}) {
    return this.list(filters);
  },
};

/**
 * Normaliza dados da prescrição do backend para o frontend
 * Backend returns fields in English (snake_case)
 */
function normalizePrescription(prescription) {
  if (!prescription) return null;

  return {
    id: prescription.id,
    // Backend returns English field names
    patientId: prescription.patient_id,
    patientName: prescription.patient_name, // May not be returned by backend
    professionalId: prescription.professional_id,
    professionalName: prescription.professional_name, // May not be returned by backend
    // Datas
    prescriptionDate: prescription.prescription_date,
    expiryDate: prescription.validity_date,
    // Status
    status: prescription.status,
    isSigned: prescription.signed,
    signedAt: prescription.signed_at,
    // Medicamentos - backend returns 'items' not 'itens'
    medications: (prescription.items || []).map(normalizePrescriptionItem),
    // Detalhes
    notes: prescription.observations,
    // Type
    prescriptionType: prescription.prescription_type,
    // Memed integration
    memedPrescriptionId: prescription.memed_prescription_id,
    pdfUrl: prescription.memed_pdf_url,
    // Timestamps
    createdAt: prescription.created_at,
    updatedAt: prescription.updated_at,
  };
}

/**
 * Normaliza item da prescrição - backend retorna campos em inglês
 */
function normalizePrescriptionItem(item) {
  return {
    id: item.id,
    // Backend uses English field names
    medicationId: item.drug_id,
    medicationName: item.drug_name,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    instructions: item.instructions,
    quantity: item.quantity,
    continuous: item.continuous_use,
    // Additional fields from backend
    unit: item.unit,
    activeIngredient: item.active_ingredient,
    concentration: item.concentration,
    pharmaceuticalForm: item.pharmaceutical_form,
  };
}

function normalizeMedication(med) {
  return {
    id: med.id,
    // Backend uses English field names
    name: med.name || med.nome,
    activeIngredient: med.active_ingredient || med.principio_ativo,
    concentration: med.concentration || med.concentracao,
    form: med.pharmaceutical_form || med.forma_farmaceutica,
    laboratory: med.laboratory || med.laboratorio,
    defaultDosage: med.dosagem_padrao,
    defaultFrequency: med.frequencia_padrao,
    defaultInstructions: med.instrucoes_padrao,
    controlled: med.controlled_type === 'controlled' || med.controlado,
    memedId: med.memed_id,
  };
}

/**
 * Normaliza certificado digital do médico
 */
function normalizeDoctorCertificate(cert) {
  if (!cert) return null;

  return {
    id: cert.id,
    holderName: cert.holder_name,
    holderCpf: cert.holder_cpf,
    crm: cert.crm,
    crmState: cert.crm_state,
    certificateType: cert.certificate_type,
    thumbprint: cert.thumbprint,
    validUntil: cert.valid_until,
    isActive: cert.is_active,
    createdAt: cert.created_at,
    // Informações derivadas
    isExpired: cert.valid_until ? new Date(cert.valid_until) < new Date() : false,
    daysUntilExpiry: cert.valid_until
      ? Math.ceil((new Date(cert.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

/**
 * Normaliza atestado médico
 */
function normalizeMedicalCertificate(cert) {
  if (!cert) return null;

  return {
    id: cert.id,
    patientId: cert.patient_id,
    patientName: cert.patient_name,
    professionalId: cert.professional_id,
    professionalName: cert.professional_name,
    clinicalNoteId: cert.clinical_note_id,
    type: cert.certificate_type,
    status: cert.status,
    issuedAt: cert.issued_at,
    startDate: cert.start_date,
    endDate: cert.end_date,
    daysOff: cert.days_off,
    icd10Code: cert.icd10_code,
    content: cert.content,
    purpose: cert.purpose,
    companionName: cert.companion_name,
    companionCpf: cert.companion_cpf,
    verificationCode: cert.verification_code,
    isSigned: cert.status === 'signed',
    signedAt: cert.signed_at,
    pdfUrl: cert.pdf_url,
    createdAt: cert.created_at,
    updatedAt: cert.updated_at,
  };
}

/**
 * Denormaliza dados da prescrição do frontend para o backend
 * Backend expects English field names (snake_case)
 */
function denormalizePrescription(prescription) {
  const payload = {};

  // Backend accepts observations, not observacoes
  if (prescription.notes !== undefined) {
    payload.observations = prescription.notes;
  }

  // Prescription type (Simple, Controlled, etc.)
  if (prescription.prescriptionType !== undefined) {
    payload.prescription_type = prescription.prescriptionType;
  }

  // Optional: prontuario_id if linking to clinical note
  if (prescription.clinicalNoteId !== undefined) {
    payload.prontuario_id = prescription.clinicalNoteId;
  }

  // Medicamentos/Itens - backend expects 'items' with English field names
  if (prescription.medications) {
    payload.items = prescription.medications.map((med) => ({
      drug_id: med.medicationId || med.drugId || null,
      drug_name: med.medicationName || med.name || med.drugName,
      dosage: med.dosage || med.posologia || '',
      frequency: med.frequency || '',
      duration: med.duration || med.duracao || '',
      instructions: med.instructions || med.observation || med.observacao || '',
      quantity: parseInt(med.quantity || med.quantidade) || 1,
      continuous_use: med.continuous || med.usoContinuo || false,
      unit: med.unit || 'comprimido', // Required by backend
      active_ingredient: med.activeIngredient || med.principioAtivo || null,
      concentration: med.concentration || med.concentracao || null,
      pharmaceutical_form: med.pharmaceuticalForm || med.formaFarmaceutica || null,
    }));
  }

  return payload;
}

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD (formato esperado pelo backend)
 * Aceita também datas já no formato YYYY-MM-DD
 */
function convertDateToBackendFormat(dateStr) {
  if (!dateStr || dateStr === '') return null;
  // Se já está no formato YYYY-MM-DD, retorna direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Converte de DD/MM/YYYY para YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  // Retorna o valor original se não reconhecer o formato
  return dateStr;
}

export default prescriptionsService;
