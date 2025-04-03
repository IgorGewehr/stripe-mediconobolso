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
    Popover,
    Grid,
    FormControl,
    Select,
    MenuItem,
    useMediaQuery,
    Tooltip,
    ButtonGroup,
    Divider,
    Badge, Dialog, InputLabel, DialogContent, DialogTitle, DialogActions
} from '@mui/material';

import {
    Search as SearchIcon,
    ChevronRight as ChevronRightIcon,
    FilterList as FilterListIcon,
    Menu as MenuIcon,
    Female as FemaleIcon,
    Male as MaleIcon,
    VideoCall as VideoCallIcon,
    Close as CloseIcon,
    CalendarToday as CalendarTodayIcon,
    Event as EventIcon,
    EventAvailable as EventAvailableIcon,
    FilterAlt as FilterAltIcon,
    MoreVert as MoreVertIcon,
    ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';

import { format, isToday, isPast, parseISO, isValid, parse, differenceInYears, formatDistance, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";
import PersonIcon from "@mui/icons-material/Person";

// Constantes
const PATIENT_CONDITIONS = [
    { label: 'Diabetes', value: 'diabetes', color: 'diabetes' },
    { label: 'Hipertensão', value: 'hipertensao', color: 'hipertensao' },
    { label: 'Fumante', value: 'fumante', color: 'fumante' },
    { label: 'Internado', value: 'internado', color: 'internado' },
    { label: 'Idoso', value: 'idoso', color: 'idoso' },
    { label: 'Obeso', value: 'obeso', color: 'obeso' },
];

const STATUS_OPTIONS = [
    { label: 'Todos os status', value: '' },
    { label: 'Pendente', value: 'pendente' },
    { label: 'Reagendado', value: 'reagendado' },
    { label: 'Primeira Consulta', value: 'primeira consulta' },
    { label: 'Reag. Pendente', value: 'reag. pendente' },
];

// Componente estilizado para cabeçalhos de coluna ordenáveis
const SortableHeaderCell = ({ label, field, sortConfig, onSortChange }) => {
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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        opacity: isActive ? 1 : 0.4,
                        transition: 'all 0.2s ease',
                    }}
                >
                    <ArrowDropDownIcon
                        fontSize="small"
                        sx={{
                            transform: isActive && sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }}
                    />
                </Box>
            </Box>
        </TableCell>
    );
};

const MetricCard = ({ icon, title, value, active, onClick, color, loading }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                p: 1.5,
                borderRadius: '16px',
                border: `1px solid ${active
                    ? color.main
                    : alpha(theme.palette.primary.main, 0.2)
                }`,
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
                    bgcolor: active
                        ? color.main
                        : alpha(color.main, 0.1),
                    color: active
                        ? 'white'
                        : color.main,
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
};

// Estilos para filtros
const FilterChip = ({ label, colorscheme, onDelete }) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        switch (colorscheme) {
            case 'diabetes': return '#FFF9C4';
            case 'fumante': return '#E0F7FA';
            case 'internado': return '#E8EAF6';
            case 'idoso': return '#F3E5F5';
            case 'obeso': return '#FCE4EC';
            case 'hipertensao': return '#E8F5E9';
            case 'genero': return '#E3F2FD';
            case 'consultas': return '#E1F5FE';
            case 'primeira-consulta': return '#E8F5E9';
            default: return '#F5F5F5';
        }
    };

    return (
        <Chip
            label={label}
            onDelete={onDelete}
            deleteIcon={<CloseIcon fontSize="small" />}
            sx={{
                margin: '0 4px',
                backgroundColor: getBackgroundColor(),
                color: '#111E5A',
                borderRadius: '50px',
                fontWeight: 500,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                '& .MuiChip-deleteIcon': {
                    color: '#111E5A',
                    '&:hover': {
                        color: alpha('#111E5A', 0.7),
                    },
                },
            }}
        />
    );
};

const ConditionChip = ({ label, colorscheme, onClick, selected }) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        switch (colorscheme) {
            case 'diabetes': return '#FFF9C4';
            case 'fumante': return '#E0F7FA';
            case 'internado': return '#E8EAF6';
            case 'idoso': return '#F3E5F5';
            case 'obeso': return '#FCE4EC';
            case 'hipertensao': return '#E8F5E9';
            default: return '#F5F5F5';
        }
    };

    return (
        <Chip
            label={label}
            onClick={onClick}
            onDelete={selected ? onClick : undefined}
            deleteIcon={selected ? <CloseIcon fontSize="small" /> : undefined}
            sx={{
                margin: '4px',
                backgroundColor: getBackgroundColor(),
                color: '#111E5A',
                borderRadius: '50px',
                fontWeight: 500,
                border: selected ? `1px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: selected ? 'none' : '0px 2px 4px rgba(0, 0, 0, 0.05)',
                },
                '& .MuiChip-deleteIcon': {
                    color: '#111E5A',
                    '&:hover': {
                        color: alpha('#111E5A', 0.7),
                    },
                },
            }}
        />
    );
};

const FilterSection = ({ title, children, actionElement }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600} color="#424242">{title}</Typography>
                {actionElement}
            </Box>
            {children}
        </Box>
    );
};

const ClearButton = ({ onClick }) => {
    const theme = useTheme();

    return (
        <Typography
            onClick={onClick}
            variant="caption"
            sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                '&:hover': {
                    textDecoration: 'underline',
                },
            }}
        >
            LIMPAR
        </Typography>
    );
};

const FilterMenu = ({ activeFilters, onFilterChange, onClearFilters, onApplyFilters }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleGenderChange = (gender) => {
        onFilterChange('gender', gender === activeFilters.gender ? null : gender);
    };

    const handleConditionToggle = (condition) => {
        const conditions = [...activeFilters.conditions];
        const index = conditions.indexOf(condition);

        if (index === -1) {
            conditions.push(condition);
        } else {
            conditions.splice(index, 1);
        }

        onFilterChange('conditions', conditions);
    };

    const handleStatusChange = (event) => {
        onFilterChange('status', event.target.value === '' ? null : event.target.value);
    };

    return (
        <Box sx={{
            width: isMobile ? '100%' : '540px',
            p: 3,
            borderRadius: '30px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'white',
            maxHeight: '80vh',
            overflow: 'auto',
        }}>
            {/* Filtro de Gênero */}
            <FilterSection
                title="Gênero"
                actionElement={
                    activeFilters.gender &&
                    <ClearButton onClick={() => onFilterChange('gender', null)} />
                }
            >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant={activeFilters.gender === 'Ambos' ? 'contained' : 'outlined'}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Ambos' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Ambos' ? 'primary.main' : 'transparent',
                            '&:hover': { backgroundColor: activeFilters.gender === 'Ambos' ? 'primary.dark' : alpha('#000', 0.04) }
                        }}
                        onClick={() => handleGenderChange('Ambos')}
                    >
                        Ambos
                    </Button>
                    <Button
                        variant={activeFilters.gender === 'Masculino' ? 'contained' : 'outlined'}
                        startIcon={<MaleIcon />}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Masculino' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Masculino' ? 'primary.main' : 'transparent',
                            '&:hover': { backgroundColor: activeFilters.gender === 'Masculino' ? 'primary.dark' : alpha('#000', 0.04) }
                        }}
                        onClick={() => handleGenderChange('Masculino')}
                    >
                        Masculino
                    </Button>
                    <Button
                        variant={activeFilters.gender === 'Feminino' ? 'contained' : 'outlined'}
                        startIcon={<FemaleIcon />}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Feminino' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Feminino' ? 'primary.main' : 'transparent',
                            '&:hover': { backgroundColor: activeFilters.gender === 'Feminino' ? 'primary.dark' : alpha('#000', 0.04) }
                        }}
                        onClick={() => handleGenderChange('Feminino')}
                    >
                        Feminino
                    </Button>
                </Box>
            </FilterSection>

            {/* Filtro de Condição do Paciente */}
            <FilterSection
                title="Condição do Paciente"
                actionElement={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {activeFilters.conditions.length} Selecionadas
                        </Typography>
                        {activeFilters.conditions.length > 0 && (
                            <ClearButton onClick={() => onFilterChange('conditions', [])} />
                        )}
                    </Box>
                }
            >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {PATIENT_CONDITIONS.map(condition => (
                        <ConditionChip
                            key={condition.value}
                            label={condition.label}
                            colorscheme={condition.color}
                            onClick={() => handleConditionToggle(condition.value)}
                            selected={activeFilters.conditions.includes(condition.value)}
                        />
                    ))}
                </Box>
            </FilterSection>

            {/* Filtro de Status */}
            <FilterSection
                title="Status"
                actionElement={
                    activeFilters.status &&
                    <ClearButton onClick={() => onFilterChange('status', null)} />
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.status || ''}
                        onChange={handleStatusChange}
                        displayEmpty
                        sx={{
                            borderRadius: '50px',
                            '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    borderRadius: '16px',
                                    mt: 1,
                                },
                            },
                        }}
                    >
                        <MenuItem value="">Todos os status</MenuItem>
                        {STATUS_OPTIONS.filter(option => option.value !== '').map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Botões de Ação */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                    variant="outlined"
                    color="inherit"
                    sx={{
                        borderRadius: '50px',
                        px: 3,
                    }}
                    onClick={onClearFilters}
                >
                    Limpar Filtros
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{
                        borderRadius: '50px',
                        px: 4,
                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                            boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)',
                        }
                    }}
                    onClick={onApplyFilters}
                >
                    Aplicar Filtros
                </Button>
            </Box>
        </Box>
    );
};

const PatientsListCard = ({ patients, consultations, loading, onPatientClick }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [viewOptions, setViewOptions] = useState('all'); // 'all', 'today', 'upcoming'
    const [sortConfig, setSortConfig] = useState({
        field: 'patientName',
        direction: 'asc'
    });

    // Estados para filtros
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        gender: null,
        conditions: [],
        status: null
    });

    // Estado para consultas (caso não sejam fornecidas como props)
    const [localConsultations, setLocalConsultations] = useState([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    // Métricas para o card
    const [metrics, setMetrics] = useState({
        totalPatients: 0,
        todayConsultations: 0,
        upcomingConsultations: 0
    });

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newStatus, setNewStatus] = useState("pendente");

    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    const handleStatusSave = async () => {
        if (!selectedPatient) return;

        // Inicia loading state se desejar
        setIsUpdating(true);

        try {
            // Atualiza no Firebase
            await FirebaseService.updatePatientStatus(user.uid, selectedPatient.id, [newStatus]);

            // Atualiza o estado local otimisticamente
            setPatients(prevPatients =>
                prevPatients.map(patient =>
                    patient.id === selectedPatient.id
                        ? { ...patient, statusList: [newStatus] }
                        : patient
                )
            );

            // Mostra notificação de sucesso se desejar
            setSuccessMessage('Status do paciente atualizado com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Erro ao atualizar status do paciente:", error);
            // Mostra mensagem de erro se desejar
            setErrorMessage('Erro ao atualizar status. Tente novamente.');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsUpdating(false);
            setStatusDialogOpen(false);
        }
    };

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
                const consultationsData = await FirebaseService.listAllConsultations(user.uid);
                setLocalConsultations(consultationsData);
            } catch (error) {
                console.error("Erro ao carregar consultas:", error);
            } finally {
                setLoadingConsultations(false);
            }
        };

        fetchConsultations();
    }, [user, consultations]);

    const handleStatusClick = (patient, currentStatus) => {
        // Evita que o clique no status dispare outras ações de linha
        setSelectedPatient(patient);
        setNewStatus(currentStatus || "pendente"); // inicia com o status atual ou padrão "pendente"
        setStatusDialogOpen(true);
    };

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
                const parsedDate = parseISO(obj[field]);
                if (isValid(parsedDate)) {
                    return parsedDate;
                }
            } catch (e) {
                // Tenta outro formato
                try {
                    const parsedDate = parse(obj[field], 'dd/MM/yyyy', new Date());
                    if (isValid(parsedDate)) {
                        return parsedDate;
                    }
                } catch (e2) {
                    console.warn(`Não foi possível parsear a data: ${obj[field]}`);
                }
            }
        }

        return null;
    }, []);

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

    // Atualizar métricas quando os pacientes e consultas mudam
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

        // Filtrar consultas futuras
        const futureConsults = patientConsultsList
            .filter(consult => {
                const consultDate = getDateValue(consult, 'consultationDate');
                return consultDate && isAfter(consultDate, now);
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

    // Filtragem e ordenação dos pacientes
    useEffect(() => {
        if (!patients) {
            setFilteredPatients([]);
            return;
        }

        // Aplicar pesquisa e filtros
        let filtered = [...patients];
        const allConsultations = consultations || localConsultations;

        // Filtrar por consultas de hoje ou próximas
        if (viewOptions === 'today') {
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
        } else if (viewOptions === 'upcoming') {
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

        // Aplicar filtro de gênero
        if (activeFilters.gender) {
            filtered = filtered.filter(patient =>
                patient.gender.toLowerCase() === activeFilters.gender.toLowerCase() ||
                activeFilters.gender.toLowerCase() === 'ambos'
            );
        }

        // Aplicar filtro de condições
        if (activeFilters.conditions.length > 0) {
            filtered = filtered.filter(patient => {
                // Mapear condições para um array no formato do paciente
                const patientConditions = [];
                if (patient.isSmoker) patientConditions.push('fumante');
                if (patient.chronicDiseases?.includes('Diabetes')) patientConditions.push('diabetes');
                if (patient.chronicDiseases?.includes('Hipertensão')) patientConditions.push('hipertensao');
                // Adicionar mais mapeamentos conforme necessário

                // Verificar se alguma das condições filtradas está presente
                return activeFilters.conditions.some(condition =>
                    patientConditions.includes(condition)
                );
            });
        }

        // Aplicar filtro de status
        if (activeFilters.status) {
            filtered = filtered.filter(patient => {
                let status = 'pendente';
                const nextConsult = getPatientNextConsult(patient.id);
                const lastConsult = getPatientLastConsult(patient.id);

                if (!lastConsult && nextConsult) {
                    status = 'primeira consulta';
                } else if (patient.consultationRescheduled) {
                    status = patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
                }

                return status.toLowerCase() === activeFilters.status.toLowerCase();
            });
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
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
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
        activeFilters,
        viewOptions,
        getDateValue,
        patientConsultations,
        getPatientNextConsult,
        getPatientLastConsult
    ]);

    // Formatação de datas
    const formatDate = (date) => {
        if (!date) return '-';

        try {
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return '-';
        }
    };

    // Determinar se existem filtros ativos
    const hasActiveFilters =
        activeFilters.gender !== null ||
        activeFilters.conditions.length > 0 ||
        activeFilters.status !== null;

    // Manipuladores de eventos
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleViewOptionsChange = (option) => {
        setViewOptions(option);
    };

    const handleSortChange = (field) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePatientClick = (patientId) => {
        if (onPatientClick) {
            onPatientClick(patientId);
        }
    };

    // Filtros
    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterChange = (type, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const handleRemoveFilter = (type, value) => {
        if (type === 'gender') {
            setActiveFilters(prev => ({
                ...prev,
                gender: null
            }));
        } else if (type === 'condition') {
            setActiveFilters(prev => ({
                ...prev,
                conditions: prev.conditions.filter(c => c !== value)
            }));
        } else if (type === 'status') {
            setActiveFilters(prev => ({
                ...prev,
                status: null
            }));
        }
    };

    const handleClearFilters = () => {
        setActiveFilters({
            gender: null,
            conditions: [],
            status: null
        });
        handleFilterClose();
    };

    const handleApplyFilters = () => {
        handleFilterClose();
    };

    // Renderização dos esqueletos durante carregamento
    const renderSkeletonRows = () => {
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
    };

    const handleMetricCardClick = (option) => {
        handleViewOptionsChange(option);
    };

    // Cores para os diferentes estados
    const viewStateColors = {
        all: {
            main: theme.palette.primary.main,
            light: alpha(theme.palette.primary.main, 0.1)
        },
        today: {
            main: theme.palette.error.main,
            light: alpha(theme.palette.error.main, 0.1)
        },
        upcoming: {
            main: theme.palette.success.main,
            light: alpha(theme.palette.success.main, 0.1)
        }
    };

    // Determinar a cor do card de conteúdo baseado no estado atual
    const getContentCardStyle = () => {
        return {
            backgroundColor: alpha(viewStateColors[viewOptions].main, 0.03),
            borderLeftWidth: 3,
            borderLeftStyle: 'solid',
            borderLeftColor: viewStateColors[viewOptions].main,
            transition: 'all 0.3s ease'
        };
    };

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
                <Box sx={{ p: 3, backgroundColor: alpha(viewStateColors[viewOptions].main, 0.05) }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} color={viewStateColors[viewOptions].main}>
                            Pacientes
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <ButtonGroup
                                variant="outlined"
                                aria-label="Filtro de visualização"
                                sx={{
                                    '& .MuiButton-root': {
                                        borderRadius: 0,
                                        borderColor: viewStateColors[viewOptions].main,
                                        '&:first-of-type': {
                                            borderTopLeftRadius: '50px',
                                            borderBottomLeftRadius: '50px',
                                        },
                                        '&:last-of-type': {
                                            borderTopRightRadius: '50px',
                                            borderBottomRightRadius: '50px',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: viewStateColors[viewOptions].main,
                                            color: 'white'
                                        }
                                    }
                                }}
                            >
                                <Button
                                    onClick={() => handleViewOptionsChange('all')}
                                    variant={viewOptions === 'all' ? 'contained' : 'outlined'}
                                    color={viewOptions === 'all' ? 'primary' : 'inherit'}
                                    size="small"
                                >
                                    Todos
                                </Button>
                                <Button
                                    onClick={() => handleViewOptionsChange('today')}
                                    variant={viewOptions === 'today' ? 'contained' : 'outlined'}
                                    color={viewOptions === 'today' ? 'error' : 'inherit'}
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
                                    onClick={() => handleViewOptionsChange('upcoming')}
                                    variant={viewOptions === 'upcoming' ? 'contained' : 'outlined'}
                                    color={viewOptions === 'upcoming' ? 'success' : 'inherit'}
                                    size="small"
                                >
                                    Próximos
                                </Button>
                            </ButtonGroup>
                        </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* Cards de métricas clicáveis */}
                        <Grid item xs={4}>
                            <MetricCard
                                icon={<PersonIcon fontSize="small" />}
                                title="Total de Pacientes"
                                value={metrics.totalPatients}
                                active={viewOptions === 'all'}
                                onClick={() => handleMetricCardClick('all')}
                                color={{
                                    main: theme.palette.primary.main,
                                    light: alpha(theme.palette.primary.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <MetricCard
                                icon={<EventIcon fontSize="small" />}
                                title="Consultas Hoje"
                                value={metrics.todayConsultations}
                                active={viewOptions === 'today'}
                                onClick={() => handleMetricCardClick('today')}
                                color={{
                                    main: theme.palette.error.main,
                                    light: alpha(theme.palette.error.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <MetricCard
                                icon={<EventAvailableIcon fontSize="small" />}
                                title="Próximas"
                                value={metrics.upcomingConsultations}
                                active={viewOptions === 'upcoming'}
                                onClick={() => handleMetricCardClick('upcoming')}
                                color={{
                                    main: theme.palette.success.main,
                                    light: alpha(theme.palette.success.main, 0.1)
                                }}
                                loading={isLoadingData}
                            />
                        </Grid>
                    </Grid>

                    {/* Barra de ferramentas com busca e filtros */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: isTablet ? 'column' : 'row',
                            alignItems: isTablet ? 'stretch' : 'center',
                            gap: 2
                        }}
                    >
                        <TextField
                            placeholder="Buscar pacientes por nome, e-mail ou CPF..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            variant="outlined"
                            fullWidth={isTablet}
                            sx={{
                                flex: isTablet ? '1' : '1 1 50%',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: viewStateColors[viewOptions].main,
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color={searchTerm ? viewStateColors[viewOptions].main : 'inherit'} />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                justifyContent: isTablet ? 'space-between' : 'flex-end',
                                flex: isTablet ? '1' : '1 1 50%'
                            }}
                        >
                            {hasActiveFilters && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<FilterAltIcon />}
                                    onClick={handleClearFilters}
                                    sx={{
                                        borderRadius: '50px',
                                        borderColor: viewStateColors[viewOptions].main,
                                        color: viewStateColors[viewOptions].main,
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}

                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FilterListIcon />}
                                onClick={handleFilterClick}
                                color={hasActiveFilters ? viewOptions : "inherit"}
                                sx={{
                                    borderRadius: '50px',
                                    fontWeight: hasActiveFilters ? 600 : 400,
                                    borderColor: hasActiveFilters ? viewStateColors[viewOptions].main : theme.palette.divider,
                                }}
                            >
                                Filtrar
                            </Button>
                        </Box>
                    </Box>

                    {/* Chips de filtro ativos */}
                    {hasActiveFilters && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {activeFilters.gender && (
                                <FilterChip
                                    label={`Gênero: ${activeFilters.gender}`}
                                    colorscheme="genero"
                                    onDelete={() => handleRemoveFilter('gender')}
                                />
                            )}

                            {activeFilters.conditions.map((condition) => {
                                const conditionInfo = PATIENT_CONDITIONS.find(
                                    (c) => c.value === condition
                                );
                                return (
                                    <FilterChip
                                        key={condition}
                                        label={conditionInfo ? conditionInfo.label : condition}
                                        colorscheme={condition}
                                        onDelete={() => handleRemoveFilter('condition', condition)}
                                    />
                                );
                            })}

                            {activeFilters.status && (
                                <FilterChip
                                    label={`Status: ${activeFilters.status.charAt(0).toUpperCase() +
                                    activeFilters.status.slice(1)}`}
                                    colorscheme="default"
                                    onDelete={() => handleRemoveFilter('status')}
                                />
                            )}
                        </Box>
                    )}
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
                                backgroundColor: alpha(viewStateColors[viewOptions].main, 0.2),
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: alpha(viewStateColors[viewOptions].main, 0.05),
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
                                                    {viewOptions === 'all' ? (
                                                        'Tente ajustar seus filtros ou termos de busca para encontrar pacientes, ou adicione um novo paciente.'
                                                    ) : viewOptions === 'today' ? (
                                                        'Não há consultas agendadas para hoje. Verifique outros dias ou adicione uma nova consulta.'
                                                    ) : (
                                                        'Não há consultas futuras agendadas. Agende novas consultas com seus pacientes.'
                                                    )}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.map((patient) => {
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

                                        const nextConsultDateFormatted = nextConsultDate ? formatDate(nextConsultDate) : '-';
                                        const nextConsultIsToday = nextConsultDate ? isToday(nextConsultDate) : false;

                                        let status = 'pendente';
                                        if (!lastConsultDate && nextConsultDate) {
                                            status = 'primeira consulta';
                                        } else if (patient.consultationRescheduled) {
                                            status = patient.consultationConfirmed
                                                ? 'reagendado'
                                                : 'reag. pendente';
                                        }

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
                                                                {formatDate(lastConsultDate)}
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
                                                    {(() => {
                                                        // Lógica para próxima consulta
                                                        if (!nextConsultDate) {
                                                            return <Typography variant="body2" color="text.secondary">-</Typography>;
                                                        }

                                                        const isNextToday = isToday(nextConsultDate);

                                                        return (
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    color={isNextToday ? 'error.main' : 'text.primary'}
                                                                    fontWeight={isNextToday ? 600 : 400}
                                                                >
                                                                    {nextConsultDateFormatted}
                                                                </Typography>
                                                                {isNextToday && (
                                                                    <Typography variant="caption" color="error.main" fontWeight={500}>
                                                                        Hoje
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        );
                                                    })()}
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                                                        size="small"
                                                        sx={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            backgroundColor:
                                                                status === 'pendente'
                                                                    ? '#F5F5F5'
                                                                    : status === 'reagendado'
                                                                        ? '#F3E5F5'
                                                                        : status === 'primeira consulta'
                                                                            ? '#E3F2FD'
                                                                            : '#FFF8E1',
                                                            color:
                                                                status === 'pendente'
                                                                    ? '#757575'
                                                                    : status === 'reagendado'
                                                                        ? '#9C27B0'
                                                                        : status === 'primeira consulta'
                                                                            ? '#2196F3'
                                                                            : '#FF9800',
                                                            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // para não disparar o clique da linha inteira
                                                            handleStatusClick(patient, status);
                                                        }}
                                                    />
                                                </TableCell>


                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Tooltip title="Ações">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Implementar menu de ações, se necessário
                                                                }}
                                                                sx={{
                                                                    color: theme.palette.action.active,
                                                                    '&:hover': {
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                                    }
                                                                }}
                                                            >
                                                                <MoreVertIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Ver perfil do paciente">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePatientClick(patient.id);
                                                                }}
                                                                sx={{
                                                                    color: theme.palette.primary.main,
                                                                    ml: 1,
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

                        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
                            <DialogTitle>Alterar Status do Paciente</DialogTitle>
                            <DialogContent>
                                <FormControl fullWidth>
                                    <InputLabel id="status-select-label">Status</InputLabel>
                                    <Select
                                        labelId="status-select-label"
                                        value={newStatus}
                                        label="Status"
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        {STATUS_OPTIONS.filter(option => option.value !== "").map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleStatusSave} variant="contained">Salvar</Button>
                            </DialogActions>
                        </Dialog>
                    </TableContainer>
                </Box>

                {/* Popover dos filtros */}
                <Popover
                    open={Boolean(filterAnchorEl)}
                    anchorEl={filterAnchorEl}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    PaperProps={{
                        sx: {
                            borderRadius: '30px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                        }
                    }}
                >
                    <FilterMenu
                        activeFilters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onApplyFilters={handleApplyFilters}
                    />
                </Popover>
            </CardContent>
        </Card>
    );
};

export default PatientsListCard;