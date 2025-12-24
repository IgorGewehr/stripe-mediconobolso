"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
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
 * Uses polling-based updates from doctor-server
 */
const useConversations = (options = {}) => {
  const { autoLoad = true, limit = 50 } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

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

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && doctorId) {
      loadConversations();
    }
  }, [autoLoad, doctorId, loadConversations]);

  // Polling-based subscription for conversations
  useEffect(() => {
    if (!autoLoad || !doctorId) return;

    console.log('[useConversations] Setting up polling listener');

    const unsubscribe = conversationsService.subscribeToConversations(doctorId, (data) => {
      console.log('[useConversations] Polling update:', data.length, 'conversations');
      setConversations(data);
      setLoading(false);
      setHasMore(data.length === limit);
    }, limit);

    return () => {
      console.log('[useConversations] Cleaning up polling');
      unsubscribe();
    };
  }, [autoLoad, doctorId, limit]);

  // Polling-based subscription for messages
  useEffect(() => {
    if (!doctorId || !selectedConversation?.id) return;

    console.log('[useConversations] Setting up message polling for:', selectedConversation.id);

    const unsubscribe = conversationsService.subscribeToMessages(
      doctorId,
      selectedConversation.id,
      (data) => {
        console.log('[useConversations] Messages updated:', data.length);
        setMessages(data);
        setLoadingMessages(false);
      }
    );

    return () => {
      console.log('[useConversations] Cleaning up message polling');
      unsubscribe();
    };
  }, [doctorId, selectedConversation?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversationsService.cleanup();
    };
  }, []);

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
    isSecretary
  };
};

export default useConversations;
