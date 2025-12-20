"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
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
  useTheme
} from '@mui/material';
import {
  Search,
  WhatsApp,
  Facebook,
  Instagram,
  FilterList,
  MoreVert,
  Person,
  ArrowBack,
  CheckCircle,
  Cancel,
  Schedule,
  EmojiEvents,
  Edit,
  MarkEmailRead,
  MarkEmailUnread,
  Refresh
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
    enableManualMode,
    disableManualMode
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

  // Handle channel tab change
  const handleChannelChange = useCallback((_, newValue) => {
    setChannelTab(newValue);
    setFilters(prev => ({ ...prev, channel: newValue }));
  }, [setFilters]);

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
        borderRight: isMobile ? 'none' : '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#FAFBFC'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
        <Typography variant="h6" fontWeight={600} color="#111E5A" mb={2}>
          Conversas
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar conversas..."
          value={filters.search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#8A94A6' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              bgcolor: '#FFFFFF',
            },
          }}
        />

        {/* Channel tabs */}
        <Tabs
          value={channelTab}
          onChange={handleChannelChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontSize: '0.8rem',
            },
          }}
        >
          <Tab
            value="all"
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                Todas
                <Chip label={stats.total} size="small" sx={{ height: 18 }} />
              </Box>
            }
          />
          <Tab
            value="whatsapp"
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <WhatsApp sx={{ fontSize: 16, color: '#25D366' }} />
                <Chip label={stats.whatsapp} size="small" sx={{ height: 18 }} />
              </Box>
            }
          />
          <Tab
            value="facebook"
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Facebook sx={{ fontSize: 16, color: '#1877F2' }} />
                <Chip label={stats.facebook} size="small" sx={{ height: 18 }} />
              </Box>
            }
          />
          <Tab
            value="instagram"
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Instagram sx={{ fontSize: 16, color: '#E4405F' }} />
                <Chip label={stats.instagram} size="small" sx={{ height: 18 }} />
              </Box>
            }
          />
        </Tabs>
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
              p: 3,
              textAlign: 'center',
            }}
          >
            <WhatsApp sx={{ fontSize: 48, color: '#8A94A6', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Nenhuma conversa encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
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

      {/* Refresh button */}
      <Box sx={{ p: 1, borderTop: '1px solid #E5E7EB' }}>
        <Button
          fullWidth
          startIcon={<Refresh />}
          onClick={refresh}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Atualizar
        </Button>
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
        bgcolor: '#FFFFFF'
      }}
    >
      {selectedConversation ? (
        <>
          {/* Conversation header */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid #E5E7EB',
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

            <Avatar sx={{ bgcolor: alpha('#4285F4', 0.1), color: '#4285F4' }}>
              <Person />
            </Avatar>

            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600} color="#111E5A">
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

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
                <Typography variant="body1" color="text.secondary">
                  Nenhuma mensagem ainda
                </Typography>
              </Box>
            ) : (
              <>
                {messages.map((message, index) => (
                  <Box key={message.id} mb={2}>
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            p: 3,
          }}
        >
          <WhatsApp sx={{ fontSize: 64, color: '#8A94A6', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            Selecione uma conversa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Escolha uma conversa na lista para visualizar as mensagens
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
          <ListItemText>Marcar como lida</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMarkAsUnread}>
          <ListItemIcon>
            <MarkEmailUnread fontSize="small" />
          </ListItemIcon>
          <ListItemText>Marcar como não lida</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenRename(selectedConversationId)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Renomear</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUpdateStatus('completed')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Marcar como concluída</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('success')}>
          <ListItemIcon>
            <EmojiEvents fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Marcar como sucesso</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('abandoned')}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Marcar como abandonada</ListItemText>
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Renomear conversa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome do cliente"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmRename} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationsTemplate;
