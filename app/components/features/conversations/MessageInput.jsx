"use client";

import React, { useState, useCallback, memo, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  alpha
} from '@mui/material';
import {
  Send,
  Block as BlockIcon
} from '@mui/icons-material';

const MessageInput = memo(({
  aiBlocked,
  checkingAiStatus,
  onSendMessage,
  onEnableManualMode,
  disabled = false
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const inputRef = useRef(null);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() || sendingMessage) return;

    const message = messageInput.trim();
    setSendingMessage(true);
    setMessageInput(''); // Clear immediately for better UX

    try {
      await onSendMessage(message);
    } catch (error) {
      // Restore message if send failed
      setMessageInput(message);
    } finally {
      setSendingMessage(false);
      // Focus back on input after sending
      inputRef.current?.focus();
    }
  }, [messageInput, sendingMessage, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    // Enter without shift sends, Enter with shift creates new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid #E5E7EB',
        bgcolor: !aiBlocked
          ? alpha('#EF5350', 0.05)
          : '#FFFFFF',
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          maxWidth: '100%',
        }}
      >
        {!aiBlocked ? (
          // AI Mode Active - Click to enable manual mode
          <Box
            onClick={!checkingAiStatus && !disabled ? onEnableManualMode : undefined}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              py: 1.25,
              px: 3,
              bgcolor: alpha('#EF5350', 0.08),
              borderRadius: '24px',
              cursor: checkingAiStatus || disabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease-out',
              border: `1.5px solid ${alpha('#EF5350', 0.2)}`,
              '&:hover': (checkingAiStatus || disabled) ? {} : {
                bgcolor: alpha('#EF5350', 0.15),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 16px ${alpha('#EF5350', 0.15)}`,
                borderColor: alpha('#EF5350', 0.4),
              },
            }}
          >
            {checkingAiStatus ? (
              <CircularProgress size={20} thickness={4} sx={{ color: '#EF5350' }} />
            ) : (
              <BlockIcon sx={{ color: '#EF5350', fontSize: 20 }} />
            )}
            <Typography
              sx={{
                color: '#EF5350',
                fontWeight: 600,
                fontSize: '0.875rem',
                userSelect: 'none',
                letterSpacing: '0.01em',
              }}
            >
              Pausar IA e responder manualmente
            </Typography>
          </Box>
        ) : (
          // Manual Mode Active - Input bar
          <>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder="Digite sua mensagem..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sendingMessage || disabled}
              variant="outlined"
              autoComplete="off"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: alpha('#FFFFFF', 0.95),
                  transition: 'box-shadow 0.2s ease-out, border-color 0.2s ease-out',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  '& fieldset': {
                    borderColor: alpha('#E5E7EB', 0.6),
                    borderWidth: '1.5px',
                    transition: 'border-color 0.2s ease-out',
                  },
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    '& fieldset': {
                      borderColor: alpha('#4285F4', 0.4),
                    },
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 16px ${alpha('#4285F4', 0.12)}`,
                    '& fieldset': {
                      borderColor: '#4285F4',
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6,
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1,
                  px: 2,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  '&::placeholder': {
                    color: alpha('#8A94A6', 0.5),
                    opacity: 1,
                  },
                },
              }}
            />

            <IconButton
              onClick={handleSend}
              disabled={!messageInput.trim() || sendingMessage || disabled}
              sx={{
                bgcolor: '#4285F4',
                color: '#FFFFFF',
                width: 44,
                height: 44,
                flexShrink: 0,
                boxShadow: `0 4px 12px ${alpha('#4285F4', 0.3)}`,
                transition: 'all 0.2s ease-out',
                '&:hover': {
                  bgcolor: '#1852FE',
                  transform: 'scale(1.05)',
                  boxShadow: `0 6px 20px ${alpha('#4285F4', 0.4)}`,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                '&.Mui-disabled': {
                  bgcolor: alpha('#9E9E9E', 0.15),
                  color: alpha('#9E9E9E', 0.4),
                  boxShadow: 'none',
                },
              }}
            >
              {sendingMessage ? (
                <CircularProgress size={20} thickness={4} sx={{ color: '#FFFFFF' }} />
              ) : (
                <Send sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
