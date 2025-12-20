/**
 * Notification Settings Model
 *
 * Defines the structure for user notification preferences.
 * Each user (doctor or secretary) can independently configure their notifications.
 */

/**
 * Notification channels
 */
export const NotificationChannel = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in_app'
};

/**
 * Notification event types
 */
export const NotificationEventType = {
  NEW_MESSAGE: 'new_message',
  NEW_CONVERSATION: 'new_conversation',
  AI_BLOCKED: 'ai_blocked',
  AI_UNBLOCKED: 'ai_unblocked',
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  PATIENT_WAITING: 'patient_waiting'
};

/**
 * Sound options
 */
export const NotificationSound = {
  NONE: 'none',
  DEFAULT: 'default',
  CHIME: 'chime',
  BELL: 'bell'
};

/**
 * Default notification settings structure
 */
export const NotificationSettingsModel = {
  userId: '',
  doctorId: '', // The doctor this user belongs to (same as userId for doctors)
  role: 'doctor', // 'doctor' or 'secretary'

  // Global settings
  enabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  },

  // Channel-specific settings
  channels: {
    [NotificationChannel.WHATSAPP]: {
      enabled: true,
      events: {
        [NotificationEventType.NEW_MESSAGE]: true,
        [NotificationEventType.NEW_CONVERSATION]: true,
        [NotificationEventType.AI_BLOCKED]: true,
        [NotificationEventType.AI_UNBLOCKED]: false
      }
    },
    [NotificationChannel.IN_APP]: {
      enabled: true,
      sound: NotificationSound.DEFAULT,
      events: {
        [NotificationEventType.NEW_MESSAGE]: true,
        [NotificationEventType.NEW_CONVERSATION]: true,
        [NotificationEventType.AI_BLOCKED]: true,
        [NotificationEventType.APPOINTMENT_CREATED]: true,
        [NotificationEventType.PATIENT_WAITING]: true
      }
    },
    [NotificationChannel.PUSH]: {
      enabled: false,
      events: {
        [NotificationEventType.NEW_MESSAGE]: false,
        [NotificationEventType.NEW_CONVERSATION]: true,
        [NotificationEventType.APPOINTMENT_REMINDER]: true
      }
    },
    [NotificationChannel.EMAIL]: {
      enabled: false,
      events: {
        [NotificationEventType.APPOINTMENT_CREATED]: false,
        [NotificationEventType.APPOINTMENT_REMINDER]: false
      }
    }
  },

  // Conversation-specific settings
  conversations: {
    showPreview: true,
    groupByPatient: true,
    autoMarkAsRead: false,
    desktopNotifications: true
  },

  // Metadata
  createdAt: null,
  updatedAt: null
};

/**
 * Create default notification settings for a user
 */
export function createDefaultNotificationSettings(userId, doctorId, role = 'doctor') {
  return {
    ...NotificationSettingsModel,
    userId,
    doctorId: doctorId || userId,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Validate notification settings
 */
export function validateNotificationSettings(settings) {
  if (!settings) return false;
  if (!settings.userId) return false;
  if (!['doctor', 'secretary'].includes(settings.role)) return false;
  return true;
}

/**
 * Event type labels (Portuguese)
 */
export const EventTypeLabels = {
  [NotificationEventType.NEW_MESSAGE]: 'Nova mensagem',
  [NotificationEventType.NEW_CONVERSATION]: 'Nova conversa',
  [NotificationEventType.AI_BLOCKED]: 'IA pausada',
  [NotificationEventType.AI_UNBLOCKED]: 'IA reativada',
  [NotificationEventType.APPOINTMENT_CREATED]: 'Agendamento criado',
  [NotificationEventType.APPOINTMENT_REMINDER]: 'Lembrete de consulta',
  [NotificationEventType.PATIENT_WAITING]: 'Paciente aguardando'
};

/**
 * Channel labels (Portuguese)
 */
export const ChannelLabels = {
  [NotificationChannel.WHATSAPP]: 'WhatsApp',
  [NotificationChannel.EMAIL]: 'E-mail',
  [NotificationChannel.PUSH]: 'Push (Celular)',
  [NotificationChannel.IN_APP]: 'No aplicativo'
};

export default {
  NotificationChannel,
  NotificationEventType,
  NotificationSound,
  NotificationSettingsModel,
  createDefaultNotificationSettings,
  validateNotificationSettings,
  EventTypeLabels,
  ChannelLabels
};
