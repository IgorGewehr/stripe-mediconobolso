// components/hooks/useModuleLimitations.js - Versão sem limitações para usuários legacy

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authProvider';
import useModuleAccess from './useModuleAccess';
import firebaseService from '../../lib/firebaseService';
import { MODULES } from '../../lib/moduleConfig';

export const useModuleLimitations = (moduleId) => {
    const { user } = useAuth();
    const { isLegacyUser } = useModuleAccess();
    const [limitations, setLimitations] = useState(null);
    const [currentCounts, setCurrentCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para buscar contagens atuais
    const fetchCurrentCounts = useCallback(async () => {
        if (!user?.uid || !moduleId) return;

        try {
            setLoading(true);
            let count = 0;

            switch (moduleId) {
                case MODULES.PATIENTS:
                    const patients = await firebaseService.listPatients(user.uid);
                    count = patients.length;
                    break;

                case MODULES.PRESCRIPTIONS:
                    // Contar receitas do mês atual
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const prescriptions = await firebaseService.filterPrescriptions(user.uid, {
                        dateFrom: startOfMonth,
                        dateTo: now
                    });
                    count = prescriptions.length;
                    break;

                case MODULES.APPOINTMENTS:
                    // Contar consultas do mês atual
                    const consultations = await firebaseService.listAllConsultations(user.uid);
                    const thisMonthConsultations = consultations.filter(consultation => {
                        const consultDate = consultation.consultationDate instanceof Date
                            ? consultation.consultationDate
                            : new Date(consultation.consultationDate);
                        return consultDate.getMonth() === now.getMonth() &&
                            consultDate.getFullYear() === now.getFullYear();
                    });
                    count = thisMonthConsultations.length;
                    break;

                default:
                    count = 0;
            }

            setCurrentCounts(prev => ({ ...prev, [moduleId]: count }));

            // ✨ USUÁRIOS LEGACY NÃO TÊM LIMITAÇÕES
            if (isLegacyUser) {
                console.log('🔓 Usuário legacy - SEM verificação de limitações');
                setLimitations({
                    allowed: true,
                    remaining: Infinity,
                    limit: Infinity,
                    type: 'unlimited'
                });
            } else {
                // Verificar limitações para usuários com sistema de módulos
                const limitCheck = await firebaseService.checkModuleLimitations(user.uid, moduleId, count);
                setLimitations(limitCheck);
            }

        } catch (err) {
            console.error(`Erro ao buscar contagens para ${moduleId}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, moduleId, isLegacyUser]);

    // Buscar dados quando o componente monta ou usuário muda
    useEffect(() => {
        fetchCurrentCounts();
    }, [fetchCurrentCounts]);

    // Função para verificar se uma ação pode ser executada
    const canPerformAction = useCallback((actionType = 'create') => {
        // ✨ USUÁRIOS LEGACY PODEM TUDO
        if (isLegacyUser) {
            return {
                allowed: true,
                reason: 'legacy_user',
                currentCount: currentCounts[moduleId] || 0,
                limit: Infinity,
                remaining: Infinity,
                type: 'unlimited'
            };
        }

        if (!limitations) return { allowed: true };

        const currentCount = currentCounts[moduleId] || 0;

        if (actionType === 'create' && !limitations.allowed) {
            return {
                allowed: false,
                reason: 'limit_reached',
                currentCount,
                limit: limitations.limit,
                remaining: limitations.remaining,
                type: limitations.type
            };
        }

        return {
            allowed: true,
            currentCount,
            limit: limitations.limit,
            remaining: limitations.remaining,
            type: limitations.type
        };
    }, [limitations, currentCounts, moduleId, isLegacyUser]);

    // Função para atualizar contagem após uma ação
    const updateCount = useCallback(async (increment = 1) => {
        setCurrentCounts(prev => {
            const newCount = Math.max(0, (prev[moduleId] || 0) + increment);

            // ✨ NÃO re-verificar limitações para usuários legacy
            if (!isLegacyUser && user?.uid) {
                firebaseService.checkModuleLimitations(user.uid, moduleId, newCount)
                    .then(setLimitations)
                    .catch(console.error);
            }

            return { ...prev, [moduleId]: newCount };
        });
    }, [moduleId, user?.uid, isLegacyUser]);

    // Função para refazer a contagem (útil após operações em lote)
    const refreshCounts = useCallback(() => {
        fetchCurrentCounts();
    }, [fetchCurrentCounts]);

    // Calcular porcentagem de uso
    const usagePercentage = limitations?.limit && limitations.limit !== Infinity
        ? Math.min(((currentCounts[moduleId] || 0) / limitations.limit) * 100, 100)
        : 0;

    // Verificar se está próximo do limite (>80%) - MAS NÃO para usuários legacy
    const nearLimit = !isLegacyUser && usagePercentage > 80;

    // Verificar se atingiu o limite - MAS NÃO para usuários legacy
    const atLimit = !isLegacyUser && limitations?.allowed === false;

    return {
        // Estados
        loading,
        error,
        limitations,
        currentCount: currentCounts[moduleId] || 0,
        usagePercentage,
        nearLimit,
        atLimit,

        // ✨ NOVO: Indicador de usuário legacy
        isLegacyUser,

        // Funções
        canPerformAction,
        updateCount,
        refreshCounts,

        // Informações úteis
        limit: limitations?.limit,
        remaining: limitations?.remaining,
        limitType: limitations?.type
    };
};

// Hook específico para pacientes
export const usePatientLimitations = () => {
    return useModuleLimitations(MODULES.PATIENTS);
};

// Hook específico para receitas
export const usePrescriptionLimitations = () => {
    return useModuleLimitations(MODULES.PRESCRIPTIONS);
};

// Hook específico para consultas
export const useAppointmentLimitations = () => {
    return useModuleLimitations(MODULES.APPOINTMENTS);
};

// Hook para verificar múltiplos módulos
export const useMultipleModuleLimitations = (moduleIds = []) => {
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { isLegacyUser } = useModuleAccess();

    useEffect(() => {
        const fetchAllLimitations = async () => {
            if (!user?.uid || moduleIds.length === 0) return;

            setLoading(true);
            const newResults = {};

            // ✨ USUÁRIOS LEGACY: SEM LIMITAÇÕES
            if (isLegacyUser) {
                console.log('🔓 Usuário legacy - Configurando TODAS as limitações como ilimitadas');

                for (const moduleId of moduleIds) {
                    newResults[moduleId] = {
                        allowed: true,
                        remaining: Infinity,
                        limit: Infinity,
                        type: 'unlimited',
                        currentCount: 0,
                        usagePercentage: 0
                    };
                }

                setResults(newResults);
                setLoading(false);
                return;
            }

            // Para usuários com sistema de módulos
            for (const moduleId of moduleIds) {
                try {
                    let currentCount = 0;

                    // Buscar contagem atual para cada módulo
                    switch (moduleId) {
                        case MODULES.PATIENTS:
                            const patients = await firebaseService.listPatients(user.uid);
                            currentCount = patients.length;
                            break;
                        case MODULES.PRESCRIPTIONS:
                            const now = new Date();
                            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                            const prescriptions = await firebaseService.filterPrescriptions(user.uid, {
                                dateFrom: startOfMonth,
                                dateTo: now
                            });
                            currentCount = prescriptions.length;
                            break;
                        // Adicione outros módulos conforme necessário
                    }

                    const limitCheck = await firebaseService.checkModuleLimitations(user.uid, moduleId, currentCount);

                    newResults[moduleId] = {
                        ...limitCheck,
                        currentCount,
                        usagePercentage: limitCheck.limit
                            ? Math.min((currentCount / limitCheck.limit) * 100, 100)
                            : 0
                    };
                } catch (error) {
                    console.error(`Erro ao verificar limitações para ${moduleId}:`, error);
                    newResults[moduleId] = { error: error.message };
                }
            }

            setResults(newResults);
            setLoading(false);
        };

        fetchAllLimitations();
    }, [user?.uid, moduleIds, isLegacyUser]);

    return {
        results,
        loading,
        isLegacyUser,
        getLimitationInfo: (moduleId) => results[moduleId] || null,
        hasAnyLimitations: !isLegacyUser && Object.values(results).some(result => !result.allowed),
        getOverallUsage: () => {
            if (isLegacyUser) return 0; // Usuários legacy não têm uso limitado

            const validResults = Object.values(results).filter(result => !result.error && result.limit);
            if (validResults.length === 0) return 0;

            const totalUsage = validResults.reduce((sum, result) => sum + result.usagePercentage, 0);
            return totalUsage / validResults.length;
        }
    };
};

export default useModuleLimitations;