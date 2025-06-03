// Modelos de dados genéricos para uso com FirebaseService



// ====================================================
// Modelo para novo paciente
// ====================================================
export const patientModel = {
    patientName: "Nome do Paciente",
    patientAge: 30,
    patientGender: "Masculino", // "Masculino", "Feminino", "Outro"
    patientPhone: "(00) 00000-0000",
    patientEmail: "paciente@email.com",
    patientAddress: "Endereço Completo",
    patientCPF: "000.000.000-00",
    patientRG: "00.000.000-0",

    // Dados médicos básicos
    bloodType: "O+", // "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    heightCm: 170, // em cm
    weightKg: 70, // em kg
    isSmoker: false,
    isAlcoholConsumer: false,
    allergies: [], // Lista de alergias
    congenitalDiseases: [], // Doenças congênitas
    chronicDiseases: [], // Doenças crônicas
    medications: [], // Medicamentos em uso
    surgicalHistory: [], // Histórico de cirurgias
    familyHistory: [], // Histórico familiar de doenças

    // Dados de saúde complementares
    vitalSigns: {
        bloodPressure: "120/80",
        heartRate: 70, // BPM
        temperature: 36.5, // °C
        respiratoryRate: 16, // respirações/min
        oxygenSaturation: 98 // %
    },

    // Dados de contato de emergência
    emergencyContact: {
        name: "Nome do Contato",
        phone: "(00) 00000-0000",
        relationship: "Parentesco"
    },

    healthInsurance: {
        name: "Nome do Plano",
        number: "000000000",
        validUntil: "2025-12-31"
    },

    // Campos de controle
    doctorId: "ID_DO_MÉDICO_RESPONSÁVEL",
    notes: "",
    lastConsultationDate: null,
    createdAt: new Date()
};

// ====================================================
// Modelo para nova anamnese
// ====================================================
export const anamneseModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",
    anamneseDate: new Date(),

    // Informações principais da anamnese
    chiefComplaint: "Queixa principal do paciente",
    illnessHistory: "História da doença atual",

    // Históricos
    medicalHistory: [], // Histórico médico
    surgicalHistory: [], // Histórico cirúrgico
    familyHistory: "", // Histórico familiar

    // Hábitos de vida
    socialHistory: {
        isSmoker: false,
        cigarettesPerDay: 0,
        isAlcoholConsumer: false,
        alcoholFrequency: "",
        isDrugUser: false,
        drugDetails: "",
        physicalActivity: "",
        occupation: "",
        dietHabits: ""
    },

    // Medicamentos e alergias
    currentMedications: [],
    allergies: [],

    // Revisão de sistemas
    systemsReview: {
        cardiovascular: "",
        respiratory: "",
        gastrointestinal: "",
        genitourinary: "",
        neurological: "",
        musculoskeletal: "",
        endocrine: "",
        hematologic: "",
        psychiatric: "",
        dermatological: ""
    },

    // Exame físico
    physicalExam: {
        generalAppearance: "",
        vitalSigns: {
            bloodPressure: "",
            heartRate: "",
            temperature: "",
            respiratoryRate: "",
            oxygenSaturation: ""
        },
        headAndNeck: "",
        cardiovascular: "",
        respiratory: "",
        abdomen: "",
        extremities: "",
        neurological: "",
        other: ""
    },

    // Conclusões
    diagnosis: "",
    treatmentPlan: "",
    additionalNotes: "",

    createdAt: new Date()
};

// ====================================================
// Modelo para nota do paciente
// ====================================================
export const noteModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",

    // Informações básicas da nota
    noteTitle: "Título da nota",
    noteText: "Conteúdo da nota com todas as observações relevantes...",

    // Datas importantes
    createdAt: new Date(), // Data de criação da nota
    consultationDate: null, // Data da consulta (opcional)

    // Campos para controle e organização
    noteType: "Rápida", // "Rápida", "Consulta", "Exame", etc.
    isImportant: false, // Marcador de importância

    // Documentos e anexos
    attachments: [
        // Exemplo de estrutura de anexo
        {
            fileName: "nome-do-arquivo.pdf",
            fileType: "application/pdf",
            fileSize: "1.2MB",
            fileUrl: "URL_DO_ARQUIVO_NO_STORAGE",
            uploadedAt: new Date()
        }
    ],

    // Metadados e estatísticas
    lastModified: null, // Data da última modificação
    modifiedBy: null, // ID do usuário que modificou
    viewCount: 0 // Contador de visualizações
};


// ====================================================
// Modelo para nova consulta
// ====================================================
export const consultationModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",

    // Informações da consulta
    consultationDate: new Date(),
    consultationTime: "14:30",
    consultationDuration: 30, // Duração em minutos
    consultationType: "Presencial", // "Presencial", "Telemedicina"
    roomLink: "", // Para telemedicina

    // Status e controle
    status: "Agendada", // "Agendada", "Em Andamento", "Concluída", "Cancelada"
    reasonForVisit: "Motivo da consulta",

    // Avaliação clínica
    clinicalNotes: "",
    diagnosis: "",

    // Procedimentos
    proceduresPerformed: [],

    // Encaminhamentos
    referrals: [],

    // Prescrições
    prescriptionId: "", // ID da prescrição associada

    // Exames
    examsRequested: [],

    // Seguimento
    followUp: {
        required: false,
        timeframe: "",
        instructions: ""
    },

    // Observações adicionais
    additionalNotes: "",

    // Campos de controle
    createdAt: new Date()
};

// ====================================================
// Modelo para novo exame
// ====================================================
export const examModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",

    // Informações do exame
    examName: "Nome do Exame",
    examType: "Tipo de Exame", // Sangue, Imagem, Eletro, etc.
    examCategory: "Categoria", // Laboratorial, Radiológico, etc.
    examDate: new Date(),

    // Status
    status: "Solicitado", // "Solicitado", "Agendado", "Coletado", "Em Análise", "Concluído"

    // Detalhes da solicitação
    requestDetails: {
        clinicalIndication: "",
        urgency: "Normal", // "Normal", "Urgente", "Emergência"
        requiredPreparation: "",
        additionalInstructions: ""
    },

    // Resultados
    results: {
        conclusionText: "",
        isAbnormal: false,
        performedBy: "",
        performedAt: "",
        resultDate: null, // Data do resultado
        referenceValues: "",
        resultFileUrl: "" // URL para arquivo do resultado
    },

    // Observações adicionais
    additionalNotes: "",

    // Campos de controle
    createdAt: new Date()
};

// ====================================================
// Modelo para novo medicamento
// ====================================================
export const medicationModel = {
    medicationName: "Nome do Medicamento",
    activeIngredient: "Princípio Ativo",

    // Detalhes da medicação
    dosage: "Dosagem", // Ex: 500mg
    form: "Forma", // Comprimido, Cápsula, Solução, etc.
    route: "Via", // Oral, Intravenoso, Subcutâneo, etc.
    frequency: "Frequência", // Ex: 8/8h, 12/12h, etc.
    duration: "Duração", // Ex: 7 dias, contínuo, etc.

    // Instruções específicas
    instructions: "Instruções específicas",

    // Informações adicionais
    sideEffects: [],
    contraindications: [],
    interactions: [],

    // Campos de controle
    isControlled: false, // Medicação controlada
    controlledType: "", // Tipo de controle (receita azul, amarela, etc.)

    createdAt: new Date()
};

// ====================================================
// Modelo para nova prescrição
// ====================================================
export const prescriptionModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",
    consultationId: "ID_DA_CONSULTA", // Opcional

    // Informações da prescrição
    prescriptionDate: new Date(),
    expirationDate: null, // Data de validade da prescrição

    // Lista de medicamentos prescritos
    medications: [
        // Exemplo de medicamento
        {
            medicationName: "Nome do Medicamento",
            dosage: "Dosagem",
            form: "Forma",
            frequency: "Frequência",
            duration: "Duração",
            instructions: "Instruções específicas"
        }
    ],

    // Instruções gerais
    generalInstructions: "Instruções gerais para todos os medicamentos",

    // Status da prescrição
    status: "Ativa", // "Ativa", "Renovada", "Suspensa", "Concluída"

    // Observações adicionais
    additionalNotes: "",

    // Campos de controle
    createdAt: new Date()
};

// ====================================================
// Modelo para novo item de agenda
// ====================================================
export const scheduleSlotModel = {
    slotId: "ID_ÚNICO", // Gerado automaticamente
    patientId: "ID_DO_PACIENTE", // Se agendado

    // Informações do horário
    startTime: "09:00",
    endTime: "09:30",
    duration: 30, // em minutos

    // Status do horário
    status: "Disponível", // "Disponível", "Agendado", "Bloqueado", "Concluído", "Cancelado"

    // Detalhes (preenchidos quando agendado)
    patientName: "",
    patientPhone: "",
    appointmentType: "",
    appointmentReason: "",
    notes: "",

    // Campos de controle
    createdAt: new Date()
};

// ====================================================
// Modelo para agenda do dia
// ====================================================
export const scheduleModel = {
    doctorId: "ID_DO_MÉDICO",
    scheduleDate: "2025-03-15", // Formato YYYY-MM-DD

    // Configuração do dia
    isWorkingDay: true,
    workingHours: {
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00"
    },

    // Lista de horários
    slots: [
        // Array de scheduleSlotModel
    ],

    // Campos de controle
    createdAt: new Date()
};

// ====================================================
// Modelo para prontuário completo (visão integrada)
// ====================================================
export const medicalRecordModel = {
    patientId: "ID_DO_PACIENTE",
    doctorId: "ID_DO_MÉDICO",

    // Dados do paciente (referência)
    patientInfo: {}, // Dados básicos do paciente

    // Resumo de saúde
    healthSummary: {
        activeProblemList: [], // Lista de problemas ativos
        allergies: [],
        medications: [],
        vitalSignsTimeline: [], // Histórico de sinais vitais
        immunizations: [], // Vacinas
        recentLabResults: [] // Resultados recentes importantes
    },

    // Referências a outros documentos
    consultationIds: [], // IDs das consultas
    anamneseIds: [], // IDs das anamneses
    examIds: [], // IDs dos exames
    prescriptionIds: [], // IDs das prescrições

    // Campos de controle
    lastUpdated: new Date(),
    createdAt: new Date()
};