# DOCUMENTO TÉCNICO: ARQUITETURA MULTI-CLÍNICA E MULTI-MÉDICO

## Versão 1.0 | Dezembro 2025

---

# ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Análise da Situação Atual](#2-análise-da-situação-atual)
3. [Arquitetura Proposta](#3-arquitetura-proposta)
4. [Modelo de Dados - Backend (Rust)](#4-modelo-de-dados---backend-rust)
5. [Modelo de Dados - Frontend (Next.js)](#5-modelo-de-dados---frontend-nextjs)
6. [Sistema de Autenticação e Autorização](#6-sistema-de-autenticação-e-autorização)
7. [Sistema de Permissões](#7-sistema-de-permissões)
8. [Mudanças por Arquivo - Backend](#8-mudanças-por-arquivo---backend)
9. [Mudanças por Arquivo - Frontend](#9-mudanças-por-arquivo---frontend)
10. [Novos Arquivos a Criar](#10-novos-arquivos-a-criar)
11. [Migrações de Banco de Dados](#11-migrações-de-banco-de-dados)
12. [Estratégia de Migração](#12-estratégia-de-migração)
13. [Casos de Uso Detalhados](#13-casos-de-uso-detalhados)
14. [Considerações de Segurança](#14-considerações-de-segurança)
15. [Testes e Validação](#15-testes-e-validação)

---

# 1. RESUMO EXECUTIVO

## 1.1 Objetivo

Expandir a arquitetura do sistema de gerenciamento médico para suportar:

1. **Clínicas médicas** com múltiplos médicos
2. **Secretárias vinculadas à clínica** (não apenas a um médico específico)
3. **Médicos autônomos** que operam como "clínica de um médico" com acesso completo
4. **Agenda compartilhada** com múltiplos agendamentos no mesmo horário para médicos diferentes
5. **Separação clara** entre dados clínicos (por médico) e dados administrativos (por clínica)

## 1.2 Tipos de Usuários no Novo Sistema

| Tipo | Descrição | Acesso |
|------|-----------|--------|
| **Médico Autônomo** | Médico individual que é dono de sua própria "clínica virtual" | Tudo (pacientes, financeiro, agenda, fiscal) |
| **Clínica (Admin)** | Administrador da clínica multi-médico | Financeiro, agenda geral, fiscal, glosas, conversas |
| **Médico Vinculado** | Médico que trabalha em uma clínica | Seus pacientes, exames, receitas, anamneses, sua agenda |
| **Secretária de Clínica** | Vinculada à clínica, atende todos os médicos | Agenda de todos, cadastro de pacientes, conversas |
| **Secretária de Médico** | Vinculada a um médico específico (mantém compatibilidade) | Apenas dados do médico |

## 1.3 Princípios Arquiteturais

1. **Backward Compatibility**: Médicos atuais continuam funcionando sem mudanças
2. **Tenant = Clínica**: O conceito de `tenant_id` no backend Rust representa a clínica
3. **Médico Autônomo = Clínica de 1**: Médico solo cria automaticamente uma clínica para si
4. **Row-Level Security**: Dados sempre filtrados por `tenant_id` + `profissional_id` quando aplicável
5. **Gradual Adoption**: Médicos podem migrar para modelo clínica quando quiserem

---

# 2. ANÁLISE DA SITUAÇÃO ATUAL

## 2.1 Backend Rust (doctor-server)

### Estrutura de Domínio Atual

```
src/domain/
├── auth/
│   ├── entities.rs      # User, Tenant, Session, JwtClaims, AuthContext
│   ├── permissions.rs   # Permission enum (granular)
│   └── repository.rs
├── secretary/
│   ├── entities.rs      # Secretary, SecretaryPermissions
│   └── repository.rs
├── medical/
│   ├── entities.rs      # Paciente, Profissional, Prontuario, Convenio
│   └── repository.rs
├── billing/
│   ├── entities.rs      # Guia, ItemProcedimento, Repasse
│   ├── tiss.rs
│   └── glossa.rs
└── [outros domínios]
```

### Entidades-Chave Atuais

**Tenant (src/domain/auth/entities.rs:9-27)**
```rust
pub struct Tenant {
    pub id: Uuid,
    pub slug: String,           // "clinica-saude"
    pub name: String,
    pub cnpj: String,
    pub cnes: Option<String>,
    pub subscription_tier: SubscriptionTier,
    pub status: TenantStatus,
    pub settings: TenantSettings,
    // ...
}
```

**User (src/domain/auth/entities.rs:84-113)**
```rust
pub struct User {
    pub id: Uuid,
    pub tenant_id: Uuid,        // Vinculado a um tenant
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub profissional_id: Option<Uuid>,  // Se for médico
    pub firebase_uid: Option<String>,
    // ...
}
```

**UserRole (src/domain/auth/entities.rs:115-130)**
```rust
pub enum UserRole {
    SuperAdmin,      // Acesso total (interno)
    TenantAdmin,     // Admin da clínica
    Doctor,          // Médico
    Receptionist,    // Recepcionista
    BillingClerk,    // Faturista
    ReadOnly,        // Apenas leitura
}
```

**Secretary (src/domain/secretary/entities.rs:120-152)**
```rust
pub struct Secretary {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub doctor_id: Uuid,        // ⚠️ PROBLEMA: Vinculada a UM médico
    pub user_id: Option<Uuid>,
    pub name: String,
    pub email: String,
    pub permissions: SecretaryPermissions,
    pub active: bool,
    // ...
}
```

### Problemas Identificados

1. **Secretary.doctor_id**: Secretária vinculada a apenas um médico
2. **Sem conceito de "Clínica Admin"**: TenantAdmin existe mas não está sendo usado no frontend
3. **Profissional não tem vínculo com Tenant**: Precisa adicionar relacionamento explícito
4. **Agenda sem suporte a multi-médico**: Appointment não considera múltiplos profissionais

## 2.2 Frontend Next.js (stripe-mediconobolso)

### Estrutura Atual

```
app/components/
├── providers/
│   └── authProvider.jsx       # 1145 linhas - Estado de auth e secretárias
├── hooks/
│   ├── useSecretary.jsx       # Gerenciamento de secretárias
│   └── useModuleAccess.jsx    # Verificação de permissões
├── features/
│   └── secretary/             # Componentes de secretária
└── templates/
    └── [templates de páginas]

lib/services/
├── firebase/
│   ├── secretary.service.js   # Secretárias vinculadas a doctorId
│   └── [outros services]
└── api/
    └── secretary.service.js   # API de secretárias
```

### Problemas no Frontend

1. **authProvider.jsx**: Estados `workingDoctorId` e `isSecretary` não suportam multi-médico
2. **secretary.service.js**: Todas as operações usam `doctorId` fixo
3. **Sem conceito de "Clínica"**: Não há tela de gerenciamento de clínica
4. **Agenda única**: Não suporta visualização por médico

---

# 3. ARQUITETURA PROPOSTA

## 3.1 Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLÍNICA (Tenant)                         │
│  - id, name, cnpj, cnes, subscription_tier                          │
│  - settings: { whatsapp, nfse, tiss, max_doctors, max_secretaries } │
└────────────────────────┬────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐
│  MÉDICO 1   │  │  MÉDICO 2   │  │ SECRETÁRIA CLÍNICA  │
│ (Doctor)    │  │ (Doctor)    │  │ (ClinicSecretary)   │
│             │  │             │  │                     │
│ profissional│  │ profissional│  │ - clinic_id         │
│ _id         │  │ _id         │  │ - doctors: [1,2,*]  │
└──────┬──────┘  └──────┬──────┘  │ - permissions       │
       │                │         └─────────────────────┘
       │                │
       ▼                ▼
┌─────────────────────────────────────────┐
│         PACIENTES (por tenant)          │
│  - id, tenant_id, responsavel_id        │
│  - responsavel_id = médico que criou    │
│  - compartilhado = boolean              │
└─────────────────────────────────────────┘
       │
       ├──► Consultas (por médico atendente)
       ├──► Exames (por médico solicitante)
       ├──► Receitas (por médico prescritor)
       └──► Anamneses (por médico autor)

┌─────────────────────────────────────────┐
│         AGENDA (por clínica)            │
│  - tenant_id, profissional_id           │
│  - Permite N agendamentos/horário       │
│  - Filtro por médico                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│    FINANCEIRO (por clínica)             │
│  - Guias TISS                           │
│  - NFSe                                 │
│  - Glosas                               │
│  - Repasses (por profissional)          │
└─────────────────────────────────────────┘
```

## 3.2 Tipos de Configuração de Usuário

### Cenário 1: Médico Autônomo (Atual - Sem Mudanças)

```
Médico João
  └── É TenantAdmin da "Clínica Dr. João" (criada automaticamente)
  └── É único Doctor do tenant
  └── Pode criar secretárias vinculadas a ele (compatibilidade)
  └── Acesso: TUDO
```

### Cenário 2: Clínica Multi-Médico

```
Clínica ABC
  └── Admin: Maria (TenantAdmin, sem ser médica)
  │     └── Acesso: Financeiro, Agenda, NFSe, TISS, Glosas, Conversas
  │
  ├── Médico João (Doctor)
  │     └── Acesso: Seus pacientes, exames, receitas, sua agenda
  │
  ├── Médico Pedro (Doctor)
  │     └── Acesso: Seus pacientes, exames, receitas, sua agenda
  │
  └── Secretária Ana (ClinicSecretary)
        └── Acesso: Agenda de todos, cadastro de pacientes, conversas
```

### Cenário 3: Médico com Acesso Expandido

```
Médico João (em Clínica ABC)
  └── Role: Doctor + FinancialAccess
  └── Acesso: Seus pacientes + Financeiro da clínica
```

## 3.3 Matriz de Permissões por Role

| Recurso | SuperAdmin | TenantAdmin | Doctor | ClinicSecretary | DoctorSecretary |
|---------|------------|-------------|--------|-----------------|-----------------|
| **Pacientes** |
| - Listar todos | ✓ | ✓ | ✓¹ | ✓² | ✓³ |
| - Criar | ✓ | ✓ | ✓ | ✓ | ✓ |
| - Editar | ✓ | ✓ | ✓¹ | ✓² | ✓³ |
| - Ver detalhes médicos | ✓ | ✗ | ✓¹ | ✗ | Conf. |
| **Prontuários/Exames/Receitas** |
| - Listar | ✓ | ✗ | ✓¹ | ✗ | Conf. |
| - Criar | ✓ | ✗ | ✓ | ✗ | ✗ |
| - Editar | ✓ | ✗ | ✓¹ | ✗ | ✗ |
| **Agenda** |
| - Ver agenda geral | ✓ | ✓ | ✓ | ✓ | ✓³ |
| - Criar agendamento | ✓ | ✓ | ✓ | ✓ | ✓ |
| - Editar qualquer | ✓ | ✓ | ✓¹ | ✓ | ✓³ |
| **Financeiro** |
| - Guias TISS | ✓ | ✓ | ✓⁴ | ✗ | ✗ |
| - NFSe | ✓ | ✓ | ✓⁴ | ✗ | ✗ |
| - Glosas | ✓ | ✓ | ✓⁴ | ✗ | ✗ |
| - Repasses | ✓ | ✓ | ✓¹ | ✗ | ✗ |
| **Comunicação** |
| - WhatsApp | ✓ | ✓ | ✓ | ✓ | Conf. |
| - Facebook | ✓ | ✓ | ✓ | ✓ | Conf. |
| **Admin** |
| - Gerenciar médicos | ✓ | ✓ | ✗ | ✗ | ✗ |
| - Gerenciar secretárias | ✓ | ✓ | ✓⁵ | ✗ | ✗ |
| - Configurações clínica | ✓ | ✓ | ✗ | ✗ | ✗ |

**Legenda:**
- ✓¹ = Apenas seus próprios (onde é responsável/autor)
- ✓² = De todos os médicos da clínica (cadastro básico)
- ✓³ = Apenas do médico vinculado
- ✓⁴ = Se tiver permissão `FinancialAccess` adicional
- ✓⁵ = Apenas suas próprias secretárias
- Conf. = Conforme configuração de permissões

---

# 4. MODELO DE DADOS - BACKEND (RUST)

## 4.1 Novas Entidades

### 4.1.1 ClinicSettings (Expandido)

**Arquivo:** `src/domain/auth/entities.rs`

```rust
/// Configurações específicas do tenant/clínica (EXPANDIDO)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TenantSettings {
    // Funcionalidades
    pub whatsapp_enabled: bool,
    pub nfse_enabled: bool,
    pub tiss_enabled: bool,
    pub facebook_enabled: bool,
    pub ai_enabled: bool,

    // Limites
    pub max_users: Option<i32>,
    pub max_patients: Option<i32>,
    pub max_doctors: Option<i32>,          // NOVO
    pub max_secretaries: Option<i32>,      // NOVO

    // Configurações de clínica
    pub clinic_mode: ClinicMode,           // NOVO
    pub allow_patient_sharing: bool,       // NOVO
    pub require_doctor_assignment: bool,   // NOVO

    // Timezone e localização
    pub timezone: String,
    pub default_appointment_duration: i32, // NOVO (minutos)
}

/// Modo de operação da clínica
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ClinicMode {
    #[default]
    Solo,           // Médico autônomo (comportamento atual)
    MultiDoctor,    // Clínica com múltiplos médicos
}
```

### 4.1.2 UserRole (Expandido)

**Arquivo:** `src/domain/auth/entities.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    // Roles existentes
    SuperAdmin,
    TenantAdmin,
    Doctor,
    Receptionist,
    BillingClerk,
    ReadOnly,

    // NOVOS ROLES
    ClinicSecretary,     // Secretária de clínica (atende todos os médicos)
    DoctorSecretary,     // Secretária de médico específico (compatibilidade)
    ClinicManager,       // Gerente de clínica (financeiro sem ser admin)
}
```

### 4.1.3 DoctorClinicAssociation (NOVA)

**Arquivo:** `src/domain/clinic/entities.rs` (NOVO ARQUIVO)

```rust
//! Entidades do domínio de Clínica Multi-Médico

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Associação entre médico e clínica
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoctorClinicAssociation {
    pub id: Uuid,
    pub tenant_id: Uuid,                    // ID da clínica
    pub profissional_id: Uuid,              // ID do profissional/médico
    pub user_id: Uuid,                      // ID do usuário

    // Tipo de vínculo
    pub association_type: AssociationType,

    // Permissões adicionais para o médico nesta clínica
    pub additional_permissions: DoctorAdditionalPermissions,

    // Status
    pub active: bool,
    pub joined_at: DateTime<Utc>,
    pub left_at: Option<DateTime<Utc>>,

    // Configurações de repasse (financeiro)
    pub default_repasse_percent: Option<rust_decimal::Decimal>,

    // Auditoria
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub invited_by: Option<Uuid>,
}

/// Tipo de associação do médico com a clínica
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AssociationType {
    Owner,          // Dono/fundador da clínica
    Partner,        // Sócio
    Employee,       // Funcionário (CLT)
    Contractor,     // Prestador de serviço
    Guest,          // Convidado temporário
}

/// Permissões adicionais que um médico pode ter na clínica
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DoctorAdditionalPermissions {
    pub can_view_financial: bool,           // Ver dados financeiros da clínica
    pub can_manage_financial: bool,         // Gerenciar financeiro
    pub can_view_all_patients: bool,        // Ver pacientes de outros médicos
    pub can_issue_nfse: bool,               // Emitir NFSe
    pub can_manage_secretaries: bool,       // Gerenciar secretárias da clínica
    pub can_view_analytics: bool,           // Ver analytics/relatórios
    pub can_manage_whatsapp: bool,          // Gerenciar WhatsApp da clínica
    pub can_manage_facebook: bool,          // Gerenciar Facebook da clínica
}

impl DoctorClinicAssociation {
    pub fn new(
        tenant_id: Uuid,
        profissional_id: Uuid,
        user_id: Uuid,
        association_type: AssociationType,
        invited_by: Option<Uuid>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            tenant_id,
            profissional_id,
            user_id,
            association_type,
            additional_permissions: DoctorAdditionalPermissions::default(),
            active: true,
            joined_at: now,
            left_at: None,
            default_repasse_percent: None,
            created_at: now,
            updated_at: now,
            invited_by,
        }
    }

    /// Owner tem todas as permissões adicionais por padrão
    pub fn new_owner(
        tenant_id: Uuid,
        profissional_id: Uuid,
        user_id: Uuid,
    ) -> Self {
        let mut assoc = Self::new(
            tenant_id,
            profissional_id,
            user_id,
            AssociationType::Owner,
            None,
        );
        assoc.additional_permissions = DoctorAdditionalPermissions {
            can_view_financial: true,
            can_manage_financial: true,
            can_view_all_patients: true,
            can_issue_nfse: true,
            can_manage_secretaries: true,
            can_view_analytics: true,
            can_manage_whatsapp: true,
            can_manage_facebook: true,
        };
        assoc
    }
}

/// DTO para convidar médico para clínica
#[derive(Debug, Deserialize)]
pub struct InviteDoctorDto {
    pub email: String,
    pub name: String,
    pub crm: String,
    pub uf_crm: String,
    pub specialty: String,
    pub association_type: AssociationType,
    pub additional_permissions: Option<DoctorAdditionalPermissions>,
    pub default_repasse_percent: Option<rust_decimal::Decimal>,
}

/// DTO para médico aceitar convite
#[derive(Debug, Deserialize)]
pub struct AcceptInviteDto {
    pub invite_token: String,
    pub password: Option<String>,  // Se for criar conta nova
}

/// Convite pendente para médico
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoctorInvite {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub email: String,
    pub name: String,
    pub crm: String,
    pub uf_crm: String,
    pub specialty: String,
    pub association_type: AssociationType,
    pub additional_permissions: DoctorAdditionalPermissions,
    pub default_repasse_percent: Option<rust_decimal::Decimal>,
    pub token: String,
    pub expires_at: DateTime<Utc>,
    pub accepted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub created_by: Uuid,
}
```

### 4.1.4 ClinicSecretary (NOVA ENTIDADE)

**Arquivo:** `src/domain/secretary/entities.rs` (EXPANDIDO)

```rust
// Adicionar ao arquivo existente

/// Secretária de Clínica (atende múltiplos médicos)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClinicSecretary {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Option<Uuid>,

    // Dados básicos
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub cpf: Option<String>,

    // Vínculo com médicos
    pub scope: SecretaryScope,

    // Permissões
    pub permissions: ClinicSecretaryPermissions,

    // Status
    pub active: bool,

    // Tracking
    pub last_login_at: Option<DateTime<Utc>>,
    pub login_count: i32,

    // Auditoria
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Uuid,
    pub deactivated_at: Option<DateTime<Utc>>,
    pub deactivated_by: Option<Uuid>,
}

/// Escopo de atuação da secretária
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SecretaryScope {
    /// Atende toda a clínica (todos os médicos)
    AllDoctors,
    /// Atende apenas médicos específicos
    SpecificDoctors(Vec<Uuid>),
    /// Atende apenas um médico (compatibilidade com modelo antigo)
    SingleDoctor(Uuid),
}

/// Permissões de secretária de clínica
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ClinicSecretaryPermissions {
    // Módulos base (igual SecretaryPermissions)
    pub patients: ModulePermissions,
    pub appointments: ModulePermissions,
    pub prescriptions: ModulePermissions,
    pub exams: ModulePermissions,
    pub notes: ModulePermissions,
    pub financial: ModulePermissions,
    pub reports: ModulePermissions,

    // Permissões adicionais de clínica
    pub conversations: ModulePermissions,  // WhatsApp/Facebook
    pub analytics: ModulePermissions,      // Dashboards

    // Ações especiais
    pub can_create_patients: bool,
    pub can_assign_to_any_doctor: bool,    // Pode agendar para qualquer médico
    pub can_view_all_schedules: bool,      // Pode ver agenda de todos
    pub can_manage_waiting_room: bool,     // Gerenciar sala de espera
}

impl ClinicSecretaryPermissions {
    /// Permissões padrão para secretária de clínica
    pub fn default_clinic() -> Self {
        Self {
            patients: ModulePermissions { read: true, write: true, view_details: false },
            appointments: ModulePermissions::full(),
            prescriptions: ModulePermissions::read_only(),
            exams: ModulePermissions::read_only(),
            notes: ModulePermissions::read_only(),
            financial: ModulePermissions::default(),
            reports: ModulePermissions::read_only(),
            conversations: ModulePermissions::read_write(),
            analytics: ModulePermissions::read_only(),
            can_create_patients: true,
            can_assign_to_any_doctor: true,
            can_view_all_schedules: true,
            can_manage_waiting_room: true,
        }
    }
}

impl ClinicSecretary {
    pub fn new_clinic_wide(
        tenant_id: Uuid,
        name: String,
        email: String,
        created_by: Uuid,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            tenant_id,
            user_id: None,
            name,
            email,
            phone: None,
            cpf: None,
            scope: SecretaryScope::AllDoctors,
            permissions: ClinicSecretaryPermissions::default_clinic(),
            active: true,
            last_login_at: None,
            login_count: 0,
            created_at: now,
            updated_at: now,
            created_by,
            deactivated_at: None,
            deactivated_by: None,
        }
    }

    /// Verifica se pode acessar dados de um médico específico
    pub fn can_access_doctor(&self, doctor_id: Uuid) -> bool {
        match &self.scope {
            SecretaryScope::AllDoctors => true,
            SecretaryScope::SpecificDoctors(ids) => ids.contains(&doctor_id),
            SecretaryScope::SingleDoctor(id) => *id == doctor_id,
        }
    }
}
```

### 4.1.5 Paciente (Expandido)

**Arquivo:** `src/domain/medical/entities.rs` (MODIFICAR)

```rust
/// Entidade: Paciente (EXPANDIDO PARA MULTI-MÉDICO)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paciente {
    pub id: Uuid,
    pub tenant_id: Uuid,

    // NOVO: Médico responsável principal
    pub responsavel_id: Uuid,              // Médico que criou/é responsável

    // NOVO: Compartilhamento
    pub shared: bool,                       // Se outros médicos da clínica podem ver
    pub shared_with: Option<Vec<Uuid>>,     // IDs de médicos com acesso (se shared=false)

    // ... resto dos campos existentes ...
    pub nome_completo: String,
    pub cpf: String,
    // ...

    // NOVO: Tracking de acesso
    pub last_accessed_by: Option<Uuid>,
    pub last_accessed_at: Option<DateTime<Utc>>,
}
```

### 4.1.6 Appointment (Expandido)

**Arquivo:** `src/domain/scheduling/entities.rs` (MODIFICAR)

```rust
/// Entidade: Agendamento (EXPANDIDO PARA MULTI-MÉDICO)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Appointment {
    pub id: Uuid,
    pub tenant_id: Uuid,

    // Relacionamentos
    pub paciente_id: Uuid,
    pub profissional_id: Uuid,             // Médico que vai atender

    // NOVO: Quem criou o agendamento (pode ser secretária)
    pub created_by_user_id: Uuid,
    pub created_by_role: UserRole,

    // Horário
    pub data_hora_inicio: DateTime<Utc>,
    pub data_hora_fim: DateTime<Utc>,
    pub duracao_minutos: i32,

    // NOVO: Sala/consultório (para clínicas com múltiplas salas)
    pub room_id: Option<Uuid>,
    pub room_name: Option<String>,

    // Status
    pub status: AppointmentStatus,
    pub tipo: AppointmentType,

    // Telemedicina
    pub is_telemedicine: bool,
    pub room_link: Option<String>,

    // Observações
    pub motivo_consulta: Option<String>,
    pub observacoes: Option<String>,

    // NOVO: Confirmação
    pub confirmed: bool,
    pub confirmed_at: Option<DateTime<Utc>>,
    pub confirmed_via: Option<ConfirmationChannel>,

    // Auditoria
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub cancelled_by: Option<Uuid>,
    pub cancellation_reason: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConfirmationChannel {
    WhatsApp,
    Phone,
    Email,
    InPerson,
    App,
}
```

## 4.2 Modificações em Entidades Existentes

### 4.2.1 AuthContext (Expandido)

**Arquivo:** `src/domain/auth/entities.rs`

```rust
/// Contexto de autenticação (extraído do request) - EXPANDIDO
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub tenant_id: Uuid,
    pub role: UserRole,
    pub email: String,
    pub name: String,
    pub firebase_uid: Option<String>,

    // NOVOS CAMPOS
    pub profissional_id: Option<Uuid>,      // Se for médico
    pub is_clinic_mode: bool,               // Se a clínica está em modo multi-médico
    pub association_type: Option<AssociationType>,  // Tipo de vínculo (se médico)
    pub additional_permissions: Option<DoctorAdditionalPermissions>, // Permissões extras
    pub secretary_scope: Option<SecretaryScope>,    // Se for secretária
}

impl AuthContext {
    // ... métodos existentes ...

    /// Verifica se pode acessar dados de um médico específico
    pub fn can_access_doctor_data(&self, doctor_id: Uuid) -> bool {
        // SuperAdmin e TenantAdmin podem tudo
        if self.is_admin() {
            return true;
        }

        // Médico pode acessar seus próprios dados
        if let Some(prof_id) = self.profissional_id {
            if prof_id == doctor_id {
                return true;
            }
            // Se tem permissão de ver todos os pacientes
            if let Some(ref perms) = self.additional_permissions {
                if perms.can_view_all_patients {
                    return true;
                }
            }
        }

        // Secretária de clínica verifica escopo
        if let Some(ref scope) = self.secretary_scope {
            return match scope {
                SecretaryScope::AllDoctors => true,
                SecretaryScope::SpecificDoctors(ids) => ids.contains(&doctor_id),
                SecretaryScope::SingleDoctor(id) => *id == doctor_id,
            };
        }

        false
    }

    /// Verifica se pode gerenciar financeiro
    pub fn can_manage_financial(&self) -> bool {
        if self.is_admin() {
            return true;
        }
        if let Some(ref perms) = self.additional_permissions {
            return perms.can_manage_financial;
        }
        false
    }
}
```

---

# 5. MODELO DE DADOS - FRONTEND (NEXT.JS)

## 5.1 Novos Tipos TypeScript/JSDoc

### 5.1.1 Arquivo: `lib/types/clinic.types.js` (NOVO)

```javascript
/**
 * @typedef {Object} Clinic
 * @property {string} id - UUID da clínica
 * @property {string} slug - Slug único (ex: "clinica-abc")
 * @property {string} name - Nome da clínica
 * @property {string} cnpj - CNPJ
 * @property {string} [cnes] - CNES (Cadastro Nacional)
 * @property {ClinicSettings} settings - Configurações
 * @property {'solo'|'multi_doctor'} clinicMode - Modo de operação
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ClinicSettings
 * @property {boolean} whatsappEnabled
 * @property {boolean} nfseEnabled
 * @property {boolean} tissEnabled
 * @property {boolean} facebookEnabled
 * @property {boolean} aiEnabled
 * @property {number} [maxDoctors]
 * @property {number} [maxSecretaries]
 * @property {boolean} allowPatientSharing
 * @property {boolean} requireDoctorAssignment
 * @property {string} timezone
 * @property {number} defaultAppointmentDuration
 */

/**
 * @typedef {Object} DoctorAssociation
 * @property {string} id
 * @property {string} clinicId
 * @property {string} professionalId
 * @property {string} userId
 * @property {'owner'|'partner'|'employee'|'contractor'|'guest'} associationType
 * @property {DoctorAdditionalPermissions} additionalPermissions
 * @property {boolean} active
 * @property {Date} joinedAt
 * @property {number} [defaultRepassePercent]
 */

/**
 * @typedef {Object} DoctorAdditionalPermissions
 * @property {boolean} canViewFinancial
 * @property {boolean} canManageFinancial
 * @property {boolean} canViewAllPatients
 * @property {boolean} canIssueNfse
 * @property {boolean} canManageSecretaries
 * @property {boolean} canViewAnalytics
 * @property {boolean} canManageWhatsapp
 * @property {boolean} canManageFacebook
 */

/**
 * @typedef {Object} ClinicSecretary
 * @property {string} id
 * @property {string} clinicId
 * @property {string} [userId]
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {SecretaryScope} scope
 * @property {ClinicSecretaryPermissions} permissions
 * @property {boolean} active
 * @property {Date} [lastLoginAt]
 * @property {number} loginCount
 */

/**
 * @typedef {'all_doctors'|{specificDoctors: string[]}|{singleDoctor: string}} SecretaryScope
 */

/**
 * @typedef {Object} ClinicSecretaryPermissions
 * @property {ModulePermissions} patients
 * @property {ModulePermissions} appointments
 * @property {ModulePermissions} prescriptions
 * @property {ModulePermissions} exams
 * @property {ModulePermissions} notes
 * @property {ModulePermissions} financial
 * @property {ModulePermissions} reports
 * @property {ModulePermissions} conversations
 * @property {ModulePermissions} analytics
 * @property {boolean} canCreatePatients
 * @property {boolean} canAssignToAnyDoctor
 * @property {boolean} canViewAllSchedules
 * @property {boolean} canManageWaitingRoom
 */

export {};
```

## 5.2 Modificações no AuthProvider

### 5.2.1 Novos Estados

**Arquivo:** `app/components/providers/authProvider.jsx`

```javascript
// ADICIONAR aos estados existentes (linha ~52)

// ✅ ESTADOS PARA SISTEMA MULTI-CLÍNICA
const [clinicMode, setClinicMode] = useState('solo'); // 'solo' | 'multi_doctor'
const [clinicData, setClinicData] = useState(null);   // Dados da clínica
const [doctorAssociation, setDoctorAssociation] = useState(null); // Associação do médico
const [accessibleDoctors, setAccessibleDoctors] = useState([]); // Médicos que pode acessar
const [currentDoctorFilter, setCurrentDoctorFilter] = useState(null); // Filtro de médico ativo
```

### 5.2.2 Novo Contexto Unificado

```javascript
// MODIFICAR getUserUnifiedContextCached (linha ~228)

const getUserUnifiedContextCached = useCallback(async (userId, forceRefresh = false) => {
    // ... código existente ...

    return await globalCache.getOrSet('userContext', userId, async () => {
        // ... verificações existentes ...

        // NOVO: Buscar dados da clínica
        const clinicResponse = await fetch(`${API_URL}/api/v1/clinics/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const clinicData = await clinicResponse.json();

        // NOVO: Determinar modo da clínica
        const isMultiDoctor = clinicData.settings?.clinic_mode === 'multi_doctor';

        // NOVO: Se for médico em clínica multi-médico, buscar associação
        let doctorAssociation = null;
        let accessibleDoctors = [];

        if (context.userType === 'doctor' && isMultiDoctor) {
            const assocResponse = await fetch(
                `${API_URL}/api/v1/clinics/doctors/me/association`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            doctorAssociation = await assocResponse.json();

            // Se pode ver todos os pacientes, buscar lista de médicos
            if (doctorAssociation.additional_permissions?.can_view_all_patients) {
                const doctorsResponse = await fetch(
                    `${API_URL}/api/v1/clinics/doctors`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                accessibleDoctors = await doctorsResponse.json();
            } else {
                accessibleDoctors = [{ id: context.workingDoctorId, ...context.userData }];
            }
        }

        // NOVO: Se for secretária de clínica
        if (context.isSecretary && isMultiDoctor) {
            const scope = context.secretaryData?.scope;
            if (scope === 'all_doctors' || scope?.specificDoctors) {
                const doctorsResponse = await fetch(
                    `${API_URL}/api/v1/clinics/doctors`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const allDoctors = await doctorsResponse.json();

                if (scope === 'all_doctors') {
                    accessibleDoctors = allDoctors;
                } else {
                    accessibleDoctors = allDoctors.filter(d =>
                        scope.specificDoctors.includes(d.id)
                    );
                }
            }
        }

        return {
            ...context,
            clinicMode: isMultiDoctor ? 'multi_doctor' : 'solo',
            clinicData,
            doctorAssociation,
            accessibleDoctors,
        };
    }, forceRefresh ? 1000 : 5 * 60 * 1000);
}, []);
```

### 5.2.3 Novas Funções de Acesso

```javascript
// ADICIONAR novas funções ao AuthProvider

/**
 * Verifica se pode acessar dados de um médico específico
 */
const canAccessDoctorData = useCallback((doctorId) => {
    // Admin sempre pode
    if (user?.administrador || user?.role === 'tenant_admin') {
        return true;
    }

    // Modo solo: só pode acessar seus próprios dados
    if (clinicMode === 'solo') {
        return workingDoctorId === doctorId;
    }

    // Modo multi-médico: verificar na lista de acessíveis
    return accessibleDoctors.some(d => d.id === doctorId);
}, [user, clinicMode, workingDoctorId, accessibleDoctors]);

/**
 * Verifica se pode gerenciar financeiro
 */
const canManageFinancial = useCallback(() => {
    if (user?.administrador || user?.role === 'tenant_admin') {
        return true;
    }
    if (doctorAssociation?.additional_permissions?.can_manage_financial) {
        return true;
    }
    // Médico solo tem acesso total
    if (clinicMode === 'solo' && !isSecretary) {
        return true;
    }
    return false;
}, [user, doctorAssociation, clinicMode, isSecretary]);

/**
 * Retorna lista de médicos para filtro
 */
const getDoctorsForFilter = useCallback(() => {
    if (clinicMode === 'solo') {
        return [{ id: workingDoctorId, name: user?.fullName }];
    }
    return accessibleDoctors;
}, [clinicMode, workingDoctorId, accessibleDoctors, user]);

/**
 * Define filtro de médico para visualização
 */
const setDoctorFilter = useCallback((doctorId) => {
    if (doctorId && !canAccessDoctorData(doctorId)) {
        console.error('Acesso negado ao médico:', doctorId);
        return false;
    }
    setCurrentDoctorFilter(doctorId);
    return true;
}, [canAccessDoctorData]);
```

### 5.2.4 Context Value Expandido

```javascript
// MODIFICAR contextValue (linha ~1085)

const contextValue = useMemo(() => ({
    // Estados existentes
    user, loading, isFreeUser, logout, hasFreeTrialOffer, referralSource,
    isSecretary, workingDoctorId, permissions, userContext,

    // Funções existentes
    hasModulePermission, canViewSensitiveData, createSecretaryAccount,
    updateSecretaryPermissions, deactivateSecretary, getEffectiveUserId,
    getDisplayUserData, reloadUserContext, clearRelatedCaches,
    forceRefreshUserContext, markAsNewlyCreated, updateUserModules,
    upgradeUserPlan, migrateFromLegacy, isProtectedRoute, isPublicRoute,

    // ✅ NOVOS ESTADOS E FUNÇÕES MULTI-CLÍNICA
    clinicMode,
    clinicData,
    doctorAssociation,
    accessibleDoctors,
    currentDoctorFilter,

    canAccessDoctorData,
    canManageFinancial,
    getDoctorsForFilter,
    setDoctorFilter,

    // Helpers
    isMultiDoctorClinic: clinicMode === 'multi_doctor',
    isSoloDoctor: clinicMode === 'solo' && !isSecretary,
    isClinicAdmin: user?.role === 'tenant_admin',

    // Verificações de usuário existentes
    isLegacyUser: user ? checkIfLegacyUser(user) : false,
    userHasAccess: user ? userHasAccess(user) : false,
    userHasValidData: user ? userHasValidData(user) : false,
}), [
    // ... dependências existentes ...,
    clinicMode, clinicData, doctorAssociation, accessibleDoctors,
    currentDoctorFilter, canAccessDoctorData, canManageFinancial,
    getDoctorsForFilter, setDoctorFilter,
]);
```

---

# 6. SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO

## 6.1 Fluxo de Login Expandido

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOGIN (Firebase Auth)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              VERIFICAR TIPO DE USUÁRIO NO BACKEND                   │
│                                                                     │
│  1. Buscar em `users` por firebase_uid                              │
│  2. Se encontrou: verificar role                                    │
│  3. Se não encontrou: buscar em `clinic_secretaries`                │
│  4. Se não encontrou: buscar em `secretaries` (legacy)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│  TenantAdmin    │  │     Doctor      │  │  ClinicSecretary /      │
│                 │  │                 │  │  DoctorSecretary        │
│ - clinicData    │  │ - association   │  │                         │
│ - allDoctors    │  │ - permissions   │  │ - scope                 │
│ - fullAccess    │  │ - accessScope   │  │ - permissions           │
└─────────────────┘  └─────────────────┘  └─────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MONTAR AuthContext                               │
│                                                                     │
│  {                                                                  │
│    user_id, tenant_id, role, email, name,                           │
│    profissional_id, is_clinic_mode, association_type,               │
│    additional_permissions, secretary_scope                          │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.2 Middleware de Autorização (Backend)

**Arquivo:** `src/middleware/auth.rs` (EXPANDIR)

```rust
/// Extrai e valida o contexto de autenticação do request
pub async fn extract_auth_context(
    req: &HttpRequest,
    pool: &PgPool,
) -> Result<AuthContext, ApiError> {
    // ... validação de token existente ...

    let user = get_user_by_firebase_uid(pool, &firebase_uid).await?;

    // Buscar dados adicionais baseado no role
    let (association, secretary_scope) = match user.role {
        UserRole::Doctor => {
            let assoc = get_doctor_association(pool, user.tenant_id, user.id).await?;
            (Some(assoc), None)
        }
        UserRole::ClinicSecretary | UserRole::DoctorSecretary => {
            let secretary = get_secretary_by_user_id(pool, user.id).await?;
            (None, Some(secretary.scope))
        }
        _ => (None, None),
    };

    // Buscar configurações da clínica
    let tenant = get_tenant(pool, user.tenant_id).await?;
    let is_clinic_mode = tenant.settings.clinic_mode == ClinicMode::MultiDoctor;

    Ok(AuthContext {
        user_id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        email: user.email,
        name: user.name,
        firebase_uid: user.firebase_uid,
        profissional_id: user.profissional_id,
        is_clinic_mode,
        association_type: association.as_ref().map(|a| a.association_type),
        additional_permissions: association.map(|a| a.additional_permissions),
        secretary_scope,
    })
}
```

---

# 7. SISTEMA DE PERMISSÕES

## 7.1 Permission Guards (Backend)

**Arquivo:** `src/middleware/permissions.rs` (NOVO)

```rust
//! Guards de permissão para handlers

use crate::domain::auth::entities::{AuthContext, Permission, UserRole};
use crate::api::error::ApiError;
use uuid::Uuid;

/// Verifica se pode acessar dados de um médico específico
pub fn can_access_doctor_data(ctx: &AuthContext, doctor_id: Uuid) -> Result<(), ApiError> {
    if ctx.can_access_doctor_data(doctor_id) {
        Ok(())
    } else {
        Err(ApiError::Forbidden("Acesso negado aos dados deste médico".into()))
    }
}

/// Verifica se pode acessar dados de um paciente
pub async fn can_access_patient(
    ctx: &AuthContext,
    pool: &PgPool,
    patient_id: Uuid,
) -> Result<(), ApiError> {
    // Buscar paciente
    let patient = get_patient(pool, patient_id).await?;

    // Verificar tenant
    if patient.tenant_id != ctx.tenant_id {
        return Err(ApiError::Forbidden("Paciente não pertence a esta clínica".into()));
    }

    // Admin pode tudo
    if ctx.is_admin() {
        return Ok(());
    }

    // Verificar se é o responsável ou se está compartilhado
    if let Some(prof_id) = ctx.profissional_id {
        if patient.responsavel_id == prof_id {
            return Ok(());
        }
        if patient.shared {
            // Verificar se tem permissão de ver todos
            if let Some(ref perms) = ctx.additional_permissions {
                if perms.can_view_all_patients {
                    return Ok(());
                }
            }
        }
        if let Some(ref shared_with) = patient.shared_with {
            if shared_with.contains(&prof_id) {
                return Ok(());
            }
        }
    }

    // Secretária verifica escopo
    if let Some(ref scope) = ctx.secretary_scope {
        match scope {
            SecretaryScope::AllDoctors => return Ok(()),
            SecretaryScope::SpecificDoctors(ids) => {
                if ids.contains(&patient.responsavel_id) {
                    return Ok(());
                }
            }
            SecretaryScope::SingleDoctor(id) => {
                if *id == patient.responsavel_id {
                    return Ok(());
                }
            }
        }
    }

    Err(ApiError::Forbidden("Acesso negado a este paciente".into()))
}

/// Macro para verificar permissão em handler
#[macro_export]
macro_rules! require_permission {
    ($ctx:expr, $permission:expr) => {
        if !$ctx.has_permission($permission) {
            return Err(ApiError::Forbidden(format!(
                "Permissão necessária: {:?}", $permission
            )));
        }
    };
}

/// Macro para verificar acesso a médico
#[macro_export]
macro_rules! require_doctor_access {
    ($ctx:expr, $doctor_id:expr) => {
        $crate::middleware::permissions::can_access_doctor_data($ctx, $doctor_id)?;
    };
}
```

## 7.2 Hook de Permissões (Frontend)

**Arquivo:** `app/components/hooks/useClinicPermissions.jsx` (NOVO)

```javascript
'use client';

import { useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';

/**
 * Hook para verificar permissões em contexto multi-clínica
 */
export function useClinicPermissions() {
    const {
        user,
        isSecretary,
        workingDoctorId,
        permissions,
        clinicMode,
        doctorAssociation,
        accessibleDoctors,
        canAccessDoctorData,
        canManageFinancial,
    } = useAuth();

    /**
     * Verifica se pode ver dados financeiros
     */
    const canViewFinancial = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (doctorAssociation?.additionalPermissions?.canViewFinancial) {
            return true;
        }
        if (clinicMode === 'solo' && !isSecretary) {
            return true;
        }
        if (isSecretary && permissions?.financial?.read) {
            return true;
        }
        return false;
    }, [user, doctorAssociation, clinicMode, isSecretary, permissions]);

    /**
     * Verifica se pode emitir NFSe
     */
    const canIssueNfse = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (doctorAssociation?.additionalPermissions?.canIssueNfse) {
            return true;
        }
        if (clinicMode === 'solo' && !isSecretary) {
            return true;
        }
        return false;
    }, [user, doctorAssociation, clinicMode, isSecretary]);

    /**
     * Verifica se pode gerenciar TISS/Glosas
     */
    const canManageTiss = useMemo(() => {
        return canViewFinancial; // Mesmas regras
    }, [canViewFinancial]);

    /**
     * Verifica se pode gerenciar WhatsApp da clínica
     */
    const canManageWhatsapp = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (doctorAssociation?.additionalPermissions?.canManageWhatsapp) {
            return true;
        }
        if (clinicMode === 'solo' && !isSecretary) {
            return true;
        }
        if (isSecretary && permissions?.conversations?.write) {
            return true;
        }
        return false;
    }, [user, doctorAssociation, clinicMode, isSecretary, permissions]);

    /**
     * Verifica se pode criar pacientes
     */
    const canCreatePatients = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (!isSecretary) {
            return true; // Médicos podem criar
        }
        // Secretária de clínica
        if (permissions?.canCreatePatients !== undefined) {
            return permissions.canCreatePatients;
        }
        // Secretária legacy
        return permissions?.patients?.write === true;
    }, [user, isSecretary, permissions]);

    /**
     * Verifica se pode agendar para qualquer médico
     */
    const canScheduleForAnyDoctor = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (clinicMode === 'solo') {
            return false; // Só tem um médico
        }
        if (isSecretary && permissions?.canAssignToAnyDoctor) {
            return true;
        }
        return false;
    }, [user, clinicMode, isSecretary, permissions]);

    /**
     * Verifica se pode ver agenda de todos os médicos
     */
    const canViewAllSchedules = useMemo(() => {
        if (user?.administrador || user?.role === 'tenant_admin') {
            return true;
        }
        if (clinicMode === 'solo') {
            return true; // Só tem um médico
        }
        if (isSecretary && permissions?.canViewAllSchedules) {
            return true;
        }
        if (doctorAssociation?.additionalPermissions?.canViewAllPatients) {
            return true; // Se vê pacientes de todos, vê agenda também
        }
        return false;
    }, [user, clinicMode, isSecretary, permissions, doctorAssociation]);

    /**
     * Retorna lista de médicos que pode ver na agenda
     */
    const getScheduleableDoctors = useCallback(() => {
        if (canViewAllSchedules) {
            return accessibleDoctors;
        }
        return accessibleDoctors.filter(d => canAccessDoctorData(d.id));
    }, [canViewAllSchedules, accessibleDoctors, canAccessDoctorData]);

    /**
     * Retorna lista de médicos que pode agendar para
     */
    const getAssignableDoctors = useCallback(() => {
        if (canScheduleForAnyDoctor) {
            return accessibleDoctors;
        }
        if (!isSecretary) {
            // Médico pode agendar para si mesmo
            return [{ id: workingDoctorId, name: user?.fullName }];
        }
        // Secretária de médico específico
        return accessibleDoctors.filter(d => canAccessDoctorData(d.id));
    }, [canScheduleForAnyDoctor, isSecretary, accessibleDoctors, workingDoctorId, user, canAccessDoctorData]);

    return {
        // Permissões
        canViewFinancial,
        canManageFinancial: canManageFinancial(),
        canIssueNfse,
        canManageTiss,
        canManageWhatsapp,
        canCreatePatients,
        canScheduleForAnyDoctor,
        canViewAllSchedules,

        // Helpers
        getScheduleableDoctors,
        getAssignableDoctors,

        // Acesso a médico específico
        canAccessDoctor: canAccessDoctorData,
    };
}

export default useClinicPermissions;
```

---

# 8. MUDANÇAS POR ARQUIVO - BACKEND

## 8.1 Arquivos a Modificar

### `src/domain/auth/entities.rs`

| Linha | Mudança | Descrição |
|-------|---------|-----------|
| 68-82 | EXPANDIR | `TenantSettings` - adicionar campos de clínica |
| 115-130 | EXPANDIR | `UserRole` - adicionar `ClinicSecretary`, `DoctorSecretary`, `ClinicManager` |
| 133-213 | MODIFICAR | `UserRole::permissions()` - adicionar permissões para novos roles |
| 269-289 | EXPANDIR | `AuthContext` - adicionar campos de multi-clínica |

### `src/domain/secretary/entities.rs`

| Linha | Mudança | Descrição |
|-------|---------|-----------|
| 120-152 | MANTER | `Secretary` - manter para compatibilidade |
| * | ADICIONAR | `ClinicSecretary` - nova entidade |
| * | ADICIONAR | `SecretaryScope` - enum de escopo |
| * | ADICIONAR | `ClinicSecretaryPermissions` - permissões expandidas |

### `src/domain/medical/entities.rs`

| Linha | Mudança | Descrição |
|-------|---------|-----------|
| 57-120 | EXPANDIR | `Paciente` - adicionar `responsavel_id`, `shared`, `shared_with` |
| 217-243 | EXPANDIR | `Profissional` - adicionar `tenant_id` constraint |

### `src/domain/scheduling/entities.rs`

| Linha | Mudança | Descrição |
|-------|---------|-----------|
| * | EXPANDIR | `Appointment` - adicionar `created_by_user_id`, `room_id`, `confirmed_*` |

### `src/api/patients.rs`

| Mudança | Descrição |
|---------|-----------|
| MODIFICAR | Todos os handlers devem verificar `can_access_patient()` |
| ADICIONAR | Filtro por `responsavel_id` na listagem |
| ADICIONAR | Parâmetro `shared` para compartilhar paciente |

### `src/api/appointments.rs`

| Mudança | Descrição |
|---------|-----------|
| MODIFICAR | Permitir múltiplos agendamentos no mesmo horário para médicos diferentes |
| ADICIONAR | Filtro por `profissional_id` |
| ADICIONAR | Validação de `room_id` para evitar conflitos de sala |

### `src/api/secretaries.rs`

| Mudança | Descrição |
|---------|-----------|
| MANTER | Endpoints existentes para compatibilidade |
| ADICIONAR | Novos endpoints para `ClinicSecretary` |

### `src/middleware/auth.rs`

| Mudança | Descrição |
|---------|-----------|
| EXPANDIR | `extract_auth_context()` - buscar dados de associação e escopo |

## 8.2 Novos Handlers

### `src/api/clinics.rs` (NOVO)

```rust
//! Handlers para gerenciamento de clínica multi-médico

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/clinics")
            // Info da clínica atual
            .route("/current", web::get().to(get_current_clinic))
            .route("/current/settings", web::put().to(update_clinic_settings))

            // Gerenciamento de médicos
            .route("/doctors", web::get().to(list_doctors))
            .route("/doctors/invite", web::post().to(invite_doctor))
            .route("/doctors/{id}", web::get().to(get_doctor))
            .route("/doctors/{id}/permissions", web::put().to(update_doctor_permissions))
            .route("/doctors/{id}/deactivate", web::post().to(deactivate_doctor))
            .route("/doctors/me/association", web::get().to(get_my_association))

            // Convites pendentes
            .route("/invites", web::get().to(list_pending_invites))
            .route("/invites/{id}/cancel", web::post().to(cancel_invite))
            .route("/invites/accept", web::post().to(accept_invite))

            // Secretárias de clínica
            .route("/secretaries", web::get().to(list_clinic_secretaries))
            .route("/secretaries", web::post().to(create_clinic_secretary))
            .route("/secretaries/{id}", web::get().to(get_clinic_secretary))
            .route("/secretaries/{id}", web::put().to(update_clinic_secretary))
            .route("/secretaries/{id}/scope", web::put().to(update_secretary_scope))
            .route("/secretaries/{id}/deactivate", web::post().to(deactivate_clinic_secretary))
    );
}
```

---

# 9. MUDANÇAS POR ARQUIVO - FRONTEND

## 9.1 Arquivos a Modificar

### `app/components/providers/authProvider.jsx`

| Linha Aprox. | Mudança | Descrição |
|--------------|---------|-----------|
| 52-64 | ADICIONAR | Novos estados para multi-clínica |
| 228-313 | EXPANDIR | `getUserUnifiedContextCached` - buscar dados de clínica |
| 366-376 | EXPANDIR | `hasModulePermission` - considerar permissões de clínica |
| 706-710 | EXPANDIR | `getEffectiveUserId` - considerar filtro de médico |
| 1085-1137 | EXPANDIR | `contextValue` - adicionar novas funções |

### `app/components/hooks/useModuleAccess.jsx`

| Mudança | Descrição |
|---------|-----------|
| EXPANDIR | Considerar `clinicMode` nas verificações |
| ADICIONAR | Funções de verificação de multi-médico |

### `app/components/templates/dashboardTemplate.jsx`

| Mudança | Descrição |
|---------|-----------|
| ADICIONAR | Seletor de médico (se multi-clínica) |
| MODIFICAR | Métricas filtradas por médico selecionado |

### `app/components/templates/patientsListTemplate.jsx`

| Mudança | Descrição |
|---------|-----------|
| ADICIONAR | Filtro por médico responsável |
| ADICIONAR | Indicador de paciente compartilhado |
| MODIFICAR | Botão de compartilhar paciente |

### `lib/services/api/patients.service.js`

| Mudança | Descrição |
|---------|-----------|
| MODIFICAR | `listPatients` - aceitar parâmetro `doctorId` |
| ADICIONAR | `sharePatient(patientId, doctorIds)` |
| ADICIONAR | `unsharePatient(patientId, doctorIds)` |

### `lib/services/api/appointments.service.js`

| Mudança | Descrição |
|---------|-----------|
| MODIFICAR | `listAppointments` - aceitar parâmetro `doctorId` ou `allDoctors` |
| MODIFICAR | `createAppointment` - incluir `professionalId` |

### `lib/services/firebase/secretary.service.js`

| Mudança | Descrição |
|---------|-----------|
| MANTER | Para compatibilidade com secretárias existentes |

### Sidebar e Menu

**Arquivo:** `app/components/layout/sidebar.jsx`

| Mudança | Descrição |
|---------|-----------|
| ADICIONAR | Item "Gerenciar Clínica" (se TenantAdmin) |
| ADICIONAR | Item "Médicos" (se multi-clínica) |
| MODIFICAR | Condicionar "Financeiro" a permissões |

## 9.2 Novos Componentes

### `app/components/features/clinic/` (NOVO DIRETÓRIO)

```
clinic/
├── ClinicDashboard.jsx         # Dashboard da clínica (admin)
├── ClinicSettings.jsx          # Configurações da clínica
├── DoctorsList.jsx             # Lista de médicos
├── DoctorCard.jsx              # Card de médico
├── DoctorInviteDialog.jsx      # Dialog para convidar médico
├── DoctorPermissionsDialog.jsx # Dialog de permissões
├── ClinicSecretaryList.jsx     # Lista de secretárias de clínica
├── ClinicSecretaryDialog.jsx   # Dialog de criação/edição
├── ClinicSecretaryScope.jsx    # Seletor de escopo (médicos)
├── DoctorSelector.jsx          # Seletor de médico para filtros
└── PatientSharingDialog.jsx    # Dialog para compartilhar paciente
```

### `app/components/features/shared/DoctorFilter.jsx` (NOVO)

```javascript
'use client';

import { useState, useMemo } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box
} from '@mui/material';
import { useAuth } from '../../providers/authProvider';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';

/**
 * Componente de filtro por médico para listas
 */
export function DoctorFilter({
    value,
    onChange,
    label = "Médico",
    showAllOption = true,
    disabled = false
}) {
    const { isMultiDoctorClinic, isClinicAdmin } = useAuth();
    const { canViewAllSchedules, getScheduleableDoctors } = useClinicPermissions();

    const doctors = useMemo(() => getScheduleableDoctors(), [getScheduleableDoctors]);

    // Se não é multi-clínica ou não pode ver todos, não mostra filtro
    if (!isMultiDoctorClinic || doctors.length <= 1) {
        return null;
    }

    return (
        <FormControl size="small" sx={{ minWidth: 200 }} disabled={disabled}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value || 'all'}
                onChange={(e) => onChange(e.target.value === 'all' ? null : e.target.value)}
                label={label}
            >
                {showAllOption && canViewAllSchedules && (
                    <MenuItem value="all">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Todos os médicos
                            <Chip size="small" label={doctors.length} />
                        </Box>
                    </MenuItem>
                )}
                {doctors.map(doctor => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                        Dr(a). {doctor.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default DoctorFilter;
```

## 9.3 Novos Templates

### `app/components/templates/clinicManagementTemplate.jsx` (NOVO)

```javascript
'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useAuth } from '../providers/authProvider';
import DoctorsList from '../features/clinic/DoctorsList';
import ClinicSecretaryList from '../features/clinic/ClinicSecretaryList';
import ClinicSettings from '../features/clinic/ClinicSettings';
import ClinicDashboard from '../features/clinic/ClinicDashboard';

export default function ClinicManagementTemplate() {
    const [activeTab, setActiveTab] = useState(0);
    const { isClinicAdmin, clinicData, isMultiDoctorClinic } = useAuth();

    if (!isClinicAdmin) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Acesso restrito a administradores da clínica.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Gerenciar Clínica: {clinicData?.name}
            </Typography>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Dashboard" />
                <Tab label="Médicos" />
                <Tab label="Secretárias" />
                <Tab label="Configurações" />
            </Tabs>

            <Box sx={{ py: 3 }}>
                {activeTab === 0 && <ClinicDashboard />}
                {activeTab === 1 && <DoctorsList />}
                {activeTab === 2 && <ClinicSecretaryList />}
                {activeTab === 3 && <ClinicSettings />}
            </Box>
        </Box>
    );
}
```

---

# 10. NOVOS ARQUIVOS A CRIAR

## 10.1 Backend (Rust)

| Arquivo | Descrição |
|---------|-----------|
| `src/domain/clinic/mod.rs` | Módulo de clínica |
| `src/domain/clinic/entities.rs` | Entidades de clínica (DoctorAssociation, Invite, etc.) |
| `src/domain/clinic/repository.rs` | Trait de repositório |
| `src/infra/repository/clinic_repository.rs` | Implementação do repositório |
| `src/api/clinics.rs` | Handlers HTTP de clínica |
| `src/middleware/permissions.rs` | Guards de permissão |
| `migrations/XXXX_add_clinic_mode.sql` | Migration para novos campos |
| `migrations/XXXX_add_doctor_associations.sql` | Migration para associações |
| `migrations/XXXX_add_clinic_secretaries.sql` | Migration para secretárias de clínica |

## 10.2 Frontend (Next.js)

| Arquivo | Descrição |
|---------|-----------|
| `lib/types/clinic.types.js` | Tipos TypeScript/JSDoc |
| `lib/services/api/clinic.service.js` | Serviço de API de clínica |
| `app/components/hooks/useClinicPermissions.jsx` | Hook de permissões |
| `app/components/hooks/useClinicDoctors.jsx` | Hook de médicos da clínica |
| `app/components/features/clinic/ClinicDashboard.jsx` | Dashboard de clínica |
| `app/components/features/clinic/ClinicSettings.jsx` | Configurações |
| `app/components/features/clinic/DoctorsList.jsx` | Lista de médicos |
| `app/components/features/clinic/DoctorCard.jsx` | Card de médico |
| `app/components/features/clinic/DoctorInviteDialog.jsx` | Convite de médico |
| `app/components/features/clinic/DoctorPermissionsDialog.jsx` | Permissões |
| `app/components/features/clinic/ClinicSecretaryList.jsx` | Secretárias |
| `app/components/features/clinic/ClinicSecretaryDialog.jsx` | Dialog de secretária |
| `app/components/features/clinic/ClinicSecretaryScope.jsx` | Escopo |
| `app/components/features/clinic/PatientSharingDialog.jsx` | Compartilhar paciente |
| `app/components/features/shared/DoctorFilter.jsx` | Filtro de médico |
| `app/components/features/shared/DoctorSelector.jsx` | Seletor de médico |
| `app/components/templates/clinicManagementTemplate.jsx` | Template de gestão |
| `app/app/clinic/page.jsx` | Página de clínica |
| `app/app/clinic/doctors/page.jsx` | Página de médicos |
| `app/app/clinic/secretaries/page.jsx` | Página de secretárias |

---

# 11. MIGRAÇÕES DE BANCO DE DADOS

## 11.1 Migration: Campos de Clínica

**Arquivo:** `migrations/20251226_001_add_clinic_mode.sql`

```sql
-- Adicionar campos de modo clínica na tabela tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS clinic_mode VARCHAR(20) DEFAULT 'solo';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allow_patient_sharing BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS require_doctor_assignment BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_doctors INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_secretaries INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS default_appointment_duration INTEGER DEFAULT 30;

-- Adicionar constraint
ALTER TABLE tenants ADD CONSTRAINT clinic_mode_check
    CHECK (clinic_mode IN ('solo', 'multi_doctor'));

-- Atualizar tenants existentes para manter comportamento atual
UPDATE tenants SET clinic_mode = 'solo' WHERE clinic_mode IS NULL;
```

## 11.2 Migration: Associações de Médicos

**Arquivo:** `migrations/20251226_002_add_doctor_associations.sql`

```sql
-- Tabela de associações médico-clínica
CREATE TABLE IF NOT EXISTS doctor_clinic_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    association_type VARCHAR(20) NOT NULL DEFAULT 'employee',
    additional_permissions JSONB DEFAULT '{}',

    active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,

    default_repasse_percent DECIMAL(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),

    CONSTRAINT association_type_check
        CHECK (association_type IN ('owner', 'partner', 'employee', 'contractor', 'guest')),
    CONSTRAINT unique_doctor_clinic UNIQUE (tenant_id, profissional_id)
);

-- Índices
CREATE INDEX idx_doctor_associations_tenant ON doctor_clinic_associations(tenant_id);
CREATE INDEX idx_doctor_associations_user ON doctor_clinic_associations(user_id);
CREATE INDEX idx_doctor_associations_active ON doctor_clinic_associations(active);

-- Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS doctor_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    uf_crm VARCHAR(2) NOT NULL,
    specialty VARCHAR(100),
    association_type VARCHAR(20) NOT NULL DEFAULT 'employee',
    additional_permissions JSONB DEFAULT '{}',
    default_repasse_percent DECIMAL(5,2),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_doctor_invites_token ON doctor_invites(token);
CREATE INDEX idx_doctor_invites_email ON doctor_invites(email);

-- Migrar médicos existentes: criar associação tipo "owner"
INSERT INTO doctor_clinic_associations (
    tenant_id, profissional_id, user_id, association_type,
    additional_permissions, active, joined_at
)
SELECT
    u.tenant_id,
    u.profissional_id,
    u.id,
    'owner',
    '{"can_view_financial": true, "can_manage_financial": true, "can_view_all_patients": true,
      "can_issue_nfse": true, "can_manage_secretaries": true, "can_view_analytics": true,
      "can_manage_whatsapp": true, "can_manage_facebook": true}',
    true,
    u.created_at
FROM users u
WHERE u.profissional_id IS NOT NULL
  AND u.role IN ('doctor', 'tenant_admin')
  AND NOT EXISTS (
      SELECT 1 FROM doctor_clinic_associations dca
      WHERE dca.user_id = u.id
  );
```

## 11.3 Migration: Secretárias de Clínica

**Arquivo:** `migrations/20251226_003_add_clinic_secretaries.sql`

```sql
-- Tabela de secretárias de clínica (nova estrutura)
CREATE TABLE IF NOT EXISTS clinic_secretaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14),

    -- Escopo: 'all_doctors', ou JSON com lista de IDs
    scope_type VARCHAR(20) NOT NULL DEFAULT 'all_doctors',
    scope_doctors UUID[] DEFAULT '{}',

    -- Permissões (JSONB)
    permissions JSONB DEFAULT '{}',

    active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES users(id),

    CONSTRAINT scope_type_check
        CHECK (scope_type IN ('all_doctors', 'specific_doctors', 'single_doctor'))
);

-- Índices
CREATE INDEX idx_clinic_secretaries_tenant ON clinic_secretaries(tenant_id);
CREATE INDEX idx_clinic_secretaries_user ON clinic_secretaries(user_id);
CREATE INDEX idx_clinic_secretaries_active ON clinic_secretaries(active);
CREATE INDEX idx_clinic_secretaries_email ON clinic_secretaries(email);

-- Manter tabela secretaries existente para compatibilidade
-- Adicionar flag para indicar se foi migrada
ALTER TABLE secretaries ADD COLUMN IF NOT EXISTS migrated_to_clinic BOOLEAN DEFAULT false;
```

## 11.4 Migration: Campos de Paciente

**Arquivo:** `migrations/20251226_004_add_patient_sharing.sql`

```sql
-- Adicionar campos de compartilhamento em pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES profissionais(id);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT false;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}';
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS last_accessed_by UUID REFERENCES users(id);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Migrar dados existentes: definir responsavel_id
-- (Assumindo que já existe uma forma de identificar o médico responsável)
-- Isso pode precisar de ajuste baseado na estrutura atual

-- Índices
CREATE INDEX idx_pacientes_responsavel ON pacientes(responsavel_id);
CREATE INDEX idx_pacientes_shared ON pacientes(shared);
```

## 11.5 Migration: Campos de Agendamento

**Arquivo:** `migrations/20251226_005_add_appointment_fields.sql`

```sql
-- Adicionar campos em appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(30);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_via VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Tabela de salas/consultórios (opcional)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 1,
    equipment JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para verificar conflitos de sala
CREATE INDEX idx_appointments_room_time ON appointments(room_id, data_hora_inicio, data_hora_fim)
    WHERE room_id IS NOT NULL;
```

---

# 12. ESTRATÉGIA DE MIGRAÇÃO

## 12.1 Fases de Implementação

### Fase 1: Infraestrutura (Backend)

1. Criar migrações de banco de dados
2. Implementar novas entidades no domínio
3. Implementar repositórios
4. Criar handlers de API de clínica
5. Expandir middleware de autenticação
6. Testes unitários e de integração

### Fase 2: Compatibilidade

1. Migrar médicos existentes para modelo de associação (como "owner")
2. Manter secretárias existentes funcionando
3. Adicionar `responsavel_id` em pacientes existentes
4. Garantir que modo "solo" funciona exatamente como antes

### Fase 3: Frontend Base

1. Expandir AuthProvider com novos estados
2. Criar hook useClinicPermissions
3. Criar serviço de API de clínica
4. Adicionar DoctorFilter em listas existentes
5. Ajustar sidebar para novos itens de menu

### Fase 4: Novos Componentes

1. Criar componentes de gerenciamento de clínica
2. Criar template de gestão de clínica
3. Criar página de clínica
4. Integrar convite de médicos
5. Integrar secretárias de clínica

### Fase 5: Testes e Refinamento

1. Testes end-to-end de todos os fluxos
2. Testes de permissões
3. Testes de migração de dados
4. Ajustes de UX baseado em feedback

## 12.2 Compatibilidade com Sistema Atual

### O que NÃO muda para usuários existentes:

1. Login e autenticação funcionam igual
2. Médicos solo continuam com acesso total
3. Secretárias de médico continuam funcionando
4. Todos os dados existentes são preservados
5. APIs existentes mantêm mesmo comportamento

### O que muda:

1. Médicos podem optar por "modo clínica"
2. Novas funcionalidades disponíveis (convite de médico, secretária de clínica)
3. Novos endpoints de API (todos em `/api/v1/clinics/*`)

## 12.3 Feature Flags

```javascript
// Sugestão de flags para rollout gradual

const FEATURE_FLAGS = {
    // Habilitar novo sistema de clínica
    CLINIC_MODE_ENABLED: process.env.NEXT_PUBLIC_CLINIC_MODE_ENABLED === 'true',

    // Habilitar convite de médicos
    DOCTOR_INVITE_ENABLED: process.env.NEXT_PUBLIC_DOCTOR_INVITE_ENABLED === 'true',

    // Habilitar secretárias de clínica
    CLINIC_SECRETARY_ENABLED: process.env.NEXT_PUBLIC_CLINIC_SECRETARY_ENABLED === 'true',

    // Habilitar compartilhamento de pacientes
    PATIENT_SHARING_ENABLED: process.env.NEXT_PUBLIC_PATIENT_SHARING_ENABLED === 'true',
};
```

---

# 13. CASOS DE USO DETALHADOS

## 13.1 Caso: Médico Autônomo Cria Conta

```
1. Médico João se cadastra
2. Sistema cria:
   - User (role: Doctor)
   - Tenant (clinic_mode: solo)
   - Profissional
   - DoctorClinicAssociation (type: owner, full permissions)
3. João tem acesso a TUDO (pacientes, financeiro, agenda, etc.)
4. João pode criar secretárias vinculadas a ele (sistema atual)
```

## 13.2 Caso: Médico Expande para Clínica

```
1. Médico João (existente) vai em "Configurações da Clínica"
2. Ativa "Modo Multi-Médico"
3. Sistema atualiza:
   - Tenant.clinic_mode = 'multi_doctor'
4. João pode agora:
   - Convidar outros médicos
   - Criar secretárias de clínica
   - Definir permissões para novos médicos
```

## 13.3 Caso: Clínica Convida Médico

```
1. Admin Maria (TenantAdmin) convida Dr. Pedro
2. Sistema cria DoctorInvite com token único
3. Email enviado para Pedro com link
4. Pedro clica no link:
   a. Se tem conta: aceita e vincula
   b. Se não tem: cria conta e vincula
5. Sistema cria:
   - DoctorClinicAssociation para Pedro
   - Profissional (se necessário)
6. Pedro pode:
   - Ver seus pacientes
   - Criar agendamentos para si
   - Acessar funcionalidades conforme permissões
```

## 13.4 Caso: Secretária de Clínica Acessa Agenda

```
1. Secretária Ana (ClinicSecretary, scope: AllDoctors) loga
2. Sistema carrega:
   - Lista de todos os médicos da clínica
   - Permissões de Ana
3. Ana vai em "Agenda"
4. Vê agenda de TODOS os médicos
5. Pode filtrar por médico específico
6. Pode criar agendamento para QUALQUER médico
```

## 13.5 Caso: Médico Vinculado Acessa Sistema

```
1. Dr. Pedro (Doctor, vinculado à Clínica ABC) loga
2. Sistema carrega:
   - Seus dados de associação
   - Suas permissões adicionais
3. Pedro vê:
   - Seus pacientes (onde é responsável)
   - Seus agendamentos
   - Suas receitas/exames/anamneses
4. Se tiver can_view_financial:
   - Também vê dados financeiros da clínica
5. Se não tiver can_view_all_patients:
   - NÃO vê pacientes de outros médicos
```

## 13.6 Caso: Compartilhar Paciente Entre Médicos

```
1. Dr. João é responsável pelo paciente Maria
2. João quer que Dr. Pedro também atenda Maria
3. João vai no perfil de Maria > "Compartilhar"
4. Seleciona Dr. Pedro
5. Sistema atualiza:
   - paciente.shared = true
   - paciente.shared_with = [..., pedro_id]
6. Pedro agora pode:
   - Ver paciente Maria em sua lista
   - Criar agendamentos para Maria
   - Criar exames/receitas para Maria
```

---

# 14. CONSIDERAÇÕES DE SEGURANÇA

## 14.1 Row-Level Security

Todas as queries devem incluir:

```sql
-- Para dados de tenant (clínica)
WHERE tenant_id = $current_tenant_id

-- Para dados de paciente
WHERE tenant_id = $current_tenant_id
  AND (
    responsavel_id = $current_profissional_id
    OR shared = true
    OR $current_profissional_id = ANY(shared_with)
  )

-- Para dados médicos (prontuário, receita, etc.)
WHERE tenant_id = $current_tenant_id
  AND profissional_id = $current_profissional_id
```

## 14.2 Validações de Permissão

Cada handler deve:

1. Verificar tenant do recurso
2. Verificar permissão do usuário para ação
3. Verificar acesso ao médico (se aplicável)
4. Verificar acesso ao paciente (se aplicável)

## 14.3 Auditoria

Registrar em `audit_logs`:

1. Toda alteração de permissões
2. Toda alteração de associação de médico
3. Todo compartilhamento de paciente
4. Toda alteração de escopo de secretária

## 14.4 Proteção de Dados Sensíveis

1. Dados de prontuário são exclusivos do médico autor
2. Receitas só podem ser assinadas pelo médico prescritor
3. Secretárias não podem ver dados de saúde detalhados (por padrão)
4. Logs de auditoria são imutáveis

---

# 15. TESTES E VALIDAÇÃO

## 15.1 Testes Unitários (Backend)

```rust
// tests/auth_context_tests.rs
#[test]
fn test_can_access_doctor_data_same_doctor() { ... }

#[test]
fn test_can_access_doctor_data_with_permission() { ... }

#[test]
fn test_cannot_access_doctor_data_without_permission() { ... }

#[test]
fn test_secretary_scope_all_doctors() { ... }

#[test]
fn test_secretary_scope_specific_doctors() { ... }
```

## 15.2 Testes de Integração (Backend)

```rust
// tests/clinic_api_tests.rs
#[actix_rt::test]
async fn test_invite_doctor_flow() { ... }

#[actix_rt::test]
async fn test_create_clinic_secretary() { ... }

#[actix_rt::test]
async fn test_patient_sharing() { ... }

#[actix_rt::test]
async fn test_multi_doctor_appointments() { ... }
```

## 15.3 Testes E2E (Frontend)

```javascript
// cypress/e2e/clinic.cy.js
describe('Clinic Management', () => {
    it('should invite doctor and accept invite', () => { ... });
    it('should create clinic secretary with scope', () => { ... });
    it('should filter patients by doctor', () => { ... });
    it('should share patient between doctors', () => { ... });
    it('should show only accessible data for linked doctor', () => { ... });
});
```

## 15.4 Matriz de Testes de Permissão

| Ação | TenantAdmin | Doctor(owner) | Doctor(employee) | ClinicSecretary | DoctorSecretary |
|------|-------------|---------------|------------------|-----------------|-----------------|
| Ver todos pacientes | ✓ | ✓ | Conf. | ✓ | Apenas médico |
| Criar paciente | ✓ | ✓ | ✓ | Conf. | Conf. |
| Ver financeiro | ✓ | ✓ | Conf. | ✗ | ✗ |
| Gerenciar médicos | ✓ | ✓ | ✗ | ✗ | ✗ |
| Ver agenda geral | ✓ | ✓ | ✓ | ✓ | Apenas médico |
| Agendar qualquer médico | ✓ | ✓ | ✗ | ✓ | ✗ |

---

# ANEXO A: GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **Tenant** | Clínica/organização no sistema multi-tenant |
| **TenantAdmin** | Administrador da clínica (pode não ser médico) |
| **Doctor** | Médico/profissional de saúde vinculado à clínica |
| **ClinicSecretary** | Secretária que atende múltiplos médicos da clínica |
| **DoctorSecretary** | Secretária vinculada a um médico específico (legado) |
| **DoctorAssociation** | Vínculo entre médico e clínica |
| **Scope** | Escopo de atuação da secretária (quais médicos atende) |
| **Responsável** | Médico principal/criador de um paciente |
| **Shared** | Paciente compartilhado entre múltiplos médicos |

---

# ANEXO B: ESTIMATIVA DE ARQUIVOS

## Backend (Rust)

- **Novos arquivos:** 12
- **Arquivos modificados:** 15
- **Migrações SQL:** 5
- **Testes:** 8

## Frontend (Next.js)

- **Novos arquivos:** 20
- **Arquivos modificados:** 25
- **Novos componentes:** 15
- **Novos hooks:** 3
- **Novos services:** 2

---

# ANEXO C: CHECKLIST DE IMPLEMENTAÇÃO

## Backend

- [ ] Migrations de banco de dados
- [ ] Entidades de domínio (clinic, secretary expandido)
- [ ] Repositórios
- [ ] Handlers de API
- [ ] Middleware de permissões
- [ ] Testes unitários
- [ ] Testes de integração

## Frontend

- [ ] Tipos TypeScript/JSDoc
- [ ] Serviço de API de clínica
- [ ] AuthProvider expandido
- [ ] Hook useClinicPermissions
- [ ] Hook useClinicDoctors
- [ ] Componentes de clínica
- [ ] Template de gestão
- [ ] Páginas de clínica
- [ ] DoctorFilter em listas
- [ ] Ajustes no sidebar
- [ ] Testes E2E

## Migração de Dados

- [ ] Script de migração de médicos existentes
- [ ] Validação de dados migrados
- [ ] Rollback plan

---

**Documento gerado em:** 26 de Dezembro de 2025
**Versão:** 1.0
**Autor:** Claude Code (Anthropic)

---

*Este documento serve como guia técnico completo para a implementação do sistema multi-clínica e multi-médico. Qualquer alteração deve ser documentada e versionada.*
