// components/hooks/useModuleAccess.js - Versão com proteção para usuários legacy

import { useMemo } from 'react';
import { useAuth } from './authProvider';
import {
    MODULES,
    getModulesByPlan,
    validateModuleAccess,
    getLimitationsByPlan,
    MODULE_INFO
} from '../../lib/moduleConfig';

/**
 * Hook personalizado para gerenciar acesso a módulos
 * ✨ PROTEÇÃO ESPECIAL: Usuários antigos (sem sistema de módulos) têm acesso total
 */
export const useModuleAccess = () => {
    const { user } = useAuth();

    // ✨ DETECTAR USUÁRIOS LEGACY (antigos, sem sistema de módulos)
    const isLegacyUser = useMemo(() => {
        if (!user) return false;

        // Se é administrador, não é legacy (admin sempre tem controle total)
        if (user.administrador === true) return false;

        // ✨ CRITÉRIOS PARA USUÁRIO LEGACY:
        // 1. Não tem campo 'modules' E não tem 'customModules'
        // 2. Não tem campo 'planType'
        // 3. Mas TEM 'assinouPlano' ou 'gratuito' (campos antigos)
        const hasOldFields = user.hasOwnProperty('assinouPlano');            // só quem já assinou plano era “antigo”
        const hasNewFields = user.hasOwnProperty('modules')
            || user.hasOwnProperty('customModules')
            || user.hasOwnProperty('planType');
        const isLegacy = hasOldFields && !hasNewFields;

        if (isLegacy) {
            console.log('👴 Usuário LEGACY detectado - Acesso total liberado:', user.email);
        }

        return isLegacy;
    }, [user]);

    // Determinar módulos disponíveis para o usuário
    const userModules = useMemo(() => {
        if (!user) return [];

        // ✨ USUÁRIOS LEGACY TÊM ACESSO TOTAL
        if (isLegacyUser) {
            console.log('🔓 Usuário legacy - Liberando TODOS os módulos');
            return Object.values(MODULES);
        }

        // Se for administrador, tem acesso a tudo
        if (user.administrador === true) {
            return Object.values(MODULES);
        }

        // Módulos customizados para o usuário específico (prioritário)
        if (user.customModules && Array.isArray(user.customModules)) {
            return user.customModules;
        }

        // Módulos baseados no plano
        let planType = 'free'; // Padrão

        if (user.assinouPlano === true) {
            // Verificar tipo de plano baseado no planType ou subscriptionId
            planType = user.planType || 'monthly';
        } else if (user.gratuito === true) {
            planType = 'free';
        }

        return getModulesByPlan(planType);
    }, [user, isLegacyUser]);

    // Limitações do usuário
    const userLimitations = useMemo(() => {
        if (!user) return {};

        // ✨ USUÁRIOS LEGACY NÃO TÊM LIMITAÇÕES
        if (isLegacyUser) {
            console.log('🔓 Usuário legacy - SEM limitações');
            return {}; // Sem limitações
        }

        // Limitações customizadas (prioritário)
        if (user.customLimitations && typeof user.customLimitations === 'object') {
            return user.customLimitations;
        }

        // Limitações baseadas no plano
        let planType = 'free';

        if (user.assinouPlano === true) {
            planType = user.planType || 'monthly';
        } else if (user.gratuito === true) {
            planType = 'free';
        }

        return getLimitationsByPlan(planType);
    }, [user, isLegacyUser]);

    // Função para verificar acesso a um módulo
    // Função para verificar acesso a um módulo
    const hasAccess = (moduleId) => {
        if (!user || !moduleId) return false;

        // ✅ USUÁRIOS LEGACY TÊM ACESSO TOTAL
        if (isLegacyUser) return true;

        // Administradores têm acesso total
        if (user.administrador === true) return true;

        // ✅ NOVA LÓGICA: Só bloqueia se explicitamente negado
        // Para módulos de IA, verificar especificamente
        if (moduleId === MODULES.AI_ANALYSIS || moduleId === MODULES.EXAM_PROCESSING) {
            // Se o campo não existe, permitir acesso (usuários sem sistema de módulos)
            if (!user.hasOwnProperty('modules') && !user.hasOwnProperty('customModules')) {
                return true;
            }

            // Se existe sistema de módulos, verificar se está incluído
            return validateModuleAccess(userModules, moduleId);
        }

        // Para outros módulos, usar validação normal
        return validateModuleAccess(userModules, moduleId);
    };

    // Função para verificar se chegou no limite de um recurso
    const isLimitReached = (moduleId, currentCount = 0) => {
        // ✨ USUÁRIOS LEGACY NÃO TÊM LIMITES
        if (isLegacyUser) return false;

        const limitation = userLimitations[moduleId];
        if (!limitation) return false;

        // Verificar diferentes tipos de limitação
        if (limitation.maxCount && currentCount >= limitation.maxCount) {
            return true;
        }

        // Adicionar outras verificações de limite conforme necessário
        return false;
    };

    // Função para obter informações sobre limitações
    const getLimitInfo = (moduleId) => {
        // ✨ USUÁRIOS LEGACY NÃO TÊM LIMITES
        if (isLegacyUser) return null;

        const limitation = userLimitations[moduleId];
        if (!limitation) return null;

        return {
            type: limitation.maxCount ? 'count' :
                limitation.maxPerMonth ? 'monthly' :
                    limitation.maxPerDay ? 'daily' : 'unknown',
            limit: limitation.maxCount || limitation.maxPerMonth || limitation.maxPerDay,
            module: moduleId,
            moduleInfo: MODULE_INFO[moduleId]
        };
    };

    // Função para verificar se pode executar uma ação específica
    const canPerformAction = (moduleId, action, context = {}) => {
        // ✨ USUÁRIOS LEGACY PODEM TUDO
        if (isLegacyUser) {
            return {
                allowed: true,
                reason: 'legacy_user'
            };
        }

        // Verificar acesso básico ao módulo
        if (!hasAccess(moduleId)) {
            return {
                allowed: false,
                reason: 'module_access_denied',
                module: moduleId
            };
        }

        // Verificar limitações específicas
        const limitInfo = getLimitInfo(moduleId);
        if (limitInfo && context.currentCount) {
            if (isLimitReached(moduleId, context.currentCount)) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    limit: limitInfo
                };
            }
        }

        return {
            allowed: true,
            reason: null
        };
    };

    // Função para obter todos os módulos permitidos organizados por categoria
    const getModulesByCategory = () => {
        const categories = {
            essential: [],
            advanced: [],
            premium: [],
            enterprise: [],
            admin: []
        };

        userModules.forEach(moduleId => {
            const moduleInfo = MODULE_INFO[moduleId];
            if (moduleInfo && categories[moduleInfo.category]) {
                categories[moduleInfo.category].push({
                    id: moduleId,
                    ...moduleInfo,
                    hasAccess: true
                });
            }
        });

        return categories;
    };

    // Função para obter lista de módulos indisponíveis (para mostrar upgrade)
    const getUnavailableModules = () => {
        // ✨ USUÁRIOS LEGACY NÃO PRECISAM DE UPGRADE
        if (isLegacyUser) return [];

        const allModules = Object.values(MODULES);
        return allModules
            .filter(moduleId => !userModules.includes(moduleId))
            .map(moduleId => ({
                id: moduleId,
                ...MODULE_INFO[moduleId],
                hasAccess: false
            }));
    };

    return {
        // Estados
        userModules,
        userLimitations,

        // ✨ NOVO: Indicador de usuário legacy
        isLegacyUser,

        // Funções de verificação
        hasAccess,
        isLimitReached,
        canPerformAction,

        // Funções de informação
        getLimitInfo,
        getModulesByCategory,
        getUnavailableModules,

        // Dados do usuário
        isAdmin: user?.administrador === true,
        planType: user?.planType || (user?.gratuito ? 'free' : 'unknown'),

        // Constantes úteis
        MODULES
    };
};

export default useModuleAccess;