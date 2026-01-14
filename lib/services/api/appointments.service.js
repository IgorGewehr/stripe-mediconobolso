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
    console.log('📤 [appointments.service] Input recebido:', appointmentData);
    console.log('📤 [appointments.service] Payload enviado:', JSON.stringify(payload, null, 2));
    console.log('📤 [appointments.service] paciente_id é UUID válido?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.paciente_id));
    console.log('📤 [appointments.service] data_hora_inicio:', payload.data_hora_inicio);
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
   * Usa endpoint dedicado que respeita o clinic_mode:
   * - Solo: verifica conflito global (1 evento por horário)
   * - MultiDoctor: verifica conflito por profissional
   * Nota: profissional_id não é enviado - backend usa auth.user_id
   */
  async checkConflict(startTime, durationMinutes = 30, excludeId = null, roomId = null) {
    try {
      const response = await apiService.post(`${ENDPOINT}/check-conflict`, {
        data_hora_inicio: startTime,
        duracao_minutos: durationMinutes,
        exclude_id: excludeId,
        room_id: roomId,
      });

      return {
        hasConflict: response.has_conflict,
        conflictType: response.conflict_type, // 'global', 'professional', 'room'
        message: response.message,
        clinicMode: response.clinic_mode, // 'solo' ou 'multi_doctor'
      };
    } catch (error) {
      console.warn('Erro ao verificar conflito:', error);
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
 * Corrigido para alinhar com os campos que o backend realmente retorna
 */
function normalizeAppointment(appointment) {
  if (!appointment) return null;

  // Extrair data de data_hora_inicio (backend não retorna 'data' separado)
  const extractDate = (dateTime) => {
    if (!dateTime) return null;
    try {
      return dateTime.split('T')[0];
    } catch {
      return null;
    }
  };

  return {
    id: appointment.id,
    // Relacionamentos
    patientId: appointment.paciente_id,
    patientName: appointment.paciente_nome || null, // Backend pode não retornar
    professionalId: appointment.profissional_id,
    professionalName: appointment.profissional_nome || null, // Backend pode não retornar
    // Datas e horários - 'data' extraído de data_hora_inicio
    date: extractDate(appointment.data_hora_inicio),
    startTime: appointment.data_hora_inicio,
    endTime: appointment.data_hora_fim,
    consultationDate: appointment.data_hora_inicio,
    durationMinutes: appointment.duracao_minutos || 30,
    // Detalhes - backend retorna 'tipo' não 'tipo_consulta'
    type: normalizeAppointmentType(appointment.tipo),
    status: normalizeStatus(appointment.status),
    notes: appointment.observacoes,
    internalNotes: appointment.observacoes_internas,
    reason: appointment.motivo,
    cancellationReason: appointment.motivo_cancelamento,
    // Telemedicina - derivado do tipo ou link
    isTelemedicine: appointment.tipo === 'telemedicine' || !!appointment.link_telemedicina,
    telemedicineLink: appointment.link_telemedicina,
    // Financeiro
    value: appointment.valor,
    convenioId: appointment.convenio_id,
    // Sala (para clínicas multi-doctor)
    roomId: appointment.room_id,
    roomName: appointment.room_name,
    // Recorrência
    isRecurring: !!appointment.recorrencia_id,
    recurrenceId: appointment.recorrencia_id,
    // Timestamps do fluxo - backend retorna confirmado_em e cancelado_em
    confirmedAt: appointment.confirmado_em,
    cancelledAt: appointment.cancelado_em,
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
 * Nota: profissional_id é opcional - backend usa auth.user_id se não enviado
 *
 * Backend CreateAppointmentRequest espera:
 * - paciente_id: UUID (obrigatório)
 * - profissional_id: Option<UUID>
 * - convenio_id: Option<UUID>
 * - tipo: AppointmentType (default 'consultation')
 * - data_hora_inicio: DateTime<Utc> (obrigatório)
 * - duracao_minutos: i32 (default 30)
 * - motivo: Option<String>
 * - observacoes: Option<String>
 * - valor: Option<Decimal>
 * - room_id: Option<UUID>
 * - room_name: Option<String>
 */
function denormalizeAppointment(appointment) {
  const payload = {};

  // Campos obrigatórios
  if (appointment.patientId !== undefined) payload.paciente_id = appointment.patientId;
  if (appointment.startTime !== undefined) payload.data_hora_inicio = appointment.startTime;

  // Campos opcionais
  if (appointment.professionalId !== undefined) payload.profissional_id = appointment.professionalId;
  if (appointment.type !== undefined) payload.tipo = mapAppointmentType(appointment.type);
  if (appointment.durationMinutes !== undefined) payload.duracao_minutos = appointment.durationMinutes;
  if (appointment.reason !== undefined) payload.motivo = appointment.reason;
  if (appointment.notes !== undefined) payload.observacoes = appointment.notes;
  if (appointment.internalNotes !== undefined) payload.observacoes_internas = appointment.internalNotes;
  if (appointment.value !== undefined) payload.valor = appointment.value;
  if (appointment.convenioId !== undefined) payload.convenio_id = appointment.convenioId;

  // Campos de sala (para clínicas multi-doctor)
  if (appointment.roomId !== undefined) payload.room_id = appointment.roomId;
  if (appointment.roomName !== undefined) payload.room_name = appointment.roomName;

  return payload;
}

/**
 * Normaliza status do backend para o frontend (com labels em português)
 * Backend usa: scheduled, confirmed, waiting, in_progress, completed, cancelled, no_show
 */
function normalizeStatus(status) {
  const map = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    waiting: 'Chegou', // Backend usa 'waiting' não 'checked_in'
    in_progress: 'Em Atendimento',
    completed: 'Finalizado',
    cancelled: 'Cancelado',
    no_show: 'Faltou',
  };
  return map[status] || status;
}

/**
 * Normaliza tipo de consulta do backend para o frontend
 * Backend usa enum: consultation, return_visit, exam, procedure, surgery, telemedicine
 */
function normalizeAppointmentType(type) {
  if (!type) return 'Consulta';

  const typeMap = {
    consultation: 'Consulta',
    return_visit: 'Retorno',
    exam: 'Exame',
    procedure: 'Procedimento',
    surgery: 'Cirurgia',
    telemedicine: 'Telemedicina',
  };

  return typeMap[type] || type;
}

export default appointmentsService;
