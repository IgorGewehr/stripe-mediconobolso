/**
 * AI Service
 *
 * Handles AI conversation storage and management.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as limitFn,
  serverTimestamp
} from 'firebase/firestore';
import { BaseService } from './base.service';

class AIService extends BaseService {
  /**
   * Save a new AI conversation
   * @param {string} userId - User ID
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<string>} Conversation ID
   */
  async saveConversation(userId, conversationData) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');

      const docData = {
        ...conversationData,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        userId
      };

      const docRef = await addDoc(conversationsRef, docData);
      this.log('Conversation saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      this.handleError(error, 'saveConversation');
    }
  }

  /**
   * Get user's conversations
   * @param {string} userId - User ID
   * @param {number} [maxResults=50] - Maximum results to return
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations(userId, maxResults = 50) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
      const q = query(
        conversationsRef,
        orderBy('lastMessageAt', 'desc'),
        limitFn(maxResults)
      );

      const querySnapshot = await getDocs(q);
      const conversations = [];

      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.log(`Loaded ${conversations.length} conversations for user ${userId}`);
      return conversations;
    } catch (error) {
      this.handleError(error, 'getConversations');
    }
  }

  /**
   * Get a specific conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation data
   */
  async getConversation(userId, conversationId) {
    try {
      if (!userId || !conversationId) {
        throw new Error('userId and conversationId are required');
      }

      const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      return {
        id: conversationDoc.id,
        ...conversationDoc.data()
      };
    } catch (error) {
      this.handleError(error, 'getConversation');
    }
  }

  /**
   * Update a conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} conversationData - Updated data
   * @returns {Promise<string>} Conversation ID
   */
  async updateConversation(userId, conversationId, conversationData) {
    try {
      if (!userId || !conversationId) {
        throw new Error('userId and conversationId are required');
      }

      const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);

      const updateData = {
        ...conversationData,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(conversationRef, updateData);
      this.log('Conversation updated:', conversationId);
      return conversationId;
    } catch (error) {
      this.handleError(error, 'updateConversation');
    }
  }

  /**
   * Delete a conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConversation(userId, conversationId) {
    try {
      if (!userId || !conversationId) {
        throw new Error('userId and conversationId are required');
      }

      const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);
      await deleteDoc(conversationRef);

      this.log('Conversation deleted:', conversationId);
      return true;
    } catch (error) {
      this.handleError(error, 'deleteConversation');
    }
  }

  /**
   * Search conversations by term
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching conversations
   */
  async searchConversations(userId, searchTerm) {
    try {
      if (!userId || !searchTerm) {
        throw new Error('userId and searchTerm are required');
      }

      const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
      const q = query(
        conversationsRef,
        orderBy('lastMessageAt', 'desc'),
        limitFn(100)
      );

      const querySnapshot = await getDocs(q);
      const conversations = [];
      const searchLower = searchTerm.toLowerCase();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const matchTitle = data.title?.toLowerCase().includes(searchLower);
        const matchMessages = data.messages?.some(msg =>
          msg.content?.toLowerCase().includes(searchLower)
        );

        if (matchTitle || matchMessages) {
          conversations.push({
            id: doc.id,
            ...data
          });
        }
      });

      this.log(`Found ${conversations.length} conversations with term: ${searchTerm}`);
      return conversations;
    } catch (error) {
      this.handleError(error, 'searchConversations');
    }
  }

  /**
   * Clean old conversations
   * @param {string} userId - User ID
   * @param {number} [daysOld=30] - Age threshold in days
   * @returns {Promise<number>} Number of deleted conversations
   */
  async cleanOldConversations(userId, daysOld = 30) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
      const q = query(conversationsRef, orderBy('lastMessageAt', 'asc'));
      const querySnapshot = await getDocs(q);

      const deletePromises = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lastMessageDate = data.lastMessageAt?.toDate
          ? data.lastMessageAt.toDate()
          : new Date(data.lastMessageAt);

        if (lastMessageDate < cutoffDate) {
          deletePromises.push(deleteDoc(docSnap.ref));
        }
      });

      await Promise.all(deletePromises);
      this.log(`Cleaned ${deletePromises.length} old conversations (>${daysOld} days)`);
      return deletePromises.length;
    } catch (error) {
      this.handleError(error, 'cleanOldConversations');
    }
  }

  /**
   * Get conversation statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getConversationStats(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
      const querySnapshot = await getDocs(conversationsRef);

      let totalConversations = 0;
      let totalMessages = 0;
      let totalTokens = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalConversations++;

        if (data.messages) {
          totalMessages += data.messages.length;
          data.messages.forEach(msg => {
            if (msg.tokensUsed) {
              totalTokens += msg.tokensUsed;
            }
          });
        }
      });

      const stats = {
        totalConversations,
        totalMessages,
        totalTokens,
        averageMessagesPerConversation: totalConversations > 0
          ? Math.round(totalMessages / totalConversations)
          : 0
      };

      this.log('Conversation stats:', stats);
      return stats;
    } catch (error) {
      this.handleError(error, 'getConversationStats');
    }
  }
}

export const aiService = new AIService();
export default aiService;
