/**
 * PatientCard constants - theme colors and field configuration
 */

// Enhanced color palette
export const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    primaryDark: "#0A3AA8",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    lightBg: "#F1F3FA",
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.1)",
    shadowColor: "rgba(17, 30, 90, 0.05)",
    chronic: {
        fumante: { bg: "#FFE8E5", color: "#FF4B55", icon: "/icons/cigarette.svg" },
        obeso: { bg: "#FFF4E5", color: "#FFAB2B", icon: "/icons/weight.svg" },
        hipertenso: { bg: "#E5F8FF", color: "#1C94E0", icon: "/icons/heart-pulse.svg" },
        diabetes: { bg: "#EFE6FF", color: "#7B4BC9", icon: "/icons/diabetes.svg" },
        asma: { bg: "#E5FFF2", color: "#0CAF60", icon: "/icons/lungs.svg" },
        default: { bg: "#E9EFFF", color: "#1852FE", icon: "/icons/disease.svg" }
    },
};

// Field configuration for validation and form control
export const fieldConfig = {
    nome: { required: true, label: "Nome completo", maxLength: 100 },
    tipoSanguineo: {
        required: false,
        label: "Tipo Sanguíneo",
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    dataNascimento: { required: true, label: "Data de Nascimento" },
    celular: { required: true, label: "Celular", pattern: "\\(\\d{2}\\)\\s\\d{5}-\\d{4}", mask: "(99) 99999-9999" },
    fixo: { required: false, label: "Telefone Fixo", pattern: "\\(\\d{2}\\)\\s\\d{4}-\\d{4}", mask: "(99) 9999-9999" },
    email: { required: true, label: "E-mail", pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$" },
    endereco: { required: false, label: "Endereço", maxLength: 150 },
    cidade: { required: false, label: "Cidade", maxLength: 100 },
    estado: {
        required: false,
        label: "Estado",
        options: [
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        ]
    },
    cep: { required: false, label: "CEP", pattern: "\\d{5}-\\d{3}", mask: "99999-999" }
};

// Brazilian states for select fields
export const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];
