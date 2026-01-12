/**
 * @fileoverview Email Campaign API Service
 * @description Service for managing mass email campaigns - lists, campaigns, sending, tracking
 */

import apiService from './apiService';

// =============================================================================
// ENUMS
// =============================================================================

export const EmailListSource = {
  IMPORT: 'import',
  SEGMENT: 'segment',
  MANUAL: 'manual',
};

export const EmailListSourceLabels = {
  [EmailListSource.IMPORT]: 'Importado',
  [EmailListSource.SEGMENT]: 'Segmento',
  [EmailListSource.MANUAL]: 'Manual',
};

export const CampaignSourceType = {
  LIST: 'list',
  PATIENTS: 'patients',
  MANUAL: 'manual',
};

export const CampaignSourceTypeLabels = {
  [CampaignSourceType.LIST]: 'Lista',
  [CampaignSourceType.PATIENTS]: 'Pacientes',
  [CampaignSourceType.MANUAL]: 'Manual',
};

export const CampaignStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const CampaignStatusLabels = {
  [CampaignStatus.DRAFT]: 'Rascunho',
  [CampaignStatus.SCHEDULED]: 'Agendada',
  [CampaignStatus.SENDING]: 'Enviando',
  [CampaignStatus.PAUSED]: 'Pausada',
  [CampaignStatus.COMPLETED]: 'Concluida',
  [CampaignStatus.CANCELLED]: 'Cancelada',
};

export const CampaignStatusColors = {
  [CampaignStatus.DRAFT]: 'default',
  [CampaignStatus.SCHEDULED]: 'info',
  [CampaignStatus.SENDING]: 'warning',
  [CampaignStatus.PAUSED]: 'secondary',
  [CampaignStatus.COMPLETED]: 'success',
  [CampaignStatus.CANCELLED]: 'error',
};

export const RecipientStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  FAILED: 'failed',
  BOUNCED: 'bounced',
};

export const RecipientStatusLabels = {
  [RecipientStatus.PENDING]: 'Pendente',
  [RecipientStatus.QUEUED]: 'Na fila',
  [RecipientStatus.SENT]: 'Enviado',
  [RecipientStatus.DELIVERED]: 'Entregue',
  [RecipientStatus.OPENED]: 'Aberto',
  [RecipientStatus.CLICKED]: 'Clicado',
  [RecipientStatus.FAILED]: 'Falhou',
  [RecipientStatus.BOUNCED]: 'Rejeitado',
};

// =============================================================================
// EMAIL LISTS
// =============================================================================

/**
 * List all email lists
 * @param {Object} [options]
 * @param {string} [options.source] - Filter by source (import, segment, manual)
 * @param {string} [options.search] - Search query
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=20] - Items per page
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number }>}
 */
export async function listEmailLists(options = {}) {
  const params = {};
  if (options.source) params.source = options.source;
  if (options.search) params.search = options.search;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get('/email-lists', params);
}

/**
 * Get email list by ID
 * @param {string} id - List ID
 * @returns {Promise<EmailList>}
 */
export async function getEmailList(id) {
  return apiService.get(`/email-lists/${id}`);
}

/**
 * Create a new email list
 * @param {Object} data
 * @param {string} data.name - List name
 * @param {string} [data.description] - List description
 * @returns {Promise<EmailList>}
 */
export async function createEmailList(data) {
  return apiService.post('/email-lists', {
    name: data.name,
    description: data.description || null,
  });
}

/**
 * Update an email list
 * @param {string} id - List ID
 * @param {Object} data - Fields to update
 * @returns {Promise<EmailList>}
 */
export async function updateEmailList(id, data) {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  return apiService.put(`/email-lists/${id}`, payload);
}

/**
 * Delete an email list
 * @param {string} id - List ID
 * @returns {Promise<void>}
 */
export async function deleteEmailList(id) {
  return apiService.delete(`/email-lists/${id}`);
}

/**
 * Import contacts from CSV file
 * @param {string} listId - List ID
 * @param {File} file - CSV file
 * @returns {Promise<{ total_rows: number, imported: number, duplicates: number, invalid: number }>}
 */
export async function importContactsCsv(listId, file) {
  return apiService.upload(`/email-lists/${listId}/import`, file);
}

/**
 * List contacts in an email list
 * @param {string} listId - List ID
 * @param {Object} [options]
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.perPage=50] - Items per page
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number }>}
 */
export async function listContacts(listId, options = {}) {
  const params = {};
  if (options.status) params.status = options.status;
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  return apiService.get(`/email-lists/${listId}/contacts`, params);
}

/**
 * Add a contact to an email list
 * @param {string} listId - List ID
 * @param {Object} data
 * @param {string} data.email - Email address
 * @param {string} [data.name] - Contact name
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<EmailListContact>}
 */
export async function addContact(listId, data) {
  return apiService.post(`/email-lists/${listId}/contacts`, {
    email: data.email,
    name: data.name || null,
    metadata: data.metadata || null,
  });
}

// =============================================================================
// EMAIL CAMPAIGNS
// =============================================================================

/**
 * List email campaigns
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

  return apiService.get('/email-campaigns', params);
}

/**
 * Get campaign by ID
 * @param {string} id - Campaign ID
 * @returns {Promise<EmailCampaign>}
 */
export async function getCampaign(id) {
  return apiService.get(`/email-campaigns/${id}`);
}

/**
 * Create a new email campaign
 * @param {Object} data
 * @param {string} data.name - Campaign name
 * @param {string} data.subject - Email subject
 * @param {string} data.body - Email body
 * @param {string} [data.templateId] - Template ID
 * @param {string} data.sourceType - Source type (list, patients, manual)
 * @param {string} [data.sourceId] - Source ID (list ID)
 * @param {Object} [data.patientFilter] - Patient filter (for sourceType='patients')
 * @param {number} [data.dailyLimit=500] - Daily send limit
 * @param {number} [data.batchSize=50] - Batch size
 * @param {number} [data.batchIntervalSecs=60] - Batch interval in seconds
 * @param {Array} [data.recipients] - Manual recipients (for sourceType='manual')
 * @returns {Promise<EmailCampaign>}
 */
export async function createCampaign(data) {
  const payload = {
    name: data.name,
    subject: data.subject,
    body: data.body,
    template_id: data.templateId || null,
    source_type: data.sourceType,
    source_id: data.sourceId || null,
    patient_filter: data.patientFilter || null,
    daily_limit: data.dailyLimit || 500,
    batch_size: data.batchSize || 50,
    batch_interval_secs: data.batchIntervalSecs || 60,
    recipients: data.recipients || null,
  };

  return apiService.post('/email-campaigns', payload);
}

/**
 * Update a campaign (only draft campaigns)
 * @param {string} id - Campaign ID
 * @param {Object} data - Fields to update
 * @returns {Promise<EmailCampaign>}
 */
export async function updateCampaign(id, data) {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.body !== undefined) payload.body = data.body;
  if (data.templateId !== undefined) payload.template_id = data.templateId;
  if (data.dailyLimit !== undefined) payload.daily_limit = data.dailyLimit;
  if (data.batchSize !== undefined) payload.batch_size = data.batchSize;
  if (data.batchIntervalSecs !== undefined) payload.batch_interval_secs = data.batchIntervalSecs;

  return apiService.put(`/email-campaigns/${id}`, payload);
}

/**
 * Delete a campaign (only draft or cancelled)
 * @param {string} id - Campaign ID
 * @returns {Promise<void>}
 */
export async function deleteCampaign(id) {
  return apiService.delete(`/email-campaigns/${id}`);
}

/**
 * Schedule a campaign for future sending
 * @param {string} id - Campaign ID
 * @param {Date|string} scheduledAt - Scheduled date/time
 * @returns {Promise<EmailCampaign>}
 */
export async function scheduleCampaign(id, scheduledAt) {
  const date = typeof scheduledAt === 'string' ? scheduledAt : scheduledAt.toISOString();
  return apiService.post(`/email-campaigns/${id}/schedule`, { scheduled_at: date });
}

/**
 * Start sending a campaign immediately
 * @param {string} id - Campaign ID
 * @returns {Promise<{ message: string, campaign_id: string }>}
 */
export async function sendCampaign(id) {
  return apiService.post(`/email-campaigns/${id}/send`);
}

/**
 * Pause a sending campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<EmailCampaign>}
 */
export async function pauseCampaign(id) {
  return apiService.post(`/email-campaigns/${id}/pause`);
}

/**
 * Resume a paused campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<EmailCampaign>}
 */
export async function resumeCampaign(id) {
  return apiService.post(`/email-campaigns/${id}/resume`);
}

/**
 * Cancel a campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<EmailCampaign>}
 */
export async function cancelCampaign(id) {
  return apiService.post(`/email-campaigns/${id}/cancel`);
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

  return apiService.get(`/email-campaigns/${id}/recipients`, params);
}

/**
 * Get campaign statistics
 * @param {string} id - Campaign ID
 * @returns {Promise<CampaignStats>}
 */
export async function getCampaignStats(id) {
  return apiService.get(`/email-campaigns/${id}/stats`);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse CSV string into contacts array
 * @param {string} csvContent - CSV content
 * @returns {{ contacts: Array<{email: string, name?: string}>, errors: Array<string> }}
 */
export function parseCsvContacts(csvContent) {
  const lines = csvContent.split('\n');
  const contacts = [];
  const errors = [];
  const seenEmails = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || i === 0) continue; // Skip empty lines and header

    const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const email = parts[0]?.toLowerCase();
    const name = parts[1] || null;

    if (!email || !email.includes('@')) {
      errors.push(`Linha ${i + 1}: Email invalido "${email}"`);
      continue;
    }

    if (seenEmails.has(email)) {
      errors.push(`Linha ${i + 1}: Email duplicado "${email}"`);
      continue;
    }

    seenEmails.add(email);
    contacts.push({ email, name });
  }

  return { contacts, errors };
}

/**
 * Format campaign metrics for display
 * @param {Object} campaign - Campaign object
 * @returns {Object} Formatted metrics
 */
export function formatCampaignMetrics(campaign) {
  const totalRecipients = campaign.total_recipients || 0;
  const sentCount = campaign.sent_count || 0;
  const openedCount = campaign.opened_count || 0;
  const clickedCount = campaign.clicked_count || 0;
  const failedCount = campaign.failed_count || 0;

  return {
    totalRecipients,
    sentCount,
    openedCount,
    clickedCount,
    failedCount,
    progress: totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0,
    openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 100 * 10) / 10 : 0,
    clickRate: openedCount > 0 ? Math.round((clickedCount / openedCount) * 100 * 10) / 10 : 0,
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
 * Check if campaign is terminal (completed or cancelled)
 * @param {string} status - Campaign status
 * @returns {boolean}
 */
export function isCampaignTerminal(status) {
  return status === CampaignStatus.COMPLETED || status === CampaignStatus.CANCELLED;
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

const emailCampaignService = {
  // Email Lists
  listEmailLists,
  getEmailList,
  createEmailList,
  updateEmailList,
  deleteEmailList,
  importContactsCsv,
  listContacts,
  addContact,

  // Email Campaigns
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  listRecipients,
  getCampaignStats,

  // Helpers
  parseCsvContacts,
  formatCampaignMetrics,
  canEditCampaign,
  canStartCampaign,
  canPauseCampaign,
  canResumeCampaign,
  canCancelCampaign,
  isCampaignTerminal,

  // Enums
  EmailListSource,
  EmailListSourceLabels,
  CampaignSourceType,
  CampaignSourceTypeLabels,
  CampaignStatus,
  CampaignStatusLabels,
  CampaignStatusColors,
  RecipientStatus,
  RecipientStatusLabels,
};

export default emailCampaignService;
