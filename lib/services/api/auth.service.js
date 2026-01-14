/**
 * Auth API Service
 *
 * Serviço para endpoints de autenticação no doctor-server
 */

import apiService from './apiService';

/**
 * Normaliza dados do usuário do backend (snake_case) para frontend (camelCase)
 * @param {Object} user - Dados do usuário do backend
 * @returns {Object} Dados normalizados
 */
function normalizeUserData(user) {
  if (!user) return null;

  return {
    // IDs
    id: user.id,
    uid: user.firebase_uid || user.uid || user.id,

    // Dados básicos
    fullName: user.full_name || user.fullName || user.name || '',
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    email: user.email || '',
    phone: user.phone || user.telefone || '',
    cpf: user.cpf || '',
    photoURL: user.photo_url || user.photoURL || user.avatar_url || '',

    // Dados profissionais
    crm: user.crm || '',
    especialidade: user.specialty || user.especialidade || '',
    clinicName: user.clinic_name || user.clinicName || '',

    // Endereço
    address: user.address || {
      street: user.street || '',
      number: user.number || '',
      complement: user.complement || '',
      neighborhood: user.neighborhood || user.bairro || '',
      city: user.city || '',
      state: user.state || '',
      cep: user.zip_code || user.zipCode || user.cep || '',
    },

    // Status e plano
    administrador: user.is_admin || user.administrador || false,
    assinouPlano: user.has_plan || user.assinou_plano || user.assinouPlano || false,
    planType: user.plan_type || user.planType || 'free',
    gratuito: user.gratuito ?? (!user.has_plan && !user.assinou_plano),

    // Módulos e permissões
    modules: user.modules || {},
    customModules: user.custom_modules || user.customModules || {},
    limitations: user.limitations || {},

    // Auth info
    authProvider: user.auth_provider || user.authProvider || 'email',
    emailVerified: user.email_verified || user.emailVerified || false,

    // Atividade
    isCurrentlyOnline: user.is_currently_online || user.isCurrentlyOnline || false,
    lastLogin: user.last_login || user.lastLogin || user.last_login_at || null,

    // Timestamps
    createdAt: user.created_at || user.createdAt || null,
    updatedAt: user.updated_at || user.updatedAt || null,

    // Manter referência aos dados originais
    _raw: user
  };
}

/**
 * Serviço de autenticação com o backend Rust
 */
class AuthApiService {
  /**
   * Provisiona usuário Firebase no PostgreSQL
   * Chamado após criar usuário no Firebase Auth
   *
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.name - Nome completo
   * @param {string} userData.email - Email
   * @param {string} [userData.cpf] - CPF (opcional)
   * @param {string} [userData.phone] - Telefone (opcional)
   * @param {Object} [userData.address] - Endereço (opcional)
   * @param {string} [userData.plan_type] - Tipo de plano (free, monthly, annual, etc)
   * @returns {Promise<Object>} Dados do usuário provisionado
   */
  async provision(userData) {
    console.log('📤 Provisionando usuário no backend...');
    console.log('📦 Dados para provisão:', JSON.stringify(userData, null, 2));

    // Lançar erro se a provisão falhar para que o authProvider possa tratar
    const response = await apiService.post('/account/provision', {
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf || null,
      phone: userData.phone || null,
      address: userData.address || null,
      plan_type: userData.plan_type || 'free',
    });

    console.log('✅ Usuário provisionado com sucesso:', response);
    return normalizeUserData(response);
  }

  /**
   * Obtém os dados do usuário autenticado
   * @returns {Promise<Object>} Dados do usuário normalizados
   */
  async me() {
    const response = await apiService.get('/account/me');
    return normalizeUserData(response);
  }

  /**
   * Faz logout (invalida sessões no backend)
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiService.post('/account/logout');
    } catch (error) {
      console.error('Erro ao fazer logout no backend:', error);
      // Continua mesmo se o backend falhar
    }
  }
}

const authApiService = new AuthApiService();
export default authApiService;
