"use client";

/**
 * Onboarding Component
 * Componente principal de onboarding com visualização compacta e expandida
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  LinearProgress,
  Chip,
  Fade,
  Collapse,
  ClickAwayListener,
} from '@mui/material';
import {
  X,
  ChevronDown,
  ChevronUp,
  Rocket,
  PartyPopper,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useOnboarding from '@/lib/hooks/useOnboarding';
import OnboardingStepCard from './OnboardingStepCard';
import ProfileSetupDialog from './dialogs/ProfileSetupDialog';
import PatientSetupDialog from './dialogs/PatientSetupDialog';
import ScheduleSetupDialog from './dialogs/ScheduleSetupDialog';

const MotionCard = motion(Card);

export default function Onboarding({ userId }) {
  const {
    state,
    loading,
    steps,
    currentStep,
    activeDialog,
    closeDialog,
    startStep,
    completeStep,
    skipStep,
    setViewMode,
    dismissOnboarding,
    shouldShow,
    completionPercentage,
    isFullyCompleted,
  } = useOnboarding(userId);

  const [processingStep, setProcessingStep] = useState(null);

  // Não mostrar se não deve aparecer ou está carregando
  if (!shouldShow || loading || !state) {
    return null;
  }

  const isCompact = state.viewMode === 'compact';
  const isMinimized = state.viewMode === 'minimized';

  /**
   * Handler para ação do passo
   */
  const handleStepAction = async (step) => {
    try {
      setProcessingStep(step.id);
      await startStep(step.id);
    } catch (error) {
      console.error('[Onboarding] Erro ao iniciar passo:', error);
    } finally {
      setProcessingStep(null);
    }
  };

  /**
   * Handler para completar passo
   */
  const handleCompleteStep = async (stepId) => {
    try {
      setProcessingStep(stepId);
      await completeStep(stepId);
    } catch (error) {
      console.error('[Onboarding] Erro ao completar passo:', error);
    } finally {
      setProcessingStep(null);
    }
  };

  /**
   * Handler para pular passo
   */
  const handleSkipStep = async (stepId) => {
    try {
      setProcessingStep(stepId);
      await skipStep(stepId);
    } catch (error) {
      console.error('[Onboarding] Erro ao pular passo:', error);
    } finally {
      setProcessingStep(null);
    }
  };

  /**
   * Toggle expand/collapse
   */
  const handleToggleExpand = () => {
    setViewMode(isCompact ? 'expanded' : 'compact');
  };

  /**
   * Renderiza a versão minimizada (só um botão flutuante)
   */
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setViewMode('compact')}
          sx={{
            borderRadius: '50%',
            minWidth: 56,
            height: 56,
            backgroundColor: '#1D4ED8',
            boxShadow: '0 4px 16px rgba(29, 78, 216, 0.3)',
            '&:hover': {
              backgroundColor: '#1E40AF',
            },
          }}
        >
          <Rocket size={24} />
        </Button>
      </motion.div>
    );
  }

  /**
   * Renderiza a versão compacta
   */
  const renderCompactView = () => (
    <Fade in={true}>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Barra de progresso no topo */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(29, 78, 216, 0.1)',
          }}
        >
          <Box
            sx={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: '#1D4ED8',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(29, 78, 216, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Rocket size={20} color="#1D4ED8" />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}
                  >
                    Primeiros Passos
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    {state.completedSteps.length}/{steps.length} concluídos
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleToggleExpand}
                  sx={{ color: '#6B7280' }}
                >
                  <ChevronDown size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setViewMode('minimized')}
                  sx={{ color: '#6B7280' }}
                >
                  <Minimize2 size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={dismissOnboarding}
                  sx={{ color: '#9CA3AF' }}
                >
                  <X size={16} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Progresso */}
            <Box>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(29, 78, 216, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#1D4ED8',
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}
              >
                {completionPercentage}% concluído
              </Typography>
            </Box>

            {/* Próximo passo */}
            {currentStep && !isFullyCompleted && (
              <Stack spacing={1}>
                <Typography
                  variant="body2"
                  sx={{ color: '#374151', fontWeight: 500 }}
                >
                  Próximo: {currentStep.title}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleStepAction(currentStep)}
                  disabled={processingStep === currentStep.id}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    py: 1.25,
                    backgroundColor: '#1D4ED8',
                    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.2)',
                    '&:hover': {
                      backgroundColor: '#1E40AF',
                    },
                  }}
                >
                  {processingStep === currentStep.id ? 'Carregando...' : 'Continuar'}
                </Button>
              </Stack>
            )}

            {/* Mensagem de conclusão */}
            {isFullyCompleted && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <PartyPopper size={20} color="#10b981" />
                <Typography
                  variant="body2"
                  sx={{ color: '#059669', fontWeight: 600 }}
                >
                  Parabéns! Configuração completa
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </MotionCard>
    </Fade>
  );

  /**
   * Renderiza a versão expandida
   */
  const renderExpandedView = () => (
    <Fade in={true}>
      <Card
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Barra de progresso no topo */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(29, 78, 216, 0.1)',
          }}
        >
          <Box
            sx={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: '#1D4ED8',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(29, 78, 216, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Rocket size={24} color="#1D4ED8" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#111827', fontSize: '1.1rem' }}
                  >
                    Configure o Médico no Bolso
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Complete os passos abaixo para começar
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleToggleExpand}
                  sx={{ color: '#6B7280' }}
                >
                  <ChevronUp size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setViewMode('minimized')}
                  sx={{ color: '#6B7280' }}
                >
                  <Minimize2 size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={dismissOnboarding}
                  sx={{ color: '#9CA3AF' }}
                >
                  <X size={16} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Resumo do progresso */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Chip
                  label={`${state.completedSteps.length}/${steps.length} etapas concluídas`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(29, 78, 216, 0.1)',
                    color: '#1D4ED8',
                    border: 'none',
                  }}
                />
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {completionPercentage}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(29, 78, 216, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#1D4ED8',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Lista de passos */}
            <Stack spacing={2}>
              <AnimatePresence mode="popLayout">
                {steps.map((step) => (
                  <OnboardingStepCard
                    key={step.id}
                    step={step}
                    isActive={currentStep?.id === step.id}
                    isCompleted={step.status === 'completed'}
                    isSkipped={step.status === 'skipped'}
                    onAction={() => handleStepAction(step)}
                    onComplete={() => handleCompleteStep(step.id)}
                    onSkip={step.isOptional ? () => handleSkipStep(step.id) : undefined}
                    loading={processingStep === step.id}
                  />
                ))}
              </AnimatePresence>
            </Stack>

            {/* Celebração de conclusão */}
            {isFullyCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Card
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <PartyPopper size={40} color="#10b981" style={{ marginBottom: 12 }} />
                    <Typography
                      variant="h6"
                      sx={{ color: '#111827', fontWeight: 700, mb: 0.5 }}
                    >
                      Parabéns! Configuração Concluída
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#6B7280', mb: 2 }}
                    >
                      O Médico no Bolso está pronto para usar!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={dismissOnboarding}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        px: 4,
                        py: 1,
                        backgroundColor: '#10b981',
                        '&:hover': {
                          backgroundColor: '#059669',
                        },
                      }}
                    >
                      Começar a Usar
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );

  /**
   * Handler para clique fora do componente
   */
  const handleClickAway = () => {
    // Só minimiza se não estiver com dialog aberto e não estiver minimizado
    if (!activeDialog.isOpen && !isMinimized) {
      setViewMode('minimized');
    }
  };

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          {isCompact ? renderCompactView() : renderExpandedView()}
        </Box>
      </ClickAwayListener>

      {/* Dialogs dos passos */}
      {activeDialog.isOpen && (
        <>
          {activeDialog.type === 'profile' && (
            <ProfileSetupDialog
              open={true}
              onClose={closeDialog}
              onComplete={() => handleCompleteStep(activeDialog.stepId)}
              onSkip={() => handleSkipStep(activeDialog.stepId)}
            />
          )}

          {activeDialog.type === 'patient' && (
            <PatientSetupDialog
              open={true}
              onClose={closeDialog}
              onComplete={() => handleCompleteStep(activeDialog.stepId)}
              onSkip={() => handleSkipStep(activeDialog.stepId)}
            />
          )}

          {activeDialog.type === 'schedule' && (
            <ScheduleSetupDialog
              open={true}
              onClose={closeDialog}
              onComplete={() => handleCompleteStep(activeDialog.stepId)}
              onSkip={() => handleSkipStep(activeDialog.stepId)}
            />
          )}
        </>
      )}
    </>
  );
}
