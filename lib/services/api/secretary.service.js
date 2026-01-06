/**
 * Secretary Service - Gerenciamento de Secretárias
 *
 * Substitui o Firebase secretary.service.js
 */

import apiService from './apiService';

const ENDPOINT = '/secretaries';

/**
 * Serviço de Secretárias
 */
const secretaryService = {
  /**
   * Listar secretárias
   */
  async list(includeInactive = false) {
    const response = await apiService.get(ENDPOINT, {
      active: !includeInactive, // Backend uses 'active' not 'include_inactive'
    });
    const items = Array.isArray(response) ? response : (response.items || []);
    return items.map(normalizeSecretary);
  },

  /**
   * Buscar secretária por ID
   */
  async getById(secretaryId) {
    const response = await apiService.get(`${ENDPOINT}/${secretaryId}`);
    return normalizeSecretary(response);
  },

  /**
   * Criar nova conta de secretária
   */
  async create(secretaryData) {
    const payload = denormalizeSecretary(secretaryData);
    const response = await apiService.post(ENDPOINT, payload);
    return normalizeSecretary(response);
  },

  /**
   * Atualizar secretária
   */
  async update(secretaryId, secretaryData) {
    const payload = denormalizeSecretary(secretaryData);
    const response = await apiService.put(`${ENDPOINT}/${secretaryId}`, payload);
    return normalizeSecretary(response);
  },

  /**
   * Atualizar permissões da secretária
   * Backend expects SecretaryPermissions object directly, not wrapped in { permissions: ... }
   */
  async updatePermissions(secretaryId, permissions) {
    const response = await apiService.put(
      `${ENDPOINT}/${secretaryId}/permissions`,
      denormalizePermissions(permissions) // Send directly, not wrapped
    );
    return normalizeSecretary(response);
  },

  /**
   * Desativar conta de secretária
   * Backend uses DELETE method, not POST
   */
  async deactivate(secretaryId) {
    const response = await apiService.delete(`${ENDPOINT}/${secretaryId}`);
    return response;
  },

  /**
   * Reativar conta de secretária
   * Backend uses PUT method, not POST
   */
  async reactivate(secretaryId) {
    const response = await apiService.put(`${ENDPOINT}/${secretaryId}/reactivate`, {});
    return normalizeSecretary(response);
  },

  /**
   * Contar secretárias ativas
   */
  async count() {
    const response = await apiService.get(`${ENDPOINT}/count`);
    return response.count;
  },

  /**
   * Verificar se email existe
   */
  async checkEmailExists(email) {
    const response = await apiService.get(`${ENDPOINT}/check-email`, { email });
    return response.exists;
  },

  /**
   * Validar operação de secretária
   */
  async validateOperation(userId, requiredModule, requiredAction) {
    const response = await apiService.post(`${ENDPOINT}/validate-operation`, {
      user_id: userId,
      module: requiredModule,
      action: requiredAction,
    });
    return response.allowed;
  },

  /**
   * Gerar relatório de secretárias
   */
  async generateReport() {
    const response = await apiService.get(`${ENDPOINT}/report`);
    return response;
  },

  /**
   * Buscar informações de secretária ativa do médico
   * Uses the authenticated user's tenant context instead of requiring a doctor ID
   * @param {string} doctorId - ID do médico (legacy, not used - uses auth context)
   * @returns {Promise<Object|null>} Informações da secretária ou null
   */
  async getDoctorSecretaryInfo(doctorId) {
    try {
      // Use /secretaries endpoint which filters by authenticated user's tenant
      // No need to pass doctorId as the backend uses auth.tenant_id for filtering
      const response = await apiService.get(ENDPOINT, {
        active: true,
        limit: 1,
      });

      // Retornar a primeira secretária ativa
      if (response && response.items && response.items.length > 0) {
        const secretary = response.items[0];
        return {
          id: secretary.id,
          name: secretary.name || secretary.nome,
          email: secretary.email,
          active: secretary.active ?? secretary.ativo ?? true,
          permissions: normalizePermissions(secretary.permissions || secretary.permissoes),
          createdAt: secretary.created_at,
          lastLogin: secretary.last_login_at || secretary.ultimo_login,
          loginCount: secretary.login_count || 0,
          needsActivation: secretary.needs_activation || false,
        };
      }

      return null;
    } catch (error) {
      // Se for 404, significa que não há secretária - não é um erro
      if (error.status === 404) {
        return null;
      }
      console.error('[SecretaryService] Erro ao buscar info da secretária:', error);
      return null;
    }
  },

  // =========================================================================
  // Compatibilidade com Firebase
  // =========================================================================

  /**
   * @deprecated Use create()
   */
  async createSecretaryAccount(doctorId, secretaryData) {
    return this.create(secretaryData);
  },

  /**
   * @deprecated Use list()
   */
  async listDoctorSecretaries(doctorId, includeInactive = false) {
    return this.list(includeInactive);
  },

  /**
   * @deprecated Use getById()
   */
  async getSecretaryDetails(secretaryId, doctorId) {
    return this.getById(secretaryId);
  },

  /**
   * @deprecated Use deactivate()
   */
  async deactivateSecretaryAccount(doctorId, secretaryId) {
    return this.deactivate(secretaryId);
  },

  /**
   * @deprecated Use reactivate()
   */
  async reactivateSecretaryAccount(doctorId, secretaryId) {
    return this.reactivate(secretaryId);
  },

  /**
   * @deprecated Use count()
   */
  async countDoctorSecretaries(doctorId) {
    return this.count();
  },
};

/**
 * Normaliza dados da secretária do backend para o frontend
 * Backend returns fields in English (snake_case)
 */
function normalizeSecretary(secretary) {
  if (!secretary) return null;

  return {
    id: secretary.id,
    doctorId: secretary.doctor_id,
    userId: secretary.user_id,
    // Dados pessoais - backend uses English names
    name: secretary.name,
    email: secretary.email,
    phone: secretary.phone,
    cpf: secretary.cpf,
    // Status - backend uses 'active' not 'ativo'
    isActive: secretary.active,
    status: secretary.active ? 'active' : 'inactive',
    // Permissões
    permissions: normalizePermissions(secretary.permissions),
    // Timestamps
    createdAt: secretary.created_at,
    updatedAt: secretary.updated_at,
    lastLoginAt: secretary.last_login_at,
  };
}

/**
 * Denormaliza dados da secretária do frontend para o backend
 * Backend expects English field names
 */
function denormalizeSecretary(secretary) {
  const payload = {};

  // Required field - backend expects doctor_id
  if (secretary.doctorId !== undefined) payload.doctor_id = secretary.doctorId;
  // Personal data - backend uses English names
  if (secretary.name !== undefined) payload.name = secretary.name;
  if (secretary.email !== undefined) payload.email = secretary.email;
  if (secretary.phone !== undefined) payload.phone = secretary.phone;
  if (secretary.cpf !== undefined) payload.cpf = secretary.cpf;
  // Note: password is NOT accepted in CreateSecretaryRequest
  if (secretary.permissions !== undefined) {
    payload.permissions = denormalizePermissions(secretary.permissions);
  }

  return payload;
}

/**
 * Normaliza permissões do backend para o frontend
 * Backend returns fields in English (snake_case)
 */
function normalizePermissions(permissions) {
  if (!permissions) {
    return getDefaultPermissions();
  }

  return {
    patients: {
      read: permissions.patients?.read ?? true,
      write: permissions.patients?.write ?? false,
      viewDetails: permissions.patients?.view_details ?? true,
    },
    appointments: {
      read: permissions.appointments?.read ?? true,
      write: permissions.appointments?.write ?? true,
      viewDetails: permissions.appointments?.view_details ?? true,
    },
    prescriptions: {
      read: permissions.prescriptions?.read ?? true,
      write: permissions.prescriptions?.write ?? false,
      viewDetails: permissions.prescriptions?.view_details ?? false,
    },
    exams: {
      read: permissions.exams?.read ?? true,
      write: permissions.exams?.write ?? false,
      viewDetails: permissions.exams?.view_details ?? false,
    },
    notes: {
      read: permissions.notes?.read ?? true,
      write: permissions.notes?.write ?? false,
      viewDetails: permissions.notes?.view_details ?? false,
    },
    financial: {
      read: permissions.financial?.read ?? false,
      write: permissions.financial?.write ?? false,
      viewDetails: permissions.financial?.view_details ?? false,
    },
    reports: {
      read: permissions.reports?.read ?? true,
      write: permissions.reports?.write ?? false,
      viewDetails: permissions.reports?.view_details ?? false,
    },
  };
}

/**
 * Denormaliza permissões do frontend para o backend
 * Backend expects view_details for ALL modules
 */
function denormalizePermissions(permissions) {
  return {
    patients: {
      read: permissions.patients?.read ?? true,
      write: permissions.patients?.write ?? false,
      view_details: permissions.patients?.viewDetails ?? true,
    },
    appointments: {
      read: permissions.appointments?.read ?? true,
      write: permissions.appointments?.write ?? true,
      view_details: permissions.appointments?.viewDetails ?? true,
    },
    prescriptions: {
      read: permissions.prescriptions?.read ?? true,
      write: permissions.prescriptions?.write ?? false,
      view_details: permissions.prescriptions?.viewDetails ?? false,
    },
    exams: {
      read: permissions.exams?.read ?? true,
      write: permissions.exams?.write ?? false,
      view_details: permissions.exams?.viewDetails ?? false,
    },
    notes: {
      read: permissions.notes?.read ?? true,
      write: permissions.notes?.write ?? false,
      view_details: permissions.notes?.viewDetails ?? false,
    },
    financial: {
      read: permissions.financial?.read ?? false,
      write: permissions.financial?.write ?? false,
      view_details: permissions.financial?.viewDetails ?? false,
    },
    reports: {
      read: permissions.reports?.read ?? true,
      write: permissions.reports?.write ?? false,
      view_details: permissions.reports?.viewDetails ?? false,
    },
  };
}

/**
 * Permissões padrão para novas secretárias
 * Includes viewDetails for all modules as backend expects
 */
function getDefaultPermissions() {
  return {
    patients: { read: true, write: false, viewDetails: true },
    appointments: { read: true, write: true, viewDetails: true },
    prescriptions: { read: true, write: false, viewDetails: false },
    exams: { read: true, write: false, viewDetails: false },
    notes: { read: true, write: false, viewDetails: false },
    financial: { read: false, write: false, viewDetails: false },
    reports: { read: true, write: false, viewDetails: false },
  };
}

export default secretaryService;
