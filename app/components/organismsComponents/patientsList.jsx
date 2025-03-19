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
    ToggleButtonGroup,
    ToggleButton,
    Skeleton,
    useTheme,
    alpha,
    Popover,
    Button,
    FormControl,
    Select,
    MenuItem,
    Radio,
    RadioGroup,
    FormControlLabel,
    useMediaQuery
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
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { format, isToday, isPast, parseISO, isValid, parse, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constantes
const PATIENT_CONDITIONS = [
    { label: 'Diabetes', value: 'diabetes', color: 'diabetes' },
    { label: 'Fumante', value: 'fumante', color: 'fumante' },
    { label: 'Internado', value: 'internado', color: 'internado' },
    { label: 'Idoso', value: 'idoso', color: 'idoso' },
    { label: 'Obeso', value: 'obeso', color: 'obeso' },
    { label: 'Hipertensão', value: 'hipertensao', color: 'hipertensao' },
];

const STATUS_OPTIONS = [
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
                color: '#A2ADB8',
                fontWeight: 500,
                fontSize: '0.75rem',
                '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {label}
                <Box
                    component="img"
                    src="/organizaricon.svg"
                    alt="Organizar"
                    sx={{
                        width: 12,
                        height: 12,
                        ml: 0.5,
                        opacity: isActive ? 1 : 0.5
                    }}
                />
            </Box>
        </TableCell>
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
                <Typography variant="subtitle1" fontWeight={500}>{title}</Typography>
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
                fontWeight: 500,
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

const FilterMenu = ({ activeFilters, onFilterChange, onClearFilters }) => {
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
                        <MenuItem value="">Selecionar Status</MenuItem>
                        {STATUS_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </FilterSection>

            {/* Filtro de Próxima Consulta */}
            <FilterSection title="Próxima Consulta">
                <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<CalendarTodayIcon />}
                    sx={{
                        borderRadius: '50px',
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        padding: '8px 16px',
                    }}
                >
                    Selecionar Data
                </Button>
            </FilterSection>

            {/* Botão para aplicar filtros */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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
                    onClick={onClearFilters}
                >
                    Limpar Filtros
                </Button>
            </Box>
        </Box>
    );
};

const PatientsListCard = ({ patients, loading, onPatientClick }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [currentMode, setCurrentMode] = useState('pacientes');
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
        consultDateRange: {
            first: null,
            last: null,
            next: null
        }
    });

    // Função auxiliar para extrair valores de data - memoizada para melhor performance
    const getDateValue = useMemo(() => (patient, field) => {
        if (!patient[field]) return null;

        if (patient[field] instanceof Date) {
            return patient[field];
        }

        if (typeof patient[field].toDate === 'function') {
            return patient[field].toDate();
        }

        if (typeof patient[field] === 'string') {
            const parsedDate = parseISO(patient[field]);
            if (isValid(parsedDate)) {
                return parsedDate;
            }
        }

        return null;
    }, []);

    // Filtragem e ordenação dos pacientes
    useEffect(() => {
        if (!patients) {
            setFilteredPatients([]);
            return;
        }

        // Aplicar pesquisa
        let filtered = [...patients];

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
                patient.gender === activeFilters.gender ||
                activeFilters.gender === 'Ambos'
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

        // Aplicar ordenação
        filtered = [...filtered].sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            // Tratamento especial para campos de data
            if (sortConfig.field === 'lastConsultationDate' || sortConfig.field === 'nextConsultationDate') {
                aValue = getDateValue(a, sortConfig.field);
                bValue = getDateValue(b, sortConfig.field);

                if (!aValue) return 1;
                if (!bValue) return -1;
                if (!aValue && !bValue) return 0;

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
    }, [patients, searchTerm, sortConfig, activeFilters, getDateValue]);

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
        activeFilters.status !== null ||
        activeFilters.consultDateRange.first !== null ||
        activeFilters.consultDateRange.last !== null ||
        activeFilters.consultDateRange.next !== null;

    // Manipuladores de eventos
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setCurrentMode(newMode);
        }
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
        } else if (type === 'dateRange') {
            setActiveFilters(prev => ({
                ...prev,
                consultDateRange: {
                    ...prev.consultDateRange,
                    [value]: null
                }
            }));
        }
    };

    const handleClearFilters = () => {
        setActiveFilters({
            gender: null,
            conditions: [],
            status: null,
            consultDateRange: {
                first: null,
                last: null,
                next: null
            }
        });
        handleFilterClose();
    };

    // Renderização dos esqueletos durante carregamento
    const renderSkeletonRows = () => {
        return Array(5).fill().map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                        <Skeleton variant="text" width={120} />
                    </Box>
                </TableCell>
                <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={30} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 12 }} /></TableCell>
                <TableCell align="right"><Skeleton variant="circular" width={24} height={24} /></TableCell>
            </TableRow>
        ));
    };

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '40px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: '#D8E8FF',
                overflow: 'hidden',
                height: '400px', // altura fixa para o Card
                display: 'flex',
                flexDirection: 'column'
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
                {/* Cabeçalho e área de filtros */}
                <Box sx={{ p: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                            gap: 2
                        }}
                    >
                        {/* Título estilizado */}
                        <Box
                            sx={{
                                borderRadius: '50px',
                                backgroundColor: '#1852FE',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant="h5" fontSize="16px" fontWeight="bold" sx={{ color: '#D8E8FF' }}>
                                Pacientes
                            </Typography>
                        </Box>

                        {/* Campo de busca */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField
                                placeholder="Pesquise por pacientes..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: '50px',
                                        backgroundColor: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.divider
                                        }
                                    }
                                }}
                                variant="outlined"
                                size="small"
                                fullWidth
                            />

                            <IconButton
                                sx={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '50%',
                                    width: 40,
                                    height: 40,
                                    color: hasActiveFilters ? theme.palette.primary.main : 'inherit',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.1) }
                                }}
                                onClick={handleFilterClick}
                            >
                                <FilterListIcon />
                            </IconButton>

                            <IconButton
                                sx={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '50%',
                                    width: 40,
                                    height: 40,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.1) }
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {hasActiveFilters && (
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
                                    label={`Status: ${activeFilters.status.charAt(0).toUpperCase() +
                                    activeFilters.status.slice(1)}`}
                                    colorscheme="default"
                                    onDelete={() => handleRemoveFilter('status')}
                                />
                            )}
                        </Box>
                    )}
                </Box>

                {/* Container flexível para a tabela */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <TableContainer
                        sx={{
                            backgroundColor: 'white',
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px',
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            height: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            border: `1px solid ${theme.palette.divider}`,
                            marginBottom: 0,
                            paddingBottom: 0,
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            }
                        }}
                    >
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <SortableHeaderCell
                                        label="Nome"
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
                                    <TableCell sx={{ backgroundColor: '#F9FAFB', width: 50 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    renderSkeletonRows()
                                ) : filteredPatients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                Nenhum paciente encontrado
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.map((patient) => {
                                        const patientName = patient.patientName || 'Sem nome';
                                        // Usamos patient.gender para manter consistência com o filtro
                                        const gender = patient.gender || 'Não informado';
                                        let age = '-';

                                        // Cálculo da idade a partir do campo birthDate (formato "dd/MM/yyyy")
                                        if (patient.birthDate) {
                                            const parsedBirthDate = parse(patient.birthDate, 'dd/MM/yyyy', new Date());
                                            if (isValid(parsedBirthDate)) {
                                                age = differenceInYears(new Date(), parsedBirthDate);
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

                                        let status = 'pendente';
                                        if (!lastConsultDate && nextConsultDate) {
                                            status = 'primeira consulta';
                                        } else if (patient.consultationRescheduled) {
                                            status = patient.consultationConfirmed
                                                ? 'reagendado'
                                                : 'reag. pendente';
                                        }

                                        const isTelemedicine =
                                            patient.consultationType === 'Telemedicina';

                                        return (
                                            <TableRow
                                                key={patient.id}
                                                hover
                                                onClick={() => handlePatientClick(patient.id)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: alpha(
                                                            theme.palette.primary.main,
                                                            0.03
                                                        )
                                                    },
                                                    '& td': {
                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                        padding: '12px 16px'
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar
                                                            src={patient.patientPhotoUrl}
                                                            alt={patientName}
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                mr: 1.5,
                                                                fontSize: '0.875rem',
                                                                backgroundColor: alpha(
                                                                    theme.palette.primary.main,
                                                                    0.1
                                                                ),
                                                                color: theme.palette.primary.main,
                                                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
                                                            }}
                                                        >
                                                            {patientName.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {patientName}
                                                            {isTelemedicine && (
                                                                <VideoCallIcon
                                                                    fontSize="small"
                                                                    sx={{
                                                                        ml: 0.5,
                                                                        color: theme.palette.primary.main,
                                                                        verticalAlign: 'middle'
                                                                    }}
                                                                />
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    {gender.toLowerCase() === 'masculino' ? (
                                                        <Box
                                                            component="img"
                                                            src="/masculino.svg"
                                                            alt="Masculino"
                                                            sx={{ width: 24, height: 24 }}
                                                        />
                                                    ) : gender.toLowerCase() === 'feminino' ? (
                                                        <Box
                                                            component="img"
                                                            src="/feminino.svg"
                                                            alt="Feminino"
                                                            sx={{ width: 24, height: 24 }}
                                                        />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">{age}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(lastConsultDate)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(nextConsultDate)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                                                        size="small"
                                                        sx={{
                                                            borderRadius: '12px',
                                                            height: 24,
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
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePatientClick(patient.id);
                                                        }}
                                                        sx={{
                                                            color: theme.palette.primary.main,
                                                            transition: 'transform 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'translateX(2px)'
                                                            }
                                                        }}
                                                    >
                                                        <ChevronRightIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
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
                    />
                </Popover>
            </CardContent>
        </Card>
    );
};

export default PatientsListCard;
