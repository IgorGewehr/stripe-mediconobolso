// lib/modules/moduleConfig.js

/**
 * Configuração central dos módulos do sistema
 * Estrutura modular para controle de acesso granular
 */

// Definição dos módulos disponíveis no sistema
export const MODULES = {
    // Módulos principais
    DASHBOARD: 'dashboard',
    PATIENTS: 'patients',
    PRESCRIPTIONS: 'prescriptions',
    APPOINTMENTS: 'appointments',

    // Módulos avançados
    METRICS: 'metrics',
    FINANCIAL: 'financial',
    AI_ANALYSIS: 'ai_analysis',

    // Funcionalidades específicas
    EXAM_PROCESSING: 'exam_processing',
    BULK_OPERATIONS: 'bulk_operations',
    ADVANCED_REPORTS: 'advanced_reports',
    INTEGRATIONS: 'integrations',

    // Administrativo
    ADMIN_PANEL: 'admin_panel',
    USER_MANAGEMENT: 'user_management',
    SYSTEM_CONFIG: 'system_config'
};

// Informações detalhadas de cada módulo
export const MODULE_INFO = {
    [MODULES.DASHBOARD]: {
        name: 'Dashboard',
        description: 'Visão geral e métricas básicas',
        icon: '📊',
        category: 'essential',
        dependencies: []
    },
    [MODULES.PATIENTS]: {
        name: 'Gestão de Pacientes',
        description: 'Cadastro e gerenciamento de pacientes',
        icon: '👥',
        category: 'essential',
        dependencies: []
    },
    [MODULES.PRESCRIPTIONS]: {
        name: 'Receitas Médicas',
        description: 'Criação e gestão de receitas',
        icon: '💊',
        category: 'essential',
        dependencies: [MODULES.PATIENTS]
    },
    [MODULES.APPOINTMENTS]: {
        name: 'Agenda Médica',
        description: 'Agendamento e gestão de consultas',
        icon: '📅',
        category: 'essential',
        dependencies: [MODULES.PATIENTS]
    },
    [MODULES.METRICS]: {
        name: 'Métricas Avançadas',
        description: 'Relatórios detalhados e análises',
        icon: '📈',
        category: 'advanced',
        dependencies: [MODULES.PATIENTS, MODULES.APPOINTMENTS]
    },
    [MODULES.FINANCIAL]: {
        name: 'Gestão Financeira',
        description: 'Controle financeiro da clínica',
        icon: '💰',
        category: 'advanced',
        dependencies: [MODULES.PATIENTS, MODULES.APPOINTMENTS]
    },
    [MODULES.AI_ANALYSIS]: {
        name: 'Análise por IA',
        description: 'Processamento automatizado e análise clínica inteligente',
        icon: '🤖',
        category: 'premium',
        dependencies: []
    },
    [MODULES.EXAM_PROCESSING]: {
        name: 'Processamento de Exames',
        description: 'Upload e análise automática de exames médicos',
        icon: '🔬',
        category: 'premium',
        dependencies: [MODULES.AI_ANALYSIS]
    },
    [MODULES.BULK_OPERATIONS]: {
        name: 'Operações em Lote',
        description: 'Importação/exportação de dados',
        icon: '📋',
        category: 'premium',
        dependencies: [MODULES.PATIENTS]
    },
    [MODULES.ADVANCED_REPORTS]: {
        name: 'Relatórios Avançados',
        description: 'Relatórios personalizados e exportação',
        icon: '📄',
        category: 'premium',
        dependencies: [MODULES.METRICS]
    },
    [MODULES.INTEGRATIONS]: {
        name: 'Integrações',
        description: 'APIs e integrações externas',
        icon: '🔗',
        category: 'enterprise',
        dependencies: []
    },
    [MODULES.ADMIN_PANEL]: {
        name: 'Painel Administrativo',
        description: 'Gestão administrativa do sistema',
        icon: '⚙️',
        category: 'admin',
        dependencies: []
    },
    [MODULES.USER_MANAGEMENT]: {
        name: 'Gestão de Usuários',
        description: 'Administração de usuários e permissões',
        icon: '👤',
        category: 'admin',
        dependencies: [MODULES.ADMIN_PANEL]
    },
    [MODULES.SYSTEM_CONFIG]: {
        name: 'Configurações do Sistema',
        description: 'Configurações avançadas do sistema',
        icon: '🛠️',
        category: 'admin',
        dependencies: [MODULES.ADMIN_PANEL]
    }
};

// Definição dos planos e seus módulos
export const PLAN_MODULES = {
    free: {
        name: 'Plano Gratuito',
        modules: [
            MODULES.DASHBOARD,
            MODULES.PATIENTS, // Limitado
            MODULES.PRESCRIPTIONS, // Limitado
            MODULES.APPOINTMENTS // Limitado
        ],
        limitations: {
            [MODULES.PATIENTS]: { maxCount: 250 },
        }
    },
    monthly: {
        name: 'Plano Pro (Mensal)',
        modules: [
            MODULES.DASHBOARD,
            MODULES.PATIENTS,
            MODULES.PRESCRIPTIONS,
            MODULES.APPOINTMENTS,
            MODULES.METRICS,
            MODULES.FINANCIAL,
            MODULES.AI_ANALYSIS,
            MODULES.EXAM_PROCESSING
        ],
        limitations: {}
    },
    annual: {
        name: 'Plano Especialista (Anual)',
        modules: [
            MODULES.DASHBOARD,
            MODULES.PATIENTS,
            MODULES.PRESCRIPTIONS,
            MODULES.APPOINTMENTS,
            MODULES.METRICS,
            MODULES.FINANCIAL,
            MODULES.AI_ANALYSIS,
            MODULES.EXAM_PROCESSING,
            MODULES.BULK_OPERATIONS,
            MODULES.ADVANCED_REPORTS,
            MODULES.INTEGRATIONS
        ],
        limitations: {}
    },
    enterprise: {
        name: 'Plano Enterprise',
        modules: Object.values(MODULES), // Todos os módulos
        limitations: {}
    }
};

// Função para obter módulos por plano
export const getModulesByPlan = (planType) => {
    return PLAN_MODULES[planType]?.modules || [];
};

// Função para obter limitações por plano
export const getLimitationsByPlan = (planType) => {
    return PLAN_MODULES[planType]?.limitations || {};
};

// Função para verificar se um módulo requer outros módulos
export const getModuleDependencies = (moduleId) => {
    return MODULE_INFO[moduleId]?.dependencies || [];
};

// Função para validar se o usuário pode acessar um módulo baseado nas dependências
export const validateModuleAccess = (userModules, targetModule) => {
    if (!userModules.includes(targetModule)) {
        return false;
    }

    const dependencies = getModuleDependencies(targetModule);
    return dependencies.every(dep => userModules.includes(dep));
};

// Função para obter categorias de módulos
export const getModulesByCategory = (category) => {
    return Object.entries(MODULE_INFO)
        .filter(([_, info]) => info.category === category)
        .map(([moduleId, _]) => moduleId);
};

export default {
    MODULES,
    MODULE_INFO,
    PLAN_MODULES,
    getModulesByPlan,
    getLimitationsByPlan,
    getModuleDependencies,
    validateModuleAccess,
    getModulesByCategory
};