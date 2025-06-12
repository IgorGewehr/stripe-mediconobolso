// lib/modules/moduleService.js

import firebaseService from './firebaseService';
import {
    MODULES,
    getModulesByPlan,
    getLimitationsByPlan,
    MODULE_INFO
} from './moduleConfig';

/**
 * Serviço para gerenciar módulos de usuários
 * Integra com Firebase e fornece métodos para atualizar permissões
 */
class ModuleService {

    /**
     * Atualizar módulos de um usuário baseado no plano
     */
    async updateUserModulesFromPlan(userId, planType) {
        try {
            const modules = getModulesByPlan(planType);
            const limitations = getLimitationsByPlan(planType);

            const updateData = {
                planType: planType,
                modules: modules,
                limitations: limitations,
                lastModulesUpdate: new Date(),
                // Manter customizações se existirem
                ...(planType !== 'free' && {
                    customModules: null, // Limpar customizações ao mudar de plano pago
                    customLimitations: null
                })
            };

            await firebaseService.editUserData(userId, updateData);

            console.log(`✅ Módulos atualizados para usuário ${userId} - Plano: ${planType}`);
            return { success: true, modules, limitations };
        } catch (error) {
            console.error('❌ Erro ao atualizar módulos do usuário:', error);
            throw error;
        }
    }

    /**
     * Definir módulos customizados para um usuário específico
     */
    async setCustomModules(userId, customModules, customLimitations = null) {
        try {
            // Validar módulos
            const validModules = customModules.filter(moduleId =>
                Object.values(MODULES).includes(moduleId)
            );

            const updateData = {
                customModules: validModules,
                customLimitations: customLimitations || {},
                lastModulesUpdate: new Date(),
                moduleCustomization: true
            };

            await firebaseService.editUserData(userId, updateData);

            console.log(`✅ Módulos customizados definidos para usuário ${userId}`);
            return { success: true, modules: validModules };
        } catch (error) {
            console.error('❌ Erro ao definir módulos customizados:', error);
            throw error;
        }
    }

    /**
     * Adicionar módulo específico a um usuário
     */
    async addModuleToUser(userId, moduleId) {
        try {
            // Buscar dados atuais do usuário
            const userData = await firebaseService.getUserData(userId);

            // Determinar módulos atuais
            let currentModules = userData.customModules || userData.modules || [];

            // Se não tem customização, basear no plano
            if (!userData.customModules && userData.planType) {
                currentModules = getModulesByPlan(userData.planType);
            }

            // Adicionar novo módulo se não existir
            if (!currentModules.includes(moduleId)) {
                const updatedModules = [...currentModules, moduleId];

                const updateData = {
                    customModules: updatedModules,
                    moduleCustomization: true,
                    lastModulesUpdate: new Date()
                };

                await firebaseService.editUserData(userId, updateData);

                console.log(`✅ Módulo ${moduleId} adicionado ao usuário ${userId}`);
                return { success: true, modules: updatedModules };
            }

            return { success: true, modules: currentModules, message: 'Módulo já existe' };
        } catch (error) {
            console.error('❌ Erro ao adicionar módulo:', error);
            throw error;
        }
    }

    /**
     * Remover módulo específico de um usuário
     */
    async removeModuleFromUser(userId, moduleId) {
        try {
            const userData = await firebaseService.getUserData(userId);

            let currentModules = userData.customModules || userData.modules || [];

            if (!userData.customModules && userData.planType) {
                currentModules = getModulesByPlan(userData.planType);
            }

            // Remover módulo
            const updatedModules = currentModules.filter(module => module !== moduleId);

            const updateData = {
                customModules: updatedModules,
                moduleCustomization: true,
                lastModulesUpdate: new Date()
            };

            await firebaseService.editUserData(userId, updateData);

            console.log(`✅ Módulo ${moduleId} removido do usuário ${userId}`);
            return { success: true, modules: updatedModules };
        } catch (error) {
            console.error('❌ Erro ao remover módulo:', error);
            throw error;
        }
    }

    /**
     * Resetar para módulos padrão do plano
     */
    async resetToDefaultModules(userId) {
        try {
            const userData = await firebaseService.getUserData(userId);
            const planType = userData.planType || 'free';

            const defaultModules = getModulesByPlan(planType);
            const defaultLimitations = getLimitationsByPlan(planType);

            const updateData = {
                modules: defaultModules,
                limitations: defaultLimitations,
                customModules: null,
                customLimitations: null,
                moduleCustomization: false,
                lastModulesUpdate: new Date()
            };

            await firebaseService.editUserData(userId, updateData);

            console.log(`✅ Módulos resetados para padrão do plano ${planType} - Usuário ${userId}`);
            return { success: true, modules: defaultModules };
        } catch (error) {
            console.error('❌ Erro ao resetar módulos:', error);
            throw error;
        }
    }

    /**
     * Obter informações completas dos módulos de um usuário
     */
    async getUserModuleInfo(userId) {
        try {
            const userData = await firebaseService.getUserData(userId);

            // Determinar módulos ativos
            let activeModules = [];
            let limitations = {};
            let isCustomized = false;

            if (userData.customModules) {
                activeModules = userData.customModules;
                limitations = userData.customLimitations || {};
                isCustomized = true;
            } else if (userData.modules) {
                activeModules = userData.modules;
                limitations = userData.limitations || {};
            } else {
                // Determinar baseado no plano
                const planType = userData.planType || (userData.gratuito ? 'free' : 'monthly');
                activeModules = getModulesByPlan(planType);
                limitations = getLimitationsByPlan(planType);
            }

            // Enriquecer com informações dos módulos
            const moduleDetails = activeModules.map(moduleId => ({
                id: moduleId,
                ...MODULE_INFO[moduleId],
                hasAccess: true,
                limitations: limitations[moduleId] || null
            }));

            return {
                success: true,
                activeModules,
                moduleDetails,
                limitations,
                isCustomized,
                planType: userData.planType || 'free',
                lastUpdate: userData.lastModulesUpdate
            };
        } catch (error) {
            console.error('❌ Erro ao obter informações dos módulos:', error);
            throw error;
        }
    }

    /**
     * Migrar usuários existentes para o novo sistema de módulos
     */
    async migrateExistingUsers() {
        try {
            console.log('🔄 Iniciando migração de usuários para sistema de módulos...');

            // Esta função seria executada uma vez para migrar usuários existentes
            // Por segurança, deve ser executada manualmente ou com confirmação

            // Implementação para buscar usuários em lotes e atualizar
            let lastUser = null;
            let migratedCount = 0;

            while (true) {
                const users = await firebaseService.listAllUsers(50, lastUser);

                if (users.length === 0) break;

                for (const user of users) {
                    try {
                        // Determinar plano do usuário
                        let planType = 'free';

                        if (user.assinouPlano === true) {
                            planType = user.planType || 'monthly';
                        } else if (user.gratuito === true) {
                            planType = 'free';
                        }

                        // Atualizar apenas se não tem módulos definidos
                        if (!user.modules && !user.customModules) {
                            await this.updateUserModulesFromPlan(user.id, planType);
                            migratedCount++;
                            console.log(`✅ Usuário migrado: ${user.email} - Plano: ${planType}`);
                        }
                    } catch (userError) {
                        console.error(`❌ Erro ao migrar usuário ${user.email}:`, userError);
                    }
                }

                lastUser = users[users.length - 1];
            }

            console.log(`✅ Migração concluída. ${migratedCount} usuários migrados.`);
            return { success: true, migratedCount };
        } catch (error) {
            console.error('❌ Erro na migração:', error);
            throw error;
        }
    }

    /**
     * Aplicar módulos em lote para múltiplos usuários
     */
    async bulkUpdateModules(userIds, modules, limitations = {}) {
        try {
            const results = [];

            for (const userId of userIds) {
                try {
                    await this.setCustomModules(userId, modules, limitations);
                    results.push({ userId, success: true });
                } catch (error) {
                    console.error(`❌ Erro ao atualizar usuário ${userId}:`, error);
                    results.push({ userId, success: false, error: error.message });
                }
            }

            const successCount = results.filter(r => r.success).length;
            console.log(`✅ Atualização em lote concluída: ${successCount}/${userIds.length} usuários`);

            return { success: true, results, successCount };
        } catch (error) {
            console.error('❌ Erro na atualização em lote:', error);
            throw error;
        }
    }
}

// Instância singleton
const moduleService = new ModuleService();

export default moduleService;

// Exports nomeados para conveniência
export const {
    updateUserModulesFromPlan,
    setCustomModules,
    addModuleToUser,
    removeModuleFromUser,
    resetToDefaultModules,
    getUserModuleInfo,
    migrateExistingUsers,
    bulkUpdateModules
} = moduleService;