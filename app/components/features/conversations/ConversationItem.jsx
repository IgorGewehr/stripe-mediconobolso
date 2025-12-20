"use client";

import React, { memo } from 'react';
import {
  Box,
  Paper,
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
  Instagram
} from '@mui/icons-material';
import { getStatusLabel, getStatusColor, getChannelConfig } from '@/lib/models/Conversation.model';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Status icon component
const StatusIcon = memo(({ status }) => {
  switch (status) {
    case 'active':
      return <Schedule fontSize="small" />;
    case 'completed':
      return <CheckCircle fontSize="small" />;
    case 'success':
      return <EmojiEvents fontSize="small" />;
    case 'abandoned':
      return <Cancel fontSize="small" />;
    case 'pending':
      return <Schedule fontSize="small" />;
    default:
      return null;
  }
});
StatusIcon.displayName = 'StatusIcon';

// Channel badge component
const ChannelBadge = memo(({ channel }) => {
  const channelType = channel || 'whatsapp';
  const config = getChannelConfig(channelType);

  const IconComponent = {
    whatsapp: WhatsApp,
    facebook: Facebook,
    instagram: Instagram
  }[channelType] || WhatsApp;

  return (
    <Chip
      icon={<IconComponent sx={{ fontSize: 12 }} />}
      label={config.label}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 600,
        bgcolor: alpha(config.color, 0.1),
        color: config.color,
        border: `1px solid ${alpha(config.color, 0.3)}`,
        '& .MuiChip-label': { px: 0.75 },
        '& .MuiChip-icon': {
          ml: 0.5,
          color: config.color,
        },
      }}
    />
  );
});
ChannelBadge.displayName = 'ChannelBadge';

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

// Status colors mapping to MUI palette
const getStatusMuiColor = (status) => {
  const colors = {
    active: '#FFA726',
    completed: '#29B6F6',
    success: '#66BB6A',
    abandoned: '#EF5350',
    pending: '#9E9E9E'
  };
  return colors[status] || colors.pending;
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

  return (
    <Paper
      onClick={() => onSelect?.(conversation.id)}
      onContextMenu={(e) => onContextMenu?.(e, conversation.id)}
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        cursor: 'pointer',
        borderLeft: 3,
        borderColor: isSelected ? '#4285F4' : 'transparent',
        bgcolor: isSelected
          ? alpha('#4285F4', 0.08)
          : conversation.isRead === false
            ? alpha('#29B6F6', 0.05)
            : '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        transition: 'all 0.15s ease-out',
        '&:hover': {
          bgcolor: isSelected
            ? alpha('#4285F4', 0.12)
            : alpha('#4285F4', 0.04),
          transform: 'translateX(2px)',
          boxShadow: '0 2px 8px rgba(17, 30, 90, 0.08)',
        },
      }}
    >
      <Box display="flex" gap={1.5}>
        <Badge
          badgeContent={conversation.unreadCount}
          color="error"
          invisible={conversation.isRead !== false || conversation.unreadCount === 0}
        >
          <Avatar
            sx={{
              bgcolor: alpha('#4285F4', 0.1),
              color: '#4285F4',
            }}
          >
            <Person />
          </Avatar>
        </Badge>

        <Box flex={1} minWidth={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.75} flex={1} minWidth={0}>
              <Typography
                variant="subtitle2"
                fontWeight={conversation.isRead === false ? 700 : 600}
                noWrap
                sx={{ flex: 1, minWidth: 0, color: '#111E5A' }}
              >
                {conversation.clientName || conversation.clientPhone}
              </Typography>

              {!isEdited && onRename && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(conversation.id);
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    p: 0.5,
                    opacity: 0.6,
                    transition: 'all 0.15s',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: alpha('#4285F4', 0.1),
                    },
                  }}
                  title="Renomear conversa"
                >
                  <Edit sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, flexShrink: 0 }}
            >
              {formatTimestamp(conversation.lastMessageAt)}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: conversation.isRead === false ? 600 : 400,
            }}
          >
            {conversation.lastMessage || 'Sem mensagens'}
          </Typography>

          <Box display="flex" gap={0.5} mt={1} alignItems="center" flexWrap="wrap">
            <ChannelBadge channel={conversation.channel} />

            <Chip
              label={getStatusLabel(conversation.status)}
              size="small"
              icon={<StatusIcon status={conversation.status} />}
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(statusColor, 0.1),
                color: statusColor,
                '& .MuiChip-label': { px: 1 },
                '& .MuiChip-icon': { color: statusColor },
              }}
            />

            <Typography variant="caption" color="text.secondary">
              {conversation.messageCount || 0} {(conversation.messageCount || 0) === 1 ? 'msg' : 'msgs'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
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
