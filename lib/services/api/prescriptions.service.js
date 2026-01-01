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
      const params = {
        page: filters.page || 1,
        per_page: filters.perPage || 50,
        paciente_id: filters.patientId,
        status: filters.status,
        data_inicio: filters.startDate,
        data_fim: filters.endDate,
      };

      const response = await apiService.get(ENDPOINT, params);
      const result = {
        items: response.items.map(normalizePrescription),
        total: response.total,
        page: response.page,
        perPage: response.per_page,
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
      payload.paciente_id = patientId;

      // Validação de medicamentos
      if (!payload.itens || payload.itens.length === 0) {
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
        motivo: reason,
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
   * @param {string} [signatureData.certificatePassword] - Senha do certificado (para A1)
   */
  async sign(prescriptionId, signatureData = {}) {
    const { requestId, startTime } = logger.operationStart('SIGN', prescriptionId);

    try {
      const payload = {
        certificate_id: signatureData.certificateId,
        certificate_password: signatureData.certificatePassword,
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
        start_date: certificateData.startDate,
        end_date: certificateData.endDate,
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
   */
  async signCertificate(certificateId, signatureData = {}) {
    const certLogger = createCrudLogger('Atestado');
    const { requestId, startTime } = certLogger.operationStart('SIGN', certificateId);

    try {
      const payload = {
        certificate_id: signatureData.certificateId,
        certificate_password: signatureData.certificatePassword,
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
   * Criar medicamento
   * Nota: Este endpoint pode não existir no backend - verificar
   */
  async createMedication(medicationData) {
    const medLogger = createCrudLogger('Medicamento');
    const { requestId, startTime } = medLogger.operationStart('CREATE', null, medicationData);

    try {
      const response = await apiService.post(`${ENDPOINT}/drugs`, medicationData);
      const result = normalizeMedication(response);
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
 */
function normalizePrescription(prescription) {
  if (!prescription) return null;

  return {
    id: prescription.id,
    patientId: prescription.paciente_id,
    patientName: prescription.paciente_nome,
    professionalId: prescription.profissional_id,
    professionalName: prescription.profissional_nome,
    // Datas
    prescriptionDate: prescription.data_prescricao,
    expiryDate: prescription.data_validade,
    // Status
    status: prescription.status,
    isSigned: prescription.assinada,
    signedAt: prescription.assinada_em,
    // Medicamentos
    medications: (prescription.itens || []).map(normalizePrescriptionItem),
    // Detalhes
    diagnosis: prescription.diagnostico,
    indications: prescription.indicacoes,
    notes: prescription.observacoes,
    // Anexos
    attachments: prescription.anexos || [],
    pdfUrl: prescription.pdf_url,
    // Timestamps
    createdAt: prescription.created_at,
    updatedAt: prescription.updated_at,
  };
}

function normalizePrescriptionItem(item) {
  return {
    id: item.id,
    medicationId: item.medicamento_id,
    medicationName: item.nome_medicamento || item.medicamento_nome,
    dosage: item.dosagem,
    frequency: item.frequencia,
    duration: item.duracao,
    instructions: item.instrucoes,
    quantity: item.quantidade,
    continuous: item.uso_continuo,
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
 */
function denormalizePrescription(prescription) {
  const payload = {};

  if (prescription.prescriptionDate !== undefined) {
    payload.data_prescricao = prescription.prescriptionDate;
  }
  if (prescription.expiryDate !== undefined) {
    payload.data_validade = prescription.expiryDate;
  }
  if (prescription.diagnosis !== undefined) {
    payload.diagnostico = prescription.diagnosis;
  }
  if (prescription.indications !== undefined) {
    payload.indicacoes = prescription.indications;
  }
  if (prescription.notes !== undefined) {
    payload.observacoes = prescription.notes;
  }

  // Medicamentos/Itens
  if (prescription.medications) {
    payload.itens = prescription.medications.map((med) => ({
      medicamento_id: med.medicationId,
      nome_medicamento: med.medicationName,
      dosagem: med.dosage,
      frequencia: med.frequency,
      duracao: med.duration,
      instrucoes: med.instructions,
      quantidade: med.quantity,
      uso_continuo: med.continuous,
    }));
  }

  return payload;
}

export default prescriptionsService;
