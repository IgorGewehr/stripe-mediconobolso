"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Fade,
  Slide,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Search,
  WhatsApp,
  Facebook,
  Instagram,
  MoreVert,
  Person,
  ArrowBack,
  CheckCircle,
  Cancel,
  EmojiEvents,
  Edit,
  MarkEmailRead,
  MarkEmailUnread,
  Refresh,
  ChatBubbleOutline,
  Forum,
  KeyboardArrowDown
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

// Modern color palette
const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E4405F',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
  gradientSubtle: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
};

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
        width: isMobile ? '100%' : 380,
        minWidth: isMobile ? '100%' : 380,
        borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.gradientSubtle,
      }}
    >
      {/* Header with gradient accent */}
      <Box
        sx={{
          p: 2.5,
          pb: 2,
          background: colors.surface,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        {/* Title with icon */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: colors.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${alpha(colors.primary, 0.3)}`,
              }}
            >
              <Forum sx={{ color: '#FFFFFF', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.text,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Conversas
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: colors.textMuted, fontSize: '0.75rem' }}
              >
                {stats.total} {stats.total === 1 ? 'conversa' : 'conversas'}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Atualizar">
            <IconButton
              onClick={refresh}
              disabled={loading}
              size="small"
              sx={{
                bgcolor: alpha(colors.primary, 0.08),
                color: colors.primary,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(colors.primary, 0.15),
                  transform: 'rotate(180deg)',
                },
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search - Modern design */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nome ou telefone..."
          value={filters.search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: colors.textMuted, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: colors.background,
              border: 'none',
              transition: 'all 0.2s ease',
              '& fieldset': {
                border: `1.5px solid transparent`,
              },
              '&:hover': {
                bgcolor: colors.surfaceHover,
                '& fieldset': {
                  borderColor: alpha(colors.primary, 0.2),
                },
              },
              '&.Mui-focused': {
                bgcolor: colors.surface,
                boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.12)}`,
                '& fieldset': {
                  borderColor: colors.primary,
                },
              },
            },
            '& .MuiInputBase-input': {
              py: 1.25,
              fontSize: '0.875rem',
              '&::placeholder': {
                color: colors.textMuted,
                opacity: 1,
              },
            },
          }}
        />

        {/* Channel tabs - Modern pills style */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: 'all', label: 'Todas', count: stats.total, color: colors.primary },
            { value: 'whatsapp', label: 'WhatsApp', count: stats.whatsapp, color: colors.whatsapp, icon: WhatsApp },
            { value: 'facebook', label: 'Facebook', count: stats.facebook, color: colors.facebook, icon: Facebook },
            { value: 'instagram', label: 'Instagram', count: stats.instagram, color: colors.instagram, icon: Instagram },
          ].map((tab) => {
            const isActive = channelTab === tab.value;
            const IconComponent = tab.icon;
            return (
              <Chip
                key={tab.value}
                onClick={() => {
                  setChannelTab(tab.value);
                  setFilters(prev => ({ ...prev, channel: tab.value }));
                }}
                icon={IconComponent ? <IconComponent sx={{ fontSize: '14px !important' }} /> : undefined}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {!IconComponent && tab.label}
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: isActive ? alpha('#FFFFFF', 0.25) : alpha(tab.color, 0.15),
                        color: isActive ? '#FFFFFF' : tab.color,
                        px: 0.75,
                        py: 0.15,
                        borderRadius: '6px',
                        minWidth: 20,
                        textAlign: 'center',
                      }}
                    >
                      {tab.count}
                    </Box>
                  </Box>
                }
                size="small"
                sx={{
                  height: 32,
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  bgcolor: isActive ? tab.color : alpha(tab.color, 0.08),
                  color: isActive ? '#FFFFFF' : tab.color,
                  border: `1.5px solid ${isActive ? tab.color : 'transparent'}`,
                  '& .MuiChip-icon': {
                    color: isActive ? '#FFFFFF' : tab.color,
                    ml: 0.5,
                  },
                  '& .MuiChip-label': {
                    px: 1,
                  },
                  '&:hover': {
                    bgcolor: isActive ? tab.color : alpha(tab.color, 0.15),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(tab.color, 0.25)}`,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && (
        <LinearProgress
          sx={{
            height: 2,
            bgcolor: alpha(colors.primary, 0.1),
            '& .MuiLinearProgress-bar': {
              background: colors.gradient,
            },
          }}
        />
      )}

      {/* Conversation list */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(colors.textMuted, 0.2),
            borderRadius: 3,
            '&:hover': {
              bgcolor: alpha(colors.textMuted, 0.3),
            },
          },
        }}
      >
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <Fade in timeout={500}>
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
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '24px',
                  background: alpha(colors.primary, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2.5,
                }}
              >
                <ChatBubbleOutline sx={{ fontSize: 40, color: colors.primary }} />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}
              >
                Nenhuma conversa encontrada
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.textSecondary, maxWidth: 240 }}
              >
                As conversas aparecerão aqui quando pacientes entrarem em contato
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Fade in timeout={300}>
            <Box>
              {conversations.map((conversation, index) => (
                <Slide
                  key={conversation.id}
                  direction="right"
                  in
                  timeout={150 + index * 30}
                  style={{ transitionDelay: `${index * 20}ms` }}
                >
                  <Box>
                    <ConversationItem
                      conversation={conversation}
                      isSelected={selectedConversation?.id === conversation.id}
                      isEdited={editingConversationId === conversation.id}
                      onSelect={selectConversation}
                      onContextMenu={handleContextMenu}
                      onRename={handleOpenRename}
                    />
                  </Box>
                </Slide>
              ))}
            </Box>
          </Fade>
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
        bgcolor: colors.surface,
        position: 'relative',
      }}
    >
      {selectedConversation ? (
        <>
          {/* Conversation header - Modern glassmorphism */}
          <Box
            sx={{
              p: 2,
              px: 2.5,
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: `linear-gradient(180deg, ${colors.surface} 0%, ${alpha(colors.background, 0.8)} 100%)`,
              backdropFilter: 'blur(10px)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {isMobile && (
              <IconButton
                onClick={clearSelection}
                size="small"
                sx={{
                  bgcolor: alpha(colors.primary, 0.08),
                  color: colors.primary,
                  '&:hover': {
                    bgcolor: alpha(colors.primary, 0.15),
                  },
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            )}

            {/* Avatar with online indicator */}
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: colors.secondary,
                    border: `2px solid ${colors.surface}`,
                  }}
                />
              }
            >
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: colors.gradient,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {(selectedConversation.clientName || selectedConversation.clientPhone)?.[0]?.toUpperCase() || <Person />}
              </Avatar>
            </Badge>

            <Box flex={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: colors.text,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                }}
                noWrap
              >
                {selectedConversation.clientName || selectedConversation.clientPhone}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}
                >
                  {selectedConversation.clientPhone}
                </Typography>
                <Chip
                  size="small"
                  label={selectedConversation.channel || 'WhatsApp'}
                  icon={
                    selectedConversation.channel === 'instagram' ? <Instagram sx={{ fontSize: '12px !important' }} /> :
                    selectedConversation.channel === 'facebook' ? <Facebook sx={{ fontSize: '12px !important' }} /> :
                    <WhatsApp sx={{ fontSize: '12px !important' }} />
                  }
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    bgcolor: alpha(
                      selectedConversation.channel === 'instagram' ? colors.instagram :
                      selectedConversation.channel === 'facebook' ? colors.facebook :
                      colors.whatsapp,
                      0.1
                    ),
                    color: selectedConversation.channel === 'instagram' ? colors.instagram :
                           selectedConversation.channel === 'facebook' ? colors.facebook :
                           colors.whatsapp,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                      ml: 0.5,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* AI Control */}
            <AIControlButton
              phone={selectedConversation.clientPhone}
              conversationName={selectedConversation.clientName || selectedConversation.clientPhone}
            />

            <Tooltip title="Mais opções">
              <IconButton
                size="small"
                sx={{
                  color: colors.textSecondary,
                  '&:hover': {
                    bgcolor: alpha(colors.primary, 0.08),
                    color: colors.primary,
                  },
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Messages area with subtle background pattern */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2.5,
              background: `
                linear-gradient(180deg, ${alpha(colors.primary, 0.02)} 0%, transparent 100%),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 20px,
                  ${alpha(colors.primary, 0.01)} 20px,
                  ${alpha(colors.primary, 0.01)} 40px
                )
              `,
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(colors.textMuted, 0.2),
                borderRadius: 3,
                '&:hover': {
                  bgcolor: alpha(colors.textMuted, 0.3),
                },
              },
            }}
          >
            {loadingMessages ? (
              <MessagesListSkeleton />
            ) : messages.length === 0 ? (
              <Fade in timeout={500}>
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
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '20px',
                      background: alpha(colors.primary, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <ChatBubbleOutline sx={{ fontSize: 32, color: colors.primary }} />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ color: colors.textSecondary, fontWeight: 500 }}
                  >
                    Nenhuma mensagem ainda
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: colors.textMuted, mt: 0.5 }}
                  >
                    As mensagens aparecerão aqui
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Fade in timeout={300}>
                <Box>
                  {messages.map((message, index) => (
                    <Box key={message.id} mb={2}>
                      <MessageBubble
                        message={message}
                        showDateDivider={shouldShowDateDivider(message, index)}
                      />
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
              </Fade>
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
        /* Empty state - Modern design */
        <Fade in timeout={500}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              p: 4,
              background: `
                radial-gradient(circle at 30% 20%, ${alpha(colors.primary, 0.05)} 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, ${alpha(colors.primaryLight, 0.05)} 0%, transparent 50%)
              `,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '32px',
                background: colors.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: `0 20px 40px ${alpha(colors.primary, 0.25)}`,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            >
              <Forum sx={{ fontSize: 56, color: '#FFFFFF' }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: colors.text,
                fontWeight: 700,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Bem-vindo às Conversas
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.textSecondary,
                maxWidth: 320,
                lineHeight: 1.6,
              }}
            >
              Selecione uma conversa na lista para visualizar as mensagens e interagir com seus pacientes
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 3,
                color: colors.textMuted,
              }}
            >
              <KeyboardArrowDown sx={{ fontSize: 20, animation: 'bounce 1s infinite' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {isMobile ? 'Toque em uma conversa' : 'Clique em uma conversa para começar'}
              </Typography>
              <style jsx global>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(4px); }
                }
              `}</style>
            </Box>
          </Box>
        </Fade>
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

      {/* Context Menu - Modern design */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: `0 10px 40px ${alpha(colors.text, 0.12)}`,
            border: `1px solid ${colors.borderLight}`,
            minWidth: 200,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${colors.borderLight}` }}>
          <Typography
            variant="caption"
            sx={{
              color: colors.textMuted,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.65rem',
            }}
          >
            Ações
          </Typography>
        </Box>
        <MenuItem
          onClick={handleMarkAsRead}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha(colors.primary, 0.06) },
          }}
        >
          <ListItemIcon>
            <MarkEmailRead fontSize="small" sx={{ color: colors.primary }} />
          </ListItemIcon>
          <ListItemText
            primary="Marcar como lida"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleMarkAsUnread}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha(colors.primary, 0.06) },
          }}
        >
          <ListItemIcon>
            <MarkEmailUnread fontSize="small" sx={{ color: colors.textSecondary }} />
          </ListItemIcon>
          <ListItemText
            primary="Marcar como não lida"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => handleOpenRename(selectedConversationId)}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha(colors.primary, 0.06) },
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" sx={{ color: colors.textSecondary }} />
          </ListItemIcon>
          <ListItemText
            primary="Renomear"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${colors.borderLight}` }}>
          <Typography
            variant="caption"
            sx={{
              color: colors.textMuted,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.65rem',
            }}
          >
            Status
          </Typography>
        </Box>
        <MenuItem
          onClick={() => handleUpdateStatus('completed')}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha('#29B6F6', 0.08) },
          }}
        >
          <ListItemIcon>
            <CheckCircle fontSize="small" sx={{ color: '#29B6F6' }} />
          </ListItemIcon>
          <ListItemText
            primary="Concluída"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleUpdateStatus('success')}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha(colors.secondary, 0.08) },
          }}
        >
          <ListItemIcon>
            <EmojiEvents fontSize="small" sx={{ color: colors.secondary }} />
          </ListItemIcon>
          <ListItemText
            primary="Sucesso"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleUpdateStatus('abandoned')}
          sx={{
            py: 1.25,
            '&:hover': { bgcolor: alpha('#EF5350', 0.08) },
          }}
        >
          <ListItemIcon>
            <Cancel fontSize="small" sx={{ color: '#EF5350' }} />
          </ListItemIcon>
          <ListItemText
            primary="Abandonada"
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
      </Menu>

      {/* Rename Dialog - Modern design */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: `0 20px 60px ${alpha(colors.text, 0.15)}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            pt: 2.5,
            px: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: alpha(colors.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit sx={{ color: colors.primary, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.text,
                  fontSize: '1.1rem',
                }}
              >
                Renomear conversa
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}
              >
                Dê um nome para identificar o cliente
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setRenameDialogOpen(false)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: colors.textSecondary,
              px: 2.5,
              '&:hover': {
                bgcolor: alpha(colors.textSecondary, 0.08),
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRename}
            variant="contained"
            disabled={!newName.trim()}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              background: colors.gradient,
              boxShadow: `0 4px 14px ${alpha(colors.primary, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(colors.primary, 0.4)}`,
              },
              '&.Mui-disabled': {
                background: alpha(colors.textMuted, 0.2),
              },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationsTemplate;
