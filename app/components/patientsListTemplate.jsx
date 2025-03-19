"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Tabs,
    Tab,
    Divider,
    Menu,
    MenuItem,
    Badge,
    Tooltip,
    useMediaQuery,
    Paper,
    AppBar,
    Toolbar,
    Drawer,
    FormControl,
    Select,
    InputLabel,
    Stack,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    AlertTitle,
    Collapse,
    Autocomplete, ButtonGroup
} from '@mui/material';

import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    GridView as GridViewIcon,
    ViewList as ViewListIcon,
    Sort as SortIcon,
    MoreVert as MoreVertIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Female as FemaleIcon,
    Male as MaleIcon,
    ScheduleSend as ScheduleSendIcon,
    EventAvailable as EventAvailableIcon,
    CalendarToday as CalendarTodayIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    StarBorder as StarBorderIcon,
    Star as StarIcon,
    History as HistoryIcon,
    Phone as PhoneIcon,
    Videocam as VideocamIcon,
    ContactPhone as ContactPhoneIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    FilterAlt as FilterAltIcon,
    VideoCall as VideoCallIcon,
    ArrowDropDown as ArrowDropDownIcon,
    EventNote as EventNoteIcon
} from '@mui/icons-material';

import { format, isToday, isPast, parseISO, isValid, parse, differenceInYears, subDays, addDays, isAfter, isBefore, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from "../../lib/firebaseService";
import { useAuth } from "./authProvider";

// Constantes para o componente
const PATIENT_CONDITIONS = [
    { label: 'Diabetes', value: 'diabetes', color: 'diabetes' },
    { label: 'Hipertensão', value: 'hipertensao', color: 'hipertensao' },
    { label: 'Fumante', value: 'fumante', color: 'fumante' },
    { label: 'Internado', value: 'internado', color: 'internado' },
    { label: 'Idoso', value: 'idoso', color: 'idoso' },
    { label: 'Obeso', value: 'obeso', color: 'obeso' },
    { label: 'Alergia', value: 'alergia', color: 'alergia' },
    { label: 'Cardiopatia', value: 'cardiopatia', color: 'cardiopatia' },
    { label: 'Asma', value: 'asma', color: 'asma' },
];

const APPOINTMENT_TYPES = [
    { label: 'Consulta', value: 'consulta', icon: <EventAvailableIcon fontSize="small" /> },
    { label: 'Retorno', value: 'retorno', icon: <HistoryIcon fontSize="small" /> },
    { label: 'Teleconsulta', value: 'teleconsulta', icon: <VideocamIcon fontSize="small" /> },
    { label: 'Emergência', value: 'emergencia', icon: <PhoneIcon fontSize="small" /> },
];

const STATUS_OPTIONS = [
    { label: 'Todos os status', value: '' },
    { label: 'Pendente', value: 'pendente' },
    { label: 'Reagendado', value: 'reagendado' },
    { label: 'Primeira Consulta', value: 'primeira consulta' },
    { label: 'Reag. Pendente', value: 'reag. pendente' },
];

const VIEWS = {
    TABLE: 'table',
    GRID: 'grid',
};

const TABS = {
    ALL: 'todos',
    ACTIVE: 'ativos',
    UPCOMING: 'proximas_consultas',
    FAVORITE: 'favoritos',
    RECENT: 'recentes',
};

// Componentes Auxiliares

// Componente para o cabeçalho de coluna ordenável
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

// Componente para chips de filtro no cabeçalho
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
            case 'alergia': return '#FFECB3';
            case 'cardiopatia': return '#FFCDD2';
            case 'asma': return '#E1F5FE';
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

// Componente para chips de condição do paciente no seletor de filtros
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
            case 'alergia': return '#FFECB3';
            case 'cardiopatia': return '#FFCDD2';
            case 'asma': return '#E1F5FE';
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

// Componente para cada seção de filtros
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

// Botão para limpar filtros
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

// Componente para o menu de filtros
const FilterMenu = ({ activeFilters, onFilterChange, onClearFilters, onApplyFilters }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Estados para controlar o seletor de datas
    const [startDate, setStartDate] = useState(activeFilters.dateRange?.start || '');
    const [endDate, setEndDate] = useState(activeFilters.dateRange?.end || '');

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

    const handleAppointmentTypeChange = (event) => {
        onFilterChange('appointmentType', event.target.value === '' ? null : event.target.value);
    };

    const handleDateRangeChange = () => {
        if (startDate || endDate) {
            onFilterChange('dateRange', {
                start: startDate,
                end: endDate
            });
        } else {
            onFilterChange('dateRange', null);
        }
    };

    const handleApply = () => {
        handleDateRangeChange();
        onApplyFilters();
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
                        {STATUS_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Tipo de Consulta */}
            <FilterSection
                title="Tipo de Consulta"
                actionElement={
                    activeFilters.appointmentType &&
                    <ClearButton onClick={() => onFilterChange('appointmentType', null)} />
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.appointmentType || ''}
                        onChange={handleAppointmentTypeChange}
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
                        <MenuItem value="">Todos os tipos</MenuItem>
                        {APPOINTMENT_TYPES.map(option => (
                            <MenuItem key={option.value} value={option.value} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                    {option.icon}
                                </Box>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Período de Consulta */}
            <FilterSection
                title="Período de Consulta"
                actionElement={
                    activeFilters.dateRange &&
                    <ClearButton onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        onFilterChange('dateRange', null);
                    }} />
                }
            >
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="De"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Até"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                },
                            }}
                        />
                    </Grid>
                </Grid>
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
                    onClick={handleApply}
                >
                    Aplicar Filtros
                </Button>
            </Box>
        </Box>
    );
};

// Componente principal da página
const PatientsListPage = ({ onPatientClick }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();

    // Estados principais
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(VIEWS.TABLE);
    const [currentTab, setCurrentTab] = useState(TABS.ALL);
    const [page, setPage] = useState(1);
    const [favoritePatients, setFavoritePatients] = useState([]);
    const [consultations, setConsultations] = useState([]);

    // Estados para paginação
    const rowsPerPage = 10;
    const paginatedPatients = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredPatients.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredPatients, page, rowsPerPage]);

    // Estados para sorting
    const [sortConfig, setSortConfig] = useState({
        field: 'patientName',
        direction: 'asc'
    });

    // Estados para filtros
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        gender: null,
        conditions: [],
        status: null,
        appointmentType: null,
        dateRange: null
    });

    // Metrics (Estatísticas)
    const [metrics, setMetrics] = useState({
        totalPatients: 0,
        activePatients: 0,
        newPatients: 0,
        upcomingAppointments: 0
    });

    // Carregar dados iniciais
    useEffect(() => {
        if (!user?.uid) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Carrega a lista de pacientes
                const patientsData = await FirebaseService.getPatientsByDoctor(user.uid);
                setPatients(patientsData);

                // Carrega as consultas para referência
                const consultationsData = await FirebaseService.listAllConsultations(user.uid);
                setConsultations(consultationsData);

                // Calcula métricas
                calculateMetrics(patientsData, consultationsData);

                // Inicializa os favoritos (simulação)
                const favPatients = patientsData.slice(0, 5).map(p => p.id);
                setFavoritePatients(favPatients);

            } catch (error) {
                console.error("Erro ao carregar dados de pacientes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Calcula métricas baseadas nos dados
    const calculateMetrics = (patientsData, consultationsData) => {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);

        // Pacientes ativos (com consulta nos últimos 6 meses)
        const sixMonthsAgo = subDays(today, 180);
        const activePatients = patientsData.filter(patient => {
            const lastConsultDate = getDateValue(patient, 'lastConsultationDate');
            return lastConsultDate && isAfter(lastConsultDate, sixMonthsAgo);
        });

        // Pacientes novos (adicionados nos últimos 30 dias)
        const newPatients = patientsData.filter(patient => {
            const createdAt = getDateValue(patient, 'createdAt');
            return createdAt && isAfter(createdAt, thirtyDaysAgo);
        });

        // Consultas agendadas futuras
        const upcomingAppointments = consultationsData.filter(consult => {
            const consultDate = getDateValue(consult, 'consultationDate');
            return consultDate && isAfter(consultDate, today);
        });

        setMetrics({
            totalPatients: patientsData.length,
            activePatients: activePatients.length,
            newPatients: newPatients.length,
            upcomingAppointments: upcomingAppointments.length
        });
    };

    // Efeito para filtragem e ordenação de pacientes
    useEffect(() => {
        if (!patients) {
            setFilteredPatients([]);
            return;
        }

        let filtered = [...patients];

        // Aplicar filtro de abas
        filtered = applyTabFilter(filtered);

        // Aplicar pesquisa por texto
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(patient =>
                (patient.patientName || '').toLowerCase().includes(searchLower) ||
                (patient.patientEmail || '').toLowerCase().includes(searchLower) ||
                (patient.patientCPF || '').includes(searchTerm)
            );
        }

        // Aplicar outros filtros ativos
        filtered = applyActiveFilters(filtered);

        // Aplicar ordenação
        filtered = applySorting(filtered);

        setFilteredPatients(filtered);
        setPage(1); // Resetar para primeira página quando os filtros mudam
    }, [patients, searchTerm, sortConfig, activeFilters, currentTab, favoritePatients]);

    // Função auxiliar para extrair valores de data
    const getDateValue = (obj, field) => {
        if (!obj || !obj[field]) return null;

        if (obj[field] instanceof Date) {
            return obj[field];
        }

        if (typeof obj[field].toDate === 'function') {
            return obj[field].toDate();
        }

        if (typeof obj[field] === 'string') {
            // Tentar diferentes formatos de data
            try {
                const parsedDate = parseISO(obj[field]);
                if (isValid(parsedDate)) {
                    return parsedDate;
                }
            } catch (e) {
                // Tentar outro formato
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
    };

    // Aplicar filtro baseado na aba selecionada
    const applyTabFilter = (patients) => {
        const today = new Date();

        switch (currentTab) {
            case TABS.ACTIVE:
                // Pacientes com consulta nos últimos 6 meses
                const sixMonthsAgo = subDays(today, 180);
                return patients.filter(patient => {
                    const lastConsultDate = getDateValue(patient, 'lastConsultationDate');
                    return lastConsultDate && isAfter(lastConsultDate, sixMonthsAgo);
                });

            case TABS.UPCOMING:
                // Pacientes com consultas futuras
                return patients.filter(patient => {
                    const nextConsultDate = getDateValue(patient, 'nextConsultationDate');
                    return nextConsultDate && isAfter(nextConsultDate, today);
                });

            case TABS.FAVORITE:
                // Pacientes marcados como favoritos
                return patients.filter(patient =>
                    favoritePatients.includes(patient.id)
                );

            case TABS.RECENT:
                // Pacientes adicionados nos últimos 30 dias
                const thirtyDaysAgo = subDays(today, 30);
                return patients.filter(patient => {
                    const createdAt = getDateValue(patient, 'createdAt');
                    return createdAt && isAfter(createdAt, thirtyDaysAgo);
                });

            default:
                return patients;
        }
    };

    // Aplicar todos os filtros ativos
    const applyActiveFilters = (patients) => {
        let filtered = [...patients];

        // Filtro de gênero
        if (activeFilters.gender) {
            filtered = filtered.filter(patient =>
                patient.gender === activeFilters.gender ||
                activeFilters.gender === 'Ambos'
            );
        }

        // Filtro de condições
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

        // Filtro de status
        if (activeFilters.status) {
            filtered = filtered.filter(patient => {
                let status = 'pendente';
                const lastConsultDate = getDateValue(patient, 'lastConsultationDate');
                const nextConsultDate = getDateValue(patient, 'nextConsultationDate');

                if (!lastConsultDate && nextConsultDate) {
                    status = 'primeira consulta';
                } else if (patient.consultationRescheduled) {
                    status = patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
                }

                return status.toLowerCase() === activeFilters.status.toLowerCase();
            });
        }

        // Filtro de tipo de consulta
        if (activeFilters.appointmentType) {
            filtered = filtered.filter(patient => {
                // Verificar tipo no campo consultationType
                return patient.consultationType?.toLowerCase() === activeFilters.appointmentType;
            });
        }

        // Filtro de período de consulta
        if (activeFilters.dateRange) {
            const { start, end } = activeFilters.dateRange;

            if (start || end) {
                filtered = filtered.filter(patient => {
                    const nextConsultDate = getDateValue(patient, 'nextConsultationDate');
                    if (!nextConsultDate) return false;

                    const startDate = start ? new Date(start) : null;
                    const endDate = end ? new Date(end) : null;

                    if (startDate && endDate) {
                        return isAfter(nextConsultDate, startDate) && isBefore(nextConsultDate, endDate);
                    } else if (startDate) {
                        return isAfter(nextConsultDate, startDate);
                    } else if (endDate) {
                        return isBefore(nextConsultDate, endDate);
                    }

                    return true;
                });
            }
        }

        return filtered;
    };

    // Aplicar ordenação
    const applySorting = (patients) => {
        return [...patients].sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            // Tratamento especial para campos de data
            if (sortConfig.field === 'lastConsultationDate' || sortConfig.field === 'nextConsultationDate') {
                aValue = getDateValue(a, sortConfig.field);
                bValue = getDateValue(b, sortConfig.field);

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
    };

    // Formatação de datas
    const formatDate = (date) => {
        if (!date) return '-';

        try {
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return '-';
        }
    };

    // Verificar se existem filtros ativos
    const hasActiveFilters =
        activeFilters.gender !== null ||
        activeFilters.conditions.length > 0 ||
        activeFilters.status !== null ||
        activeFilters.appointmentType !== null ||
        activeFilters.dateRange !== null;

    // Handlers
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
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

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleToggleFavorite = (patientId) => {
        setFavoritePatients(prev => {
            if (prev.includes(patientId)) {
                return prev.filter(id => id !== patientId);
            } else {
                return [...prev, patientId];
            }
        });
    };

    // Handlers de filtro
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
        } else if (type === 'appointmentType') {
            setActiveFilters(prev => ({
                ...prev,
                appointmentType: null
            }));
        } else if (type === 'dateRange') {
            setActiveFilters(prev => ({
                ...prev,
                dateRange: null
            }));
        }
    };

    const handleClearFilters = () => {
        setActiveFilters({
            gender: null,
            conditions: [],
            status: null,
            appointmentType: null,
            dateRange: null
        });
        handleFilterClose();
    };

    const handleApplyFilters = () => {
        handleFilterClose();
    };

    // Skeletons para loading
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
                <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Skeleton variant="circular" width={32} height={32} sx={{ ml: 1 }} />
                        <Skeleton variant="circular" width={32} height={32} sx={{ ml: 1 }} />
                    </Box>
                </TableCell>
            </TableRow>
        ));
    };

    const renderSkeletonCards = () => {
        return Array(6).fill().map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-card-${index}`}>
                <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Skeleton variant="circular" width={50} height={50} sx={{ mr: 2 }} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="40%" />
                            </Box>
                            <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ mt: 2 }}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="text" width="70%" />
                            <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
                                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 16 }} />
                                <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 16 }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        ));
    };

    // Cartão de métricas
    const MetricsCardsSection = () => (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    height: '100%'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Total de Pacientes
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                            {loading ? <Skeleton width={60} /> : metrics.totalPatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : '+3 pacientes nesta semana'}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    height: '100%'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Pacientes Ativos
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#4CAF50' }}>
                            {loading ? <Skeleton width={60} /> : metrics.activePatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? (
                                <Skeleton width={120} />
                            ) : (
                                <>
                                    <span style={{ color: '#4CAF50' }}>{Math.round((metrics.activePatients / metrics.totalPatients) * 100) || 0}%</span> do total de pacientes
                                </>
                            )}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    height: '100%'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Novos Pacientes (30 dias)
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#2196F3' }}>
                            {loading ? <Skeleton width={60} /> : metrics.newPatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : 'Média de 3 por semana'}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    height: '100%'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Consultas Agendadas
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#FF9800' }}>
                            {loading ? <Skeleton width={60} /> : metrics.upcomingAppointments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : `Próxima: ${metrics.upcomingAppointments > 0 ? 'Hoje' : 'Nenhuma'}`}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // Cabeçalho com abas
    const HeaderSection = () => (
        <Box sx={{ mb: 3 }}>
            <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                sx={{
                    mb: 2,
                    '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.primary.main,
                        height: 3,
                        borderRadius: '3px'
                    },
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        minWidth: 'auto',
                        padding: '12px 16px',
                        '&.Mui-selected': {
                            color: theme.palette.primary.main,
                            fontWeight: 600
                        }
                    }
                }}
            >
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Todos os Pacientes
                            <Chip
                                label={metrics.totalPatients}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.ALL}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Ativos
                            <Chip
                                label={metrics.activePatients}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.ACTIVE}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Próximas Consultas
                            <Chip
                                label={metrics.upcomingAppointments}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.UPCOMING}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Favoritos
                            <Chip
                                label={favoritePatients.length}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.FAVORITE}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Recentes
                            <Chip
                                label={metrics.newPatients}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.RECENT}
                />
            </Tabs>
        </Box>
    );

    // Barra de ferramentas com busca e filtros
    const ToolbarSection = () => (
        <Box
            sx={{
                mb: 3,
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
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
                        }}
                    >
                        Limpar Filtros
                    </Button>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={handleFilterClick}
                        color={hasActiveFilters ? "primary" : "inherit"}
                        sx={{
                            borderRadius: '50px',
                            fontWeight: hasActiveFilters ? 600 : 400
                        }}
                    >
                        Filtrar
                    </Button>

                    <ButtonGroup variant="outlined" sx={{ borderRadius: '50px', overflow: 'hidden' }}>
                        <Button
                            size="small"
                            onClick={() => handleViewModeChange(VIEWS.TABLE)}
                            variant={viewMode === VIEWS.TABLE ? 'contained' : 'outlined'}
                            sx={{
                                borderTopLeftRadius: '50px',
                                borderBottomLeftRadius: '50px',
                                borderTopRightRadius: '0',
                                borderBottomRightRadius: '0',
                                minWidth: '40px'
                            }}
                        >
                            <ViewListIcon fontSize="small" />
                        </Button>
                        <Button
                            size="small"
                            onClick={() => handleViewModeChange(VIEWS.GRID)}
                            variant={viewMode === VIEWS.GRID ? 'contained' : 'outlined'}
                            sx={{
                                borderTopRightRadius: '50px',
                                borderBottomRightRadius: '50px',
                                borderTopLeftRadius: '0',
                                borderBottomLeftRadius: '0',
                                minWidth: '40px'
                            }}
                        >
                            <GridViewIcon fontSize="small" />
                        </Button>
                    </ButtonGroup>
                </Box>
            </Box>
        </Box>
    );

    // Chips de filtros ativos
    const ActiveFiltersSection = () => {
        if (!hasActiveFilters) return null;

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
                        label={`Status: ${activeFilters.status.charAt(0).toUpperCase() + activeFilters.status.slice(1)}`}
                        colorscheme="default"
                        onDelete={() => handleRemoveFilter('status')}
                    />
                )}

                {activeFilters.appointmentType && (
                    <FilterChip
                        label={`Tipo: ${activeFilters.appointmentType.charAt(0).toUpperCase() + activeFilters.appointmentType.slice(1)}`}
                        colorscheme="consultas"
                        onDelete={() => handleRemoveFilter('appointmentType')}
                    />
                )}

                {activeFilters.dateRange && (
                    <FilterChip
                        label={`Período: ${activeFilters.dateRange.start || '...'} - ${activeFilters.dateRange.end || '...'}`}
                        colorscheme="default"
                        onDelete={() => handleRemoveFilter('dateRange')}
                    />
                )}
            </Box>
        );
    };

    // Visualização em tabela
    const TableViewSection = () => (
        <TableContainer component={Paper} sx={{
            borderRadius: '24px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
        }}>
            <Table sx={{ minWidth: 650 }}>
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
                    {loading ? (
                        renderSkeletonRows()
                    ) : paginatedPatients.length === 0 ? (
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
                                        Tente ajustar seus filtros ou termos de busca para encontrar pacientes, ou adicione um novo paciente.
                                    </Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedPatients.map((patient) => {
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

                            const lastConsultDate = getDateValue(
                                patient,
                                'lastConsultationDate'
                            );

                            const nextConsultDate = getDateValue(
                                patient,
                                'nextConsultationDate'
                            );

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

                            const isTelemedicine = patient.consultationType === 'Telemedicina';
                            const isFavorite = favoritePatients.includes(patient.id);

                            return (
                                <TableRow
                                    key={patient.id}
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
                                            // Cria um array de todas as datas de consulta futuras
                                            const futureDates = [];

                                            if (nextConsultDate && isAfter(nextConsultDate, new Date())) {
                                                futureDates.push({
                                                    date: nextConsultDate
                                                });
                                            }

                                            if (lastConsultDate && isAfter(lastConsultDate, new Date())) {
                                                futureDates.push({
                                                    date: lastConsultDate
                                                });
                                            }

                                            // Ordena as datas futuras (mais próxima primeiro)
                                            futureDates.sort((a, b) => a.date - b.date);

                                            // Se não há datas futuras
                                            if (futureDates.length === 0) {
                                                return <Typography variant="body2" color="text.secondary">-</Typography>;
                                            }

                                            // Pega a data mais próxima
                                            const nextDate = futureDates[0].date;
                                            const isNextToday = isToday(nextDate);

                                            return (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color={isNextToday ? 'error.main' : 'text.primary'}
                                                        fontWeight={isNextToday ? 600 : 400}
                                                    >
                                                        {formatDate(nextDate)}
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
                                        />
                                    </TableCell>

                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tooltip title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleFavorite(patient.id);
                                                    }}
                                                    sx={{
                                                        color: isFavorite ? '#FFC107' : 'action.disabled',
                                                    }}
                                                >
                                                    {isFavorite ? <StarIcon /> : <StarBorderIcon />}
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
                                                        ml: 1
                                                    }}
                                                >
                                                    <KeyboardArrowRightIcon />
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

            {filteredPatients.length > 0 && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando {Math.min(rowsPerPage, filteredPatients.length)} de {filteredPatients.length} pacientes
                    </Typography>

                    <Pagination
                        count={Math.ceil(filteredPatients.length / rowsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        size="small"
                    />
                </Box>
            )}
        </TableContainer>
    );

    // Visualização em cards/grid
    const GridViewSection = () => (
        <Grid container spacing={3}>
            {loading ? (
                renderSkeletonCards()
            ) : paginatedPatients.length === 0 ? (
                <Grid item xs={12}>
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        backgroundColor: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    }}>
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
                            Tente ajustar seus filtros ou termos de busca para encontrar pacientes, ou adicione um novo paciente.
                        </Typography>
                    </Box>
                </Grid>
            ) : (
                paginatedPatients.map(patient => {
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

                    const lastConsultDate = getDateValue(
                        patient,
                        'lastConsultationDate'
                    );

                    const nextConsultDate = getDateValue(
                        patient,
                        'nextConsultationDate'
                    );

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

                    const isTelemedicine = patient.consultationType === 'Telemedicina';
                    const isFavorite = favoritePatients.includes(patient.id);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={patient.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '24px',
                                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer'
                                }
                            }}
                                  onClick={() => handlePatientClick(patient.id)}
                            >
                                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar
                                            src={patient.patientPhotoUrl}
                                            alt={patientName}
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                mr: 2,
                                                fontSize: '1.25rem',
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)'
                                            }}
                                        >
                                            {patientName.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: '80%' }}>
                                                    {patientName}
                                                </Typography>
                                                {isTelemedicine && (
                                                    <Tooltip title="Telemedicina">
                                                        <VideoCallIcon
                                                            fontSize="small"
                                                            sx={{
                                                                ml: 0.5,
                                                                color: theme.palette.info.main,
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                {patient.patientEmail || 'Sem e-mail'}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleFavorite(patient.id);
                                            }}
                                            sx={{
                                                color: isFavorite ? '#FFC107' : 'action.disabled',
                                            }}
                                        >
                                            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                                        </IconButton>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ mb: 'auto' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {gender.toLowerCase() === 'masculino' ? (
                                                    <Tooltip title="Masculino">
                                                        <MaleIcon sx={{ color: theme.palette.info.main, mr: 0.5, fontSize: '1rem' }} />
                                                    </Tooltip>
                                                ) : gender.toLowerCase() === 'feminino' ? (
                                                    <Tooltip title="Feminino">
                                                        <FemaleIcon sx={{ color: '#E91E63', mr: 0.5, fontSize: '1rem' }} />
                                                    </Tooltip>
                                                ) : (
                                                    '-'
                                                )}
                                                <Typography variant="body2">{age} anos</Typography>
                                            </Box>
                                            <Chip
                                                label={status.charAt(0).toUpperCase() + status.slice(1)}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
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
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            {/* Exibição da última consulta (no passado) */}
                                            {lastConsultDate && isPast(lastConsultDate) && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <EventNoteIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Última: {formatDate(lastConsultDate)}
                                                        <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                                                            ({formatDistance(lastConsultDate, new Date(), { addSuffix: true, locale: ptBR })})
                                                        </Typography>
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Exibição das duas próximas consultas (ordenadas) */}
                                            {/* Aqui estamos considerando tanto nextConsultationDate quanto lastConsultationDate
        se for no futuro (às vezes lastConsultationDate pode ser uma data futura) */}
                                            {(() => {
                                                // Cria um array de todas as datas de consulta futuras
                                                const futureDates = [];

                                                if (nextConsultDate && isAfter(nextConsultDate, new Date())) {
                                                    futureDates.push({
                                                        date: nextConsultDate,
                                                        isNext: true
                                                    });
                                                }

                                                if (lastConsultDate && isAfter(lastConsultDate, new Date())) {
                                                    futureDates.push({
                                                        date: lastConsultDate,
                                                        isNext: false
                                                    });
                                                }

                                                // Ordena as datas futuras (mais próxima primeiro)
                                                futureDates.sort((a, b) => a.date - b.date);

                                                // Retorna as datas formatadas
                                                return futureDates.map((dateObj, index) => {
                                                    const isToday = isValid(dateObj.date) && format(dateObj.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                                                    return (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                mb: index < futureDates.length - 1 ? 0.5 : 0
                                                            }}
                                                        >
                                                            <CalendarTodayIcon
                                                                fontSize="small"
                                                                sx={{
                                                                    color: isToday ? 'error.main' : 'text.secondary',
                                                                    mr: 1
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                color={isToday ? 'error.main' : 'text.secondary'}
                                                                fontWeight={isToday || index === 0 ? 600 : 400}
                                                            >
                                                                {index === 0 ? "Próxima: " : "Agendada: "}
                                                                {formatDate(dateObj.date)}
                                                                {isToday && " (Hoje)"}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                });
                                            })()}

                                            {/* Mensagem quando não há consultas */}
                                            {!lastConsultDate && !nextConsultDate && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Sem consultas agendadas
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
                                        <Button
                                            size="small"
                                            startIcon={<EventAvailableIcon />}
                                            variant="outlined"
                                            sx={{ borderRadius: '50px', fontSize: '0.75rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Função para agendamento
                                            }}
                                        >
                                            Agendar
                                        </Button>

                                        <Button
                                            size="small"
                                            endIcon={<KeyboardArrowRightIcon />}
                                            variant="contained"
                                            color="primary"
                                            sx={{
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                boxShadow: '0 2px 8px 0 rgba(0,118,255,0.25)',
                                            }}
                                            onClick={() => handlePatientClick(patient.id)}
                                        >
                                            Ver Perfil
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })
            )}

            {filteredPatients.length > 0 && (
                <Grid item xs={12}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: 2,
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        mt: 2,
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    }}>
                        <Pagination
                            count={Math.ceil(filteredPatients.length / rowsPerPage)}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            variant="outlined"
                            shape="rounded"
                            size="medium"
                        />
                    </Box>
                </Grid>
            )}
        </Grid>
    );

    return (
        <Box sx={{ p: 0, backgroundColor: '#F4F9FF' }}>
            {/* Cabeçalho e estatísticas */}
            <HeaderSection />

            {/* Cards de métricas */}
            <MetricsCardsSection />

            {/* Barra de ferramentas */}
            <ToolbarSection />

            {/* Chips de filtros ativos */}
            <ActiveFiltersSection />

            {/* Conteúdo principal: alternância entre visualização de tabela e grid */}
            {viewMode === VIEWS.TABLE ? <TableViewSection /> : <GridViewSection />}

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
        </Box>
    );
};

export default PatientsListPage;