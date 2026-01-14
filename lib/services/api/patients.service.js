/**
 * Patients Service - Gerenciamento de Pacientes
 *
 * Substitui o Firebase patients.service.js
 * Inclui logging detalhado para debugging em produção.
 */

import apiService from './apiService';
import { createCrudLogger } from '@/lib/utils/logger';

const ENDPOINT = '/patients';
const logger = createCrudLogger('Paciente');

/**
 * Serviço de Pacientes
 */
const patientsService = {
  /**
   * Listar pacientes com filtros e paginação
   */
  async list(filters = {}) {
    const { requestId, startTime } = logger.operationStart('LIST', null, filters);

    try {
      const params = {
        page: filters.page || 1,
        per_page: filters.perPage || 20,
        nome: filters.nome || filters.name,
        cpf: filters.cpf,
        convenio_id: filters.convenioId,
        ativo: filters.ativo !== undefined ? filters.ativo : true,
      };

      const response = await apiService.get(ENDPOINT, params);
      const result = {
        items: response.items.map(normalizePatient),
        total: response.total,
        page: response.page,
        perPage: response.per_page,
      };

      logger.operationSuccess(requestId, startTime, 'LIST', null, { count: result.items.length });
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'LIST', error, null, filters);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Buscar paciente por ID
   */
  async getById(patientId) {
    const { requestId, startTime } = logger.operationStart('GET', patientId);

    try {
      const response = await apiService.get(`${ENDPOINT}/${patientId}`);
      const result = normalizePatient(response);
      logger.operationSuccess(requestId, startTime, 'GET', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Buscar paciente por CPF
   */
  async getByCpf(cpf) {
    const { requestId, startTime } = logger.operationStart('GET_BY_CPF', null, { cpf: cpf?.slice(-4) });

    try {
      const response = await apiService.get(`${ENDPOINT}/cpf/${cpf}`);
      const result = normalizePatient(response);
      logger.operationSuccess(requestId, startTime, 'GET_BY_CPF', result?.id);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET_BY_CPF', error, null, { cpf });
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Criar novo paciente
   */
  async create(patientData) {
    const { requestId, startTime } = logger.operationStart('CREATE', null, patientData);

    try {
      const payload = denormalizePatient(patientData);

      // Validação local básica antes de enviar
      if (!payload.nome_completo) {
        const error = new Error('Nome do paciente é obrigatório');
        error.status = 400;
        error.validationErrors = { patientName: 'Campo obrigatório' };
        throw error;
      }

      const response = await apiService.post(ENDPOINT, payload);
      const result = normalizePatient(response);

      logger.operationSuccess(requestId, startTime, 'CREATE', result.id);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'CREATE', error, null, patientData);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Atualizar paciente
   */
  async update(patientId, patientData) {
    const { requestId, startTime } = logger.operationStart('UPDATE', patientId, patientData);

    try {
      if (!patientId) {
        const error = new Error('ID do paciente é obrigatório para atualização');
        error.status = 400;
        throw error;
      }

      const payload = denormalizePatient(patientData);
      const response = await apiService.put(`${ENDPOINT}/${patientId}`, payload);
      const result = normalizePatient(response);

      logger.operationSuccess(requestId, startTime, 'UPDATE', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'UPDATE', error, patientId, patientData);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Excluir paciente (soft delete)
   */
  async delete(patientId) {
    const { requestId, startTime } = logger.operationStart('DELETE', patientId);

    try {
      if (!patientId) {
        const error = new Error('ID do paciente é obrigatório para exclusão');
        error.status = 400;
        throw error;
      }

      await apiService.delete(`${ENDPOINT}/${patientId}`);
      logger.operationSuccess(requestId, startTime, 'DELETE', patientId);
      return { success: true };
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'DELETE', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Reativar paciente
   */
  async reactivate(patientId) {
    const { requestId, startTime } = logger.operationStart('REACTIVATE', patientId);

    try {
      const response = await apiService.put(`${ENDPOINT}/${patientId}/reactivate`);
      const result = normalizePatient(response);
      logger.operationSuccess(requestId, startTime, 'REACTIVATE', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'REACTIVATE', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Atualizar status de favorito
   */
  async updateFavorite(patientId, isFavorite) {
    const { requestId, startTime } = logger.operationStart('UPDATE_FAVORITE', patientId, { isFavorite });

    try {
      const result = await apiService.put(`${ENDPOINT}/${patientId}/favorite`, { is_favorite: isFavorite });
      logger.operationSuccess(requestId, startTime, 'UPDATE_FAVORITE', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'UPDATE_FAVORITE', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Atualizar lista de status
   */
  async updateStatus(patientId, statusList) {
    const { requestId, startTime } = logger.operationStart('UPDATE_STATUS', patientId, { statusList });

    try {
      const result = await apiService.put(`${ENDPOINT}/${patientId}/status`, { status_list: statusList });
      logger.operationSuccess(requestId, startTime, 'UPDATE_STATUS', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'UPDATE_STATUS', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Obter histórico de status
   */
  async getStatusHistory(patientId) {
    const { requestId, startTime } = logger.operationStart('GET_STATUS_HISTORY', patientId);

    try {
      const response = await apiService.get(`${ENDPOINT}/${patientId}/status-history`);
      logger.operationSuccess(requestId, startTime, 'GET_STATUS_HISTORY', patientId);
      return response.items;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'GET_STATUS_HISTORY', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Adicionar entrada ao histórico de status
   */
  async addStatusHistory(patientId, status, notes) {
    const { requestId, startTime } = logger.operationStart('ADD_STATUS_HISTORY', patientId, { status, notes });

    try {
      const result = await apiService.post(`${ENDPOINT}/${patientId}/status-history`, { status, notes });
      logger.operationSuccess(requestId, startTime, 'ADD_STATUS_HISTORY', patientId);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'ADD_STATUS_HISTORY', error, patientId);
      error.userMessage = userMessage;
      throw error;
    }
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
 *
 * IMPORTANTE: Filtra strings vazias para evitar erros de validação no backend
 */
function denormalizePatient(patient) {
  const payload = {};

  // Helper para converter string vazia em null
  const emptyToNull = (val) => (val === '' || val === undefined ? null : val);

  // Helper para verificar se array está vazio
  const emptyArrayToNull = (val) => (Array.isArray(val) && val.length === 0 ? null : val);

  // Helper para converter data de DD/MM/YYYY para YYYY-MM-DD (formato esperado pelo backend)
  const convertDateFormat = (dateStr) => {
    if (!dateStr || dateStr === '') return null;
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Converte de DD/MM/YYYY para YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    // Retorna o valor original se não reconhecer o formato
    return dateStr;
  };

  // Mapeamento de campos - strings vazias viram null
  if (patient.patientName !== undefined) payload.nome_completo = emptyToNull(patient.patientName);
  if (patient.patientCPF !== undefined) payload.cpf = emptyToNull(patient.patientCPF);
  if (patient.patientRG !== undefined) payload.rg = emptyToNull(patient.patientRG);
  if (patient.birthDate !== undefined) payload.data_nascimento = convertDateFormat(patient.birthDate);
  if (patient.patientGender !== undefined && patient.patientGender !== '') {
    payload.sexo = denormalizeGender(patient.patientGender);
  }
  if (patient.patientEmail !== undefined) payload.email = emptyToNull(patient.patientEmail);
  if (patient.patientPhone !== undefined) payload.telefone = emptyToNull(patient.patientPhone);

  // Endereço - também converter strings vazias para null
  if (patient.address) {
    payload.cep = emptyToNull(patient.address.cep);
    payload.logradouro = emptyToNull(patient.address.logradouro);
    payload.numero = emptyToNull(patient.address.numero);
    payload.complemento = emptyToNull(patient.address.complemento);
    payload.bairro = emptyToNull(patient.address.bairro);
    payload.cidade = emptyToNull(patient.address.cidade);
    payload.uf = emptyToNull(patient.address.uf);
  }

  // Convênio
  if (patient.convenioId !== undefined) payload.convenio_id = patient.convenioId;
  if (patient.healthPlan) {
    payload.numero_carteira = emptyToNull(patient.healthPlan.number);
    payload.validade_carteira = convertDateFormat(patient.healthPlan.validUntil);
  }

  // Dados médicos - converter strings vazias para null
  if (patient.bloodType !== undefined) payload.tipo_sanguineo = emptyToNull(patient.bloodType);
  if (patient.heightCm !== undefined) payload.altura_cm = patient.heightCm || null;
  if (patient.weightKg !== undefined) payload.peso_kg = patient.weightKg || null;
  if (patient.isSmoker !== undefined) payload.fumante = patient.isSmoker;
  if (patient.isAlcoholConsumer !== undefined) payload.consome_alcool = patient.isAlcoholConsumer;

  // Históricos - converter arrays vazios para null para evitar envio desnecessário
  if (patient.allergies !== undefined) payload.alergias = emptyArrayToNull(patient.allergies);
  if (patient.congenitalDiseases !== undefined) payload.doencas_congenitas = emptyArrayToNull(patient.congenitalDiseases);
  if (patient.chronicDiseases !== undefined) payload.doencas_cronicas = emptyArrayToNull(patient.chronicDiseases);
  if (patient.medications !== undefined) payload.medicamentos_uso_continuo = emptyArrayToNull(patient.medications);
  if (patient.surgicalHistory !== undefined) payload.historico_cirurgico = emptyArrayToNull(patient.surgicalHistory);
  if (patient.familyHistory !== undefined) payload.historico_familiar = emptyArrayToNull(patient.familyHistory);

  // Sinais vitais e emergência
  if (patient.vitalSigns !== undefined) payload.sinais_vitais = patient.vitalSigns;
  if (patient.emergencyContact !== undefined) payload.contato_emergencia = patient.emergencyContact;

  // Organização
  if (patient.isFavorite !== undefined) payload.favorito = patient.isFavorite;
  if (patient.tags !== undefined) payload.tags = emptyArrayToNull(patient.tags);
  if (patient.notes !== undefined) payload.observacoes = emptyToNull(patient.notes);
  if (patient.photoURL !== undefined) payload.foto_url = emptyToNull(patient.photoURL);

  // Limpar campos com valor null do payload (opcional, backend aceita null)
  Object.keys(payload).forEach(key => {
    if (payload[key] === null) delete payload[key];
  });

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
  if (!gender) return 'outro';
  const normalized = gender.toLowerCase();
  const map = {
    'masculino': 'masculino',
    'feminino': 'feminino',
    'outro': 'outro',
    'm': 'masculino',
    'f': 'feminino',
    'male': 'masculino',
    'female': 'feminino',
    'other': 'outro',
  };
  return map[normalized] || 'outro';
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
