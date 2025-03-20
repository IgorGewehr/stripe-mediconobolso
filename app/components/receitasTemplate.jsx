"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    List,
    Paper,
    CircularProgress,
    Container,
    Grid,
    Stack,
    styled,
    useTheme,
    alpha,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    InputAdornment,
    Tooltip,
    Tabs,
    Tab,
    Avatar,
    Drawer,
    ListItemText,
    Collapse,
    ButtonGroup,
    Pagination,
    InputBase,
    Badge,
    FormControlLabel,
    Divider,
    Fade,
    Zoom,
} from '@mui/material';
import {
    SearchOutlined,
    FilterListOutlined,
    SortOutlined,
    VisibilityOutlined,
    DeleteOutlined,
    AccessTimeOutlined,
    EventOutlined,
    HistoryOutlined,
    CategoryOutlined,
    LocalPharmacyOutlined,
    InfoOutlined,
    PictureAsPdfOutlined,
    CloseOutlined,
    AddOutlined,
    MedicationOutlined,
    SortByAlphaOutlined,
    ExpandMoreOutlined,
    ExpandLessOutlined,
    ClearOutlined,
    SaveOutlined,
    LocalHospitalOutlined,
    PersonOutlined,
    CheckCircleOutlineOutlined,
    HelpOutlineOutlined,
    CalendarTodayOutlined,
    EditOutlined as EditIcon,
    ArrowBackOutlined,
    KeyboardArrowRightOutlined,
    AssignmentOutlined,
    LocalOfferOutlined,
    StarOutline,
    StarRate,
} from '@mui/icons-material';
import FirebaseService from '../../lib/firebaseService';
import { format, formatDistanceToNow, isToday, isYesterday, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from "./authProvider";

// Styled components with enhanced design
const SearchBar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    borderRadius: 16,
    padding: theme.spacing(0.5, 2),
    marginBottom: theme.spacing(3),
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    transition: 'all 0.3s ease',
    '&:hover, &:focus-within': {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        borderColor: alpha(theme.palette.primary.main, 0.2),
        backgroundColor: theme.palette.background.paper,
    },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1.2, 1, 1.2, 0),
        fontFamily: 'Gellix, system-ui, sans-serif',
        fontSize: '0.95rem',
    },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.9) : alpha(theme.palette.primary.main, 0.08),
    color: selected ? theme.palette.common.white : theme.palette.text.primary,
    borderRadius: 12,
    height: 32,
    border: `1px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.12),
    },
    '& .MuiChip-label': {
        padding: '0 12px',
    },
    transition: 'all 0.2s ease',
}));

const ActionButton = styled(Button)(({ theme, variant = 'contained', color = 'primary' }) => ({
    borderRadius: 12,
    textTransform: 'none',
    boxShadow: variant === 'contained' ? '0px 3px 12px rgba(0, 0, 0, 0.08)' : 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '8px 18px',
    minWidth: 'auto',
    '&:hover': {
        boxShadow: variant === 'contained' ? '0px 5px 15px rgba(0, 0, 0, 0.12)' : 'none',
        transform: 'translateY(-1px)',
    },
    transition: 'all 0.2s ease',
}));

const PrescriptionCard = styled(Paper)(({ theme }) => ({
    borderRadius: 20,
    overflow: 'hidden',
    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    backgroundColor: theme.palette.background.paper,
    marginBottom: theme.spacing(2.5),
    '&:hover': {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-3px)',
        borderColor: alpha(theme.palette.primary.main, 0.3),
    },
}));

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Fade in={value === index}>
                    <Box sx={{ pt: 3 }}>{children}</Box>
                </Fade>
            )}
        </div>
    );
};

const MedicationCard = styled(Card)(({ theme }) => ({
    borderRadius: 16,
    width: '100%',
    padding: theme.spacing(2.5),
    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
    boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.08)',
        transform: 'translateY(-4px)',
        borderColor: alpha(theme.palette.primary.main, 0.2),
    },
    position: 'relative',
    overflow: 'visible',
}));

const AnimatedContent = styled(Box)(({ theme }) => ({
    animation: 'fadeIn 0.5s ease-out',
    '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
    },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    margin: theme.spacing(2, 0),
    borderColor: alpha(theme.palette.divider, 0.6),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    '& .MuiTabs-indicator': {
        height: 3,
        borderRadius: '3px 3px 0 0',
    },
    '& .MuiTab-root': {
        textTransform: 'none',
        fontSize: '0.95rem',
        fontWeight: 600,
        padding: theme.spacing(1.5, 2.5),
        marginRight: theme.spacing(1),
        minWidth: 0,
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
    },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const EmptyStateContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(6),
    borderRadius: 24,
    textAlign: 'center',
    border: '2px dashed',
    borderColor: alpha(theme.palette.grey[300], 0.7),
    backgroundColor: alpha(theme.palette.grey[50], 0.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
    let color = theme.palette.info.main;
    let backgroundColor = alpha(theme.palette.info.main, 0.1);
    let textColor = theme.palette.info.dark;

    switch(status?.toLowerCase()) {
        case 'ativa':
            color = theme.palette.success.main;
            backgroundColor = alpha(theme.palette.success.main, 0.12);
            textColor = theme.palette.success.dark;
            break;
        case 'suspensa':
            color = theme.palette.warning.main;
            backgroundColor = alpha(theme.palette.warning.main, 0.12);
            textColor = theme.palette.warning.dark;
            break;
        case 'concluída':
            color = theme.palette.grey[500];
            backgroundColor = alpha(theme.palette.grey[300], 0.4);
            textColor = theme.palette.grey[800];
            break;
        case 'renovada':
            color = theme.palette.info.main;
            backgroundColor = alpha(theme.palette.info.main, 0.12);
            textColor = theme.palette.info.dark;
            break;
    }

    return {
        borderRadius: 12,
        border: `1px solid ${color}`,
        backgroundColor: backgroundColor,
        color: textColor,
        fontWeight: 600,
        '& .MuiChip-label': {
            padding: '0 10px',
        },
        boxShadow: `0 1px 3px ${alpha(color, 0.1)}`,
    };
});

// Main component
const PrescriptionsPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const doctorId = user?.uid;

    // Prescription states
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);

    // Medication states
    const [medications, setMedications] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState(null);
    const [medicationFormData, setMedicationFormData] = useState({
        name: '',
        description: '',
        dosages: [],
        form: '',
        category: '',
        instructions: '',
        sideEffects: '',
        contraindications: '',
    });
    const [newDosage, setNewDosage] = useState('');

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        patientId: '',
        medicationName: '',
    });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [sort, setSort] = useState('date-desc');

    // Pagination states
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Feedback state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Load prescriptions and medications
    useEffect(() => {
        const fetchData = async () => {
            if (!doctorId) return;

            setLoading(true);
            try {
                const [prescriptionsData, medicationsData] = await Promise.all([
                    FirebaseService.listPrescriptionsWithDetails(doctorId),
                    FirebaseService.listMedications(doctorId)
                ]);

                setPrescriptions(prescriptionsData);
                setFilteredPrescriptions(prescriptionsData);
                setMedications(medicationsData);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setError("Não foi possível carregar os dados. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [doctorId]);

    // Filter prescriptions when filters or search term change
    useEffect(() => {
        if (!prescriptions.length) return;

        let results = [...prescriptions];

        // Apply status filter
        if (filters.status !== 'all') {
            results = results.filter(p => p.status === filters.status);
        }

        // Apply date filter
        if (filters.dateFrom) {
            const dateFrom = new Date(filters.dateFrom);
            results = results.filter(p => {
                const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                return createdAt >= dateFrom;
            });
        }

        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59, 999);
            results = results.filter(p => {
                const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                return createdAt <= dateTo;
            });
        }

        // Apply patient filter
        if (filters.patientId) {
            results = results.filter(p => p.patientData?.id === filters.patientId);
        }

        // Apply medication name filter
        if (filters.medicationName) {
            results = results.filter(p =>
                p.medications?.some(med =>
                    med.medicationName.toLowerCase().includes(filters.medicationName.toLowerCase())
                )
            );
        }

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(p =>
                p.patientData?.name.toLowerCase().includes(term) ||
                p.medications?.some(med => med.medicationName.toLowerCase().includes(term))
            );
        }

        // Apply sorting
        results = sortPrescriptions(results, sort);

        setFilteredPrescriptions(results);
    }, [prescriptions, filters, searchTerm, sort]);

    // Sort prescriptions
    const sortPrescriptions = (prescriptionsToSort, sortOrder) => {
        return [...prescriptionsToSort].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

            switch (sortOrder) {
                case 'date-asc':
                    return dateA - dateB;
                case 'date-desc':
                    return dateB - dateA;
                case 'patient-asc':
                    return (a.patientData?.name || '').localeCompare(b.patientData?.name || '');
                case 'patient-desc':
                    return (b.patientData?.name || '').localeCompare(a.patientData?.name || '');
                default:
                    return dateB - dateA;
            }
        });
    };

    // Pagination
    const paginatedPrescriptions = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredPrescriptions.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredPrescriptions, page, rowsPerPage]);

    // Functions for handling medications
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOpenMedicationDialog = (medication = null) => {
        if (medication) {
            setSelectedMedication(medication);
            setMedicationFormData({
                name: medication.name,
                description: medication.description || '',
                dosages: medication.dosages || [],
                form: medication.form || '',
                category: medication.category || '',
                instructions: medication.instructions || '',
                sideEffects: medication.sideEffects || '',
                contraindications: medication.contraindications || '',
            });
        } else {
            setSelectedMedication(null);
            setMedicationFormData({
                name: '',
                description: '',
                dosages: [],
                form: '',
                category: '',
                instructions: '',
                sideEffects: '',
                contraindications: '',
            });
        }
        setMedicationDialogOpen(true);
    };

    const handleCloseMedicationDialog = () => {
        setMedicationDialogOpen(false);
        setSelectedMedication(null);
        setNewDosage('');
    };

    const handleMedicationChange = (e) => {
        const { name, value } = e.target;
        setMedicationFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDosage = () => {
        if (newDosage.trim()) {
            setMedicationFormData(prev => ({
                ...prev,
                dosages: [...prev.dosages, newDosage.trim()]
            }));
            setNewDosage('');
        }
    };

    const handleRemoveDosage = (index) => {
        setMedicationFormData(prev => ({
            ...prev,
            dosages: prev.dosages.filter((_, i) => i !== index)
        }));
    };

    const handleSaveMedication = async () => {
        try {
            setLoading(true);

            if (!medicationFormData.name) {
                setSnackbar({
                    open: true,
                    message: 'Nome do medicamento é obrigatório',
                    severity: 'error'
                });
                return;
            }

            if (selectedMedication) {
                // Update existing medication
                await FirebaseService.updateMedication(doctorId, selectedMedication.id, medicationFormData);
                setMedications(prev =>
                    prev.map(med =>
                        med.id === selectedMedication.id ?
                            { ...med, ...medicationFormData } :
                            med
                    )
                );
                setSnackbar({
                    open: true,
                    message: 'Medicamento atualizado com sucesso',
                    severity: 'success'
                });
            } else {
                // Create new medication
                const newMedicationId = await FirebaseService.createMedication(doctorId, medicationFormData);
                const newMedication = {
                    id: newMedicationId,
                    ...medicationFormData,
                    createdAt: new Date(),
                };
                setMedications(prev => [...prev, newMedication]);
                setSnackbar({
                    open: true,
                    message: 'Medicamento criado com sucesso',
                    severity: 'success'
                });
            }

            handleCloseMedicationDialog();
        } catch (error) {
            console.error("Erro ao salvar medicamento:", error);
            setSnackbar({
                open: true,
                message: error.message || 'Erro ao salvar medicamento',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMedication = async (id) => {
        try {
            await FirebaseService.deleteMedication(doctorId, id);
            setMedications(prev => prev.filter(med => med.id !== id));
            setSnackbar({
                open: true,
                message: 'Medicamento excluído com sucesso',
                severity: 'success'
            });
        } catch (error) {
            console.error("Erro ao excluir medicamento:", error);
            setSnackbar({
                open: true,
                message: 'Erro ao excluir medicamento',
                severity: 'error'
            });
        }
    };

    // Prescription functions
    const handleOpenPrescriptionDetail = (prescription) => {
        setSelectedPrescription(prescription);
        setOpenDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setOpenDetailDialog(false);
        setSelectedPrescription(null);
    };

    // Filter functions
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Back to first page when searching
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Back to first page when filtering
    };

    const handleResetFilters = () => {
        setFilters({
            status: 'all',
            dateFrom: '',
            dateTo: '',
            patientId: '',
            medicationName: '',
        });
        setSearchTerm('');
        setSort('date-desc');
    };

    const handleSortChange = (newSort) => {
        setSort(newSort);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    // Utility functions for formatting
    const formatDate = (date) => {
        if (!date) return '';
        try {
            let jsDate;
            if (date instanceof Date) {
                jsDate = date;
            } else if (date && typeof date.toDate === 'function') {
                jsDate = date.toDate();
            } else if (typeof date === 'string') {
                // If the string contains "/" assume format "dd/MM/yyyy"
                if (date.includes('/')) {
                    jsDate = parse(date, 'dd/MM/yyyy', new Date());
                } else {
                    jsDate = new Date(date);
                }
            } else {
                jsDate = new Date(date);
            }

            // Check if date is valid
            if (!isValid(jsDate)) {
                console.error("Invalid date received:", date);
                return 'Data inválida';
            }

            if (isToday(jsDate)) {
                return `Hoje, ${format(jsDate, 'HH:mm')}`;
            } else if (isYesterday(jsDate)) {
                return `Ontem, ${format(jsDate, 'HH:mm')}`;
            } else {
                return format(jsDate, 'dd/MM/yyyy', { locale: ptBR });
            }
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Data inválida';
        }
    };


    const formatFullDate = (date) => {
        if (!date) return '';
        try {
            const jsDate = date instanceof Date ? date : date.toDate();
            return format(jsDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        } catch (error) {
            console.error("Error formatting full date:", error);
            return 'Data inválida';
        }
    };

    const formatRelativeTime = (date) => {
        if (!date) return '';
        try {
            const jsDate = date instanceof Date ? date : date.toDate();
            return formatDistanceToNow(jsDate, { addSuffix: true, locale: ptBR });
        } catch (error) {
            console.error("Error formatting relative time:", error);
            return '';
        }
    };

    // Rendering loading state
    if (loading && !prescriptions.length && !medications.length) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <CircularProgress size={60} sx={{ mb: 3, color: theme.palette.primary.main }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Carregando seus dados médicos...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Rendering error state
    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                        {error}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => window.location.reload()}
                        sx={{
                            mt: 2,
                            borderRadius: 10,
                            paddingX: 3,
                            textTransform: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        Tentar novamente
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    letterSpacing: '-0.02em'
                }}>
                    Gerenciamento de Receitas
                </Typography>
                <Typography variant="body1" sx={{
                    color: alpha(theme.palette.text.primary, 0.7),
                    mt: 1
                }}>
                    Crie, gerencie e acompanhe receitas e medicamentos para seus pacientes
                </Typography>
            </Box>

            {/* Main content card with tabs */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`
                }}
            >
                <StyledTabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="standard"
                    sx={{
                        px: 3,
                        pt: 2,
                        borderBottom: 1,
                        borderColor: 'divider'
                    }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab
                        label="Receitas"
                        icon={<PictureAsPdfOutlined />}
                        iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    />
                    <Tab
                        label="Medicamentos"
                        icon={<MedicationOutlined />}
                        iconPosition="start"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    />
                </StyledTabs>

                {/* Prescriptions Panel */}
                <TabPanel value={tabValue} index={0}>
                    {/* Search bar and filters */}
                    <Box sx={{ px: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <SearchBar elevation={0} sx={{
                                flex: 1,
                                mr: { xs: 0, sm: 2 },
                                mb: { xs: 2, sm: 0 },
                                width: { xs: '100%', sm: 'auto' }
                            }}>
                                <SearchOutlined color="action" sx={{ mr: 1, color: alpha(theme.palette.text.secondary, 0.7) }} />
                                <StyledInputBase
                                    placeholder="Pesquisar por paciente ou medicamento..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    fullWidth
                                />
                                {searchTerm && (
                                    <IconButton size="small" onClick={handleClearSearch} sx={{ opacity: 0.7 }}>
                                        <ClearOutlined fontSize="small" />
                                    </IconButton>
                                )}
                            </SearchBar>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Filtrar">
                                    <Button
                                        variant="outlined"
                                        color={Object.values(filters).some(v => v && v !== 'all') ? "primary" : "inherit"}
                                        onClick={() => setFiltersOpen(true)}
                                        startIcon={<FilterListOutlined />}
                                        sx={{
                                            borderRadius: 10,
                                            textTransform: 'none',
                                            px: 2
                                        }}
                                    >
                                        Filtros
                                    </Button>
                                </Tooltip>
                                <Tooltip title="Ordenar">
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        onClick={(e) => setFiltersOpen(true)}
                                        startIcon={<SortOutlined />}
                                        sx={{
                                            borderRadius: 10,
                                            textTransform: 'none',
                                            px: 2
                                        }}
                                    >
                                        Ordenar
                                    </Button>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Active filter chips */}
                        {Object.values(filters).some(v => v && v !== 'all') && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
                                {filters.status !== 'all' && (
                                    <FilterChip
                                        label={`Status: ${filters.status}`}
                                        onDelete={() => handleFilterChange('status', 'all')}
                                        selected
                                    />
                                )}
                                {filters.dateFrom && (
                                    <FilterChip
                                        label={`De: ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')}`}
                                        onDelete={() => handleFilterChange('dateFrom', '')}
                                        selected
                                    />
                                )}
                                {filters.dateTo && (
                                    <FilterChip
                                        label={`Até: ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`}
                                        onDelete={() => handleFilterChange('dateTo', '')}
                                        selected
                                    />
                                )}
                                {filters.patientId && (
                                    <FilterChip
                                        label={`Paciente específico`}
                                        onDelete={() => handleFilterChange('patientId', '')}
                                        selected
                                    />
                                )}
                                {filters.medicationName && (
                                    <FilterChip
                                        label={`Medicamento: ${filters.medicationName}`}
                                        onDelete={() => handleFilterChange('medicationName', '')}
                                        selected
                                    />
                                )}
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={handleResetFilters}
                                    startIcon={<ClearOutlined />}
                                    sx={{
                                        ml: 1,
                                        textTransform: 'none',
                                        color: alpha(theme.palette.text.primary, 0.7)
                                    }}
                                >
                                    Limpar filtros
                                </Button>
                            </Box>
                        )}

                        {/* Prescription list */}
                        {paginatedPrescriptions.length === 0 ? (
                            <EmptyStateContainer>
                                <Box
                                    component="img"
                                    src="/receitaicon.svg"
                                    alt="Sem receitas"
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        opacity: 0.6,
                                        mb: 3,
                                        filter: 'grayscale(0.3)'
                                    }}
                                />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Nenhuma receita encontrada
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{
                                        mb: 3,
                                        maxWidth: 500,
                                        mx: 'auto'
                                    }}
                                >
                                    {searchTerm || Object.values(filters).some(v => v && v !== 'all') ?
                                        'Tente ajustar os filtros ou termos de pesquisa para encontrar o que procura.' :
                                        'Você ainda não tem receitas cadastradas. Crie sua primeira receita agora mesmo.'}
                                </Typography>
                            </EmptyStateContainer>
                        ) : (
                            <AnimatedContent>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        Mostrando {paginatedPrescriptions.length} de {filteredPrescriptions.length} receitas
                                    </Typography>
                                </Box>

                                {paginatedPrescriptions.map((prescription, index) => (
                                    <Zoom
                                        in={true}
                                        key={prescription.id}
                                        style={{
                                            transitionDelay: `${index * 50}ms`,
                                            transformOrigin: 'center top'
                                        }}
                                    >
                                        <PrescriptionCard
                                            onClick={() => handleOpenPrescriptionDetail(prescription)}
                                            elevation={0}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <Box>
                                                {/* Card header with date and status */}
                                                <Box
                                                    sx={{
                                                        p: 2.5,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha(theme.palette.divider, 0.5),
                                                        bgcolor: alpha(theme.palette.background.default, 0.5)
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 38,
                                                                height: 38,
                                                                mr: 1.5,
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                                                            }}
                                                        >
                                                            <CalendarTodayOutlined fontSize="small" />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography
                                                                variant="subtitle2"
                                                                color="textPrimary"
                                                                sx={{ fontWeight: 600 }}
                                                            >
                                                                {formatDate(prescription.createdAt)}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                {formatRelativeTime(prescription.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Chip
                                                        label={prescription.status || 'Ativa'}
                                                        size="small"
                                                        component={StatusChip}
                                                        status={prescription.status || 'Ativa'}
                                                    />
                                                </Box>

                                                {/* Main content */}
                                                <Box sx={{ p: 3 }}>
                                                    <Grid container spacing={2} alignItems="center">
                                                        {/* Patient data */}
                                                        <Grid item xs={12} sm={5}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <StyledBadge
                                                                    overlap="circular"
                                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                                    variant="dot"
                                                                    sx={{ mr: 2 }}
                                                                >
                                                                    <Avatar
                                                                        sx={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                            color: theme.palette.secondary.main,
                                                                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
                                                                        }}
                                                                    >
                                                                        <PersonOutlined />
                                                                    </Avatar>
                                                                </StyledBadge>
                                                                <Box>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '1.1rem',
                                                                            lineHeight: 1.3
                                                                        }}
                                                                    >
                                                                        {prescription.patientData?.name || 'Paciente não encontrado'}
                                                                    </Typography>
                                                                    {prescription.patientData?.birthDate && (
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="textSecondary"
                                                                            sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                                                                        >
                                                                            <EventOutlined
                                                                                fontSize="small"
                                                                                sx={{
                                                                                    fontSize: '0.9rem',
                                                                                    mr: 0.5,
                                                                                    opacity: 0.7
                                                                                }}
                                                                            />
                                                                            {formatDate(prescription.patientData.birthDate)}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Grid>

                                                        {/* Medications */}
                                                        <Grid item xs={12} sm={7}>
                                                            <Box>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        mb: 1.5,
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <MedicationOutlined
                                                                        fontSize="small"
                                                                        sx={{ mr: 0.5, opacity: 0.7 }}
                                                                    />
                                                                    Medicamentos prescritos:
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                                    {prescription.medications?.slice(0, 3).map((med, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={`${med.medicationName} ${med.dosage || ''}`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{
                                                                                borderRadius: 10,
                                                                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                                                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                                                                            }}
                                                                        />
                                                                    ))}
                                                                    {prescription.medications?.length > 3 && (
                                                                        <Chip
                                                                            label={`+${prescription.medications.length - 3}`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{
                                                                                borderRadius: 10,
                                                                                borderColor: alpha(theme.palette.grey[400], 0.5),
                                                                                bgcolor: alpha(theme.palette.grey[100], 0.5)
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Box>

                                                {/* Footer with view button */}
                                                <Box
                                                    sx={{
                                                        py: 1.5,
                                                        px: 2,
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        borderTop: '1px solid',
                                                        borderColor: alpha(theme.palette.divider, 0.5),
                                                        bgcolor: alpha(theme.palette.background.default, 0.5)
                                                    }}
                                                >
                                                    <Button
                                                        variant="text"
                                                        color="primary"
                                                        endIcon={<KeyboardArrowRightOutlined />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Ver detalhes
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </PrescriptionCard>
                                    </Zoom>
                                ))}

                                {/* Pagination */}
                                {filteredPrescriptions.length > rowsPerPage && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                        <Pagination
                                            count={Math.ceil(filteredPrescriptions.length / rowsPerPage)}
                                            page={page}
                                            onChange={(e, newPage) => setPage(newPage)}
                                            color="primary"
                                            showFirstButton
                                            showLastButton
                                            shape="rounded"
                                            size="large"
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    borderRadius: 2,
                                                    margin: '0 4px'
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            </AnimatedContent>
                        )}
                    </Box>
                </TabPanel>

                {/* Medications Panel */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ px: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 3,
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: 2
                        }}>
                            <SearchBar elevation={0} sx={{
                                width: { xs: '100%', sm: 400 }
                            }}>
                                <SearchOutlined color="action" sx={{ mr: 1, color: alpha(theme.palette.text.secondary, 0.7) }} />
                                <StyledInputBase
                                    placeholder="Pesquisar medicamento..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                {searchTerm && (
                                    <IconButton size="small" onClick={handleClearSearch} sx={{ opacity: 0.7 }}>
                                        <ClearOutlined fontSize="small" />
                                    </IconButton>
                                )}
                            </SearchBar>

                            <ActionButton
                                variant="contained"
                                startIcon={<AddOutlined />}
                                onClick={() => handleOpenMedicationDialog()}
                                sx={{
                                    width: { xs: '100%', sm: 'auto' },
                                    borderRadius: 10
                                }}
                            >
                                Novo medicamento
                            </ActionButton>
                        </Box>

                        {/* Medications list */}
                        <Grid container spacing={3}>
                            {medications.length === 0 ? (
                                <Grid item xs={12}>
                                    <EmptyStateContainer>
                                        <MedicationOutlined sx={{
                                            fontSize: 80,
                                            color: alpha(theme.palette.text.secondary, 0.5),
                                            mb: 2
                                        }} />
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                            Nenhum medicamento cadastrado
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            sx={{
                                                mb: 3,
                                                maxWidth: 500,
                                                mx: 'auto'
                                            }}
                                        >
                                            Adicione medicamentos para facilitar a criação de receitas e agilizar seu trabalho
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddOutlined />}
                                            onClick={() => handleOpenMedicationDialog()}
                                            sx={{
                                                borderRadius: 10,
                                                px: 3,
                                                py: 1,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Adicionar primeiro medicamento
                                        </Button>
                                    </EmptyStateContainer>
                                </Grid>
                            ) : (
                                medications
                                    .filter(med => !searchTerm || med.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((medication, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={medication.id}>
                                            <Zoom
                                                in={true}
                                                style={{
                                                    transitionDelay: `${index * 50}ms`,
                                                    transformOrigin: 'center top'
                                                }}
                                            >
                                                <MedicationCard>
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        top: -15,
                                                        left: 20,
                                                        bgcolor: theme.palette.primary.main,
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: 36,
                                                        height: 36,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.4)}`
                                                    }}>
                                                        <LocalPharmacyOutlined fontSize="small" />
                                                    </Box>

                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 1 }}>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: 600,
                                                                display: '-webkit-box',
                                                                WebkitBoxOrient: 'vertical',
                                                                WebkitLineClamp: 1,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                pr: 4
                                                            }}
                                                        >
                                                            {medication.name}
                                                        </Typography>

                                                        <Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenMedicationDialog(medication);
                                                                }}
                                                                sx={{
                                                                    color: theme.palette.primary.main,
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                                                                    },
                                                                    mr: 0.5
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Deseja excluir o medicamento ${medication.name}?`)) {
                                                                        handleDeleteMedication(medication.id);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.error.main, 0.15),
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    <StyledDivider />

                                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                        {medication.form && (
                                                            <Grid item xs={6}>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    <CategoryOutlined
                                                                        fontSize="small"
                                                                        sx={{
                                                                            mr: 0.5,
                                                                            opacity: 0.7,
                                                                            mt: 0.3,
                                                                            fontSize: '0.9rem'
                                                                        }}
                                                                    />
                                                                    <span>
                                                                        <strong>Forma:</strong><br/>
                                                                        {medication.form}
                                                                    </span>
                                                                </Typography>
                                                            </Grid>
                                                        )}

                                                        {medication.category && (
                                                            <Grid item xs={6}>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    <LocalOfferOutlined
                                                                        fontSize="small"
                                                                        sx={{
                                                                            mr: 0.5,
                                                                            opacity: 0.7,
                                                                            mt: 0.3,
                                                                            fontSize: '0.9rem'
                                                                        }}
                                                                    />
                                                                    <span>
                                                                        <strong>Categoria:</strong><br/>
                                                                        {medication.category}
                                                                    </span>
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>

                                                    {medication.description && (
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            sx={{
                                                                mt: 2,
                                                                display: '-webkit-box',
                                                                WebkitBoxOrient: 'vertical',
                                                                WebkitLineClamp: 2,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {medication.description}
                                                        </Typography>
                                                    )}

                                                    {medication.dosages && medication.dosages.length > 0 && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={600}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <AssignmentOutlined
                                                                    fontSize="small"
                                                                    sx={{ mr: 0.5, opacity: 0.7 }}
                                                                />
                                                                Dosagens disponíveis:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                                                                {medication.dosages.map((dosage, idx) => (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={dosage}
                                                                        size="small"
                                                                        sx={{
                                                                            borderRadius: 10,
                                                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                            color: theme.palette.secondary.dark,
                                                                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </MedicationCard>
                                            </Zoom>
                                        </Grid>
                                    ))
                            )}
                        </Grid>
                    </Box>
                </TabPanel>
            </Paper>

            {/* Prescription detail dialog */}
            <Dialog
                open={openDetailDialog}
                onClose={handleCloseDetailDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflowY: 'visible',
                        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100px)'
                    }
                }}
                TransitionComponent={Fade}
                transitionDuration={350}
            >
                {selectedPrescription && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                        mr: 2,
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                                    }}>
                                        <PictureAsPdfOutlined />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Detalhes da Receita
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                            Emitida em {formatDate(selectedPrescription.createdAt)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    onClick={handleCloseDetailDialog}
                                    sx={{
                                        bgcolor: alpha(theme.palette.grey[200], 0.7),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.grey[300], 0.8),
                                        },
                                    }}
                                >
                                    <CloseOutlined />
                                </IconButton>
                            </Box>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 0 }}>
                            {/* Header with main information */}
                            <Box sx={{
                                p: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                borderBottom: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                            }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography
                                            variant="subtitle2"
                                            color="textSecondary"
                                            gutterBottom
                                            sx={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <PersonOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                            Paciente
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, fontSize: '1.25rem' }}
                                        >
                                            {selectedPrescription.patientData?.name || 'Paciente não encontrado'}
                                        </Typography>

                                        <Box sx={{ mt: 2 }}>
                                            {selectedPrescription.patientData?.email && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        mb: 1,
                                                        color: alpha(theme.palette.text.primary, 0.8),
                                                        fontSize: theme.typography.body2.fontSize
                                                    }}
                                                >
                                                    <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 60 }}>Email:</Box>
                                                    {selectedPrescription.patientData.email}
                                                </Box>
                                            )}

                                            {selectedPrescription.patientData?.phone && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        mb: 1,
                                                        color: alpha(theme.palette.text.primary, 0.8),
                                                        fontSize: theme.typography.body2.fontSize
                                                    }}
                                                >
                                                    <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 60 }}>Telefone:</Box>
                                                    {selectedPrescription.patientData.phone}
                                                </Box>
                                            )}

                                            {selectedPrescription.patientData?.birthDate && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: alpha(theme.palette.text.primary, 0.8),
                                                        fontSize: theme.typography.body2.fontSize
                                                    }}
                                                >
                                                    <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 60 }}>Nascimento:</Box>
                                                    {formatDate(selectedPrescription.patientData.birthDate)}
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography
                                            variant="subtitle2"
                                            color="textSecondary"
                                            gutterBottom
                                            sx={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <InfoOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                            Informações da Receita
                                        </Typography>

                                        <Box sx={{ mt: 2 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    color: alpha(theme.palette.text.primary, 0.8),
                                                    fontSize: theme.typography.body2.fontSize
                                                }}
                                            >
                                                <EventOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                                <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 100 }}>Data de emissão:</Box>
                                                {formatFullDate(selectedPrescription.createdAt)}
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    color: alpha(theme.palette.text.primary, 0.8),
                                                    fontSize: theme.typography.body2.fontSize
                                                }}
                                            >
                                                <CategoryOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                                <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 100 }}>Tipo:</Box>
                                                {selectedPrescription.tipo || 'Comum'}
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    color: alpha(theme.palette.text.primary, 0.8),
                                                    fontSize: theme.typography.body2.fontSize
                                                }}
                                            >
                                                <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 100 }}>Status:</Box>
                                                <Chip
                                                    label={selectedPrescription.status || 'Ativa'}
                                                    size="small"
                                                    component={StatusChip}
                                                    status={selectedPrescription.status || 'Ativa'}
                                                />
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    color: alpha(theme.palette.text.primary, 0.8),
                                                    fontSize: theme.typography.body2.fontSize
                                                }}
                                            >
                                                <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 100 }}>Uso:</Box>
                                                {selectedPrescription.uso || 'Interno'}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Medications */}
                            <Box sx={{ p: 4 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 3
                                    }}
                                >
                                    <MedicationOutlined sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                                    Medicamentos Prescritos
                                </Typography>

                                {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                                    selectedPrescription.medications.map((med, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                mb: 2.5,
                                                border: '1px solid',
                                                borderColor: alpha(theme.palette.divider, 0.7),
                                                borderRadius: 3,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.08)}`,
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={600}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    pb: 2,
                                                    borderBottom: '1px dashed',
                                                    borderColor: alpha(theme.palette.divider, 0.5),
                                                    color: theme.palette.primary.main
                                                }}
                                            >
                                                <LocalPharmacyOutlined sx={{ mr: 1, fontSize: '1.2rem' }} />
                                                {med.medicationName} {med.dosage}
                                            </Typography>

                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                {med.frequency && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            <AccessTimeOutlined
                                                                fontSize="small"
                                                                sx={{
                                                                    mr: 1,
                                                                    mt: 0.1,
                                                                    opacity: 0.7,
                                                                    fontSize: '1rem'
                                                                }}
                                                            />
                                                            <span>
                                                                <strong>Frequência:</strong><br />
                                                                {med.frequency}
                                                            </span>
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.duration && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            <HistoryOutlined
                                                                fontSize="small"
                                                                sx={{
                                                                    mr: 1,
                                                                    mt: 0.1,
                                                                    opacity: 0.7,
                                                                    fontSize: '1rem'
                                                                }}
                                                            />
                                                            <span>
                                                                <strong>Duração:</strong><br />
                                                                {med.duration}
                                                            </span>
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.form && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            <CategoryOutlined
                                                                fontSize="small"
                                                                sx={{
                                                                    mr: 1,
                                                                    mt: 0.1,
                                                                    opacity: 0.7,
                                                                    fontSize: '1rem'
                                                                }}
                                                            />
                                                            <span>
                                                                <strong>Forma:</strong><br />
                                                                {med.form}
                                                            </span>
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.quantidade && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            <InfoOutlined
                                                                fontSize="small"
                                                                sx={{
                                                                    mr: 1,
                                                                    mt: 0.1,
                                                                    opacity: 0.7,
                                                                    fontSize: '1rem'
                                                                }}
                                                            />
                                                            <span>
                                                                <strong>Quantidade:</strong><br />
                                                                {med.quantidade}
                                                            </span>
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            {(med.posologia || med.instructions || med.observacao) && (
                                                <Box
                                                    sx={{
                                                        mt: 3,
                                                        p: 2,
                                                        bgcolor: alpha(theme.palette.background.default, 0.5),
                                                        borderRadius: 2,
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.divider, 0.4)
                                                    }}
                                                >
                                                    {med.posologia && (
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Posologia:</strong> {med.posologia}
                                                        </Typography>
                                                    )}

                                                    {med.instructions && (
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Instruções:</strong> {med.instructions}
                                                        </Typography>
                                                    )}

                                                    {med.observacao && (
                                                        <Typography variant="body2">
                                                            <strong>Observações:</strong> {med.observacao}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 3,
                                            bgcolor: alpha(theme.palette.warning.light, 0.1),
                                            borderRadius: 2
                                        }}
                                    >
                                        <InfoOutlined sx={{ mr: 1, color: theme.palette.warning.main }} />
                                        Nenhum medicamento registrado nesta receita.
                                    </Typography>
                                )}
                            </Box>

                            {/* General instructions */}
                            {selectedPrescription.orientacaoGeral && (
                                <Box sx={{ px: 4, pb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2
                                        }}
                                    >
                                        <AssignmentOutlined sx={{ mr: 1.5, color: theme.palette.info.main }} />
                                        Instruções Gerais
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.info.main, 0.3),
                                            borderRadius: 3,
                                            backgroundColor: alpha(theme.palette.info.main, 0.05)
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                                            {selectedPrescription.orientacaoGeral}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {/* Observations */}
                            {selectedPrescription.observacoes && (
                                <Box sx={{ px: 4, pb: 4 }}>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2
                                        }}
                                    >
                                        <InfoOutlined sx={{ mr: 1.5, color: theme.palette.warning.main }} />
                                        Observações
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.divider, 0.7),
                                            borderRadius: 3
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                                            {selectedPrescription.observacoes}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                            <Button
                                onClick={handleCloseDetailDialog}
                                variant="outlined"
                                startIcon={<ArrowBackOutlined />}
                                sx={{
                                    borderRadius: 10,
                                    textTransform: 'none'
                                }}
                            >
                                Voltar
                            </Button>
                            {selectedPrescription.pdfUrl && (
                                <Button
                                    variant="contained"
                                    startIcon={<PictureAsPdfOutlined />}
                                    onClick={() => window.open(selectedPrescription.pdfUrl, '_blank')}
                                    sx={{
                                        borderRadius: 10,
                                        textTransform: 'none',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}
                                >
                                    Visualizar PDF
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Medication dialog */}
            <Dialog
                open={medicationDialogOpen}
                onClose={handleCloseMedicationDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100px)'
                    }
                }}
                TransitionComponent={Fade}
                transitionDuration={350}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{
                                bgcolor: theme.palette.secondary.main,
                                color: 'white',
                                mr: 2,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`
                            }}>
                                {selectedMedication ? <EditIcon /> : <LocalPharmacyOutlined />}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {selectedMedication ? 'Editar Medicamento' : 'Novo Medicamento'}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={handleCloseMedicationDialog}
                            sx={{
                                bgcolor: alpha(theme.palette.grey[200], 0.7),
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.grey[300], 0.8),
                                },
                            }}
                        >
                            <CloseOutlined />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nome do Medicamento"
                                name="name"
                                value={medicationFormData.name}
                                onChange={handleMedicationChange}
                                fullWidth
                                required
                                margin="normal"
                                placeholder="Ex: Dipirona"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Forma Farmacêutica"
                                name="form"
                                value={medicationFormData.form}
                                onChange={handleMedicationChange}
                                fullWidth
                                margin="normal"
                                placeholder="Ex: Comprimido, Solução Oral, Injetável"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Categoria"
                                name="category"
                                value={medicationFormData.category}
                                onChange={handleMedicationChange}
                                fullWidth
                                margin="normal"
                                placeholder="Ex: Analgésico, Antibiótico, Anti-inflamatório"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Descrição"
                                name="description"
                                value={medicationFormData.description}
                                onChange={handleMedicationChange}
                                fullWidth
                                multiline
                                rows={1}
                                margin="normal"
                                placeholder="Descrição breve do medicamento"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle1"
                                gutterBottom
                                sx={{
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 1
                                }}
                            >
                                <MedicationOutlined sx={{ mr: 1, fontSize: '1.1rem' }} />
                                Dosagens Disponíveis
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField
                                    label="Adicionar Dosagem"
                                    value={newDosage}
                                    onChange={(e) => setNewDosage(e.target.value)}
                                    placeholder="Ex: 500mg, 1g, 250mg/5ml"
                                    fullWidth
                                    margin="dense"
                                    variant="outlined"
                                    InputProps={{
                                        sx: { borderRadius: 2 },
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    onClick={handleAddDosage}
                                                    disabled={!newDosage.trim()}
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 10,
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Adicionar
                                                </Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newDosage.trim()) {
                                            e.preventDefault();
                                            handleAddDosage();
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                {medicationFormData.dosages.map((dosage, index) => (
                                    <Chip
                                        key={index}
                                        label={dosage}
                                        onDelete={() => handleRemoveDosage(index)}
                                        color="primary"
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 10,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.1)
                                            }
                                        }}
                                    />
                                ))}
                                {medicationFormData.dosages.length === 0 && (
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        sx={{
                                            p: 2,
                                            bgcolor: alpha(theme.palette.grey[100], 0.5),
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: alpha(theme.palette.grey[300], 0.8),
                                            width: '100%',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Nenhuma dosagem adicionada
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Instruções Comuns"
                                name="instructions"
                                value={medicationFormData.instructions}
                                onChange={handleMedicationChange}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                                placeholder="Instruções gerais sobre como usar este medicamento"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Efeitos Colaterais"
                                name="sideEffects"
                                value={medicationFormData.sideEffects}
                                onChange={handleMedicationChange}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                                placeholder="Liste os efeitos colaterais comuns"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contraindicações"
                                name="contraindications"
                                value={medicationFormData.contraindications}
                                onChange={handleMedicationChange}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                                placeholder="Liste as contraindicações principais"
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 }
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Button
                        onClick={handleCloseMedicationDialog}
                        variant="outlined"
                        sx={{
                            borderRadius: 10,
                            textTransform: 'none'
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveOutlined />}
                        onClick={handleSaveMedication}
                        disabled={!medicationFormData.name}
                        sx={{
                            borderRadius: 10,
                            textTransform: 'none',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                    >
                        {selectedMedication ? 'Atualizar' : 'Salvar'} Medicamento
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Filters drawer */}
            <Drawer
                anchor="right"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 420 },
                        p: 4,
                        borderTopLeftRadius: 24,
                        borderBottomLeftRadius: 24,
                        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100px)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}
                    >
                        <FilterListOutlined sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                        Filtros e Ordenação
                    </Typography>
                    <IconButton
                        onClick={() => setFiltersOpen(false)}
                        sx={{
                            bgcolor: alpha(theme.palette.grey[200], 0.7),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.grey[300], 0.8),
                            },
                        }}
                    >
                        <CloseOutlined />
                    </IconButton>
                </Box>

                <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        mt: 3
                    }}
                >
                    <CheckCircleOutlineOutlined sx={{ mr: 1, fontSize: '1.1rem', color: theme.palette.success.main }} />
                    Status da Receita
                </Typography>
                <FormControl fullWidth margin="normal" variant="outlined" sx={{ mt: 1 }}>
                    <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="all">Todos os status</MenuItem>
                        <MenuItem value="Ativa">Ativas</MenuItem>
                        <MenuItem value="Renovada">Renovadas</MenuItem>
                        <MenuItem value="Suspensa">Suspensas</MenuItem>
                        <MenuItem value="Concluída">Concluídas</MenuItem>
                    </Select>
                </FormControl>

                <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        mt: 4
                    }}
                >
                    <CalendarTodayOutlined sx={{ mr: 1, fontSize: '1.1rem', color: theme.palette.info.main }} />
                    Período
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <TextField
                            label="De"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                sx: { borderRadius: 2 }
                            }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Até"
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                sx: { borderRadius: 2 }
                            }}
                        />
                    </Grid>
                </Grid>

                <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        mt: 4
                    }}
                >
                    <SortOutlined sx={{ mr: 1, fontSize: '1.1rem', color: theme.palette.secondary.main }} />
                    Ordenação
                </Typography>
                <FormControl fullWidth margin="normal" variant="outlined" sx={{ mt: 1 }}>
                    <Select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="date-desc">Data (mais recente primeiro)</MenuItem>
                        <MenuItem value="date-asc">Data (mais antiga primeiro)</MenuItem>
                        <MenuItem value="patient-asc">Nome do paciente (A-Z)</MenuItem>
                        <MenuItem value="patient-desc">Nome do paciente (Z-A)</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ mt: 5 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResetFilters}
                        startIcon={<ClearOutlined />}
                        sx={{
                            mb: 2,
                            borderRadius: 10,
                            textTransform: 'none',
                            py: 1.2
                        }}
                    >
                        Limpar filtros
                    </Button>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setFiltersOpen(false)}
                        sx={{
                            borderRadius: 10,
                            textTransform: 'none',
                            py: 1.2,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                    >
                        Aplicar filtros
                    </Button>
                </Box>
            </Drawer>

            {/* Snackbar for messages */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Fade}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default PrescriptionsPage;