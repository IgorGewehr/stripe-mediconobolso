"use client";

import React, { memo, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Badge,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Edit,
  WhatsApp,
  Facebook,
  Circle,
  Done as DoneIcon,
  PriorityHigh as UrgentIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import { getStatusLabel } from '@/lib/models/Conversation.model';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de prioridade para cores
const PRIORITY_COLORS = {
  low: '#8BC34A',
  normal: '#2196F3',
  high: '#FF9800',
  urgent: '#F44336',
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
};

// Status icon component
const StatusIcon = memo(({ status }) => {
  const iconStyle = { fontSize: 12 };
  switch (status) {
    case 'active':
      return <Circle sx={iconStyle} />;
    case 'completed':
      return <CheckCircle sx={iconStyle} />;
    case 'abandoned':
      return <Cancel sx={iconStyle} />;
    case 'pending':
      return <Schedule sx={iconStyle} />;
    default:
      return <Circle sx={iconStyle} />;
  }
});
StatusIcon.displayName = 'StatusIcon';

// Status colors mapping
const getStatusColor = (status, theme) => {
  const statusColors = {
    active: theme.palette.warning.main,
    completed: theme.palette.info.main,
    success: theme.palette.success.main,
    abandoned: theme.palette.error.main,
    pending: theme.palette.grey[500]
  };
  return statusColors[status] || statusColors.pending;
};

const ConversationItem = memo(({
  conversation,
  isSelected,
  isEdited = false,
  onSelect,
  onContextMenu,
  onRename,
  onFinish,
  showTags = true,
  showFinishButton = false,
}) => {
  const theme = useTheme();
  const statusColor = getStatusColor(conversation.status, theme);
  const isUnread = conversation.isRead === false;

  // Calcular cor da borda baseada na tag principal ou prioridade
  const borderColor = useMemo(() => {
    // Primeiro verifica tags
    if (conversation.tags?.length > 0) {
      return conversation.tags[0].color || theme.palette.primary.main;
    }
    // Depois verifica prioridade
    if (conversation.priority && PRIORITY_COLORS[conversation.priority]) {
      return PRIORITY_COLORS[conversation.priority];
    }
    // Fallback para cor de status
    return statusColor;
  }, [conversation.tags, conversation.priority, statusColor, theme]);

  return (
    <Box
      onClick={() => onSelect?.(conversation.id)}
      onContextMenu={(e) => onContextMenu?.(e, conversation.id)}
      sx={{
        p: 1.5,
        mb: 0.5,
        cursor: 'pointer',
        borderRadius: 2,
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.08)
          : isUnread
            ? alpha(theme.palette.primary.main, 0.02)
            : 'transparent',
        border: `1px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
        // Borda esquerda com cor da tag/prioridade
        borderLeft: `4px solid ${borderColor}`,
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.12)
            : alpha(theme.palette.action.hover, 0.5),
          '& .edit-button': {
            opacity: 1,
          },
          '& .finish-button': {
            opacity: 1,
          },
        },
      }}
    >
      <Box display="flex" gap={1.5} alignItems="flex-start">
        {/* Avatar with badge */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Badge
            badgeContent={conversation.unreadCount}
            max={99}
            color="primary"
            invisible={!isUnread || conversation.unreadCount === 0}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: isSelected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
                color: isSelected ? '#fff' : theme.palette.primary.main,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {(conversation.clientName || conversation.clientPhone)?.[0]?.toUpperCase() || <Person />}
            </Avatar>
          </Badge>
          {/* Channel indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '4px',
              bgcolor: alpha(conversation.channel === 'facebook' ? '#1877F2' : '#25D366', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {conversation.channel === 'facebook' ? (
              <Facebook sx={{ fontSize: 10, color: '#1877F2' }} />
            ) : (
              <WhatsApp sx={{ fontSize: 10, color: '#25D366' }} />
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box flex={1} minWidth={0}>
          {/* Header row */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.25}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                flex: 1,
                minWidth: 0,
                fontWeight: isUnread ? 600 : 500,
                color: 'text.primary',
              }}
            >
              {conversation.clientName || conversation.clientPhone}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              {!isEdited && onRename && (
                <IconButton
                  className="edit-button"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(conversation.id);
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                  }}
                  title="Renomear conversa"
                >
                  <Edit sx={{ fontSize: 14 }} />
                </IconButton>
              )}
              <Typography
                variant="caption"
                color={isUnread ? 'primary' : 'text.secondary'}
                fontWeight={isUnread ? 600 : 400}
              >
                {formatTimestamp(conversation.lastMessageAt)}
              </Typography>
            </Box>
          </Box>

          {/* Message preview */}
          <Typography
            variant="body2"
            noWrap
            sx={{
              color: isUnread ? 'text.primary' : 'text.secondary',
              fontWeight: isUnread ? 500 : 400,
              fontSize: '0.8rem',
              mb: 0.5,
            }}
          >
            {conversation.lastMessage || 'Nenhuma mensagem ainda'}
          </Typography>

          {/* Tags e Status row */}
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={0.5}>
            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap" sx={{ flex: 1, minWidth: 0 }}>
              {/* Tags visuais */}
              {showTags && conversation.tags?.length > 0 && (
                <>
                  {conversation.tags.slice(0, 2).map((tag, idx) => (
                    <Chip
                      key={tag.id || idx}
                      size="small"
                      icon={<TagIcon sx={{ fontSize: '10px !important' }} />}
                      label={tag.name}
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        bgcolor: alpha(tag.color || theme.palette.primary.main, 0.1),
                        color: tag.color || theme.palette.primary.main,
                        '& .MuiChip-icon': {
                          color: tag.color || theme.palette.primary.main,
                          ml: 0.25,
                        },
                        '& .MuiChip-label': {
                          px: 0.5,
                        },
                      }}
                    />
                  ))}
                  {conversation.tags.length > 2 && (
                    <Tooltip title={conversation.tags.slice(2).map(t => t.name).join(', ')}>
                      <Chip
                        size="small"
                        label={`+${conversation.tags.length - 2}`}
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                        }}
                      />
                    </Tooltip>
                  )}
                </>
              )}

              {/* Indicador de prioridade urgente */}
              {conversation.priority === 'urgent' && (
                <Tooltip title="Prioridade Urgente">
                  <UrgentIcon sx={{ fontSize: 14, color: 'error.main' }} />
                </Tooltip>
              )}

              {/* Status chip */}
              <Chip
                size="small"
                icon={<StatusIcon status={conversation.status} />}
                label={getStatusLabel(conversation.status)}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  bgcolor: alpha(statusColor, 0.1),
                  color: statusColor,
                  '& .MuiChip-icon': {
                    color: statusColor,
                  },
                }}
              />
            </Box>

            {/* Botao Finalizar Conversa */}
            {showFinishButton && onFinish && conversation.status !== 'closed' && (
              <Tooltip title="Finalizar atendimento">
                <IconButton
                  className="finish-button"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinish(conversation.id);
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    color: 'success.main',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                    },
                  }}
                >
                  <DoneIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.lastMessage === nextProps.conversation.lastMessage &&
    prevProps.conversation.lastMessageAt === nextProps.conversation.lastMessageAt &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.isRead === nextProps.conversation.isRead &&
    prevProps.conversation.status === nextProps.conversation.status &&
    prevProps.conversation.clientName === nextProps.conversation.clientName &&
    prevProps.conversation.priority === nextProps.conversation.priority &&
    JSON.stringify(prevProps.conversation.tags) === JSON.stringify(nextProps.conversation.tags) &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEdited === nextProps.isEdited &&
    prevProps.showTags === nextProps.showTags &&
    prevProps.showFinishButton === nextProps.showFinishButton
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
