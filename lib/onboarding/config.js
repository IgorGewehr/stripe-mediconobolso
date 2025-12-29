/**
 * Onboarding Configuration
 * Configuração dos passos do onboarding para o Médico no Bolso
 */

export const ONBOARDING_STEPS = [
  {
    id: 'complete_profile',
    title: 'Complete seu Perfil',
    description: 'Adicione suas informações profissionais como CRM e especialidade',
    icon: 'UserCog',
    order: 1,
    isOptional: false,
    estimatedMinutes: 2,
    hasEmbeddedDialog: true,
    dialogType: 'profile',
    guidanceText: 'Suas informações profissionais são importantes para a emissão de receitas e documentos.',
    features: ['CRM validado', 'Especialidade', 'Dados para receitas'],
  },
  {
    id: 'add_patient',
    title: 'Adicione seu Primeiro Paciente',
    description: 'Cadastre um paciente para começar a usar o sistema',
    icon: 'UserPlus',
    order: 2,
    isOptional: false,
    estimatedMinutes: 3,
    hasEmbeddedDialog: true,
    dialogType: 'patient',
    guidanceText: 'Você pode adicionar pacientes manualmente ou importar de uma planilha.',
    features: ['Dados básicos', 'Histórico médico', 'Contato'],
  },
  {
    id: 'setup_schedule',
    title: 'Configure sua Agenda',
    description: 'Defina seus horários de atendimento',
    icon: 'Calendar',
    order: 3,
    isOptional: true,
    estimatedMinutes: 3,
    hasEmbeddedDialog: true,
    dialogType: 'schedule',
    guidanceText: 'Configure seus dias e horários de atendimento para agendar consultas.',
    features: ['Dias da semana', 'Horários', 'Duração padrão'],
  },
  {
    id: 'explore_features',
    title: 'Explore o Sistema',
    description: 'Conheça as principais funcionalidades',
    icon: 'Compass',
    order: 4,
    isOptional: true,
    estimatedMinutes: 2,
    hasEmbeddedDialog: false,
    dialogType: null,
    guidanceText: 'Navegue pelos menus e descubra tudo que o Médico no Bolso pode fazer por você.',
    features: ['Receitas', 'Prontuários', 'Financeiro', 'Doctor AI'],
  },
];

export const ONBOARDING_STORAGE_KEY = 'mediconobolso_onboarding';

export const DEFAULT_ONBOARDING_STATE = {
  currentStepId: 'complete_profile',
  viewMode: 'compact', // 'compact' | 'expanded' | 'minimized'
  isDismissed: false,
  completedSteps: [],
  skippedSteps: [],
  startedAt: null,
  lastInteractionAt: null,
};

/**
 * Calcula a porcentagem de conclusão do onboarding
 */
export function calculateCompletionPercentage(completedSteps, skippedSteps) {
  const totalSteps = ONBOARDING_STEPS.length;
  const doneSteps = completedSteps.length + skippedSteps.length;
  return Math.round((doneSteps / totalSteps) * 100);
}

/**
 * Verifica se o onboarding foi completamente finalizado
 */
export function isOnboardingComplete(completedSteps, skippedSteps) {
  const requiredSteps = ONBOARDING_STEPS.filter(s => !s.isOptional);
  return requiredSteps.every(
    step => completedSteps.includes(step.id) || skippedSteps.includes(step.id)
  );
}

/**
 * Retorna o próximo passo pendente
 */
export function getNextPendingStep(completedSteps, skippedSteps) {
  return ONBOARDING_STEPS.find(
    step => !completedSteps.includes(step.id) && !skippedSteps.includes(step.id)
  );
}
