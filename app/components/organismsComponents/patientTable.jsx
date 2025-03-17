"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Paper,
    Popover,
    InputAdornment,
    Menu,
    MenuItem,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Select,
    InputLabel,
    OutlinedInput,
    Checkbox,
    Drawer,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
    alpha,
    styled,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Close as CloseIcon,
    ChevronRight as ChevronRightIcon,
    Female as FemaleIcon,
    Male as MaleIcon,
    CalendarToday as CalendarTodayIcon,
    CalendarMonth as CalendarMonthIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import FirebaseService from '../../../lib/FirebaseService';
import { format, parseISO, isValid, isFuture, isPast, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import {useAuth} from '../authProvider'

// Estilos personalizados
const MainContainer = styled(Box)(({ theme }) => ({
    width: '1132px',
    height: '605px',
    borderRadius: '40px',
    border: '1px solid #EAECEF',
    background: '#D8E8FF',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
    position: 'relative',
}));

const ToggleContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    background: 'white',
    borderRadius: '30px',
    border: '1px solid #EAECEF',
    padding: '4px',
    '& .MuiToggleButtonGroup-grouped': {
        border: 'none',
        borderRadius: '24px !important',
        margin: '0 2px',
        '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            }
        },
        '&:not(.Mui-selected)': {
            backgroundColor: 'transparent',
            color: theme.palette.text.primary,
            '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
        },
    },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
    fontWeight: 500,
    padding: '8px 24px',
    textTransform: 'none',
    minWidth: '100px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    flex: 1,
    '& .MuiOutlinedInput-root': {
        borderRadius: '50px',
        backgroundColor: 'white',
        '& fieldset': {
            borderColor: '#EAECEF',
        },
        '&:hover fieldset': {
            borderColor: '#D1D5DB',
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
    '& .MuiInputBase-input': {
        padding: '14px 16px',
        fontFamily: 'Gellix, sans-serif',
    },
    '& .MuiInputAdornment-root': {
        marginLeft: '8px',
    }
}));

const FilterButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: 'white',
    border: '1px solid #EAECEF',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
}));

const TableContainerStyled = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '430px',
    borderRadius: '40px',
    borderRight: '1px solid #EAECEF',
    borderBottom: '1px solid #EAECEF',
    borderLeft: '1px solid #EAECEF',
    background: '#FFF',
    overflow: 'hidden',
    marginTop: '10px',
}));

const FilterChip = styled(Chip)(({ theme, colorscheme }) => {
    let bgColor;
    let textColor = '#111E5A';

    switch (colorscheme) {
        case 'diabetes':
            bgColor = '#FFF9C4';
            break;
        case 'fumante':
            bgColor = '#E0F7FA';
            break;
        case 'internado':
            bgColor = '#E8EAF6';
            break;
        case 'idoso':
            bgColor = '#F3E5F5';
            break;
        case 'obeso':
            bgColor = '#FCE4EC';
            break;
        case 'hipertensao':
            bgColor = '#E8F5E9';
            break;
        case 'genero':
            bgColor = '#E3F2FD';
            break;
        case 'consultas':
            bgColor = '#E1F5FE';
            break;
        case 'primeira-consulta':
            bgColor = '#E8F5E9';
            break;
        default:
            bgColor = '#F5F5F5';
    }

    return {
        margin: '0 4px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '50px',
        fontWeight: 500,
        '& .MuiChip-deleteIcon': {
            color: textColor,
            '&:hover': {
                color: alpha(textColor, 0.7),
            },
        },
    };
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    padding: '16px',
    borderBottom: '1px solid #EAECEF',
    fontWeight: 400,
    color: theme.palette.text.primary,
    fontFamily: 'Gellix, sans-serif',
}));

const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    padding: '16px',
    borderBottom: '1px solid #EAECEF',
    fontFamily: 'Gellix, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    color: '#A2ADB8',
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: '#F9FAFB',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
}));

const SortIcon = styled(Box)(({ theme, active }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
    let bgColor;
    let textColor;

    switch (status.toLowerCase()) {
        case 'pendente':
            bgColor = '#F5F5F5';
            textColor = '#757575';
            break;
        case 'reagendado':
            bgColor = '#F3E5F5';
            textColor = '#9C27B0';
            break;
        case 'primeira consulta':
            bgColor = '#E3F2FD';
            textColor = '#2196F3';
            break;
        case 'reag. pendente':
            bgColor = '#FFF8E1';
            textColor = '#FF9800';
            break;
        default:
            bgColor = '#F5F5F5';
            textColor = '#757575';
    }

    return {
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '50px',
        fontWeight: 500,
    };
});

const GenderIcon = styled(Box)(({ theme, gender }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const FilterMenu = styled(Box)(({ theme }) => ({
    width: '541px',
    height: '517px',
    borderRadius: '30px',
    border: '1px solid #EAECEF',
    background: '#FFF',
    boxShadow: '0px 4px 10px 0px rgba(0, 0, 0, 0.07)',
    padding: '24px',
}));

// Componente estilizado usando a API de "styled" do Material-UI
const StyledSearchField = styled(TextField)(({ theme }) => ({
    // Ajuste a largura ou remova se quiser que seja responsivo
    width: '100%',
    maxWidth: 400,

    '& .MuiOutlinedInput-root': {
        // Borda arredondada mais pronunciada
        borderRadius: '24px',
        backgroundColor: '#F5F9FF', // Ajuste para a cor de fundo desejada

        // Estilos do campo ao focar ou passar o mouse
        '& fieldset': {
            borderColor: '#DCE3EE', // Borda padrão
        },
        '&:hover fieldset': {
            borderColor: '#B8C5D9', // Borda ao passar o mouse
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main, // Borda ao focar
            borderWidth: 1,
        },
    },

    // Espaçamento interno do texto
    '& .MuiOutlinedInput-input': {
        padding: '10px 14px',
    },

    // Cor do ícone
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: '#8E9BB2',
    },
}));

function SearchField({ searchTerm, onSearchChange }) {
    return (
        <StyledSearchField
            placeholder="Pesquise por pacientes..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
        />
    );
}


const FilterSection = styled(Box)(({ theme }) => ({
    marginBottom: '24px',
}));

const FilterTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    marginBottom: '16px',
    color: theme.palette.text.primary,
}));

const DateRangeButton = styled(Button)(({ theme, selected }) => ({
    borderRadius: '50px',
    border: `1px solid ${selected ? theme.palette.primary.main : '#EAECEF'}`,
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'white',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '8px 16px',
    '&:hover': {
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05),
    },
}));

const ConditionChip = styled(Chip)(({ theme, colorscheme }) => {
    let bgColor;

    switch (colorscheme) {
        case 'diabetes':
            bgColor = '#FFF9C4';
            break;
        case 'fumante':
            bgColor = '#E0F7FA';
            break;
        case 'internado':
            bgColor = '#E8EAF6';
            break;
        case 'idoso':
            bgColor = '#F3E5F5';
            break;
        case 'obeso':
            bgColor = '#FCE4EC';
            break;
        case 'hipertensao':
            bgColor = '#E8F5E9';
            break;
        default:
            bgColor = '#F5F5F5';
    }

    return {
        margin: '4px',
        backgroundColor: bgColor,
        color: '#111E5A',
        borderRadius: '50px',
        fontWeight: 500,
        border: 'none',
        '& .MuiChip-deleteIcon': {
            color: '#111E5A',
            '&:hover': {
                color: alpha('#111E5A', 0.7),
            },
        },
    };
});

const ClearButton = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 500,
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    '&:hover': {
        textDecoration: 'underline',
    },
}));

const DatePickerButton = styled(Button)(({ theme }) => ({
    borderRadius: '50px',
    border: `1px solid #EAECEF`,
    backgroundColor: 'white',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '8px 16px',
    justifyContent: 'space-between',
    width: '100%',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
}));

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

const PatientsTable = ({ onPatientClick }) => {
    // Estado para os dados dos pacientes
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useAuth();


    // Estado para o campo de pesquisa
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para a modalidade atual (Pacientes ou Receitas)
    const [currentMode, setCurrentMode] = useState('pacientes');

    // Estados para os filtros
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

    const handlePatientClick = (patientId) => {
        if (onPatientClick) {
            onPatientClick(patientId);
        }
    };


    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        let birth;
        if (birthDate instanceof Date) {
            birth = birthDate;
        } else if (birthDate && typeof birthDate.toDate === 'function') {
            birth = birthDate.toDate();
        } else if (typeof birthDate === 'string') {
            // Supondo o formato "DD/MM/YYYY"
            const [day, month, year] = birthDate.split('/');
            birth = new Date(year, month - 1, day);
        } else {
            birth = new Date(birthDate);
        }
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };


    // Estados para ordenação
    const [sortConfig, setSortConfig] = useState({
        key: 'nome',
        direction: 'asc'
    });

    // Carregar dados dos pacientes
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoading(true);
                if (!user || !user.uid) return; // Aguarda o usuário carregar
                const doctorId = user.uid;
                const patientsData = await FirebaseService.getPatientsByDoctor(doctorId);

                const processedData = patientsData.map(patient => {
                    const conditions = [];
                    if (patient.isSmoker) conditions.push('fumante');
                    if (patient.chronicDiseases?.includes('Diabetes')) conditions.push('diabetes');
                    if (patient.chronicDiseases?.includes('Hipertensão')) conditions.push('hipertensao');

                    let status = 'pendente';
                    if (!patient.lastConsultationDate && patient.nextConsultationDate) {
                        status = 'primeira consulta';
                    } else if (patient.consultationRescheduled) {
                        status = patient.consultationConfirmed ? 'reagendado' : 'reag. pendente';
                    }

                    return {
                        id: patient.id,
                        nome: patient.patientName,
                        genero: patient.patientGender || 'Não informado',
                        idade: patient.patientAge || calculateAge(patient.birthDate),
                        ultimaConsulta: patient.lastConsultationDate ? new Date(patient.lastConsultationDate.toDate()) : null,
                        proximaConsulta: patient.nextConsultationDate ? new Date(patient.nextConsultationDate.toDate()) : null,
                        status: status,
                        conditions: conditions,
                        email: patient.patientEmail,
                        telefone: patient.patientPhone,
                        endereco: patient.patientAddress,
                        cpf: patient.patientCPF,
                        tipoSanguineo: patient.bloodType,
                        alergias: patient.allergies || [],
                        medicamentos: patient.medications || [],
                    };
                });

                setPatients(processedData);
                setFilteredPatients(processedData);
            } catch (err) {
                console.error("Erro ao carregar pacientes:", err);
                setError("Não foi possível carregar a lista de pacientes.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [user]);

    // Aplicar filtragem quando os filtros ou termos de pesquisa mudarem
    useEffect(() => {
        let result = [...patients];

        // Aplicar termo de pesquisa
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(patient =>
                patient.nome.toLowerCase().includes(searchLower) ||
                patient.email?.toLowerCase().includes(searchLower) ||
                patient.cpf?.includes(searchTerm)
            );
        }

        // Aplicar filtro de gênero
        if (activeFilters.gender) {
            result = result.filter(patient =>
                patient.genero.toLowerCase() === activeFilters.gender.toLowerCase()
            );
        }

        // Aplicar filtro de condições
        if (activeFilters.conditions.length > 0) {
            result = result.filter(patient =>
                activeFilters.conditions.some(condition =>
                    patient.conditions.includes(condition)
                )
            );
        }

        // Aplicar filtro de status
        if (activeFilters.status) {
            result = result.filter(patient =>
                patient.status.toLowerCase() === activeFilters.status.toLowerCase()
            );
        }

        // Aplicar filtros de data
        if (activeFilters.consultDateRange.first) {
            const { first } = activeFilters.consultDateRange;
            result = result.filter(patient => {
                if (!patient.ultimaConsulta) return false;
                return patient.ultimaConsulta >= first.startDate &&
                    patient.ultimaConsulta <= first.endDate;
            });
        }

        if (activeFilters.consultDateRange.next) {
            const { next } = activeFilters.consultDateRange;
            result = result.filter(patient => {
                if (!patient.proximaConsulta) return false;
                return patient.proximaConsulta >= next.startDate &&
                    patient.proximaConsulta <= next.endDate;
            });
        }

        // Aplicar ordenação
        result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null) return 1;
            if (bValue === null) return -1;

            if (sortConfig.key === 'ultimaConsulta' || sortConfig.key === 'proximaConsulta') {
                if (!aValue) return 1;
                if (!bValue) return -1;
                return sortConfig.direction === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            if (typeof aValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortConfig.direction === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        });

        setFilteredPatients(result);
    }, [patients, searchTerm, activeFilters, sortConfig]);



    const formatDate = (date) => {
        if (!date) return '-';
        try {
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return '-';
        }
    };

    // Handlers
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setCurrentMode(newMode);
        }
    };

    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleGenderChange = (gender) => {
        setActiveFilters(prev => ({
            ...prev,
            gender: prev.gender === gender ? null : gender
        }));
    };

    const handleConditionToggle = (condition) => {
        setActiveFilters(prev => {
            const conditions = [...prev.conditions];
            const index = conditions.indexOf(condition);

            if (index === -1) {
                conditions.push(condition);
            } else {
                conditions.splice(index, 1);
            }

            return {
                ...prev,
                conditions
            };
        });
    };

    const handleStatusChange = (event) => {
        setActiveFilters(prev => ({
            ...prev,
            status: event.target.value === '' ? null : event.target.value
        }));
    };

    const handleDateRangeChange = (type, range) => {
        setActiveFilters(prev => ({
            ...prev,
            consultDateRange: {
                ...prev.consultDateRange,
                [type]: range
            }
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
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Determinar se existem filtros ativos
    const hasActiveFilters = activeFilters.gender !== null ||
        activeFilters.conditions.length > 0 ||
        activeFilters.status !== null ||
        activeFilters.consultDateRange.first !== null ||
        activeFilters.consultDateRange.last !== null ||
        activeFilters.consultDateRange.next !== null;

    // Renderizar o ícone de ordenação
    const renderSortIcon = (key) => {
        return (
            <Box
                component="img"
                src="/organizaricon.svg"
                alt="Organizar"
                sx={{
                    width: '12px',
                    height: '12px',
                    ml: 0.5,
                    opacity: sortConfig.key === key ? 1 : 0.5,
                }}
            />
        );
    };

    // Componente de filtros
    const filtersPopover = (
        <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={handleFilterClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            PaperProps={{
                sx: {
                    borderRadius: '30px',
                    width: '541px',
                    maxHeight: '517px',
                    overflowY: 'auto', // Permite scroll vertical
                }
            }}
        >
            <FilterMenu>
                {/* Filtro de Gênero */}
                <FilterSection>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <FilterTitle>Gênero</FilterTitle>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
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
                <FilterSection>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <FilterTitle>Condição do Paciente</FilterTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                {activeFilters.conditions.length} Selecionadas
                            </Typography>
                            <ClearButton onClick={() => setActiveFilters(prev => ({ ...prev, conditions: [] }))}>
                                LIMPAR
                            </ClearButton>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {PATIENT_CONDITIONS.map(condition => (
                            <ConditionChip
                                key={condition.value}
                                label={condition.label}
                                colorscheme={condition.color}
                                onClick={() => handleConditionToggle(condition.value)}
                                onDelete={() => handleConditionToggle(condition.value)}
                                deleteIcon={activeFilters.conditions.includes(condition.value) ? <CloseIcon /> : null}
                            />
                        ))}
                    </Box>
                </FilterSection>

                {/* Filtro de Status */}
                <FilterSection>
                    <FilterTitle>Status</FilterTitle>
                    <FormControl fullWidth variant="outlined" size="small">
                        <Select
                            value={activeFilters.status || ''}
                            onChange={handleStatusChange}
                            displayEmpty
                            sx={{
                                borderRadius: '50px',
                                '.MuiOutlinedInput-notchedOutline': { borderColor: '#EAECEF' },
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
                <FilterSection>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FilterTitle>Próxima Consulta</FilterTitle>
                    </Box>
                    <DatePickerButton
                        endIcon={<CalendarTodayIcon />}
                    >
                        Selecionar Data
                    </DatePickerButton>
                </FilterSection>

                {/* Filtro de Primeira Consulta */}
                <FilterSection>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FilterTitle>Primeira Consulta</FilterTitle>
                    </Box>
                    <DatePickerButton
                        endIcon={<CalendarTodayIcon />}
                    >
                        20 Nov - 23 Nov 2024
                    </DatePickerButton>
                </FilterSection>

                {/* Filtro de Última Consulta */}
                <FilterSection>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FilterTitle>Última Consulta</FilterTitle>
                    </Box>
                    <DatePickerButton
                        endIcon={<CalendarTodayIcon />}
                    >
                        Selecionar Data
                    </DatePickerButton>
                </FilterSection>
            </FilterMenu>
        </Popover>
    );

    // Renderização condicional durante carregamento
    if (loading && patients.length === 0) {
        return (
            <MainContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            </MainContainer>
        );
    }

    // Renderização se houver erro
    if (error) {
        return (
            <MainContainer>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error" variant="h6">{error}</Typography>
                    <Button
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => window.location.reload()}
                    >
                        Tentar novamente
                    </Button>
                </Box>
            </MainContainer>
        );
    }

    return (
        <MainContainer>
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ToggleContainer>
                    <StyledToggleButtonGroup
                        value={currentMode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="Modo de visualização"
                    >
                        <StyledToggleButton value="pacientes" aria-label="Pacientes">
                            Pacientes
                        </StyledToggleButton>
                        <StyledToggleButton value="receitas" aria-label="Receitas">
                            Receitas
                        </StyledToggleButton>
                    </StyledToggleButtonGroup>
                </ToggleContainer>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SearchField
                        placeholder="Pesquise por pacientes..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        variant="outlined"
                    />

                    <FilterButton
                        aria-label="Filtros"
                        onClick={handleFilterClick}
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            color: hasActiveFilters ? 'primary.main' : 'action.active',
                        }}
                    >
                        <FilterListIcon />
                    </FilterButton>

                    <FilterButton
                        aria-label="Menu"
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                        }}
                    >
                        <MenuIcon />
                    </FilterButton>
                </Box>
            </Box>

            {/* Área de Chips de Filtro */}
            {hasActiveFilters && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 1 }}>
                    {activeFilters.gender && (
                        <FilterChip
                            label={`Gênero: ${activeFilters.gender}`}
                            colorscheme="genero"
                            onDelete={() => handleRemoveFilter('gender')}
                            deleteIcon={<CloseIcon fontSize="small" />}
                        />
                    )}

                    {activeFilters.conditions.map(condition => {
                        const conditionInfo = PATIENT_CONDITIONS.find(c => c.value === condition);
                        return (
                            <FilterChip
                                key={condition}
                                label={conditionInfo ? conditionInfo.label : condition}
                                colorscheme={condition}
                                onDelete={() => handleRemoveFilter('condition', condition)}
                                deleteIcon={<CloseIcon fontSize="small" />}
                            />
                        );
                    })}

                    {activeFilters.status && (
                        <FilterChip
                            label={`Status: ${activeFilters.status.charAt(0).toUpperCase() + activeFilters.status.slice(1)}`}
                            colorscheme="default"
                            onDelete={() => handleRemoveFilter('status')}
                            deleteIcon={<CloseIcon fontSize="small" />}
                        />
                    )}

                    {activeFilters.consultDateRange.first && (
                        <FilterChip
                            label={`Primeira Consulta: ${formatDate(activeFilters.consultDateRange.first.startDate)} - ${formatDate(activeFilters.consultDateRange.first.endDate)}`}
                            colorscheme="primeira-consulta"
                            onDelete={() => handleRemoveFilter('dateRange', 'first')}
                            deleteIcon={<CloseIcon fontSize="small" />}
                        />
                    )}
                </Box>
            )}

            {/* Tabela */}
            <TableContainerStyled>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, ml: 1, fontWeight: 600 }}>
                        Tabela de Pacientes
                    </Typography>

                    <TableContainer sx={{ maxHeight: 350 }}>
                        <Table stickyHeader aria-label="tabela de pacientes">
                            <TableHead>
                                <TableRow>
                                    <HeaderTableCell
                                        onClick={() => handleSort('nome')}
                                        sx={{ minWidth: 200 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Nome {renderSortIcon('nome')}
                                        </Box>
                                    </HeaderTableCell>
                                    <HeaderTableCell
                                        onClick={() => handleSort('genero')}
                                        sx={{ width: 100 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Gênero {renderSortIcon('genero')}
                                        </Box>
                                    </HeaderTableCell>
                                    <HeaderTableCell
                                        onClick={() => handleSort('idade')}
                                        sx={{ width: 80 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Idade {renderSortIcon('idade')}
                                        </Box>
                                    </HeaderTableCell>
                                    <HeaderTableCell
                                        onClick={() => handleSort('ultimaConsulta')}
                                        sx={{ width: 140 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Última Consulta {renderSortIcon('ultimaConsulta')}
                                        </Box>
                                    </HeaderTableCell>
                                    <HeaderTableCell
                                        onClick={() => handleSort('proximaConsulta')}
                                        sx={{ width: 140 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Próxima Consulta {renderSortIcon('proximaConsulta')}
                                        </Box>
                                    </HeaderTableCell>
                                    <HeaderTableCell
                                        onClick={() => handleSort('status')}
                                        sx={{ width: 160 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Status {renderSortIcon('status')}
                                        </Box>
                                    </HeaderTableCell>
                                    <StyledTableCell sx={{ width: 50, backgroundColor: '#F9FAFB' }}></StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPatients.length === 0 ? (
                                    <TableRow>
                                        <StyledTableCell colSpan={7} align="center">
                                            <Typography sx={{ py: 2 }}>
                                                Nenhum paciente encontrado
                                            </Typography>
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <TableRow
                                            key={patient.id}
                                            hover
                                            onClick={() => handlePatientClick(patient.id)}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: alpha('#000', 0.02),
                                                    cursor: 'pointer',
                                                },
                                                '& td': {
                                                    borderBottom: '1px solid #EAECEF',
                                                }
                                            }}
                                        >
                                            <StyledTableCell>
                                                {patient.nome}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <GenderIcon gender={patient.genero}>
                                                    <Box
                                                        component="img"
                                                        src={patient.genero === 'Masculino' ? "/masculino.svg" : "/feminino.svg"}
                                                        alt={patient.genero}
                                                        sx={{
                                                            width: '24px',
                                                            height: '24px'
                                                        }}
                                                    />
                                                </GenderIcon>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                {patient.idade || '-'}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                {formatDate(patient.ultimaConsulta)}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                {formatDate(patient.proximaConsulta)}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <StatusChip
                                                    label={patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                                                    status={patient.status}
                                                    size="small"
                                                />
                                            </StyledTableCell>
                                            <StyledTableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: 'primary.main' }}
                                                    aria-label="detalhes do paciente"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Impede que o evento se propague para a TableRow
                                                        handlePatientClick(patient.id);
                                                    }}
                                                >
                                                    <ChevronRightIcon />
                                                </IconButton>
                                            </StyledTableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </TableContainerStyled>

            {/* Popover de Filtros */}
            {filtersPopover}
        </MainContainer>
    );
};

export default PatientsTable;