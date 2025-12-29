/**
 * Auth API Service
 *
 * Serviço para endpoints de autenticação no doctor-server
 */

import apiService from './apiService';

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
    try {
      console.log('📤 Provisionando usuário no backend...');

      const response = await apiService.post('/account/provision', {
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf || null,
        phone: userData.phone || null,
        address: userData.address || null,
        plan_type: userData.plan_type || 'free',
      });

      console.log('✅ Usuário provisionado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao provisionar usuário:', error);
      // Não lançar erro aqui para não quebrar o fluxo de cadastro
      // O usuário ainda está autenticado no Firebase
      return null;
    }
  }

  /**
   * Obtém os dados do usuário autenticado
   * @returns {Promise<Object>} Dados do usuário
   */
  async me() {
    return apiService.get('/account/me');
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
