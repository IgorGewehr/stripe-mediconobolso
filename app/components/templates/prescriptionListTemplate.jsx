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
    ButtonGroup
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
    KeyboardArrowRight as KeyboardArrowRightIcon,
    CalendarToday as CalendarTodayIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    ContentCopy as ContentCopyIcon,
    Medication as MedicationIcon,
    StarBorder as StarBorderIcon,
    Star as StarIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    ErrorOutline as ErrorOutlineIcon,
    HealthAndSafety as HealthAndSafetyIcon,
    AccessTime as AccessTimeIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    ArrowDropDown as ArrowDropDownIcon,
    FileCopy as FileCopyIcon,
    Archive as ArchiveIcon,
    Print as PrintIcon,
    Warning as WarningIcon,
    FilterAlt as FilterAltIcon
} from '@mui/icons-material';

import { format, isToday, isPast, parseISO, isValid, parse, differenceInYears, differenceInMonths, differenceInDays, subDays, addDays, isAfter, isBefore, formatDistance, isWithinInterval, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prescriptionsService, patientsService } from '@/lib/services/firebase';
import { useAuth } from "../providers/authProvider";

// Constantes para o componente
const PRESCRIPTION_STATUS = [
    { label: 'Ativa', value: 'ativa', color: 'success' },
    { label: 'Pendente', value: 'pendente', color: 'warning' },
    { label: 'Renovada', value: 'renovada', color: 'info' },
    { label: 'Suspensa', value: 'suspensa', color: 'error' },
    { label: 'Concluída', value: 'concluida', color: 'default' },
];

const MEDICATION_TYPES = [
    { label: 'Controlados', value: 'controlado', icon: <WarningIcon fontSize="small" /> },
    { label: 'Antibióticos', value: 'antibiotico', icon: <MedicationIcon fontSize="small" /> },
    { label: 'Contínuos', value: 'continuo', icon: <AccessTimeIcon fontSize="small" /> },
    { label: 'Temporários', value: 'temporario', icon: <ScheduleIcon fontSize="small" /> },
];

const VIEWS = {
    TABLE: 'table',
    GRID: 'grid',
};

const TABS = {
    ALL: 'todas',
    ACTIVE: 'ativas',
    EXPIRING: 'a_vencer',
    CONTROLLED: 'controlados',
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
            case 'status': return '#E8F5E9';
            case 'type': return '#E3F2FD';
            case 'date': return '#FFF8E1';
            case 'patient': return '#F3E5F5';
            case 'medication': return '#E0F7FA';
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

// Componente para chips de condição no seletor de filtros
const OptionChip = ({ label, colorscheme, onClick, selected, icon }) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        switch (colorscheme) {
            case 'status': return '#E8F5E9';
            case 'type': return '#E3F2FD';
            case 'date': return '#FFF8E1';
            case 'patient': return '#F3E5F5';
            case 'medication': return '#E0F7FA';
            default: return '#F5F5F5';
        }
    };

    return (
        <Chip
            label={label}
            icon={icon}
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

    const handleStatusToggle = (status) => {
        const statuses = [...activeFilters.statuses];
        const index = statuses.indexOf(status);

        if (index === -1) {
            statuses.push(status);
        } else {
            statuses.splice(index, 1);
        }

        onFilterChange('statuses', statuses);
    };

    const handleMedicationTypeToggle = (type) => {
        const types = [...activeFilters.medicationTypes];
        const index = types.indexOf(type);

        if (index === -1) {
            types.push(type);
        } else {
            types.splice(index, 1);
        }

        onFilterChange('medicationTypes', types);
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
            {/* Filtro de Status */}
            <FilterSection
                title="Status da Receita"
                actionElement={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {activeFilters.statuses.length} Selecionados
                        </Typography>
                        {activeFilters.statuses.length > 0 && (
                            <ClearButton onClick={() => onFilterChange('statuses', [])} />
                        )}
                    </Box>
                }
            >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {PRESCRIPTION_STATUS.map(status => (
                        <OptionChip
                            key={status.value}
                            label={status.label}
                            colorscheme="status"
                            onClick={() => handleStatusToggle(status.value)}
                            selected={activeFilters.statuses.includes(status.value)}
                        />
                    ))}
                </Box>
            </FilterSection>

            {/* Filtro de Tipo de Medicação */}
            <FilterSection
                title="Tipo de Medicamento"
                actionElement={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {activeFilters.medicationTypes.length} Selecionados
                        </Typography>
                        {activeFilters.medicationTypes.length > 0 && (
                            <ClearButton onClick={() => onFilterChange('medicationTypes', [])} />
                        )}
                    </Box>
                }
            >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {MEDICATION_TYPES.map(type => (
                        <OptionChip
                            key={type.value}
                            label={type.label}
                            icon={type.icon}
                            colorscheme="medication"
                            onClick={() => handleMedicationTypeToggle(type.value)}
                            selected={activeFilters.medicationTypes.includes(type.value)}
                        />
                    ))}
                </Box>
            </FilterSection>

            {/* Filtro de Período */}
            <FilterSection
                title="Período da Prescrição"
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

            {/* Filtro de Paciente */}
            <FilterSection
                title="Buscar por Paciente"
                actionElement={
                    activeFilters.patientName &&
                    <ClearButton onClick={() => onFilterChange('patientName', '')} />
                }
            >
                <TextField
                    fullWidth
                    placeholder="Nome do paciente"
                    value={activeFilters.patientName}
                    onChange={(e) => onFilterChange('patientName', e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '50px',
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
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
const PrescriptionsListPage = ({ onPrescriptionClick, onEditPrescription, onNewPrescription }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { user, getEffectiveUserId } = useAuth();

    // Estados principais
    const [prescriptions, setPrescriptions] = useState([]);
    const [patientsMap, setPatientsMap] = useState({});
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(VIEWS.TABLE);
    const [currentTab, setCurrentTab] = useState(TABS.ALL);
    const [page, setPage] = useState(1);
    const [favoritePrescriptions, setFavoritePrescriptions] = useState([]);

    // Estados para paginação
    const rowsPerPage = 10;
    const paginatedPrescriptions = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredPrescriptions.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredPrescriptions, page, rowsPerPage]);

    // Estados para sorting
    const [sortConfig, setSortConfig] = useState({
        field: 'prescriptionDate',
        direction: 'desc'
    });

    // Estados para filtros
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        statuses: [],
        medicationTypes: [],
        dateRange: null,
        patientName: '',
    });

    // Menu Actions
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);

    // Metrics (Estatísticas)
    const [metrics, setMetrics] = useState({
        totalPrescriptions: 0,
        activePrescriptions: 0,
        expiringPrescriptions: 0,
        controlledMedications: 0
    });

    // Carregar dados iniciais
    useEffect(() => {
        if (!user?.uid) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Carrega a lista de prescrições
                const prescriptionsData = await prescriptionsService.listAllPrescriptions(getEffectiveUserId());
                setPrescriptions(prescriptionsData);

                // Carrega informações de pacientes para referência
                const patients = await patientsService.listPatients(getEffectiveUserId());
                const patientsMapData = {};
                patients.forEach(patient => {
                    patientsMapData[patient.id] = patient;
                });
                setPatientsMap(patientsMapData);

                // Calcula métricas
                calculateMetrics(prescriptionsData);

                // Define favoritos (mock - em produção, isso viria do banco de dados)
                const favPrescriptions = prescriptionsData
                    .filter((p, index) => index % 5 === 0) // Simples exemplo - na vida real, isso viria do Firebase
                    .map(p => p.id);
                setFavoritePrescriptions(favPrescriptions);
            } catch (error) {
                console.error("Erro ao carregar dados de prescrições:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Calcula métricas baseadas nos dados
    const calculateMetrics = (prescriptionsData) => {
        const today = new Date();
        const thirtyDaysFromNow = addDays(today, 30);

        // Prescrições ativas
        const activePrescriptions = prescriptionsData.filter(prescription =>
            prescription.status?.toLowerCase() === 'ativa'
        );

        // Prescrições a expirar nos próximos 30 dias
        const expiringPrescriptions = prescriptionsData.filter(prescription => {
            const expirationDate = getDateValue(prescription, 'expirationDate');
            return expirationDate &&
                isAfter(expirationDate, today) &&
                isBefore(expirationDate, thirtyDaysFromNow);
        });

        // Prescrições com medicamentos controlados
        const controlledMedications = prescriptionsData.filter(prescription => {
            const medications = prescription.medications || [];
            return medications.some(med => med.isControlled);
        });

        setMetrics({
            totalPrescriptions: prescriptionsData.length,
            activePrescriptions: activePrescriptions.length,
            expiringPrescriptions: expiringPrescriptions.length,
            controlledMedications: controlledMedications.length
        });
    };

    // Efeito para filtragem e ordenação de prescrições
    useEffect(() => {
        if (!prescriptions) {
            setFilteredPrescriptions([]);
            return;
        }

        let filtered = [...prescriptions];

        // Aplicar filtro de abas
        filtered = applyTabFilter(filtered);

        // Aplicar pesquisa por texto
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(prescription => {
                // Verificar no nome do paciente
                const patientName = patientsMap[prescription.patientId]?.patientName || '';
                if (patientName.toLowerCase().includes(searchLower)) return true;

                // Verificar nos medicamentos
                const medications = prescription.medications || [];
                return medications.some(med =>
                    med.medicationName?.toLowerCase().includes(searchLower) ||
                    med.activeIngredient?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Aplicar outros filtros ativos
        filtered = applyActiveFilters(filtered);

        // Aplicar ordenação
        filtered = applySorting(filtered);

        setFilteredPrescriptions(filtered);
        setPage(1); // Resetar para primeira página quando os filtros mudam
    }, [prescriptions, searchTerm, sortConfig, activeFilters, currentTab, favoritePrescriptions, patientsMap]);

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
    const applyTabFilter = (prescriptions) => {
        const today = new Date();
        const thirtyDaysFromNow = addDays(today, 30);

        switch (currentTab) {
            case TABS.ACTIVE:
                // Prescrições com status ativa
                return prescriptions.filter(prescription =>
                    prescription.status?.toLowerCase() === 'ativa'
                );

            case TABS.EXPIRING:
                // Prescrições a expirar nos próximos 30 dias
                return prescriptions.filter(prescription => {
                    const expirationDate = getDateValue(prescription, 'expirationDate');
                    return expirationDate &&
                        isAfter(expirationDate, today) &&
                        isBefore(expirationDate, thirtyDaysFromNow);
                });

            case TABS.CONTROLLED:
                // Prescrições com medicações controladas
                return prescriptions.filter(prescription => {
                    const medications = prescription.medications || [];
                    return medications.some(med => med.isControlled);
                });

            case TABS.RECENT:
                // Prescrições adicionadas nos últimos 7 dias
                const sevenDaysAgo = subDays(today, 7);
                return prescriptions.filter(prescription => {
                    const createdAt = getDateValue(prescription, 'createdAt');
                    return createdAt && isAfter(createdAt, sevenDaysAgo);
                });

            default:
                return prescriptions;
        }
    };

    // Aplicar todos os filtros ativos
    const applyActiveFilters = (prescriptions) => {
        let filtered = [...prescriptions];

        // Filtro de status
        if (activeFilters.statuses.length > 0) {
            filtered = filtered.filter(prescription =>
                activeFilters.statuses.includes(prescription.status?.toLowerCase())
            );
        }

        // Filtro de tipos de medicamento
        if (activeFilters.medicationTypes.length > 0) {
            filtered = filtered.filter(prescription => {
                const medications = prescription.medications || [];
                return medications.some(med => {
                    if (activeFilters.medicationTypes.includes('controlado') && med.isControlled) {
                        return true;
                    }
                    if (activeFilters.medicationTypes.includes('antibiotico') && med.isAntibiotic) {
                        return true;
                    }
                    if (activeFilters.medicationTypes.includes('continuo') && med.isContinuous) {
                        return true;
                    }
                    if (activeFilters.medicationTypes.includes('temporario') && !med.isContinuous) {
                        return true;
                    }
                    return false;
                });
            });
        }

        // Filtro de período
        if (activeFilters.dateRange) {
            const { start, end } = activeFilters.dateRange;

            if (start || end) {
                filtered = filtered.filter(prescription => {
                    const prescriptionDate = getDateValue(prescription, 'prescriptionDate');
                    if (!prescriptionDate) return false;

                    const startDate = start ? new Date(start) : null;
                    const endDate = end ? new Date(end) : null;

                    if (startDate && endDate) {
                        return isAfter(prescriptionDate, startDate) && isBefore(prescriptionDate, endDate);
                    } else if (startDate) {
                        return isAfter(prescriptionDate, startDate);
                    } else if (endDate) {
                        return isBefore(prescriptionDate, endDate);
                    }

                    return true;
                });
            }
        }

        // Filtro de paciente
        if (activeFilters.patientName) {
            const patientSearch = activeFilters.patientName.toLowerCase();
            filtered = filtered.filter(prescription => {
                const patientName = patientsMap[prescription.patientId]?.patientName || '';
                return patientName.toLowerCase().includes(patientSearch);
            });
        }

        return filtered;
    };

    // Aplicar ordenação
    const applySorting = (prescriptions) => {
        return [...prescriptions].sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            // Tratamento especial para campos de data
            if (sortConfig.field === 'prescriptionDate' || sortConfig.field === 'expirationDate' || sortConfig.field === 'createdAt') {
                aValue = getDateValue(a, sortConfig.field);
                bValue = getDateValue(b, sortConfig.field);

                if (!aValue && !bValue) return 0;
                if (!aValue) return 1;
                if (!bValue) return -1;

                return sortConfig.direction === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            // Tratamento para campo "patientName" que deve buscar do mapa de pacientes
            if (sortConfig.field === 'patientName') {
                aValue = patientsMap[a.patientId]?.patientName || '';
                bValue = patientsMap[b.patientId]?.patientName || '';
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

    // Calcular status de expiração para prescrições
    const getExpirationStatus = (expirationDate) => {
        if (!expirationDate) return { status: 'no-expiration', label: 'Sem validade' };

        const today = new Date();
        const expiresIn = differenceInDays(expirationDate, today);

        if (expiresIn < 0) {
            return { status: 'expired', label: 'Expirada' };
        } else if (expiresIn <= 7) {
            return { status: 'critical', label: `Expira em ${expiresIn} dias` };
        } else if (expiresIn <= 30) {
            return { status: 'warning', label: `Expira em ${expiresIn} dias` };
        } else {
            return { status: 'ok', label: `Válida por ${expiresIn} dias` };
        }
    };

    // Verificar se existem filtros ativos
    const hasActiveFilters =
        activeFilters.statuses.length > 0 ||
        activeFilters.medicationTypes.length > 0 ||
        activeFilters.dateRange !== null ||
        activeFilters.patientName !== '';

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

    const handlePrescriptionClick = (prescriptionId) => {
        if (onPrescriptionClick) {
            onPrescriptionClick(prescriptionId);
        }
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleToggleFavorite = async (prescriptionId) => {
        // Verifica se a prescrição já está marcada como favorita
        const isCurrentlyFavorite = favoritePrescriptions.includes(prescriptionId);
        const newFavoriteStatus = !isCurrentlyFavorite;

        // Atualiza o estado local de forma otimista
        setFavoritePrescriptions(prev =>
            newFavoriteStatus
                ? [...prev, prescriptionId]
                : prev.filter(id => id !== prescriptionId)
        );

        try {
            // Em produção, atualizaria no Firebase
            // await prescriptionsService.updatePrescriptionFavoriteStatus(getEffectiveUserId(), prescriptionId, newFavoriteStatus);
            console.log(`Prescrição ${prescriptionId} ${newFavoriteStatus ? 'adicionada aos' : 'removida dos'} favoritos`);
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
            // Reverter estado local em caso de erro
            setFavoritePrescriptions(prev =>
                isCurrentlyFavorite
                    ? [...prev, prescriptionId]
                    : prev.filter(id => id !== prescriptionId)
            );
        }
    };

    // Handlers para Menu de Ações
    const handleMenuOpen = (event, prescriptionId) => {
        event.stopPropagation();
        setSelectedPrescriptionId(prescriptionId);
        setActionMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setActionMenuAnchorEl(null);
    };

    const handleEditPrescription = () => {
        handleMenuClose();
        if (onEditPrescription && selectedPrescriptionId) {
            onEditPrescription(selectedPrescriptionId);
        }
    };

    const handleDuplicatePrescription = () => {
        handleMenuClose();
        // Implementar a lógica para duplicar a prescrição
        console.log(`Duplicar prescrição ${selectedPrescriptionId}`);
    };

    const handlePrintPrescription = () => {
        handleMenuClose();
        // Implementar a lógica para imprimir a prescrição
        console.log(`Imprimir prescrição ${selectedPrescriptionId}`);
    };

    const handleDownloadPrescription = () => {
        handleMenuClose();
        // Implementar a lógica para baixar a prescrição
        console.log(`Baixar prescrição ${selectedPrescriptionId}`);
    };

    const handleArchivePrescription = () => {
        handleMenuClose();
        // Implementar a lógica para arquivar a prescrição
        console.log(`Arquivar prescrição ${selectedPrescriptionId}`);
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
        if (type === 'status') {
            setActiveFilters(prev => ({
                ...prev,
                statuses: prev.statuses.filter(s => s !== value)
            }));
        } else if (type === 'medicationType') {
            setActiveFilters(prev => ({
                ...prev,
                medicationTypes: prev.medicationTypes.filter(t => t !== value)
            }));
        } else if (type === 'dateRange') {
            setActiveFilters(prev => ({
                ...prev,
                dateRange: null
            }));
        } else if (type === 'patientName') {
            setActiveFilters(prev => ({
                ...prev,
                patientName: ''
            }));
        }
    };

    const handleClearFilters = () => {
        setActiveFilters({
            statuses: [],
            medicationTypes: [],
            dateRange: null,
            patientName: '',
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
                        <Box sx={{ mr: 2 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                        </Box>
                        <Box>
                            <Skeleton variant="text" width={120} />
                            <Skeleton variant="text" width={80} height={12} />
                        </Box>
                    </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={120} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 12 }} /></TableCell>
                <TableCell><Skeleton variant="text" width={120} /></TableCell>
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
                            Total de Receitas
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                            {loading ? <Skeleton width={60} /> : metrics.totalPrescriptions}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : '+5 receitas nesta semana'}
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
                            Receitas Ativas
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#4CAF50' }}>
                            {loading ? <Skeleton width={60} /> : metrics.activePrescriptions}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? (
                                <Skeleton width={120} />
                            ) : (
                                <>
                                    <span style={{ color: '#4CAF50' }}>{Math.round((metrics.activePrescriptions / metrics.totalPrescriptions) * 100) || 0}%</span> do total de receitas
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
                            Receitas a Vencer
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#FF9800' }}>
                            {loading ? <Skeleton width={60} /> : metrics.expiringPrescriptions}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : 'Nos próximos 30 dias'}
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
                            Medicações Controladas
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#F44336' }}>
                            {loading ? <Skeleton width={60} /> : metrics.controlledMedications}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {loading ? <Skeleton width={120} /> : 'Receitas com controle especial'}
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
                            Todas as Receitas
                            <Chip
                                label={metrics.totalPrescriptions}
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
                            Ativas
                            <Chip
                                label={metrics.activePrescriptions}
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
                            A Vencer
                            <Chip
                                label={metrics.expiringPrescriptions}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.EXPIRING}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Controlados
                            <Chip
                                label={metrics.controlledMedications}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value={TABS.CONTROLLED}
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Recentes
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
                placeholder="Buscar por paciente, medicamento ou princípio ativo..."
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

                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onNewPrescription}
                        color="primary"
                        sx={{
                            borderRadius: '50px',
                            px: 2,
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                                boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)',
                            }
                        }}
                    >
                        Nova Receita
                    </Button>
                </Box>
            </Box>
        </Box>
    );

    // Chips de filtros ativos
    const ActiveFiltersSection = () => {
        if (!hasActiveFilters) return null;

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {activeFilters.statuses.map((status) => {
                    const statusInfo = PRESCRIPTION_STATUS.find(
                        (s) => s.value === status
                    );
                    return (
                        <FilterChip
                            key={status}
                            label={`Status: ${statusInfo ? statusInfo.label : status}`}
                            colorscheme="status"
                            onDelete={() => handleRemoveFilter('status', status)}
                        />
                    );
                })}

                {activeFilters.medicationTypes.map((type) => {
                    const typeInfo = MEDICATION_TYPES.find(
                        (t) => t.value === type
                    );
                    return (
                        <FilterChip
                            key={type}
                            label={`Tipo: ${typeInfo ? typeInfo.label : type}`}
                            colorscheme="medication"
                            onDelete={() => handleRemoveFilter('medicationType', type)}
                        />
                    );
                })}

                {activeFilters.dateRange && (
                    <FilterChip
                        label={`Período: ${activeFilters.dateRange.start || '...'} - ${activeFilters.dateRange.end || '...'}`}
                        colorscheme="date"
                        onDelete={() => handleRemoveFilter('dateRange')}
                    />
                )}

                {activeFilters.patientName && (
                    <FilterChip
                        label={`Paciente: ${activeFilters.patientName}`}
                        colorscheme="patient"
                        onDelete={() => handleRemoveFilter('patientName')}
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
                            label="Data da Prescrição"
                            field="prescriptionDate"
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                        />
                        <SortableHeaderCell
                            label="Validade"
                            field="expirationDate"
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                        />
                        <SortableHeaderCell
                            label="Status"
                            field="status"
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                        />
                        <SortableHeaderCell
                            label="Medicamentos"
                            field="medicationCount"
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
                    ) : paginatedPrescriptions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <HealthAndSafetyIcon
                                        sx={{
                                            fontSize: 64,
                                            color: alpha(theme.palette.primary.main, 0.3),
                                            mb: 2
                                        }}
                                    />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Nenhuma receita encontrada
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                                        Tente ajustar seus filtros ou termos de busca para encontrar receitas, ou crie uma nova receita.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        color="primary"
                                        onClick={onNewPrescription}
                                        sx={{ mt: 2, borderRadius: '50px' }}
                                    >
                                        Nova Receita
                                    </Button>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedPrescriptions.map((prescription) => {
                            const patientData = patientsMap[prescription.patientId] || {};
                            const patientName = patientData.patientName || 'Paciente não encontrado';
                            const patientAvatar = patientData.patientPhotoUrl;

                            const prescriptionDate = getDateValue(prescription, 'prescriptionDate');
                            const expirationDate = getDateValue(prescription, 'expirationDate');
                            const isFavorite = favoritePrescriptions.includes(prescription.id);

                            const status = prescription.status || 'pendente';
                            const medications = prescription.medications || [];

                            const hasControlledMeds = medications.some(med => med.isControlled);

                            // Calcular o status da validade
                            const expirationStatus = getExpirationStatus(expirationDate);

                            return (
                                <TableRow
                                    key={prescription.id}
                                    onClick={() => handlePrescriptionClick(prescription.id)}
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
                                                src={patientAvatar}
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
                                                    {hasControlledMeds && (
                                                        <Tooltip title="Contém medicamentos controlados">
                                                            <WarningIcon
                                                                fontSize="small"
                                                                sx={{
                                                                    ml: 1,
                                                                    color: '#FF9800',
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {medications.map(m => m.medicationName).slice(0, 2).join(', ')}
                                                    {medications.length > 2 && ', ...'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(prescriptionDate)}
                                        </Typography>
                                        {prescriptionDate && (
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDistance(prescriptionDate, new Date(), { addSuffix: true, locale: ptBR })}
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {expirationDate ? (
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    color={
                                                        expirationStatus.status === 'expired' ? 'error.main' :
                                                            expirationStatus.status === 'critical' ? 'error.main' :
                                                                expirationStatus.status === 'warning' ? 'warning.main' :
                                                                    'text.primary'
                                                    }
                                                    fontWeight={
                                                        expirationStatus.status === 'expired' ||
                                                        expirationStatus.status === 'critical' ?
                                                            600 : 400
                                                    }
                                                >
                                                    {formatDate(expirationDate)}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color={
                                                        expirationStatus.status === 'expired' ? 'error.main' :
                                                            expirationStatus.status === 'critical' ? 'error.main' :
                                                                expirationStatus.status === 'warning' ? 'warning.main' :
                                                                    'text.secondary'
                                                    }
                                                >
                                                    {expirationStatus.label}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Sem validade
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                                            size="small"
                                            color={
                                                status === 'ativa' ? 'success' :
                                                    status === 'pendente' ? 'warning' :
                                                        status === 'renovada' ? 'info' :
                                                            status === 'suspensa' ? 'error' :
                                                                'default'
                                            }
                                            variant="outlined"
                                            sx={{
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2">
                                                {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                                            </Typography>
                                            {hasControlledMeds && (
                                                <Chip
                                                    label="Controlado"
                                                    size="small"
                                                    color="warning"
                                                    sx={{
                                                        ml: 1,
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tooltip title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleFavorite(prescription.id);
                                                    }}
                                                    sx={{
                                                        color: isFavorite ? '#FFC107' : 'action.disabled',
                                                    }}
                                                >
                                                    {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Mais ações">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, prescription.id)}
                                                    sx={{
                                                        ml: 1
                                                    }}
                                                >
                                                    <MoreVertIcon />
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

            {filteredPrescriptions.length > 0 && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando {Math.min(rowsPerPage, filteredPrescriptions.length)} de {filteredPrescriptions.length} receitas
                    </Typography>

                    <Pagination
                        count={Math.ceil(filteredPrescriptions.length / rowsPerPage)}
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
            ) : paginatedPrescriptions.length === 0 ? (
                <Grid item xs={12}>
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        backgroundColor: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    }}>
                        <HealthAndSafetyIcon
                            sx={{
                                fontSize: 64,
                                color: alpha(theme.palette.primary.main, 0.3),
                                mb: 2
                            }}
                        />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Nenhuma receita encontrada
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                            Tente ajustar seus filtros ou termos de busca para encontrar receitas, ou crie uma nova receita.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            color="primary"
                            onClick={onNewPrescription}
                            sx={{ mt: 2, borderRadius: '50px' }}
                        >
                            Nova Receita
                        </Button>
                    </Box>
                </Grid>
            ) : (
                paginatedPrescriptions.map(prescription => {
                    const patientData = patientsMap[prescription.patientId] || {};
                    const patientName = patientData.patientName || 'Paciente não encontrado';
                    const patientAvatar = patientData.patientPhotoUrl;

                    const prescriptionDate = getDateValue(prescription, 'prescriptionDate');
                    const expirationDate = getDateValue(prescription, 'expirationDate');
                    const isFavorite = favoritePrescriptions.includes(prescription.id);

                    const status = prescription.status || 'pendente';
                    const medications = prescription.medications || [];

                    const hasControlledMeds = medications.some(med => med.isControlled);

                    // Calcular o status da validade
                    const expirationStatus = getExpirationStatus(expirationDate);

                    // Formatar as instruções gerais (limitadas)
                    const generalInstructions = prescription.generalInstructions || '';
                    const truncatedInstructions = generalInstructions.length > 100
                        ? generalInstructions.substring(0, 100) + '...'
                        : generalInstructions;

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={prescription.id}>
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
                                  onClick={() => handlePrescriptionClick(prescription.id)}
                            >
                                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar
                                            src={patientAvatar}
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
                                                {hasControlledMeds && (
                                                    <Tooltip title="Contém medicamentos controlados">
                                                        <WarningIcon
                                                            fontSize="small"
                                                            sx={{
                                                                ml: 0.5,
                                                                color: '#FF9800',
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                {formatDate(prescriptionDate)}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleFavorite(prescription.id);
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
                                            <Chip
                                                label={status.charAt(0).toUpperCase() + status.slice(1)}
                                                size="small"
                                                color={
                                                    status === 'ativa' ? 'success' :
                                                        status === 'pendente' ? 'warning' :
                                                            status === 'renovada' ? 'info' :
                                                                status === 'suspensa' ? 'error' :
                                                                    'default'
                                                }
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
                                                }}
                                            />

                                            {/* Validade */}
                                            {expirationDate && (
                                                <Chip
                                                    label={expirationStatus.label}
                                                    size="small"
                                                    color={
                                                        expirationStatus.status === 'expired' ? 'error' :
                                                            expirationStatus.status === 'critical' ? 'error' :
                                                                expirationStatus.status === 'warning' ? 'warning' :
                                                                    'default'
                                                    }
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        {/* Lista de medicamentos */}
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                Medicamentos ({medications.length})
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {medications.slice(0, 3).map((medication, index) => (
                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <MedicationIcon fontSize="small" sx={{
                                                            color: medication.isControlled ? 'warning.main' : 'text.secondary',
                                                            mr: 1
                                                        }} />
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {medication.medicationName}
                                                            {medication.dosage && ` - ${medication.dosage}`}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                {medications.length > 3 && (
                                                    <Typography variant="body2" color="text.secondary" sx={{
                                                        fontStyle: 'italic',
                                                        mt: 0.5
                                                    }}>
                                                        +{medications.length - 3} medicamentos
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Instruções gerais (se tiver) */}
                                        {generalInstructions && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    Instruções
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {truncatedInstructions}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            variant="outlined"
                                            sx={{ borderRadius: '50px', fontSize: '0.75rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onEditPrescription) {
                                                    onEditPrescription(prescription.id);
                                                }
                                            }}
                                        >
                                            Editar
                                        </Button>

                                        <Button
                                            size="small"
                                            startIcon={<PrintIcon />}
                                            variant="contained"
                                            color="primary"
                                            sx={{
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                boxShadow: '0 2px 8px 0 rgba(0,118,255,0.25)',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log(`Imprimir receita ${prescription.id}`);
                                            }}
                                        >
                                            Imprimir
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })
            )}

            {filteredPrescriptions.length > 0 && (
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
                            count={Math.ceil(filteredPrescriptions.length / rowsPerPage)}
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

            {/* Menu de ações */}
            <Menu
                anchorEl={actionMenuAnchorEl}
                open={Boolean(actionMenuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                        minWidth: '180px'
                    }
                }}
            >
                <MenuItem onClick={handleEditPrescription}>
                    <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Editar
                </MenuItem>
                <MenuItem onClick={handleDuplicatePrescription}>
                    <ContentCopyIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Duplicar
                </MenuItem>
                <MenuItem onClick={handlePrintPrescription}>
                    <PrintIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Imprimir
                </MenuItem>
                <MenuItem onClick={handleDownloadPrescription}>
                    <DownloadIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Baixar PDF
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={handleArchivePrescription}>
                    <ArchiveIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Arquivar
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default PrescriptionsListPage;