"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Button,
    Skeleton,
    useTheme,
    alpha,
    Grid,
    ButtonGroup,
    Badge,
    Tooltip,
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';

import {
    Search as SearchIcon,
    ChevronRight as ChevronRightIcon,
    FilterList as FilterListIcon,
    Female as FemaleIcon,
    Male as MaleIcon,
    VideoCall as VideoCallIcon,
    Close as CloseIcon,
    CalendarToday as CalendarTodayIcon,
    EventNote as EventNoteIcon,
    EventAvailable as EventAvailableIcon,
    Person as PersonIcon,
    Event as EventIcon,
    ScheduleSend as ScheduleSendIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

import { format, isToday, isPast, isValid, parse, differenceInYears, formatDistance, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";

// Constantes
const VIEW_OPTIONS = {
    ALL: 'all',
    TODAY: 'today',
    UPCOMING: 'upcoming'
};

const STATUS_OPTIONS = [
    { label: 'Pendente', value: 'pendente', icon: <EventNoteIcon fontSize="small" />, color: '#757575' },
    { label: 'Reagendado', value: 'reagendado', icon: <ScheduleSendIcon fontSize="small" />, color: '#9C27B0' },
    { label: 'Primeira Consulta', value: 'primeira consulta', icon: <AddCircleOutlineIcon fontSize="small" />, color: '#2196F3' },
    { label: 'Reag. Pendente', value: 'reag. pendente', icon: <ScheduleSendIcon fontSize="small" />, color: '#FF9800' },
];

// Componente StatusChip otimizado e memorizado
const StatusChip = React.memo(({ status, onClick, size = 'small' }) => {
    // Obter configurações de cor e estilo com base no status
    const getStatusConfig = useCallback((status) => {
        switch (status.toLowerCase()) {
            case 'pendente':
                return { bgColor: '#F5F5F5', color: '#757575', icon: <EventNoteIcon fontSize="inherit" /> };
            case 'reagendado':
                return { bgColor: '#F3E5F5', color: '#9C27B0', icon: <ScheduleSendIcon fontSize="inherit" /> };
            case 'primeira consulta':
                return { bgColor: '#E3F2FD', color: '#2196F3', icon: <AddCircleOutlineIcon fontSize="inherit" /> };
            case 'reag. pendente':
                return { bgColor: '#FFF8E1', color: '#FF9800', icon: <ScheduleSendIcon fontSize="inherit" /> };
            default:
                return { bgColor: '#F5F5F5', color: '#757575', icon: <EventNoteIcon fontSize="inherit" /> };
        }
    }, []);

    const config = getStatusConfig(status);

    return (
        <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size={size}
            icon={size === 'small' ? null :
                <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                    {config.icon}
                </Box>
            }
            onClick={onClick}
            sx={{
                borderRadius: size === 'small' ? '12px' : '16px',
                fontSize: size === 'small' ? '0.75rem' : '0.8rem',
                fontWeight: 500,
                backgroundColor: config.bgColor,
                color: config.color,
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                    backgroundColor: alpha(config.bgColor, 0.8)
                } : {},
                transition: 'all 0.2s ease',
                height: size === 'small' ? 24 : 32,
                px: size === 'small' ? 1 : 1.5,
                '& .MuiChip-icon': {
                    color: 'inherit',
                    marginLeft: size === 'small' ? 0.3 : 0.5,
                    fontSize: size === 'small' ? '0.7rem' : '0.9rem'
                }
            }}
        />
    );
});

// Componente de Card Métrico
const MetricCard = React.memo(({ icon, title, value, active, onClick, color, loading }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                p: 1.5,
                borderRadius: '16px',
                border: `1px solid ${active ? color.main : alpha(theme.palette.primary.main, 0.2)}`,
                backgroundColor: active ? alpha(color.main, 0.05) : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{
                    bgcolor: active ? color.main : alpha(color.main, 0.1),
                    color: active ? 'white' : color.main,
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    transition: 'all 0.2s ease',
                }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="caption" color={active ? color.main : "text.secondary"} sx={{ fontWeight: active ? 600 : 400 }}>
                        {title}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color={active ? color.main : "text.primary"}>
                        {loading ? <Skeleton width={30} /> : value}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
});

// Componente para cabeçalho de coluna ordenável
const SortableHeaderCell = React.memo(({ label, field, sortConfig, onSortChange }) => {
    const theme = useTheme();
    const isActive = sortConfig.field === field;

    return (
        <TableCell
            onClick={() => onSortChange(field)}
            sx={{
                cursor: 'pointer',
                backgroundColor: '#F9FAFB',
                color: '#647787',
                fontWeight: 600,
                fontSize: '0.75rem',
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" fontWeight={600}>{label}</Typography>
                {isActive && (
                    <Box sx={{ opacity: 0.7 }}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </Box>
                )}
            </Box>
        </TableCell>
    );
});

// Componente principal
const PatientsListCard = ({ patients: initialPatients, consultations, loading, onPatientClick }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMedium = useMediaQuery(theme.breakpoints.down('md'));
    const { user, getEffectiveUserId } = useAuth();

    // Estados básicos
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [viewOption, setViewOption] = useState(VIEW_OPTIONS.ALL);
    const [sortConfig, setSortConfig] = useState({
        field: 'patientName',
        direction: 'asc'
    });

    // Estados para dialog de status
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
    const [statusUpdateError, setStatusUpdateError] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);

    // Estado para consultas (caso não sejam fornecidas como props)
    const [localConsultations, setLocalConsultations] = useState([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    // Métricas para o card
    const [metrics, setMetrics] = useState({
        totalPatients: 0,
        todayConsultations: 0,
        upcomingConsultations: 0
    });

    // Função auxiliar para extrair valores de data
    const getDateValue = useCallback((obj, field) => {
        if (!obj || !obj[field]) return null;

        if (obj[field] instanceof Date) {
            return obj[field];
        }

        if (typeof obj[field].toDate === 'function') {
            return obj[field].toDate();
        }

        if (typeof obj[field] === 'string') {
            try {
                const parsedDate = new Date(obj[field]);
                if (isValid(parsedDate)) {
                    return parsedDate;
                }

                // Tentar formato específico
                const parts = obj[field].split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } catch (e) {
                console.warn(`Erro ao converter data: ${obj[field]}`);
            }
        }

        return null;
    }, []);

    // Formatação segura de datas
    const safeFormatDate = useCallback((date, formatString, defaultValue = '-') => {
        try {
            if (!date) return defaultValue;
            if (date instanceof Date) {
                if (isNaN(date.getTime())) return defaultValue;
                return format(date, formatString, { locale: ptBR });
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) return defaultValue;
            return format(parsedDate, formatString, { locale: ptBR });
        } catch (error) {
            console.warn('Erro ao formatar data:', error, date);
            return defaultValue;
        }
    }, []);

    // Determinar o status do paciente
    const determinePatientStatus = useCallback((patient) => {
        if (!patient) return 'pendente';

        // Verificar statusList primeiro
        if (patient.statusList && Array.isArray(patient.statusList) && patient.statusList.length > 0) {
            return patient.statusList[0];
        }

        // Verificar por campos de consulta
        const lastConsultDate = getDateValue(patient, 'lastConsultationDate');
        const nextConsultDate = getDateValue(patient, 'nextConsultationDate');

        if (!lastConsultDate && nextConsultDate) {
            return 'primeira consulta';
        } else if (patient.consultationRescheduled) {
            return patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
        }

        return 'pendente';
    }, [getDateValue]);

    // Carregar consultas se não foram fornecidas como props
    useEffect(() => {
        const fetchConsultations = async () => {
            if (!user?.uid) return;
            if (consultations && consultations.length > 0) {
                setLocalConsultations(consultations);
                return;
            }

            setLoadingConsultations(true);
            try {
                const consultationsData = await FirebaseService.listAllConsultations(getEffectiveUserId());
                setLocalConsultations(consultationsData);
            } catch (error) {
                console.error("Erro ao carregar consultas:", error);
            } finally {
                setLoadingConsultations(false);
            }
        };

        fetchConsultations();
    }, [user, consultations]);

    // Mapeamento de pacientes e suas consultas
    const patientConsultations = useMemo(() => {
        const consultationsMap = {};
        const allConsultations = consultations || localConsultations;

        if (!patients || !allConsultations) return {};

        // Agrupar consultas por paciente
        allConsultations.forEach(consultation => {
            const patientId = consultation.patientId;
            if (!consultationsMap[patientId]) {
                consultationsMap[patientId] = [];
            }
            consultationsMap[patientId].push(consultation);
        });

        return consultationsMap;
    }, [patients, consultations, localConsultations]);

    // Atualizar métricas
    useEffect(() => {
        if (!patients) return;
        const allConsultations = consultations || localConsultations;
        if (!allConsultations) return;

        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);

        // Contar consultas de hoje
        const todayConsultations = allConsultations.filter(consultation => {
            const consultDate = getDateValue(consultation, 'consultationDate');
            if (!consultDate) return false;

            const consultDay = startOfDay(consultDate);
            return consultDay.getTime() === today.getTime();
        }).length;

        // Contar próximas consultas (futuras, excluindo hoje)
        const upcomingConsultations = allConsultations.filter(consultation => {
            const consultDate = getDateValue(consultation, 'consultationDate');
            if (!consultDate) return false;

            return isAfter(consultDate, tomorrow);
        }).length;

        setMetrics({
            totalPatients: patients.length,
            todayConsultations,
            upcomingConsultations
        });
    }, [patients, consultations, localConsultations, getDateValue]);

    // Obter próxima consulta para um paciente
    const getPatientNextConsult = useCallback((patientId) => {
        const patientConsultsList = patientConsultations[patientId] || [];
        const now = new Date();

        // Filtrar consultas futuras, incluindo consultas de hoje
        const futureConsults = patientConsultsList
            .filter(consult => {
                const consultDate = getDateValue(consult, 'consultationDate');
                // Incluir consultas que são hoje ou no futuro
                return consultDate && (isToday(consultDate) || isAfter(consultDate, now));
            })
            .sort((a, b) => {
                const dateA = getDateValue(a, 'consultationDate');
                const dateB = getDateValue(b, 'consultationDate');
                return dateA - dateB;
            });

        return futureConsults.length > 0 ? futureConsults[0] : null;
    }, [patientConsultations, getDateValue]);

    // Obter última consulta para um paciente
    const getPatientLastConsult = useCallback((patientId) => {
        const patientConsultsList = patientConsultations[patientId] || [];
        const now = new Date();

        // Filtrar consultas passadas
        const pastConsults = patientConsultsList
            .filter(consult => {
                const consultDate = getDateValue(consult, 'consultationDate');
                return consultDate && isBefore(consultDate, now);
            })
            .sort((a, b) => {
                const dateA = getDateValue(a, 'consultationDate');
                const dateB = getDateValue(b, 'consultationDate');
                return dateB - dateA; // Ordenação decrescente
            });

        return pastConsults.length > 0 ? pastConsults[0] : null;
    }, [patientConsultations, getDateValue]);

    // Sincronizar estado local de pacientes com props
    useEffect(() => {
        if (initialPatients) {
            setPatients(initialPatients);
        }
    }, [initialPatients]);

    // Filtragem e ordenação dos pacientes
    useEffect(() => {
        if (!patients || patients.length === 0) {
            setFilteredPatients([]);
            return;
        }

        // Filtrar por consultas de hoje ou próximas
        let filtered = [...patients];
        const allConsultations = consultations || localConsultations;

        if (viewOption === VIEW_OPTIONS.TODAY) {
            const today = startOfDay(new Date());

            filtered = filtered.filter(patient => {
                // Verificar consultas do paciente para hoje
                const patientConsults = patientConsultations[patient.id] || [];
                return patientConsults.some(consult => {
                    const consultDate = getDateValue(consult, 'consultationDate');
                    if (!consultDate) return false;

                    const consultDay = startOfDay(consultDate);
                    return consultDay.getTime() === today.getTime();
                });
            });
        } else if (viewOption === VIEW_OPTIONS.UPCOMING) {
            const tomorrow = addDays(startOfDay(new Date()), 1);

            filtered = filtered.filter(patient => {
                // Verificar consultas futuras do paciente
                const patientConsults = patientConsultations[patient.id] || [];
                return patientConsults.some(consult => {
                    const consultDate = getDateValue(consult, 'consultationDate');
                    return consultDate && isAfter(consultDate, tomorrow);
                });
            });
        }

        // Aplicar pesquisa
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(patient =>
                (patient.patientName || '').toLowerCase().includes(searchLower) ||
                (patient.patientEmail || '').toLowerCase().includes(searchLower) ||
                (patient.patientCPF || '').includes(searchTerm)
            );
        }

        // Aplicar ordenação
        filtered = [...filtered].sort((a, b) => {
            let aValue, bValue;

            // Tratamento especial para campos de consulta
            if (sortConfig.field === 'lastConsultationDate') {
                const lastConsultA = getPatientLastConsult(a.id);
                const lastConsultB = getPatientLastConsult(b.id);

                aValue = lastConsultA ? getDateValue(lastConsultA, 'consultationDate') : null;
                bValue = lastConsultB ? getDateValue(lastConsultB, 'consultationDate') : null;
            } else if (sortConfig.field === 'nextConsultationDate') {
                const nextConsultA = getPatientNextConsult(a.id);
                const nextConsultB = getPatientNextConsult(b.id);

                aValue = nextConsultA ? getDateValue(nextConsultA, 'consultationDate') : null;
                bValue = nextConsultB ? getDateValue(nextConsultB, 'consultationDate') : null;
            } else {
                aValue = a[sortConfig.field];
                bValue = b[sortConfig.field];
            }

            // Ordenação para datas
            if (sortConfig.field === 'lastConsultationDate' || sortConfig.field === 'nextConsultationDate') {
                if (!aValue && !bValue) return 0;
                if (!aValue) return 1;
                if (!bValue) return -1;

                return sortConfig.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            // Ordenação de texto
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Ordenação numérica
            if (aValue === undefined || aValue === null) aValue = 0;
            if (bValue === undefined || bValue === null) bValue = 0;

            return sortConfig.direction === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        });

        setFilteredPatients(filtered);
    }, [
        patients,
        consultations,
        localConsultations,
        searchTerm,
        sortConfig,
        viewOption,
        getDateValue,
        patientConsultations,
        getPatientNextConsult,
        getPatientLastConsult
    ]);

    // Carregar histórico de status
    const loadStatusHistory = useCallback(async (patientId) => {
        if (!patientId || !user?.uid) return [];

        setStatusHistoryLoading(true);

        try {
            const history = await FirebaseService.getPatientStatusHistory(user.uid, patientId);
            setStatusHistory(history || []);
            return history;
        } catch (error) {
            console.error("Erro ao carregar histórico de status:", error);
            setStatusHistory([]);
            return [];
        } finally {
            setStatusHistoryLoading(false);
        }
    }, [user]);

    // Manipuladores de eventos
    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    const handleViewOptionChange = useCallback((option) => {
        setViewOption(option);
    }, []);

    const handleSortChange = useCallback((field) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const handlePatientClick = useCallback((patientId) => {
        if (onPatientClick) {
            onPatientClick(patientId);
        }
    }, [onPatientClick]);

    const handleStatusClick = useCallback((patient, currentStatus, event) => {
        if (event) {
            event.stopPropagation();
        }

        // Determinar o status atual
        let statusToUse = currentStatus;

        if (patient.statusList && patient.statusList.length > 0) {
            statusToUse = patient.statusList[0];
        } else if (!statusToUse) {
            statusToUse = determinePatientStatus(patient);
        }

        setSelectedPatient(patient);
        setNewStatus(statusToUse);

        // Carregar histórico e abrir dialog
        loadStatusHistory(patient.id).then(() => {
            setStatusDialogOpen(true);
        });
    }, [determinePatientStatus, loadStatusHistory]);

    const handleStatusSave = useCallback(async () => {
        if (!selectedPatient || !user?.uid) return;

        setStatusUpdateLoading(true);
        setStatusUpdateError(null);
        setStatusUpdateSuccess(false);

        try {
            await FirebaseService.updatePatientStatus(user.uid, selectedPatient.id, [newStatus]);

            // Atualizar o estado local dos pacientes para refletir a mudança
            setPatients(prevPatients =>
                prevPatients.map(patient =>
                    patient.id === selectedPatient.id
                        ? { ...patient, statusList: [newStatus] }
                        : patient
                )
            );

            // Adicionar ao histórico
            await FirebaseService.addPatientStatusHistory(
                user.uid,
                selectedPatient.id,
                newStatus,
                ''
            );

            setStatusUpdateSuccess(true);

            // Fechar dialog após um breve delay
            setTimeout(() => {
                setStatusDialogOpen(false);

                // Limpar estados
                setTimeout(() => {
                    setStatusUpdateSuccess(false);
                    setSelectedPatient(null);
                }, 300);
            }, 1500);
        } catch (error) {
            console.error("Erro ao atualizar status do paciente:", error);
            setStatusUpdateError("Não foi possível atualizar o status. Tente novamente.");
        } finally {
            setStatusUpdateLoading(false);
        }
    }, [selectedPatient, newStatus, user]);

    const handleCloseDialog = useCallback(() => {
        if (statusUpdateLoading) return;

        setStatusDialogOpen(false);

        // Limpar estados
        setTimeout(() => {
            setStatusUpdateError(null);
            setStatusUpdateSuccess(false);
            setSelectedPatient(null);
        }, 300);
    }, [statusUpdateLoading]);

    // Renderização dos esqueletos durante carregamento
    const renderSkeletonRows = useCallback(() => {
        return Array(5).fill().map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Box>
                            <Skeleton variant="text" width={120} />
                            <Skeleton variant="text" width={80} height={12} />
                        </Box>
                    </Box>
                </TableCell>
                <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={30} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 12 }} /></TableCell>
                <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
            </TableRow>
        ));
    }, []);

    // Cores para os diferentes estados
    const viewStateColors = useMemo(() => ({
        [VIEW_OPTIONS.ALL]: {
            main: theme.palette.primary.main,
            light: alpha(theme.palette.primary.main, 0.1)
        },
        [VIEW_OPTIONS.TODAY]: {
            main: theme.palette.error.main,
            light: alpha(theme.palette.error.main, 0.1)
        },
        [VIEW_OPTIONS.UPCOMING]: {
            main: theme.palette.success.main,
            light: alpha(theme.palette.success.main, 0.1)
        }
    }), [theme]);

    // Determinar a cor do card de conteúdo baseado no estado atual
    const getContentCardStyle = useCallback(() => {
        return {
            backgroundColor: alpha(viewStateColors[viewOption].main, 0.03),
            borderLeftWidth: 3,
            borderLeftStyle: 'solid',
            borderLeftColor: viewStateColors[viewOption].main,
            transition: 'all 0.3s ease'
        };
    }, [viewOption, viewStateColors]);

    const isLoadingData = loading || loadingConsultations;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '24px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: '#fff',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)'
            }}
        >
            <CardContent
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    '&:last-child': { pb: 0 },
                }}
            >
                {/* Cabeçalho com métricas e opções */}
                <Box sx={{ p: 3, backgroundColor: alpha(viewStateColors[viewOption].main, 0.05) }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} color={viewStateColors[viewOption].main}>
                            Pacientes
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <ButtonGroup
                                variant="outlined"
                                aria-label="Filtro de visualização"
                                sx={{
                                    '& .MuiButton-root': {
                                        borderRadius: 0,
                                        borderColor: viewStateColors[viewOption].main,
                                        '&:first-of-type': {
                                            borderTopLeftRadius: '50px',
                                            borderBottomLeftRadius: '50px',
                                        },
                                        '&:last-of-type': {
                                            borderTopRightRadius: '50px',
                                            borderBottomRightRadius: '50px',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: viewStateColors[viewOption].main,
                                            color: 'white'
                                        }
                                    }
                                }}
                            >
                                <Button
                                    onClick={() => handleViewOptionChange(VIEW_OPTIONS.ALL)}
                                    variant={viewOption === VIEW_OPTIONS.ALL ? 'contained' : 'outlined'}
                                    color={viewOption === VIEW_OPTIONS.ALL ? 'primary' : 'inherit'}
                                    size="small"
                                >
                                    Todos
                                </Button>
                                <Button
                                    onClick={() => handleViewOptionChange(VIEW_OPTIONS.TODAY)}
                                    variant={viewOption === VIEW_OPTIONS.TODAY ? 'contained' : 'outlined'}
                                    color={viewOption === VIEW_OPTIONS.TODAY ? 'error' : 'inherit'}
                                    size="small"
                                >
                                    <Badge
                                        badgeContent={metrics.todayConsultations}
                                        color="error"
                                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                                    >
                                        Hoje
                                    </Badge>
                                </Button>
                                <Button
                                    onClick={() => handleViewOptionChange(VIEW_OPTIONS.UPCOMING)}
                                    variant={viewOption === VIEW_OPTIONS.UPCOMING ? 'contained' : 'outlined'}
                                    color={viewOption === VIEW_OPTIONS.UPCOMING ? 'success' : 'inherit'}
                                    size="small"
                                >
                                    Próximos
                                </Button>
                            </ButtonGroup>
                        </Box>
                    </Box>

                    <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 2 }}>
                        {/* Cards de métricas clicáveis */}
                        <Grid item xs={isMobile ? 12 : 4} sm={4}>
                            <MetricCard
                                icon={<PersonIcon fontSize="small" />}
                                title="Total de Pacientes"
                                value={metrics.totalPatients}
                                active={viewOption === VIEW_OPTIONS.ALL}
                                onClick={() => handleViewOptionChange(VIEW_OPTIONS.ALL)}
                                color={{
                                    main: theme.palette.primary.main,
                                    light: alpha(theme.palette.primary.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                        <Grid item xs={isMobile ? 12 : 4} sm={4}>
                            <MetricCard
                                icon={<EventIcon fontSize="small" />}
                                title="Consultas Hoje"
                                value={metrics.todayConsultations}
                                active={viewOption === VIEW_OPTIONS.TODAY}
                                onClick={() => handleViewOptionChange(VIEW_OPTIONS.TODAY)}
                                color={{
                                    main: theme.palette.error.main,
                                    light: alpha(theme.palette.error.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                        <Grid item xs={isMobile ? 12 : 4} sm={4}>
                            <MetricCard
                                icon={<EventAvailableIcon fontSize="small" />}
                                title="Próximas"
                                value={metrics.upcomingConsultations}
                                active={viewOption === VIEW_OPTIONS.UPCOMING}
                                onClick={() => handleViewOptionChange(VIEW_OPTIONS.UPCOMING)}
                                color={{
                                    main: theme.palette.success.main,
                                    light: alpha(theme.palette.success.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                    </Grid>

                    {/* Campo de busca */}
                    <TextField
                        placeholder="Buscar pacientes por nome, e-mail ou CPF..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        variant="outlined"
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '50px',
                                backgroundColor: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: viewStateColors[viewOption].main,
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color={searchTerm ? viewStateColors[viewOption].main : 'inherit'} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Container flexível para a tabela com borda colorida baseada no viewOptions */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    ...getContentCardStyle()
                }}>
                    <TableContainer
                        sx={{
                            height: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: alpha(viewStateColors[viewOption].main, 0.2),
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: alpha(viewStateColors[viewOption].main, 0.05),
                            }
                        }}
                    >
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <SortableHeaderCell
                                        label="Paciente"
                                        field="patientName"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <SortableHeaderCell
                                        label="Gênero"
                                        field="gender"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <SortableHeaderCell
                                        label="Idade"
                                        field="patientAge"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <SortableHeaderCell
                                        label="Última Consulta"
                                        field="lastConsultationDate"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <SortableHeaderCell
                                        label="Próxima Consulta"
                                        field="nextConsultationDate"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <SortableHeaderCell
                                        label="Status"
                                        field="status"
                                        sortConfig={sortConfig}
                                        onSortChange={handleSortChange}
                                    />
                                    <TableCell align="right" sx={{
                                        backgroundColor: '#F9FAFB',
                                        color: '#647787',
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                    }}>
                                        Ações
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoadingData ? (
                                    renderSkeletonRows()
                                ) : filteredPatients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box
                                                    component="img"
                                                    src="/newpaciente.svg"
                                                    alt="Nenhum paciente encontrado"
                                                    sx={{
                                                        height: 120,
                                                        mb: 2,
                                                        opacity: 0.6
                                                    }}
                                                />
                                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                                    Nenhum paciente encontrado
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                                                    {viewOption === VIEW_OPTIONS.ALL ? (
                                                        'Tente ajustar seus filtros ou termos de busca para encontrar pacientes.'
                                                    ) : viewOption === VIEW_OPTIONS.TODAY ? (
                                                        'Não há consultas agendadas para hoje.'
                                                    ) : (
                                                        'Não há consultas futuras agendadas.'
                                                    )}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.slice(0, 6).map((patient) => {
                                        const patientName = patient.patientName || 'Sem nome';
                                        const gender = patient.gender || 'Não informado';
                                        let age = '-';

                                        // Cálculo da idade a partir do campo birthDate (formato "dd/MM/yyyy")
                                        if (patient.birthDate) {
                                            try {
                                                const parsedBirthDate = parse(patient.birthDate, 'dd/MM/yyyy', new Date());
                                                if (isValid(parsedBirthDate)) {
                                                    age = differenceInYears(new Date(), parsedBirthDate);
                                                }
                                            } catch (e) {
                                                console.warn(`Erro ao converter data: ${patient.birthDate}`);
                                            }
                                        }

                                        const lastConsult = getPatientLastConsult(patient.id);
                                        const lastConsultDate = lastConsult ?
                                            getDateValue(lastConsult, 'consultationDate') :
                                            null;

                                        const nextConsult = getPatientNextConsult(patient.id);
                                        const nextConsultDate = nextConsult ?
                                            getDateValue(nextConsult, 'consultationDate') :
                                            null;

                                        const status = determinePatientStatus(patient);
                                        const isTelemedicine = patient.consultationType === 'Telemedicina' ||
                                            (nextConsult && nextConsult.consultationType === 'Telemedicina');

                                        return (
                                            <TableRow
                                                key={patient.id}
                                                hover
                                                onClick={() => handlePatientClick(patient.id)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                                    },
                                                    '& td': {
                                                        padding: '16px',
                                                        borderBottom: `1px solid ${theme.palette.divider}`
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar
                                                            src={patient.patientPhotoUrl}
                                                            alt={patientName}
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                mr: 2,
                                                                fontSize: '1rem',
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)'
                                                            }}
                                                        >
                                                            {patientName.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {patientName}
                                                                </Typography>
                                                                {isTelemedicine && (
                                                                    <Tooltip title="Telemedicina">
                                                                        <VideoCallIcon
                                                                            fontSize="small"
                                                                            sx={{
                                                                                ml: 1,
                                                                                color: theme.palette.info.main,
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {patient.patientEmail || 'Sem e-mail'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    {gender.toLowerCase() === 'masculino' ? (
                                                        <Tooltip title="Masculino">
                                                            <MaleIcon sx={{ color: theme.palette.info.main }} />
                                                        </Tooltip>
                                                    ) : gender.toLowerCase() === 'feminino' ? (
                                                        <Tooltip title="Feminino">
                                                            <FemaleIcon sx={{ color: '#E91E63' }} />
                                                        </Tooltip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">{age}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    {lastConsultDate && isPast(lastConsultDate) ? (
                                                        <>
                                                            <Typography variant="body2">
                                                                {safeFormatDate(lastConsultDate, 'dd/MM/yyyy')}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDistance(lastConsultDate, new Date(), { addSuffix: true, locale: ptBR })}
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {nextConsultDate ? (
                                                        <Box>
                                                            <Typography
                                                                variant="body2"
                                                                color={isToday(nextConsultDate) ? 'error.main' : 'text.primary'}
                                                                fontWeight={isToday(nextConsultDate) ? 600 : 400}
                                                            >
                                                                {safeFormatDate(nextConsultDate, 'dd/MM/yyyy')}
                                                            </Typography>
                                                            {isToday(nextConsultDate) && (
                                                                <Typography variant="caption" color="error.main" fontWeight={500}>
                                                                    Hoje
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        status={status}
                                                        onClick={(e) => handleStatusClick(patient, status, e)}
                                                    />
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Tooltip title="Ver perfil do paciente">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePatientClick(patient.id);
                                                                }}
                                                                sx={{
                                                                    color: theme.palette.primary.main,
                                                                    '&:hover': {
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                                    }
                                                                }}
                                                            >
                                                                <ChevronRightIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Dialog para mudança de status */}
                <Dialog
                    open={statusDialogOpen}
                    onClose={handleCloseDialog}
                    PaperProps={{
                        sx: {
                            borderRadius: '20px',
                            minWidth: '400px',
                            maxWidth: '90vw'
                        }
                    }}
                    disableEscapeKeyDown={statusUpdateLoading}
                >
                    <DialogTitle sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        pb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="h6">Alterar Status do Paciente</Typography>
                        </Box>
                        <IconButton
                            edge="end"
                            onClick={handleCloseDialog}
                            disabled={statusUpdateLoading}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ pt: 3, pb: 1 }}>
                        {selectedPatient && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Paciente
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar
                                        src={selectedPatient.patientPhotoUrl}
                                        alt={selectedPatient.patientName || "Paciente"}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            mr: 2,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main
                                        }}
                                    >
                                        {selectedPatient.patientName ? selectedPatient.patientName.charAt(0) : "P"}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={500}>
                                            {selectedPatient.patientName || "Paciente sem nome"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedPatient.patientEmail || "Sem e-mail"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                            Selecione o novo status
                        </Typography>

                        {/* Botões de status */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            {STATUS_OPTIONS.map(option => (
                                <Button
                                    key={option.value}
                                    variant={newStatus === option.value ? "contained" : "outlined"}
                                    onClick={() => !statusUpdateLoading && setNewStatus(option.value)}
                                    disabled={statusUpdateLoading}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        py: 1.5,
                                        px: 2,
                                        borderRadius: '12px',
                                        borderColor: newStatus === option.value
                                            ? 'transparent'
                                            : theme.palette.divider,
                                        backgroundColor: newStatus === option.value
                                            ? theme.palette.primary.main
                                            : 'transparent',
                                        color: newStatus === option.value
                                            ? 'white'
                                            : 'text.primary',
                                        '&:hover': {
                                            backgroundColor: newStatus === option.value
                                                ? theme.palette.primary.dark
                                                : alpha(theme.palette.primary.main, 0.04),
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                mr: 2,
                                                backgroundColor: option.color
                                            }}
                                        />
                                        {option.label}
                                        {option.icon && (
                                            <Box sx={{ ml: 'auto', opacity: 0.7 }}>
                                                {option.icon}
                                            </Box>
                                        )}
                                    </Box>
                                </Button>
                            ))}
                        </Box>

                        {/* Histórico de status com estado de carregamento */}
                        {(statusHistory.length > 0 || statusHistoryLoading) && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Histórico de Status
                                </Typography>
                                {statusHistoryLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : (
                                    <Box sx={{ maxHeight: '150px', overflow: 'auto' }}>
                                        {statusHistory.map((item, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                                <TimelineIcon sx={{ fontSize: '1rem', mr: 1, mt: 0.5, color: 'text.secondary' }} />
                                                <Box>
                                                    <Typography variant="body2">
                                                        {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Desconhecido'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {safeFormatDate(item.timestamp, 'dd/MM/yyyy HH:mm')} - {item.updatedBy || 'Sistema'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Alertas de feedback */}
                        {statusUpdateError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {statusUpdateError}
                            </Alert>
                        )}

                        {statusUpdateSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Status atualizado com sucesso!
                            </Alert>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Button
                            onClick={handleCloseDialog}
                            variant="outlined"
                            disabled={statusUpdateLoading}
                            sx={{ borderRadius: '50px' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleStatusSave}
                            variant="contained"
                            disabled={statusUpdateLoading}
                            sx={{
                                borderRadius: '50px',
                                position: 'relative',
                                minWidth: '100px'
                            }}
                        >
                            {statusUpdateLoading ? (
                                <CircularProgress size={24} sx={{ color: 'white' }} />
                            ) : "Salvar"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default React.memo(PatientsListCard);