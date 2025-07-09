// lib/moduleService.js

/**
 * Serviço de módulos para compatibilidade com o sistema existente
 * Este serviço é usado pelo authProvider para migração de usuários
 */

import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

class ModuleService {
    /**
     * Atualizar módulos do usuário baseado no plano
     * Esta função é chamada pelo authProvider para migração
     */
    async updateUserModulesFromPlan(userId, planType) {
        try {
            console.log(`🔧 Atualizando módulos para usuário ${userId} com plano ${planType}`);

            // Definir módulos baseados no plano
            let modules = {};
            
            switch (planType) {
                case 'free':
                    modules = {
                        patients: { read: true, write: true, limit: 50 },
                        appointments: { read: true, write: true },
                        prescriptions: { read: true, write: true },
                        notes: { read: true, write: true }
                    };
                    break;
                    
                case 'monthly':
                    modules = {
                        patients: { read: true, write: true, limit: 200 },
                        appointments: { read: true, write: true },
                        prescriptions: { read: true, write: true },
                        notes: { read: true, write: true },
                        exams: { read: true, write: true },
                        reports: { read: true, write: true }
                    };
                    break;
                    
                case 'annual':
                    modules = {
                        patients: { read: true, write: true, limit: 1000 },
                        appointments: { read: true, write: true },
                        prescriptions: { read: true, write: true },
                        notes: { read: true, write: true },
                        exams: { read: true, write: true },
                        reports: { read: true, write: true },
                        financial: { read: true, write: true }
                    };
                    break;
                    
                case 'enterprise':
                default:
                    modules = {
                        patients: { read: true, write: true, limit: -1 },
                        appointments: { read: true, write: true },
                        prescriptions: { read: true, write: true },
                        notes: { read: true, write: true },
                        exams: { read: true, write: true },
                        reports: { read: true, write: true },
                        financial: { read: true, write: true },
                        admin: { read: true, write: true }
                    };
                    break;
            }

            // Atualizar no Firestore
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
                modules: modules,
                planType: planType,
                updatedAt: new Date()
            });

            console.log(`✅ Módulos atualizados para plano ${planType}`);
            return { success: true, modules };

        } catch (error) {
            console.error('❌ Erro ao atualizar módulos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar se usuário tem acesso a um módulo
     */
    async hasModuleAccess(userId, moduleId) {
        try {
            // Esta função seria implementada se necessário
            // Por enquanto, retorna true para compatibilidade
            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar acesso ao módulo:', error);
            return false;
        }
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