"use client";

import React, {useState, useEffect, useMemo, useCallback} from 'react';
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
    CalendarToday as CalendarTodayIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    StarBorder as StarBorderIcon,
    Star as StarIcon,
    History as HistoryIcon,
    Phone as PhoneIcon,
    Videocam as VideocamIcon,
    FilterAlt as FilterAltIcon,
    VideoCall as VideoCallIcon,
    ArrowDropDown as ArrowDropDownIcon,
    Timeline as TimelineIcon,
    LocalHospital as LocalHospitalIcon,
    Healing as HealingIcon,
    PregnantWoman as PregnantWomanIcon,
    EventNote as EventNoteIcon,
    ScheduleSend as ScheduleSendIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    ContactPhone as ContactPhoneIcon,
} from '@mui/icons-material';

import {
    format,
    isToday,
    isPast,
    parseISO,
    isValid,
    parse,
    differenceInYears,
    subDays,
    addDays,
    isAfter,
    isBefore,
    formatDistance
} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import FirebaseService from "../../lib/firebaseService";
import {useAuth} from "./authProvider";
import SearchField from "./basicComponents/searchField";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";

// Constantes para opções de filtro - coloque estas no início do arquivo ou em um arquivo separado
const PATIENT_CONDITIONS = [
    {label: 'Diabetes', value: 'diabetes', color: 'diabetes'},
    {label: 'Hipertensão', value: 'hipertensao', color: 'hipertensao'},
    {label: 'Fumante', value: 'fumante', color: 'fumante'},
    {label: 'Obeso', value: 'obeso', color: 'obeso'},
    {label: 'Alergia', value: 'alergia', color: 'alergia'},
    {label: 'Cardiopatia', value: 'cardiopatia', color: 'cardiopatia'},
    {label: 'Asma', value: 'asma', color: 'asma'},
    {label: 'Internado', value: 'internado', color: 'internado'},
    {label: 'Idoso', value: 'idoso', color: 'idoso'},
];

const STATUS_OPTIONS = [
    {label: 'Todos os status', value: '', icon: null, color: '#757575'},
    {label: 'Pendente', value: 'pendente', icon: <EventNoteIcon fontSize="small" />, color: '#757575'},
    {label: 'Reagendado', value: 'reagendado', icon: <ScheduleSendIcon fontSize="small" />, color: '#9C27B0'},
    {label: 'Primeira Consulta', value: 'primeira consulta', icon: <AddCircleOutlineIcon fontSize="small" />, color: '#2196F3'},
    {label: 'Reag. Pendente', value: 'reag. pendente', icon: <ScheduleSendIcon fontSize="small" />, color: '#FF9800'},
    {label: 'Particular', value: 'Particular', icon: <ContactPhoneIcon fontSize="small" />, color: '#1C94E0'},
    {label: 'Convênio', value: 'Convênio', icon: <ContactPhoneIcon fontSize="small" />, color: '#1852FE'},
    {label: 'Internado', value: 'Internado', icon: <LocalHospitalIcon fontSize="small" />, color: '#FF4B55'},
    {label: 'Pós-cirurgia', value: 'Pós-cirurgia', icon: <HealingIcon fontSize="small" />, color: '#7B4BC9'},
    {label: 'Gestante', value: 'Gestante', icon: <PregnantWomanIcon fontSize="small" />, color: '#FFAB2B'},
    {label: 'Alta', value: 'Alta', icon: <CheckCircleOutlineIcon fontSize="small" />, color: '#0CAF60'},
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

const APPOINTMENT_TYPES = [
    {label: 'Consulta', value: 'consulta', icon: <EventAvailableIcon fontSize="small"/>},
    {label: 'Retorno', value: 'retorno', icon: <HistoryIcon fontSize="small"/>},
    {label: 'Teleconsulta', value: 'teleconsulta', icon: <VideocamIcon fontSize="small"/>},
    {label: 'Emergência', value: 'emergencia', icon: <PhoneIcon fontSize="small"/>},
];

const HEALTH_PLAN_TYPES = [
    {label: 'Todos os planos', value: ''},
    {label: 'Unimed', value: 'Unimed'},
    {label: 'Amil', value: 'Amil'},
    {label: 'Bradesco', value: 'Bradesco'},
    {label: 'SulAmérica', value: 'SulAmérica'},
    {label: 'NotreDame', value: 'NotreDame'},
    {label: 'Particular', value: 'Particular'},
];

const AGE_RANGES = [
    { label: 'Todas as idades', value: '' },
    { label: 'Crianças (0-12)', value: '0-12' },
    { label: 'Adolescentes (13-17)', value: '13-17' },
    { label: 'Jovens adultos (18-29)', value: '18-29' },
    { label: 'Adultos (30-49)', value: '30-49' },
    { label: 'Meia-idade (50-64)', value: '50-64' },
    { label: 'Idosos (65+)', value: '65+' },
];

const STATES = [
    { label: 'Todos os estados', value: '' },
    { label: 'AC', value: 'AC' },
    { label: 'AL', value: 'AL' },
    { label: 'AP', value: 'AP' },
    { label: 'AM', value: 'AM' },
    { label: 'BA', value: 'BA' },
    { label: 'CE', value: 'CE' },
    { label: 'DF', value: 'DF' },
    { label: 'ES', value: 'ES' },
    { label: 'GO', value: 'GO' },
    { label: 'MA', value: 'MA' },
    { label: 'MT', value: 'MT' },
    { label: 'MS', value: 'MS' },
    { label: 'MG', value: 'MG' },
    { label: 'PA', value: 'PA' },
    { label: 'PB', value: 'PB' },
    { label: 'PR', value: 'PR' },
    { label: 'PE', value: 'PE' },
    { label: 'PI', value: 'PI' },
    { label: 'RJ', value: 'RJ' },
    { label: 'RN', value: 'RN' },
    { label: 'RS', value: 'RS' },
    { label: 'RO', value: 'RO' },
    { label: 'RR', value: 'RR' },
    { label: 'SC', value: 'SC' },
    { label: 'SP', value: 'SP' },
    { label: 'SE', value: 'SE' },
    { label: 'TO', value: 'TO' },
];

// O componente FilterMenu completo
const FilterMenu = ({activeFilters, onFilterChange, onClearFilters, onApplyFilters}) => {
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

    const handleHealthPlanChange = (event) => {
        onFilterChange('healthPlan', event.target.value === '' ? null : event.target.value);
    };

    const handleAgeRangeChange = (event) => {
        onFilterChange('ageRange', event.target.value === '' ? null : event.target.value);
    };

    const handleRegionChange = (field, value) => {
        onFilterChange('region', {
            ...activeFilters.region,
            [field]: value === '' ? null : value
        });
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
                    <ClearButton onClick={() => onFilterChange('gender', null)}/>
                }
            >
                <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap'}}>
                    <Button
                        variant={activeFilters.gender === 'Ambos' ? 'contained' : 'outlined'}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Ambos' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Ambos' ? 'primary.main' : 'transparent',
                            '&:hover': {backgroundColor: activeFilters.gender === 'Ambos' ? 'primary.dark' : alpha('#000', 0.04)}
                        }}
                        onClick={() => handleGenderChange('Ambos')}
                    >
                        Ambos
                    </Button>
                    <Button
                        variant={activeFilters.gender === 'Masculino' ? 'contained' : 'outlined'}
                        startIcon={<MaleIcon/>}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Masculino' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Masculino' ? 'primary.main' : 'transparent',
                            '&:hover': {backgroundColor: activeFilters.gender === 'Masculino' ? 'primary.dark' : alpha('#000', 0.04)}
                        }}
                        onClick={() => handleGenderChange('Masculino')}
                    >
                        Masculino
                    </Button>
                    <Button
                        variant={activeFilters.gender === 'Feminino' ? 'contained' : 'outlined'}
                        startIcon={<FemaleIcon/>}
                        sx={{
                            borderRadius: '50px',
                            color: activeFilters.gender === 'Feminino' ? 'white' : 'inherit',
                            backgroundColor: activeFilters.gender === 'Feminino' ? 'primary.main' : 'transparent',
                            '&:hover': {backgroundColor: activeFilters.gender === 'Feminino' ? 'primary.dark' : alpha('#000', 0.04)}
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
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Typography variant="body2" color="text.secondary" sx={{mr: 1}}>
                            {activeFilters.conditions.length} Selecionadas
                        </Typography>
                        {activeFilters.conditions.length > 0 && (
                            <ClearButton onClick={() => onFilterChange('conditions', [])}/>
                        )}
                    </Box>
                }
            >
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
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
                    <ClearButton onClick={() => onFilterChange('status', null)}/>
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.status || ''}
                        onChange={handleStatusChange}
                        displayEmpty
                        sx={{
                            borderRadius: '50px',
                            '.MuiOutlinedInput-notchedOutline': {borderColor: theme.palette.divider},
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
                            <MenuItem key={option.value} value={option.value} sx={{ display: 'flex', alignItems: 'center' }}>
                                {option.icon && (
                                    <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center', color: option.color }}>
                                        {option.icon}
                                    </Box>
                                )}
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
                    <ClearButton onClick={() => onFilterChange('appointmentType', null)}/>
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.appointmentType || ''}
                        onChange={handleAppointmentTypeChange}
                        displayEmpty
                        sx={{
                            borderRadius: '50px',
                            '.MuiOutlinedInput-notchedOutline': {borderColor: theme.palette.divider},
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
                            <MenuItem key={option.value} value={option.value}
                                      sx={{display: 'flex', alignItems: 'center'}}>
                                <Box component="span" sx={{mr: 1, display: 'flex', alignItems: 'center'}}>
                                    {option.icon}
                                </Box>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Plano de Saúde (NOVO) */}
            <FilterSection
                title="Plano de Saúde"
                actionElement={
                    activeFilters.healthPlan &&
                    <ClearButton onClick={() => onFilterChange('healthPlan', null)}/>
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.healthPlan || ''}
                        onChange={(e) => onFilterChange('healthPlan', e.target.value === '' ? null : e.target.value)}
                        displayEmpty
                        sx={{
                            borderRadius: '50px',
                            '.MuiOutlinedInput-notchedOutline': {borderColor: theme.palette.divider},
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
                        {HEALTH_PLAN_TYPES.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Faixa Etária (NOVO) */}
            <FilterSection
                title="Faixa Etária"
                actionElement={
                    activeFilters.ageRange &&
                    <ClearButton onClick={() => onFilterChange('ageRange', null)}/>
                }
            >
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={activeFilters.ageRange || ''}
                        onChange={(e) => onFilterChange('ageRange', e.target.value === '' ? null : e.target.value)}
                        displayEmpty
                        sx={{
                            borderRadius: '50px',
                            '.MuiOutlinedInput-notchedOutline': {borderColor: theme.palette.divider},
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
                        {AGE_RANGES.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Localização (NOVO) */}
            <FilterSection
                title="Localização"
                actionElement={
                    (activeFilters.region?.state || activeFilters.region?.city) &&
                    <ClearButton onClick={() => onFilterChange('region', { state: null, city: null })}/>
                }
            >
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel id="state-filter-label">Estado</InputLabel>
                            <Select
                                labelId="state-filter-label"
                                label="Estado"
                                value={activeFilters.region?.state || ''}
                                onChange={(e) => {
                                    const state = e.target.value === '' ? null : e.target.value;
                                    onFilterChange('region', {
                                        ...activeFilters.region,
                                        state
                                    });
                                }}
                                sx={{
                                    borderRadius: '50px',
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            borderRadius: '16px',
                                            mt: 1,
                                            maxHeight: '300px',
                                        },
                                    },
                                }}
                            >
                                {STATES.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Cidade"
                            value={activeFilters.region?.city || ''}
                            onChange={(e) => {
                                const city = e.target.value === '' ? null : e.target.value;
                                onFilterChange('region', {
                                    ...activeFilters.region,
                                    city
                                });
                            }}
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                },
                            }}
                        />
                    </Grid>
                </Grid>
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
                    }}/>
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
                            InputLabelProps={{shrink: true}}
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
                            InputLabelProps={{shrink: true}}
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
            <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 4}}>
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

// Componente para o cabeçalho de coluna ordenável
const SortableHeaderCell = ({label, field, sortConfig, onSortChange}) => {
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
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
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
const FilterChip = ({label, colorscheme, onDelete}) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        switch (colorscheme) {
            case 'diabetes':
                return '#FFF9C4';
            case 'fumante':
                return '#E0F7FA';
            case 'internado':
                return '#E8EAF6';
            case 'idoso':
                return '#F3E5F5';
            case 'obeso':
                return '#FCE4EC';
            case 'hipertensao':
                return '#E8F5E9';
            case 'alergia':
                return '#FFECB3';
            case 'cardiopatia':
                return '#FFCDD2';
            case 'asma':
                return '#E1F5FE';
            case 'genero':
                return '#E3F2FD';
            case 'consultas':
                return '#E1F5FE';
            case 'primeira-consulta':
                return '#E8F5E9';
            default:
                return '#F5F5F5';
        }
    };

    return (
        <Chip
            label={label}
            onDelete={onDelete}
            deleteIcon={<CloseIcon fontSize="small"/>}
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
const ConditionChip = ({label, colorscheme, onClick, selected}) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        switch (colorscheme) {
            case 'diabetes':
                return '#FFF9C4';
            case 'fumante':
                return '#E0F7FA';
            case 'internado':
                return '#E8EAF6';
            case 'idoso':
                return '#F3E5F5';
            case 'obeso':
                return '#FCE4EC';
            case 'hipertensao':
                return '#E8F5E9';
            case 'alergia':
                return '#FFECB3';
            case 'cardiopatia':
                return '#FFCDD2';
            case 'asma':
                return '#E1F5FE';
            default:
                return '#F5F5F5';
        }
    };

    return (
        <Chip
            label={label}
            onClick={onClick}
            onDelete={selected ? onClick : undefined}
            deleteIcon={selected ? <CloseIcon fontSize="small"/> : undefined}
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
const FilterSection = ({title, children, actionElement}) => {
    return (
        <Box sx={{mb: 3}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5}}>
                <Typography variant="subtitle1" fontWeight={600} color="#424242">{title}</Typography>
                {actionElement}
            </Box>
            {children}
        </Box>
    );
};

// Componente StatusChip para exibição consistente em todo o app
const StatusChip = ({ status, onClick, size = 'medium' }) => {
    // Obter configurações de cor e estilo com base no status
    const getStatusConfig = (status) => {
        // Normalizar o status para comparação case-insensitive
        const normalizedStatus = status.toLowerCase();

        // Procurar o status nas opções predefinidas
        const statusOption = STATUS_OPTIONS.find(option =>
            option.value.toLowerCase() === normalizedStatus
        );

        // Se encontrou uma configuração, use-a
        if (statusOption) {
            return {
                bgColor: getBgColorFromStatusColor(statusOption.color),
                color: statusOption.color,
                icon: statusOption.icon
            };
        }

        // Casos específicos que podem não estar em STATUS_OPTIONS
        switch (normalizedStatus) {
            case 'pendente':
                return {
                    bgColor: '#F5F5F5',
                    color: '#757575',
                    icon: <EventNoteIcon fontSize="inherit" />
                };
            case 'reagendado':
                return {
                    bgColor: '#F3E5F5',
                    color: '#9C27B0',
                    icon: <ScheduleSendIcon fontSize="inherit" />
                };
            case 'primeira consulta':
                return {
                    bgColor: '#E3F2FD',
                    color: '#2196F3',
                    icon: <AddCircleOutlineIcon fontSize="inherit" />
                };
            case 'reag. pendente':
                return {
                    bgColor: '#FFF8E1',
                    color: '#FF9800',
                    icon: <ScheduleSendIcon fontSize="inherit" />
                };
            default:
                return {
                    bgColor: '#F5F5F5',
                    color: '#757575',
                    icon: <EventNoteIcon fontSize="inherit" />
                };
        }
    };

    // Função auxiliar para gerar cor de fundo com base na cor principal
    const getBgColorFromStatusColor = (color) => {
        switch (color) {
            case '#757575': return '#F5F5F5'; // cinza
            case '#9C27B0': return '#F3E5F5'; // roxo
            case '#2196F3': return '#E3F2FD'; // azul
            case '#FF9800': return '#FFF8E1'; // laranja
            case '#1C94E0': return '#E1F5FE'; // azul claro
            case '#1852FE': return '#E8F0FF'; // azul escuro
            case '#FF4B55': return '#FFEBEE'; // vermelho
            case '#7B4BC9': return '#EDE7F6'; // roxo claro
            case '#FFAB2B': return '#FFF8E1'; // amarelo
            case '#0CAF60': return '#E8F5E9'; // verde
            default: return '#F5F5F5'; // cinza padrão
        }
    };

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
};


// Botão para limpar filtros
const ClearButton = ({onClick}) => {
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


// Componente principal da página
const PatientsListPage = ({onPatientClick}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const {user} = useAuth();

    // Estados principais
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(isMobile ? VIEWS.GRID : VIEWS.TABLE);
    const [currentTab, setCurrentTab] = useState(TABS.ALL);
    const [page, setPage] = useState(1);
    const [favoritePatients, setFavoritePatients] = useState([]);
    const [consultations, setConsultations] = useState([]);

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newStatus, setNewStatus] = useState("pendente");

    const [statusHistory, setStatusHistory] = useState([]);


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



    const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);

    // Função auxiliar para extrair valores de dat
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

    const loadStatusHistory = useCallback(async (patientId) => {
        if (!patientId || !user?.uid) return;

        setStatusHistoryLoading(true);
        setStatusHistory([]); // Limpa histórico anterior

        try {
            // Chamada para a função real do FirebaseService
            const history = await FirebaseService.getPatientStatusHistory(user.uid, patientId);

            // Se chegamos aqui, temos dados reais ou um array vazio
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

    const handleStatusClick = useCallback((patient, currentStatus, event) => {
        event.stopPropagation();

        const statusToUse = patient.statusList?.[0] ??
            (() => {
                const last = getDateValue(patient, 'lastConsultationDate');
                const next = getDateValue(patient, 'nextConsultationDate');
                if (!last && next) return 'primeira consulta';
                if (patient.consultationRescheduled) {
                    return patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
                }
                return 'pendente';
            })();

        setSelectedPatient(patient);
        setNewStatus(statusToUse);
        setStatusDialogOpen(true);
    }, [loadStatusHistory]);

    useEffect(() => {
        if (statusDialogOpen && selectedPatient && statusHistory.length === 0) {
            loadStatusHistory(selectedPatient.id);
        }
    }, [statusDialogOpen, selectedPatient, statusHistory.length, loadStatusHistory]);


    // Estados para filtros
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        gender: null,
        conditions: [],
        status: null,
        appointmentType: null,
        dateRange: null,
        healthPlan: null,
        ageRange: null,
        region: { state: null, city: null }
    });

// Verificar se existem filtros ativos
    const hasActiveFilters = useMemo(() => {
        return activeFilters.gender !== null ||
            activeFilters.conditions.length > 0 ||
            activeFilters.status !== null ||
            activeFilters.appointmentType !== null ||
            activeFilters.dateRange !== null ||
            activeFilters.healthPlan !== null ||
            activeFilters.ageRange !== null ||
            activeFilters.region?.state !== null ||
            activeFilters.region?.city !== null;
    }, [activeFilters]);

// Função para limpar todos os filtros
    const handleClearFilters = () => {
        setActiveFilters({
            gender: null,
            conditions: [],
            status: null,
            appointmentType: null,
            dateRange: null,
            healthPlan: null,
            ageRange: null,
            region: { state: null, city: null }
        });
        handleFilterClose();
    };



    // Metrics (Estatísticas)
    const [metrics, setMetrics] = useState({
        totalPatients: 0,
        activePatients: 0,
        newPatients: 0,
        upcomingAppointments: 0
    });

    const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
    const [statusUpdateError, setStatusUpdateError] = useState(null);

    const handleStatusSave = useCallback(() => {
        if (!selectedPatient || !user?.uid) return;
        setStatusUpdateLoading(true);
        setStatusUpdateError(null);
        setStatusUpdateSuccess(false);

        // atualização otimista na UI
        setPatients(prev =>
            prev.map(p =>
                p.id === selectedPatient.id ? { ...p, statusList: [newStatus] } : p
            )
        );

        // dispara atualização no Firebase
        FirebaseService.updatePatientStatus(user.uid, selectedPatient.id, [newStatus])
            .then(() =>
                FirebaseService.addPatientStatusHistory(
                    user.uid,
                    selectedPatient.id,
                    newStatus,
                    ''
                )
            )
            .then(() => {
                setStatusUpdateSuccess(true);
                // Use apenas um timeout em vez de dois aninhados
                setTimeout(() => {
                    setStatusDialogOpen(false);
                }, 1000);
            })
            .catch(error => {
                console.error(error);
                setStatusUpdateError("Não foi possível atualizar o status.");
            })
            .finally(() => {
                setStatusUpdateLoading(false);
            });
    }, [selectedPatient, newStatus, user]);


    // Carregar dados iniciais
    useEffect(() => {
        if (!user?.uid) return;

        const loadData = async () => {
            setLoading(true);
            try {
                let patients = [];

                // Se tem filtros ativos, usa a API de filtragem
                if (hasActiveFilters) {
                    patients = await FirebaseService.filterPatients(user.uid, activeFilters);
                } else {
                    // Carrega todos os pacientes normalmente
                    patients = await FirebaseService.getPatientsByDoctor(user.uid);
                }

                // Atualiza o estado dos pacientes
                setPatients(patients);

                // Carrega as consultas para referência
                const consultationsData = await FirebaseService.listAllConsultations(user.uid);
                setConsultations(consultationsData);

                // Calcula métricas
                calculateMetrics(patients, consultationsData);

                // Atualiza os favoritos com base no campo "favorite"
                const favPatients = patients
                    .filter(patient => patient.favorite === true)
                    .map(patient => patient.id);
                setFavoritePatients(favPatients);

            } catch (error) {
                console.error("Erro ao carregar dados de pacientes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, hasActiveFilters, activeFilters]);

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

    // Auto-switch para grid view em mobile
    useEffect(() => {
        if (isMobile && viewMode !== VIEWS.GRID) {
            setViewMode(VIEWS.GRID);
        }
    }, [isMobile, viewMode]);

    const determinePatientStatus = (patient) => {
        if (!patient) return 'pendente'; // Proteção adicional

        // Primeiro, verificar se o paciente tem um statusList definido
        if (patient.statusList && Array.isArray(patient.statusList) && patient.statusList.length > 0) {
            return patient.statusList[0];
        }

        // Caso contrário, determinar com base em outros campos
        const lastConsultDate = getDateValue(patient, 'lastConsultationDate');
        const nextConsultDate = getDateValue(patient, 'nextConsultationDate');

        if (!lastConsultDate && nextConsultDate) {
            return 'primeira consulta';
        } else if (patient.consultationRescheduled) {
            return patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
        }

        // Verificar se há um status explícito definido
        if (patient.status) {
            return patient.status;
        }

        return 'pendente';
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

    const safeFormatDate = (date, formatString, defaultValue = '-') => {
        try {
            if (!date) return defaultValue;

            // Se a data já é um objeto Date
            if (date instanceof Date) {
                if (isNaN(date.getTime())) return defaultValue;
                return format(date, formatString, { locale: ptBR });
            }

            // Se é um timestamp ou string, tente converter
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) return defaultValue;

            return format(parsedDate, formatString, { locale: ptBR });
        } catch (error) {
            console.warn('Erro ao formatar data:', error, date);
            return defaultValue;
        }
    };

    // Aplicar todos os filtros ativos
    const applyActiveFilters = (patients) => {
        let filtered = [...patients];

        // Filtro de gênero
        if (activeFilters.gender) {
            filtered = filtered.filter(patient => {
                // Garante que o gênero do paciente seja tratado como string e convertido para lowercase
                const patientGender = typeof patient.gender === 'string' ? patient.gender.toLowerCase() : '';

                // Converte activeFilters.gender para lowercase
                const filterGender = activeFilters.gender.toLowerCase();

                // Verifica se é "ambos" ou se corresponde exatamente
                return filterGender === 'ambos' || patientGender === filterGender;
            });
        }

        // Filtro de condições
        if (activeFilters.conditions.length > 0) {
            filtered = filtered.filter(patient => {
                // Criar um array com todas as condições do paciente
                const patientConditions = [];

                // Verificar fumante
                if (patient.isSmoker === true ||
                    patient.condicoesClinicas?.ehFumante === "Sim" ||
                    (patient.chronicDiseases &&
                        Array.isArray(patient.chronicDiseases) &&
                        patient.chronicDiseases.some(d =>
                                typeof d === 'string' && (
                                    d.toLowerCase().includes("fumante") ||
                                    d.toLowerCase().includes("tabag")
                                )
                        ))) {
                    patientConditions.push('fumante');
                }

                // Verificar doenças crônicas em diferentes formatos
                const chronicArray = Array.isArray(patient.chronicDiseases) ?
                    patient.chronicDiseases :
                    Array.isArray(patient.condicoesClinicas?.doencas) ?
                        patient.condicoesClinicas.doencas : [];

                // Mapeamento de condições com flexibilidade para variações de texto
                chronicArray.forEach(disease => {
                    if (!disease) return;
                    const lowerDisease = disease.toLowerCase();
                    if (lowerDisease.includes('diabet')) patientConditions.push('diabetes');
                    if (lowerDisease.includes('hipertens') || lowerDisease.includes('pressão alta')) patientConditions.push('hipertensao');
                    if (lowerDisease.includes('obes')) patientConditions.push('obeso');
                    if (lowerDisease.includes('alergi')) patientConditions.push('alergia');
                    if (lowerDisease.includes('cardio') || lowerDisease.includes('coração')) patientConditions.push('cardiopatia');
                    if (lowerDisease.includes('asma') || lowerDisease.includes('respirat')) patientConditions.push('asma');
                });

                // Verificar status para "internado"
                if (patient.statusList && patient.statusList.includes("Internado")) {
                    patientConditions.push('internado');
                }

                // Verificar idoso (idade > 65)
                if (patient.birthDate) {
                    try {
                        const birthDate = typeof patient.birthDate === 'string'
                            ? parse(patient.birthDate, 'dd/MM/yyyy', new Date())
                            : new Date(patient.birthDate);

                        if (isValid(birthDate) && differenceInYears(new Date(), birthDate) >= 65) {
                            patientConditions.push('idoso');
                        }
                    } catch (e) {
                        console.warn(`Erro ao calcular idade:`, e);
                    }
                }

                // Verificar se alguma das condições filtradas está presente
                return activeFilters.conditions.some(condition =>
                    patientConditions.includes(condition)
                );
            });
        }

        // Filtro de status
        if (activeFilters.status) {
            filtered = filtered.filter(patient => {
                // Primeiro verificar statusList
                if (patient.statusList && patient.statusList.length > 0) {
                    // Verificar se o status filtrado está na lista
                    return patient.statusList.some(status =>
                        status.toLowerCase() === activeFilters.status.toLowerCase()
                    );
                }

                // Se não tiver statusList, usar a lógica anterior
                let status = determinePatientStatus(patient);
                return status.toLowerCase() === activeFilters.status.toLowerCase();
            });
        }

        // Filtro de tipo de consulta
        if (activeFilters.appointmentType) {
            filtered = filtered.filter(patient => {
                // Verificar consultationType em vários formatos possíveis
                const consultType = (patient.consultationType || patient.appointmentType || '').toLowerCase();
                return consultType === activeFilters.appointmentType.toLowerCase();
            });
        }

        // Filtro de plano de saúde
        if (activeFilters.healthPlan) {
            filtered = filtered.filter(patient => {
                // Verificar em healthPlans (array)
                if (Array.isArray(patient.healthPlans) && patient.healthPlans.length > 0) {
                    return patient.healthPlans.some(plan =>
                        plan.name?.toLowerCase().includes(activeFilters.healthPlan.toLowerCase())
                    );
                }

                // Verificar em healthPlan (objeto único)
                if (patient.healthPlan && typeof patient.healthPlan === 'object') {
                    return patient.healthPlan.name?.toLowerCase().includes(activeFilters.healthPlan.toLowerCase());
                }

                // Verificar status "Particular"
                if (activeFilters.healthPlan.toLowerCase() === 'particular' &&
                    patient.statusList &&
                    patient.statusList.includes('Particular')) {
                    return true;
                }

                return false;
            });
        }

        // Filtro de faixa etária
        if (activeFilters.ageRange) {
            filtered = filtered.filter(patient => {
                if (!patient.birthDate && !patient.dataNascimento) return false;

                try {
                    // Converter birthDate para objeto Date
                    const birthDateStr = patient.birthDate || patient.dataNascimento;
                    const birthDate = typeof birthDateStr === 'string'
                        ? parse(birthDateStr, 'dd/MM/yyyy', new Date())
                        : new Date(birthDateStr);

                    if (!isValid(birthDate)) return false;

                    const age = differenceInYears(new Date(), birthDate);

                    // Verificar a faixa etária selecionada
                    if (activeFilters.ageRange.includes('-')) {
                        // Faixa com intervalo: "0-12", "13-17", etc.
                        const [minAge, maxAge] = activeFilters.ageRange.split('-');
                        return age >= parseInt(minAge) && age <= parseInt(maxAge);
                    } else if (activeFilters.ageRange.includes('+')) {
                        // Faixa "65+" (idosos)
                        const minAge = parseInt(activeFilters.ageRange);
                        return age >= minAge;
                    }

                    return false;
                } catch (e) {
                    console.warn(`Erro ao calcular idade para filtro:`, e);
                    return false;
                }
            });
        }

        // Filtro de região (estado/cidade)
        if (activeFilters.region?.state || activeFilters.region?.city) {
            filtered = filtered.filter(patient => {
                let match = true;

                // Verificar estado
                if (activeFilters.region.state) {
                    const patientState = patient.endereco?.estado || patient.state;
                    match = match && patientState && patientState.toUpperCase() === activeFilters.region.state;
                }

                // Verificar cidade
                if (activeFilters.region.city) {
                    const patientCity = patient.endereco?.cidade || patient.city;
                    match = match && patientCity &&
                        patientCity.toLowerCase().includes(activeFilters.region.city.toLowerCase());
                }

                return match;
            });
        }

        // Filtro de período de consulta
        if (activeFilters.dateRange) {
            const {start, end} = activeFilters.dateRange;

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
        return safeFormatDate(date, 'dd/MM/yyyy');
    };


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

    const handleToggleFavorite = async (patientId) => {
        // Verifica se o paciente já está marcado como favorito
        const isCurrentlyFavorite = favoritePatients.includes(patientId);
        const newFavoriteStatus = !isCurrentlyFavorite;

        // Atualiza o estado local de forma otimista
        setFavoritePatients(prev =>
            newFavoriteStatus
                ? [...prev, patientId]
                : prev.filter(id => id !== patientId)
        );

        try {
            // Atualiza o status no Firebase
            await FirebaseService.updateFavoriteStatus(user.uid, patientId, newFavoriteStatus);
        } catch (error) {
            console.error("Erro ao atualizar favorito no Firebase:", error);
            // Se necessário, reverta o estado local
        }
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
        } else if (type === 'healthPlan') {
            setActiveFilters(prev => ({
                ...prev,
                healthPlan: null
            }));
        } else if (type === 'ageRange') {
            setActiveFilters(prev => ({
                ...prev,
                ageRange: null
            }));
        } else if (type === 'region') {
            if (value === 'state') {
                setActiveFilters(prev => ({
                    ...prev,
                    region: { ...prev.region, state: null }
                }));
            } else if (value === 'city') {
                setActiveFilters(prev => ({
                    ...prev,
                    region: { ...prev.region, city: null }
                }));
            } else {
                setActiveFilters(prev => ({
                    ...prev,
                    region: { state: null, city: null }
                }));
            }
        }
    };


    const handleCloseDialog = useCallback(() => {
        if (statusUpdateLoading) return; // Não feche durante o salvamento

        setStatusDialogOpen(false);

        // Limpar estados após a animação de fechamento
        setTimeout(() => {
            setStatusUpdateError(null);
            setStatusUpdateSuccess(false);
            setSelectedPatient(null);
        }, 300);
    }, [statusUpdateLoading]);


    const handleApplyFilters = () => {
        handleFilterClose();
    };

    // Skeletons para loading
    const renderSkeletonRows = () => {
        return Array(5).fill().map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Skeleton variant="circular" width={40} height={40} sx={{mr: 2}}/>
                        <Box>
                            <Skeleton variant="text" width={120}/>
                            <Skeleton variant="text" width={80} height={12}/>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell><Skeleton variant="circular" width={24} height={24}/></TableCell>
                <TableCell><Skeleton variant="text" width={30}/></TableCell>
                <TableCell><Skeleton variant="text" width={80}/></TableCell>
                <TableCell><Skeleton variant="text" width={80}/></TableCell>
                <TableCell><Skeleton variant="rectangular" width={90} height={24} sx={{borderRadius: 12}}/></TableCell>
                <TableCell align="right">
                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Skeleton variant="circular" width={32} height={32} sx={{ml: 1}}/>
                        <Skeleton variant="circular" width={32} height={32} sx={{ml: 1}}/>
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
                        <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                            <Skeleton variant="circular" width={50} height={50} sx={{mr: 2}}/>
                            <Box sx={{flex: 1}}>
                                <Skeleton variant="text" width="80%"/>
                                <Skeleton variant="text" width="40%"/>
                            </Box>
                            <Skeleton variant="circular" width={32} height={32}/>
                        </Box>
                        <Divider sx={{my: 1.5}}/>
                        <Box sx={{mt: 2}}>
                            <Skeleton variant="text" width="60%"/>
                            <Skeleton variant="text" width="40%"/>
                            <Skeleton variant="text" width="70%"/>
                            <Box sx={{display: 'flex', mt: 2, justifyContent: 'space-between'}}>
                                <Skeleton variant="rectangular" width={80} height={32} sx={{borderRadius: 16}}/>
                                <Skeleton variant="rectangular" width={100} height={32} sx={{borderRadius: 16}}/>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        ));
    };

    // Cartão de métricas
    const MetricsCardsSection = () => (
        <Grid container spacing={3} sx={{mb: 3}}>
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
                        <Typography variant="h4" sx={{mt: 1, fontWeight: 600, color: theme.palette.primary.main}}>
                            {loading ? <Skeleton width={60}/> : metrics.totalPatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {loading ? <Skeleton width={120}/> : '+3 pacientes nesta semana'}
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
                        <Typography variant="h4" sx={{mt: 1, fontWeight: 600, color: '#4CAF50'}}>
                            {loading ? <Skeleton width={60}/> : metrics.activePatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {loading ? (
                                <Skeleton width={120}/>
                            ) : (
                                <>
                                    <span
                                        style={{color: '#4CAF50'}}>{Math.round((metrics.activePatients / metrics.totalPatients) * 100) || 0}%</span> do
                                    total de pacientes
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
                        <Typography variant="h4" sx={{mt: 1, fontWeight: 600, color: '#2196F3'}}>
                            {loading ? <Skeleton width={60}/> : metrics.newPatients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {loading ? <Skeleton width={120}/> : 'Média de 3 por semana'}
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
                        <Typography variant="h4" sx={{mt: 1, fontWeight: 600, color: '#FF9800'}}>
                            {loading ? <Skeleton width={60}/> : metrics.upcomingAppointments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {loading ? <Skeleton
                                width={120}/> : `Próxima: ${metrics.upcomingAppointments > 0 ? 'Hoje' : 'Nenhuma'}`}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // Cabeçalho com abas
    const HeaderSection = () => (
        <Box sx={{mb: 3}}>
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
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            Todos os Pacientes
                            <Chip
                                label={metrics.totalPatients}
                                size="small"
                                sx={{ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600}}
                            />
                        </Box>
                    }
                    value={TABS.ALL}
                />
                <Tab
                    label={
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            Ativos
                            <Chip
                                label={metrics.activePatients}
                                size="small"
                                sx={{ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600}}
                            />
                        </Box>
                    }
                    value={TABS.ACTIVE}
                />
                <Tab
                    label={
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            Próximas Consultas
                            <Chip
                                label={metrics.upcomingAppointments}
                                size="small"
                                sx={{ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600}}
                            />
                        </Box>
                    }
                    value={TABS.UPCOMING}
                />
                <Tab
                    label={
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            Favoritos
                            <Chip
                                label={favoritePatients.length}
                                size="small"
                                sx={{ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600}}
                            />
                        </Box>
                    }
                    value={TABS.FAVORITE}
                />
                <Tab
                    label={
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            Recentes
                            <Chip
                                label={metrics.newPatients}
                                size="small"
                                sx={{ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600}}
                            />
                        </Box>
                    }
                    value={TABS.RECENT}
                />
            </Tabs>
        </Box>
    );



    // Barra de ferramentas com busca e filtros
    const ToolbarSection = () => {
        // handleSearch é chamado apenas quando o usuário para de digitar
        const handleSearch = useCallback((value) => {
            setSearchTerm(value);
        }, []);

        return (
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: isTablet ? 'column' : 'row',
                    alignItems: isTablet ? 'stretch' : 'center',
                    gap: 2
                }}
            >
                <SearchField
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setPage={setPage}
                    isTablet={isTablet}
                    theme={theme}
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
                            startIcon={<FilterAltIcon/>}
                            onClick={handleClearFilters}
                            sx={{
                                borderRadius: '50px',
                            }}
                        >
                            Limpar Filtros
                        </Button>
                    )}

                    <Box sx={{display: 'flex', gap: 1}}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FilterListIcon/>}
                            onClick={handleFilterClick}
                            color={hasActiveFilters ? "primary" : "inherit"}
                            sx={{
                                borderRadius: '50px',
                                fontWeight: hasActiveFilters ? 600 : 400
                            }}
                        >
                            Filtrar
                        </Button>

                        <ButtonGroup variant="outlined" sx={{
                            borderRadius: '50px', 
                            overflow: 'hidden',
                            display: isMobile ? 'none' : 'flex'
                        }}>
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
                                <ViewListIcon fontSize="small"/>
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
                                <GridViewIcon fontSize="small"/>
                            </Button>
                        </ButtonGroup>
                    </Box>
                </Box>
            </Box>
        );
    };


    // Chips de filtros ativos
    const ActiveFiltersSection = () => {
        if (!hasActiveFilters) return null;

        return (
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                {/* Filtro de gênero */}
                {activeFilters.gender && (
                    <FilterChip
                        label={`Gênero: ${activeFilters.gender}`}
                        colorscheme="genero"
                        onDelete={() => handleRemoveFilter('gender')}
                    />
                )}

                {/* Filtro de condições */}
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

                {/* Filtro de status */}
                {activeFilters.status && (
                    <FilterChip
                        label={`Status: ${STATUS_OPTIONS.find(s => s.value === activeFilters.status)?.label || activeFilters.status}`}
                        colorscheme="default"
                        onDelete={() => handleRemoveFilter('status')}
                    />
                )}

                {/* Filtro de tipo de consulta */}
                {activeFilters.appointmentType && (
                    <FilterChip
                        label={`Tipo: ${APPOINTMENT_TYPES.find(t => t.value === activeFilters.appointmentType)?.label || activeFilters.appointmentType}`}
                        colorscheme="consultas"
                        onDelete={() => handleRemoveFilter('appointmentType')}
                    />
                )}

                {/* Filtro de plano de saúde */}
                {activeFilters.healthPlan && (
                    <FilterChip
                        label={`Plano: ${HEALTH_PLAN_TYPES.find(p => p.value === activeFilters.healthPlan)?.label || activeFilters.healthPlan}`}
                        colorscheme="consultas"
                        onDelete={() => handleRemoveFilter('healthPlan')}
                    />
                )}

                {/* Filtro de faixa etária */}
                {activeFilters.ageRange && (
                    <FilterChip
                        label={`Idade: ${AGE_RANGES.find(r => r.value === activeFilters.ageRange)?.label || activeFilters.ageRange}`}
                        colorscheme="genero"
                        onDelete={() => handleRemoveFilter('ageRange')}
                    />
                )}

                {/* Filtro de localização - estado */}
                {activeFilters.region?.state && (
                    <FilterChip
                        label={`Estado: ${activeFilters.region.state}`}
                        colorscheme="default"
                        onDelete={() => handleRemoveFilter('region', 'state')}
                    />
                )}

                {/* Filtro de localização - cidade */}
                {activeFilters.region?.city && (
                    <FilterChip
                        label={`Cidade: ${activeFilters.region.city}`}
                        colorscheme="default"
                        onDelete={() => handleRemoveFilter('region', 'city')}
                    />
                )}

                {/* Filtro de período de consulta */}
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
            <Table sx={{minWidth: 650}}>
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
                            <TableCell colSpan={7} align="center" sx={{py: 6}}>
                                <Box sx={{textAlign: 'center'}}>
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
                                    <Typography variant="body2" color="text.secondary" sx={{maxWidth: 400, mx: 'auto'}}>
                                        Tente ajustar seus filtros ou termos de busca para encontrar pacientes, ou
                                        adicione um novo paciente.
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
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
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
                                                <Box sx={{display: 'flex', alignItems: 'center'}}>
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
                                                <MaleIcon sx={{color: theme.palette.info.main}}/>
                                            </Tooltip>
                                        ) : gender.toLowerCase() === 'feminino' ? (
                                            <Tooltip title="Feminino">
                                                <FemaleIcon sx={{color: '#E91E63'}}/>
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
                                                    {formatDistance(lastConsultDate, new Date(), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
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

                                            if (nextConsultDate && (isToday(nextConsultDate) || isAfter(nextConsultDate, new Date()))) {
                                                futureDates.push({
                                                    date: nextConsultDate
                                                });
                                            }

                                            if (lastConsultDate && (isToday(lastConsultDate) || isAfter(lastConsultDate, new Date()))) {
                                                futureDates.push({
                                                    date: lastConsultDate
                                                });
                                            }

                                            // Ordena as datas futuras (mais próxima primeiro)
                                            futureDates.sort((a, b) => a.date - b.date);

                                            // Se não há datas futuras
                                            if (futureDates.length === 0) {
                                                return <Typography variant="body2"
                                                                   color="text.secondary">-</Typography>;
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
                                                        <Typography variant="caption" color="error.main"
                                                                    fontWeight={500}>
                                                            Hoje
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </TableCell>

                                    <TableCell>
                                        <StatusChip
                                            status={determinePatientStatus(patient)}
                                            onClick={(e) => handleStatusClick(patient, null, e)}
                                            size="medium"
                                        />
                                    </TableCell>


                                    <TableCell align="right">
                                        <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                            <Tooltip
                                                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
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
                                                    {isFavorite ? <StarIcon/> : <StarBorderIcon/>}
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
                                                    <KeyboardArrowRightIcon/>
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
            <Dialog
                open={statusDialogOpen}
                keepMounted
                disablePortal
                BackdropProps={{
                       invisible: true
                }}
                transitionDuration={0}
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        minWidth: '400px',
                        maxWidth: '90vw'
                    }
                }}
                disableEscapeKeyDown={statusUpdateLoading}
                onBackdropClick={(e) => { if (statusUpdateLoading) e.stopPropagation(); }}
            >
                <DialogTitle sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FilterAltIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
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

                    {/* Botões de status - Corrigindo o problema do flickering */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {STATUS_OPTIONS.filter(option => option.value !== "").map(option => {
                            // Use uma função normal em vez de useCallback
                            const handleStatusButtonClick = () => {
                                if (!statusUpdateLoading) {
                                    setNewStatus(option.value);
                                }
                            };

                            return (
                                <Button
                                    key={option.value}
                                    variant={newStatus === option.value ? "contained" : "outlined"}
                                    onClick={handleStatusButtonClick}
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
                            );
                        })}
                    </Box>

                    {/* O restante do Dialog permanece igual */}
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
                        <Typography variant="body2" color="text.secondary" sx={{maxWidth: 400, mx: 'auto'}}>
                            Tente ajustar seus filtros ou termos de busca para encontrar pacientes, ou adicione um novo
                            paciente.
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
                                <CardContent sx={{p: 3, flex: 1, display: 'flex', flexDirection: 'column'}}>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
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
                                        <Box sx={{flex: 1}}>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <Typography variant="subtitle1" fontWeight={600} noWrap
                                                            sx={{maxWidth: '80%'}}>
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
                                            {isFavorite ? <StarIcon/> : <StarBorderIcon/>}
                                        </IconButton>
                                    </Box>

                                    <Divider sx={{my: 1.5}}/>

                                    <Box sx={{mb: 'auto'}}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {gender.toLowerCase() === 'masculino' ? (
                                                    <Tooltip title="Masculino">
                                                        <MaleIcon sx={{ color: theme.palette.info.main, mr: 0.5, fontSize: '1rem' }}/>
                                                    </Tooltip>
                                                ) : gender.toLowerCase() === 'feminino' ? (
                                                    <Tooltip title="Feminino">
                                                        <FemaleIcon sx={{ color: '#E91E63', mr: 0.5, fontSize: '1rem' }}/>
                                                    </Tooltip>
                                                ) : (
                                                    '-'
                                                )}
                                                <Typography variant="body2">{age} anos</Typography>
                                            </Box>
                                            <StatusChip
                                                status={determinePatientStatus(patient)}
                                                onClick={(e) => handleStatusClick(patient, null, e)}
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{mt: 2}}>
                                            {/* Exibição da última consulta (no passado) */}
                                            {lastConsultDate && isPast(lastConsultDate) && (
                                                <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                                                    <EventNoteIcon fontSize="small"
                                                                   sx={{color: 'text.secondary', mr: 1}}/>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Última: {formatDate(lastConsultDate)}
                                                        <Typography variant="caption" component="span"
                                                                    color="text.secondary" sx={{ml: 0.5}}>
                                                            ({formatDistance(lastConsultDate, new Date(), {
                                                            addSuffix: true,
                                                            locale: ptBR
                                                        })})
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

                                                if (nextConsultDate && (isToday(nextConsultDate) || isAfter(nextConsultDate, new Date()))) {
                                                    futureDates.push({
                                                        date: nextConsultDate,
                                                        isNext: true
                                                    });
                                                }

                                                if (lastConsultDate && (isToday(lastConsultDate) || isAfter(lastConsultDate, new Date()))) {
                                                    futureDates.push({
                                                        date: lastConsultDate,
                                                        isNext: false
                                                    });
                                                }

                                                // Ordena as datas futuras (mais próxima primeiro)
                                                futureDates.sort((a, b) => a.date - b.date);

                                                // Retorna as datas formatadas
                                                return futureDates.map((dateObj, index) => {
                                                    const isToday = dateObj.date && isValid(dateObj.date) &&
                                                        safeFormatDate(dateObj.date, 'yyyy-MM-dd') === safeFormatDate(new Date(), 'yyyy-MM-dd');

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
                                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                    <CalendarTodayIcon fontSize="small"
                                                                       sx={{color: 'text.secondary', mr: 1}}/>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Sem consultas agendadas
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        mt: 2,
                                        pt: 2,
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                        justifyContent: 'space-between'
                                    }}>
                                        <Button
                                            size="small"
                                            startIcon={<EventAvailableIcon/>}
                                            variant="outlined"
                                            sx={{borderRadius: '50px', fontSize: '0.75rem'}}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Função para agendamento
                                            }}
                                        >
                                            Agendar
                                        </Button>

                                        <Button
                                            size="small"
                                            endIcon={<KeyboardArrowRightIcon/>}
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
        <Box sx={{p: 0, backgroundColor: '#F4F9FF'}}>
            {/* Cabeçalho e estatísticas */}
            <HeaderSection/>

            {/* Cards de métricas */}
            <MetricsCardsSection/>

            {/* Barra de ferramentas */}
            <ToolbarSection/>

            {/* Chips de filtros ativos */}
            <ActiveFiltersSection/>

            {/* Conteúdo principal: alternância entre visualização de tabela e grid */}
            {viewMode === VIEWS.TABLE ? <TableViewSection/> : <GridViewSection/>}

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