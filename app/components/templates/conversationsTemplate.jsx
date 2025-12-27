"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search,
  WhatsApp,
  Facebook,
  MoreVert,
  Person,
  ArrowBack,
  CheckCircle,
  Cancel,
  Edit,
  MarkEmailRead,
  MarkEmailUnread,
  Refresh,
  ChatBubbleOutline,
  Send,
  AttachFile,
  EmojiEmotions,
  Phone,
  Videocam,
  Add
} from '@mui/icons-material';
import { cn } from "@/lib/utils";

// Import custom components
import {
  ConversationItem,
  MessageBubble,
  MessageInput,
  AIControlButton,
  ConversationListSkeleton,
  MessagesListSkeleton
} from '../features/conversations';

// Import hooks
import useConversations from '../hooks/useConversations';
import useAIBlockStatus from '../hooks/useAIBlockStatus';

// Import date-fns for date comparison
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ConversationsTemplate = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);

  // Get conversation data from hook
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    loadingMessages,
    stats,
    filters,
    setFilters,
    selectConversation,
    clearSelection,
    refresh,
    markAsRead,
    markAsUnread,
    updateStatus,
    renameConversation,
    sendMessage
  } = useConversations();

  // AI Block status for selected conversation
  const {
    blocked: aiBlocked,
    loading: aiLoading,
    enableManualMode
  } = useAIBlockStatus({ phone: selectedConversation?.clientPhone });

  // Local state
  const [channelTab, setChannelTab] = useState('all');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle search
  const handleSearch = useCallback((e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  }, [setFilters]);

  // Channel filter change
  const handleChannelChange = useCallback((channel) => {
    setChannelTab(channel);
    setFilters(prev => ({ ...prev, channel }));
  }, [setFilters]);

  // Context menu handlers
  const handleContextMenu = useCallback((event, conversationId) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
    setSelectedConversationId(conversationId);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
    setSelectedConversationId(null);
  }, []);

  // Rename handlers
  const handleOpenRename = useCallback((conversationId) => {
    const conv = conversations.find(c => c.id === conversationId);
    setEditingConversationId(conversationId);
    setNewName(conv?.clientName || conv?.clientPhone || '');
    setRenameDialogOpen(true);
    handleCloseContextMenu();
  }, [conversations, handleCloseContextMenu]);

  const handleConfirmRename = useCallback(async () => {
    if (editingConversationId && newName.trim()) {
      try {
        await renameConversation(editingConversationId, newName.trim());
      } catch (error) {
        console.error('Failed to rename:', error);
      }
    }
    setRenameDialogOpen(false);
    setEditingConversationId(null);
    setNewName('');
  }, [editingConversationId, newName, renameConversation]);

  // Status update handlers
  const handleMarkAsRead = useCallback(async () => {
    if (selectedConversationId) {
      await markAsRead(selectedConversationId);
    }
    handleCloseContextMenu();
  }, [selectedConversationId, markAsRead, handleCloseContextMenu]);

  const handleMarkAsUnread = useCallback(async () => {
    if (selectedConversationId) {
      await markAsUnread(selectedConversationId);
    }
    handleCloseContextMenu();
  }, [selectedConversationId, markAsUnread, handleCloseContextMenu]);

  const handleUpdateStatus = useCallback(async (status) => {
    if (selectedConversationId) {
      await updateStatus(selectedConversationId, status);
    }
    handleCloseContextMenu();
  }, [selectedConversationId, updateStatus, handleCloseContextMenu]);

  // Send message handler
  const handleSendMessage = useCallback(async (message) => {
    await sendMessage(message);
    setMessageText('');
  }, [sendMessage]);

  // Enable manual mode
  const handleEnableManualMode = useCallback(async () => {
    await enableManualMode(1, 'Modo manual ativado pelo usuário');
  }, [enableManualMode]);

  // Check if date divider should be shown
  const shouldShowDateDivider = useCallback((message, index) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const prevDate = prevMessage?.createdAt;
    const currentDate = message?.createdAt;
    if (!prevDate || !currentDate) return false;
    return !isSameDay(new Date(prevDate), new Date(currentDate));
  }, [messages]);

  // Format date for divider
  const formatDateDivider = (date) => {
    try {
      return format(new Date(date), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return '';
    }
  };

  // Unread count
  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  // Tab data
  const tabs = [
    { value: 'all', label: 'Todas', count: stats.total || 0 },
    { value: 'whatsapp', label: 'WhatsApp', count: stats.whatsapp || 0, color: 'text-green-600' },
    { value: 'facebook', label: 'Facebook', count: stats.facebook || 0, color: 'text-blue-600' },
  ];

  // Render conversation list sidebar
  const renderConversationList = () => (
    <div className={cn(
      "flex flex-col h-full bg-white rounded-2xl shadow-sm border-none overflow-hidden",
      isMobile ? "w-full" : "w-[360px] min-w-[360px]"
    )}>
      {/* Header with actions */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            {loading ? <CircularProgress size={16} /> : <Refresh className="w-4 h-4 text-slate-500" />}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium shadow-sm hover:bg-primary/90 transition-colors">
            <Add className="w-3.5 h-3.5" />
            Nova
          </button>
          {unreadCount > 0 && (
            <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {unreadCount} não lidas
            </span>
          )}
        </div>
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100/80 rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleChannelChange(tab.value)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  channelTab === tab.value
                    ? `bg-white shadow-sm ${tab.color || 'text-primary'}`
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <ChatBubbleOutline className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-700">Nenhuma conversa encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              As conversas aparecerão aqui quando pacientes entrarem em contato
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                className={cn(
                  "w-full text-left p-4 transition-all duration-200 border-l-4 hover:bg-slate-50",
                  selectedConversation?.id === conversation.id
                    ? "bg-slate-50 border-l-primary"
                    : "border-l-transparent hover:border-l-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    >
                      {(conversation.clientName || conversation.clientPhone)?.[0]?.toUpperCase() || <Person />}
                    </Avatar>
                    {conversation.channel === 'whatsapp' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <WhatsApp sx={{ fontSize: 10, color: 'white' }} />
                      </span>
                    )}
                    {conversation.channel === 'facebook' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Facebook sx={{ fontSize: 10, color: 'white' }} />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-slate-800 truncate text-sm">
                        {conversation.clientName || conversation.clientPhone}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                        {conversation.unreadCount > 0 && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                        {conversation.lastMessageTime || ''}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      conversation.unreadCount > 0 ? "text-slate-700 font-medium" : "text-slate-500"
                    )}>
                      {conversation.lastMessage || 'Sem mensagens'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {conversation.channel === 'whatsapp' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                          WhatsApp
                        </span>
                      )}
                      {conversation.channel === 'facebook' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                          Facebook
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render message area
  const renderMessageArea = () => (
    <div className="flex-1 flex flex-col h-full bg-white rounded-2xl shadow-sm border-none overflow-hidden">
      {selectedConversation ? (
        <>
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <IconButton onClick={clearSelection} size="small" className="mr-1">
                    <ArrowBack />
                  </IconButton>
                )}
                <div className="relative">
                  <Avatar
                    sx={{ width: 44, height: 44, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    {(selectedConversation.clientName || selectedConversation.clientPhone)?.[0]?.toUpperCase() || <Person />}
                  </Avatar>
                  {selectedConversation.channel === 'whatsapp' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <WhatsApp sx={{ fontSize: 10, color: 'white' }} />
                    </span>
                  )}
                  {selectedConversation.channel === 'facebook' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Facebook sx={{ fontSize: 10, color: 'white' }} />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {selectedConversation.clientName || selectedConversation.clientPhone}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedConversation.clientPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AIControlButton
                  phone={selectedConversation.clientPhone}
                  conversationName={selectedConversation.clientName || selectedConversation.clientPhone}
                />
                <IconButton size="small" className="border border-slate-200 hover:bg-slate-50">
                  <Phone sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" className="border border-slate-200 hover:bg-slate-50">
                  <Videocam sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" className="border border-slate-200 hover:bg-slate-50">
                  <MoreVert sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white space-y-4">
            {loadingMessages ? (
              <MessagesListSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ChatBubbleOutline className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">Nenhuma mensagem ainda</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const showDivider = shouldShowDateDivider(message, index);
                  const isOutgoing = message.direction === 'outgoing' || message.fromDoctor;

                  return (
                    <div key={message.id}>
                      {showDivider && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            {formatDateDivider(message.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className={cn("flex gap-3", isOutgoing ? "justify-end" : "justify-start")}>
                        {!isOutgoing && (
                          <Avatar sx={{ width: 32, height: 32 }} className="flex-shrink-0">
                            {(selectedConversation.clientName || selectedConversation.clientPhone)?.[0]?.toUpperCase()}
                          </Avatar>
                        )}
                        <div className="max-w-xs space-y-1">
                          <div className={cn(
                            "px-4 py-2 shadow-sm",
                            isOutgoing
                              ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                              : "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm"
                          )}>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content || message.text}</p>
                          </div>
                          <p className={cn(
                            "text-xs text-slate-400 px-2",
                            isOutgoing && "text-right"
                          )}>
                            {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <MessageInput
              aiBlocked={aiBlocked}
              checkingAiStatus={aiLoading}
              onSendMessage={handleSendMessage}
              onEnableManualMode={handleEnableManualMode}
            />
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <ChatBubbleOutline className="w-16 h-16 text-slate-200 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Selecione uma conversa</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">
                Clique em uma conversa na lista para visualizar as mensagens
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-[calc(100vh-64px)] p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Main content */}
      <div className={cn(
        "flex gap-4 h-full",
        isMobile && "flex-col"
      )}>
        {/* Mobile: Show list or messages */}
        {isMobile ? (
          selectedConversation ? renderMessageArea() : renderConversationList()
        ) : (
          <>
            {renderConversationList()}
            {renderMessageArea()}
          </>
        )}
      </div>

      {/* Context Menu */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
        PaperProps={{
          sx: { borderRadius: '12px', minWidth: 180 }
        }}
      >
        <MenuItem onClick={handleMarkAsRead}>
          <ListItemIcon>
            <MarkEmailRead fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Marcar como lida" />
        </MenuItem>
        <MenuItem onClick={handleMarkAsUnread}>
          <ListItemIcon>
            <MarkEmailUnread fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Marcar como não lida" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenRename(selectedConversationId)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Renomear" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUpdateStatus('completed')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText primary="Concluída" />
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('abandoned')}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Abandonada" />
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle>Renomear conversa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Nome do cliente"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                handleConfirmRename();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ borderRadius: '50px' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRename}
            variant="contained"
            disabled={!newName.trim()}
            sx={{ borderRadius: '50px' }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ConversationsTemplate;
