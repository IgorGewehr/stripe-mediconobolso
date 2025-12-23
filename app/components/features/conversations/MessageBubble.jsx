"use client";

import React, { memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import {
  Person,
  SmartToy,
  CalendarToday,
  LocalHospital,
  DoneAll,
  AutoAwesome
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Modern color palette
const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  clientBubble: '#FFFFFF',
  doctorBubble: '#6366F1',
  aiBubble: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
};

// Safe date formatting
const safeFormat = (date, formatStr) => {
  if (!date) return '--:--';

  let dateObj = date;
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  }

  if (!isValid(dateObj)) return '--:--';

  try {
    return format(dateObj, formatStr, { locale: ptBR });
  } catch {
    return '--:--';
  }
};

// Convert to Date object
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate();
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  if (typeof value === 'number') return new Date(value);
  return null;
};

// Date divider component - Modern design
const DateDivider = memo(({ date }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      my={3}
      sx={{ position: 'relative' }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 1,
          bgcolor: alpha(colors.border, 0.5),
        }}
      />
      <Chip
        label={safeFormat(date, "EEEE, dd 'de' MMMM")}
        size="small"
        icon={<CalendarToday sx={{ fontSize: '12px !important' }} />}
        sx={{
          position: 'relative',
          bgcolor: colors.surface,
          color: colors.textSecondary,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 28,
          borderRadius: '14px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 2px 8px ${alpha(colors.text, 0.06)}`,
          '& .MuiChip-icon': {
            color: colors.primary,
            ml: 0.75,
          },
          '& .MuiChip-label': {
            px: 1.5,
          },
        }}
      />
    </Box>
  );
});
DateDivider.displayName = 'DateDivider';

// Client message component - Modern design
const ClientMessage = memo(({ text, mediaUrls, timestamp }) => {
  return (
    <Box display="flex" justifyContent="flex-start" gap={1.5} mb={0.5}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: alpha(colors.textSecondary, 0.1),
          color: colors.textSecondary,
          fontSize: '0.85rem',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <Person sx={{ fontSize: 18 }} />
      </Avatar>

      <Box
        sx={{
          maxWidth: '75%',
          position: 'relative',
        }}
      >
        {/* Media attachments */}
        {mediaUrls && mediaUrls.length > 0 && (
          <Box mb={1} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            {mediaUrls.map((url, index) => (
              <Box
                key={index}
                component="img"
                src={url}
                alt={`Anexo ${index + 1}`}
                sx={{
                  maxWidth: '100%',
                  borderRadius: '12px',
                  mb: 0.5,
                  boxShadow: `0 2px 8px ${alpha(colors.text, 0.1)}`,
                }}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            p: 1.75,
            bgcolor: colors.clientBubble,
            borderRadius: '18px',
            borderTopLeftRadius: '4px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 1px 2px ${alpha(colors.text, 0.04)}`,
            position: 'relative',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: colors.text,
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {text}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: colors.textMuted,
              fontSize: '0.7rem',
            }}
          >
            {safeFormat(timestamp, 'HH:mm')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});
ClientMessage.displayName = 'ClientMessage';

// Doctor/AI message component - Modern design
const DoctorMessage = memo(({ text, mediaUrls, timestamp, isAI = false, functionsCalled }) => {
  return (
    <Box display="flex" justifyContent="flex-end" gap={1.5} mb={0.5}>
      <Box
        sx={{
          maxWidth: '75%',
          position: 'relative',
        }}
      >
        {/* Media attachments */}
        {mediaUrls && mediaUrls.length > 0 && (
          <Box mb={1} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            {mediaUrls.map((url, index) => (
              <Box
                key={index}
                component="img"
                src={url}
                alt={`Anexo ${index + 1}`}
                sx={{
                  maxWidth: '100%',
                  borderRadius: '12px',
                  mb: 0.5,
                  boxShadow: `0 2px 8px ${alpha(colors.text, 0.1)}`,
                }}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            p: 1.75,
            background: isAI ? colors.aiBubble : colors.doctorBubble,
            borderRadius: '18px',
            borderTopRightRadius: '4px',
            boxShadow: `0 2px 12px ${alpha(isAI ? '#8B5CF6' : colors.primary, 0.25)}`,
            position: 'relative',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {text}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" mt={1}>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#FFFFFF', 0.7),
                fontSize: '0.7rem',
              }}
            >
              {safeFormat(timestamp, 'HH:mm')}
            </Typography>

            <DoneAll sx={{ fontSize: 14, color: alpha('#FFFFFF', 0.7) }} />

            {isAI && (
              <Chip
                icon={<AutoAwesome sx={{ fontSize: '10px !important' }} />}
                label="IA"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: alpha('#FFFFFF', 0.2),
                  color: '#FFFFFF',
                  border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                  '& .MuiChip-icon': {
                    color: '#FFFFFF',
                    ml: 0.25,
                  },
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            )}

            {functionsCalled && functionsCalled.length > 0 && (
              <Chip
                label={`${functionsCalled.length} ações`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  bgcolor: alpha('#FFFFFF', 0.15),
                  color: '#FFFFFF',
                  border: `1px solid ${alpha('#FFFFFF', 0.25)}`,
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            )}
          </Stack>
        </Box>
      </Box>

      <Avatar
        sx={{
          width: 36,
          height: 36,
          background: isAI ? colors.gradient : alpha(colors.primary, 0.15),
          color: isAI ? '#FFFFFF' : colors.primary,
          fontSize: '0.85rem',
          fontWeight: 600,
          flexShrink: 0,
          boxShadow: isAI ? `0 4px 12px ${alpha('#8B5CF6', 0.3)}` : 'none',
        }}
      >
        {isAI ? <SmartToy sx={{ fontSize: 18 }} /> : <LocalHospital sx={{ fontSize: 18 }} />}
      </Avatar>
    </Box>
  );
});
DoctorMessage.displayName = 'DoctorMessage';

// Main MessageBubble component
const MessageBubble = memo(({ message, showDateDivider }) => {
  const messageTimestamp = message.clientMessageTimestamp || message.createdAt;
  const messageDate = toDate(messageTimestamp);

  return (
    <>
      {showDateDivider && messageDate && (
        <DateDivider date={messageDate} />
      )}

      <Stack spacing={2}>
        {/* Client message */}
        {message.clientMessage && (
          <ClientMessage
            text={message.clientMessage}
            mediaUrls={message.clientMediaUrls}
            timestamp={messageDate}
          />
        )}

        {/* Doctor/AI response */}
        {(message.doctorMessage || message.aiMessage) && (
          <DoctorMessage
            text={message.doctorMessage || message.aiMessage}
            mediaUrls={message.doctorMediaUrls}
            timestamp={messageDate}
            isAI={!!message.aiMessage && !message.doctorMessage}
            functionsCalled={message.context?.functionsCalled}
          />
        )}
      </Stack>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - messages are immutable so we only need to compare IDs
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.showDateDivider === nextProps.showDateDivider
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
