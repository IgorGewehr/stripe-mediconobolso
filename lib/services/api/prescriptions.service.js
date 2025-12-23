/**
 * Prescriptions Service - Gerenciamento de Prescrições/Receitas
 *
 * Substitui o Firebase prescriptions.service.js
 */

import apiService from './apiService';

const ENDPOINT = '/prescriptions';

/**
 * Serviço de Prescrições
 */
const prescriptionsService = {
  /**
   * Listar prescrições com filtros
   */
  async list(filters = {}) {
    const params = {
      page: filters.page || 1,
      per_page: filters.perPage || 50,
      paciente_id: filters.patientId,
      status: filters.status,
      data_inicio: filters.startDate,
      data_fim: filters.endDate,
    };

    const response = await apiService.get(ENDPOINT, params);
    return {
      items: response.items.map(normalizePrescription),
      total: response.total,
      page: response.page,
      perPage: response.per_page,
    };
  },

  /**
   * Buscar prescrições de um paciente
   */
  async getByPatient(patientId) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}`);
    return response.items.map(normalizePrescription);
  },

  /**
   * Buscar prescrição por ID
   */
  async getById(prescriptionId) {
    const response = await apiService.get(`${ENDPOINT}/${prescriptionId}`);
    return normalizePrescription(response);
  },

  /**
   * Criar nova prescrição
   */
  async create(patientId, prescriptionData) {
    const payload = denormalizePrescription(prescriptionData);
    payload.paciente_id = patientId;
    const response = await apiService.post(ENDPOINT, payload);
    return normalizePrescription(response);
  },

  /**
   * Atualizar prescrição
   */
  async update(prescriptionId, prescriptionData) {
    const payload = denormalizePrescription(prescriptionData);
    const response = await apiService.put(`${ENDPOINT}/${prescriptionId}`, payload);
    return normalizePrescription(response);
  },

  /**
   * Excluir prescrição
   */
  async delete(patientId, prescriptionId) {
    await apiService.delete(`${ENDPOINT}/${prescriptionId}`);
    return { success: true };
  },

  /**
   * Cancelar prescrição
   */
  async cancel(prescriptionId, reason) {
    const response = await apiService.post(`${ENDPOINT}/${prescriptionId}/cancel`, {
      motivo: reason,
    });
    return normalizePrescription(response);
  },

  /**
   * Assinar prescrição digitalmente
   */
  async sign(prescriptionId) {
    const response = await apiService.post(`${ENDPOINT}/${prescriptionId}/sign`);
    return normalizePrescription(response);
  },

  /**
   * Download do PDF da prescrição
   */
  async downloadPdf(prescriptionId) {
    return apiService.download(`${ENDPOINT}/${prescriptionId}/pdf`);
  },

  // =========================================================================
  // Medicamentos
  // =========================================================================

  /**
   * Listar medicamentos cadastrados
   */
  async listMedications() {
    const response = await apiService.get('/medications');
    return response.items.map(normalizeMedication);
  },

  /**
   * Buscar medicamentos
   */
  async searchMedications(term) {
    const response = await apiService.get('/medications/search', { q: term });
    return response.items.map(normalizeMedication);
  },

  /**
   * Criar medicamento
   */
  async createMedication(medicationData) {
    const response = await apiService.post('/medications', medicationData);
    return normalizeMedication(response);
  },

  /**
   * Atualizar medicamento
   */
  async updateMedication(medicationId, medicationData) {
    const response = await apiService.put(`/medications/${medicationId}`, medicationData);
    return normalizeMedication(response);
  },

  /**
   * Excluir medicamento
   */
  async deleteMedication(medicationId) {
    await apiService.delete(`/medications/${medicationId}`);
    return { success: true };
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
    name: med.nome,
    activeIngredient: med.principio_ativo,
    concentration: med.concentracao,
    form: med.forma_farmaceutica,
    laboratory: med.laboratorio,
    defaultDosage: med.dosagem_padrao,
    defaultFrequency: med.frequencia_padrao,
    defaultInstructions: med.instrucoes_padrao,
    controlled: med.controlado,
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
