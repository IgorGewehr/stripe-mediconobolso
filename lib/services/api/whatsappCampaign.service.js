/**
 * @fileoverview WhatsApp Campaign API Service
 * @description Service for managing mass WhatsApp campaigns - campaigns, sending, tracking
 */

import apiService from './apiService';

const API_BASE = '/whatsapp-campaigns';

// =============================================================================
// ENUMS
// =============================================================================

export const CampaignSourceType = {
  LIST: 'list',
  PATIENTS: 'patients',
  MANUAL: 'manual',
};

export const CampaignSourceTypeLabels = {
  [CampaignSourceType.LIST]: 'Lista de Contatos',
  [CampaignSourceType.PATIENTS]: 'Pacientes',
  [CampaignSourceType.MANUAL]: 'Manual',
};

export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending', // Backend uses 'sending', not 'running'
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const CampaignStatusLabels = {
  [CampaignStatus.DRAFT]: 'Rascunho',
  [CampaignStatus.SCHEDULED]: 'Agendada',
  [CampaignStatus.SENDING]: 'Enviando',
  [CampaignStatus.PAUSED]: 'Pausada',
  [CampaignStatus.COMPLETED]: 'Concluida',
  [CampaignStatus.CANCELLED]: 'Cancelada',
  [CampaignStatus.FAILED]: 'Falhou',
};

export const CampaignStatusColors = {
  [CampaignStatus.DRAFT]: 'default',
  [CampaignStatus.SCHEDULED]: 'info',
  [CampaignStatus.SENDING]: 'warning',
  [CampaignStatus.PAUSED]: 'secondary',
  [CampaignStatus.COMPLETED]: 'success',
  [CampaignStatus.CANCELLED]: 'error',
  [CampaignStatus.FAILED]: 'error',
};

export const RecipientStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

export const RecipientStatusLabels = {
  [RecipientStatus.PENDING]: 'Pendente',
  [RecipientStatus.QUEUED]: 'Na fila',
  [RecipientStatus.SENT]: 'Enviado',
  [RecipientStatus.DELIVERED]: 'Entregue',
  [RecipientStatus.READ]: 'Lido',
  [RecipientStatus.FAILED]: 'Falhou',
};

export const MediaType = {
  NONE: 'none',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
};

export const MediaTypeLabels = {
  [MediaType.NONE]: 'Sem midia',
  [MediaType.IMAGE]: 'Imagem',
  [MediaType.DOCUMENT]: 'Documento',
  [MediaType.AUDIO]: 'Audio',
  [MediaType.VIDEO]: 'Video',
};

// =============================================================================
// CAMPAIGNS
// =============================================================================

/**
 * List WhatsApp campaigns
 * @param {Object} [options]
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.sourceType] - Filter by source type
 * @param {string} [options.search] - Search query
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number }>}
 */
export async function listCampaigns(options = {}) {
  const params = {};
  if (options.status) params.status = options.status;
  if (options.sourceType) params.source_type = options.sourceType;
  if (options.search) params.search = options.search;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(API_BASE, params);
}

/**
 * Get campaign by ID
 * @param {string} id - Campaign ID
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function getCampaign(id) {
  return apiService.get(`${API_BASE}/${id}`);
}

/**
 * Create a new WhatsApp campaign
 * @param {Object} data
 * @param {string} data.name - Campaign name
 * @param {string} data.message - Message content (template)
 * @param {string} [data.mediaUrl] - Media URL (optional)
 * @param {string} [data.mediaType] - Media type (image, document, audio, video)
 * @param {string} [data.mediaFilename] - Media filename (optional)
 * @param {string} data.sourceType - Source type (list, patients, manual)
 * @param {string} [data.sourceId] - Source ID (list ID)
 * @param {Object} [data.patientFilter] - Patient filter (for sourceType='patients')
 * @param {number} [data.dailyLimit=1000] - Daily send limit
 * @param {number} [data.batchSize=20] - Batch size
 * @param {number} [data.batchIntervalSecs=60] - Interval between batches in seconds
 * @param {number} [data.messageDelayMs=3000] - Delay between messages in milliseconds
 * @param {Array} [data.recipients] - Manual recipients (for sourceType='manual')
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function createCampaign(data) {
  const payload = {
    name: data.name,
    message_template: data.message, // Backend expects message_template
    media_url: data.mediaUrl || null,
    media_type: data.mediaType || null,
    media_filename: data.mediaFilename || null,
    source_type: data.sourceType,
    source_id: data.sourceId || null,
    patient_filter: data.patientFilter || null,
    daily_limit: data.dailyLimit || 1000,
    batch_size: data.batchSize || 20,
    batch_interval_secs: data.batchIntervalSecs || 60,
    message_delay_ms: data.messageDelayMs || 3000,
    recipients: data.recipients || null,
  };

  return apiService.post(API_BASE, payload);
}

/**
 * Update a campaign (only draft campaigns)
 * @param {string} id - Campaign ID
 * @param {Object} data - Fields to update
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function updateCampaign(id, data) {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.message !== undefined) payload.message = data.message;
  if (data.mediaUrl !== undefined) payload.media_url = data.mediaUrl;
  if (data.mediaType !== undefined) payload.media_type = data.mediaType;
  if (data.dailyLimit !== undefined) payload.daily_limit = data.dailyLimit;
  if (data.batchSize !== undefined) payload.batch_size = data.batchSize;
  if (data.messageDelaySecs !== undefined) payload.message_delay_secs = data.messageDelaySecs;

  return apiService.put(`${API_BASE}/${id}`, payload);
}

/**
 * Delete a campaign (only draft or cancelled)
 * @param {string} id - Campaign ID
 * @returns {Promise<void>}
 */
export async function deleteCampaign(id) {
  return apiService.delete(`${API_BASE}/${id}`);
}

/**
 * Schedule a campaign for future sending
 * @param {string} id - Campaign ID
 * @param {Date|string} scheduledAt - Scheduled date/time
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function scheduleCampaign(id, scheduledAt) {
  const date = typeof scheduledAt === 'string' ? scheduledAt : scheduledAt.toISOString();
  return apiService.post(`${API_BASE}/${id}/schedule`, { scheduled_at: date });
}

/**
 * Start sending a campaign immediately
 * @param {string} id - Campaign ID
 * @returns {Promise<{ message: string, campaign_id: string }>}
 */
export async function startCampaign(id) {
  return apiService.post(`${API_BASE}/${id}/send`);
}

/**
 * Pause a sending campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function pauseCampaign(id) {
  return apiService.post(`${API_BASE}/${id}/pause`);
}

/**
 * Resume a paused campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function resumeCampaign(id) {
  return apiService.post(`${API_BASE}/${id}/resume`);
}

/**
 * Cancel a campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<WhatsAppCampaign>}
 */
export async function cancelCampaign(id) {
  return apiService.post(`${API_BASE}/${id}/cancel`);
}

/**
 * List recipients of a campaign
 * @param {string} id - Campaign ID
 * @param {Object} [options]
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=50] - Items per page
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number }>}
 */
export async function listRecipients(id, options = {}) {
  const params = {};
  if (options.status) params.status = options.status;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`${API_BASE}/${id}/recipients`, params);
}

/**
 * Get campaign statistics
 * @param {string} id - Campaign ID
 * @returns {Promise<CampaignStats>}
 */
export async function getCampaignStats(id) {
  return apiService.get(`${API_BASE}/${id}/stats`);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format campaign metrics for display
 * @param {Object} campaign - Campaign object
 * @returns {Object} Formatted metrics
 */
export function formatCampaignMetrics(campaign) {
  const totalRecipients = campaign.total_recipients || 0;
  const sentCount = campaign.sent_count || 0;
  const deliveredCount = campaign.delivered_count || 0;
  const readCount = campaign.read_count || 0;
  const failedCount = campaign.failed_count || 0;

  return {
    totalRecipients,
    sentCount,
    deliveredCount,
    readCount,
    failedCount,
    progress: totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0,
    deliveryRate: sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100 * 10) / 10 : 0,
    readRate: deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100 * 10) / 10 : 0,
    failRate: totalRecipients > 0 ? Math.round((failedCount / totalRecipients) * 100 * 10) / 10 : 0,
  };
}

/**
 * Check if campaign can be edited
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function canEditCampaign(status) {
  return status === CampaignStatus.DRAFT;
}

/**
 * Check if campaign can be started
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function canStartCampaign(status) {
  return status === CampaignStatus.DRAFT || status === CampaignStatus.SCHEDULED;
}

/**
 * Check if campaign can be paused
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function canPauseCampaign(status) {
  return status === CampaignStatus.SENDING;
}

/**
 * Check if campaign can be resumed
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function canResumeCampaign(status) {
  return status === CampaignStatus.PAUSED;
}

/**
 * Check if campaign can be cancelled
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function canCancelCampaign(status) {
  return [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED].includes(status);
}

/**
 * Check if campaign is terminal (completed, cancelled, or failed)
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function isCampaignTerminal(status) {
  return [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED, CampaignStatus.FAILED].includes(status);
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

/**
 * Validate phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export function isValidWhatsAppNumber(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  // Brazilian numbers: 11 digits (with 9th digit) or 13 digits (with country code)
  return cleaned.length === 11 || (cleaned.length === 13 && cleaned.startsWith('55'));
}

/**
 * Normalize phone number for API
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone with country code
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

/**
 * Get available template variables for WhatsApp
 * @returns {Array<{key: string, description: string}>}
 */
export function getTemplateVariables() {
  return [
    { key: '{{nome}}', description: 'Nome do paciente' },
    { key: '{{medico}}', description: 'Nome do medico' },
    { key: '{{data}}', description: 'Data da consulta' },
    { key: '{{hora}}', description: 'Hora da consulta' },
    { key: '{{clinica}}', description: 'Nome da clinica' },
  ];
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

const whatsappCampaignService = {
  // Campaigns
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  listRecipients,
  getCampaignStats,

  // Helpers
  formatCampaignMetrics,
  canEditCampaign,
  canStartCampaign,
  canPauseCampaign,
  canResumeCampaign,
  canCancelCampaign,
  isCampaignTerminal,
  formatPhoneNumber,
  isValidWhatsAppNumber,
  normalizePhoneNumber,
  getTemplateVariables,

  // Enums
  CampaignSourceType,
  CampaignSourceTypeLabels,
  CampaignStatus,
  CampaignStatusLabels,
  CampaignStatusColors,
  RecipientStatus,
  RecipientStatusLabels,
  MediaType,
  MediaTypeLabels,
};

export default whatsappCampaignService;
