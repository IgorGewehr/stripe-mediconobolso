/**
 * Admin Service - API Layer
 *
 * Serviço para operações administrativas via doctor-server.
 * Substitui o antigo adminService do Firebase.
 */

import apiService from './apiService';

class AdminService {
  constructor() {
    this.endpoint = '/admin';
  }

  // ==========================================
  // REPORTS/TICKETS
  // ==========================================

  /**
   * Lista todos os reports (admin only)
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Object>} Lista paginada de reports
   */
  async listReports(options = {}) {
    const {
      page = 1,
      perPage = 20,
      status,
      reportType,
      priority
    } = options;

    const params = {
      page,
      per_page: perPage,
    };

    if (status) params.status = status;
    if (reportType) params.report_type = reportType;
    if (priority) params.priority = priority;

    return apiService.get(`${this.endpoint}/reports`, params);
  }

  /**
   * Lista reports do usuário atual
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de reports do usuário
   */
  async listMyReports(options = {}) {
    const { page = 1, perPage = 20 } = options;

    return apiService.get(`${this.endpoint}/reports/my`, {
      page,
      per_page: perPage,
    });
  }

  /**
   * Obtém detalhes de um report
   * @param {string} reportId - ID do report
   * @returns {Promise<Object>} Report com respostas
   */
  async getReport(reportId) {
    return apiService.get(`${this.endpoint}/reports/${reportId}`);
  }

  /**
   * Cria um novo report
   * @param {Object} reportData - Dados do report
   * @returns {Promise<Object>} Report criado
   */
  async createReport(reportData) {
    const { subject, content, type = 'support', priority = 'medium' } = reportData;

    return apiService.post(`${this.endpoint}/reports`, {
      subject,
      content,
      report_type: type,
      priority,
    });
  }

  /**
   * Atualiza status do report
   * @param {string} reportId - ID do report
   * @param {string} status - Novo status ('new', 'in_progress', 'resolved', 'closed')
   * @returns {Promise<Object>} Report atualizado
   */
  async updateReportStatus(reportId, status) {
    return apiService.put(`${this.endpoint}/reports/${reportId}/status`, {
      status,
    });
  }

  /**
   * Adiciona resposta a um report
   * @param {string} reportId - ID do report
   * @param {string} content - Conteúdo da resposta
   * @returns {Promise<Object>} Resposta criada
   */
  async addReportResponse(reportId, content) {
    return apiService.post(`${this.endpoint}/reports/${reportId}/responses`, {
      content,
    });
  }

  /**
   * Marca report como lido pelo usuário
   * @param {string} reportId - ID do report
   * @returns {Promise<Object>} Resultado
   */
  async markReportAsReadByUser(reportId) {
    return apiService.post(`${this.endpoint}/reports/${reportId}/read`);
  }

  /**
   * Marca report como lido pelo admin
   * @param {string} reportId - ID do report
   * @returns {Promise<Object>} Resultado
   */
  async markReportAsReadByAdmin(reportId) {
    return apiService.post(`${this.endpoint}/reports/${reportId}/read-admin`);
  }

  /**
   * Obtém estatísticas de reports
   * @returns {Promise<Object>} Estatísticas
   */
  async getReportStats() {
    return apiService.get(`${this.endpoint}/reports/stats`);
  }

  // ==========================================
  // PLATFORM STATISTICS
  // ==========================================

  /**
   * Obtém estatísticas da plataforma
   * @returns {Promise<Object>} Estatísticas da plataforma
   */
  async getPlatformStats() {
    return apiService.get(`${this.endpoint}/stats/platform`);
  }

  /**
   * Alias para compatibilidade com código existente
   */
  async getEnhancedPlatformStats() {
    return this.getPlatformStats();
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * Lista usuários com filtros e paginação
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Object>} Lista paginada de usuários
   */
  async listUsers(options = {}) {
    const {
      page = 1,
      perPage = 50,
      searchQuery,
      planFilter,
      statusFilter,
      sortBy = 'lastLogin',
      sortOrder = 'desc'
    } = options;

    const params = {
      page,
      per_page: perPage,
    };

    if (searchQuery) params.search = searchQuery;
    if (planFilter && planFilter !== 'all') params.plan = planFilter;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;

    return apiService.get(`${this.endpoint}/users`, params);
  }

  /**
   * Alias para compatibilidade com código existente
   */
  async getUsersWithPresenceData(options = {}) {
    const result = await this.listUsers(options);

    // Adapta o resultado para o formato esperado pelo código legado
    return {
      users: result.users || [],
      totalCount: result.total || 0,
      hasMore: result.has_more || false,
    };
  }

  /**
   * Alias para compatibilidade
   */
  async listAllUsers(pageSize = 100, lastUser = null, searchQuery = "") {
    const result = await this.listUsers({
      perPage: pageSize,
      searchQuery,
    });

    return result.users || [];
  }

  /**
   * Obtém detalhes de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  async getUser(userId) {
    return apiService.get(`${this.endpoint}/users/${userId}`);
  }

  /**
   * Obtém estatísticas detalhadas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Estatísticas do usuário
   */
  async getUserStats(userId) {
    return apiService.get(`${this.endpoint}/users/${userId}/stats`);
  }

  /**
   * Alias para compatibilidade com código existente
   */
  async getUserDetailedStats(userId) {
    return this.getUserStats(userId);
  }

  /**
   * Enriquece dados do usuário (compatibilidade)
   * O backend já retorna dados enriquecidos, então apenas repassa
   */
  async enrichUserData(user) {
    return user;
  }

  // ==========================================
  // ADMIN CHAT
  // ==========================================

  /**
   * Cria conversa admin-usuário
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem inicial
   * @returns {Promise<Object>} Conversa criada
   */
  async createAdminChat(userId, message) {
    return apiService.post(`${this.endpoint}/chat`, {
      user_id: userId,
      message,
    });
  }

  /**
   * Alias para compatibilidade
   */
  async createAdminUserConversation(userId, initialMessage, adminInfo) {
    const result = await this.createAdminChat(userId, initialMessage);
    return result.id;
  }

  /**
   * Envia mensagem como admin (usa o mesmo endpoint de responses)
   */
  async sendAdminMessage(conversationId, message, adminInfo) {
    return this.addReportResponse(conversationId, message);
  }

  /**
   * Obtém conversa admin-usuário
   */
  async getAdminUserConversation(userId) {
    const result = await this.listReports({
      reportType: 'admin_chat',
    });

    const conversations = (result.reports || []).filter(
      r => r.user_id === userId && r.report_type === 'admin_chat'
    );

    return conversations.length > 0 ? conversations[0] : null;
  }

  /**
   * Lista todas as conversas admin-usuário
   */
  async getAllAdminUserConversations(filters = {}) {
    const result = await this.listReports({
      ...filters,
      reportType: 'admin_chat',
    });

    return result.reports || [];
  }

  // ==========================================
  // COMPATIBILITY ALIASES (Legacy Firebase API)
  // ==========================================

  /**
   * Get user reports (compatibility)
   */
  async getUserReports(userId) {
    const result = await this.listMyReports();
    return result.reports || [];
  }

  /**
   * Get all reports (compatibility)
   */
  async getAllReports(filters = {}) {
    const result = await this.listReports(filters);
    return result.reports || [];
  }

  /**
   * Get reports stats (compatibility)
   */
  async getReportsStats() {
    return this.getReportStats();
  }

  /**
   * Update user admin status
   * Nota: Este endpoint pode precisar ser implementado no backend
   */
  async updateUserAdminStatus(userId, isAdmin) {
    // TODO: Implementar endpoint no backend quando necessário
    console.warn('[AdminService] updateUserAdminStatus not yet implemented in doctor-server');
    return true;
  }

  /**
   * Get all users messages (compatibility)
   * Usa o sistema de reports/tickets do novo backend
   */
  async getAllUsersMessages(filters = {}) {
    const result = await this.listReports(filters);
    return result.reports || [];
  }
}

const adminService = new AdminService();

export { adminService };
export default adminService;
