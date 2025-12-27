/**
 * @fileoverview CRM API Service
 * @description Service for CRM management - follow-ups, reminders, patient engagement
 */

import apiService from './apiService';

const API_BASE = '/crm';

// =============================================================================
// ENUMS
// =============================================================================

export const FollowUpRuleType = {
  POST_CONSULTATION: 'post_consultation',
  PENDING_RETURN: 'pending_return',
  INACTIVITY: 'inactivity',
};

export const FollowUpRuleTypeLabels = {
  [FollowUpRuleType.POST_CONSULTATION]: 'Pós-Consulta',
  [FollowUpRuleType.PENDING_RETURN]: 'Retorno Pendente',
  [FollowUpRuleType.INACTIVITY]: 'Inatividade',
};

export const FollowUpRuleTypeDescriptions = {
  [FollowUpRuleType.POST_CONSULTATION]: 'Enviar mensagem X dias após a consulta',
  [FollowUpRuleType.PENDING_RETURN]: 'Lembrar sobre retorno que não foi realizado',
  [FollowUpRuleType.INACTIVITY]: 'Reengajar pacientes inativos há muito tempo',
};

export const FollowUpStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  RESPONDED: 'responded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const FollowUpStatusLabels = {
  [FollowUpStatus.PENDING]: 'Pendente',
  [FollowUpStatus.SENT]: 'Enviado',
  [FollowUpStatus.RESPONDED]: 'Respondido',
  [FollowUpStatus.COMPLETED]: 'Concluído',
  [FollowUpStatus.CANCELLED]: 'Cancelado',
  [FollowUpStatus.FAILED]: 'Falhou',
};

export const NotificationChannel = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
};

export const NotificationChannelLabels = {
  [NotificationChannel.WHATSAPP]: 'WhatsApp',
  [NotificationChannel.EMAIL]: 'E-mail',
};

// =============================================================================
// FOLLOW-UP RULES
// =============================================================================

/**
 * List follow-up rules with filters
 * @param {Object} [options]
 * @param {string} [options.ruleType] - Filter by rule type
 * @param {boolean} [options.active] - Filter by active status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<FollowUpRule>,
 *   total: number,
 *   page: number,
 *   per_page: number
 * }>}
 */
export async function listRules(options = {}) {
  const params = {};

  if (options.ruleType) params.rule_type = options.ruleType;
  if (options.active !== undefined) params.active = options.active;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/rules`, params);
}

/**
 * Get a specific follow-up rule by ID
 * @param {string} id - Rule ID
 * @returns {Promise<FollowUpRule>}
 */
export async function getRule(id) {
  return apiService.get(`${API_BASE}/rules/${id}`);
}

/**
 * Create a new follow-up rule
 * @param {Object} data
 * @param {string} data.name - Rule name
 * @param {string} data.ruleType - Rule type (post_consultation, pending_return, inactivity)
 * @param {number} data.triggerDays - Days after event to trigger
 * @param {Array<string>} data.channels - Notification channels (whatsapp, email)
 * @param {string} data.messageTemplate - Message template with variables
 * @param {boolean} [data.active=true] - Whether rule is active
 * @returns {Promise<FollowUpRule>}
 */
export async function createRule(data) {
  const payload = {
    name: data.name,
    rule_type: data.ruleType,
    trigger_days: data.triggerDays,
    channels: data.channels,
    message_template: data.messageTemplate,
    active: data.active !== undefined ? data.active : true,
  };

  return apiService.post(`${API_BASE}/rules`, payload);
}

/**
 * Update an existing follow-up rule
 * @param {string} id - Rule ID
 * @param {Object} data - Fields to update
 * @returns {Promise<FollowUpRule>}
 */
export async function updateRule(id, data) {
  const payload = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.ruleType !== undefined) payload.rule_type = data.ruleType;
  if (data.triggerDays !== undefined) payload.trigger_days = data.triggerDays;
  if (data.channels !== undefined) payload.channels = data.channels;
  if (data.messageTemplate !== undefined) payload.message_template = data.messageTemplate;
  if (data.active !== undefined) payload.active = data.active;

  return apiService.put(`${API_BASE}/rules/${id}`, payload);
}

/**
 * Delete a follow-up rule
 * @param {string} id - Rule ID
 * @returns {Promise<void>}
 */
export async function deleteRule(id) {
  return apiService.delete(`${API_BASE}/rules/${id}`);
}

// =============================================================================
// APPOINTMENT REMINDER CONFIG
// =============================================================================

/**
 * Get appointment reminder configuration for current doctor
 * @returns {Promise<ReminderConfig>}
 */
export async function getReminderConfig() {
  return apiService.get(`${API_BASE}/reminder-config`);
}

/**
 * Update appointment reminder configuration
 * @param {Object} data
 * @param {Array<number>} data.reminderHours - Hours before appointment to send reminders
 * @param {Array<string>} data.channels - Notification channels
 * @param {string} [data.messageTemplate] - Custom message template
 * @param {boolean} data.active - Whether reminders are active
 * @returns {Promise<ReminderConfig>}
 */
export async function updateReminderConfig(data) {
  const payload = {
    reminder_hours: data.reminderHours,
    channels: data.channels,
    message_template: data.messageTemplate || null,
    active: data.active,
  };

  return apiService.put(`${API_BASE}/reminder-config`, payload);
}

// =============================================================================
// PENDING FOLLOW-UPS
// =============================================================================

/**
 * List pending follow-ups with filters
 * @param {Object} [options]
 * @param {string} [options.patientId] - Filter by patient
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<PendingFollowUp>,
 *   total: number,
 *   page: number,
 *   per_page: number
 * }>}
 */
export async function listPendingFollowUps(options = {}) {
  const params = {};

  if (options.patientId) params.patient_id = options.patientId;
  if (options.status) params.status = options.status;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/pending`, params);
}

/**
 * Cancel a pending follow-up
 * @param {string} id - Follow-up ID
 * @returns {Promise<PendingFollowUp>}
 */
export async function cancelFollowUp(id) {
  return apiService.post(`${API_BASE}/pending/${id}/cancel`);
}

// =============================================================================
// STATS & ANALYTICS
// =============================================================================

/**
 * Get CRM statistics
 * @param {Object} [options]
 * @param {string} [options.period='month'] - Period: 'week', 'month', 'quarter', 'year'
 * @returns {Promise<CRMStats>}
 */
export async function getStats(options = {}) {
  const params = {};
  if (options.period) params.period = options.period;

  return apiService.get(`${API_BASE}/stats`, params);
}

/**
 * List inactive patients
 * @param {Object} [options]
 * @param {number} [options.days=90] - Minimum days of inactivity
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{
 *   items: Array<InactivePatient>,
 *   total: number,
 *   page: number,
 *   per_page: number
 * }>}
 */
export async function listInactivePatients(options = {}) {
  const params = {};

  if (options.days) params.days = options.days;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/patients/inactive`, params);
}

/**
 * Get default message templates
 * @returns {Promise<{
 *   post_consultation: string,
 *   pending_return: string,
 *   inactivity: string,
 *   appointment_reminder: string,
 *   appointment_confirmation: string
 * }>}
 */
export async function getDefaultTemplates() {
  return apiService.get(`${API_BASE}/templates/default`);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get available template variables
 * @returns {Array<{key: string, description: string}>}
 */
export function getTemplateVariables() {
  return [
    { key: '{{nome}}', description: 'Nome do paciente' },
    { key: '{{data}}', description: 'Data da consulta' },
    { key: '{{hora}}', description: 'Hora da consulta' },
    { key: '{{medico}}', description: 'Nome do médico' },
    { key: '{{tipo}}', description: 'Tipo de consulta' },
  ];
}

/**
 * Get reminder hour options
 * @returns {Array<{value: number, label: string}>}
 */
export function getReminderHourOptions() {
  return [
    { value: 2, label: '2 horas antes' },
    { value: 6, label: '6 horas antes' },
    { value: 12, label: '12 horas antes' },
    { value: 24, label: '1 dia antes' },
    { value: 48, label: '2 dias antes' },
    { value: 72, label: '3 dias antes' },
    { value: 168, label: '1 semana antes' },
  ];
}

/**
 * Format days to human readable string
 * @param {number} days - Number of days
 * @returns {string}
 */
export function formatDaysLabel(days) {
  if (days === 1) return '1 dia';
  if (days < 7) return `${days} dias`;
  if (days === 7) return '1 semana';
  if (days < 30) return `${Math.floor(days / 7)} semanas`;
  if (days === 30) return '1 mês';
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} ano(s)`;
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

const crmService = {
  // Follow-up Rules
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,

  // Reminder Config
  getReminderConfig,
  updateReminderConfig,

  // Pending Follow-ups
  listPendingFollowUps,
  cancelFollowUp,

  // Stats & Analytics
  getStats,
  listInactivePatients,
  getDefaultTemplates,

  // Helpers
  getTemplateVariables,
  getReminderHourOptions,
  formatDaysLabel,

  // Enums
  FollowUpRuleType,
  FollowUpRuleTypeLabels,
  FollowUpRuleTypeDescriptions,
  FollowUpStatus,
  FollowUpStatusLabels,
  NotificationChannel,
  NotificationChannelLabels,
};

export default crmService;
