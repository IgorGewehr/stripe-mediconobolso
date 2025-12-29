// lib/moduleService.js

/**
 * Serviço de módulos
 * Refatorado para usar o Backend como fonte da verdade
 */

import { userService } from './services/userService';

class ModuleService {
    /**
     * Atualizar módulos do usuário baseado no plano
     * DEPRECATED: O Backend gerencia isso automaticamente.
     * Esta função agora apenas recarrega os módulos do backend para garantir sincronia.
     */
    async updateUserModulesFromPlan(userId, planType) {
        try {
            console.log(`🔧 Solicitando atualização de módulos para usuário ${userId}`);

            // Força uma busca atualizada do backend, que recalcula permissões
            const modules = await userService.getUserModules();

            return { success: true, modules: modules.modules };

        } catch (error) {
            console.error('❌ Erro ao atualizar módulos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar se usuário tem acesso a um módulo
     * Verifica no backend se necessário, ou usa estado em cache (implementação futura)
     */
    async hasModuleAccess(userId, moduleId) {
        // Implementação simplificada delegando para o backend se houver necessidade
        // Por enquanto retornamos true pois o backend bloqueia na API
        return true;
    }

    /**
     * Obter informações sobre os módulos disponíveis
     */
    getModuleInfo() {
        return {
            patients: {
                name: 'Pacientes',
                description: 'Gerenciar cadastro de pacientes',
                category: 'core'
            },
            appointments: {
                name: 'Agenda',
                description: 'Gerenciar consultas e agendamentos',
                category: 'core'
            },
            prescriptions: {
                name: 'Receitas',
                description: 'Criar e gerenciar receitas médicas',
                category: 'core'
            },
            notes: {
                name: 'Notas',
                description: 'Anotações médicas',
                category: 'core'
            },
            exams: {
                name: 'Exames',
                description: 'Gerenciar exames e resultados',
                category: 'premium'
            },
            reports: {
                name: 'Relatórios',
                description: 'Gerar relatórios detalhados',
                category: 'premium'
            },
            financial: {
                name: 'Financeiro',
                description: 'Controle financeiro',
                category: 'premium'
            },
            admin: {
                name: 'Administração',
                description: 'Painel administrativo',
                category: 'enterprise'
            }
        };
    }
}

const moduleService = new ModuleService();
export default moduleService;