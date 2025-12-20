/**
 * Conversation Service
 *
 * Handles all conversation and messaging operations for WhatsApp/Social Media.
 */

import { BaseService } from './base.service';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  createConversation,
  createMessage,
  createAIBlockRecord,
  ConversationStatus,
  isAIBlockExpired
} from '../../models/Conversation.model';

class ConversationService extends BaseService {
  /**
   * Get conversations collection reference for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {CollectionReference} Firestore collection reference
   */
  getConversationsRef(doctorId) {
    return collection(this.firestore, `users/${doctorId}/conversations`);
  }

  /**
   * Get messages collection reference for a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @returns {CollectionReference} Firestore collection reference
   */
  getMessagesRef(doctorId, conversationId) {
    return collection(this.firestore, `users/${doctorId}/conversations/${conversationId}/messages`);
  }

  /**
   * Get AI blocks collection reference for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {CollectionReference} Firestore collection reference
   */
  getAIBlocksRef(doctorId) {
    return collection(this.firestore, `users/${doctorId}/ai_blocks`);
  }

  // ============================================
  // Conversation Operations
  // ============================================

  /**
   * List all conversations for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of conversations
   */
  async listConversations(doctorId, options = {}) {
    try {
      const { status, channel, limitCount = 50 } = options;

      let q = query(
        this.getConversationsRef(doctorId),
        orderBy('lastMessageAt', 'desc'),
        limit(limitCount)
      );

      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      if (channel && channel !== 'all') {
        q = query(q, where('channel', '==', channel));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.handleError(error, 'listConversations');
      return [];
    }
  }

  /**
   * Get a specific conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object|null>} Conversation data
   */
  async getConversation(doctorId, conversationId) {
    try {
      const docRef = doc(this.getConversationsRef(doctorId), conversationId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      this.handleError(error, 'getConversation');
      return null;
    }
  }

  /**
   * Find conversation by phone number
   * @param {string} doctorId - Doctor ID
   * @param {string} phone - Client phone number
   * @returns {Promise<Object|null>} Conversation data
   */
  async findByPhone(doctorId, phone) {
    try {
      // First try to find active conversation
      let q = query(
        this.getConversationsRef(doctorId),
        where('clientPhone', '==', phone),
        where('status', 'in', [ConversationStatus.ACTIVE, ConversationStatus.PENDING]),
        limit(1)
      );

      let snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // If not found, get most recent conversation with this phone
      q = query(
        this.getConversationsRef(doctorId),
        where('clientPhone', '==', phone),
        orderBy('lastMessageAt', 'desc'),
        limit(1)
      );

      snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        // Reactivate conversation
        await this.updateConversation(doctorId, doc.id, {
          status: ConversationStatus.ACTIVE
        });
        return { id: doc.id, ...doc.data(), status: ConversationStatus.ACTIVE };
      }

      return null;
    } catch (error) {
      this.handleError(error, 'findByPhone');
      return null;
    }
  }

  /**
   * Find conversation by social ID (Facebook/Instagram)
   * @param {string} doctorId - Doctor ID
   * @param {string} socialId - Social media ID
   * @param {string} channel - Channel type
   * @returns {Promise<Object|null>} Conversation data
   */
  async findBySocialId(doctorId, socialId, channel) {
    try {
      let q = query(
        this.getConversationsRef(doctorId),
        where('socialId', '==', socialId),
        where('channel', '==', channel),
        where('status', 'in', [ConversationStatus.ACTIVE, ConversationStatus.PENDING]),
        limit(1)
      );

      let snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // Try to find most recent
      q = query(
        this.getConversationsRef(doctorId),
        where('socialId', '==', socialId),
        where('channel', '==', channel),
        orderBy('lastMessageAt', 'desc'),
        limit(1)
      );

      snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await this.updateConversation(doctorId, doc.id, {
          status: ConversationStatus.ACTIVE
        });
        return { id: doc.id, ...doc.data(), status: ConversationStatus.ACTIVE };
      }

      return null;
    } catch (error) {
      this.handleError(error, 'findBySocialId');
      return null;
    }
  }

  /**
   * Create a new conversation
   * @param {string} doctorId - Doctor ID
   * @param {Object} data - Conversation data
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(doctorId, data) {
    try {
      const conversation = createConversation({
        ...data,
        doctorId
      });

      const docRef = doc(this.getConversationsRef(doctorId), conversation.id);
      await setDoc(docRef, {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.log('Conversation created', { conversationId: conversation.id });
      return conversation;
    } catch (error) {
      this.handleError(error, 'createConversation');
    }
  }

  /**
   * Update a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} data - Update data
   * @returns {Promise<boolean>} Success status
   */
  async updateConversation(doctorId, conversationId, data) {
    try {
      const docRef = doc(this.getConversationsRef(doctorId), conversationId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      this.handleError(error, 'updateConversation');
      return false;
    }
  }

  /**
   * Mark conversation as read
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async markAsRead(doctorId, conversationId) {
    return this.updateConversation(doctorId, conversationId, {
      isRead: true,
      unreadCount: 0
    });
  }

  /**
   * Mark conversation as unread
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async markAsUnread(doctorId, conversationId) {
    try {
      const conversation = await this.getConversation(doctorId, conversationId);
      return this.updateConversation(doctorId, conversationId, {
        isRead: false,
        unreadCount: conversation?.messageCount || 1
      });
    } catch (error) {
      this.handleError(error, 'markAsUnread');
      return false;
    }
  }

  /**
   * Update conversation status
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  async updateStatus(doctorId, conversationId, status) {
    return this.updateConversation(doctorId, conversationId, { status });
  }

  /**
   * Rename conversation (update client name)
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {string} newName - New client name
   * @returns {Promise<boolean>} Success status
   */
  async renameConversation(doctorId, conversationId, newName) {
    return this.updateConversation(doctorId, conversationId, { clientName: newName });
  }

  /**
   * Subscribe to conversations in real-time
   * @param {string} doctorId - Doctor ID
   * @param {Function} callback - Callback function
   * @param {number} limitCount - Limit number of conversations
   * @returns {Function} Unsubscribe function
   */
  subscribeToConversations(doctorId, callback, limitCount = 50) {
    const q = query(
      this.getConversationsRef(doctorId),
      orderBy('lastMessageAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(conversations);
    }, (error) => {
      console.error('[ConversationService] subscribeToConversations error:', error);
    });
  }

  // ============================================
  // Message Operations
  // ============================================

  /**
   * List messages for a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {number} limitCount - Limit number of messages
   * @returns {Promise<Array>} Array of messages
   */
  async listMessages(doctorId, conversationId, limitCount = 100) {
    try {
      const q = query(
        this.getMessagesRef(doctorId, conversationId),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.handleError(error, 'listMessages');
      return [];
    }
  }

  /**
   * Add a message to a conversation
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async addMessage(doctorId, conversationId, messageData) {
    try {
      const message = createMessage({
        ...messageData,
        conversationId,
        doctorId
      });

      const docRef = doc(this.getMessagesRef(doctorId, conversationId), message.id);
      await setDoc(docRef, {
        ...message,
        createdAt: serverTimestamp()
      });

      // Update conversation with last message info
      const lastMessage = messageData.clientMessage || messageData.doctorMessage || messageData.aiMessage || '';
      await this.updateConversation(doctorId, conversationId, {
        lastMessage: lastMessage.substring(0, 100),
        lastMessageAt: serverTimestamp(),
        messageCount: (await this.getConversation(doctorId, conversationId))?.messageCount + 1 || 1
      });

      // If message is from client, increment unread count
      if (messageData.sender === 'client') {
        const conv = await this.getConversation(doctorId, conversationId);
        await this.updateConversation(doctorId, conversationId, {
          isRead: false,
          unreadCount: (conv?.unreadCount || 0) + 1
        });
      }

      return message;
    } catch (error) {
      this.handleError(error, 'addMessage');
    }
  }

  /**
   * Subscribe to messages in real-time
   * @param {string} doctorId - Doctor ID
   * @param {string} conversationId - Conversation ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToMessages(doctorId, conversationId, callback) {
    const q = query(
      this.getMessagesRef(doctorId, conversationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    }, (error) => {
      console.error('[ConversationService] subscribeToMessages error:', error);
    });
  }

  // ============================================
  // AI Block Operations
  // ============================================

  /**
   * Get AI block status for a phone number
   * @param {string} doctorId - Doctor ID
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} Block status
   */
  async getAIBlockStatus(doctorId, phone) {
    try {
      const docRef = doc(this.getAIBlocksRef(doctorId), phone.replace(/\D/g, ''));
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return { blocked: false };
      }

      const blockRecord = snapshot.data();

      // Check if block has expired
      if (isAIBlockExpired(blockRecord)) {
        // Remove expired block
        await deleteDoc(docRef);
        return { blocked: false };
      }

      return {
        blocked: blockRecord.blocked,
        reason: blockRecord.reason,
        expiresAt: blockRecord.expiresAt?.toDate?.() || blockRecord.expiresAt
      };
    } catch (error) {
      this.handleError(error, 'getAIBlockStatus');
      return { blocked: false };
    }
  }

  /**
   * Block AI for a phone number
   * @param {string} doctorId - Doctor ID
   * @param {string} phone - Phone number
   * @param {Object} options - Block options
   * @returns {Promise<Object>} Block record
   */
  async blockAI(doctorId, phone, options = {}) {
    try {
      const { duration = 1, reason = '', createdBy = '' } = options;
      const normalizedPhone = phone.replace(/\D/g, '');

      const blockRecord = createAIBlockRecord({
        phone: normalizedPhone,
        doctorId,
        blocked: true,
        duration,
        reason,
        createdBy
      });

      const docRef = doc(this.getAIBlocksRef(doctorId), normalizedPhone);
      await setDoc(docRef, blockRecord);

      this.log('AI blocked', { phone: normalizedPhone, duration, reason });
      return blockRecord;
    } catch (error) {
      this.handleError(error, 'blockAI');
    }
  }

  /**
   * Unblock AI for a phone number
   * @param {string} doctorId - Doctor ID
   * @param {string} phone - Phone number
   * @returns {Promise<boolean>} Success status
   */
  async unblockAI(doctorId, phone) {
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const docRef = doc(this.getAIBlocksRef(doctorId), normalizedPhone);
      await deleteDoc(docRef);

      this.log('AI unblocked', { phone: normalizedPhone });
      return true;
    } catch (error) {
      this.handleError(error, 'unblockAI');
      return false;
    }
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get conversation statistics
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Statistics
   */
  async getStats(doctorId) {
    try {
      const conversations = await this.listConversations(doctorId, { limitCount: 500 });

      return {
        total: conversations.length,
        active: conversations.filter(c => c.status === ConversationStatus.ACTIVE).length,
        completed: conversations.filter(c => c.status === ConversationStatus.COMPLETED).length,
        success: conversations.filter(c => c.status === ConversationStatus.SUCCESS).length,
        abandoned: conversations.filter(c => c.status === ConversationStatus.ABANDONED).length,
        whatsapp: conversations.filter(c => (c.channel || 'whatsapp') === 'whatsapp').length,
        facebook: conversations.filter(c => c.channel === 'facebook').length,
        instagram: conversations.filter(c => c.channel === 'instagram').length,
        unread: conversations.filter(c => !c.isRead).length
      };
    } catch (error) {
      this.handleError(error, 'getStats');
      return {
        total: 0, active: 0, completed: 0, success: 0, abandoned: 0,
        whatsapp: 0, facebook: 0, instagram: 0, unread: 0
      };
    }
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
export default conversationService;
