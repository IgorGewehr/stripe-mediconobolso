"use client";

import React, { useState, useCallback, memo, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Send,
  PauseCircle,
  SmartToy,
  Keyboard
} from '@mui/icons-material';

// Modern color palette
const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
};

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
        px: 2.5,
        borderTop: `1px solid ${colors.border}`,
        bgcolor: !aiBlocked
          ? alpha(colors.warning, 0.04)
          : colors.surface,
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        background: !aiBlocked
          ? `linear-gradient(180deg, ${alpha(colors.warningLight, 0.5)} 0%, ${colors.surface} 100%)`
          : colors.surface,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
          maxWidth: '100%',
        }}
      >
        {!aiBlocked ? (
          // AI Mode Active - Modern card to enable manual mode
          <Box
            onClick={!checkingAiStatus && !disabled ? onEnableManualMode : undefined}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1.5,
              px: 2.5,
              bgcolor: colors.surface,
              borderRadius: '16px',
              cursor: checkingAiStatus || disabled ? 'default' : 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1.5px solid ${alpha(colors.warning, 0.3)}`,
              boxShadow: `0 2px 8px ${alpha(colors.warning, 0.1)}`,
              '&:hover': (checkingAiStatus || disabled) ? {} : {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${alpha(colors.warning, 0.2)}`,
                borderColor: colors.warning,
              },
            }}
          >
            {/* AI Icon */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.warning} 0%, #F97316 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(colors.warning, 0.3)}`,
                flexShrink: 0,
              }}
            >
              {checkingAiStatus ? (
                <CircularProgress size={22} thickness={4} sx={{ color: '#FFFFFF' }} />
              ) : (
                <SmartToy sx={{ color: '#FFFFFF', fontSize: 24 }} />
              )}
            </Box>

            {/* Text */}
            <Box flex={1}>
              <Typography
                sx={{
                  color: colors.text,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                IA respondendo automaticamente
              </Typography>
              <Typography
                sx={{
                  color: colors.textSecondary,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 0.25,
                }}
              >
                <Keyboard sx={{ fontSize: 12 }} />
                Clique para responder manualmente
              </Typography>
            </Box>

            {/* Pause button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: '10px',
                bgcolor: alpha(colors.warning, 0.1),
                color: colors.warning,
                transition: 'all 0.2s ease',
              }}
            >
              <PauseCircle sx={{ fontSize: 18 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                Pausar
              </Typography>
            </Box>
          </Box>
        ) : (
          // Manual Mode Active - Modern input bar
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
                  borderRadius: '16px',
                  bgcolor: colors.surface,
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: colors.border,
                    borderWidth: '1.5px',
                    transition: 'all 0.2s ease',
                  },
                  '&:hover': {
                    '& fieldset': {
                      borderColor: alpha(colors.primary, 0.4),
                    },
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.12)}`,
                    '& fieldset': {
                      borderColor: colors.primary,
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  px: 2,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  '&::placeholder': {
                    color: colors.textMuted,
                    opacity: 1,
                  },
                },
              }}
            />

            <Tooltip title={messageInput.trim() ? 'Enviar mensagem (Enter)' : 'Digite uma mensagem'}>
              <span>
                <IconButton
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendingMessage || disabled}
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    background: messageInput.trim() ? colors.gradient : alpha(colors.textMuted, 0.1),
                    color: messageInput.trim() ? '#FFFFFF' : colors.textMuted,
                    borderRadius: '14px',
                    boxShadow: messageInput.trim() ? `0 4px 14px ${alpha(colors.primary, 0.35)}` : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: messageInput.trim() ? colors.gradient : alpha(colors.textMuted, 0.15),
                      transform: messageInput.trim() ? 'translateY(-2px)' : 'none',
                      boxShadow: messageInput.trim() ? `0 8px 24px ${alpha(colors.primary, 0.4)}` : 'none',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    '&.Mui-disabled': {
                      background: alpha(colors.textMuted, 0.08),
                      color: alpha(colors.textMuted, 0.4),
                      boxShadow: 'none',
                    },
                  }}
                >
                  {sendingMessage ? (
                    <CircularProgress size={22} thickness={4} sx={{ color: '#FFFFFF' }} />
                  ) : (
                    <Send sx={{ fontSize: 22 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Hint text for manual mode */}
      {aiBlocked && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1.5,
            color: colors.textMuted,
            fontSize: '0.7rem',
          }}
        >
          Pressione <kbd style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: alpha(colors.textMuted, 0.1),
            border: `1px solid ${colors.border}`,
            fontFamily: 'inherit',
            fontSize: '0.65rem',
          }}>Enter</kbd> para enviar ou <kbd style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: alpha(colors.textMuted, 0.1),
            border: `1px solid ${colors.border}`,
            fontFamily: 'inherit',
            fontSize: '0.65rem',
          }}>Shift + Enter</kbd> para nova linha
        </Typography>
      )}
    </Box>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
