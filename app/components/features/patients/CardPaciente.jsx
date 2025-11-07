"use client";
import React, {useState, useEffect, useRef} from "react";
import {
    Paper,
    Box,
    Typography,
    IconButton,
    Avatar,
    Chip,
    Stack,
    Button,
    useMediaQuery,
    useTheme,
    TextField,
    MenuItem,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Snackbar,
    Alert,
    Fade,
    Slide,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    Divider, Grid
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FirebaseService from "../../../lib/firebaseService";
import {useAuth} from "../authProvider";
import useModuleAccess from "../useModuleAccess";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

// Enhanced color palette
const themeColors = {
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
        fumante: {bg: "#FFE8E5", color: "#FF4B55", icon: "/icons/cigarette.svg"},
        obeso: {bg: "#FFF4E5", color: "#FFAB2B", icon: "/icons/weight.svg"},
        hipertenso: {bg: "#E5F8FF", color: "#1C94E0", icon: "/icons/heart-pulse.svg"},
        diabetes: {bg: "#EFE6FF", color: "#7B4BC9", icon: "/icons/diabetes.svg"},
        asma: {bg: "#E5FFF2", color: "#0CAF60", icon: "/icons/lungs.svg"},
        default: {bg: "#E9EFFF", color: "#1852FE", icon: "/icons/disease.svg"}
    },
};

// Field configuration for validation and form control
const fieldConfig = {
    nome: {required: true, label: "Nome completo", maxLength: 100},
    tipoSanguineo: {
        required: false,
        label: "Tipo Sanguíneo",
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    dataNascimento: {required: true, label: "Data de Nascimento"},
    celular: {required: true, label: "Celular", pattern: "\\(\\d{2}\\)\\s\\d{5}-\\d{4}", mask: "(99) 99999-9999"},
    fixo: {required: false, label: "Telefone Fixo", pattern: "\\(\\d{2}\\)\\s\\d{4}-\\d{4}", mask: "(99) 9999-9999"},
    email: {required: true, label: "E-mail", pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"},
    endereco: {required: false, label: "Endereço", maxLength: 150},
    cidade: {required: false, label: "Cidade", maxLength: 100},
    estado: {
        required: false,
        label: "Estado",
        options: [
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        ]
    },
    cep: {required: false, label: "CEP", pattern: "\\d{5}-\\d{3}", mask: "99999-999"}
};

// Helper para máscara de telefone
const applyPhoneMask = (value, mask) => {
    if (!value) return "";

    // Remove tudo que não for dígito
    const numbers = value.replace(/\D/g, "");

    let result = "";
    let numberIndex = 0;

    // Aplica a máscara
    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
        if (mask[i] === "9") {
            result += numbers[numberIndex++];
        } else {
            result += mask[i];

            // Se o próximo caractere na máscara não for 9, adicione-o também
            if (i + 1 < mask.length && mask[i + 1] !== "9") {
                result += mask[++i];
            }
        }
    }

    return result;
};

// Helper para formatação de CEP
const applyCepMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
        return numbers;
    }
    return `${numbers.substring(0, 5)}-${numbers.substring(5, 8)}`;
};

// Helper para garantir que propriedades aninhadas existam
const getSafeValue = (obj, path, defaultValue = "-") => {
    if (!obj) return defaultValue;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result === undefined || result === null || !result.hasOwnProperty(key)) {
            return defaultValue;
        }
        result = result[key];
    }

    // Se o valor for uma string vazia, retornar o valor padrão
    if (result === '') {
        return defaultValue;
    }

    return result || defaultValue;
};

// Animated EditableField Component
const EditableField = ({
                           label,
                           value,
                           isEditing,
                           onChange,
                           required = false,
                           error = false,
                           helperText = "",
                           multiline = false,
                           select = false,
                           options = [],
                           InputProps = {},
                           fullWidth = true,
                           ...props
                       }) => {
    return (
        <Box sx={{position: 'relative', width: fullWidth ? '100%' : 'auto'}}>
            {isEditing ? (
                <Fade in={isEditing} timeout={200}>
                    <TextField
                        label={label}
                        value={value || ""}
                        onChange={onChange}
                        required={required}
                        error={error}
                        helperText={helperText}
                        variant="outlined"
                        size="small"
                        multiline={multiline}
                        rows={multiline ? 3 : 1}
                        select={select}
                        fullWidth={fullWidth}
                        InputProps={{
                            ...InputProps,
                            sx: {
                                borderRadius: '10px',
                                backgroundColor: themeColors.backgroundPrimary,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: error ? themeColors.error : themeColors.borderColor,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: error ? themeColors.error : themeColors.primary,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: error ? themeColors.error : themeColors.primary,
                                },
                                transition: 'all 0.3s ease',
                                ...InputProps.sx
                            }
                        }}
                        sx={{
                            '& .MuiInputLabel-root': {
                                color: themeColors.textTertiary,
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px',
                                '&.Mui-focused': {
                                    color: error ? themeColors.error : themeColors.primary,
                                }
                            },
                            '& .MuiInputBase-input': {
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '14px',
                                color: themeColors.textPrimary,
                            },
                            '& .MuiFormHelperText-root': {
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '11px',
                                marginTop: '2px',
                            },
                            transition: 'all 0.3s ease',
                            ...props.sx
                        }}
                        {...props}
                    >
                        {select && options.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </Fade>
            ) : (
                <Box
                    sx={{
                        px: 1,
                        py: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: themeColors.textTertiary,
                            fontFamily: "Gellix, sans-serif",
                            fontSize: '11px',
                            fontWeight: 400,
                            mb: 0.5,
                        }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            color: themeColors.textPrimary,
                            fontFamily: "Gellix, sans-serif",
                            fontSize: '14px',
                            fontWeight: 500,
                            wordBreak: "break-word",
                        }}
                    >
                        {value || "-"}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// EditableChipList Component
const EditableChipList = ({
                              items = [],
                              isEditing,
                              onAdd,
                              onDelete,
                              emptyText = "Nenhum",
                              newItemPlaceholder = "Adicionar novo...",
                              colorScheme = {bg: "#F8F9FB", color: "#111E5A"}
                          }) => {
    const [newItem, setNewItem] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem("");
            setIsAdding(false);
        }
    };

    return (
        <Box sx={{width: '100%'}}>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{mb: isEditing ? 1 : 2}}>
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <Chip
                            key={index}
                            label={item}
                            sx={{
                                height: 36,
                                borderRadius: 99,
                                padding: "0 15px",
                                backgroundColor: colorScheme.bg,
                                border: `1px solid ${colorScheme.bg}`,
                                color: colorScheme.color,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: 14,
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                '&:hover': isEditing ? {
                                    backgroundColor: colorScheme.bg,
                                    opacity: 0.8,
                                } : {},
                            }}
                            onDelete={isEditing ? () => onDelete(index) : undefined}
                            deleteIcon={
                                isEditing ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                            }
                                        }}
                                    >
                                        <CloseIcon sx={{fontSize: 14, color: themeColors.textPrimary}}/>
                                    </Box>
                                ) : undefined
                            }
                        />
                    ))
                ) : (
                    <Chip
                        label={emptyText}
                        sx={{
                            height: 36,
                            borderRadius: 99,
                            padding: "0 15px",
                            backgroundColor: "#F8F9FB",
                            border: "1px solid #E5E9F2",
                            color: "#AAA",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    />
                )}

                {isEditing && !isAdding && (
                    <Chip
                        icon={<AddIcon sx={{fontSize: 18}}/>}
                        label="Adicionar"
                        onClick={() => setIsAdding(true)}
                        sx={{
                            height: 36,
                            borderRadius: 99,
                            padding: "0 15px",
                            backgroundColor: themeColors.primaryLight,
                            color: themeColors.primary,
                            fontFamily: "Gellix, sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: `${themeColors.primaryLight}cc`,
                            }
                        }}
                    />
                )}
            </Stack>

            {isEditing && isAdding && (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
                    <TextField
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={newItemPlaceholder}
                        size="small"
                        autoFocus
                        fullWidth
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAdd();
                            }
                        }}
                        InputProps={{
                            sx: {
                                borderRadius: '10px',
                                backgroundColor: themeColors.backgroundPrimary,
                            }
                        }}
                    />
                    <IconButton
                        size="small"
                        onClick={handleAdd}
                        sx={{
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: themeColors.primaryDark,
                            }
                        }}
                    >
                        <CheckIcon fontSize="small"/>
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => setIsAdding(false)}
                        sx={{
                            backgroundColor: '#f5f5f5',
                            color: themeColors.textSecondary,
                            '&:hover': {
                                backgroundColor: '#e0e0e0',
                            }
                        }}
                    >
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

// ----------------------
// Enhanced Card1 Component
// ----------------------
// ----------------------
// Enhanced Card1 Component
// ----------------------
function Card1({
                   paciente,
                   expanded,
                   onToggle,
                   isEditing,
                   setIsEditing,
                   formData,
                   setFormData,
                   validationErrors,
                   handleSave,
                   loading
               }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
    const isMedium = useMediaQuery(theme.breakpoints.down("md"));
    const [showAdditionalContactForm, setShowAdditionalContactForm] = useState(false);
    const { canPerformAction } = useModuleAccess();

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                // Store the file and preview separately
                setFormData({
                    ...formData,
                    photoFile: file, // The actual file for upload
                    photoPreview: event.target.result // Data URL for preview
                });
            };

            reader.readAsDataURL(file);
        }
    };

    // Handle form changes
    const handleChange = (field) => (e) => {
        let value = e.target.value;

        // Apply special formatting based on field
        if (field === 'contato.celular') {
            value = applyPhoneMask(value, "(99) 99999-9999");
        } else if (field === 'contato.fixo') {
            value = applyPhoneMask(value, "(99) 9999-9999");
        } else if (field === 'contato.adicional') {
            value = applyPhoneMask(value, "(99) 99999-9999");
        } else if (field === 'endereco.cep') {
            value = applyCepMask(value);
        }

        // Update nested field
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            // Update top-level field
            setFormData({
                ...formData,
                [field]: value
            });
        }
    };

    // Toggle additional contact form
    const toggleAdditionalContactForm = () => {
        setShowAdditionalContactForm(!showAdditionalContactForm);
    };

    // Normalize chronic diseases to accept different data formats
    const getChronicDiseases = () => {
        // Check if we have an array in chronicDiseases
        if (Array.isArray(formData.chronicDiseases) && formData.chronicDiseases.length > 0) {
            return formData.chronicDiseases;
        }

        // Check if we have an array in condicoesClinicas.doencas
        if (formData.condicoesClinicas && Array.isArray(formData.condicoesClinicas.doencas)
            && formData.condicoesClinicas.doencas.length > 0) {
            return formData.condicoesClinicas.doencas;
        }

        // Check the isSmoker property
        const diseases = [];
        if (formData.isSmoker || formData?.condicoesClinicas?.ehFumante === "Sim") {
            diseases.push("Fumante");
        }

        return diseases;
    };

    // Get health plans in a normalized format
    const getHealthPlans = () => {
        // If we already have an array of health plans
        if (Array.isArray(formData.healthPlans) && formData.healthPlans.length > 0) {
            return formData.healthPlans;
        }

        // If we have a single health plan object, convert to array
        if (formData.healthPlan && typeof formData.healthPlan === 'object') {
            return [formData.healthPlan];
        }

        return [];
    };

    // Get patient status
    const getPatientStatus = () => {
        if (Array.isArray(formData.statusList) && formData.statusList.length > 0) {
            // Return only the first 3 status for Card1
            return formData.statusList.slice(0, 4);
        }
        return [];
    };

    const handleAddChronicDisease = (disease) => {
        const currentDiseases = [...(formData.chronicDiseases || [])];
        if (!currentDiseases.includes(disease)) {
            setFormData({
                ...formData,
                chronicDiseases: [...currentDiseases, disease]
            });
        }
    };

    const handleDeleteChronicDisease = (index) => {
        const currentDiseases = [...(formData.chronicDiseases || [])];
        currentDiseases.splice(index, 1);
        setFormData({
            ...formData,
            chronicDiseases: currentDiseases
        });
    };

    const getChipColor = (disease) => {
        const lowerDisease = disease.toLowerCase();
        if (themeColors.chronic[lowerDisease]) {
            return themeColors.chronic[lowerDisease];
        }

        // Additional mapping for alternative names
        if (lowerDisease.includes('fumante')) return themeColors.chronic.fumante;
        if (lowerDisease.includes('obes')) return themeColors.chronic.obeso;
        if (lowerDisease.includes('hipertens')) return themeColors.chronic.hipertenso;
        if (lowerDisease.includes('diabet')) return themeColors.chronic.diabetes;
        if (lowerDisease.includes('asma')) return themeColors.chronic.asma;

        return themeColors.chronic.default;
    };

    // Função para formatar datas
    const formatDate = (dateValue) => {
        if (!dateValue) return "-";

        try {
            // Checar se é um Timestamp do Firestore (com seconds e nanoseconds)
            if (dateValue.seconds) {
                return new Date(dateValue.seconds * 1000).toLocaleDateString('pt-BR');
            }

            // Checar se é um objeto Date
            if (dateValue instanceof Date) {
                return dateValue.toLocaleDateString('pt-BR');
            }

            // Tentar converter para Date
            return new Date(dateValue).toLocaleDateString('pt-BR');
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return "-";
        }
    };

    // Generate a color for health plan based on plan name
    const getHealthPlanColor = (planName) => {
        const planColors = [
            {bg: "#E5F8FF", color: "#1C94E0"},
            {bg: "#E9EFFF", color: "#1852FE"},
            {bg: "#EFE6FF", color: "#7B4BC9"},
            {bg: "#FFF4E5", color: "#FFAB2B"},
            {bg: "#E5FFF2", color: "#0CAF60"}
        ];

        // Generate a stable index based on the plan name
        const hash = planName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        return planColors[hash % planColors.length];
    };

    // Generate a color for status
    const getStatusColor = (status) => {
        const statusColors = {
            "Particular": {bg: "#E5F8FF", color: "#1C94E0"},
            "Convênio": {bg: "#E9EFFF", color: "#1852FE"},
            "Internado": {bg: "#FFE8E5", color: "#FF4B55"},
            "Pós-cirurgia": {bg: "#EFE6FF", color: "#7B4BC9"},
            "Gestante": {bg: "#FFF4E5", color: "#FFAB2B"},
            "Alta": {bg: "#E5FFF2", color: "#0CAF60"}
        };

        return statusColors[status] || {bg: "#F8F9FB", color: "#111E5A"};
    };

    const chronicDiseases = getChronicDiseases();
    const healthPlans = getHealthPlans();
    const patientStatus = getPatientStatus();

    return (
        <Box
            sx={{
                position: "relative",
                width: isMobile ? "100%" : isTablet ? "100%" : "350px",
                maxWidth: isMobile ? "none" : "350px",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                borderRadius: expanded && !isMedium ? (isMobile ? "16px 16px 0 0" : "40px 0 0 40px") : (isMobile ? "16px" : "40px"),
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: expanded ? 10 : 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "0",
                boxShadow: isEditing ? '0 0 0 2px rgba(24, 82, 254, 0.2)' : 'none',
                mx: isMobile ? 0 : "auto",
                order: isMobile ? 1 : 'initial',
            }}
        >
            {/* Overlay image */}
            <Box
                component="img"
                src="/layeruser.png"
                alt="Layer"
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: isMobile ? "150px" : "200px",
                    height: isMobile ? "130px" : "170px",
                    zIndex: 0,
                    opacity: isEditing ? 0.3 : 1,
                    transition: "opacity 0.3s ease",
                    display: isMobile ? "none" : "block",
                }}
            />

            {/* Edit/Save Mode Toggle */}
            <Box
                sx={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    zIndex: 3,
                }}
            >
                {isEditing ? (
                    <Box sx={{display: 'flex', gap: 1}}>
                        <Tooltip title="Salvar alterações">
                            <IconButton
                                size="small"
                                onClick={handleSave}
                                disabled={loading}
                                sx={{
                                    backgroundColor: themeColors.success,
                                    color: '#fff',
                                    '&:hover': {
                                        backgroundColor: '#09884B',
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: '#E5E9F2',
                                        color: '#AAA',
                                    },
                                    width: 36,
                                    height: 36,
                                }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit"/> : <CheckIcon/>}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar edição">
                            <IconButton
                                size="small"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                                sx={{
                                    backgroundColor: '#F8F9FB',
                                    color: themeColors.textSecondary,
                                    '&:hover': {
                                        backgroundColor: '#E5E9F2',
                                    },
                                    width: 36,
                                    height: 36,
                                }}
                            >
                                <CloseIcon/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    canPerformAction('patients', 'write').allowed && (
                        <Tooltip title="Editar informações">
                            <IconButton
                                onClick={() => setIsEditing(true)}
                                size="small"
                                sx={{
                                    backgroundColor: '#F8F9FB',
                                    color: themeColors.primary,
                                    '&:hover': {
                                        backgroundColor: themeColors.primaryLight,
                                    },
                                    width: 36,
                                    height: 36,
                                }}
                            >
                                <EditIcon/>
                            </IconButton>
                        </Tooltip>
                    )
                )}
            </Box>

            <Box sx={{p: isMobile ? 2 : 3, pb: isMobile ? 2 : 3, flexGrow: 0, height: "max-content"}}>
                {/* Avatar/Photo */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        position: "relative",
                        mb: 2,
                        zIndex: 1,
                    }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        id="patient-photo-upload"
                        style={{display: "none"}}
                        onChange={handlePhotoChange}
                    />

                    <label htmlFor={isEditing ? "patient-photo-upload" : ""}>
                        <Box sx={{position: 'relative'}}>
                            {/* Avatar/Photo */}
                            <Avatar
                                src={formData.photoPreview || formData.fotoPerfil || formData.photoURL}
                                alt={formData.nome || formData.patientName}
                                sx={{
                                    width: isMobile ? 90 : 110,
                                    height: isMobile ? 90 : 110,
                                    border: `3px solid ${themeColors.primary}`,
                                    position: "relative",
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    "&:hover": {
                                        transform: isEditing ? "scale(1.05)" : "none",
                                        boxShadow: isEditing ? "0 4px 20px rgba(24, 82, 254, 0.15)" : "none",
                                    },
                                    cursor: isEditing ? "pointer" : "default",
                                }}
                            >
                                {!(formData.photoPreview || formData.fotoPerfil || formData.photoURL) && (
                                    <PersonIcon sx={{color: "#B9D6FF", fontSize: isMobile ? 50 : 60}}/>
                                )}
                            </Avatar>

                            {/* Edit indicator when in edit mode */}
                            {isEditing && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        backgroundColor: themeColors.primary,
                                        borderRadius: '50%',
                                        width: 36,
                                        height: 36,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                                        border: '2px solid white',
                                    }}
                                >
                                    <AddPhotoAlternateIcon sx={{color: 'white', fontSize: 20}}/>
                                </Box>
                            )}
                        </Box>
                    </label>
                </Box>

                {/* Patient Name */}
                <Box sx={{mb: 2, zIndex: 1, position: "relative"}}>
                    <EditableField
                        label="Nome do Paciente"
                        value={formData.nome || formData.patientName}
                        isEditing={isEditing}
                        onChange={handleChange('nome')}
                        required
                        error={validationErrors.nome}
                        helperText={validationErrors.nome ? "Nome é obrigatório" : ""}
                        sx={{fontWeight: 600, fontSize: '16px'}}
                        InputProps={{
                            sx: {
                                '& .MuiInputBase-input': {
                                    fontWeight: 600,
                                    fontSize: '18px',
                                }
                            }
                        }}
                    />
                </Box>

                {/* Expand/Collapse Button */}
                <Button
                    onClick={onToggle}
                    variant="contained"
                    endIcon={expanded ? <KeyboardArrowLeftIcon/> : <KeyboardArrowRightIcon/>}
                    sx={{
                        height: 44,
                        borderRadius: 99,
                        backgroundColor: expanded ? themeColors.primaryLight : "#FFF",
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        textTransform: "none",
                        border: "1px solid #111E5A",
                        mb: 3,
                        transition: "all 0.3s ease",
                        "&:hover": {
                            backgroundColor: expanded ?
                                themeColors.primaryLight :
                                themeColors.primaryLight,
                            color: themeColors.primary,
                            borderColor: themeColors.primary,
                        },
                    }}
                >
                    {expanded ? "Recolher informações" : "Ver mais informações"}
                </Button>

                {/* Status do Paciente */}
                {patientStatus.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: 14,
                                fontWeight: 500,
                                opacity: 0.6,
                                mb: 1,
                            }}
                        >
                            Status do Paciente
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {patientStatus.map((status, index) => {
                                const colorScheme = getStatusColor(status);
                                return (
                                    <Chip
                                        key={index}
                                        label={status}
                                        sx={{
                                            height: 36,
                                            borderRadius: 99,
                                            padding: "0 15px",
                                            backgroundColor: colorScheme.bg,
                                            color: colorScheme.color,
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: 14,
                                            fontWeight: 500,
                                            border: `1px solid ${colorScheme.bg}`,
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </>
                )}

                {/* Health Plans */}
                {healthPlans.length > 0 ? (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: 14,
                                fontWeight: 500,
                                opacity: 0.6,
                                mb: 1,
                            }}
                        >
                            Planos de Saúde
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            {healthPlans.map((plan, index) => {
                                const planName = plan.name || "Plano";
                                const planType = plan.type || "Não especificado";
                                const planNumber = plan.number || "-";
                                const planValidity = plan.validUntil ? formatDate(plan.validUntil) : "-";
                                const colorScheme = getHealthPlanColor(planName);

                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            backgroundColor: colorScheme.bg,
                                            borderRadius: '10px',
                                            padding: '8px 12px',
                                            border: `1px solid ${colorScheme.bg}`,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: colorScheme.color,
                                                fontFamily: "Gellix, sans-serif",
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {planName}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography
                                                sx={{
                                                    color: colorScheme.color,
                                                    fontFamily: "Gellix, sans-serif",
                                                    fontSize: 12,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {planType}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: colorScheme.color,
                                                    fontFamily: "Gellix, sans-serif",
                                                    fontSize: 12,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                Válido até: {planValidity}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            sx={{
                                                color: colorScheme.color,
                                                fontFamily: "Gellix, sans-serif",
                                                fontSize: 11,
                                                mt: 0.5,
                                                opacity: 0.85,
                                            }}
                                        >
                                            Nº {planNumber}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </>
                ) : (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: themeColors.textPrimary,
                            fontFamily: "Gellix, sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            mb: 2,
                        }}
                    >
                        plano de saúde não cadastrado
                    </Typography>
                )}

                {/* Chronic Diseases */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.6,
                        mb: 1,
                    }}
                >
                    Doenças Crônicas
                </Typography>

                <EditableChipList
                    items={chronicDiseases}
                    isEditing={isEditing}
                    onAdd={handleAddChronicDisease}
                    onDelete={handleDeleteChronicDisease}
                    emptyText="Nenhuma doença crônica"
                    newItemPlaceholder="Nova doença crônica..."
                    colorScheme={{bg: themeColors.chronic.default.bg, color: themeColors.chronic.default.color}}
                />

                {/* General Information */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.6,
                        mb: 1,
                    }}
                >
                    Informações Gerais
                </Typography>

                <Stack spacing={2} sx={{mb: 2}}>
                    {/* Blood Type */}
                    <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                        <Box
                            component="img"
                            src="/sangue.svg"
                            alt="Tipo Sanguíneo"
                            sx={{
                                width: 24,
                                height: 24,
                                mt: isEditing ? 2 : 0
                            }}
                        />
                        {isEditing ? (
                            <FormControl sx={{minWidth: 120}} size="small">
                                <InputLabel id="blood-type-label">Tipo Sanguíneo</InputLabel>
                                <Select
                                    labelId="blood-type-label"
                                    value={formData.tipoSanguineo || formData.bloodType || ""}
                                    onChange={handleChange('tipoSanguineo')}
                                    label="Tipo Sanguíneo"
                                    sx={{
                                        borderRadius: '10px',
                                        backgroundColor: themeColors.backgroundPrimary,
                                        '& .MuiSelect-select': {
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '14px',
                                            color: themeColors.textPrimary,
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Não informado</em>
                                    </MenuItem>
                                    {fieldConfig.tipoSanguineo.options.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <>
                                <Typography
                                    sx={{
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    Tipo Sanguíneo:
                                </Typography>
                                <Typography
                                    sx={{
                                        color: themeColors.primary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    {formData.tipoSanguineo || formData.bloodType || "-"}
                                </Typography>
                            </>
                        )}
                    </Stack>

                    {/* Birth Date */}
                    <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                        <Box
                            component="img"
                            src="/nascimento.svg"
                            alt="Data de Nascimento"
                            sx={{
                                width: 24,
                                height: 24,
                                mt: isEditing ? 1.5 : 0
                            }}
                        />
                        {isEditing ? (
                            <TextField
                                label="Data de Nascimento"
                                type="date"
                                value={formData.dataNascimento || formData.birthDate || ""}
                                onChange={handleChange('dataNascimento')}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                error={validationErrors.dataNascimento}
                                helperText={validationErrors.dataNascimento ? "Data é obrigatória" : ""}
                                size="small"
                                sx={{
                                    width: 200,
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <Typography
                                    sx={{
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    Data de Nascimento:
                                </Typography>
                                <Typography
                                    sx={{
                                        color: themeColors.primary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    {formData.dataNascimento || formData.birthDate || "-"}
                                </Typography>
                            </>
                        )}
                    </Stack>
                </Stack>

                {/* Contact */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.6,
                        mb: 1,
                    }}
                >
                    Contato
                </Typography>

                <Stack spacing={2}>
                    {/* Mobile */}
                    <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                        <Box
                            component="img"
                            src="/celular.svg"
                            alt="Celular"
                            sx={{
                                width: 24,
                                height: 24,
                                mt: isEditing ? 1.5 : 0
                            }}
                        />

                        {isEditing ? (
                            <TextField
                                label="Celular"
                                value={getSafeValue(formData, 'contato.celular') || formData.patientPhone || formData.phone || ""}
                                onChange={handleChange('contato.celular')}
                                required
                                error={validationErrors['contato.celular']}
                                helperText={validationErrors['contato.celular'] ? "Celular é obrigatório" : ""}
                                placeholder="(99) 99999-9999"
                                size="small"
                                sx={{
                                    width: 200,
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <Typography
                                    sx={{
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    Celular:
                                </Typography>
                                <Typography
                                    sx={{
                                        color: themeColors.primary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    {getSafeValue(formData, 'contato.celular') || formData.patientPhone || formData.phone || "-"}
                                </Typography>
                            </>
                        )}
                    </Stack>

                    {/* Landline - Only show if exists or in edit mode */}
                    {(isEditing || (getSafeValue(formData, 'contato.fixo') && getSafeValue(formData, 'contato.fixo') !== "-") ||
                        (formData.secondaryPhone && formData.secondaryPhone !== "-")) && (
                        <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                            <Box
                                component="img"
                                src="/telefone.svg"
                                alt="Telefone"
                                sx={{
                                    width: 24,
                                    height: 24,
                                    mt: isEditing ? 1.5 : 0
                                }}
                            />

                            {isEditing ? (
                                <TextField
                                    label="Telefone Fixo"
                                    value={getSafeValue(formData, 'contato.fixo') || formData.secondaryPhone || ""}
                                    onChange={handleChange('contato.fixo')}
                                    placeholder="(99) 9999-9999"
                                    size="small"
                                    sx={{
                                        width: 200,
                                        '& .MuiInputLabel-root': {
                                            color: themeColors.textTertiary,
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '13px',
                                        },
                                        '& .MuiInputBase-input': {
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '14px',
                                            color: themeColors.textPrimary,
                                        }
                                    }}
                                    InputProps={{
                                        sx: {
                                            borderRadius: '10px',
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    <Typography
                                        sx={{
                                            color: themeColors.textPrimary,
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: 15,
                                            fontWeight: 500,
                                        }}
                                    >
                                        Fixo:
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: themeColors.primary,
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: 15,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {getSafeValue(formData, 'contato.fixo') || formData.secondaryPhone}
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    )}

                    {/* Additional Contact - Only show if exists or user clicked add button */}
                    {(isEditing && showAdditionalContactForm) || (getSafeValue(formData, 'contato.adicional') && getSafeValue(formData, 'contato.adicional') !== "-") ? (
                        <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                            <Box
                                component="img"
                                src="/celular.svg"
                                alt="Contato Adicional"
                                sx={{
                                    width: 24,
                                    height: 24,
                                    mt: isEditing ? 1.5 : 0
                                }}
                            />

                            {isEditing ? (
                                <TextField
                                    label="Contato Adicional"
                                    value={getSafeValue(formData, 'contato.adicional') || ""}
                                    onChange={handleChange('contato.adicional')}
                                    placeholder="(99) 99999-9999"
                                    size="small"
                                    sx={{
                                        width: 200,
                                        '& .MuiInputLabel-root': {
                                            color: themeColors.textTertiary,
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '13px',
                                        },
                                        '& .MuiInputBase-input': {
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '14px',
                                            color: themeColors.textPrimary,
                                        }
                                    }}
                                    InputProps={{
                                        sx: {
                                            borderRadius: '10px',
                                        }
                                    }}
                                />
                            ) : (
                                <>
                                    <Typography
                                        sx={{
                                            color: themeColors.textPrimary,
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: 15,
                                            fontWeight: 500,
                                        }}
                                    >
                                        Contato adicional:
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: themeColors.primary,
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: 15,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {getSafeValue(formData, 'contato.adicional')}
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    ) : null}

                    {/* Add Contact Button - Only in edit mode */}
                    {isEditing && !showAdditionalContactForm && (
                        getSafeValue(formData, 'contato.adicional') === "-" ||
                        getSafeValue(formData, 'contato.adicional') === "" ||
                        !formData.contato?.adicional
                    ) && (
                        <Button
                            variant="text"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={toggleAdditionalContactForm}
                            sx={{
                                textTransform: 'none',
                                color: themeColors.primary,
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px',
                                fontWeight: 500,
                                justifyContent: 'flex-start',
                                pl: 0,
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    color: themeColors.primaryDark,
                                }
                            }}
                        >
                            Adicionar contato
                        </Button>
                    )}

                    {/* Email */}
                    <Stack direction="row" alignItems={isEditing ? "flex-start" : "center"} spacing={1}>
                        <Box
                            component="img"
                            src="/email.svg"
                            alt="Email"
                            sx={{
                                width: 24,
                                height: 24,
                                mt: isEditing ? 1.5 : 0
                            }}
                        />

                        {isEditing ? (
                            <TextField
                                label="Email"
                                value={getSafeValue(formData, 'contato.email') || formData.patientEmail || formData.email || ""}
                                onChange={handleChange('contato.email')}
                                error={validationErrors['contato.email']}
                                helperText={validationErrors['contato.email'] ? "Email válido é obrigatório" : ""}
                                placeholder="email@exemplo.com"
                                type="email"
                                size="small"
                                sx={{
                                    width: '90%',
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <Typography
                                    sx={{
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    Email:
                                </Typography>
                                <Typography
                                    sx={{
                                        color: themeColors.primary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 15,
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {getSafeValue(formData, 'contato.email') || formData.patientEmail || formData.email || "-"}
                                </Typography>
                            </>
                        )}
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
}
// ----------------------
// Enhanced Card2 Component
// ----------------------
function Card2({formData, setFormData, isEditing, validationErrors}) {
    const handleChange = (field) => (e) => {
        let value = e.target.value;

        // Apply special formatting based on field
        if (field === 'endereco.cep') {
            value = applyCepMask(value);
        }

        // Update nested field
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            // Update top-level field
            setFormData({
                ...formData,
                [field]: value
            });
        }
    };

    // Handlers for editable lists
    const handleAddCirurgia = (item) => {
        const currentItems = [...(formData.cirurgias || [])];
        setFormData({
            ...formData,
            cirurgias: [...currentItems, item]
        });
    };

    const handleDeleteCirurgia = (index) => {
        const currentItems = [...(formData.cirurgias || [])];
        currentItems.splice(index, 1);
        setFormData({
            ...formData,
            cirurgias: currentItems
        });
    };

    const handleAddAlergia = (item) => {
        const currentItems = [...(formData.alergias || [])];
        setFormData({
            ...formData,
            alergias: [...currentItems, item]
        });
    };

    const handleDeleteAlergia = (index) => {
        const currentItems = [...(formData.alergias || [])];
        currentItems.splice(index, 1);
        setFormData({
            ...formData,
            alergias: currentItems
        });
    };

    const handleAddAtividade = (item) => {
        const currentItems = [...(formData.atividadeFisica || [])];
        setFormData({
            ...formData,
            atividadeFisica: [...currentItems, item]
        });
    };

    const handleDeleteAtividade = (index) => {
        const currentItems = [...(formData.atividadeFisica || [])];
        currentItems.splice(index, 1);
        setFormData({
            ...formData,
            atividadeFisica: currentItems
        });
    };

    // Normaliza arrays para itens clicáveis
    const getCirurgias = () => {
        if (formData.cirurgias && formData.cirurgias.length > 0) {
            return formData.cirurgias;
        }
        if (formData.condicoesClinicas?.cirurgias && formData.condicoesClinicas.cirurgias.length > 0) {
            return formData.condicoesClinicas.cirurgias;
        }
        return [];
    };

    const getAlergias = () => {
        if (formData.alergias && formData.alergias.length > 0) {
            return formData.alergias;
        }
        if (formData.allergies && formData.allergies.length > 0) {
            return formData.allergies;
        }
        if (formData.condicoesClinicas?.alergias && formData.condicoesClinicas.alergias.length > 0) {
            return formData.condicoesClinicas.alergias;
        }
        return [];
    };

    const getAtividadeFisica = () => {
        if (formData.atividadeFisica && formData.atividadeFisica.length > 0) {
            return formData.atividadeFisica;
        }
        if (formData.condicoesClinicas?.atividades && formData.condicoesClinicas.atividades.length > 0) {
            return formData.condicoesClinicas.atividades;
        }
        return [];
    };

    const getHistoricoMedico = () => {
        return formData.historicoMedico ||
            formData.historicoConduta?.doencasHereditarias ||
            "O paciente relata histórico familiar de hipertensão arterial em parentes de primeiro grau (pai e avô). Há também casos de diabetes tipo 2 em familiares maternos. Não há histórico conhecido de doenças genéticas raras ou hereditárias graves.";
    };

    const cirurgias = getCirurgias();
    const alergias = getAlergias();
    const atividadeFisica = getAtividadeFisica();
    const historicoMedico = getHistoricoMedico();

    return (
        <Box sx={{
            p: "25px 5px 5px 5px",
            m: '20px 20px 20px 20px',
            backgroundColor: themeColors.lightBg,
            borderRadius: '20px',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: "none",
            overflow: "visible",
            height: "auto",
            minHeight: "0",
            boxShadow: isEditing ? 'inset 0 0 0 2px rgba(24, 82, 254, 0.1)' : 'none',
        }}>
            {/* Endereço Completo */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 2,
                    ml: "15px"
                }}
            >
                Endereço Completo
            </Typography>

            {/* Endereço */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{mb: 2, ml: "15px"}}>
                <Box
                    component="img"
                    src="/endereco.svg"
                    alt="Endereço"
                    sx={{width: 24, height: 24, mt: 0.5}}
                />
                <Box sx={{width: '85%'}}>
                    <EditableField
                        label="Endereço"
                        value={formData.endereco?.rua || formData.patientAddress || formData.address}
                        isEditing={isEditing}
                        onChange={handleChange('endereco.rua')}
                        fullWidth
                    />
                </Box>
            </Stack>

            {/* Cidade */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{mb: 2, ml: "15px"}}>
                <Box
                    component="img"
                    src="/cidade.svg"
                    alt="Cidade"
                    sx={{width: 24, height: 24, mt: 0.5,}}
                />
                <Box sx={{display: 'flex', flexDirection: 'row', gap: 2, width: '85%'}}>
                    <EditableField
                        label="Cidade"
                        value={formData.endereco?.cidade || formData.city}
                        isEditing={isEditing}
                        onChange={handleChange('endereco.cidade')}
                        sx={{flex: 2}}
                    />

                    {isEditing && (
                        <FormControl sx={{flex: 1}} size="small">
                            <InputLabel id="estado-label">Estado</InputLabel>
                            <Select
                                labelId="estado-label"
                                value={formData.endereco?.estado || formData.state || ""}
                                onChange={handleChange('endereco.estado')}
                                label="Estado"
                                sx={{
                                    borderRadius: '10px',
                                    backgroundColor: themeColors.backgroundPrimary,
                                    '& .MuiSelect-select': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <em>Não informado</em>
                                </MenuItem>
                                {fieldConfig.estado.options.map((state) => (
                                    <MenuItem key={state} value={state}>{state}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </Stack>

            {/* CEP */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{mb: 4, ml: "15px"}}>
                <Box
                    component="img"
                    src="/cep.svg"
                    alt="CEP"
                    sx={{width: 24, height: 24, mt: 0.5,}}
                />
                <Box sx={{width: '50%'}}>
                    <EditableField
                        label="CEP"
                        value={formData.endereco?.cep || formData.cep}
                        isEditing={isEditing}
                        onChange={handleChange('endereco.cep')}
                        placeholder="99999-999"
                    />
                </Box>
            </Stack>

            <Divider sx={{width: '90%', mx: 'auto', mb: 2}}/>

            {/* Cirurgias */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "15px"
                }}
            >
                Cirurgias
            </Typography>

            <Box sx={{mx: "15px", mb: 3}}>
                <EditableChipList
                    items={cirurgias}
                    isEditing={isEditing}
                    onAdd={handleAddCirurgia}
                    onDelete={handleDeleteCirurgia}
                    emptyText="Sem cirurgias anteriores"
                    newItemPlaceholder="Digite o tipo de cirurgia..."
                />
            </Box>

            {/* Alergias */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "15px"
                }}
            >
                Alergias
            </Typography>

            <Box sx={{mx: "15px", mb: 3}}>
                <EditableChipList
                    items={alergias}
                    isEditing={isEditing}
                    onAdd={handleAddAlergia}
                    onDelete={handleDeleteAlergia}
                    emptyText="Sem alergias conhecidas"
                    newItemPlaceholder="Digite a alergia..."
                />
            </Box>

            {/* Atividade Física */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "15px"
                }}
            >
                Atividade Física
            </Typography>

            <Box sx={{mx: "15px", mb: 3}}>
                <EditableChipList
                    items={atividadeFisica}
                    isEditing={isEditing}
                    onAdd={handleAddAtividade}
                    onDelete={handleDeleteAtividade}
                    emptyText="Sem atividade física regular"
                    newItemPlaceholder="Digite a atividade física..."
                />
            </Box>

            {/* Histórico/Doenças Genéticas */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "15px"
                }}
            >
                Histórico/Doenças Genéticas
            </Typography>

            <Box sx={{mx: "15px", mb: 3}}>
                <EditableField
                    label="Histórico Médico Familiar"
                    value={historicoMedico}
                    isEditing={isEditing}
                    onChange={handleChange('historicoMedico')}
                    multiline
                    rows={4}
                />
            </Box>
        </Box>
    );
}

function Card3({ doctorId, patientId, formData, setFormData, isEditing, validationErrors }) {

    const [showHealthPlanForm, setShowHealthPlanForm] = useState(false);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(-1);


    // Status disponíveis para o paciente
    const availableStatus = [
        { label: "Particular", bgColor: "#E5F8FF", textColor: "#1C94E0"},
        { label: "Convênio", bgColor: "#E9EFFF", textColor: "#1852FE"},
        { label: "Internado", bgColor: "#FFE8E5", textColor: "#FF4B55"},
        { label: "Pós-cirurgia", bgColor: "#EFE6FF", textColor: "#7B4BC9"},
        { label: "Gestante", bgColor: "#FFF4E5", textColor: "#FFAB2B"},
        { label: "Alta", bgColor: "#E5FFF2", textColor: "#0CAF60"}
    ];

    // Tipos de planos de saúde
    const healthPlanTypes = [
        "Básico",
        "Intermediário",
        "Premium",
        "Corporativo",
        "Familiar",
        "Completo",
        "Individual",
        "Odontológico",
        "Hospitalar",
        "Ambulatorial",
        "Outro"
    ];



    // Formatação segura para datas
    const formatDate = (dateValue) => {
        if (!dateValue) return "-";

        try {
            // Checar se é um Timestamp do Firestore (com seconds e nanoseconds)
            if (dateValue.seconds) {
                return new Date(dateValue.seconds * 1000).toLocaleDateString();
            }

            // Checar se é um objeto Date
            if (dateValue instanceof Date) {
                return dateValue.toLocaleDateString();
            }

            // Tentar converter para Date
            return new Date(dateValue).toLocaleDateString();
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return "-";
        }
    };

    // Handle form changes
    const handleChange = (field) => (e) => {
        const value = e.target.value;

        // Update nested field
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            // Update top-level field
            setFormData({
                ...formData,
                [field]: value
            });
        }
    };

    // Handlers for health plans
    const getHealthPlans = () => {
        if (Array.isArray(formData.healthPlans) && formData.healthPlans.length > 0) {
            return formData.healthPlans;
        }
        return [];
    };

    // Atualiza apenas o plano em edição no estado local, mas não atualiza o formData ainda
    const [currentEditingPlan, setCurrentEditingPlan] = useState({});





    const handleAddHealthPlan = () => {
        setCurrentPlanIndex(-1); // -1 means new plan
        setShowHealthPlanForm(true);
    };

    const handleEditHealthPlan = (index) => {
        setCurrentPlanIndex(index);
        setShowHealthPlanForm(true);
    };

    const handleDeleteHealthPlan = (index) => {
        const healthPlans = [...getHealthPlans()];
        healthPlans.splice(index, 1);

        setFormData({
            ...formData,
            healthPlans: healthPlans,
            // Keep backward compatibility
            healthPlan: healthPlans[0] || {}
        });
    };

    const handleSaveHealthPlan = (updatedPlan) => {
        // Salvar o plano enviado pelo diálogo para o formData
        const healthPlans = [...getHealthPlans()];

        if (currentPlanIndex >= 0 && currentPlanIndex < healthPlans.length) {
            // Update existing plan
            healthPlans[currentPlanIndex] = updatedPlan;
        } else {
            // Add new plan
            healthPlans.push(updatedPlan);
        }

        setFormData({
            ...formData,
            healthPlans: healthPlans,
        });

        setShowHealthPlanForm(false);
    };

    const handleCancelHealthPlan = () => {
        setShowHealthPlanForm(false);
        setCurrentEditingPlan({});
    };

    // Generate a color for health plan based on plan name
    const getHealthPlanColor = (planName, index) => {
        const planColors = [
            {bg: "#E5F8FF", color: "#1C94E0", border: "#A8DCFF"},
            {bg: "#E9EFFF", color: "#1852FE", border: "#B9C8FF"},
            {bg: "#EFE6FF", color: "#7B4BC9", border: "#D3BDFF"},
            {bg: "#FFF4E5", color: "#FFAB2B", border: "#FFD89E"},
            {bg: "#E5FFF2", color: "#0CAF60", border: "#A8FFCF"}
        ];

        // Use index first for consistent colors across plans
        if (index < planColors.length) {
            return planColors[index];
        }

        // If more than available colors, generate from name
        const hash = planName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        return planColors[hash % planColors.length];
    };



    // Handlers for status
    const getStatusColor = (statusLabel) => {
        const foundStatus = availableStatus.find(s => s.label === statusLabel);
        return foundStatus || { bgColor: "#F8F9FB", textColor: "#111E5A" };
    };

    const handleAddStatus = (status) => {
        const currentStatusList = [...(formData.statusList || [])];
        if (!currentStatusList.includes(status)) {
            setFormData({
                ...formData,
                statusList: [...currentStatusList, status]
            });
        }
    };

    const handleDeleteStatus = (index) => {
        const currentStatusList = [...(formData.statusList || [])];
        currentStatusList.splice(index, 1);
        setFormData({
            ...formData,
            statusList: currentStatusList
        });
    };


    const HealthPlanFormDialog = React.memo(({
                                                 open,
                                                 onClose,
                                                 onSave,
                                                 plan,
                                                 healthPlanTypes
                                             }) => {
        // Criar um estado local interno para o form, inicializado com os dados do plano
        const [localPlan, setLocalPlan] = useState(plan);

        // Sincronizar o estado local quando um novo plano é recebido como prop
        useEffect(() => {
            setLocalPlan(plan);
        }, [plan.id]); // Apenas sincroniza quando muda o ID do plano (ou seja, quando é um plano diferente)

        // Handler que atualiza apenas o estado LOCAL, sem afetar o componente pai
        const handleChange = (field) => (e) => {
            const value = e.target.value;
            setLocalPlan(prev => ({
                ...prev,
                [field]: value
            }));
        };

        // Enviar o plano local para o componente pai apenas quando o usuário clicar em salvar
        const handleSave = () => {
            onSave(localPlan);
        };

        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        padding: '10px'
                    }
                }}
            >
                <DialogTitle sx={{
                    fontFamily: 'Gellix, sans-serif',
                    fontSize: '18px',
                    color: themeColors.textPrimary
                }}>
                    {plan.id ? "Editar Plano de Saúde" : "Adicionar Plano de Saúde"}
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Nome do Plano"
                                value={localPlan.name || ""}
                                autoComplete="new-password"
                                onChange={handleChange('name')}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Número do Plano"
                                value={localPlan.number || ""}
                                autoComplete="new-password"
                                onChange={handleChange('number')}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Data de Validade"
                                type="date"
                                autoComplete="new-password"
                                value={localPlan.validUntil || ""}
                                onChange={handleChange('validUntil')}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.textTertiary,
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                                InputProps={{
                                    sx: {
                                        borderRadius: '10px',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="plan-type-label">Tipo de Plano</InputLabel>
                                <Select
                                    labelId="plan-type-label"
                                    value={localPlan.type || ""}
                                    onChange={handleChange('type')}
                                    label="Tipo de Plano"
                                    sx={{
                                        borderRadius: '10px',
                                        '& .MuiSelect-select': {
                                            fontFamily: 'Gellix, sans-serif',
                                            fontSize: '14px',
                                            color: themeColors.textPrimary,
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Selecione um tipo</em>
                                    </MenuItem>
                                    {healthPlanTypes.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ padding: '0 24px 20px 24px' }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            textTransform: 'none',
                            color: themeColors.textSecondary,
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.lightBg,
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            textTransform: 'none',
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.primaryDark,
                            }
                        }}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    });



    const healthPlans = getHealthPlans();

    return (
        <Box sx={{
            p: "25px 5px 5px 5px",
            m: '20px 20px 20px 20px',
            backgroundColor: themeColors.lightBg,
            borderRadius: '20px',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: "none",
            overflow: "visible",
            height: "auto",
            minHeight: "0",
            boxShadow: isEditing ? 'inset 0 0 0 2px rgba(24, 82, 254, 0.1)' : 'none',
        }}>
            {/* Status do Paciente */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 2,
                    ml: "15px"
                }}
            >
                Status do Paciente
            </Typography>

            <Box sx={{ mx: "15px", mb: 3 }}>
                <EditableChipList
                    items={formData.statusList || []}
                    isEditing={isEditing}
                    onAdd={(status) => handleAddStatus(status)}
                    onDelete={handleDeleteStatus}
                    emptyText="Nenhum status definido"
                    newItemPlaceholder="Novo status..."
                    colorScheme={{ bg: themeColors.primaryLight, color: themeColors.primary }}
                />

                {isEditing && (
                    <Box sx={{ mt: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: themeColors.textSecondary,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: 13,
                                fontWeight: 500,
                                mb: 1,
                                display: 'block'
                            }}
                        >
                            Status disponíveis:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availableStatus.map((status) => (
                                <Chip
                                    key={status.label}
                                    label={status.label}
                                    onClick={() => handleAddStatus(status.label)}
                                    sx={{
                                        height: 36,
                                        borderRadius: 99,
                                        padding: "0 15px",
                                        backgroundColor: status.bgColor,
                                        color: status.textColor,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            <Divider sx={{ width: '90%', mx: 'auto', mb: 2 }} />

            {/* Planos de Saúde */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mx: "15px", mb: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 16,
                        fontWeight: 500,
                    }}
                >
                    Planos de Saúde
                </Typography>

                {isEditing && (
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddHealthPlan}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '13px',
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            '&:hover': {
                                backgroundColor: themeColors.primaryLight,
                                borderColor: themeColors.primary,
                            }
                        }}
                    >
                        Adicionar
                    </Button>
                )}
            </Box>

            <Box sx={{ mx: "15px", mb: 3 }}>
                {healthPlans.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {healthPlans.map((plan, index) => {
                            const colorScheme = getHealthPlanColor(plan.name, index);

                            return (
                                <Paper
                                    key={plan.id || index}
                                    elevation={0}
                                    sx={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        backgroundColor: '#fff',
                                        border: `1px solid ${colorScheme.border}`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '6px',
                                            height: '100%',
                                            backgroundColor: colorScheme.color,
                                        }
                                    }}
                                >
                                    {isEditing && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            display: 'flex',
                                            gap: 0.5
                                        }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditHealthPlan(index)}
                                                sx={{
                                                    backgroundColor: themeColors.primaryLight,
                                                    color: themeColors.primary,
                                                    width: 28,
                                                    height: 28,
                                                    '&:hover': {
                                                        backgroundColor: `${themeColors.primaryLight}dd`,
                                                    }
                                                }}
                                            >
                                                <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteHealthPlan(index)}
                                                sx={{
                                                    backgroundColor: '#FFE8E5',
                                                    color: themeColors.error,
                                                    width: 28,
                                                    height: 28,
                                                    '&:hover': {
                                                        backgroundColor: '#FFD6D6',
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    )}

                                    <Box sx={{ pl: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Gellix, sans-serif',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    color: colorScheme.color,
                                                    mr: 1,
                                                }}
                                            >
                                                {plan.name || "Plano sem nome"}
                                            </Typography>
                                            <Chip
                                                label={plan.type || "Tipo não especificado"}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    borderRadius: 12,
                                                    backgroundColor: colorScheme.bg,
                                                    color: colorScheme.color,
                                                    fontSize: '11px',
                                                    fontFamily: 'Gellix, sans-serif',
                                                }}
                                            />
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '12px',
                                                        color: themeColors.textTertiary,
                                                    }}
                                                >
                                                    Número do plano
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '14px',
                                                        fontWeight: 500,
                                                        color: themeColors.textPrimary,
                                                    }}
                                                >
                                                    {plan.number || "-"}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '12px',
                                                        color: themeColors.textTertiary,
                                                    }}
                                                >
                                                    Validade
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '14px',
                                                        fontWeight: 500,
                                                        color: themeColors.textPrimary,
                                                    }}
                                                >
                                                    {plan.validUntil ? formatDate(plan.validUntil) : "-"}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            borderRadius: '10px',
                            border: `1px dashed ${themeColors.borderColor}`,
                        }}
                    >
                        <Box
                            component="img"
                            src="/sangue.svg"
                            alt="Planos de Saúde"
                            sx={{ width: 60, height: 60, opacity: 0.5, mb: 2 }}
                        />
                        <Typography
                            sx={{
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '14px',
                                color: themeColors.textSecondary,
                                textAlign: 'center',
                            }}
                        >
                            Nenhum plano de saúde cadastrado
                        </Typography>
                        {isEditing && (
                            <Button
                                variant="text"
                                startIcon={<AddIcon />}
                                onClick={handleAddHealthPlan}
                                sx={{
                                    mt: 2,
                                    textTransform: 'none',
                                    fontFamily: 'Gellix, sans-serif',
                                    color: themeColors.primary,
                                }}
                            >
                                Adicionar plano de saúde
                            </Button>
                        )}
                    </Box>
                )}
            </Box>

            <Divider sx={{ width: '90%', mx: 'auto', mb: 2 }} />

            {/* Conduta Inicial */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mx: "15px", mb: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: 16,
                        fontWeight: 500,
                    }}
                >
                    Conduta Inicial
                </Typography>
            </Box>

            <Box sx={{ mx: "15px", mb: 3 }}>
                <EditableField
                    label="Conduta Inicial do Médico"
                    value={formData.historicoConduta?.condutaInicial || ""}
                    isEditing={isEditing}
                    onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                            ...prev,
                            historicoConduta: {
                                ...prev.historicoConduta,
                                condutaInicial: value
                            }
                        }));
                    }}
                    multiline
                    rows={4}
                    sx={{
                        '& .MuiInputBase-root': {
                            backgroundColor: '#fff',
                            borderRadius: '10px',
                        }
                    }}
                />
            </Box>



            {/* Diálogo de formulário de plano de saúde */}
            {showHealthPlanForm && (
                <HealthPlanFormDialog
                    open={showHealthPlanForm}
                    onClose={handleCancelHealthPlan}
                    onSave={handleSaveHealthPlan}
                    plan={currentPlanIndex >= 0 ? getHealthPlans()[currentPlanIndex] : {id: `plan-${Date.now()}`}}
                    healthPlanTypes={healthPlanTypes}
                />
            )}
        </Box>
    );
}

// ----------------------
// Enhanced Main Component
// ----------------------
export default function PacienteCard({paciente}) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({...paciente});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({open: false, message: '', severity: 'success'});
    const [validationErrors, setValidationErrors] = useState({});
    const {user, getEffectiveUserId} = useAuth();
    const { canPerformAction } = useModuleAccess();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
    const isMedium = useMediaQuery(theme.breakpoints.down("md"));

    // Update formData when paciente changes
    useEffect(() => {
        setFormData({...paciente});
    }, [paciente]);

    const handleToggle = () => {
        setExpanded((prev) => !prev);

    };

    // Validate form data
    const validateForm = () => {
        const errors = {};

        // Required fields validation
        if (!formData.nome && !formData.patientName) {
            errors.nome = true;
        }

        // Apenas o celular permanece obrigatório
        const celular = getSafeValue(formData, 'contato.celular') || formData.patientPhone || formData.phone;
        if (!celular) {
            errors['contato.celular'] = true;
        }

        // Email não é mais obrigatório, mas deve ser válido se fornecido
        const email = getSafeValue(formData, 'contato.email') || formData.patientEmail || formData.email;
        if (email && email !== "-" && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            errors['contato.email'] = true;
        }

        // Return true if no errors
        if (Object.keys(errors).length === 0) {
            setValidationErrors({});
            return true;
        } else {
            setValidationErrors(errors);
            return false;
        }
    };

    // Process form data for Firebase - versão corrigida
    const prepareFormDataForFirebase = () => {
        // Função auxiliar para limpar valores '-'
        const cleanValue = (value) => {
            return value === '-' ? '' : value;
        };

        // Map the form data structure to what Firebase expects
        const processedData = {
            // Basic info
            patientName: formData.nome || formData.patientName,
            birthDate: formData.dataNascimento || formData.birthDate || '',
            bloodType: formData.tipoSanguineo || formData.bloodType || '',

            // Contact - com limpeza de valores "-"
            patientPhone: cleanValue(getSafeValue(formData, 'contato.celular')) || formData.patientPhone || formData.phone,
            secondaryPhone: cleanValue(getSafeValue(formData, 'contato.fixo')) || formData.secondaryPhone || '',
            contatoAdicional: cleanValue(getSafeValue(formData, 'contato.adicional')) || '',
            patientEmail: cleanValue(getSafeValue(formData, 'contato.email')) || formData.patientEmail || formData.email || '',

            // O resto do seu código permanece o mesmo...
            patientAddress: formData.endereco?.rua || formData.patientAddress || formData.address,
            city: formData.endereco?.cidade || formData.city,
            state: formData.endereco?.estado || formData.state,
            cep: formData.endereco?.cep || formData.cep,

            // Medical info
            chronicDiseases: formData.chronicDiseases || [],
            allergies: formData.alergias || formData.allergies || [],

            // Status list e Health Plans (explicitamente salvos)
            statusList: formData.statusList || [],
            healthPlans: formData.healthPlans || [],
            healthPlan: formData.healthPlan || {}, // Manter compatibilidade

            // Mapped nested objects - maintain backward compatibility
            condicoesClinicas: {
                cirurgias: formData.cirurgias || [],
                alergias: formData.alergias || [],
                atividades: formData.atividadeFisica || [],
                doencas: formData.chronicDiseases || [],
                ehFumante: formData.chronicDiseases?.includes("Fumante") ? "Sim" : "Não"
            },

            historicoConduta: {
                doencasHereditarias: formData.historicoMedico || formData.historicoConduta?.doencasHereditarias || "",
                condutaInicial: formData.historicoConduta?.condutaInicial || ""
            },
        };

        return processedData;
    };

    const handleSave = async () => {
        // Validate form
        if (!validateForm()) {
            setAlert({
                open: true,
                message: 'Por favor, preencha todos os campos obrigatórios.',
                severity: 'error'
            });
            return;
        }

        // Check if we have necessary IDs
        if (!paciente.id || !user?.uid) {
            setAlert({
                open: true,
                message: 'Erro de identificação do paciente ou médico.',
                severity: 'error'
            });
            return;
        }

        try {
            setLoading(true);

            // Prepare data for Firebase
            const dataToSave = prepareFormDataForFirebase();

            // Handle photo upload if there's a new photo
            if (formData.photoFile) {
                try {
                    // Define the storage path - add timestamp to avoid name collisions
                    const photoFileName = `${Date.now()}_${formData.photoFile.name}`;
                    const photoPath = `users/${getEffectiveUserId()}/patients/${paciente.id}/profilePhoto/${photoFileName}`;

                    // Upload the new photo
                    const photoURL = await FirebaseService.uploadFile(formData.photoFile, photoPath);

                    // Delete previous photo if it exists and is different
                    if (paciente.photoURL && paciente.photoURL !== photoURL) {
                        try {
                            await FirebaseService.deleteFile(paciente.photoURL);
                            console.log("Previous photo deleted successfully");
                        } catch (error) {
                            console.warn("Could not delete previous photo:", error);
                            // Continue even if deletion fails
                        }
                    }

                    // Update the data to save
                    dataToSave.photoURL = photoURL;
                    dataToSave.fotoPerfil = photoURL; // For backwards compatibility
                } catch (photoError) {
                    console.error("Error handling photo upload:", photoError);
                    // Continue with saving other data even if photo upload fails
                }
            }

            // Update in Firebase
            await FirebaseService.updatePatient(getEffectiveUserId(), paciente.id, dataToSave);

            // Update successful
            setIsEditing(false);
            setAlert({
                open: true,
                message: 'Dados do paciente atualizados com sucesso!',
                severity: 'success'
            });
        } catch (error) {
            console.error("Erro ao salvar dados do paciente:", error);
            setAlert({
                open: true,
                message: `Erro ao salvar: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAlert = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlert({...alert, open: false});
    };

    return (
        <>
            <Box
                sx={{
                    position: "relative",
                    width: expanded ? 
                        (isMobile ? "100%" : isTablet ? "95vw" : "1170px") : 
                        (isMobile ? "100%" : isTablet ? "100%" : "350px"),
                    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    marginBottom: "20px",
                    display: 'flex',
                    flexShrink: 0,
                    height: 'auto',
                    minHeight: "0",
                    maxHeight: "none",
                    alignSelf: "flex-start",
                    overflow: "visible",
                    zIndex: expanded ? 2 : 1,
                }}
            >
                <Paper
                    elevation={expanded ? 8 : 3}
                    sx={{
                        display: "flex",
                        flexDirection: expanded && isMobile ? "column" : "row",
                        backgroundColor: "#fff",
                        borderRadius: expanded && isMobile ? "16px" : (isMobile ? "16px" : isTablet ? "24px" : "40px"),
                        overflow: "visible",
                        border: isEditing
                            ? `1px solid ${themeColors.primary}`
                            : `1px solid ${themeColors.borderColor}`,
                        width: '100%',
                        height: 'auto',
                        maxHeight: "none",
                        minHeight: "0",
                        transition: "all 0.3s ease",
                        boxShadow: isEditing
                            ? `0 0 0 1px ${themeColors.primary}40, 0 8px 16px ${themeColors.shadowColor}`
                            : expanded
                                ? `0 8px 16px ${themeColors.shadowColor}`
                                : `0 2px 8px ${themeColors.shadowColor}`,
                    }}
                >
                    {/* Card1 - left side */}
                    <Card1
                        paciente={paciente}
                        expanded={expanded}
                        onToggle={handleToggle}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        formData={formData}
                        setFormData={setFormData}
                        validationErrors={validationErrors}
                        handleSave={handleSave}
                        loading={loading}
                    />

                    {/* Card2 - middle */}
                    {expanded && (
                        <Box
                            sx={{
                                width: isMobile ? "100%" : "400px",
                                visibility: "visible",
                                transform: "translateX(0)",
                                opacity: expanded ? 1 : 0,
                                transitionProperty: "width, opacity",
                                transitionDuration: "0.3s, 0.2s",
                                transitionDelay: "0s, 0.25s",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: isMobile ? "0" : "0", // Alterado para 0 já que agora é o do meio
                                flexGrow: 1,
                                height: 'auto',
                                minHeight: "0",
                                maxHeight: "none",
                                order: isMobile ? 2 : 'initial',
                            }}
                        >
                            <Card2
                                formData={formData}
                                setFormData={setFormData}
                                isEditing={isEditing}
                                validationErrors={validationErrors}
                            />
                        </Box>
                    )}

                    {/* Card3 - right side */}
                    {expanded && (
                        <Box
                            sx={{
                                width: isMobile ? "100%" : "400px",
                                visibility: "visible",
                                transform: "translateX(0)",
                                opacity: expanded ? 1 : 0,
                                transitionProperty: "width, opacity",
                                transitionDuration: "0.3s, 0.2s",
                                transitionDelay: "0s, 0.25s",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: isMobile ? "0" : "0 40px 40px 0", // Alterado para ser a borda da direita
                                flexGrow: 1,
                                height: 'auto',
                                minHeight: "0",
                                maxHeight: "none",
                                order: isMobile ? 3 : 'initial',
                            }}
                        >
                            <Card3
                                doctorId={user?.uid} // Passe o ID do médico conectado
                                patientId={paciente.id} // Passe o ID do paciente
                                formData={formData}
                                setFormData={setFormData}
                                isEditing={isEditing}
                                validationErrors={validationErrors}
                            />
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* Alert for feedback */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity={alert.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontFamily: 'Gellix, sans-serif',
                        borderRadius: '10px'
                    }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </>
    );
}