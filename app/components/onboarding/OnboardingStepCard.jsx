"use client";

/**
 * OnboardingStepCard Component
 * Card individual para cada passo do onboarding
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  ArrowRight,
  Clock,
  UserCog,
  UserPlus,
  Calendar,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mapeamento de ícones
const ICON_MAP = {
  UserCog,
  UserPlus,
  Calendar,
  Compass,
};

const MotionCard = motion(Card);

export default function OnboardingStepCard({
  step,
  isActive,
  isCompleted,
  isSkipped,
  onAction,
  onComplete,
  onSkip,
  loading = false,
  compact = false,
}) {
  const Icon = ICON_MAP[step.icon] || Compass;

  // Cores baseadas no estado
  const getColors = () => {
    if (isCompleted) {
      return {
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.2)',
        icon: '#10b981',
        iconBg: 'rgba(16, 185, 129, 0.12)',
      };
    }
    if (isActive) {
      return {
        bg: 'rgba(29, 78, 216, 0.06)',
        border: 'rgba(29, 78, 216, 0.2)',
        icon: '#1D4ED8',
        iconBg: 'rgba(29, 78, 216, 0.1)',
      };
    }
    return {
      bg: 'rgba(0, 0, 0, 0.02)',
      border: 'rgba(0, 0, 0, 0.08)',
      icon: '#6B7280',
      iconBg: 'rgba(0, 0, 0, 0.04)',
    };
  };

  const colors = getColors();

  return (
    <MotionCard
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={!isSkipped && !loading ? { y: -2 } : {}}
      sx={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        opacity: isSkipped ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 12px rgba(29, 78, 216, 0.1)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: isActive ? 'rgba(29, 78, 216, 0.4)' : colors.border,
        },
      }}
    >
      {/* Indicador de passo ativo */}
      {isActive && !isCompleted && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
          }}
        />
      )}

      <CardContent sx={{ p: compact ? 2 : 2.5 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Ícone */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: colors.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isCompleted ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <Icon size={22} color={colors.icon} />
              )}
            </Box>

            {/* Conteúdo */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <Stack direction="row" spacing={1} sx={{ mb: 0.75 }} flexWrap="wrap" gap={0.5}>
                <Chip
                  label={`Passo ${step.order}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: isActive ? 'rgba(29, 78, 216, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                    color: isActive ? '#1D4ED8' : '#6B7280',
                    border: 'none',
                  }}
                />

                {isCompleted && (
                  <Chip
                    icon={<CheckCircle size={12} />}
                    label="Concluído"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      border: 'none',
                      '& .MuiChip-icon': { color: '#10b981' },
                    }}
                  />
                )}

                {step.isOptional && !isCompleted && !isSkipped && (
                  <Chip
                    label="Opcional"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      color: '#D97706',
                      border: 'none',
                    }}
                  />
                )}

                {isSkipped && (
                  <Chip
                    label="Pulado"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(107, 114, 128, 0.1)',
                      color: '#6B7280',
                      border: 'none',
                    }}
                  />
                )}
              </Stack>

              {/* Título */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#111827',
                  mb: 0.25,
                  fontSize: compact ? '0.9rem' : '0.95rem',
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </Typography>

              {/* Descrição */}
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                }}
              >
                {step.description}
              </Typography>

              {/* Tempo estimado */}
              {step.estimatedMinutes && !isCompleted && !isSkipped && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                  <Clock size={12} color="#9CA3AF" />
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                    ~{step.estimatedMinutes} min
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Dica de orientação */}
          {step.guidanceText && isActive && !isCompleted && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: 'rgba(29, 78, 216, 0.04)',
                border: '1px solid rgba(29, 78, 216, 0.1)',
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: '#4B5563', lineHeight: 1.5, fontSize: '0.75rem' }}
              >
                {step.guidanceText}
              </Typography>
            </Box>
          )}

          {/* Botões de ação */}
          {!isCompleted && !isSkipped && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowRight size={16} />}
                onClick={onAction}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.75,
                  backgroundColor: isActive ? '#1D4ED8' : '#374151',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#1E40AF' : '#1F2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                {loading ? 'Carregando...' : step.hasEmbeddedDialog ? 'Começar' : 'Ir para'}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={onComplete}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.75,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: '#059669',
                  '&:hover': {
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    backgroundColor: 'rgba(16, 185, 129, 0.04)',
                  },
                }}
              >
                Já fiz isso
              </Button>

              {step.isOptional && onSkip && (
                <Button
                  variant="text"
                  size="small"
                  onClick={onSkip}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    color: '#9CA3AF',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  Pular
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </MotionCard>
  );
}
