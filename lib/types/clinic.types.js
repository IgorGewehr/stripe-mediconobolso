/**
 * @fileoverview Clinic types for multi-doctor support
 * @description JSDoc type definitions for clinic entities and permissions
 */

// ============================================================================
// CLINIC MODE
// ============================================================================

/**
 * Mode of operation for a clinic/tenant
 * @typedef {'solo' | 'multi_doctor'} ClinicMode
 */

// ============================================================================
// CLINIC / TENANT
// ============================================================================

/**
 * Clinic/Tenant entity
 * @typedef {Object} Clinic
 * @property {string} id - UUID da clínica
 * @property {string} slug - Slug único (ex: "clinica-abc")
 * @property {string} name - Nome da clínica
 * @property {string} cnpj - CNPJ
 * @property {string} [cnes] - CNES (Cadastro Nacional de Estabelecimentos de Saúde)
 * @property {ClinicSettings} settings - Configurações da clínica
 * @property {string} subscriptionTier - Plano de assinatura
 * @property {string} status - Status do tenant
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Clinic settings
 * @typedef {Object} ClinicSettings
 * @property {boolean} whatsappEnabled - WhatsApp habilitado
 * @property {boolean} nfseEnabled - NFSe habilitado
 * @property {boolean} tissEnabled - TISS habilitado
 * @property {boolean} facebookEnabled - Facebook habilitado
 * @property {boolean} aiEnabled - IA habilitada
 * @property {number} [maxUsers] - Limite de usuários
 * @property {number} [maxPatients] - Limite de pacientes
 * @property {string} timezone - Timezone
 * @property {ClinicMode} clinicMode - Modo de operação
 * @property {boolean} allowPatientSharing - Permitir compartilhamento de pacientes
 * @property {boolean} requireDoctorAssignment - Exigir atribuição de médico
 * @property {number} [maxDoctors] - Limite de médicos
 * @property {number} [maxSecretaries] - Limite de secretárias
 * @property {number} defaultAppointmentDuration - Duração padrão de consulta em minutos
 */

// ============================================================================
// DOCTOR ASSOCIATION
// ============================================================================

/**
 * Type of association between doctor and clinic
 * @typedef {'owner' | 'partner' | 'employee' | 'contractor' | 'guest'} AssociationType
 */

/**
 * Additional permissions for a doctor in a clinic
 * @typedef {Object} DoctorAdditionalPermissions
 * @property {boolean} canViewFinancial - Pode ver dados financeiros
 * @property {boolean} canManageFinancial - Pode gerenciar financeiro
 * @property {boolean} canViewAllPatients - Pode ver pacientes de outros médicos
 * @property {boolean} canIssueNfse - Pode emitir NFSe
 * @property {boolean} canManageSecretaries - Pode gerenciar secretárias
 * @property {boolean} canViewAnalytics - Pode ver analytics
 * @property {boolean} canManageWhatsapp - Pode gerenciar WhatsApp
 * @property {boolean} canManageFacebook - Pode gerenciar Facebook
 */

/**
 * Doctor-Clinic association
 * @typedef {Object} DoctorClinicAssociation
 * @property {string} id - UUID da associação
 * @property {string} tenantId - UUID da clínica
 * @property {string} profissionalId - UUID do profissional
 * @property {string} userId - UUID do usuário
 * @property {AssociationType} associationType - Tipo de associação
 * @property {DoctorAdditionalPermissions} additionalPermissions - Permissões adicionais
 * @property {boolean} active - Se está ativo
 * @property {Date} joinedAt - Data de entrada
 * @property {Date} [leftAt] - Data de saída
 * @property {number} [defaultRepassePercent] - Percentual de repasse padrão
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} [invitedBy] - UUID do usuário que convidou
 */

/**
 * Doctor with association details
 * @typedef {Object} DoctorWithAssociation
 * @property {DoctorClinicAssociation} association - Dados da associação
 * @property {string} name - Nome do médico
 * @property {string} crm - CRM
 * @property {string} ufCrm - UF do CRM
 * @property {string} [specialty] - Especialidade
 * @property {string} email - Email
 */

// ============================================================================
// DOCTOR INVITE
// ============================================================================

/**
 * Pending doctor invite
 * @typedef {Object} DoctorInvite
 * @property {string} id - UUID do convite
 * @property {string} tenantId - UUID da clínica
 * @property {string} email - Email do convidado
 * @property {string} name - Nome do convidado
 * @property {string} crm - CRM
 * @property {string} ufCrm - UF do CRM
 * @property {string} [specialty] - Especialidade
 * @property {AssociationType} associationType - Tipo de associação proposta
 * @property {DoctorAdditionalPermissions} additionalPermissions - Permissões propostas
 * @property {number} [defaultRepassePercent] - Percentual de repasse proposto
 * @property {string} token - Token de convite
 * @property {Date} expiresAt - Data de expiração
 * @property {Date} [acceptedAt] - Data de aceitação
 * @property {Date} createdAt
 * @property {string} createdBy - UUID do usuário que criou
 */

// ============================================================================
// CLINIC SECRETARY
// ============================================================================

/**
 * Secretary scope - which doctors the secretary can access
 * @typedef {'all_doctors' | {specificDoctors: string[]} | {singleDoctor: string}} SecretaryScope
 */

/**
 * Secretary scope type
 * @typedef {'all_doctors' | 'specific_doctors' | 'single_doctor'} SecretaryScopeType
 */

/**
 * Module permissions
 * @typedef {Object} ModulePermissions
 * @property {boolean} read - Pode ler
 * @property {boolean} write - Pode escrever
 * @property {boolean} viewDetails - Pode ver detalhes
 */

/**
 * Clinic secretary permissions
 * @typedef {Object} ClinicSecretaryPermissions
 * @property {ModulePermissions} patients - Permissões de pacientes
 * @property {ModulePermissions} appointments - Permissões de agenda
 * @property {ModulePermissions} prescriptions - Permissões de receitas
 * @property {ModulePermissions} exams - Permissões de exames
 * @property {ModulePermissions} notes - Permissões de notas
 * @property {ModulePermissions} financial - Permissões financeiras
 * @property {ModulePermissions} reports - Permissões de relatórios
 * @property {ModulePermissions} conversations - Permissões de conversas
 * @property {ModulePermissions} analytics - Permissões de analytics
 * @property {boolean} canCreatePatients - Pode criar pacientes
 * @property {boolean} canAssignToAnyDoctor - Pode agendar para qualquer médico
 * @property {boolean} canViewAllSchedules - Pode ver agenda de todos
 * @property {boolean} canManageWaitingRoom - Pode gerenciar sala de espera
 */

/**
 * Clinic secretary
 * @typedef {Object} ClinicSecretary
 * @property {string} id - UUID da secretária
 * @property {string} tenantId - UUID da clínica
 * @property {string} [userId] - UUID do usuário (se logou)
 * @property {string} name - Nome
 * @property {string} email - Email
 * @property {string} [phone] - Telefone
 * @property {string} [cpf] - CPF
 * @property {SecretaryScopeType} scopeType - Tipo de escopo
 * @property {string[]} [scopeDoctors] - IDs dos médicos (se scopeType = 'specific_doctors')
 * @property {string} [singleDoctorId] - ID do médico (se scopeType = 'single_doctor')
 * @property {ClinicSecretaryPermissions} permissions - Permissões
 * @property {boolean} active - Se está ativa
 * @property {Date} [lastLoginAt] - Último login
 * @property {number} loginCount - Contagem de logins
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} createdBy - UUID do criador
 * @property {Date} [deactivatedAt] - Data de desativação
 * @property {string} [deactivatedBy] - UUID de quem desativou
 */

// ============================================================================
// ROOM
// ============================================================================

/**
 * Consulting room
 * @typedef {Object} Room
 * @property {string} id - UUID da sala
 * @property {string} tenantId - UUID da clínica
 * @property {string} name - Nome da sala
 * @property {string} [description] - Descrição
 * @property {number} capacity - Capacidade
 * @property {string[]} equipment - Lista de equipamentos
 * @property {string} [color] - Cor (hex) para exibição no calendário
 * @property {boolean} active - Se está ativa
 * @property {number} displayOrder - Ordem de exibição
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

// ============================================================================
// CONFIRMATION CHANNEL
// ============================================================================

/**
 * Channel through which an appointment was confirmed
 * @typedef {'whatsapp' | 'phone' | 'email' | 'in_person' | 'app' | 'sms'} ConfirmationChannel
 */

// ============================================================================
// CLINIC SUMMARY
// ============================================================================

/**
 * Clinic summary for dashboard
 * @typedef {Object} ClinicSummary
 * @property {number} totalDoctors - Total de médicos
 * @property {number} activeDoctors - Médicos ativos
 * @property {number} totalSecretaries - Total de secretárias
 * @property {number} activeSecretaries - Secretárias ativas
 * @property {ClinicMode} clinicMode - Modo da clínica
 * @property {number} pendingInvites - Convites pendentes
 */

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO for inviting a doctor
 * @typedef {Object} InviteDoctorDto
 * @property {string} email - Email
 * @property {string} name - Nome
 * @property {string} crm - CRM
 * @property {string} ufCrm - UF do CRM
 * @property {string} [specialty] - Especialidade
 * @property {AssociationType} [associationType] - Tipo de associação
 * @property {DoctorAdditionalPermissions} [additionalPermissions] - Permissões
 * @property {number} [defaultRepassePercent] - Percentual de repasse
 */

/**
 * DTO for accepting invite
 * @typedef {Object} AcceptInviteDto
 * @property {string} inviteToken - Token do convite
 * @property {string} [password] - Senha (se criar conta nova)
 */

/**
 * DTO for creating clinic secretary
 * @typedef {Object} CreateClinicSecretaryDto
 * @property {string} name - Nome
 * @property {string} email - Email
 * @property {string} [phone] - Telefone
 * @property {string} [cpf] - CPF
 * @property {SecretaryScopeType} [scopeType] - Tipo de escopo
 * @property {string[]} [scopeDoctors] - IDs dos médicos
 * @property {string} [singleDoctorId] - ID do médico único
 * @property {ClinicSecretaryPermissions} [permissions] - Permissões
 * @property {string} [password] - Senha
 */

/**
 * DTO for updating clinic settings
 * @typedef {Object} UpdateClinicSettingsDto
 * @property {ClinicMode} [clinicMode] - Modo de operação
 * @property {boolean} [allowPatientSharing] - Permitir compartilhamento
 * @property {boolean} [requireDoctorAssignment] - Exigir atribuição
 * @property {number} [maxDoctors] - Limite de médicos
 * @property {number} [maxSecretaries] - Limite de secretárias
 * @property {number} [defaultAppointmentDuration] - Duração padrão
 */

/**
 * DTO for updating doctor permissions
 * @typedef {Object} UpdateDoctorPermissionsDto
 * @property {DoctorAdditionalPermissions} additionalPermissions - Permissões
 * @property {number} [defaultRepassePercent] - Percentual de repasse
 */

/**
 * DTO for creating room
 * @typedef {Object} CreateRoomDto
 * @property {string} name - Nome
 * @property {string} [description] - Descrição
 * @property {number} [capacity] - Capacidade
 * @property {string[]} [equipment] - Equipamentos
 * @property {string} [color] - Cor
 */

// ============================================================================
// PATIENT SHARING
// ============================================================================

/**
 * Patient sharing data
 * @typedef {Object} PatientSharingData
 * @property {string} responsavelId - ID do médico responsável
 * @property {boolean} shared - Se está compartilhado com todos
 * @property {string[]} sharedWith - IDs dos médicos com acesso
 */

/**
 * DTO for sharing patient
 * @typedef {Object} SharePatientDto
 * @property {string} patientId - ID do paciente
 * @property {string[]} doctorIds - IDs dos médicos para compartilhar
 */

// Export empty object to make this a module
export {};
