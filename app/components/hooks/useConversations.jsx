"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { conversationService } from '@/lib/services/firebase';
import { ConversationStatus } from '@/lib/models/Conversation.model';

/**
 * Hook for managing conversations state and operations
 * Provides real-time conversation updates and message handling
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
   * Load conversations from Firebase
   */
  const loadConversations = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await conversationService.listConversations(doctorId, {
        status: filters.status !== 'all' ? filters.status : undefined,
        channel: filters.channel !== 'all' ? filters.channel : undefined,
        limitCount: limit
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
      const data = await conversationService.listMessages(doctorId, conversationId);
      setMessages(data);

      // Mark as read
      await conversationService.markAsRead(doctorId, conversationId);

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
      await conversationService.markAsRead(doctorId, conversationId);
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
      await conversationService.markAsUnread(doctorId, conversationId);
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
      await conversationService.updateStatus(doctorId, conversationId, status);
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
      await conversationService.renameConversation(doctorId, conversationId, newName);
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
      const newMessage = await conversationService.addMessage(doctorId, selectedConversation.id, {
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

  // Real-time subscription for conversations
  useEffect(() => {
    if (!autoLoad || !doctorId) return;

    console.log('[useConversations] Setting up real-time listener');

    const unsubscribe = conversationService.subscribeToConversations(doctorId, (data) => {
      console.log('[useConversations] Real-time update:', data.length, 'conversations');
      setConversations(data);
      setLoading(false);
      setHasMore(data.length === limit);
    }, limit);

    return () => {
      console.log('[useConversations] Cleaning up listener');
      unsubscribe();
    };
  }, [autoLoad, doctorId, limit]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!doctorId || !selectedConversation?.id) return;

    console.log('[useConversations] Setting up message listener for:', selectedConversation.id);

    const unsubscribe = conversationService.subscribeToMessages(
      doctorId,
      selectedConversation.id,
      (data) => {
        console.log('[useConversations] Messages updated:', data.length);
        setMessages(data);
        setLoadingMessages(false);
      }
    );

    return () => {
      console.log('[useConversations] Cleaning up message listener');
      unsubscribe();
    };
  }, [doctorId, selectedConversation?.id]);

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
