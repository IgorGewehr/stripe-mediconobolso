/**
 * Exams Service - Gerenciamento de Exames
 *
 * Substitui o Firebase exams.service.js
 */

import apiService from './apiService';

const ENDPOINT = '/clinical/exams';

/**
 * Serviço de Exames
 */
const examsService = {
  /**
   * Listar exames de um paciente
   */
  async listByPatient(patientId) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}`);
    return response.items.map(normalizeExam);
  },

  /**
   * Buscar exame por ID
   */
  async getById(examId) {
    const response = await apiService.get(`${ENDPOINT}/${examId}`);
    return normalizeExam(response);
  },

  /**
   * Criar novo exame
   */
  async create(patientId, examData) {
    const payload = denormalizeExam(examData);
    payload.paciente_id = patientId;
    const response = await apiService.post(ENDPOINT, payload);
    return normalizeExam(response);
  },

  /**
   * Atualizar exame
   * Nota: Backend não tem endpoint de update geral - usar updateStatus ou addResult
   * @deprecated Use updateStatus() ou addResult()
   */
  async update(examId, examData) {
    // Se tem status, usa updateStatus
    if (examData.status) {
      return this.updateStatus(examId, examData.status);
    }
    // Se tem resultado, usa addResult
    if (examData.result || examData.conclusionText) {
      return this.addResult(examId, examData);
    }
    throw new Error('Use updateStatus() ou addResult() para atualizar exames');
  },

  /**
   * Excluir exame
   */
  async delete(patientId, examId) {
    await apiService.delete(`${ENDPOINT}/${examId}`);
    return { success: true };
  },

  /**
   * Atualizar status do exame
   */
  async updateStatus(examId, status) {
    const response = await apiService.put(`${ENDPOINT}/${examId}/status`, { status });
    return normalizeExam(response);
  },

  /**
   * Adicionar resultado ao exame
   */
  async addResult(examId, resultData) {
    const response = await apiService.put(`${ENDPOINT}/${examId}/result`, {
      conclusion_text: resultData.conclusionText || resultData.result,
      is_abnormal: resultData.isAbnormal || false,
      performed_by: resultData.performedBy,
      result_file_url: resultData.resultFileUrl,
      reference_values: resultData.referenceValues || resultData.normalRange,
    });
    return normalizeExam(response);
  },

  /**
   * Listar exames pendentes
   */
  async listPending() {
    const response = await apiService.get(`${ENDPOINT}/pending`);
    return response.items.map(normalizeExam);
  },

  /**
   * Listar exames com resultados anormais
   */
  async listAbnormal() {
    const response = await apiService.get(`${ENDPOINT}/abnormal`);
    return response.items.map(normalizeExam);
  },

  /**
   * Upload de anexo do exame
   */
  async uploadAttachment(examId, file) {
    const response = await apiService.upload(`${ENDPOINT}/${examId}/attachments`, file);
    return response;
  },

  /**
   * Remover anexo do exame
   */
  async removeAttachment(examId, attachmentId) {
    await apiService.delete(`${ENDPOINT}/${examId}/attachments/${attachmentId}`);
    return { success: true };
  },

  // =========================================================================
  // Compatibilidade com Firebase
  // =========================================================================

  /**
   * @deprecated Use listByPatient()
   */
  async listExams(doctorId, patientId) {
    return this.listByPatient(patientId);
  },

  /**
   * @deprecated Use create()
   */
  async createExam(doctorId, patientId, examData) {
    return this.create(patientId, examData);
  },

  /**
   * @deprecated Use update()
   */
  async updateExam(doctorId, patientId, examId, examData) {
    return this.update(examId, examData);
  },

  /**
   * @deprecated Use delete()
   */
  async deleteExam(doctorId, patientId, examId) {
    return this.delete(patientId, examId);
  },
};

/**
 * Normaliza dados do exame do backend para o frontend
 * Backend usa campos em inglês conforme ExamResponse
 */
function normalizeExam(exam) {
  if (!exam) return null;

  return {
    id: exam.id,
    patientId: exam.paciente_id,
    professionalId: exam.profissional_id,
    // Dados do exame
    examName: exam.exam_name,
    examType: exam.exam_type,
    examCategory: exam.exam_category,
    codigoTuss: exam.codigo_tuss,
    examDate: exam.exam_date,
    // Resultado
    result: exam.result || {},
    isAbnormal: exam.result?.is_abnormal,
    conclusionText: exam.result?.conclusion_text,
    resultFileUrl: exam.result?.result_file_url,
    referenceValues: exam.result?.reference_values,
    performedBy: exam.result?.performed_by,
    // Status
    status: normalizeExamStatus(exam.status),
    // Anexos
    attachments: (exam.attachments || []).map((id) => ({ id })),
    // Timestamps
    createdAt: exam.created_at,
    updatedAt: exam.updated_at,
  };
}

/**
 * Denormaliza dados do exame do frontend para o backend
 */
function denormalizeExam(exam) {
  const payload = {};

  if (exam.examName !== undefined) payload.exam_name = exam.examName;
  if (exam.examType !== undefined) payload.exam_type = exam.examType;
  if (exam.examCategory !== undefined) payload.exam_category = exam.examCategory;
  if (exam.codigoTuss !== undefined) payload.codigo_tuss = exam.codigoTuss;
  if (exam.clinicalIndication !== undefined) payload.clinical_indication = exam.clinicalIndication;

  return payload;
}

function normalizeExamStatus(status) {
  const map = {
    requested: 'Solicitado',
    scheduled: 'Agendado',
    collected: 'Coletado',
    processing: 'Em Processamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  return map[status] || status;
}

function denormalizeExamStatus(status) {
  const map = {
    Solicitado: 'requested',
    Agendado: 'scheduled',
    Coletado: 'collected',
    'Em Processamento': 'processing',
    Concluído: 'completed',
    Cancelado: 'cancelled',
  };
  return map[status] || status?.toLowerCase();
}

export default examsService;
