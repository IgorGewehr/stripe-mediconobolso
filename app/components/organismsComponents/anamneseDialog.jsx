"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    Snackbar,
    Alert,
    TextField,
    Grid,
    MenuItem,
    Chip,
    Stack,
    InputAdornment,
    Divider,
    Slider,
    styled,
    Dialog,
    DialogContent,
    DialogTitle,
    Slide,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MedicationIcon from "@mui/icons-material/Medication";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

// Firebase service
import firebaseService from "../../../lib/firebaseService";

// ------------------ ESTILOS ------------------
const FullScreenDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        margin: 0,
        borderRadius: "24px",
        maxWidth: "100vw",
        maxHeight: "100vh",
        backgroundColor: "#F4F9FF",
        overflowY: "hidden",
    },
    "& .MuiBackdrop-root": {
        backgroundColor: "rgba(255, 255, 255, 0.10)",
        backdropFilter: "blur(4px)",
    },
}));

const DialogHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2, 3),
    borderBottom: "1px solid #EAECEF",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: "24px 24px 0 0",
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
    color: "#111E5A",
    padding: theme.spacing(1),
    "&:hover": {
        backgroundColor: "rgba(17, 30, 90, 0.08)",
    },
}));

const DialogBody = styled(Box)(() => ({
    padding: 0,
    overflowY: "auto",
    height: "calc(100vh - 70px)", // Adjusts for header height
}));

const SectionContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    color: "#111E5A",
    fontFamily: "Gellix, sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    lineHeight: "24px",
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
    color: "#111E5A",
    fontFamily: "Gellix, sans-serif",
    fontSize: "16px",
    fontWeight: 500,
    lineHeight: "24px",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
}));

const SectionContent = styled(Box)(({ theme }) => ({
    backgroundColor: "#FFFFFF",
    border: "1px solid #EAECEF",
    borderRadius: "16px",
    padding: theme.spacing(3),
}));

const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "16px",
        "& fieldset": {
            borderColor: "rgba(17, 30, 90, 0.30)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(17, 30, 90, 0.50)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#111E5A",
        },
    },
}));

const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'bgColor'
})(({ bgColor }) => ({
    borderRadius: "999px",
    backgroundColor: bgColor || "#F5F5F5",
    height: "32px",
    margin: "4px",
    fontWeight: 500,
    "& .MuiChip-deleteIcon": {
        color: "rgba(0, 0, 0, 0.6)",
        "&:hover": {
            color: "rgba(0, 0, 0, 0.8)",
        },
    },
}));

const ToggleButton = styled(Button)(({ selected }) => ({
    borderRadius: "999px",
    backgroundColor: selected ? "#3366FF" : "#F0F2F5",
    color: selected ? "white" : "#111E5A",
    fontWeight: 500,
    padding: "8px 16px",
    textTransform: "none",
    minWidth: "80px",
    marginRight: "8px",
    boxShadow: "none",
    "&:hover": {
        backgroundColor: selected ? "#2952CC" : "#E0E2E5",
        boxShadow: "none",
    },
}));

const AddButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: "#3366FF",
    color: "white",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    "&:hover": {
        backgroundColor: "#2952CC",
    },
}));

const VitalSignCard = styled(Box)(({ theme }) => ({
    backgroundColor: "#FFFFFF",
    border: "1px solid #EAECEF",
    borderRadius: "16px",
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #EAECEF",
    position: "sticky",
    bottom: 0,
    zIndex: 2,
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: "999px",
    padding: "10px 36px",
    fontFamily: "Gellix, sans-serif",
    textTransform: "none",
    fontSize: "16px",
    fontWeight: 500,
    transition: "all 0.2s ease-in-out",
    boxShadow:
        variant === "contained"
            ? "0px 4px 10px rgba(17, 30, 90, 0.1)"
            : "none",
    ...(variant === "contained"
        ? {
            backgroundColor: "#111E5A",
            color: "white",
            "&:hover": {
                backgroundColor: "#0A144A",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(17, 30, 90, 0.2)",
            },
        }
        : {
            color: "#111E5A",
            borderColor: "#111E5A",
            "&:hover": {
                borderColor: "#0A144A",
                backgroundColor: "rgba(17, 30, 90, 0.04)",
            },
        }),
}));

// Transition for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// ------------------ COMPONENTE DE BOTÃO DE ATIVAÇÃO ------------------
export const AnamneseButton = ({ patientId, patientData, doctorId, variant = "contained", size = "medium", ...props }) => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (anamneseId) => {
        setOpen(false);
        if (props.onComplete && anamneseId) {
            props.onComplete(anamneseId);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                startIcon={<HistoryEduIcon />}
                onClick={handleClickOpen}
                sx={{
                    borderRadius: "999px",
                    textTransform: "none",
                    fontFamily: "Gellix, sans-serif",
                    ...(variant === "contained" && {
                        backgroundColor: "#111E5A",
                        color: "white",
                        "&:hover": {
                            backgroundColor: "#0A144A",
                        },
                    }),
                }}
                {...props}
            >
                {props.children || "Nova Anamnese"}
            </Button>

            <AnamneseDialog
                open={open}
                onClose={handleClose}
                patientId={patientId}
                doctorId={doctorId}
                patientData={patientData}
            />
        </>
    );
};

// ------------------ COMPONENTE PRINCIPAL DE DIÁLOGO ------------------
export default function AnamneseDialog({ open, onClose, patientId, doctorId, patientData }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Estado para controlar seções expandidas
    const [expandedSections, setExpandedSections] = useState({
        mainInfo: true,
        histories: true,
        lifestyle: true,
        medicationsAllergies: true,
        systemsReview: true,
        physicalExam: true,
        conclusions: true,
    });

    // Estado para o modelo de anamnese
    const [anamneseData, setAnamneseData] = useState({
        patientId: patientId,
        doctorId: doctorId,
        anamneseDate: new Date(),

        // Informações principais
        chiefComplaint: "",
        illnessHistory: "",

        // Históricos
        medicalHistory: [],
        surgicalHistory: [],
        familyHistory: "",

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
    });

    // Estado para inputs de lista
    const [inputValues, setInputValues] = useState({
        medicalHistory: "",
        surgicalHistory: "",
        currentMedications: "",
        allergies: "",
    });

    // Estado para feedback (Snackbar)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Estado para controle de loading ao submeter
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Resetar formulário quando o modal for aberto
    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open]);

    // Carrega dados do paciente se disponíveis
    useEffect(() => {
        if (patientData && open) {
            // Pre-populate certain fields if available in patient data
            if (patientData.doencas && patientData.doencas.length > 0) {
                setAnamneseData(prev => ({
                    ...prev,
                    medicalHistory: [...patientData.doencas]
                }));
            }

            if (patientData.alergias && patientData.alergias.length > 0) {
                setAnamneseData(prev => ({
                    ...prev,
                    allergies: [...patientData.alergias]
                }));
            }

            if (patientData.cirurgias && patientData.cirurgias.length > 0) {
                setAnamneseData(prev => ({
                    ...prev,
                    surgicalHistory: [...patientData.cirurgias]
                }));
            }

            if (patientData.medicamentos && patientData.medicamentos.length > 0) {
                setAnamneseData(prev => ({
                    ...prev,
                    currentMedications: [...patientData.medicamentos]
                }));
            }

            // Set social history data if available
            if (patientData.ehFumante === "Sim") {
                setAnamneseData(prev => ({
                    ...prev,
                    socialHistory: {
                        ...prev.socialHistory,
                        isSmoker: true
                    }
                }));
            }

            if (patientData.consumeAlcool === "Sim") {
                setAnamneseData(prev => ({
                    ...prev,
                    socialHistory: {
                        ...prev.socialHistory,
                        isAlcoholConsumer: true
                    }
                }));
            }

            if (patientData.atividades && patientData.atividades.length > 0) {
                setAnamneseData(prev => ({
                    ...prev,
                    socialHistory: {
                        ...prev.socialHistory,
                        physicalActivity: patientData.atividades.join(", ")
                    }
                }));
            }

            // Add family history if available
            if (patientData.doencasHereditarias) {
                setAnamneseData(prev => ({
                    ...prev,
                    familyHistory: patientData.doencasHereditarias
                }));
            }
        }
    }, [patientData, open]);

    // Resetar formulário
    const resetForm = () => {
        setAnamneseData({
            patientId: patientId,
            doctorId: doctorId,
            anamneseDate: new Date(),
            chiefComplaint: "",
            illnessHistory: "",
            medicalHistory: [],
            surgicalHistory: [],
            familyHistory: "",
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
            currentMedications: [],
            allergies: [],
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
            diagnosis: "",
            treatmentPlan: "",
            additionalNotes: "",
            createdAt: new Date()
        });
        setInputValues({
            medicalHistory: "",
            surgicalHistory: "",
            currentMedications: "",
            allergies: "",
        });
    };

    // Função para alternar expandir/contrair seções
    const handleToggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Funções para atualizar o estado de anamnese
    const handleChange = (e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSystemsReviewChange = (e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            systemsReview: {
                ...prev.systemsReview,
                [name]: value,
            },
        }));
    };

    const handlePhysicalExamChange = (e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            physicalExam: {
                ...prev.physicalExam,
                [name]: value,
            },
        }));
    };

    const handleVitalSignChange = (e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            physicalExam: {
                ...prev.physicalExam,
                vitalSigns: {
                    ...prev.physicalExam.vitalSigns,
                    [name]: value,
                },
            },
        }));
    };

    const handleSocialHistoryChange = (e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            socialHistory: {
                ...prev.socialHistory,
                [name]: value,
            },
        }));
    };

    const handleToggleSocialHistory = (field, value) => {
        setAnamneseData((prev) => ({
            ...prev,
            socialHistory: {
                ...prev.socialHistory,
                [field]: value,
            },
        }));
    };

    // Funções para gerenciar listas (histórico médico, cirurgias, medicamentos, alergias)
    const handleInputChange = (e, type) => {
        setInputValues({
            ...inputValues,
            [type]: e.target.value,
        });
    };

    const addItem = (type) => {
        if (inputValues[type].trim() !== "") {
            setAnamneseData(prev => ({
                ...prev,
                [type]: [...prev[type], inputValues[type].trim()]
            }));
            setInputValues({
                ...inputValues,
                [type]: "",
            });
        }
    };

    const removeItem = (type, index) => {
        setAnamneseData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleKeyPress = (e, type) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem(type);
        }
    };

    // Função para validar o formulário antes de enviar
    const validateForm = () => {
        // Validação mínima - exige pelo menos a queixa principal
        if (!anamneseData.chiefComplaint.trim()) {
            setSnackbar({
                open: true,
                message: "Por favor, informe a queixa principal do paciente.",
                severity: "error",
            });
            return false;
        }
        return true;
    };

    // Função para salvar a anamnese
    const handleSaveAnamnese = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Salvar no Firebase
            const anamneseId = await firebaseService.createAnamnese(
                doctorId,
                patientId,
                anamneseData
            );

            setSnackbar({
                open: true,
                message: "Anamnese registrada com sucesso!",
                severity: "success",
            });

            // Fechar o diálogo após um pequeno delay
            setTimeout(() => {
                onClose(anamneseId);
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error);
            setSnackbar({
                open: true,
                message: "Erro ao registrar anamnese. Tente novamente.",
                severity: "error",
            });
            setIsSubmitting(false);
        }
    };

    // Função para fechar o snackbar
    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Componente para renderizar seções de itens (histórico médico, cirurgias, etc.)
    const renderItemSection = (title, type, placeholder) => (
        <Box sx={{ mb: 3 }}>
            <SectionSubtitle>{title}</SectionSubtitle>
            <StyledTextField
                fullWidth
                placeholder={placeholder}
                value={inputValues[type]}
                onChange={(e) => handleInputChange(e, type)}
                onKeyPress={(e) => handleKeyPress(e, type)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <AddButton onClick={() => addItem(type)} size="small">
                                <AddIcon fontSize="small" />
                            </AddButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", mt: 1 }}>
                {anamneseData[type].map((item, index) => (
                    <StyledChip
                        key={index}
                        label={item}
                        onDelete={() => removeItem(type, index)}
                        deleteIcon={<CloseIcon style={{ fontSize: '16px' }} />}
                    />
                ))}
            </Box>
        </Box>
    );

    // Componente para renderizar botões de toggle (sim/não)
    const renderToggleSection = (title, field, description) => (
        <Box sx={{ mb: 3 }}>
            <SectionSubtitle>{title}</SectionSubtitle>
            {description && (
                <Typography
                    sx={{
                        fontSize: "14px",
                        color: "rgba(17, 30, 90, 0.6)",
                        mb: 1
                    }}
                >
                    {description}
                </Typography>
            )}
            <Box sx={{ display: "flex", mt: 1 }}>
                <ToggleButton
                    selected={anamneseData.socialHistory[field] === true}
                    onClick={() => handleToggleSocialHistory(field, true)}
                    variant="contained"
                    disableElevation
                >
                    Sim
                </ToggleButton>
                <ToggleButton
                    selected={anamneseData.socialHistory[field] === false}
                    onClick={() => handleToggleSocialHistory(field, false)}
                    variant="contained"
                    disableElevation
                >
                    Não
                </ToggleButton>
            </Box>

            {field === 'isSmoker' && anamneseData.socialHistory[field] === true && (
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: "14px", color: "rgba(17, 30, 90, 0.8)", mb: 0.5 }}>
                        Quantidade de cigarros por dia:
                    </Typography>
                    <Box sx={{ px: 2 }}>
                        <Slider
                            value={anamneseData.socialHistory.cigarettesPerDay}
                            onChange={(e, newValue) =>
                                handleToggleSocialHistory('cigarettesPerDay', newValue)
                            }
                            valueLabelDisplay="auto"
                            step={1}
                            marks
                            min={0}
                            max={40}
                            sx={{
                                color: '#3366FF',
                                '& .MuiSlider-thumb': {
                                    backgroundColor: '#3366FF',
                                },
                                '& .MuiSlider-rail': {
                                    backgroundColor: 'rgba(17, 30, 90, 0.2)',
                                },
                            }}
                        />
                    </Box>
                </Box>
            )}

            {field === 'isAlcoholConsumer' && anamneseData.socialHistory[field] === true && (
                <Box sx={{ mt: 2 }}>
                    <StyledTextField
                        fullWidth
                        size="small"
                        label="Frequência de consumo"
                        placeholder="Ex: Socialmente, 2 vezes por semana"
                        name="alcoholFrequency"
                        value={anamneseData.socialHistory.alcoholFrequency}
                        onChange={handleSocialHistoryChange}
                    />
                </Box>
            )}

            {field === 'isDrugUser' && anamneseData.socialHistory[field] === true && (
                <Box sx={{ mt: 2 }}>
                    <StyledTextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Detalhes"
                        placeholder="Especifique quais substâncias e frequência"
                        name="drugDetails"
                        value={anamneseData.socialHistory.drugDetails}
                        onChange={handleSocialHistoryChange}
                    />
                </Box>
            )}
        </Box>
    );

    return (
        <FullScreenDialog
            fullScreen={fullScreen}
            open={open}
            onClose={() => onClose()}
            TransitionComponent={Transition}
            maxWidth="lg"
            PaperProps={{
                sx: {
                    maxWidth: "1200px",
                    width: "calc(100% - 48px)",
                    margin: "24px",
                    overflowY: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: fullScreen ? "100%" : "calc(100% - 48px)",
                }
            }}
        >
            {/* Header */}
            <DialogHeader>
                <Box>
                    <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                            fontFamily: "Gellix, sans-serif",
                            fontWeight: 600,
                            color: "#111E5A",
                        }}
                    >
                        Nova Anamnese
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontFamily: "Gellix, sans-serif",
                            color: "rgba(17, 30, 90, 0.7)",
                        }}
                    >
                        {patientData?.nome
                            ? `Paciente: ${patientData.nome}`
                            : "Preencha os dados da anamnese"}
                    </Typography>
                </Box>
                <CloseButton onClick={() => onClose()}>
                    <CloseIcon />
                </CloseButton>
            </DialogHeader>

            {/* Body */}
            <DialogBody>
                <Box sx={{ p: 3 }}>
                    {/* Seção 1: Informações Principais */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Informações Principais</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("mainInfo")}>
                                {expandedSections.mainInfo ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.mainInfo && (
                            <SectionContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Queixa Principal"
                                            placeholder="Descreva o motivo principal da consulta"
                                            multiline
                                            rows={3}
                                            name="chiefComplaint"
                                            value={anamneseData.chiefComplaint}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="História da Doença Atual"
                                            placeholder="Descreva detalhes sobre o início, duração e evolução dos sintomas"
                                            multiline
                                            rows={4}
                                            name="illnessHistory"
                                            value={anamneseData.illnessHistory}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                </Grid>
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 2: Históricos Médicos */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Históricos</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("histories")}>
                                {expandedSections.histories ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.histories && (
                            <SectionContent>
                                {renderItemSection(
                                    "Histórico Médico",
                                    "medicalHistory",
                                    "Digite uma condição médica relevante"
                                )}
                                {renderItemSection(
                                    "Histórico Cirúrgico",
                                    "surgicalHistory",
                                    "Digite uma cirurgia prévia relevante"
                                )}
                                <Box sx={{ mb: 3 }}>
                                    <SectionSubtitle>Histórico Familiar</SectionSubtitle>
                                    <StyledTextField
                                        fullWidth
                                        placeholder="Descreva doenças hereditárias ou condições relevantes na família"
                                        multiline
                                        rows={3}
                                        name="familyHistory"
                                        value={anamneseData.familyHistory}
                                        onChange={handleChange}
                                    />
                                </Box>
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 3: Hábitos de Vida */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Hábitos de Vida</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("lifestyle")}>
                                {expandedSections.lifestyle ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.lifestyle && (
                            <SectionContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        {renderToggleSection(
                                            "Tabagismo",
                                            "isSmoker",
                                            "O paciente é fumante?"
                                        )}

                                        {renderToggleSection(
                                            "Uso de Álcool",
                                            "isAlcoholConsumer",
                                            "O paciente consome bebidas alcoólicas?"
                                        )}

                                        {renderToggleSection(
                                            "Uso de Outras Substâncias",
                                            "isDrugUser",
                                            "O paciente faz uso de outras substâncias?"
                                        )}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 3 }}>
                                            <SectionSubtitle>Atividade Física</SectionSubtitle>
                                            <StyledTextField
                                                fullWidth
                                                placeholder="Descreva frequência e tipo de atividade física"
                                                multiline
                                                rows={2}
                                                name="physicalActivity"
                                                value={anamneseData.socialHistory.physicalActivity}
                                                onChange={handleSocialHistoryChange}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 3 }}>
                                            <SectionSubtitle>Hábitos Alimentares</SectionSubtitle>
                                            <StyledTextField
                                                fullWidth
                                                placeholder="Descreva padrão alimentar e restrições do paciente"
                                                multiline
                                                rows={2}
                                                name="dietHabits"
                                                value={anamneseData.socialHistory.dietHabits}
                                                onChange={handleSocialHistoryChange}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 3 }}>
                                            <SectionSubtitle>Ocupação</SectionSubtitle>
                                            <StyledTextField
                                                fullWidth
                                                placeholder="Profissão/ocupação atual do paciente"
                                                name="occupation"
                                                value={anamneseData.socialHistory.occupation}
                                                onChange={handleSocialHistoryChange}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 4: Medicamentos e Alergias */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Medicamentos e Alergias</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("medicationsAllergies")}>
                                {expandedSections.medicationsAllergies ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.medicationsAllergies && (
                            <SectionContent>
                                {renderItemSection(
                                    "Medicamentos em Uso",
                                    "currentMedications",
                                    "Digite um medicamento em uso"
                                )}
                                {renderItemSection(
                                    "Alergias",
                                    "allergies",
                                    "Digite uma alergia conhecida"
                                )}
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 5: Revisão de Sistemas */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Revisão de Sistemas</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("systemsReview")}>
                                {expandedSections.systemsReview ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.systemsReview && (
                            <SectionContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Cardiovascular"
                                            placeholder="Palpitações, dor torácica, etc."
                                            multiline
                                            rows={2}
                                            name="cardiovascular"
                                            value={anamneseData.systemsReview.cardiovascular}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Respiratório"
                                            placeholder="Tosse, dispneia, etc."
                                            multiline
                                            rows={2}
                                            name="respiratory"
                                            value={anamneseData.systemsReview.respiratory}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Gastrointestinal"
                                            placeholder="Náuseas, dor abdominal, etc."
                                            multiline
                                            rows={2}
                                            name="gastrointestinal"
                                            value={anamneseData.systemsReview.gastrointestinal}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Geniturinário"
                                            placeholder="Disúria, nictúria, etc."
                                            multiline
                                            rows={2}
                                            name="genitourinary"
                                            value={anamneseData.systemsReview.genitourinary}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Neurológico"
                                            placeholder="Cefaleia, tontura, etc."
                                            multiline
                                            rows={2}
                                            name="neurological"
                                            value={anamneseData.systemsReview.neurological}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Musculoesquelético"
                                            placeholder="Dor articular, fraqueza, etc."
                                            multiline
                                            rows={2}
                                            name="musculoskeletal"
                                            value={anamneseData.systemsReview.musculoskeletal}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Endócrino"
                                            placeholder="Polidipsia, poliúria, etc."
                                            multiline
                                            rows={2}
                                            name="endocrine"
                                            value={anamneseData.systemsReview.endocrine}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Sistema Hematológico"
                                            placeholder="Equimoses, sangramentos, etc."
                                            multiline
                                            rows={2}
                                            name="hematologic"
                                            value={anamneseData.systemsReview.hematologic}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Psiquiátrico"
                                            placeholder="Humor, sono, etc."
                                            multiline
                                            rows={2}
                                            name="psychiatric"
                                            value={anamneseData.systemsReview.psychiatric}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Dermatológico"
                                            placeholder="Lesões, prurido, etc."
                                            multiline
                                            rows={2}
                                            name="dermatological"
                                            value={anamneseData.systemsReview.dermatological}
                                            onChange={handleSystemsReviewChange}
                                        />
                                    </Grid>
                                </Grid>
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 6: Exame Físico */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Exame Físico</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("physicalExam")}>
                                {expandedSections.physicalExam ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.physicalExam && (
                            <SectionContent>
                                <Box sx={{ mb: 3 }}>
                                    <SectionSubtitle>Aparência Geral</SectionSubtitle>
                                    <StyledTextField
                                        fullWidth
                                        placeholder="Estado geral, nível de consciência, aparência, etc."
                                        multiline
                                        rows={2}
                                        name="generalAppearance"
                                        value={anamneseData.physicalExam.generalAppearance}
                                        onChange={handlePhysicalExamChange}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <SectionSubtitle>Sinais Vitais</SectionSubtitle>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <VitalSignCard>
                                                <MonitorHeartIcon sx={{ color: "#3366FF", fontSize: 32, mb: 1 }} />
                                                <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>Pressão Arterial</Typography>
                                                <StyledTextField
                                                    size="small"
                                                    placeholder="120/80"
                                                    name="bloodPressure"
                                                    value={anamneseData.physicalExam.vitalSigns.bloodPressure}
                                                    onChange={handleVitalSignChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                                                    }}
                                                />
                                            </VitalSignCard>
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <VitalSignCard>
                                                <FavoriteIcon sx={{ color: "#F50057", fontSize: 32, mb: 1 }} />
                                                <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>Frequência Cardíaca</Typography>
                                                <StyledTextField
                                                    size="small"
                                                    placeholder="75"
                                                    name="heartRate"
                                                    value={anamneseData.physicalExam.vitalSigns.heartRate}
                                                    onChange={handleVitalSignChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                                                    }}
                                                />
                                            </VitalSignCard>
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <VitalSignCard>
                                                <ThermostatIcon sx={{ color: "#FF6D00", fontSize: 32, mb: 1 }} />
                                                <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>Temperatura</Typography>
                                                <StyledTextField
                                                    size="small"
                                                    placeholder="36.5"
                                                    name="temperature"
                                                    value={anamneseData.physicalExam.vitalSigns.temperature}
                                                    onChange={handleVitalSignChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                                                    }}
                                                />
                                            </VitalSignCard>
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <VitalSignCard>
                                                <SpeedIcon sx={{ color: "#00BFA5", fontSize: 32, mb: 1 }} />
                                                <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>Freq. Respiratória</Typography>
                                                <StyledTextField
                                                    size="small"
                                                    placeholder="16"
                                                    name="respiratoryRate"
                                                    value={anamneseData.physicalExam.vitalSigns.respiratoryRate}
                                                    onChange={handleVitalSignChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">irpm</InputAdornment>,
                                                    }}
                                                />
                                            </VitalSignCard>
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <VitalSignCard>
                                                <BubbleChartIcon sx={{ color: "#651FFF", fontSize: 32, mb: 1 }} />
                                                <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>Saturação O₂</Typography>
                                                <StyledTextField
                                                    size="small"
                                                    placeholder="98"
                                                    name="oxygenSaturation"
                                                    value={anamneseData.physicalExam.vitalSigns.oxygenSaturation}
                                                    onChange={handleVitalSignChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                    }}
                                                />
                                            </VitalSignCard>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Cabeça e Pescoço"
                                            multiline
                                            rows={2}
                                            name="headAndNeck"
                                            value={anamneseData.physicalExam.headAndNeck}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Cardiovascular"
                                            multiline
                                            rows={2}
                                            name="cardiovascular"
                                            value={anamneseData.physicalExam.cardiovascular}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Respiratório"
                                            multiline
                                            rows={2}
                                            name="respiratory"
                                            value={anamneseData.physicalExam.respiratory}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Abdômen"
                                            multiline
                                            rows={2}
                                            name="abdomen"
                                            value={anamneseData.physicalExam.abdomen}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Extremidades"
                                            multiline
                                            rows={2}
                                            name="extremities"
                                            value={anamneseData.physicalExam.extremities}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField
                                            fullWidth
                                            label="Neurológico"
                                            multiline
                                            rows={2}
                                            name="neurological"
                                            value={anamneseData.physicalExam.neurological}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Outras Observações"
                                            multiline
                                            rows={2}
                                            name="other"
                                            value={anamneseData.physicalExam.other}
                                            onChange={handlePhysicalExamChange}
                                        />
                                    </Grid>
                                </Grid>
                            </SectionContent>
                        )}
                    </SectionContainer>

                    {/* Seção 7: Conclusões */}
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Conclusões</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("conclusions")}>
                                {expandedSections.conclusions ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.conclusions && (
                            <SectionContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Diagnóstico"
                                            placeholder="Diagnóstico clínico, hipóteses diagnósticas"
                                            multiline
                                            rows={3}
                                            name="diagnosis"
                                            value={anamneseData.diagnosis}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Plano de Tratamento"
                                            placeholder="Plano terapêutico, exames solicitados, medicações prescritas"
                                            multiline
                                            rows={4}
                                            name="treatmentPlan"
                                            value={anamneseData.treatmentPlan}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            label="Observações Adicionais"
                                            placeholder="Informações complementares relevantes"
                                            multiline
                                            rows={3}
                                            name="additionalNotes"
                                            value={anamneseData.additionalNotes}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                </Grid>
                            </SectionContent>
                        )}
                    </SectionContainer>
                </Box>
            </DialogBody>

            {/* Footer */}
            <ActionButtonsContainer>
                <ActionButton
                    variant="outlined"
                    disabled={isSubmitting}
                    onClick={() => onClose()}
                >
                    Cancelar
                </ActionButton>
                <ActionButton
                    variant="contained"
                    onClick={handleSaveAnamnese}
                    disabled={isSubmitting}
                    startIcon={<LocalHospitalIcon />}
                >
                    {isSubmitting ? "Salvando..." : "Salvar Anamnese"}
                </ActionButton>
            </ActionButtonsContainer>

            {/* Snackbar de feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </FullScreenDialog>
    );
}