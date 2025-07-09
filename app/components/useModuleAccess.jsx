// hooks/useModuleAccess.jsx

import { useAuth } from './authProvider';

/**
 * Hook para verificar acesso a módulos baseado no sistema de secretárias
 * Este hook integra com o authProvider que já tem a lógica de permissões
 */
const useModuleAccess = () => {
    const { 
        user, 
        isSecretary, 
        permissions, 
        hasModulePermission, 
        canViewSensitiveData 
    } = useAuth();

    // Configuração dos módulos - deve estar sincronizada com protectedRoutes.jsx
    const MODULES = {
        patients: {
            name: 'Pacientes',
            description: 'Gerenciar informações dos pacientes',
            actions: ['read', 'write', 'viewDetails']
        },
        appointments: {
            name: 'Agenda',
            description: 'Gerenciar consultas e agendamentos',
            actions: ['read', 'write']
        },
        prescriptions: {
            name: 'Receitas',
            description: 'Visualizar e gerenciar receitas médicas',
            actions: ['read', 'write']
        },
        exams: {
            name: 'Exames',
            description: 'Gerenciar exames e resultados',
            actions: ['read', 'write']
        },
        notes: {
            name: 'Notas',
            description: 'Acessar anotações médicas',
            actions: ['read', 'write']
        },
        financial: {
            name: 'Financeiro',
            description: 'Acessar informações financeiras',
            actions: ['read', 'write']
        },
        reports: {
            name: 'Relatórios',
            description: 'Gerar e visualizar relatórios',
            actions: ['read', 'write']
        },
        anamnesis: {
            name: 'Anamnese',
            description: 'Acessar fichas de anamnese',
            actions: ['read', 'write', 'viewDetails']
        },
        medical_records: {
            name: 'Prontuários',
            description: 'Acessar prontuários médicos',
            actions: ['read', 'write', 'viewDetails']
        }
    };

    /**
     * Verificar se tem acesso a um módulo específico
     */
    const hasAccess = (moduleId) => {
        // Se não há usuário logado, negar acesso
        if (!user) return false;
        
        // Se é médico, sempre tem acesso total
        if (!isSecretary) return true;
        
        // Se é secretária, usar o sistema de permissões do authProvider
        return hasModulePermission(moduleId, 'read');
    };

    /**
     * Verificar se pode realizar uma ação específica em um módulo
     */
    const canPerformAction = (moduleId, action, context = {}) => {
        // Se não há usuário logado, negar acesso
        if (!user) {
            return { allowed: false, reason: 'not_authenticated' };
        }
        
        // Se é médico, sempre pode realizar qualquer ação
        if (!isSecretary) {
            return { allowed: true };
        }
        
        // Se é secretária, verificar permissões específicas
        const hasBasicAccess = hasModulePermission(moduleId, action);
        
        if (!hasBasicAccess) {
            return { allowed: false, reason: 'insufficient_permissions' };
        }
        
        // Para ações sensíveis, verificar permissões especiais
        if (action === 'viewDetails' || action === 'viewSensitive') {
            const canViewSensitive = canViewSensitiveData(moduleId);
            if (!canViewSensitive) {
                return { allowed: false, reason: 'sensitive_data_restricted' };
            }
        }
        
        return { allowed: true };
    };

    /**
     * Obter informações sobre limites (placeholder para compatibilidade)
     */
    const getLimitInfo = (moduleId) => {
        // Este sistema não usa limites baseados em contagem, mas sim em permissões
        // Retorna dados compatíveis com a interface existente
        return {
            limit: null,
            type: 'permission',
            current: 0,
            hasLimit: false
        };
    };

    /**
     * Verificar múltiplos módulos
     */
    const hasMultipleAccess = (moduleIds, requireAll = false) => {
        if (!Array.isArray(moduleIds)) return false;
        
        if (requireAll) {
            return moduleIds.every(moduleId => hasAccess(moduleId));
        } else {
            return moduleIds.some(moduleId => hasAccess(moduleId));
        }
    };

    /**
     * Obter informações sobre o usuário atual para contexto
     */
    const getUserContext = () => {
        return {
            userId: user?.uid,
            isSecretary,
            permissions,
            workingDoctorId: user?.workingDoctorId,
            secretaryData: user?.secretaryData
        };
    };

    return {
        hasAccess,
        canPerformAction,
        getLimitInfo,
        hasMultipleAccess,
        getUserContext,
        MODULES,
        // Estados do usuário
        isSecretary,
        permissions,
        user
    };
};

export default useModuleAccess;