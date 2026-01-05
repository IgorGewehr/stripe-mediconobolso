"use client";

/**
 * useConversations Hook
 *
 * Manages conversations state using WebSocket for real-time updates.
 * Replaces the old polling-based approach with efficient WebSocket events.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../providers/authProvider';
import { useWebSocket, WS_EVENT_TYPES } from '../providers/WebSocketProvider';
import { conversationsService } from '@/lib/services/api/conversations.service';

/**
 * Conversation status constants
 */
export const ConversationStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUCCESS: 'success',
  ABANDONED: 'abandoned'
};

/**
 * Hook for managing conversations state and operations
 * Uses WebSocket for real-time updates
 */
const useConversations = (options = {}) => {
  const { autoLoad = true, limit = 50 } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();
  const { subscribe, isConnected: wsConnected } = useWebSocket();

  // Get effective doctor ID (for secretaries, use the doctor they work for)
  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    channel: 'all',
    tags: []
  });

  // Ref to track if we've done initial fetch
  const initialFetchDone = useRef(false);
  const selectedConversationRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  /**
   * Load conversations from API
   */
  const loadConversations = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await conversationsService.listConversations(doctorId, {
        status: filters.status !== 'all' ? filters.status : undefined,
        channel: filters.channel !== 'all' ? filters.channel : undefined,
        limit
      });

      setConversations(data);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('[useConversations] Error loading conversations:', err);
      setError('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [doctorId, filters.status, filters.channel, limit]);

  /**
   * Select a conversation and load its messages
   */
  const selectConversation = useCallback(async (conversationId) => {
    if (!doctorId) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setSelectedConversation(conversation);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const data = await conversationsService.listMessages(doctorId, conversationId);
      setMessages(data);

      // Mark as read
      await conversationsService.markAsRead(doctorId, conversationId);

      // Update local state
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, isRead: true, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('[useConversations] Error loading messages:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  }, [doctorId, conversations]);

  /**
   * Clear conversation selection
   */
  const clearSelection = useCallback(() => {
    setSelectedConversation(null);
    setMessages([]);
  }, []);

  /**
   * Refresh conversations
   */
  const refresh = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async (conversationId) => {
    if (!doctorId) return;

    try {
      await conversationsService.markAsRead(doctorId, conversationId);
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, isRead: true, unreadCount: 0 } : c
      ));

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, isRead: true, unreadCount: 0 } : null);
      }
    } catch (err) {
      console.error('[useConversations] Error marking as read:', err);
    }
  }, [doctorId, selectedConversation?.id]);

  /**
   * Mark conversation as unread
   */
  const markAsUnread = useCallback(async (conversationId) => {
    if (!doctorId) return;

    try {
      await conversationsService.markAsUnread(doctorId, conversationId);
      const conversation = conversations.find(c => c.id === conversationId);

      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, isRead: false, unreadCount: c.messageCount } : c
      ));

      if (selectedConversation?.id === conversationId && conversation) {
        setSelectedConversation(prev => prev ? { ...prev, isRead: false, unreadCount: conversation.messageCount } : null);
      }
    } catch (err) {
      console.error('[useConversations] Error marking as unread:', err);
    }
  }, [doctorId, conversations, selectedConversation?.id]);

  /**
   * Update conversation status
   */
  const updateStatus = useCallback(async (conversationId, status) => {
    if (!doctorId) return;

    try {
      await conversationsService.updateStatus(doctorId, conversationId, status);
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, status } : c
      ));

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('[useConversations] Error updating status:', err);
    }
  }, [doctorId, selectedConversation?.id]);

  /**
   * Rename conversation
   */
  const renameConversation = useCallback(async (conversationId, newName) => {
    if (!doctorId) return;

    try {
      await conversationsService.renameConversation(doctorId, conversationId, newName);
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, clientName: newName } : c
      ));

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, clientName: newName } : null);
      }
    } catch (err) {
      console.error('[useConversations] Error renaming conversation:', err);
      throw err;
    }
  }, [doctorId, selectedConversation?.id]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (message) => {
    if (!doctorId || !selectedConversation) return;

    try {
      const newMessage = await conversationsService.addMessage(doctorId, selectedConversation.id, {
        doctorMessage: message,
        sender: isSecretary ? 'secretary' : 'doctor',
        senderName: user?.displayName || user?.email || ''
      });

      setMessages(prev => [...prev, newMessage]);

      // Update last message in conversation list
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: message.substring(0, 100), lastMessageAt: new Date() }
          : c
      ));
    } catch (err) {
      console.error('[useConversations] Error sending message:', err);
      throw err;
    }
  }, [doctorId, selectedConversation, isSecretary, user?.displayName, user?.email]);

  // Filter conversations client-side
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Channel filter
      if (filters.channel !== 'all') {
        const convChannel = conv.channel || 'whatsapp';
        if (convChannel !== filters.channel) return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = conv.clientName?.toLowerCase().includes(searchLower);
        const phoneMatch = conv.clientPhone?.includes(searchLower);
        const messageMatch = conv.lastMessage?.toLowerCase().includes(searchLower);
        if (!nameMatch && !phoneMatch && !messageMatch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && conv.status !== filters.status) return false;

      // Tags filter
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => conv.tags?.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [conversations, filters]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: conversations.length,
    active: conversations.filter(c => c.status === ConversationStatus.ACTIVE).length,
    completed: conversations.filter(c => c.status === ConversationStatus.COMPLETED).length,
    success: conversations.filter(c => c.status === ConversationStatus.SUCCESS).length,
    abandoned: conversations.filter(c => c.status === ConversationStatus.ABANDONED).length,
    whatsapp: conversations.filter(c => (c.channel || 'whatsapp') === 'whatsapp').length,
    facebook: conversations.filter(c => c.channel === 'facebook').length,
    instagram: conversations.filter(c => c.channel === 'instagram').length,
    unread: conversations.filter(c => !c.isRead).length
  }), [conversations]);

  /**
   * Initial fetch when doctorId changes
   */
  useEffect(() => {
    if (autoLoad && doctorId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      loadConversations();
    }
  }, [autoLoad, doctorId, loadConversations]);

  /**
   * Reset initial fetch flag when doctorId changes
   */
  useEffect(() => {
    initialFetchDone.current = false;
  }, [doctorId]);

  /**
   * Subscribe to WebSocket events for real-time conversation updates
   */
  useEffect(() => {
    if (!wsConnected || !doctorId) return;

    console.log('[useConversations] Setting up WebSocket subscriptions');

    // Handle new conversation created
    const unsubNew = subscribe(WS_EVENT_TYPES.CONVERSATION_NEW, (event) => {
      const { payload } = event;
      console.log('[useConversations] New conversation via WebSocket:', payload);

      // Only process events for our tenant
      if (payload.tenant_id !== doctorId) return;

      const newConversation = {
        id: payload.conversation_id,
        clientName: payload.client_name || 'Desconhecido',
        clientPhone: payload.client_phone || '',
        channel: payload.channel || 'whatsapp',
        status: 'active',
        isRead: false,
        unreadCount: 1,
        messageCount: 1,
        lastMessage: payload.last_message || '',
        lastMessageAt: new Date(),
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setConversations(prev => [newConversation, ...prev]);
    });

    // Handle conversation update (status, read state, etc.)
    const unsubUpdate = subscribe(WS_EVENT_TYPES.CONVERSATION_UPDATE, (event) => {
      const { payload } = event;
      console.log('[useConversations] Conversation update via WebSocket:', payload);

      if (payload.tenant_id !== doctorId) return;

      setConversations(prev => prev.map(conv => {
        if (conv.id !== payload.conversation_id) return conv;

        return {
          ...conv,
          status: payload.status ?? conv.status,
          isRead: payload.is_read ?? conv.isRead,
          unreadCount: payload.unread_count ?? conv.unreadCount,
          lastMessage: payload.last_message ?? conv.lastMessage,
          lastMessageAt: payload.last_message_at ? new Date(payload.last_message_at) : conv.lastMessageAt,
          updatedAt: new Date()
        };
      }));

      // Update selected conversation if it's the one being updated
      if (selectedConversationRef.current?.id === payload.conversation_id) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          status: payload.status ?? prev.status,
          isRead: payload.is_read ?? prev.isRead,
          unreadCount: payload.unread_count ?? prev.unreadCount,
          lastMessage: payload.last_message ?? prev.lastMessage,
          lastMessageAt: payload.last_message_at ? new Date(payload.last_message_at) : prev.lastMessageAt,
          updatedAt: new Date()
        } : null);
      }
    });

    // Handle new message in a conversation
    const unsubMessage = subscribe(WS_EVENT_TYPES.CONVERSATION_MESSAGE, (event) => {
      const { payload } = event;
      console.log('[useConversations] New message via WebSocket:', payload);

      if (payload.tenant_id !== doctorId) return;

      // Update conversation list with new message info
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id !== payload.conversation_id) return conv;

          const isCurrentlyViewing = selectedConversationRef.current?.id === conv.id;

          return {
            ...conv,
            lastMessage: payload.content?.substring(0, 100) || conv.lastMessage,
            lastMessageAt: new Date(),
            messageCount: conv.messageCount + 1,
            // Only increment unread if not currently viewing this conversation
            unreadCount: isCurrentlyViewing ? conv.unreadCount : conv.unreadCount + 1,
            isRead: isCurrentlyViewing ? conv.isRead : false
          };
        });

        // Move conversation to top if it exists
        const convIndex = updated.findIndex(c => c.id === payload.conversation_id);
        if (convIndex > 0) {
          const [conv] = updated.splice(convIndex, 1);
          updated.unshift(conv);
        }

        return updated;
      });

      // If this message is for the currently selected conversation, add it to messages
      if (selectedConversationRef.current?.id === payload.conversation_id) {
        const newMessage = {
          id: payload.message_id,
          content: payload.content || '',
          sender: payload.sender || 'user',
          senderName: payload.sender_name || '',
          timestamp: new Date(),
          isFromUser: payload.sender === 'user' || payload.is_from_user,
          whatsappMessageId: payload.whatsapp_message_id || null
        };

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    // Handle WhatsApp-specific message events (incoming messages from WhatsApp)
    const unsubWhatsApp = subscribe(WS_EVENT_TYPES.WHATSAPP_MESSAGE, (event) => {
      const { payload } = event;
      console.log('[useConversations] WhatsApp message via WebSocket:', payload);

      if (payload.tenant_id !== doctorId) return;

      // If there's a conversation_id, update it
      if (payload.conversation_id) {
        setConversations(prev => {
          let found = false;
          const updated = prev.map(conv => {
            if (conv.id !== payload.conversation_id) return conv;
            found = true;

            const isCurrentlyViewing = selectedConversationRef.current?.id === conv.id;

            return {
              ...conv,
              lastMessage: payload.content?.substring(0, 100) || conv.lastMessage,
              lastMessageAt: new Date(),
              messageCount: conv.messageCount + 1,
              unreadCount: isCurrentlyViewing ? conv.unreadCount : conv.unreadCount + 1,
              isRead: isCurrentlyViewing ? conv.isRead : false,
              clientName: payload.sender_name || conv.clientName
            };
          });

          // Move conversation to top if found
          if (found) {
            const convIndex = updated.findIndex(c => c.id === payload.conversation_id);
            if (convIndex > 0) {
              const [conv] = updated.splice(convIndex, 1);
              updated.unshift(conv);
            }
          }

          return updated;
        });

        // Add message to current conversation if viewing it
        if (selectedConversationRef.current?.id === payload.conversation_id) {
          const newMessage = {
            id: payload.message_id,
            content: payload.content || '',
            sender: 'user',
            senderName: payload.sender_name || payload.from || '',
            timestamp: new Date(),
            isFromUser: true,
            whatsappMessageId: payload.message_id
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id || m.whatsappMessageId === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      }
    });

    return () => {
      console.log('[useConversations] Cleaning up WebSocket subscriptions');
      unsubNew();
      unsubUpdate();
      unsubMessage();
      unsubWhatsApp();
    };
  }, [wsConnected, doctorId, subscribe]);

  return {
    // State
    conversations: filteredConversations,
    allConversations: conversations,
    selectedConversation,
    messages,
    loading,
    loadingMessages,
    error,
    hasMore,
    stats,

    // Filters
    filters,
    setFilters,

    // Actions
    selectConversation,
    clearSelection,
    refresh,
    markAsRead,
    markAsUnread,
    updateStatus,
    renameConversation,
    sendMessage,

    // Context
    doctorId,
    isSecretary,

    // WebSocket status
    isWebSocketConnected: wsConnected
  };
};

export default useConversations;
