"use client";

/**
 * useOnboarding Hook
 * Gerencia o estado e ações do onboarding
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STORAGE_KEY,
  DEFAULT_ONBOARDING_STATE,
  calculateCompletionPercentage,
  isOnboardingComplete,
  getNextPendingStep,
} from '../onboarding/config';

export function useOnboarding(userId) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState({ isOpen: false, type: null });

  // Chave de storage específica do usuário
  const storageKey = userId ? `${ONBOARDING_STORAGE_KEY}_${userId}` : ONBOARDING_STORAGE_KEY;

  /**
   * Carrega o estado do localStorage
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } else {
        const newState = {
          ...DEFAULT_ONBOARDING_STATE,
          startedAt: new Date().toISOString(),
          lastInteractionAt: new Date().toISOString(),
        };
        setState(newState);
        localStorage.setItem(storageKey, JSON.stringify(newState));
      }
    } catch (error) {
      console.error('[Onboarding] Erro ao carregar estado:', error);
      setState(DEFAULT_ONBOARDING_STATE);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  /**
   * Persiste o estado no localStorage
   */
  const persistState = useCallback((updates) => {
    setState(prev => {
      const newState = {
        ...prev,
        ...updates,
        lastInteractionAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(newState));
      } catch (error) {
        console.error('[Onboarding] Erro ao salvar estado:', error);
      }
      return newState;
    });
  }, [storageKey]);

  /**
   * Steps com status atualizado
   */
  const steps = useMemo(() => {
    if (!state) return ONBOARDING_STEPS.map(s => ({ ...s, status: 'pending' }));

    return ONBOARDING_STEPS.map(step => ({
      ...step,
      status: state.completedSteps.includes(step.id)
        ? 'completed'
        : state.skippedSteps.includes(step.id)
          ? 'skipped'
          : 'pending',
    }));
  }, [state]);

  /**
   * Passo atual
   */
  const currentStep = useMemo(() => {
    if (!state) return null;
    return getNextPendingStep(state.completedSteps, state.skippedSteps) || null;
  }, [state]);

  /**
   * Porcentagem de conclusão
   */
  const completionPercentage = useMemo(() => {
    if (!state) return 0;
    return calculateCompletionPercentage(state.completedSteps, state.skippedSteps);
  }, [state]);

  /**
   * Onboarding totalmente completo
   */
  const isFullyCompleted = useMemo(() => {
    if (!state) return false;
    return isOnboardingComplete(state.completedSteps, state.skippedSteps);
  }, [state]);

  /**
   * Deve mostrar o onboarding
   */
  const shouldShow = useMemo(() => {
    if (!state) return false;
    if (state.isDismissed) return false;
    if (isFullyCompleted) return false;
    return true;
  }, [state, isFullyCompleted]);

  /**
   * Iniciar um passo
   */
  const startStep = useCallback((stepId) => {
    const step = ONBOARDING_STEPS.find(s => s.id === stepId);
    if (!step) return;

    persistState({ currentStepId: stepId });

    if (step.hasEmbeddedDialog && step.dialogType) {
      setActiveDialog({ isOpen: true, type: step.dialogType, stepId });
    }
  }, [persistState]);

  /**
   * Completar um passo
   */
  const completeStep = useCallback((stepId) => {
    if (!state) return;

    const newCompleted = [...state.completedSteps];
    if (!newCompleted.includes(stepId)) {
      newCompleted.push(stepId);
    }

    const next = getNextPendingStep(newCompleted, state.skippedSteps);

    persistState({
      completedSteps: newCompleted,
      currentStepId: next?.id || null,
    });

    setActiveDialog({ isOpen: false, type: null });
  }, [state, persistState]);

  /**
   * Pular um passo
   */
  const skipStep = useCallback((stepId) => {
    if (!state) return;

    const newSkipped = [...state.skippedSteps];
    if (!newSkipped.includes(stepId)) {
      newSkipped.push(stepId);
    }

    const next = getNextPendingStep(state.completedSteps, newSkipped);

    persistState({
      skippedSteps: newSkipped,
      currentStepId: next?.id || null,
    });

    setActiveDialog({ isOpen: false, type: null });
  }, [state, persistState]);

  /**
   * Fechar dialog
   */
  const closeDialog = useCallback(() => {
    setActiveDialog({ isOpen: false, type: null });
  }, []);

  /**
   * Alterar modo de visualização
   */
  const setViewMode = useCallback((mode) => {
    persistState({ viewMode: mode });
  }, [persistState]);

  /**
   * Dispensar onboarding
   */
  const dismissOnboarding = useCallback(() => {
    persistState({ isDismissed: true });
    setActiveDialog({ isOpen: false, type: null });
  }, [persistState]);

  /**
   * Reabrir onboarding
   */
  const reopenOnboarding = useCallback(() => {
    persistState({ isDismissed: false });
  }, [persistState]);

  /**
   * Resetar onboarding
   */
  const resetOnboarding = useCallback(() => {
    const newState = {
      ...DEFAULT_ONBOARDING_STATE,
      startedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
    };
    setState(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
    setActiveDialog({ isOpen: false, type: null });
  }, [storageKey]);

  return {
    // Estado
    state,
    loading,

    // Steps
    steps,
    currentStep,

    // Dialog
    activeDialog,
    closeDialog,

    // Ações
    startStep,
    completeStep,
    skipStep,
    setViewMode,
    dismissOnboarding,
    reopenOnboarding,
    resetOnboarding,

    // Computed
    shouldShow,
    completionPercentage,
    isFullyCompleted,
  };
}

export default useOnboarding;
