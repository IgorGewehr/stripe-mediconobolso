"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Search,
  WhatsApp,
  MoreVert,
  Person,
  ArrowBack,
  CheckCircle,
  Cancel,
  Edit,
  MarkEmailRead,
  MarkEmailUnread,
  Refresh,
  ChatBubbleOutline
} from '@mui/icons-material';

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
import { isSameDay } from 'date-fns';

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

  // Render conversation list sidebar
  const renderConversationList = () => (
    <Box
      sx={{
        width: isMobile ? '100%' : 360,
        minWidth: isMobile ? '100%' : 360,
        borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Conversas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.total} {stats.total === 1 ? 'conversa' : 'conversas'}
            </Typography>
          </Box>
          <IconButton
            onClick={refresh}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome ou telefone..."
          value={filters.search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Channel tabs */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'Todas', count: stats.total },
            { value: 'whatsapp', label: 'WhatsApp', count: stats.whatsapp },
          ].map((tab) => (
            <Chip
              key={tab.value}
              onClick={() => {
                setChannelTab(tab.value);
                setFilters(prev => ({ ...prev, channel: tab.value }));
              }}
              label={`${tab.label} (${tab.count})`}
              size="small"
              variant={channelTab === tab.value ? 'filled' : 'outlined'}
              color={channelTab === tab.value ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      {/* Conversation list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            <ChatBubbleOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="subtitle1" color="text.secondary">
              Nenhuma conversa encontrada
            </Typography>
            <Typography variant="body2" color="text.disabled">
              As conversas aparecerão aqui quando pacientes entrarem em contato
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              isEdited={editingConversationId === conversation.id}
              onSelect={selectConversation}
              onContextMenu={handleContextMenu}
              onRename={handleOpenRename}
            />
          ))
        )}
      </Box>
    </Box>
  );

  // Render message area
  const renderMessageArea = () => (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.paper,
      }}
    >
      {selectedConversation ? (
        <>
          {/* Conversation header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {isMobile && (
              <IconButton onClick={clearSelection} size="small">
                <ArrowBack />
              </IconButton>
            )}

            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <WhatsApp sx={{ fontSize: 14, color: '#25D366' }} />
              }
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {(selectedConversation.clientName || selectedConversation.clientPhone)?.[0]?.toUpperCase() || <Person />}
              </Avatar>
            </Badge>

            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {selectedConversation.clientName || selectedConversation.clientPhone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedConversation.clientPhone}
              </Typography>
            </Box>

            {/* AI Control */}
            <AIControlButton
              phone={selectedConversation.clientPhone}
              conversationName={selectedConversation.clientName || selectedConversation.clientPhone}
            />

            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>

          {/* Messages area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            {loadingMessages ? (
              <MessagesListSkeleton />
            ) : messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <ChatBubbleOutline sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Nenhuma mensagem ainda
                </Typography>
              </Box>
            ) : (
              <>
                {messages.map((message, index) => (
                  <Box key={message.id} mb={1.5}>
                    <MessageBubble
                      message={message}
                      showDateDivider={shouldShowDateDivider(message, index)}
                    />
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Message input */}
          <MessageInput
            aiBlocked={aiBlocked}
            checkingAiStatus={aiLoading}
            onSendMessage={handleSendMessage}
            onEnableManualMode={handleEnableManualMode}
          />
        </>
      ) : (
        /* Empty state */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            p: 4,
          }}
        >
          <ChatBubbleOutline sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecione uma conversa
          </Typography>
          <Typography variant="body2" color="text.disabled" maxWidth={280}>
            Clique em uma conversa na lista para visualizar as mensagens
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      {/* Mobile: Show list or messages */}
      {isMobile ? (
        selectedConversation ? renderMessageArea() : renderConversationList()
      ) : (
        <>
          {renderConversationList()}
          {renderMessageArea()}
        </>
      )}

      {/* Context Menu */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
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
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRename}
            variant="contained"
            disabled={!newName.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationsTemplate;
