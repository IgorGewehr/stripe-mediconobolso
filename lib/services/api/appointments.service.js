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
   *
   * NOTA: O backend determina profissional_id automaticamente:
   * - Modo Solo: usa tenant_id como profissional_id
   * - Modo MultiDoctor: usa auth.profissional_id ou retorna erro
   */
  async create(appointmentData) {
    const payload = denormalizeAppointment(appointmentData);
    console.log('[Appointments] CREATE - Input:', appointmentData);
    console.log('[Appointments] CREATE - Payload:', JSON.stringify(payload, null, 2));
    console.log('[Appointments] CREATE - Validations:', {
      paciente_id_valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.paciente_id),
      data_hora_inicio: payload.data_hora_inicio,
      profissional_id: 'NOT_SENT (backend determines via auth context)'
    });
    const response = await apiService.post(ENDPOINT, payload);
    console.log('[Appointments] CREATE - Response:', response);
    return normalizeAppointment(response);
  },

  /**
   * Atualizar agendamento
   *
   * NOTA: O backend mantém o profissional_id original do agendamento
   * se não for enviado explicitamente no payload
   */
  async update(appointmentId, appointmentData) {
    const payload = denormalizeAppointment(appointmentData);
    console.log('[Appointments] UPDATE - ID:', appointmentId);
    console.log('[Appointments] UPDATE - Payload:', JSON.stringify(payload, null, 2));
    const response = await apiService.put(`${ENDPOINT}/${appointmentId}`, payload);
    console.log('[Appointments] UPDATE - Response:', response);
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
      motivo: reason, // Backend expects 'motivo', not 'motivo_cancelamento'
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
   *
   * Usa endpoint dedicado que respeita o clinic_mode:
   * - Solo: verifica conflito global (1 evento por horário para o médico)
   * - MultiDoctor: verifica conflito por profissional específico
   *
   * NOTA: profissional_id NÃO é enviado - backend usa auth context
   */
  async checkConflict(startTime, durationMinutes = 30, excludeId = null, roomId = null) {
    const requestPayload = {
      data_hora_inicio: startTime,
      duracao_minutos: durationMinutes,
      exclude_id: excludeId,
      room_id: roomId,
    };

    console.log('[Appointments] CHECK_CONFLICT - Request:', {
      ...requestPayload,
      profissional_id: 'NOT_SENT (backend determines via auth context)'
    });

    try {
      const response = await apiService.post(`${ENDPOINT}/check-conflict`, requestPayload);

      const result = {
        hasConflict: response.has_conflict,
        conflictType: response.conflict_type, // 'global', 'professional', 'room'
        message: response.message,
        clinicMode: response.clinic_mode, // 'solo' ou 'multi_doctor'
      };

      console.log('[Appointments] CHECK_CONFLICT - Response:', result);
      return result;
    } catch (error) {
      console.warn('[Appointments] CHECK_CONFLICT - Error:', error);
      // Retorna sem conflito para deixar o backend validar na criação
      return {
        hasConflict: false,
        conflictType: null,
        message: null,
        clinicMode: null,
      };
    }
  },

  /**
   * Listar todos os agendamentos (compatibilidade com Firebase)
   * Retorna apenas o array de items para manter compatibilidade
   * @deprecated Use list() com filtros
   */
  async listAllConsultations(options = {}) {
    const result = await this.list(options);
    return result.items || [];
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
 * Mapeia tipo de consulta do frontend para o backend (snake_case)
 */
function mapAppointmentType(type) {
  if (!type) return 'consultation'; // default

  const typeMap = {
    // Português -> snake_case
    'Consulta': 'consultation',
    'Retorno': 'return_visit',
    'Exame': 'exam',
    'Procedimento': 'procedure',
    'Cirurgia': 'surgery',
    'Telemedicina': 'telemedicine',
    // Já em snake_case (passar direto)
    'consultation': 'consultation',
    'return_visit': 'return_visit',
    'exam': 'exam',
    'procedure': 'procedure',
    'surgery': 'surgery',
    'telemedicine': 'telemedicine',
  };

  return typeMap[type] || 'consultation';
}

/**
 * Denormaliza dados do agendamento do frontend para o backend
 *
 * IMPORTANTE: profissional_id NÃO é enviado deliberadamente!
 * O backend determina automaticamente baseado no clinic_mode:
 *
 * Fluxo no Backend (src/api/appointments.rs:329-344):
 * 1. Se body.profissional_id existe → usa ele (secretária agendando para médico específico)
 * 2. Se auth.profissional_id existe → usa ele (médico logado agendando para si)
 * 3. Se modo Solo → usa auth.tenant_id como profissional_id
 * 4. Se modo MultiDoctor sem profissional_id → erro de validação
 */
function denormalizeAppointment(appointment) {
  const payload = {};

  if (appointment.patientId !== undefined) payload.paciente_id = appointment.patientId;
  // profissional_id NÃO é enviado - o backend determina automaticamente
  if (appointment.startTime !== undefined) payload.data_hora_inicio = appointment.startTime;

  // Backend espera duracao_minutos, não data_hora_fim
  // Se tivermos startTime e endTime, calculamos a duração
  if (appointment.startTime && appointment.endTime) {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    if (durationMinutes > 0) {
      payload.duracao_minutos = durationMinutes;
    }
  } else if (appointment.durationMinutes !== undefined) {
    // Se já tiver duração diretamente, usar
    payload.duracao_minutos = appointment.durationMinutes;
  }

  if (appointment.type !== undefined) payload.tipo = mapAppointmentType(appointment.type);
  if (appointment.notes !== undefined) payload.observacoes = appointment.notes;
  if (appointment.value !== undefined) payload.valor = appointment.value;
  if (appointment.convenioId !== undefined) payload.convenio_id = appointment.convenioId;

  console.log('[Appointments] denormalizeAppointment:', {
    input: appointment,
    output: payload,
    note: 'profissional_id omitido - backend determina via auth context'
  });
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
