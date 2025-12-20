/**
 * Conversation Model
 *
 * Data structure for WhatsApp/Social Media conversations.
 * Used for managing patient communication through messaging platforms.
 */

/**
 * Conversation Status Types
 */
export const ConversationStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUCCESS: 'success',
  ABANDONED: 'abandoned',
  PENDING: 'pending'
};

/**
 * Channel Types
 */
export const ChannelType = {
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram'
};

/**
 * Message Sender Types
 */
export const MessageSender = {
  CLIENT: 'client',
  DOCTOR: 'doctor',
  AI: 'ai',
  SECRETARY: 'secretary'
};

/**
 * Conversation data model
 * @typedef {Object} Conversation
 */
export const ConversationModel = {
  id: '',
  doctorId: '',

  // Client info
  clientPhone: '',
  clientName: '',
  socialId: '', // For Facebook/Instagram

  // Channel info
  channel: ChannelType.WHATSAPP,

  // Status and control
  status: ConversationStatus.ACTIVE,
  isRead: true,
  unreadCount: 0,

  // Message info
  lastMessage: '',
  lastMessageAt: null,
  messageCount: 0,

  // AI Control
  aiBlocked: false,
  aiBlockedUntil: null,
  aiBlockedReason: '',

  // Tags and categorization
  tags: [],
  outcome: null, // 'scheduled', 'cancelled', 'pending', etc.

  // Patient link (if identified)
  patientId: null,

  // Metadata
  createdAt: null,
  updatedAt: null
};

/**
 * Message data model
 * @typedef {Object} Message
 */
export const MessageModel = {
  id: '',
  conversationId: '',
  doctorId: '',

  // Message content
  clientMessage: '',
  doctorMessage: '', // or AI message
  aiMessage: '',

  // Media attachments
  clientMediaUrls: [],
  doctorMediaUrls: [],

  // Sender info
  sender: MessageSender.CLIENT,
  senderName: '',

  // Timestamps
  clientMessageTimestamp: null,
  doctorMessageTimestamp: null,
  createdAt: null,

  // AI context
  context: {
    functionsCalled: [],
    aiModel: '',
    responseTime: 0
  },

  // Status
  status: 'sent', // 'sent', 'delivered', 'read', 'failed'

  // WhatsApp message ID for tracking
  whatsappMessageId: ''
};

/**
 * AI Block Record model
 * @typedef {Object} AIBlockRecord
 */
export const AIBlockRecordModel = {
  phone: '',
  doctorId: '',
  blocked: false,
  reason: '',
  duration: 1, // hours
  blockedAt: null,
  expiresAt: null,
  createdBy: '' // userId who blocked
};

/**
 * Create a new conversation object with defaults
 * @param {Partial<Conversation>} data - Conversation data
 * @returns {Conversation} Conversation object
 */
export function createConversation(data = {}) {
  const now = new Date();
  return {
    ...ConversationModel,
    ...data,
    id: data.id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

/**
 * Create a new message object with defaults
 * @param {Partial<Message>} data - Message data
 * @returns {Message} Message object
 */
export function createMessage(data = {}) {
  const now = new Date();
  return {
    ...MessageModel,
    ...data,
    id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: data.createdAt || now
  };
}

/**
 * Create AI block record
 * @param {Partial<AIBlockRecord>} data - Block data
 * @returns {AIBlockRecord} AI Block record
 */
export function createAIBlockRecord(data = {}) {
  const now = new Date();
  const duration = data.duration || 1;
  const expiresAt = new Date(now.getTime() + (duration * 60 * 60 * 1000));

  return {
    ...AIBlockRecordModel,
    ...data,
    blocked: data.blocked !== false,
    blockedAt: now,
    expiresAt: data.expiresAt || expiresAt
  };
}

/**
 * Validate conversation data
 * @param {Partial<Conversation>} data - Conversation data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConversation(data) {
  const errors = [];

  if (!data.doctorId) {
    errors.push('ID do médico é obrigatório');
  }

  if (!data.clientPhone && !data.socialId) {
    errors.push('Telefone do cliente ou ID social é obrigatório');
  }

  if (!Object.values(ChannelType).includes(data.channel)) {
    errors.push('Canal inválido');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get status label in Portuguese
 * @param {string} status - Conversation status
 * @returns {string} Portuguese label
 */
export function getStatusLabel(status) {
  const labels = {
    [ConversationStatus.ACTIVE]: 'Ativa',
    [ConversationStatus.COMPLETED]: 'Concluída',
    [ConversationStatus.SUCCESS]: 'Sucesso',
    [ConversationStatus.ABANDONED]: 'Abandonada',
    [ConversationStatus.PENDING]: 'Pendente'
  };
  return labels[status] || status;
}

/**
 * Get status color for MUI
 * @param {string} status - Conversation status
 * @returns {string} MUI color name
 */
export function getStatusColor(status) {
  const colors = {
    [ConversationStatus.ACTIVE]: 'warning',
    [ConversationStatus.COMPLETED]: 'info',
    [ConversationStatus.SUCCESS]: 'success',
    [ConversationStatus.ABANDONED]: 'error',
    [ConversationStatus.PENDING]: 'default'
  };
  return colors[status] || 'default';
}

/**
 * Get channel configuration
 * @param {string} channel - Channel type
 * @returns {{ label: string, color: string, icon: string }}
 */
export function getChannelConfig(channel) {
  const configs = {
    [ChannelType.WHATSAPP]: {
      label: 'WhatsApp',
      color: '#25D366',
      icon: 'WhatsApp'
    },
    [ChannelType.FACEBOOK]: {
      label: 'Facebook',
      color: '#1877F2',
      icon: 'Facebook'
    },
    [ChannelType.INSTAGRAM]: {
      label: 'Instagram',
      color: '#E4405F',
      icon: 'Instagram'
    }
  };
  return configs[channel] || configs[ChannelType.WHATSAPP];
}

/**
 * Check if AI block has expired
 * @param {AIBlockRecord} blockRecord - Block record
 * @returns {boolean} True if expired
 */
export function isAIBlockExpired(blockRecord) {
  if (!blockRecord || !blockRecord.blocked) return true;
  if (!blockRecord.expiresAt) return false;

  const expiresAt = blockRecord.expiresAt instanceof Date
    ? blockRecord.expiresAt
    : new Date(blockRecord.expiresAt);

  return new Date() > expiresAt;
}

export default ConversationModel;
