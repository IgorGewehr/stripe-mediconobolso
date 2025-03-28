"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Divider,
    Grid,
    Paper,
    Tooltip,
    Slide,
    Fade,
    Avatar,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    useMediaQuery,
    Badge
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningIcon from "@mui/icons-material/Warning";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TimerIcon from "@mui/icons-material/Timer";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import HistoryIcon from "@mui/icons-material/History";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PregnantWomanIcon from "@mui/icons-material/PregnantWoman";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentsIcon from "@mui/icons-material/Payments";
import HealingIcon from "@mui/icons-material/Healing";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import SpaIcon from "@mui/icons-material/Spa";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase
import FirebaseService from "../../../lib/firebaseService";

// Tema personalizado
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1E40AF',
            light: '#E0E7FF',
            dark: '#1E3A8A',
            contrastText: '#FFFFFF',
        },
        status: {
            agendada: {
                main: '#3B82F6',  // Azul para consultas agendadas
                light: '#EFF6FF',
                dark: '#1D4ED8',
                contrastText: '#FFFFFF',
                background: '#F0F7FF',
                gradient: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
            },
            confirmada: {
                main: '#10B981',  // Verde para consultas confirmadas
                light: '#ECFDF5',
                dark: '#059669',
                contrastText: '#FFFFFF',
                background: '#F0FFF4',
                gradient: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)',
            },
            emAndamento: {
                main: '#F59E0B',  // Amarelo para consultas em andamento
                light: '#FFFBEB',
                dark: '#D97706',
                contrastText: '#FFFFFF',
                background: '#FFFBEB',
                gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
            },
            cancelada: {
                main: '#EF4444',  // Vermelho para consultas canceladas
                light: '#FEF2F2',
                dark: '#DC2626',
                contrastText: '#FFFFFF',
                background: '#FFF5F5',
                gradient: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)',
            },
        },
        tipo: {
            presencial: {
                main: '#1E40AF',
                light: '#E0E7FF',
                gradient: 'linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)',
                contrastText: '#FFFFFF',
            },
            telemedicina: {
                main: '#7C3AED',
                light: '#F5F3FF',
                gradient: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
                contrastText: '#FFFFFF',
            }
        },
        grey: {
            100: '#F9FAFB',
            200: '#F3F4F6',
            300: '#E5E7EB',
            400: '#9CA3AF',
            500: '#6B7280',
            800: '#1F2937',
        }
    },
    typography: {
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
        },
        subtitle1: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '0.9375rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
        caption: {
            fontSize: '0.75rem',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 24,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    }
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    margin: '24px 0',
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    transition: 'all 0.3s ease',
                }
            }
        }
    }
});

// Transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Componente de item de informação
const InfoItem = ({ icon, label, value, sx }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, ...sx }}>
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        wordBreak: 'break-word'
                    }}
                >
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
};

// Cartão de plano de saúde estilizado
const HealthPlanCard = ({ plan, formatDate }) => {
    // Gerar uma cor baseada no nome do plano
    const getColorFromName = (name) => {
        const colors = [
            { main: '#0EA5E9', light: '#E0F2FE', medium: '#BAE6FD' }, // Sky
            { main: '#8B5CF6', light: '#EDE9FE', medium: '#DDD6FE' }, // Violet
            { main: '#EC4899', light: '#FCE7F3', medium: '#FBCFE8' }, // Pink
            { main: '#10B981', light: '#ECFDF5', medium: '#A7F3D0' }, // Emerald
            { main: '#F59E0B', light: '#FFFBEB', medium: '#FDE68A' }, // Amber
        ];

        // Hash simples para selecionar uma cor
        let hash = 0;
        if (!name) return colors[0];

        for (let i = 0; i < name.length; i++) {
            hash = (hash + name.charCodeAt(i)) % colors.length;
        }

        return colors[hash];
    };

    const planColor = getColorFromName(plan.name);

    return (
        <Card
            elevation={0}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                border: `1px solid ${planColor.medium}`,
                backgroundImage: `linear-gradient(135deg, ${planColor.light} 0%, white 100%)`,
                mb: 2,
                transition: 'all 0.3s',
                '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(planColor.main, 0.3)}`,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '6px',
                    height: '100%',
                    backgroundColor: planColor.main
                }}
            />

            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    backgroundColor: alpha(planColor.main, 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1.5,
                                    color: planColor.main
                                }}
                            >
                                <HealthAndSafetyIcon fontSize="small" />
                            </Box>

                            <Typography
                                variant="subtitle1"
                                color={planColor.main}
                                sx={{ fontWeight: 600 }}
                            >
                                {plan.name}
                            </Typography>
                        </Box>
                    </Box>

                    {plan.type && (
                        <Chip
                            label={plan.type}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                backgroundColor: alpha(planColor.main, 0.1),
                                color: planColor.main,
                                fontWeight: 600,
                                borderRadius: '12px'
                            }}
                        />
                    )}
                </Box>

                <Divider sx={{ my: 1.5, borderColor: alpha(planColor.main, 0.2) }} />

                <Grid container spacing={2}>
                    {plan.number && (
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FingerprintIcon
                                    sx={{
                                        color: alpha(planColor.main, 0.7),
                                        mr: 1,
                                        fontSize: '1rem'
                                    }}
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Número
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {plan.number}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    )}

                    {plan.validUntil && formatDate(plan.validUntil) && (
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EventAvailableIcon
                                    sx={{
                                        color: alpha(planColor.main, 0.7),
                                        mr: 1,
                                        fontSize: '1rem'
                                    }}
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Validade
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        {formatDate(plan.validUntil)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

// Componente de status do paciente
const StatusIndicator = ({ status }) => {
    // Mapeamento de status para ícones e cores
    const getStatusDetails = (status) => {
        const statusMap = {
            "Particular": {
                icon: <PaymentsIcon />,
                bg: "#E0F2FE",
                color: "#0EA5E9",
                border: "#BAE6FD"
            },
            "Convênio": {
                icon: <CreditCardIcon />,
                bg: "#E0E7FF",
                color: "#4F46E5",
                border: "#C7D2FE"
            },
            "Internado": {
                icon: <LocalHospitalIcon />,
                bg: "#FEE2E2",
                color: "#EF4444",
                border: "#FECACA"
            },
            "Pós-cirurgia": {
                icon: <HealingIcon />,
                bg: "#EDE9FE",
                color: "#8B5CF6",
                border: "#DDD6FE"
            },
            "Gestante": {
                icon: <PregnantWomanIcon />,
                bg: "#FEF3C7",
                color: "#F59E0B",
                border: "#FDE68A"
            },
            "Alta": {
                icon: <SpaIcon />,
                bg: "#D1FAE5",
                color: "#10B981",
                border: "#A7F3D0"
            }
        };

        return statusMap[status] || {
            icon: <BadgeIcon />,
            bg: "#F3F4F6",
            color: "#4B5563",
            border: "#E5E7EB"
        };
    };

    const { icon, bg, color, border } = getStatusDetails(status);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: `0 2px 8px ${alpha(color, 0.2)}`,
                    transform: 'translateY(-1px)'
                }
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: alpha(color, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color
                }}
            >
                {icon}
            </Box>
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 600,
                    color: color
                }}
            >
                {status}
            </Typography>
        </Box>
    );
};

// Chip para condições clínicas e alergias
const ConditionChip = ({ label, type = "condition" }) => {
    // Determinar cores com base no tipo e texto
    const getChipColor = (label, type) => {
        // Cores para condições clínicas
        if (type === "condition") {
            const conditionMatchers = [
                { pattern: /fumante|tabag|cigarro/i, bg: "#FEE2E2", color: "#EF4444" },
                { pattern: /obes|sobre ?peso/i, bg: "#FEF3C7", color: "#F59E0B" },
                { pattern: /hiper|press.o|cardio/i, bg: "#E0F2FE", color: "#0EA5E9" },
                { pattern: /diabet|glice/i, bg: "#EDE9FE", color: "#8B5CF6" },
                { pattern: /asma|respira/i, bg: "#D1FAE5", color: "#10B981" }
            ];

            for (let matcher of conditionMatchers) {
                if (matcher.pattern.test(label)) {
                    return { bg: matcher.bg, color: matcher.color };
                }
            }

            return { bg: "#E0E7FF", color: "#4F46E5" }; // Default para condições
        }

        // Cores para alergias (sempre vermelho)
        return { bg: "#FEE2E2", color: "#EF4444" };
    };

    const { bg, color } = getChipColor(label, type);

    return (
        <Chip
            label={label}
            sx={{
                height: 30,
                borderRadius: '15px',
                backgroundColor: bg,
                color: color,
                fontWeight: 500,
                boxShadow: `0 1px 2px ${alpha(color, 0.1)}`,
                px: 0.5,
                '&:hover': {
                    backgroundColor: alpha(bg, 0.8),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 4px ${alpha(color, 0.2)}`
                },
                transition: 'all 0.2s'
            }}
        />
    );
};

const ViewConsultationDialog = ({
                                    open,
                                    onClose,
                                    consultationData,
                                    patientId,
                                    doctorId,
                                    onEdit,
                                    onDelete,
                                    onChangeStatus
                                }) => {
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [expanded, setExpanded] = useState({
        history: false,
        conduta: false,
    });
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [statusChangeConfirm, setStatusChangeConfirm] = useState(null);

    const muiTheme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Cores por tipo de status
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'concluída':
            case 'confirmada':
            case 'confirmado':
                return theme.palette.status.confirmada;
            case 'cancelada':
            case 'cancelado':
                return theme.palette.status.cancelada;
            case 'em andamento':
                return theme.palette.status.emAndamento;
            default:
                return theme.palette.status.agendada;
        }
    };

    // Cores por tipo de consulta
    const getTipoColor = (tipo) => {
        switch(tipo?.toLowerCase()) {
            case 'telemedicina':
                return theme.palette.tipo.telemedicina;
            default:
                return theme.palette.tipo.presencial;
        }
    };

    // Ícone por tipo de consulta
    const getTipoIcon = (tipo) => {
        switch(tipo?.toLowerCase()) {
            case 'telemedicina':
                return <VideoCallIcon />;
            default:
                return <LocationOnIcon />;
        }
    };

    // Busca dados do paciente
    useEffect(() => {
        const fetchPatientData = async () => {
            if (open && patientId && doctorId) {
                setLoading(true);
                try {
                    const data = await FirebaseService.getPatient(doctorId, patientId);
                    setPatientData(data);
                } catch (error) {
                    console.error("Erro ao buscar dados do paciente:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchPatientData();
    }, [open, patientId, doctorId]);

    // Formatação de data
    const formatDate = (date) => {
        try {
            // Retorna string vazia para valores vazios
            if (!date) return "";

            let dateObj;

            // Se já for um objeto Date
            if (date instanceof Date) {
                dateObj = date;
            }
            // Se for um Timestamp do Firestore com método toDate()
            else if (date && typeof date.toDate === 'function') {
                dateObj = date.toDate();
            }
            // Se for uma string no formato 'YYYY-MM-DD'
            else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                const [year, month, day] = date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            }
            // Se for uma string ou número que podemos tentar converter
            else {
                dateObj = new Date(date);
            }

            // Verificar se a data resultante é válida
            if (isNaN(dateObj.getTime())) {
                console.warn("Data inválida:", date);
                return "";
            }

            return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data:", error, date);
            return "";
        }
    };


    const formatDateTime = (date) => {
        try {
            if (!date) return "";

            let dateObj;
            if (date instanceof Date) {
                dateObj = date;
            } else if (date && typeof date.toDate === 'function') {
                dateObj = date.toDate();
            } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                const [year, month, day] = date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(date);
            }

            if (isNaN(dateObj.getTime())) {
                return "";
            }

            return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data e hora:", error, date);
            return "";
        }
    };


    const formatTimeAgo = (date) => {
        try {
            if (!date) return "";

            let dateObj;
            if (date instanceof Date) {
                dateObj = date;
            } else if (date && typeof date.toDate === 'function') {
                dateObj = date.toDate();
            } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                const [year, month, day] = date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(date);
            }

            if (isNaN(dateObj.getTime())) {
                return "";
            }

            return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
        } catch (error) {
            console.error("Erro ao calcular tempo decorrido:", error, date);
            return "";
        }
    };
    const formatDuration = (minutes) => {
        if (!minutes) return "30 minutos";

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours === 0) {
            return `${mins} minutos`;
        } else if (mins === 0) {
            return hours === 1 ? `1 hora` : `${hours} horas`;
        } else {
            return `${hours}h${mins}min`;
        }
    };

    const getPatientName = () => {
        if (!patientData) return "Carregando...";
        return patientData.nome || patientData.patientName || "Paciente";
    };

    const handleToggleExpand = (section) => {
        setExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(consultationData);
        }
    };

    const handleDeleteClick = () => {
        setDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (onDelete) {
            onDelete(consultationData.id);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(false);
    };

    const handleStatusChangeClick = (newStatus) => {
        setStatusChangeConfirm(newStatus);
    };

    const handleStatusChangeConfirm = async () => {
        if (onChangeStatus && statusChangeConfirm) {
            onChangeStatus(consultationData.id, statusChangeConfirm);
            setStatusChangeConfirm(null);
        }
    };

    const handleStatusChangeCancel = () => {
        setStatusChangeConfirm(null);
    };

    const statusColor = getStatusColor(consultationData?.status);
    const tipoColor = getTipoColor(consultationData?.consultationType);
    const tipoIcon = getTipoIcon(consultationData?.consultationType);

    // Renderizar plano de saúde do paciente
    const renderHealthPlan = () => {
        if (!patientData) return null;

        // Verificar se há planos de saúde
        const hasHealthPlans = patientData.healthPlans && patientData.healthPlans.length > 0;
        if (!hasHealthPlans && !patientData.healthPlan) return null;

        // Obter planos do paciente
        const healthPlans = hasHealthPlans ? patientData.healthPlans : (patientData.healthPlan ? [patientData.healthPlan] : []);

        if (healthPlans.length === 0) return null;

        return (
            <Box sx={{ mt: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        position: 'relative',
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: -16,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            borderRadius: 4,
                            backgroundColor: theme.palette.primary.main,
                        }
                    }}
                >
                    <HealthAndSafetyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Plano de Saúde
                </Typography>

                <Box sx={{ ml: 1 }}>
                    {healthPlans.map((plan, index) => {
                        // Se o plano não tiver um nome, pular
                        if (!plan.name) return null;

                        return (
                            <HealthPlanCard
                                key={index}
                                plan={plan}
                                formatDate={formatDate}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    };

    // Renderizar status do paciente
    const renderPatientStatus = () => {
        if (!patientData) return null;

        // Verificar se há status do paciente
        const hasStatus = patientData.statusList && patientData.statusList.length > 0;
        if (!hasStatus) return null;

        return (
            <Box sx={{ mt: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        position: 'relative',
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: -16,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            borderRadius: 4,
                            backgroundColor: theme.palette.primary.main,
                        }
                    }}
                >
                    <MedicalInformationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Status do Paciente
                </Typography>

                <Grid container spacing={2} sx={{ ml: 1 }}>
                    {patientData.statusList.map((status, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <StatusIndicator status={status} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    // Renderizar condições clínicas do paciente
    const renderPatientConditions = () => {
        if (!patientData) return null;

        // Verificar se há doenças crônicas
        const hasChronicDiseases =
            (patientData.chronicDiseases && patientData.chronicDiseases.length > 0) ||
            (patientData.condicoesClinicas?.doencas && patientData.condicoesClinicas.doencas.length > 0);

        // Verificar se há alergias
        const hasAllergies =
            (patientData.allergies && patientData.allergies.length > 0) ||
            (patientData.condicoesClinicas?.alergias && patientData.condicoesClinicas.alergias.length > 0);

        if (!hasChronicDiseases && !hasAllergies) return null;

        // Obter lista unificada de doenças crônicas
        const chronicDiseases = [
            ...(patientData.chronicDiseases || []),
            ...(patientData.condicoesClinicas?.doencas || [])
        ];

        // Obter lista unificada de alergias
        const allergies = [
            ...(patientData.allergies || []),
            ...(patientData.condicoesClinicas?.alergias || [])
        ];

        // Remover duplicatas
        const uniqueChronicDiseases = [...new Set(chronicDiseases)];
        const uniqueAllergies = [...new Set(allergies)];

        return (
            <Box sx={{ mt: 4 }}>
                {uniqueChronicDiseases.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                position: 'relative',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: -16,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    borderRadius: 4,
                                    backgroundColor: theme.palette.primary.main,
                                }
                            }}
                        >
                            <MedicalServicesIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            Condições Clínicas
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
                            {uniqueChronicDiseases.map((disease, index) => (
                                <ConditionChip
                                    key={index}
                                    label={disease}
                                    type="condition"
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {uniqueAllergies.length > 0 && (
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                position: 'relative',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: -16,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    borderRadius: 4,
                                    backgroundColor: '#EF4444',
                                }
                            }}
                        >
                            <PriorityHighIcon sx={{ mr: 1, color: '#EF4444' }} />
                            Alergias
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
                            {uniqueAllergies.map((allergy, index) => (
                                <ConditionChip
                                    key={index}
                                    label={allergy}
                                    type="allergy"
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        );
    };

    // Renderizar histórico do paciente
    const renderPatientHistory = () => {
        if (!patientData) return null;

        // Verificar se há histórico médico
        const hasHistory =
            patientData.historicoMedico ||
            patientData.historicoConduta?.doencasHereditarias;

        if (!hasHistory) return null;

        // Obter histórico
        const history = patientData.historicoMedico || patientData.historicoConduta?.doencasHereditarias;

        return (
            <Box sx={{ mt: 4 }}>
                <Accordion
                    expanded={expanded.history}
                    onChange={() => handleToggleExpand('history')}
                    elevation={0}
                    disableGutters
                    sx={{
                        backgroundColor: 'transparent',
                        '&:before': { display: 'none' },
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: expanded.history ? '12px 12px 0 0' : 3,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Histórico Médico
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                            {history}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

    // Renderizar conduta inicial do paciente
    const renderPatientConduta = () => {
        if (!patientData) return null;

        // Verificar se há conduta inicial
        const hasConduta = patientData.historicoConduta?.condutaInicial;

        if (!hasConduta) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Accordion
                    expanded={expanded.conduta}
                    onChange={() => handleToggleExpand('conduta')}
                    elevation={0}
                    disableGutters
                    sx={{
                        backgroundColor: 'transparent',
                        '&:before': { display: 'none' },
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: expanded.conduta ? '12px 12px 0 0' : 3,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Conduta Inicial
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                            {patientData.historicoConduta.condutaInicial}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

    if (!consultationData) return null;

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                fullScreen={fullScreen}
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)',
                        height: fullScreen ? '100%' : 'auto',
                        maxHeight: fullScreen ? '100%' : '90vh'
                    }
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #EAECEF',
                        background: statusColor.gradient,
                        p: { xs: 2, sm: 3 }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                bgcolor: statusColor.main,
                                color: 'white',
                                width: 48,
                                height: 48,
                                mr: 2,
                                display: { xs: 'none', sm: 'flex' },
                                boxShadow: `0 4px 8px ${alpha(statusColor.main, 0.3)}`
                            }}
                        >
                            <EventNoteIcon />
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: statusColor.dark }}>
                                    Consulta: {getPatientName()}
                                </Typography>
                                <Chip
                                    label={consultationData.status || "Agendada"}
                                    size="small"
                                    sx={{
                                        bgcolor: statusColor.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px',
                                        boxShadow: `0 2px 4px ${alpha(statusColor.main, 0.3)}`
                                    }}
                                />
                                <Chip
                                    label={consultationData.consultationType || "Presencial"}
                                    size="small"
                                    sx={{
                                        bgcolor: tipoColor.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px',
                                        boxShadow: `0 2px 4px ${alpha(tipoColor.main, 0.3)}`
                                    }}
                                    icon={
                                        <Box component="span" sx={{ '& > svg': { color: 'white !important', fontSize: '14px !important' } }}>
                                            {tipoIcon}
                                        </Box>
                                    }
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: alpha(statusColor.dark, 0.8),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                <CalendarTodayIcon sx={{ fontSize: '0.875rem' }} />
                                {formatDate(consultationData.consultationDate)} às {consultationData.consultationTime || consultationData.horaInicio}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: statusColor.dark,
                            backgroundColor: alpha('#fff', 0.2),
                            '&:hover': {
                                backgroundColor: alpha('#fff', 0.3)
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body */}
                <DialogContent
                    sx={{
                        p: 0,
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            borderRadius: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        }
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            p: { xs: 2, sm: 4 },
                            overflow: 'auto',
                            backgroundColor: '#FAFBFF'
                        }}
                    >
                        {/* Metadados da consulta */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        height: '100%',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.grey[200]}`,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        height: 5,
                                        backgroundColor: statusColor.main
                                    }} />
                                    <Box sx={{ p: 2 }}>
                                        <InfoItem
                                            icon={<CalendarTodayIcon sx={{ color: statusColor.main }} />}
                                            label="Data"
                                            value={formatDate(consultationData.consultationDate)}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        height: '100%',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.grey[200]}`,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        height: 5,
                                        backgroundColor: statusColor.main
                                    }} />
                                    <Box sx={{ p: 2 }}>
                                        <InfoItem
                                            icon={<AccessTimeIcon sx={{ color: statusColor.main }} />}
                                            label="Horário"
                                            value={consultationData.consultationTime || consultationData.horaInicio}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        height: '100%',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.grey[200]}`,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        height: 5,
                                        backgroundColor: statusColor.main
                                    }} />
                                    <Box sx={{ p: 2 }}>
                                        <InfoItem
                                            icon={<TimerIcon sx={{ color: statusColor.main }} />}
                                            label="Duração"
                                            value={formatDuration(consultationData.consultationDuration)}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        height: '100%',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.grey[200]}`,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        height: 5,
                                        backgroundColor: tipoColor.main
                                    }} />
                                    <Box sx={{ p: 2 }}>
                                        <InfoItem
                                            icon={tipoIcon && React.cloneElement(tipoIcon, {
                                                sx: { color: tipoColor.main }
                                            })}
                                            label="Tipo"
                                            value={consultationData.consultationType || 'Presencial'}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Informações do Paciente */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 3,
                                    position: 'relative',
                                    '&:before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: -16,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        borderRadius: 4,
                                        backgroundColor: theme.palette.primary.main,
                                    }
                                }}
                            >
                                <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                Informações do Paciente
                            </Typography>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 0,
                                    borderRadius: '20px',
                                    backgroundColor: 'white',
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    overflow: 'hidden'
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <Typography>Carregando dados do paciente...</Typography>
                                    </Box>
                                ) : patientData ? (
                                    <>
                                        <Box
                                            sx={{
                                                p: 3,
                                                backgroundImage: 'linear-gradient(135deg, #E0E7FF 0%, #F5F3FF 100%)',
                                                borderBottom: `1px solid ${theme.palette.grey[200]}`
                                            }}
                                        >
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={7}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Badge
                                                            overlap="circular"
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            badgeContent={
                                                                <Avatar
                                                                    sx={{
                                                                        width: 22,
                                                                        height: 22,
                                                                        border: '2px solid white',
                                                                        bgcolor: statusColor.main,
                                                                        color: 'white',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                >
                                                                    <PersonIcon sx={{ fontSize: '0.875rem' }} />
                                                                </Avatar>
                                                            }
                                                        >
                                                            <Avatar
                                                                src={patientData.photoURL || patientData.fotoPerfil}
                                                                alt={getPatientName()}
                                                                sx={{
                                                                    width: 84,
                                                                    height: 84,
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                    border: '2px solid white'
                                                                }}
                                                            >
                                                                {getPatientName().charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </Badge>

                                                        <Box sx={{ ml: 2 }}>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: theme.palette.grey[800]
                                                                }}
                                                            >
                                                                {getPatientName()}
                                                            </Typography>

                                                            {patientData.birthDate && (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: theme.palette.grey[600],
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        mt: 0.5,
                                                                        gap: 0.5
                                                                    }}
                                                                >
                                                                    <CalendarTodayIcon sx={{ fontSize: '0.875rem' }} />
                                                                    {formatDate(patientData.birthDate)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                <Grid item xs={12} sm={5}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 1,
                                                        height: '100%',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {(patientData.patientPhone || patientData.phone) && (
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.5
                                                            }}>
                                                                <Box
                                                                    sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: '10px',
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <PhoneIcon sx={{ color: theme.palette.primary.main }} />
                                                                </Box>
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        fontWeight: 500,
                                                                        color: theme.palette.grey[700]
                                                                    }}
                                                                >
                                                                    {patientData.patientPhone || patientData.phone}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {(patientData.patientEmail || patientData.email) && (
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1.5
                                                            }}>
                                                                <Box
                                                                    sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: '10px',
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <EmailIcon sx={{ color: theme.palette.primary.main }} />
                                                                </Box>
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        fontWeight: 500,
                                                                        color: theme.palette.grey[700],
                                                                        wordBreak: 'break-word'
                                                                    }}
                                                                >
                                                                    {patientData.patientEmail || patientData.email}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <Typography>Dados do paciente não disponíveis</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        {/* Motivo da Consulta */}
                        {consultationData.reasonForVisit && (
                            <Box sx={{ mb: 4 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 3,
                                        position: 'relative',
                                        '&:before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: -16,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            borderRadius: 4,
                                            backgroundColor: theme.palette.primary.main,
                                        }
                                    }}
                                >
                                    <AssignmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                    Motivo da Consulta
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: '16px',
                                        backgroundColor: 'white',
                                        border: `1px solid ${theme.palette.grey[200]}`,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '6px',
                                            height: '100%',
                                            backgroundColor: statusColor.main
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            whiteSpace: 'pre-line',
                                            pl: 2,
                                            color: theme.palette.grey[800]
                                        }}
                                    >
                                        {consultationData.reasonForVisit}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        {/* Plano de Saúde */}
                        {renderHealthPlan()}

                        {/* Status do Paciente */}
                        {renderPatientStatus()}

                        {/* Condições Clínicas */}
                        {renderPatientConditions()}

                        {/* Histórico Médico */}
                        {renderPatientHistory()}

                        {/* Conduta Inicial */}
                        {renderPatientConduta()}
                    </Box>
                </DialogContent>

                {/* Footer */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: { xs: 2, sm: 3 },
                        borderTop: '1px solid #EAECEF',
                        backgroundColor: 'white'
                    }}
                >
                    {deleteConfirm ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    mr: 2
                                }}
                            >
                                <WarningIcon sx={{ color: theme.palette.error.main }} />
                            </Box>
                            <Typography sx={{ color: theme.palette.error.main, fontWeight: 500, mr: 'auto' }}>
                                Tem certeza que deseja excluir esta consulta?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleDeleteCancel}
                                sx={{
                                    mr: 1,
                                    borderColor: theme.palette.grey[300],
                                    color: theme.palette.grey[700]
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteConfirm}
                                sx={{
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                                }}
                            >
                                Excluir
                            </Button>
                        </Box>
                    ) : statusChangeConfirm ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    mr: 2
                                }}
                            >
                                <WarningIcon sx={{ color: theme.palette.primary.main }} />
                            </Box>
                            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 500, mr: 'auto' }}>
                                Alterar status da consulta para "{statusChangeConfirm}"?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleStatusChangeCancel}
                                sx={{
                                    mr: 1,
                                    borderColor: theme.palette.grey[300],
                                    color: theme.palette.grey[700]
                                }}
                            >
                                Não
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleStatusChangeConfirm}
                                sx={{
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                                }}
                            >
                                Confirmar
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleDeleteClick}
                                sx={{
                                    borderColor: theme.palette.error.light,
                                    color: theme.palette.error.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.04),
                                        borderColor: theme.palette.error.main,
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
                                    }
                                }}
                            >
                                Excluir
                            </Button>

                            <Box>
                                {consultationData.status !== 'Concluída' && consultationData.status !== 'Cancelada' && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {consultationData.status !== 'Em Andamento' && (
                                            <Button
                                                variant="outlined"
                                                color="warning"
                                                startIcon={<PlayArrowIcon />}
                                                onClick={() => handleStatusChangeClick('Em Andamento')}
                                                sx={{
                                                    mr: 1,
                                                    borderColor: theme.palette.status.emAndamento.main,
                                                    color: theme.palette.status.emAndamento.main,
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.status.emAndamento.main, 0.04),
                                                        borderColor: theme.palette.status.emAndamento.dark,
                                                        boxShadow: `0 4px 12px ${alpha(theme.palette.status.emAndamento.main, 0.2)}`
                                                    }
                                                }}
                                            >
                                                Iniciar
                                            </Button>
                                        )}

                                        {consultationData.status !== 'Cancelada' && (
                                            <Button
                                                variant="outlined"
                                                startIcon={<CancelOutlinedIcon />}
                                                onClick={() => handleStatusChangeClick('Cancelada')}
                                                sx={{
                                                    mr: 1,
                                                    borderColor: theme.palette.status.cancelada.main,
                                                    color: theme.palette.status.cancelada.main,
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.status.cancelada.main, 0.04),
                                                        borderColor: theme.palette.status.cancelada.dark,
                                                        boxShadow: `0 4px 12px ${alpha(theme.palette.status.cancelada.main, 0.2)}`
                                                    }
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        )}

                                        {(consultationData.status === 'Agendada' || consultationData.status === 'Em Andamento') && (
                                            <Button
                                                variant="outlined"
                                                startIcon={<CheckCircleOutlineIcon />}
                                                onClick={() => handleStatusChangeClick('Concluída')}
                                                sx={{
                                                    mr: 2,
                                                    borderColor: theme.palette.status.confirmada.main,
                                                    color: theme.palette.status.confirmada.main,
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.status.confirmada.main, 0.04),
                                                        borderColor: theme.palette.status.confirmada.dark,
                                                        boxShadow: `0 4px 12px ${alpha(theme.palette.status.confirmada.main, 0.2)}`
                                                    }
                                                }}
                                            >
                                                Concluir
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={handleEdit}
                                    sx={{
                                        backgroundColor: statusColor.main,
                                        color: 'white',
                                        boxShadow: `0 4px 12px ${alpha(statusColor.main, 0.3)}`,
                                        '&:hover': {
                                            backgroundColor: statusColor.dark,
                                            boxShadow: `0 6px 16px ${alpha(statusColor.main, 0.4)}`
                                        }
                                    }}
                                >
                                    Editar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Dialog>
        </ThemeProvider>
    );
};

export default ViewConsultationDialog;