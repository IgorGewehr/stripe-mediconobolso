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
    useMediaQuery
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import HistoryIcon from "@mui/icons-material/History";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ShareIcon from "@mui/icons-material/Share";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase
import FirebaseService from "../../../lib/firebaseService";

// Tema personalizado
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
        },
        status: {
            agendada: {
                main: '#3B82F6',  // Azul para consultas agendadas
                light: '#ECF5FF',
                dark: '#1A56DB',
                contrastText: '#FFFFFF',
                background: '#F0F7FF',
            },
            confirmada: {
                main: '#22C55E',  // Verde para consultas confirmadas
                light: '#ECFDF5',
                dark: '#16A34A',
                contrastText: '#FFFFFF',
                background: '#F0FFF4',
            },
            emAndamento: {
                main: '#F59E0B',  // Amarelo para consultas em andamento
                light: '#FEF9C3',
                dark: '#D97706',
                contrastText: '#FFFFFF',
                background: '#FFFBEB',
            },
            cancelada: {
                main: '#EF4444',  // Vermelho para consultas canceladas
                light: '#FEF2F2',
                dark: '#DC2626',
                contrastText: '#FFFFFF',
                background: '#FFF5F5',
            },
        },
        tipo: {
            presencial: {
                main: '#1852FE',
                light: '#ECF1FF',
                contrastText: '#FFFFFF',
            },
            telemedicina: {
                main: '#7C3AED',
                light: '#F5F0FF',
                contrastText: '#FFFFFF',
            }
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            300: '#DFE3EB',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
        }
    },
    typography: {
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    margin: '16px 0',
                }
            }
        }
    }
});

// Transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

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
    const [expanded, setExpanded] = useState({});
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
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const formatDateTime = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const formatTimeAgo = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
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
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[800],
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <HealthAndSafetyIcon sx={{ mr: 1 }} />
                    Plano de Saúde
                </Typography>

                {healthPlans.map((plan, index) => {
                    // Se o plano não tiver um nome, pular
                    if (!plan.name) return null;

                    return (
                        <Card key={index} sx={{
                            mb: 2,
                            border: `1px solid ${theme.palette.primary.light}`,
                            boxShadow: 'none',
                            borderRadius: 2
                        }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                            {plan.name}
                                        </Typography>
                                        {plan.type && (
                                            <Chip
                                                label={plan.type}
                                                size="small"
                                                sx={{
                                                    mt: 1,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 500
                                                }}
                                            />
                                        )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {plan.number && (
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Número:</strong> {plan.number}
                                                </Typography>
                                            )}
                                            {plan.validUntil && (
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Validade:</strong> {formatDate(plan.validUntil)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    );
                })}
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
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[800],
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <MedicalInformationIcon sx={{ mr: 1 }} />
                    Status do Paciente
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {patientData.statusList.map((status, index) => {
                        // Função para determinar cor com base no status
                        const getStatusChipColor = (status) => {
                            const statusMap = {
                                "Particular": {bg: "#E5F8FF", color: "#1C94E0"},
                                "Convênio": {bg: "#E9EFFF", color: "#1852FE"},
                                "Internado": {bg: "#FFE8E5", color: "#FF4B55"},
                                "Pós-cirurgia": {bg: "#EFE6FF", color: "#7B4BC9"},
                                "Gestante": {bg: "#FFF4E5", color: "#FFAB2B"},
                                "Alta": {bg: "#E5FFF2", color: "#0CAF60"}
                            };
                            return statusMap[status] || {bg: "#F8F9FB", color: "#111E5A"};
                        };

                        const colors = getStatusChipColor(status);

                        return (
                            <Chip
                                key={index}
                                label={status}
                                sx={{
                                    backgroundColor: colors.bg,
                                    color: colors.color,
                                    fontWeight: 500,
                                    borderRadius: '16px',
                                    px: 1
                                }}
                            />
                        );
                    })}
                </Box>
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

        // Função para determinar cor com base na condição
        const getConditionColor = (condition) => {
            const conditionMap = {
                "fumante": {bg: "#FFE8E5", color: "#FF4B55"},
                "obeso": {bg: "#FFF4E5", color: "#FFAB2B"},
                "hipertenso": {bg: "#E5F8FF", color: "#1C94E0"},
                "diabetes": {bg: "#EFE6FF", color: "#7B4BC9"},
                "asma": {bg: "#E5FFF2", color: "#0CAF60"}
            };

            // Verificar condições específicas
            const lowerCondition = condition.toLowerCase();
            for (const key in conditionMap) {
                if (lowerCondition.includes(key)) {
                    return conditionMap[key];
                }
            }

            // Cor padrão para outras condições
            return {bg: "#E9EFFF", color: "#1852FE"};
        };

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
            <Box sx={{ mt: 3 }}>
                {uniqueChronicDiseases.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{
                            fontWeight: 600,
                            color: theme.palette.grey[800],
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <MedicalServicesIcon sx={{ mr: 1 }} />
                            Condições Clínicas
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {uniqueChronicDiseases.map((disease, index) => {
                                const colors = getConditionColor(disease);

                                return (
                                    <Chip
                                        key={index}
                                        label={disease}
                                        sx={{
                                            backgroundColor: colors.bg,
                                            color: colors.color,
                                            fontWeight: 500,
                                            borderRadius: '16px',
                                            px: 1
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {uniqueAllergies.length > 0 && (
                    <Box>
                        <Typography variant="h6" sx={{
                            fontWeight: 600,
                            color: theme.palette.grey[800],
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <PriorityHighIcon sx={{ mr: 1 }} />
                            Alergias
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {uniqueAllergies.map((allergy, index) => (
                                <Chip
                                    key={index}
                                    label={allergy}
                                    sx={{
                                        backgroundColor: "#FFE8E5",
                                        color: "#FF4B55",
                                        fontWeight: 500,
                                        borderRadius: '16px',
                                        px: 1
                                    }}
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
            <Box sx={{ mt: 3 }}>
                <Accordion
                    expanded={expanded.history}
                    onChange={() => handleToggleExpand('history')}
                    sx={{
                        boxShadow: 'none',
                        backgroundColor: alpha(theme.palette.primary.light, 0.5),
                        border: `1px solid ${theme.palette.primary.light}`,
                        '&:before': { display: 'none' },
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.light, 0.7),
                            borderRadius: expanded.history ? '8px 8px 0 0' : 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Histórico Médico
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography sx={{ whiteSpace: 'pre-line' }}>
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
                    sx={{
                        boxShadow: 'none',
                        backgroundColor: alpha(theme.palette.primary.light, 0.5),
                        border: `1px solid ${theme.palette.primary.light}`,
                        '&:before': { display: 'none' },
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.light, 0.7),
                            borderRadius: expanded.conduta ? '8px 8px 0 0' : 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Conduta Inicial
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography sx={{ whiteSpace: 'pre-line' }}>
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
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.08)',
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
                        backgroundColor: statusColor.light,
                        p: { xs: 2, sm: 3 }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                bgcolor: statusColor.main,
                                color: 'white',
                                width: 40,
                                height: 40,
                                mr: 2,
                                display: { xs: 'none', sm: 'flex' }
                            }}
                        >
                            <EventNoteIcon />
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: statusColor.dark }}>
                                    Consulta: {getPatientName()}
                                </Typography>
                                <Chip
                                    label={consultationData.status || "Agendada"}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        bgcolor: statusColor.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px'
                                    }}
                                />
                                <Chip
                                    label={consultationData.consultationType || "Presencial"}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        bgcolor: tipoColor.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px'
                                    }}
                                    icon={
                                        <Box component="span" sx={{ '& > svg': { color: 'white !important', fontSize: '14px !important' } }}>
                                            {tipoIcon}
                                        </Box>
                                    }
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(consultationData.consultationDate)} às {consultationData.consultationTime || consultationData.horaInicio}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: theme.palette.grey[700] }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body */}
                <DialogContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            height: '100%',
                            p: { xs: 2, sm: 3 },
                            overflow: 'auto',
                            backgroundColor: statusColor.background
                        }}
                    >
                        {/* Metadados da consulta */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        border: '1px solid #EAECEF'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <CalendarTodayIcon sx={{ color: statusColor.main, mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            Data
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {formatDate(consultationData.consultationDate)}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        border: '1px solid #EAECEF'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <AccessTimeIcon sx={{ color: statusColor.main, mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            Horário
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {consultationData.consultationTime || consultationData.horaInicio}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        border: '1px solid #EAECEF'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TimerIcon sx={{ color: statusColor.main, mr: 1, fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            Duração
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {formatDuration(consultationData.consultationDuration)}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        border: '1px solid #EAECEF'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        {tipoIcon && React.cloneElement(tipoIcon, {
                                            sx: { color: tipoColor.main, mr: 1, fontSize: 18 }
                                        })}
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            Tipo
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {consultationData.consultationType || 'Presencial'}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Informações do Paciente */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: theme.palette.grey[800],
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                Informações do Paciente
                            </Typography>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    backgroundColor: 'white',
                                    border: '1px solid #EAECEF'
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <Typography>Carregando dados do paciente...</Typography>
                                    </Box>
                                ) : patientData ? (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar
                                                    src={patientData.photoURL || patientData.fotoPerfil}
                                                    alt={getPatientName()}
                                                    sx={{ width: 64, height: 64, mr: 2 }}
                                                >
                                                    {getPatientName().charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {getPatientName()}
                                                    </Typography>
                                                    {patientData.birthDate && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(patientData.birthDate)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {(patientData.patientPhone || patientData.phone) && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PhoneIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2">
                                                            {patientData.patientPhone || patientData.phone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {(patientData.patientEmail || patientData.email) && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <EmailIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                            {patientData.patientEmail || patientData.email}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <Typography>Dados do paciente não disponíveis</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        {/* Motivo da Consulta */}
                        {consultationData.reasonForVisit && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{
                                    fontWeight: 600,
                                    color: theme.palette.grey[800],
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <AssignmentIcon sx={{ mr: 1 }} />
                                    Motivo da Consulta
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #EAECEF'
                                    }}
                                >
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
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
                            <WarningIcon sx={{ color: 'error.main', mr: 1.5 }} />
                            <Typography sx={{ color: 'error.main', fontWeight: 500, mr: 'auto' }}>
                                Tem certeza que deseja excluir esta consulta?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleDeleteCancel}
                                sx={{ mr: 1 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteConfirm}
                            >
                                Excluir
                            </Button>
                        </Box>
                    ) : statusChangeConfirm ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WarningIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                            <Typography sx={{ color: 'primary.main', fontWeight: 500, mr: 'auto' }}>
                                Alterar status da consulta para "{statusChangeConfirm}"?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleStatusChangeCancel}
                                sx={{ mr: 1 }}
                            >
                                Não
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleStatusChangeConfirm}
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
                                    borderColor: theme.palette.error.main,
                                    color: theme.palette.error.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.04),
                                        borderColor: theme.palette.error.dark
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
                                                onClick={() => handleStatusChangeClick('Em Andamento')}
                                                sx={{ mr: 1 }}
                                            >
                                                Iniciar Consulta
                                            </Button>
                                        )}

                                        {consultationData.status !== 'Cancelada' && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleStatusChangeClick('Cancelada')}
                                                sx={{ mr: 1 }}
                                            >
                                                Cancelar
                                            </Button>
                                        )}

                                        {(consultationData.status === 'Agendada' || consultationData.status === 'Em Andamento') && (
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                onClick={() => handleStatusChangeClick('Concluída')}
                                                sx={{ mr: 2 }}
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
                                        '&:hover': {
                                            backgroundColor: statusColor.dark
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