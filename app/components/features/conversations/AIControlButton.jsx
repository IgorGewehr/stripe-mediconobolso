"use client";

import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import useAIBlockStatus from '../../hooks/useAIBlockStatus';

const AIControlButton = ({ phone, conversationName }) => {
  const {
    blocked,
    loading,
    expiresAt,
    enableManualMode,
    disableManualMode,
    getExpiryDisplay
  } = useAIBlockStatus({ phone });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(1); // Default 1 hour
  const [submitting, setSubmitting] = useState(false);

  const handleToggleBlock = async (block, blockReason, blockDuration) => {
    setSubmitting(true);
    try {
      if (block) {
        await enableManualMode(blockDuration || duration, blockReason || reason);
      } else {
        await disableManualMode();
      }
      setDialogOpen(false);
      setReason('');
      setDuration(1);
    } catch (error) {
      console.error('Failed to toggle AI block:', error);
      alert('Erro ao alterar status do agente de IA');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !blocked) {
    return <CircularProgress size={24} />;
  }

  return (
    <>
      <Tooltip title={blocked ? 'Agente de IA bloqueado - Clique para reativar' : 'Bloquear agente de IA'}>
        <IconButton
          onClick={() => {
            if (blocked) {
              handleToggleBlock(false);
            } else {
              setDialogOpen(true);
            }
          }}
          color={blocked ? 'error' : 'default'}
          size="small"
        >
          {blocked ? <BlockIcon /> : <AIIcon />}
        </IconButton>
      </Tooltip>

      {/* Visual indicator */}
      {blocked && (
        <Chip
          icon={<BlockIcon />}
          label={
            expiresAt
              ? `IA Bloqueada (expira: ${getExpiryDisplay()})`
              : 'IA Bloqueada'
          }
          color="error"
          size="small"
          sx={{ ml: 1 }}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bloquear Agente de IA
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Você está prestes a bloquear o agente de IA para esta conversa:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{conversationName || phone}</strong>
            </Typography>
            <Typography variant="body2" color="warning.main">
              Enquanto bloqueado, a IA não responderá automaticamente a esta conversa. Você precisará responder manualmente.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <ScheduleIcon fontSize="small" />
              Duração do Bloqueio
            </Typography>
            <ToggleButtonGroup
              value={duration}
              exclusive
              onChange={(_, value) => value && setDuration(value)}
              fullWidth
              disabled={submitting}
            >
              <ToggleButton value={1}>1 hora</ToggleButton>
              <ToggleButton value={2}>2 horas</ToggleButton>
              <ToggleButton value={4}>4 horas</ToggleButton>
              <ToggleButton value={24}>24 horas</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              A IA será automaticamente reativada após o período selecionado
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motivo do Bloqueio (Opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Paciente preferiu atendimento humano, negociação complexa, etc."
            disabled={submitting}
            inputProps={{ maxLength: 200 }}
            helperText={`${reason.length}/200 caracteres`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleToggleBlock(true)}
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <BlockIcon />}
          >
            {submitting ? 'Bloqueando...' : 'Confirmar Bloqueio'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AIControlButton;
