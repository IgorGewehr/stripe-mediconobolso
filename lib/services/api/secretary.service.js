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
      include_inactive: includeInactive,
    });
    return response.items.map(normalizeSecretary);
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
   */
  async updatePermissions(secretaryId, permissions) {
    const response = await apiService.put(`${ENDPOINT}/${secretaryId}/permissions`, {
      permissions: denormalizePermissions(permissions),
    });
    return normalizeSecretary(response);
  },

  /**
   * Desativar conta de secretária
   */
  async deactivate(secretaryId) {
    const response = await apiService.post(`${ENDPOINT}/${secretaryId}/deactivate`);
    return normalizeSecretary(response);
  },

  /**
   * Reativar conta de secretária
   */
  async reactivate(secretaryId) {
    const response = await apiService.post(`${ENDPOINT}/${secretaryId}/reactivate`);
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
 */
function normalizeSecretary(secretary) {
  if (!secretary) return null;

  return {
    id: secretary.id,
    doctorId: secretary.doctor_id || secretary.medico_id,
    userId: secretary.user_id,
    // Dados pessoais
    name: secretary.nome,
    email: secretary.email,
    phone: secretary.telefone,
    // Status
    isActive: secretary.ativo,
    status: secretary.ativo ? 'active' : 'inactive',
    // Permissões
    permissions: normalizePermissions(secretary.permissions || secretary.permissoes),
    // Timestamps
    createdAt: secretary.created_at,
    updatedAt: secretary.updated_at,
    lastLoginAt: secretary.ultimo_login,
  };
}

/**
 * Denormaliza dados da secretária do frontend para o backend
 */
function denormalizeSecretary(secretary) {
  const payload = {};

  if (secretary.name !== undefined) payload.nome = secretary.name;
  if (secretary.email !== undefined) payload.email = secretary.email;
  if (secretary.phone !== undefined) payload.telefone = secretary.phone;
  if (secretary.password !== undefined) payload.senha = secretary.password;
  if (secretary.permissions !== undefined) {
    payload.permissions = denormalizePermissions(secretary.permissions);
  }

  return payload;
}

/**
 * Normaliza permissões do backend para o frontend
 */
function normalizePermissions(permissions) {
  if (!permissions) {
    return getDefaultPermissions();
  }

  return {
    patients: {
      read: permissions.patients?.read ?? permissions.pacientes?.leitura ?? true,
      write: permissions.patients?.write ?? permissions.pacientes?.escrita ?? false,
      viewDetails: permissions.patients?.view_details ?? permissions.pacientes?.ver_detalhes ?? true,
    },
    appointments: {
      read: permissions.appointments?.read ?? permissions.agendamentos?.leitura ?? true,
      write: permissions.appointments?.write ?? permissions.agendamentos?.escrita ?? true,
    },
    prescriptions: {
      read: permissions.prescriptions?.read ?? permissions.prescricoes?.leitura ?? true,
      write: permissions.prescriptions?.write ?? permissions.prescricoes?.escrita ?? false,
    },
    exams: {
      read: permissions.exams?.read ?? permissions.exames?.leitura ?? true,
      write: permissions.exams?.write ?? permissions.exames?.escrita ?? false,
    },
    notes: {
      read: permissions.notes?.read ?? permissions.notas?.leitura ?? true,
      write: permissions.notes?.write ?? permissions.notas?.escrita ?? false,
    },
    financial: {
      read: permissions.financial?.read ?? permissions.financeiro?.leitura ?? false,
      write: permissions.financial?.write ?? permissions.financeiro?.escrita ?? false,
    },
    reports: {
      read: permissions.reports?.read ?? permissions.relatorios?.leitura ?? false,
      write: permissions.reports?.write ?? permissions.relatorios?.escrita ?? false,
    },
  };
}

/**
 * Denormaliza permissões do frontend para o backend
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
    },
    prescriptions: {
      read: permissions.prescriptions?.read ?? true,
      write: permissions.prescriptions?.write ?? false,
    },
    exams: {
      read: permissions.exams?.read ?? true,
      write: permissions.exams?.write ?? false,
    },
    notes: {
      read: permissions.notes?.read ?? true,
      write: permissions.notes?.write ?? false,
    },
    financial: {
      read: permissions.financial?.read ?? false,
      write: permissions.financial?.write ?? false,
    },
    reports: {
      read: permissions.reports?.read ?? false,
      write: permissions.reports?.write ?? false,
    },
  };
}

/**
 * Permissões padrão para novas secretárias
 */
function getDefaultPermissions() {
  return {
    patients: { read: true, write: false, viewDetails: true },
    appointments: { read: true, write: true },
    prescriptions: { read: true, write: false },
    exams: { read: true, write: false },
    notes: { read: true, write: false },
    financial: { read: false, write: false },
    reports: { read: false, write: false },
  };
}

export default secretaryService;
