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
   */
  async update(examId, examData) {
    const payload = denormalizeExam(examData);
    const response = await apiService.put(`${ENDPOINT}/${examId}`, payload);
    return normalizeExam(response);
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
    const response = await apiService.post(`${ENDPOINT}/${examId}/result`, {
      resultado: resultData.result,
      valor: resultData.value,
      unidade: resultData.unit,
      faixa_normal: resultData.normalRange,
      interpretacao: resultData.interpretation,
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
 */
function normalizeExam(exam) {
  if (!exam) return null;

  return {
    id: exam.id,
    patientId: exam.paciente_id,
    patientName: exam.paciente_nome,
    // Dados do exame
    examName: exam.nome_exame,
    examType: exam.tipo_exame,
    examinationDate: exam.data_exame,
    // Resultado
    result: exam.resultado,
    resultText: exam.resultado_texto,
    resultFileUrl: exam.resultado_arquivo_url,
    value: exam.valor,
    unit: exam.unidade,
    normalRange: exam.faixa_normal,
    interpretation: exam.interpretacao,
    isAbnormal: exam.anormal,
    // Status
    status: normalizeExamStatus(exam.status),
    // Notas
    notes: exam.observacoes,
    doctorNotes: exam.notas_medico,
    // Anexos
    attachments: (exam.anexos || []).map((a) => ({
      id: a.id,
      fileName: a.nome_arquivo,
      fileType: a.tipo_arquivo,
      fileSize: a.tamanho,
      fileUrl: a.url,
      uploadedAt: a.uploaded_at,
    })),
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

  if (exam.examName !== undefined) payload.nome_exame = exam.examName;
  if (exam.examType !== undefined) payload.tipo_exame = exam.examType;
  if (exam.examinationDate !== undefined) payload.data_exame = exam.examinationDate;
  if (exam.result !== undefined) payload.resultado = exam.result;
  if (exam.resultText !== undefined) payload.resultado_texto = exam.resultText;
  if (exam.value !== undefined) payload.valor = exam.value;
  if (exam.unit !== undefined) payload.unidade = exam.unit;
  if (exam.normalRange !== undefined) payload.faixa_normal = exam.normalRange;
  if (exam.interpretation !== undefined) payload.interpretacao = exam.interpretation;
  if (exam.notes !== undefined) payload.observacoes = exam.notes;
  if (exam.doctorNotes !== undefined) payload.notas_medico = exam.doctorNotes;
  if (exam.status !== undefined) payload.status = denormalizeExamStatus(exam.status);

  return payload;
}

function normalizeExamStatus(status) {
  const map = {
    pending: 'Pendente',
    completed: 'Concluído',
    reviewed: 'Revisado',
  };
  return map[status] || status;
}

function denormalizeExamStatus(status) {
  const map = {
    Pendente: 'pending',
    Concluído: 'completed',
    Revisado: 'reviewed',
  };
  return map[status] || status?.toLowerCase();
}

export default examsService;
