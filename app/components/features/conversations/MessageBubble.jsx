"use client";

import React, { memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import {
  Person,
  SmartToy,
  Event,
  LocalHospital
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Date divider component
const DateDivider = memo(({ date }) => {
  return (
    <Box display="flex" justifyContent="center" my={2}>
      <Chip
        label={safeFormat(date, "EEEE, dd 'de' MMMM")}
        size="small"
        icon={<Event fontSize="small" />}
        sx={{
          bgcolor: alpha('#4285F4', 0.1),
          color: '#4285F4',
          fontWeight: 600,
        }}
      />
    </Box>
  );
});
DateDivider.displayName = 'DateDivider';

// Client message component
const ClientMessage = memo(({ text, mediaUrls, timestamp }) => {
  return (
    <Box display="flex" justifyContent="flex-start" gap={1.5}>
      <Avatar
        sx={{
          bgcolor: alpha('#29B6F6', 0.1),
          color: '#29B6F6',
          width: 36,
          height: 36,
        }}
      >
        <Person fontSize="small" />
      </Avatar>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 2,
          borderBottomLeftRadius: 4,
        }}
      >
        {/* Media attachments */}
        {mediaUrls && mediaUrls.length > 0 && (
          <Box mb={1}>
            {mediaUrls.map((url, index) => (
              <Box
                key={index}
                component="img"
                src={url}
                alt={`Anexo ${index + 1}`}
                sx={{
                  maxWidth: '100%',
                  borderRadius: 1,
                  mb: 0.5
                }}
              />
            ))}
          </Box>
        )}

        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          {safeFormat(timestamp, 'dd/MM/yyyy HH:mm')}
        </Typography>
      </Paper>
    </Box>
  );
});
ClientMessage.displayName = 'ClientMessage';

// Doctor/AI message component
const DoctorMessage = memo(({ text, mediaUrls, timestamp, isAI = false, functionsCalled }) => {
  return (
    <Box display="flex" justifyContent="flex-end" gap={1.5}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: alpha('#4285F4', 0.08),
          border: `1px solid ${alpha('#4285F4', 0.2)}`,
          borderRadius: 2,
          borderBottomRightRadius: 4,
        }}
      >
        {/* Media attachments */}
        {mediaUrls && mediaUrls.length > 0 && (
          <Box mb={1}>
            {mediaUrls.map((url, index) => (
              <Box
                key={index}
                component="img"
                src={url}
                alt={`Anexo ${index + 1}`}
                sx={{
                  maxWidth: '100%',
                  borderRadius: 1,
                  mb: 0.5
                }}
              />
            ))}
          </Box>
        )}

        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
          <Typography variant="caption" color="text.secondary">
            {safeFormat(timestamp, 'dd/MM/yyyy HH:mm')}
          </Typography>

          {isAI && (
            <Chip
              label="IA"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: alpha('#9C27B0', 0.1),
                color: '#9C27B0',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          {functionsCalled && functionsCalled.length > 0 && (
            <Chip
              label={`${functionsCalled.length} funcao(oes)`}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Stack>
      </Paper>

      <Avatar
        sx={{
          bgcolor: isAI ? alpha('#9C27B0', 0.1) : alpha('#4285F4', 0.1),
          color: isAI ? '#9C27B0' : '#4285F4',
          width: 36,
          height: 36,
        }}
      >
        {isAI ? <SmartToy fontSize="small" /> : <LocalHospital fontSize="small" />}
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
