/**
 * Appointments Service - Gerenciamento de Agendamentos
 *
 * Substitui o Firebase appointments.service.js
 */

import apiService from './apiService';

const ENDPOINT = '/appointments';

/**
 * Serviço de Agendamentos
 */
const appointmentsService = {
  /**
   * Listar agendamentos com filtros
   */
  async list(filters = {}) {
    const params = {
      page: filters.page || 1,
      per_page: filters.perPage || 50,
      status: filters.status,
      profissional_id: filters.professionalId,
      paciente_id: filters.patientId,
      data_inicio: filters.startDate,
      data_fim: filters.endDate,
    };

    const response = await apiService.get(ENDPOINT, params);
    return {
      items: response.items.map(normalizeAppointment),
      total: response.total,
      page: response.page,
      perPage: response.per_page,
    };
  },

  /**
   * Buscar agendamentos por dia
   */
  async getByDate(date, professionalId) {
    const response = await apiService.get(`${ENDPOINT}/day/${date}`, {
      profissional_id: professionalId,
    });
    return response.items.map(normalizeAppointment);
  },

  /**
   * Buscar agendamentos de um paciente
   * Usa o endpoint de list com filtro por paciente_id
   */
  async getByPatient(patientId, options = {}) {
    const response = await apiService.get(ENDPOINT, {
      paciente_id: patientId,
      page: options.page || 1,
      per_page: options.perPage || 100,
    });
    return response.items.map(normalizeAppointment);
  },

  /**
   * Buscar próximos agendamentos de um paciente
   */
  async getUpcomingByPatient(patientId, limit = 5) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}/upcoming`, { limit });
    // Backend retorna array diretamente
    const items = Array.isArray(response) ? response : (response.items || []);
    return items.map(normalizeAppointment);
  },

  /**
   * Buscar agendamento por ID
   */
  async getById(appointmentId) {
    const response = await apiService.get(`${ENDPOINT}/${appointmentId}`);
    return normalizeAppointment(response);
  },

  /**
   * Criar novo agendamento
   */
  async create(appointmentData) {
    const payload = denormalizeAppointment(appointmentData);
    const response = await apiService.post(ENDPOINT, payload);
    return normalizeAppointment(response);
  },

  /**
   * Atualizar agendamento
   */
  async update(appointmentId, appointmentData) {
    const payload = denormalizeAppointment(appointmentData);
    const response = await apiService.put(`${ENDPOINT}/${appointmentId}`, payload);
    return normalizeAppointment(response);
  },

  /**
   * Excluir agendamento
   */
  async delete(appointmentId) {
    await apiService.delete(`${ENDPOINT}/${appointmentId}`);
    return { success: true };
  },

  /**
   * Confirmar agendamento
   */
  async confirm(appointmentId) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/confirm`);
    return normalizeAppointment(response);
  },

  /**
   * Cancelar agendamento
   */
  async cancel(appointmentId, reason) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/cancel`, {
      motivo_cancelamento: reason,
    });
    return normalizeAppointment(response);
  },

  /**
   * Registrar chegada (check-in)
   */
  async checkIn(appointmentId) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/checkin`);
    return normalizeAppointment(response);
  },

  /**
   * Iniciar atendimento
   */
  async start(appointmentId) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/start`);
    return normalizeAppointment(response);
  },

  /**
   * Finalizar atendimento
   */
  async complete(appointmentId, notes) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/complete`, {
      observacoes: notes,
    });
    return normalizeAppointment(response);
  },

  /**
   * Marcar como não compareceu
   */
  async noShow(appointmentId) {
    const response = await apiService.post(`${ENDPOINT}/${appointmentId}/no-show`);
    return normalizeAppointment(response);
  },

  /**
   * Obter estatísticas do dia
   */
  async getDayStats(date, professionalId) {
    return apiService.get(`${ENDPOINT}/stats/day/${date}`, {
      profissional_id: professionalId,
    });
  },

  /**
   * Verificar conflito de horário
   * Nota: O backend verifica conflito automaticamente ao criar/atualizar agendamentos.
   * Este método busca agendamentos no horário para verificação prévia no frontend.
   */
  async checkConflict(professionalId, startTime, endTime, excludeId) {
    try {
      // Buscar agendamentos do profissional no período
      const response = await apiService.get(ENDPOINT, {
        profissional_id: professionalId,
        data_inicio: startTime,
        data_fim: endTime,
        per_page: 10,
      });

      // Filtrar o próprio agendamento se estiver editando
      const appointments = response.items.filter(a => a.id !== excludeId);
      return appointments.length > 0;
    } catch (error) {
      console.warn('Erro ao verificar conflito:', error);
      return false; // Deixa o backend verificar
    }
  },

  /**
   * Listar todos os agendamentos (compatibilidade com Firebase)
   * @deprecated Use list() com filtros
   */
  async listAllConsultations(options = {}) {
    return this.list(options);
  },

  /**
   * Listar agendamentos de um paciente (compatibilidade)
   * @deprecated Use getByPatient()
   */
  async listPatientConsultations(patientId, options = {}) {
    return this.getByPatient(patientId, options);
  },
};

/**
 * Normaliza dados do agendamento do backend para o frontend
 */
function normalizeAppointment(appointment) {
  if (!appointment) return null;

  return {
    id: appointment.id,
    // Relacionamentos
    patientId: appointment.paciente_id,
    patientName: appointment.paciente_nome,
    professionalId: appointment.profissional_id,
    professionalName: appointment.profissional_nome,
    // Datas e horários
    date: appointment.data,
    startTime: appointment.data_hora_inicio,
    endTime: appointment.data_hora_fim,
    consultationDate: appointment.data_hora_inicio,
    // Detalhes
    type: appointment.tipo_consulta,
    status: normalizeStatus(appointment.status),
    notes: appointment.observacoes,
    cancellationReason: appointment.motivo_cancelamento,
    // Telemedicina
    isTelemedicine: appointment.telemedicina,
    telemedicineLink: appointment.link_telemedicina,
    // Financeiro
    value: appointment.valor,
    paid: appointment.pago,
    paymentMethod: appointment.forma_pagamento,
    convenioId: appointment.convenio_id,
    // Recorrência
    isRecurring: !!appointment.recorrencia_id,
    recurrenceId: appointment.recorrencia_id,
    // Timestamps do fluxo
    confirmedAt: appointment.confirmado_em,
    checkedInAt: appointment.chegou_em,
    startedAt: appointment.atendimento_iniciado_em,
    completedAt: appointment.atendimento_finalizado_em,
    // Timestamps
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
  };
}

/**
 * Denormaliza dados do agendamento do frontend para o backend
 */
function denormalizeAppointment(appointment) {
  const payload = {};

  if (appointment.patientId !== undefined) payload.paciente_id = appointment.patientId;
  if (appointment.professionalId !== undefined) payload.profissional_id = appointment.professionalId;
  if (appointment.startTime !== undefined) payload.data_hora_inicio = appointment.startTime;
  if (appointment.endTime !== undefined) payload.data_hora_fim = appointment.endTime;
  if (appointment.type !== undefined) payload.tipo_consulta = appointment.type;
  if (appointment.notes !== undefined) payload.observacoes = appointment.notes;
  if (appointment.isTelemedicine !== undefined) payload.telemedicina = appointment.isTelemedicine;
  if (appointment.telemedicineLink !== undefined) payload.link_telemedicina = appointment.telemedicineLink;
  if (appointment.value !== undefined) payload.valor = appointment.value;
  if (appointment.paymentMethod !== undefined) payload.forma_pagamento = appointment.paymentMethod;
  if (appointment.convenioId !== undefined) payload.convenio_id = appointment.convenioId;

  return payload;
}

function normalizeStatus(status) {
  const map = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    checked_in: 'Chegou',
    in_progress: 'Em Atendimento',
    completed: 'Finalizado',
    cancelled: 'Cancelado',
    no_show: 'Faltou',
  };
  return map[status] || status;
}

export default appointmentsService;
