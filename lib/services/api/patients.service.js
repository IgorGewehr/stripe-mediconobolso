/**
 * Patients Service - Gerenciamento de Pacientes
 *
 * Substitui o Firebase patients.service.js
 */

import apiService from './apiService';

const ENDPOINT = '/patients';

/**
 * Serviço de Pacientes
 */
const patientsService = {
  /**
   * Listar pacientes com filtros e paginação
   */
  async list(filters = {}) {
    const params = {
      page: filters.page || 1,
      per_page: filters.perPage || 20,
      nome: filters.nome || filters.name,
      cpf: filters.cpf,
      convenio_id: filters.convenioId,
      ativo: filters.ativo !== undefined ? filters.ativo : true,
    };

    const response = await apiService.get(ENDPOINT, params);
    return {
      items: response.items.map(normalizePatient),
      total: response.total,
      page: response.page,
      perPage: response.per_page,
    };
  },

  /**
   * Buscar paciente por ID
   */
  async getById(patientId) {
    const response = await apiService.get(`${ENDPOINT}/${patientId}`);
    return normalizePatient(response);
  },

  /**
   * Buscar paciente por CPF
   */
  async getByCpf(cpf) {
    const response = await apiService.get(`${ENDPOINT}/cpf/${cpf}`);
    return normalizePatient(response);
  },

  /**
   * Criar novo paciente
   */
  async create(patientData) {
    const payload = denormalizePatient(patientData);
    const response = await apiService.post(ENDPOINT, payload);
    return normalizePatient(response);
  },

  /**
   * Atualizar paciente
   */
  async update(patientId, patientData) {
    const payload = denormalizePatient(patientData);
    const response = await apiService.put(`${ENDPOINT}/${patientId}`, payload);
    return normalizePatient(response);
  },

  /**
   * Excluir paciente (soft delete)
   */
  async delete(patientId) {
    await apiService.delete(`${ENDPOINT}/${patientId}`);
    return { success: true };
  },

  /**
   * Reativar paciente
   */
  async reactivate(patientId) {
    const response = await apiService.put(`${ENDPOINT}/${patientId}/reactivate`);
    return normalizePatient(response);
  },

  /**
   * Atualizar status de favorito
   */
  async updateFavorite(patientId, isFavorite) {
    return apiService.put(`${ENDPOINT}/${patientId}/favorite`, { is_favorite: isFavorite });
  },

  /**
   * Atualizar lista de status
   */
  async updateStatus(patientId, statusList) {
    return apiService.put(`${ENDPOINT}/${patientId}/status`, { status_list: statusList });
  },

  /**
   * Obter histórico de status
   */
  async getStatusHistory(patientId) {
    const response = await apiService.get(`${ENDPOINT}/${patientId}/status-history`);
    return response.items;
  },

  /**
   * Adicionar entrada ao histórico de status
   */
  async addStatusHistory(patientId, status, notes) {
    return apiService.post(`${ENDPOINT}/${patientId}/status-history`, { status, notes });
  },

  /**
   * Filtrar pacientes com critérios avançados
   * Compatibilidade com o antigo Firebase filterPatients
   */
  async filterPatients(filters = {}) {
    return this.list(filters);
  },
};

/**
 * Normaliza dados do paciente do backend para o frontend
 * (snake_case -> camelCase)
 */
function normalizePatient(patient) {
  if (!patient) return null;

  return {
    id: patient.id,
    // Dados básicos
    patientName: patient.nome_completo,
    patientAge: patient.idade,
    patientGender: normalizeGender(patient.sexo),
    patientPhone: patient.telefone || patient.celular,
    patientEmail: patient.email,
    patientCPF: patient.cpf,
    patientRG: patient.rg,
    birthDate: patient.data_nascimento,
    // Endereço
    patientAddress: formatAddress(patient),
    address: {
      cep: patient.cep,
      logradouro: patient.logradouro,
      numero: patient.numero,
      complemento: patient.complemento,
      bairro: patient.bairro,
      cidade: patient.cidade,
      uf: patient.uf,
    },
    // Convênio
    convenioId: patient.convenio_id,
    healthPlan: {
      name: patient.convenio_nome,
      number: patient.numero_carteira,
      validUntil: patient.validade_carteira,
    },
    // Dados médicos
    bloodType: patient.tipo_sanguineo,
    heightCm: patient.altura_cm,
    weightKg: patient.peso_kg,
    imc: patient.imc,
    isSmoker: patient.fumante,
    isAlcoholConsumer: patient.consome_alcool,
    // Históricos
    allergies: patient.alergias || [],
    congenitalDiseases: patient.doencas_congenitas || [],
    chronicDiseases: patient.doencas_cronicas || [],
    medications: patient.medicamentos_uso_continuo || [],
    surgicalHistory: patient.historico_cirurgico || [],
    familyHistory: patient.historico_familiar || [],
    // Sinais vitais
    vitalSigns: patient.sinais_vitais || {},
    // Contato de emergência
    emergencyContact: patient.contato_emergencia || {},
    // Organização
    isFavorite: patient.favorito,
    tags: patient.tags || [],
    notes: patient.observacoes,
    photoURL: patient.foto_url,
    statusList: patient.status_list || [],
    // Flags
    hasAllergies: patient.tem_alergias,
    hasChronicDiseases: patient.tem_doencas_cronicas,
    // Consultas
    lastConsultationDate: patient.ultima_consulta,
    // Timestamps
    createdAt: patient.created_at,
    updatedAt: patient.updated_at,
    isActive: patient.ativo,
  };
}

/**
 * Denormaliza dados do paciente do frontend para o backend
 * (camelCase -> snake_case)
 */
function denormalizePatient(patient) {
  const payload = {};

  // Mapeamento de campos
  if (patient.patientName !== undefined) payload.nome_completo = patient.patientName;
  if (patient.patientCPF !== undefined) payload.cpf = patient.patientCPF;
  if (patient.patientRG !== undefined) payload.rg = patient.patientRG;
  if (patient.birthDate !== undefined) payload.data_nascimento = patient.birthDate;
  if (patient.patientGender !== undefined) payload.sexo = denormalizeGender(patient.patientGender);
  if (patient.patientEmail !== undefined) payload.email = patient.patientEmail;
  if (patient.patientPhone !== undefined) payload.telefone = patient.patientPhone;

  // Endereço
  if (patient.address) {
    payload.cep = patient.address.cep;
    payload.logradouro = patient.address.logradouro;
    payload.numero = patient.address.numero;
    payload.complemento = patient.address.complemento;
    payload.bairro = patient.address.bairro;
    payload.cidade = patient.address.cidade;
    payload.uf = patient.address.uf;
  }

  // Convênio
  if (patient.convenioId !== undefined) payload.convenio_id = patient.convenioId;
  if (patient.healthPlan) {
    payload.numero_carteira = patient.healthPlan.number;
    payload.validade_carteira = patient.healthPlan.validUntil;
  }

  // Dados médicos
  if (patient.bloodType !== undefined) payload.tipo_sanguineo = patient.bloodType;
  if (patient.heightCm !== undefined) payload.altura_cm = patient.heightCm;
  if (patient.weightKg !== undefined) payload.peso_kg = patient.weightKg;
  if (patient.isSmoker !== undefined) payload.fumante = patient.isSmoker;
  if (patient.isAlcoholConsumer !== undefined) payload.consome_alcool = patient.isAlcoholConsumer;

  // Históricos
  if (patient.allergies !== undefined) payload.alergias = patient.allergies;
  if (patient.congenitalDiseases !== undefined) payload.doencas_congenitas = patient.congenitalDiseases;
  if (patient.chronicDiseases !== undefined) payload.doencas_cronicas = patient.chronicDiseases;
  if (patient.medications !== undefined) payload.medicamentos_uso_continuo = patient.medications;
  if (patient.surgicalHistory !== undefined) payload.historico_cirurgico = patient.surgicalHistory;
  if (patient.familyHistory !== undefined) payload.historico_familiar = patient.familyHistory;

  // Sinais vitais e emergência
  if (patient.vitalSigns !== undefined) payload.sinais_vitais = patient.vitalSigns;
  if (patient.emergencyContact !== undefined) payload.contato_emergencia = patient.emergencyContact;

  // Organização
  if (patient.isFavorite !== undefined) payload.favorito = patient.isFavorite;
  if (patient.tags !== undefined) payload.tags = patient.tags;
  if (patient.notes !== undefined) payload.observacoes = patient.notes;
  if (patient.photoURL !== undefined) payload.foto_url = patient.photoURL;

  return payload;
}

function normalizeGender(gender) {
  const map = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    outro: 'Outro',
  };
  return map[gender?.toLowerCase()] || gender;
}

function denormalizeGender(gender) {
  const map = {
    Masculino: 'masculino',
    Feminino: 'feminino',
    Outro: 'outro',
    M: 'masculino',
    F: 'feminino',
  };
  return map[gender] || 'outro';
}

function formatAddress(patient) {
  const parts = [
    patient.logradouro,
    patient.numero,
    patient.bairro,
    patient.cidade,
    patient.uf,
  ].filter(Boolean);
  return parts.join(', ');
}

export default patientsService;
