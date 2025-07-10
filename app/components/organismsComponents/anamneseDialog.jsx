"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    CircularProgress, Tooltip, Badge
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import TextDecreaseIcon from "@mui/icons-material/TextDecrease";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import MicIcon from "@mui/icons-material/Mic";
import LockIcon from "@mui/icons-material/Lock";
// Firebase service
import firebaseService from "../../../lib/firebaseService";
import { parse } from 'date-fns';
import DescriptionIcon from "@mui/icons-material/Description";
import AnamneseNotesPanel from "./anamneseNotesPanel";
import FloatingVoiceRecorder from "./FloatingVoiceRecorder";
import AccessDeniedDialog from "./accessDeniedDialog";
import {useAuth} from "../authProvider";


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

const FontSizeControl = styled(Box)(({ theme }) => ({
    position: "fixed",
    bottom: theme.spacing(4),
    right: theme.spacing(4),
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: "28px",
    padding: theme.spacing(0.5, 1.5, 0.5, 2),
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    border: "1px solid #EAECEF",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
        boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.12)",
    }
}));

const FontSizeButton = styled(IconButton)(({ theme }) => ({
    color: "#111E5A",
    "&:hover": {
        backgroundColor: "rgba(17, 30, 90, 0.08)",
    },
    "&.Mui-disabled": {
        color: "rgba(17, 30, 90, 0.38)",
    }
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

// Memoized components
const MemoizedSectionHeader = React.memo(({ title, expanded, onToggle }) => (
    <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <IconButton onClick={onToggle}>
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
    </SectionHeader>
));

const MemoizedVitalSignCard = React.memo(({ icon, title, name, value, onChange, unit, placeholder }) => (
    <VitalSignCard>
        {icon}
        <Typography sx={{ color: "#666", mb: 1, fontSize: 14 }}>{title}</Typography>
        <StyledTextField
            size="small"
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            InputProps={{
                endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null,
            }}
        />
    </VitalSignCard>
));

// ------------------ COMPONENTE PRINCIPAL DE DIÁLOGO ------------------
export default function AnamneseDialog({ open, onClose, patientId, doctorId, anamneseId, onSave }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState(null);
    const [fontSizeScale, setFontSizeScale] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [patientNotes, setPatientNotes] = useState([]);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    
    // ✅ VERIFICAÇÃO DE USUÁRIO FREE
    const { isFreeUser } = useAuth();

    const MIN_SCALE = 1;
    const MAX_SCALE = 2;
    const SCALE_STEP = 0.1;

    // Função para aumentar a fonte
    const increaseFontSize = useCallback(() => {
        if (fontSizeScale < MAX_SCALE) {
            setFontSizeScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
        }
    }, [fontSizeScale]);

    // Função para diminuir a fonte
    const decreaseFontSize = useCallback(() => {
        if (fontSizeScale > MIN_SCALE) {
            setFontSizeScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
        }
    }, [fontSizeScale]);

    // Função para resetar a fonte
    const resetFontSize = useCallback(() => {
        setFontSizeScale(1);
    }, []);

    // ✅ FUNÇÃO PARA VERIFICAR ACESSO À FUNCIONALIDADE DE ÁUDIO
    const checkAudioAccess = useCallback(() => {
        console.log("🔐 Verificando acesso ao processamento de áudio. É usuário gratuito?", isFreeUser);
        return !isFreeUser;
    }, [isFreeUser]);

    // ✅ HANDLER PARA ABRIR DIALOG DE ÁUDIO COM VERIFICAÇÃO
    const handleAudioRecording = useCallback(() => {
        if (isFreeUser) {
            console.log("❌ Acesso negado - usuário gratuito tentando usar processamento de áudio");
            setUpgradeDialogOpen(true);
            return;
        }
        setShowVoiceRecorder(true);
    }, [isFreeUser]);

    // Função para processar resultado do áudio e preencher a anamnese
    const handleAudioResult = useCallback((audioResult) => {
        if (!audioResult.analysis) {
            setSnackbar({
                open: true,
                message: "Não foi possível analisar o áudio. Tente novamente.",
                severity: "error"
            });
            return;
        }

        const analysis = audioResult.analysis;
        
        // Atualizar anamnese com os dados extraídos do áudio
        setAnamneseData(prev => {
            const updated = { ...prev };
            
            // Informações principais
            if (analysis.queixaPrincipal) {
                updated.chiefComplaint = analysis.queixaPrincipal;
            }
            if (analysis.historiaDoencaAtual) {
                updated.illnessHistory = analysis.historiaDoencaAtual;
            }
            
            // Históricos
            if (analysis.historiaPatologicaPregressa && Array.isArray(analysis.historiaPatologicaPregressa)) {
                const medicalHistory = [];
                const surgicalHistory = [];
                
                analysis.historiaPatologicaPregressa.forEach(item => {
                    if (item.toLowerCase().includes('cirurgia') || item.toLowerCase().includes('operação')) {
                        surgicalHistory.push(item);
                    } else {
                        medicalHistory.push(item);
                    }
                });
                
                if (medicalHistory.length > 0) {
                    updated.medicalHistory = [...prev.medicalHistory, ...medicalHistory];
                }
                if (surgicalHistory.length > 0) {
                    updated.surgicalHistory = [...prev.surgicalHistory, ...surgicalHistory];
                }
            }
            
            if (analysis.historicoFamiliar) {
                updated.familyHistory = analysis.historicoFamiliar;
            }
            
            // Hábitos de vida
            if (analysis.habitosDeVida) {
                const habits = analysis.habitosDeVida;
                
                if (habits.tabagismo) {
                    updated.socialHistory.isSmoker = habits.tabagismo.toLowerCase().includes('sim') || 
                                                    habits.tabagismo.toLowerCase().includes('fuma');
                    // Extrair quantidade de cigarros se mencionado
                    const cigarrosMatch = habits.tabagismo.match(/(\d+)\s*(cigarros?|maços?)/i);
                    if (cigarrosMatch) {
                        updated.socialHistory.cigarettesPerDay = parseInt(cigarrosMatch[1]);
                    }
                }
                
                if (habits.alcoolismo) {
                    updated.socialHistory.isAlcoholConsumer = habits.alcoolismo.toLowerCase().includes('sim') || 
                                                             habits.alcoolismo.toLowerCase().includes('bebe');
                    updated.socialHistory.alcoholFrequency = habits.alcoolismo;
                }
                
                if (habits.drogas) {
                    updated.socialHistory.isDrugUser = habits.drogas.toLowerCase().includes('sim') || 
                                                      habits.drogas.toLowerCase().includes('usa');
                    updated.socialHistory.drugDetails = habits.drogas;
                }
                
                if (habits.atividadeFisica) {
                    updated.socialHistory.physicalActivity = habits.atividadeFisica;
                }
                
                if (habits.alimentacao) {
                    updated.socialHistory.dietHabits = habits.alimentacao;
                }
                
                if (habits.ocupacao) {
                    updated.socialHistory.occupation = habits.ocupacao;
                }
            }
            
            // Medicamentos e alergias
            if (analysis.medicamentosEmUso && Array.isArray(analysis.medicamentosEmUso)) {
                updated.currentMedications = [...prev.currentMedications, ...analysis.medicamentosEmUso];
            }
            
            if (analysis.alergias && Array.isArray(analysis.alergias)) {
                updated.allergies = [...prev.allergies, ...analysis.alergias];
            }
            
            // Revisão de sistemas
            if (analysis.revisaoDeSistemas) {
                Object.keys(analysis.revisaoDeSistemas).forEach(sistema => {
                    if (updated.systemsReview[sistema] !== undefined && analysis.revisaoDeSistemas[sistema]) {
                        updated.systemsReview[sistema] = analysis.revisaoDeSistemas[sistema];
                    }
                });
            }
            
            // Exame físico
            if (analysis.exameFisico) {
                if (analysis.exameFisico.aspectoGeral) {
                    updated.physicalExam.generalAppearance = analysis.exameFisico.aspectoGeral;
                }
                
                // Sinais vitais
                if (analysis.exameFisico.sinaisVitais) {
                    const vitals = analysis.exameFisico.sinaisVitais;
                    if (vitals.pressaoArterial) updated.physicalExam.vitalSigns.bloodPressure = vitals.pressaoArterial;
                    if (vitals.frequenciaCardiaca) updated.physicalExam.vitalSigns.heartRate = vitals.frequenciaCardiaca;
                    if (vitals.temperatura) updated.physicalExam.vitalSigns.temperature = vitals.temperatura;
                    if (vitals.frequenciaRespiratoria) updated.physicalExam.vitalSigns.respiratoryRate = vitals.frequenciaRespiratoria;
                    if (vitals.saturacaoO2) updated.physicalExam.vitalSigns.oxygenSaturation = vitals.saturacaoO2;
                }
                
                // Outros exames físicos
                if (analysis.exameFisico.cabecaPescoco) updated.physicalExam.headAndNeck = analysis.exameFisico.cabecaPescoco;
                if (analysis.exameFisico.cardiovascular) updated.physicalExam.cardiovascular = analysis.exameFisico.cardiovascular;
                if (analysis.exameFisico.respiratorio) updated.physicalExam.respiratory = analysis.exameFisico.respiratorio;
                if (analysis.exameFisico.abdome) updated.physicalExam.abdomen = analysis.exameFisico.abdome;
                if (analysis.exameFisico.extremidades) updated.physicalExam.extremities = analysis.exameFisico.extremidades;
                if (analysis.exameFisico.neurologico) updated.physicalExam.neurological = analysis.exameFisico.neurologico;
            }
            
            // Conclusões
            if (analysis.hipoteseDiagnostica) {
                updated.diagnosis = analysis.hipoteseDiagnostica;
            }
            
            if (analysis.planoTerapeutico) {
                updated.treatmentPlan = analysis.planoTerapeutico;
            }
            
            if (analysis.observacoesAdicionais) {
                updated.additionalNotes = analysis.observacoesAdicionais;
            }
            
            return updated;
        });
        
        // Fechar o gravador de voz
        setShowVoiceRecorder(false);
        
        // Mostrar mensagem de sucesso
        setSnackbar({
            open: true,
            message: "Anamnese preenchida com sucesso a partir do áudio!",
            severity: "success"
        });
        
        // Expandir todas as seções para o usuário revisar
        setExpandedSections({
            mainInfo: true,
            histories: true,
            lifestyle: true,
            medicationsAllergies: true,
            systemsReview: true,
            physicalExam: true,
            conclusions: true
        });
    }, []);

    // Estilo dinâmico com base no tamanho da fonte (memoizado)
    const fontSizeStyle = useMemo(() => ({
        fontSize: `${fontSizeScale}rem`,
        "& .MuiTypography-root": {
            fontSize: `${fontSizeScale}rem`,
        },
        "& .MuiInputBase-input": {
            fontSize: `${fontSizeScale}rem`,
        },
        "& .MuiInputLabel-root": {
            fontSize: `${fontSizeScale}rem`,
        },
        "& .MuiButton-root": {
            fontSize: `${fontSizeScale}rem`,
        },
        "& .MuiChip-label": {
            fontSize: `${0.8 * fontSizeScale}rem`,
        },
    }), [fontSizeScale]);

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

    // Função para buscar dados do paciente e notas
    useEffect(() => {
        if (open && patientId && doctorId) {
            let isMounted = true;

            const fetchAllData = async () => {
                setLoading(true);
                setError(null);

                try {
                    // Carregar dados em paralelo
                    const [patientDoc, notes] = await Promise.all([
                        firebaseService.getPatient(doctorId, patientId),
                        firebaseService.listNotes(doctorId, patientId)
                    ]);

                    if (!isMounted) return;

                    if (patientDoc) {
                        setPatientData(patientDoc);
                        populateFormWithPatientData(patientDoc);
                    } else {
                        setError("Paciente não encontrado.");
                    }

                    setPatientNotes(notes);

                } catch (err) {
                    console.error("Erro ao buscar dados:", err);
                    if (isMounted) setError("Erro ao carregar dados do paciente.");
                } finally {
                    if (isMounted) setLoading(false);
                }
            };

            fetchAllData();

            return () => { isMounted = false; };
        }
    }, [open, patientId, doctorId]);

    // Efeito para buscar dados da anamnese se for modo de edição
    useEffect(() => {
        if (open && anamneseId && patientId && doctorId) {
            let isMounted = true;

            const fetchAnamneseData = async () => {
                try {
                    const data = await firebaseService.getAnamnese(doctorId, patientId, anamneseId);

                    if (!isMounted) return;

                    if (data) {
                        // Populate the form with the existing anamnese data
                        setAnamneseData({
                            ...data,
                            // Ensure proper date format
                            anamneseDate: data.anamneseDate?.toDate ? data.anamneseDate.toDate() : new Date(data.anamneseDate || new Date()),
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || new Date())
                        });
                    } else {
                        setError("Anamnese não encontrada.");
                    }
                } catch (err) {
                    console.error("Erro ao buscar dados da anamnese:", err);
                    if (isMounted) setError("Erro ao carregar dados da anamnese.");
                }
            };

            fetchAnamneseData();

            return () => { isMounted = false; };
        }
    }, [open, anamneseId, patientId, doctorId]);

    useEffect(() => {
        if (!open) {
            setIsSubmitting(false);
        } else if(open) {
            resetForm();
        }
    }, [open]);

    // Resetar formulário
    const resetForm = useCallback(() => {
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
    }, [patientId, doctorId]);

    // Função para popular o formulário com os dados do paciente
    const populateFormWithPatientData = useCallback((patient) => {
        // Pre-populate certain fields if available in patient data
        let medicalHistory = [];
        if (patient.doencas && patient.doencas.length > 0) {
            medicalHistory = [...patient.doencas];
        } else if (patient.chronicDiseases && patient.chronicDiseases.length > 0) {
            medicalHistory = [...patient.chronicDiseases];
        } else if (patient.condicoesClinicas?.doencas && patient.condicoesClinicas.doencas.length > 0) {
            medicalHistory = [...patient.condicoesClinicas.doencas];
        }

        let allergies = [];
        if (patient.alergias && patient.alergias.length > 0) {
            allergies = [...patient.alergias];
        } else if (patient.allergies && patient.allergies.length > 0) {
            allergies = [...patient.allergies];
        } else if (patient.condicoesClinicas?.alergias && patient.condicoesClinicas.alergias.length > 0) {
            allergies = [...patient.condicoesClinicas.alergias];
        }

        let surgicalHistory = [];
        if (patient.cirurgias && patient.cirurgias.length > 0) {
            surgicalHistory = [...patient.cirurgias];
        } else if (patient.condicoesClinicas?.cirurgias && patient.condicoesClinicas.cirurgias.length > 0) {
            surgicalHistory = [...patient.condicoesClinicas.cirurgias];
        }

        let medications = [];
        if (patient.medicamentos && patient.medicamentos.length > 0) {
            medications = [...patient.medicamentos];
        } else if (patient.medications && patient.medications.length > 0) {
            medications = [...patient.medications];
        } else if (patient.condicoesClinicas?.medicamentos && patient.condicoesClinicas.medicamentos.length > 0) {
            medications = [...patient.condicoesClinicas.medicamentos];
        }

        // Set social history data if available
        let socialHistory = { ...anamneseData.socialHistory };

        if (patient.ehFumante === "Sim" || patient.isSmoker) {
            socialHistory.isSmoker = true;
        }

        if (patient.consumeAlcool === "Sim" || patient.consumesAlcohol) {
            socialHistory.isAlcoholConsumer = true;
        }

        let physicalActivity = "";
        if (patient.atividades && patient.atividades.length > 0) {
            physicalActivity = patient.atividades.join(", ");
        } else if (patient.physicalActivities && patient.physicalActivities.length > 0) {
            physicalActivity = patient.physicalActivities.join(", ");
        } else if (patient.condicoesClinicas?.atividades && patient.condicoesClinicas.atividades.length > 0) {
            physicalActivity = patient.condicoesClinicas.atividades.join(", ");
        }

        socialHistory.physicalActivity = physicalActivity;

        // Add family history if available
        let familyHistory = "";
        if (patient.doencasHereditarias) {
            familyHistory = patient.doencasHereditarias;
        } else if (patient.hereditaryDiseases) {
            familyHistory = patient.hereditaryDiseases;
        } else if (patient.historicoConduta?.doencasHereditarias) {
            familyHistory = patient.historicoConduta.doencasHereditarias;
        }

        // Update anamnese data with patient information
        setAnamneseData(prev => ({
            ...prev,
            medicalHistory,
            allergies,
            surgicalHistory,
            currentMedications: medications,
            socialHistory,
            familyHistory
        }));
    }, [anamneseData.socialHistory]);

    // Função para alternar expandir/contrair seções
    const handleToggleSection = useCallback((section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    // Funções para atualizar o estado de anamnese
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const handleSystemsReviewChange = useCallback((e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            systemsReview: {
                ...prev.systemsReview,
                [name]: value,
            },
        }));
    }, []);

    const handlePhysicalExamChange = useCallback((e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            physicalExam: {
                ...prev.physicalExam,
                [name]: value,
            },
        }));
    }, []);

    const handleVitalSignChange = useCallback((e) => {
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
    }, []);

    const handleSocialHistoryChange = useCallback((e) => {
        const { name, value } = e.target;
        setAnamneseData((prev) => ({
            ...prev,
            socialHistory: {
                ...prev.socialHistory,
                [name]: value,
            },
        }));
    }, []);

    const handleToggleSocialHistory = useCallback((field, value) => {
        setAnamneseData((prev) => ({
            ...prev,
            socialHistory: {
                ...prev.socialHistory,
                [field]: value,
            },
        }));
    }, []);

    // Funções para gerenciar listas (histórico médico, cirurgias, medicamentos, alergias)
    const handleInputChange = useCallback((e, type) => {
        setInputValues(prev => ({
            ...prev,
            [type]: e.target.value,
        }));
    }, []);

    const addItem = useCallback((type) => {
        if (inputValues[type].trim() !== "") {
            setAnamneseData(prev => ({
                ...prev,
                [type]: [...prev[type], inputValues[type].trim()]
            }));
            setInputValues(prev => ({
                ...prev,
                [type]: "",
            }));
        }
    }, [inputValues]);

    const removeItem = useCallback((type, index) => {
        setAnamneseData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    }, []);

    const handleKeyPress = useCallback((e, type) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem(type);
        }
    }, [addItem]);

    const handleSelectNote = useCallback((note) => {
        setSelectedNote(note);
    }, []);

    // Função para validar o formulário antes de enviar
    const validateForm = useCallback(() => {
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
    }, [anamneseData.chiefComplaint]);

    const getPatientName = useCallback(() => {
        return patientData?.nome || patientData?.patientName || 'Paciente';
    }, [patientData]);


    // Função para gerar PDF da anamnese de forma assíncrona
    const generateAnamnesePDFAsync = useCallback((anamneseData) => {
        return new Promise((resolve) => {
            // Use setTimeout para não bloquear a thread principal
            setTimeout(() => {
                // Create new PDF document
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 20;
                let yPos = 20;

                // Helper function to add text with wrapping
                const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
                    if (!text) return y;
                    const textArray = typeof text === 'string' ? [text] : text;
                    const textString = textArray.join(', ');
                    const lines = doc.splitTextToSize(textString, maxWidth);
                    doc.text(lines, x, y);
                    return y + (lines.length * lineHeight);
                };

                // Title
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('ANAMNESE MÉDICA', pageWidth / 2, yPos, { align: 'center' });
                yPos += 15;

                // Patient information
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Paciente: ${getPatientName()}`, margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                if (patientData?.dataNascimento) {
                    const birthDate = patientData.dataNascimento instanceof Date
                        ? patientData.dataNascimento
                        : parse(patientData.dataNascimento, 'dd/MM/yyyy', new Date());
                    doc.text(`Data de Nascimento: ${format(birthDate, 'dd/MM/yyyy')}`, margin, yPos);
                } else {
                    doc.text(`Data de Nascimento: N/A`, margin, yPos);
                }

                yPos += 7;
                doc.text(`Data da Anamnese: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, margin, yPos);
                yPos += 15;

                // Section: Main Information
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Informações Principais', margin, yPos);
                yPos += 10;
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Queixa Principal:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.chiefComplaint, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('História da Doença Atual:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.illnessHistory, margin, yPos, pageWidth - (2 * margin)) + 10;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Histories
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Históricos', margin, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Histórico Médico:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.medicalHistory, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Histórico Cirúrgico:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.surgicalHistory, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Histórico Familiar:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.familyHistory, margin, yPos, pageWidth - (2 * margin)) + 10;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Social History
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Hábitos de Vida', margin, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Tabagismo:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                let socialText = anamneseData.socialHistory.isSmoker ?
                    `Sim (${anamneseData.socialHistory.cigarettesPerDay} cigarros/dia)` : 'Não';
                yPos = addWrappedText(socialText, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Uso de Álcool:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                socialText = anamneseData.socialHistory.isAlcoholConsumer ?
                    `Sim (${anamneseData.socialHistory.alcoholFrequency})` : 'Não';
                yPos = addWrappedText(socialText, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Outras Substâncias:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                socialText = anamneseData.socialHistory.isDrugUser ?
                    `Sim (${anamneseData.socialHistory.drugDetails})` : 'Não';
                yPos = addWrappedText(socialText, margin, yPos, pageWidth - (2 * margin)) + 5;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.text('Atividade Física:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.socialHistory.physicalActivity, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Hábitos Alimentares:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.socialHistory.dietHabits, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Ocupação:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.socialHistory.occupation, margin, yPos, pageWidth - (2 * margin)) + 10;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Medications and Allergies
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Medicamentos e Alergias', margin, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Medicamentos em Uso:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.currentMedications, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Alergias:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.allergies, margin, yPos, pageWidth - (2 * margin)) + 10;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Systems Review
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Revisão de Sistemas', margin, yPos);
                yPos += 10;

                // Add each system
                const systemsReview = anamneseData.systemsReview;
                const systems = [
                    { title: 'Cardiovascular', value: systemsReview.cardiovascular },
                    { title: 'Respiratório', value: systemsReview.respiratory },
                    { title: 'Gastrointestinal', value: systemsReview.gastrointestinal },
                    { title: 'Geniturinário', value: systemsReview.genitourinary },
                    { title: 'Neurológico', value: systemsReview.neurological },
                    { title: 'Musculoesquelético', value: systemsReview.musculoskeletal },
                    { title: 'Endócrino', value: systemsReview.endocrine },
                    { title: 'Hematológico', value: systemsReview.hematologic },
                    { title: 'Psiquiátrico', value: systemsReview.psychiatric },
                    { title: 'Dermatológico', value: systemsReview.dermatological }
                ];

                for (const system of systems) {
                    if (system.value) {
                        // Add a new page if needed
                        if (yPos > 250) {
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`${system.title}:`, margin, yPos);
                        yPos += 7;
                        doc.setFont('helvetica', 'normal');
                        yPos = addWrappedText(system.value, margin, yPos, pageWidth - (2 * margin)) + 5;
                    }
                }

                // Check if we need a new page
                if (yPos > 230) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Physical Exam
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Exame Físico', margin, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Aparência Geral:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.physicalExam.generalAppearance, margin, yPos, pageWidth - (2 * margin)) + 5;

                // Vital signs
                doc.setFont('helvetica', 'bold');
                doc.text('Sinais Vitais:', margin, yPos);
                yPos += 10;

                // Create table for vital signs
                const vitalSigns = [
                    ['Pressão Arterial', 'Freq. Cardíaca', 'Temperatura', 'Freq. Respiratória', 'Sat. O2'],
                    [
                        anamneseData.physicalExam.vitalSigns.bloodPressure || '-',
                        anamneseData.physicalExam.vitalSigns.heartRate ? `${anamneseData.physicalExam.vitalSigns.heartRate} bpm` : '-',
                        anamneseData.physicalExam.vitalSigns.temperature ? `${anamneseData.physicalExam.vitalSigns.temperature} °C` : '-',
                        anamneseData.physicalExam.vitalSigns.respiratoryRate ? `${anamneseData.physicalExam.vitalSigns.respiratoryRate} irpm` : '-',
                        anamneseData.physicalExam.vitalSigns.oxygenSaturation ? `${anamneseData.physicalExam.vitalSigns.oxygenSaturation}%` : '-'
                    ]
                ];

                const cellWidth = (pageWidth - 2 * margin) / 5;
                const tableY = yPos;

                // Cabeçalho da tabela
                doc.setFillColor(17, 30, 90);
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                for (let i = 0; i < vitalSigns[0].length; i++) {
                    doc.rect(margin + (i * cellWidth), tableY, cellWidth, 10, 'F');
                    doc.text(vitalSigns[0][i], margin + (i * cellWidth) + 2, tableY + 6);
                }

                // Corpo da tabela
                doc.setFillColor(255, 255, 255);
                doc.setTextColor(0, 0, 0);
                for (let i = 0; i < vitalSigns[1].length; i++) {
                    doc.rect(margin + (i * cellWidth), tableY + 10, cellWidth, 10, 'S');
                    doc.text(vitalSigns[1][i], margin + (i * cellWidth) + 2, tableY + 16);
                }

                yPos = tableY + 25;

                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Add physical exam details
                const physicalExam = anamneseData.physicalExam;
                const examParts = [
                    { title: 'Cabeça e Pescoço', value: physicalExam.headAndNeck },
                    { title: 'Cardiovascular', value: physicalExam.cardiovascular },
                    { title: 'Respiratório', value: physicalExam.respiratory },
                    { title: 'Abdômen', value: physicalExam.abdomen },
                    { title: 'Extremidades', value: physicalExam.extremities },
                    { title: 'Neurológico', value: physicalExam.neurological },
                    { title: 'Outros', value: physicalExam.other }
                ];

                for (const part of examParts) {
                    if (part.value) {
                        // Add a new page if needed
                        if (yPos > 250) {
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`${part.title}:`, margin, yPos);
                        yPos += 7;
                        doc.setFont('helvetica', 'normal');
                        yPos = addWrappedText(part.value, margin, yPos, pageWidth - (2 * margin)) + 5;
                    }
                }

                // Check if we need a new page
                if (yPos > 230) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section: Diagnosis and Treatment
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Conclusões', margin, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Diagnóstico:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.diagnosis, margin, yPos, pageWidth - (2 * margin)) + 5;

                doc.setFont('helvetica', 'bold');
                doc.text('Plano de Tratamento:', margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(anamneseData.treatmentPlan, margin, yPos, pageWidth - (2 * margin)) + 5;

                if (anamneseData.additionalNotes) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Observações Adicionais:', margin, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    yPos = addWrappedText(anamneseData.additionalNotes, margin, yPos, pageWidth - (2 * margin)) + 10;
                }

                // Footer with page numbers
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    doc.text(
                        `Página ${i} de ${totalPages}`,
                        pageWidth - margin,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'right' }
                    );
                }

                resolve(doc);
            }, 0);
        });
    }, [patientData, getPatientName]);



    // Função para salvar a anamnese
    const handleSaveAnamnese = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            let anamneseId;
            let isNewAnamnese = true;

            // Check if we're editing an existing anamnese
            if (anamneseId) {
                // Update existing anamnese
                await firebaseService.updateAnamnese(
                    doctorId,
                    patientId,
                    anamneseId,
                    anamneseData
                );
                isNewAnamnese = false;
            } else {
                // Create new anamnese
                anamneseId = await firebaseService.createAnamnese(
                    doctorId,
                    patientId,
                    anamneseData
                );
            }

            // Generate PDF asynchronously
            const pdfDoc = await generateAnamnesePDFAsync(anamneseData);
            const pdfBlob = pdfDoc.output('blob');

            // Create a File object from the Blob
            const patientNameForFile = getPatientName().replace(/\s+/g, '_');
            const pdfFileName = `anamnese_${patientNameForFile}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;

            const pdfFile = new File(
                [pdfBlob],
                pdfFileName,
                { type: 'application/pdf' }
            );

            // Upload PDF to Firebase Storage
            const pdfPath = `users/${doctorId}/patients/${patientId}/anamneses/${anamneseId}/${pdfFileName}`;
            const pdfUrl = await firebaseService.uploadFile(
                pdfFile,
                pdfPath
            );

            // Update anamnesis with PDF URL
            await firebaseService.updateAnamnese(
                doctorId,
                patientId,
                anamneseId,
                { pdfUrl }
            );

            // If creating a new anamnese, create a note for it
            if (isNewAnamnese) {
                // Create anamnesis note
                const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                const noteData = {
                    noteTitle: `Anamnese - ${getPatientName()}`,
                    noteText: `Anamnese realizada em ${formattedDate}. Queixa principal: ${anamneseData.chiefComplaint}`,
                    noteType: "Anamnese", // Special type for anamnesis notes
                    consultationDate: new Date(),
                    anamneseId, // Reference to the anamnesis
                    createdAt: new Date(),
                    pdfUrl // Store the PDF URL in the note as well
                };

                const noteId = await firebaseService.createNote(
                    doctorId,
                    patientId,
                    noteData
                );

                // Attach PDF to note
                await firebaseService.uploadNoteAttachment(
                    pdfFile,
                    doctorId,
                    patientId,
                    noteId
                );
            } else {
                // If updating, find and update the associated note
                const notes = await firebaseService.listNotes(doctorId, patientId);
                const associatedNote = notes.find(note => note.anamneseId === anamneseId);

                if (associatedNote) {
                    const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                    await firebaseService.updateNote(
                        doctorId,
                        patientId,
                        associatedNote.id,
                        {
                            noteText: `Anamnese atualizada em ${formattedDate}. Queixa principal: ${anamneseData.chiefComplaint}`,
                            pdfUrl: pdfUrl,
                            lastModified: new Date()
                        }
                    );

                    // Update attachment if needed
                    await firebaseService.uploadNoteAttachment(
                        pdfFile,
                        doctorId,
                        patientId,
                        associatedNote.id
                    );
                }
            }

            setSnackbar({
                open: true,
                message: isNewAnamnese ? "Anamnese registrada com sucesso!" : "Anamnese atualizada com sucesso!",
                severity: "success",
            });

            // Close dialog after a short delay
            setTimeout(() => {
                if (onSave) {
                    onSave(anamneseId);
                }
            }, 1500);

        } catch (error) {
            console.error("Erro ao salvar anamnese:", error);
            setSnackbar({
                open: true,
                message: "Erro ao processar anamnese. Tente novamente.",
                severity: "error",
            });
            setIsSubmitting(false);
        }
    }, [anamneseData, validateForm, generateAnamnesePDFAsync, doctorId, patientId, getPatientName, onSave]);

    // Função para fechar o snackbar
    const handleCloseSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);

    // Componente para renderizar seções de itens (histórico médico, cirurgias, etc.)
    const renderItemSection = useCallback((title, type, placeholder) => (
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
    ), [inputValues, anamneseData, handleInputChange, handleKeyPress, addItem, removeItem]);

    // Componente para renderizar botões de toggle (sim/não)
    const renderToggleSection = useCallback((title, field, description) => (
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
    ), [anamneseData.socialHistory, handleToggleSocialHistory, handleSocialHistoryChange]);

    // Renderização condicional para estado de carregamento
    if (loading && open) {
        return (
            <FullScreenDialog
                fullScreen={fullScreen}
                open={open}
                onClose={() => onClose()}
                TransitionComponent={Transition}
            >
                <DialogHeader>
                    <Typography variant="h5" component="h2">Carregando Anamnese</Typography>
                    <CloseButton onClick={() => onClose()}>
                        <CloseIcon />
                    </CloseButton>
                </DialogHeader>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    p: 3
                }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography>Carregando dados do paciente...</Typography>
                </Box>
            </FullScreenDialog>
        );
    }

    // Renderização para estado de erro
    if (error && open) {
        return (
            <FullScreenDialog
                fullScreen={fullScreen}
                open={open}
                onClose={() => onClose()}
                TransitionComponent={Transition}
            >
                <DialogHeader>
                    <Typography variant="h5" component="h2">Erro ao carregar dados</Typography>
                    <CloseButton onClick={() => onClose()}>
                        <CloseIcon />
                    </CloseButton>
                </DialogHeader>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    p: 3
                }}>
                    <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                    <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        sx={{ mb: 2 }}
                    >
                        Tentar Novamente
                    </Button>
                    <Button variant="outlined" onClick={() => onClose()}>
                        Fechar
                    </Button>
                </Box>
            </FullScreenDialog>
        );
    }

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
                            fontSize: `${1.5 * fontSizeScale}rem`
                        }}
                    >
                        Nova Anamnese
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontFamily: "Gellix, sans-serif",
                            color: "rgba(17, 30, 90, 0.7)",
                            fontSize: `${1 * fontSizeScale}rem`
                        }}
                    >
                        {patientData ? `Paciente: ${getPatientName()}` : "Preencha os dados da anamnese"}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Audio Recording Button */}
                    <Tooltip title={
                        isFreeUser 
                            ? "Funcionalidade Premium - Faça upgrade para gravar áudio da consulta" 
                            : "Gravar áudio da consulta para preencher automaticamente a anamnese"
                    } placement="bottom">
                        <Button
                            variant="contained"
                            onClick={handleAudioRecording}
                            startIcon={
                                isFreeUser ? (
                                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MicIcon sx={{ opacity: 0.5 }} />
                                        <LockIcon
                                            sx={{
                                                position: 'absolute',
                                                fontSize: 16,
                                                color: '#f59e0b',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <MicIcon />
                                )
                            }
                            sx={{
                                mr: 2,
                                backgroundColor: isFreeUser ? "rgba(160, 174, 192, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: isFreeUser ? "#94A3B8" : "#EF4444",
                                borderRadius: "50px",
                                padding: "8px 16px",
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: "none",
                                opacity: isFreeUser ? 0.6 : 1,
                                "&:hover": {
                                    backgroundColor: isFreeUser ? "rgba(160, 174, 192, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                    boxShadow: isFreeUser ? "none" : "0px 2px 6px rgba(239, 68, 68, 0.2)",
                                }
                            }}
                        >
                            {isFreeUser ? "Gravar Consulta (Premium)" : "Gravar Consulta"}
                        </Button>
                    </Tooltip>
                    {/* Notes Button */}
                    <Tooltip title="Ver histórico de anotações" placement="bottom">
                        <Button
                            variant="contained"
                            onClick={() => setNotesDrawerOpen(true)}
                            startIcon={<DescriptionIcon />}
                            sx={{
                                mr: 2,
                                backgroundColor: "rgba(51, 102, 255, 0.12)",
                                color: "#3366FF",
                                borderRadius: "50px",
                                padding: "8px 16px",
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: "none",
                                position: "relative",
                                "&:hover": {
                                    backgroundColor: "rgba(51, 102, 255, 0.2)",
                                    boxShadow: "0px 2px 6px rgba(51, 102, 255, 0.2)",
                                }
                            }}
                        >
                            Notas
                            {patientNotes.length > 0 && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: -8,
                                        right: -8,
                                        bgcolor: "error.main",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: 22,
                                        height: 22,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                        border: "2px solid white"
                                    }}
                                >
                                    {patientNotes.length}
                                </Box>
                            )}
                        </Button>
                    </Tooltip>
                    {/* Close Button */}
                    <CloseButton onClick={() => onClose()}>
                        <CloseIcon />
                    </CloseButton>
                </Box>
            </DialogHeader>

            {/* Body */}
            <DialogBody sx={{...fontSizeStyle, transition: "padding-right 0.3s ease-in-out",...(notesDrawerOpen && !fullScreen ? { paddingRight: "450px" } : {})}}>
                <Box sx={{ p: 3 }}>
                    {/* Seção 1: Informações Principais */}
                    <SectionContainer>
                        <MemoizedSectionHeader
                            title="Informações Principais"
                            expanded={expandedSections.mainInfo}
                            onToggle={() => handleToggleSection("mainInfo")}
                        />
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
                        <MemoizedSectionHeader
                            title="Históricos"
                            expanded={expandedSections.histories}
                            onToggle={() => handleToggleSection("histories")}
                        />
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
                        <MemoizedSectionHeader
                            title="Hábitos de Vida"
                            expanded={expandedSections.lifestyle}
                            onToggle={() => handleToggleSection("lifestyle")}
                        />
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
                        <MemoizedSectionHeader
                            title="Medicamentos e Alergias"
                            expanded={expandedSections.medicationsAllergies}
                            onToggle={() => handleToggleSection("medicationsAllergies")}
                        />
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
                        <MemoizedSectionHeader
                            title="Revisão de Sistemas"
                            expanded={expandedSections.systemsReview}
                            onToggle={() => handleToggleSection("systemsReview")}
                        />
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
                        <MemoizedSectionHeader
                            title="Exame Físico"
                            expanded={expandedSections.physicalExam}
                            onToggle={() => handleToggleSection("physicalExam")}
                        />
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
                                            <MemoizedVitalSignCard
                                                icon={<MonitorHeartIcon sx={{ color: "#3366FF", fontSize: 32, mb: 1 }} />}
                                                title="Pressão Arterial"
                                                name="bloodPressure"
                                                value={anamneseData.physicalExam.vitalSigns.bloodPressure}
                                                onChange={handleVitalSignChange}
                                                unit="mmHg"
                                                placeholder="120/80"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <MemoizedVitalSignCard
                                                icon={<FavoriteIcon sx={{ color: "#F50057", fontSize: 32, mb: 1 }} />}
                                                title="Frequência Cardíaca"
                                                name="heartRate"
                                                value={anamneseData.physicalExam.vitalSigns.heartRate}
                                                onChange={handleVitalSignChange}
                                                unit="bpm"
                                                placeholder="75"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <MemoizedVitalSignCard
                                                icon={<ThermostatIcon sx={{ color: "#FF6D00", fontSize: 32, mb: 1 }} />}
                                                title="Temperatura"
                                                name="temperature"
                                                value={anamneseData.physicalExam.vitalSigns.temperature}
                                                onChange={handleVitalSignChange}
                                                unit="°C"
                                                placeholder="36.5"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <MemoizedVitalSignCard
                                                icon={<SpeedIcon sx={{ color: "#00BFA5", fontSize: 32, mb: 1 }} />}
                                                title="Freq. Respiratória"
                                                name="respiratoryRate"
                                                value={anamneseData.physicalExam.vitalSigns.respiratoryRate}
                                                onChange={handleVitalSignChange}
                                                unit="irpm"
                                                placeholder="16"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={4} md={2.4}>
                                            <MemoizedVitalSignCard
                                                icon={<BubbleChartIcon sx={{ color: "#651FFF", fontSize: 32, mb: 1 }} />}
                                                title="Saturação O₂"
                                                name="oxygenSaturation"
                                                value={anamneseData.physicalExam.vitalSigns.oxygenSaturation}
                                                onChange={handleVitalSignChange}
                                                unit="%"
                                                placeholder="98"
                                            />
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
                        <MemoizedSectionHeader
                            title="Conclusões"
                            expanded={expandedSections.conclusions}
                            onToggle={() => handleToggleSection("conclusions")}
                        />
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

            <>
                {/* Footer */}
                <ActionButtonsContainer sx={{
                    transition: "padding-right 0.3s ease-in-out",
                    ...(notesDrawerOpen && !fullScreen ? { paddingRight: "450px" } : {})
                }}>
                    <ActionButton
                        variant="outlined"
                        disabled={isSubmitting}
                        onClick={() => onClose()}
                        sx={{ fontSize: `${fontSizeScale}rem` }}
                    >
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="contained"
                        onClick={handleSaveAnamnese}
                        disabled={isSubmitting}
                        startIcon={<LocalHospitalIcon />}
                        sx={{ fontSize: `${fontSizeScale}rem` }}
                    >
                        {isSubmitting ? "Salvando..." : "Salvar Anamnese"}
                    </ActionButton>
                </ActionButtonsContainer>

                {/* Controle de tamanho de fonte flutuante */}
                <FontSizeControl>
                    <Typography
                        sx={{
                            mr: 1.5,
                            fontWeight: 500,
                            color: "#111E5A",
                            fontSize: `${0.9 * fontSizeScale}rem`
                        }}
                    >
                        Tamanho do texto
                    </Typography>
                    <FontSizeButton
                        size="small"
                        onClick={decreaseFontSize}
                        disabled={fontSizeScale <= MIN_SCALE}
                        aria-label="Diminuir tamanho da fonte"
                    >
                        <TextDecreaseIcon />
                    </FontSizeButton>

                    {/* Botão de restaurar */}
                    <FontSizeButton
                        size="small"
                        onClick={resetFontSize}
                        disabled={fontSizeScale === MIN_SCALE}
                        aria-label="Restaurar tamanho da fonte padrão"
                        sx={{
                            color: fontSizeScale !== MIN_SCALE ? "#1852FE" : "rgba(17, 30, 90, 0.38)",
                            "&:hover": {
                                backgroundColor: fontSizeScale !== MIN_SCALE ? "rgba(24, 82, 254, 0.08)" : "transparent",
                            }
                        }}
                    >
                        <AccessibilityNewIcon />
                    </FontSizeButton>

                    <FontSizeButton
                        size="small"
                        onClick={increaseFontSize}
                        disabled={fontSizeScale >= MAX_SCALE}
                        aria-label="Aumentar tamanho da fonte"
                    >
                        <TextIncreaseIcon />
                    </FontSizeButton>
                </FontSizeControl>

                {/* Painel de Notas */}
                <AnamneseNotesPanel
                    open={notesDrawerOpen}
                    onClose={() => setNotesDrawerOpen(false)}
                    patientData={patientData}
                    notesData={patientNotes}
                    onSelectNote={handleSelectNote}
                />

                {/* Indicação de nota selecionada */}
                {selectedNote && (
                    <Box
                        sx={{
                            position: "fixed",
                            bottom: theme.spacing(14),
                            left: theme.spacing(4),
                            zIndex: 1100,
                            maxWidth: "280px",
                            backgroundColor: "#ECF1FF",
                            borderRadius: "12px",
                            padding: "12px",
                            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #EAECEF",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#3366FF" }}>
                            Nota selecionada:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedNote.noteTitle || "Sem título"}
                        </Typography>
                        <IconButton
                            size="small"
                            sx={{ position: "absolute", top: "4px", right: "4px" }}
                            onClick={() => setSelectedNote(null)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

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
                
                {/* Floating Voice Recorder */}
                {showVoiceRecorder && (
                    <FloatingVoiceRecorder
                        onTranscription={(transcription) => {
                            // Processar a transcrição como resultado da anamnese
                            handleAudioResult({ transcription, analysis: transcription });
                        }}
                        onClose={() => setShowVoiceRecorder(false)}
                        position="top-right"
                        context="anamnese"
                    />
                )}

                {/* ✅ UPGRADE DIALOG PARA USUÁRIOS FREE */}
                <AccessDeniedDialog
                    open={upgradeDialogOpen}
                    onClose={() => setUpgradeDialogOpen(false)}
                    moduleName="ai_analysis"
                    onUpgrade={() => {
                        setUpgradeDialogOpen(false);
                        // Opcional: adicionar lógica adicional após upgrade
                    }}
                    title="Funcionalidade Premium"
                />
            </>
        </FullScreenDialog>
    );
}