"use client";

import React, { memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Badge,
  IconButton,
  alpha
} from '@mui/material';
import {
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  EmojiEvents,
  Edit,
  WhatsApp,
  Facebook,
  Instagram,
  Circle
} from '@mui/icons-material';
import { getStatusLabel, getChannelConfig } from '@/lib/models/Conversation.model';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Modern color palette
const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
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
};

// Status icon component
const StatusIcon = memo(({ status }) => {
  const iconStyle = { fontSize: 12 };
  switch (status) {
    case 'active':
      return <Circle sx={iconStyle} />;
    case 'completed':
      return <CheckCircle sx={iconStyle} />;
    case 'success':
      return <EmojiEvents sx={iconStyle} />;
    case 'abandoned':
      return <Cancel sx={iconStyle} />;
    case 'pending':
      return <Schedule sx={iconStyle} />;
    default:
      return <Circle sx={iconStyle} />;
  }
});
StatusIcon.displayName = 'StatusIcon';

// Channel icon only (no label for cleaner look)
const ChannelIcon = memo(({ channel }) => {
  const channelType = channel || 'whatsapp';
  const config = getChannelConfig(channelType);

  const IconComponent = {
    whatsapp: WhatsApp,
    facebook: Facebook,
    instagram: Instagram
  }[channelType] || WhatsApp;

  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '5px',
        bgcolor: alpha(config.color, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconComponent sx={{ fontSize: 11, color: config.color }} />
    </Box>
  );
});
ChannelIcon.displayName = 'ChannelIcon';

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

// Status colors mapping
const getStatusMuiColor = (status) => {
  const statusColors = {
    active: '#F59E0B',
    completed: '#3B82F6',
    success: '#10B981',
    abandoned: '#EF4444',
    pending: '#94A3B8'
  };
  return statusColors[status] || statusColors.pending;
};

const ConversationItem = memo(({
  conversation,
  isSelected,
  isEdited = false,
  onSelect,
  onContextMenu,
  onRename
}) => {
  const statusColor = getStatusMuiColor(conversation.status);
  const isUnread = conversation.isRead === false;

  return (
    <Box
      onClick={() => onSelect?.(conversation.id)}
      onContextMenu={(e) => onContextMenu?.(e, conversation.id)}
      sx={{
        p: 1.5,
        mb: 0.75,
        cursor: 'pointer',
        borderRadius: '14px',
        position: 'relative',
        bgcolor: isSelected
          ? alpha(colors.primary, 0.08)
          : isUnread
            ? alpha(colors.primary, 0.03)
            : colors.surface,
        border: `1.5px solid ${isSelected ? colors.primary : 'transparent'}`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          bgcolor: isSelected
            ? alpha(colors.primary, 0.12)
            : colors.surfaceHover,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 20px ${alpha(colors.text, 0.08)}`,
          '& .edit-button': {
            opacity: 1,
          },
        },
        '&::before': isUnread && !isSelected ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: '60%',
          borderRadius: '0 4px 4px 0',
          background: colors.gradient,
        } : {},
      }}
    >
      <Box display="flex" gap={1.5} alignItems="flex-start">
        {/* Avatar with badge */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Badge
            badgeContent={conversation.unreadCount}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                background: colors.gradient,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.65rem',
                minWidth: 18,
                height: 18,
                borderRadius: '9px',
                border: `2px solid ${colors.surface}`,
              },
            }}
            invisible={!isUnread || conversation.unreadCount === 0}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: isSelected ? colors.gradient : alpha(colors.primary, 0.1),
                color: isSelected ? '#FFFFFF' : colors.primary,
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
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
            }}
          >
            <ChannelIcon channel={conversation.channel} />
          </Box>
        </Box>

        {/* Content */}
        <Box flex={1} minWidth={0}>
          {/* Header row */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.25}>
            <Box display="flex" alignItems="center" gap={0.75} flex={1} minWidth={0}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  flex: 1,
                  minWidth: 0,
                  color: colors.text,
                  fontWeight: isUnread ? 700 : 600,
                  fontSize: '0.9rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {conversation.clientName || conversation.clientPhone}
              </Typography>
            </Box>

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
                    width: 24,
                    height: 24,
                    opacity: 0,
                    transition: 'all 0.2s ease',
                    color: colors.textSecondary,
                    '&:hover': {
                      bgcolor: alpha(colors.primary, 0.1),
                      color: colors.primary,
                    },
                  }}
                  title="Renomear conversa"
                >
                  <Edit sx={{ fontSize: 14 }} />
                </IconButton>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: isUnread ? colors.primary : colors.textMuted,
                  fontWeight: isUnread ? 600 : 400,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                }}
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
              color: isUnread ? colors.text : colors.textSecondary,
              fontWeight: isUnread ? 500 : 400,
              fontSize: '0.825rem',
              lineHeight: 1.4,
              mb: 0.75,
            }}
          >
            {conversation.lastMessage || 'Nenhuma mensagem ainda'}
          </Typography>

          {/* Status and meta info */}
          <Box display="flex" gap={0.75} alignItems="center">
            {/* Status chip */}
            <Chip
              size="small"
              icon={<StatusIcon status={conversation.status} />}
              label={getStatusLabel(conversation.status)}
              sx={{
                height: 22,
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(statusColor, 0.1),
                color: statusColor,
                border: `1px solid ${alpha(statusColor, 0.2)}`,
                '& .MuiChip-icon': {
                  color: statusColor,
                  ml: 0.5,
                },
                '& .MuiChip-label': {
                  px: 0.75,
                },
              }}
            />

            {/* Message count */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                color: colors.textMuted,
                fontSize: '0.7rem',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {conversation.messageCount || 0}
              </Typography>
              <Typography variant="caption">
                {(conversation.messageCount || 0) === 1 ? 'msg' : 'msgs'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.lastMessage === nextProps.conversation.lastMessage &&
    prevProps.conversation.lastMessageAt === nextProps.conversation.lastMessageAt &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.isRead === nextProps.conversation.isRead &&
    prevProps.conversation.status === nextProps.conversation.status &&
    prevProps.conversation.clientName === nextProps.conversation.clientName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEdited === nextProps.isEdited
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
