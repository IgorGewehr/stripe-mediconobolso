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
    ListItem,
    Divider,
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
    ListItemAvatar,
    Collapse,
    ButtonGroup,
    Pagination,
    InputBase,
    Badge,
    Switch,
    FormControlLabel,
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
} from '@mui/icons-material';
import FirebaseService from '../../lib/firebaseService';
import { format, formatDistanceToNow, isToday, isYesterday, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from "./authProvider";

// Componentes estilizados
const SearchBar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    borderRadius: 50,
    padding: theme.spacing(0.5, 2),
    marginBottom: theme.spacing(3),
    backgroundColor: alpha(theme.palette.common.white, 0.9),
    boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    '&:hover': {
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.08)',
    },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        fontFamily: 'Gellix, sans-serif',
    },
}));

const FilterChip = styled(Chip)(({ theme, selected }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
    color: selected ? theme.palette.common.white : theme.palette.primary.main,
    border: `1px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)}`,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.2),
    },
    '& .MuiChip-label': {
        padding: '0 10px',
    },
    transition: 'all 0.2s ease',
}));

const ActionButton = styled(Button)(({ theme, variant = 'contained', color = 'primary' }) => ({
    borderRadius: '50px',
    textTransform: 'none',
    boxShadow: variant === 'contained' ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '8px 16px',
    minWidth: 'auto',
    '&:hover': {
        boxShadow: variant === 'contained' ? '0px 6px 15px rgba(0, 0, 0, 0.15)' : 'none',
    },
}));

const PrescriptionCard = styled(Paper)(({ theme }) => ({
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.background.paper,
    marginBottom: theme.spacing(2),
    '&:hover': {
        boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.12)',
        transform: 'translateY(-2px)',
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
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
};

const MedicationCard = styled(Card)(({ theme }) => ({
    borderRadius: 12,
    width: '100%',
    padding: theme.spacing(2),
    transition: 'all 0.2s ease',
    border: `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    '&:hover': {
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-2px)',
        borderColor: alpha(theme.palette.primary.main, 0.3),
    },
}));

// Componente principal
const PrescriptionsPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const doctorId = user?.uid;

    // Estados para receitas
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);

    // Estados para medicamentos
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

    // Estados para filtros e pesquisa
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

    // Estados para paginação
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estado para feedback
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Carregar receitas e medicamentos
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

    // Filtrar receitas quando os filtros ou termo de pesquisa mudam
    useEffect(() => {
        if (!prescriptions.length) return;

        let results = [...prescriptions];

        // Aplicar filtro por status
        if (filters.status !== 'all') {
            results = results.filter(p => p.status === filters.status);
        }

        // Aplicar filtro por data
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

        // Aplicar filtro por paciente
        if (filters.patientId) {
            results = results.filter(p => p.patientData?.id === filters.patientId);
        }

        // Aplicar filtro por nome de medicamento
        if (filters.medicationName) {
            results = results.filter(p =>
                p.medications?.some(med =>
                    med.medicationName.toLowerCase().includes(filters.medicationName.toLowerCase())
                )
            );
        }

        // Aplicar termo de pesquisa
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(p =>
                p.patientData?.name.toLowerCase().includes(term) ||
                p.medications?.some(med => med.medicationName.toLowerCase().includes(term))
            );
        }

        // Aplicar ordenação
        results = sortPrescriptions(results, sort);

        setFilteredPrescriptions(results);
    }, [prescriptions, filters, searchTerm, sort]);

    // Ordenar receitas
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

    // Paginação
    const paginatedPrescriptions = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredPrescriptions.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredPrescriptions, page, rowsPerPage]);

    // Funções para manipular medicamentos
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
                // Atualizar medicamento existente
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
                // Criar novo medicamento
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

    // Funções para receitas
    const handleOpenPrescriptionDetail = (prescription) => {
        setSelectedPrescription(prescription);
        setOpenDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setOpenDetailDialog(false);
        setSelectedPrescription(null);
    };

    // Funções para filtros
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Volta para a primeira página ao pesquisar
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Volta para a primeira página ao filtrar
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

    // Utilitários para formatação
    const formatDate = (date) => {
        if (!date) return '';
        try {
            let jsDate;
            if (date instanceof Date) {
                jsDate = date;
            } else if (date && typeof date.toDate === 'function') {
                jsDate = date.toDate();
            } else if (typeof date === 'string') {
                // Se a string contém "/" assume o formato "dd/MM/yyyy"
                if (date.includes('/')) {
                    jsDate = parse(date, 'dd/MM/yyyy', new Date());
                } else {
                    jsDate = new Date(date);
                }
            } else {
                jsDate = new Date(date);
            }

            // Verifica se a data é válida
            if (!isValid(jsDate)) {
                console.error("Data inválida recebida:", date);
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
            console.error("Erro ao formatar data:", error);
            return 'Data inválida';
        }
    };


    const formatFullDate = (date) => {
        if (!date) return '';
        try {
            const jsDate = date instanceof Date ? date : date.toDate();
            return format(jsDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data completa:", error);
            return 'Data inválida';
        }
    };

    const formatRelativeTime = (date) => {
        if (!date) return '';
        try {
            const jsDate = date instanceof Date ? date : date.toDate();
            return formatDistanceToNow(jsDate, { addSuffix: true, locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar tempo relativo:", error);
            return '';
        }
    };

    // Renderização de estados
    if (loading && !prescriptions.length && !medications.length) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <CircularProgress size={60} sx={{ mb: 3 }} />
                    <Typography variant="h6" color="text.secondary">Carregando dados...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 2 }}
                    >
                        Tentar novamente
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={600} color="primary">
                    Gerenciamento de Receitas
                </Typography>
            </Box>

            {/* Tabs para alternar entre Receitas e Medicamentos */}
            <Paper sx={{ mb: 4, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
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
                </Tabs>

                {/* Painel de Receitas */}
                <TabPanel value={tabValue} index={0}>
                    {/* Barra de pesquisa e filtros */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <SearchBar elevation={0} sx={{ flex: 1, mr: 2 }}>
                            <SearchOutlined color="action" sx={{ mr: 1 }} />
                            <StyledInputBase
                                placeholder="Pesquisar por paciente ou medicamento..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                fullWidth
                            />
                            {searchTerm && (
                                <IconButton size="small" onClick={handleClearSearch}>
                                    <ClearOutlined fontSize="small" />
                                </IconButton>
                            )}
                        </SearchBar>

                        <ButtonGroup variant="outlined" sx={{ mr: 1 }}>
                            <Tooltip title="Filtrar">
                                <Button
                                    color={Object.values(filters).some(v => v && v !== 'all') ? "primary" : "inherit"}
                                    onClick={() => setFiltersOpen(true)}
                                    startIcon={<FilterListOutlined />}
                                >
                                    Filtros
                                </Button>
                            </Tooltip>
                            <Tooltip title="Ordenar">
                                <Button
                                    color="inherit"
                                    onClick={(e) => setFiltersOpen(true)}
                                    startIcon={<SortOutlined />}
                                >
                                    Ordenar
                                </Button>
                            </Tooltip>
                        </ButtonGroup>
                    </Box>

                    {/* Chips de filtros ativos */}
                    {Object.values(filters).some(v => v && v !== 'all') && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
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
                                sx={{ ml: 1 }}
                            >
                                Limpar filtros
                            </Button>
                        </Box>
                    )}

                    {/* Lista de receitas */}
                    {paginatedPrescriptions.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 2,
                                textAlign: 'center',
                                border: '1px dashed',
                                borderColor: 'grey.300',
                                backgroundColor: alpha(theme.palette.grey[100], 0.5)
                            }}
                        >
                            <Box
                                component="img"
                                src="/receitaicon.svg"
                                alt="Sem receitas"
                                sx={{ width: 80, height: 80, opacity: 0.5, mb: 2 }}
                            />
                            <Typography variant="h6" gutterBottom>
                                Nenhuma receita encontrada
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                {searchTerm || Object.values(filters).some(v => v && v !== 'all') ?
                                    'Tente ajustar os filtros ou termos de pesquisa' :
                                    'Você ainda não tem receitas cadastradas'}
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Mostrando {paginatedPrescriptions.length} de {filteredPrescriptions.length} receitas
                                </Typography>
                            </Box>

                            {paginatedPrescriptions.map((prescription) => (
                                <PrescriptionCard
                                    key={prescription.id}
                                    onClick={() => handleOpenPrescriptionDetail(prescription)}
                                    elevation={0}
                                >
                                    <Box sx={{ p: 0 }}>
                                        {/* Cabeçalho do card com data e status */}
                                        <Box
                                            sx={{
                                                p: 2,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                borderBottom: '1px solid',
                                                borderColor: 'grey.100',
                                                bgcolor: alpha(theme.palette.grey[50], 0.8)
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <AccessTimeOutlined fontSize="small" color="action" sx={{ mr: 1 }} />
                                                <Typography variant="body2" color="textSecondary">
                                                    {formatDate(prescription.createdAt)}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="textSecondary"
                                                    sx={{ ml: 1, fontSize: '0.75rem', opacity: 0.8 }}
                                                >
                                                    ({formatRelativeTime(prescription.createdAt)})
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={prescription.status || 'Ativa'}
                                                size="small"
                                                color={prescription.status === 'Ativa' ? 'success' : 'default'}
                                                variant={prescription.status === 'Ativa' ? 'filled' : 'outlined'}
                                            />
                                        </Box>

                                        {/* Conteúdo principal */}
                                        <Box sx={{ p: 2 }}>
                                            <Grid container spacing={2}>
                                                {/* Dados do paciente */}
                                                <Grid item xs={12} sm={5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: theme.palette.primary.main,
                                                                mr: 1.5
                                                            }}
                                                        >
                                                            <PersonOutlined />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {prescription.patientData?.name || 'Paciente não encontrado'}
                                                            </Typography>
                                                            {prescription.patientData?.birthDate && (
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {formatDate(prescription.patientData.birthDate)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                {/* Medicamentos */}
                                                <Grid item xs={12} sm={7}>
                                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                                        Medicamentos prescritos:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                        {prescription.medications?.slice(0, 3).map((med, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={`${med.medicationName} ${med.dosage || ''}`}
                                                                size="small"
                                                                icon={<MedicationOutlined fontSize="small" />}
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                        {prescription.medications?.length > 3 && (
                                                            <Chip
                                                                label={`+${prescription.medications.length - 3}`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Rodapé com botão de visualizar */}
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                borderTop: '1px solid',
                                                borderColor: 'grey.100',
                                                bgcolor: alpha(theme.palette.grey[50], 0.5)
                                            }}
                                        >
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="primary"
                                                endIcon={<VisibilityOutlined />}
                                            >
                                                Ver detalhes
                                            </Button>
                                        </Box>
                                    </Box>
                                </PrescriptionCard>
                            ))}

                            {/* Paginação */}
                            {filteredPrescriptions.length > rowsPerPage && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={Math.ceil(filteredPrescriptions.length / rowsPerPage)}
                                        page={page}
                                        onChange={(e, newPage) => setPage(newPage)}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </TabPanel>

                {/* Painel de Medicamentos */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <SearchBar elevation={0} sx={{ maxWidth: 400 }}>
                            <SearchOutlined color="action" sx={{ mr: 1 }} />
                            <StyledInputBase
                                placeholder="Pesquisar medicamento..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            {searchTerm && (
                                <IconButton size="small" onClick={handleClearSearch}>
                                    <ClearOutlined fontSize="small" />
                                </IconButton>
                            )}
                        </SearchBar>

                        <ActionButton
                            variant="contained"
                            startIcon={<AddOutlined />}
                            onClick={() => handleOpenMedicationDialog()}
                        >
                            Novo medicamento
                        </ActionButton>
                    </Box>

                    {/* Lista de medicamentos */}
                    <Grid container spacing={2}>
                        {medications.length === 0 ? (
                            <Grid item xs={12}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 6,
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        border: '1px dashed',
                                        borderColor: 'grey.300',
                                        backgroundColor: alpha(theme.palette.grey[100], 0.5)
                                    }}
                                >
                                    <MedicationOutlined sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Nenhum medicamento cadastrado
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        Adicione medicamentos para facilitar a criação de receitas
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddOutlined />}
                                        onClick={() => handleOpenMedicationDialog()}
                                    >
                                        Adicionar primeiro medicamento
                                    </Button>
                                </Paper>
                            </Grid>
                        ) : (
                            medications
                                .filter(med => !searchTerm || med.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(medication => (
                                    <Grid item xs={12} sm={6} md={4} key={medication.id}>
                                        <MedicationCard>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LocalPharmacyOutlined color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {medication.name}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenMedicationDialog(medication);
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
                                                    >
                                                        <DeleteOutlined fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            {medication.form && (
                                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                                    <strong>Forma:</strong> {medication.form}
                                                </Typography>
                                            )}

                                            {medication.category && (
                                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                                    <strong>Categoria:</strong> {medication.category}
                                                </Typography>
                                            )}

                                            {medication.description && (
                                                <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mt: 1 }}>
                                                    {medication.description}
                                                </Typography>
                                            )}

                                            {medication.dosages && medication.dosages.length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        Dosagens disponíveis:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5 }}>
                                                        {medication.dosages.map((dosage, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={dosage}
                                                                size="small"
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </MedicationCard>
                                    </Grid>
                                ))
                        )}
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Dialog de detalhes da receita */}
            <Dialog
                open={openDetailDialog}
                onClose={handleCloseDetailDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflowY: 'visible'
                    }
                }}
            >
                {selectedPrescription && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PictureAsPdfOutlined color="primary" sx={{ mr: 1.5 }} />
                                    <Typography variant="h6">Detalhes da Receita</Typography>
                                </Box>
                                <IconButton onClick={handleCloseDetailDialog}>
                                    <CloseOutlined />
                                </IconButton>
                            </Box>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 0 }}>
                            {/* Header com informações principais */}
                            <Box sx={{
                                p: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                borderBottom: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                            }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Paciente
                                        </Typography>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedPrescription.patientData?.name || 'Paciente não encontrado'}
                                        </Typography>

                                        {selectedPrescription.patientData?.email && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <span style={{ opacity: 0.7, marginRight: 8 }}>Email:</span>
                                                {selectedPrescription.patientData.email}
                                            </Typography>
                                        )}

                                        {selectedPrescription.patientData?.phone && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <span style={{ opacity: 0.7, marginRight: 8 }}>Telefone:</span>
                                                {selectedPrescription.patientData.phone}
                                            </Typography>
                                        )}

                                        {selectedPrescription.patientData?.birthDate && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ opacity: 0.7, marginRight: 8 }}>Data de nascimento:</span>
                                                {formatDate(selectedPrescription.patientData.birthDate)}
                                            </Typography>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Informações da Receita
                                        </Typography>

                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <EventOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                            <span style={{ opacity: 0.7, marginRight: 8 }}>Data de emissão:</span>
                                            {formatFullDate(selectedPrescription.createdAt)}
                                        </Typography>

                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <CategoryOutlined fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                            <span style={{ opacity: 0.7, marginRight: 8 }}>Tipo:</span>
                                            {selectedPrescription.tipo || 'Comum'}
                                        </Typography>

                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <span style={{ opacity: 0.7, marginRight: 8 }}>Status:</span>
                                            <Chip
                                                label={selectedPrescription.status || 'Ativa'}
                                                size="small"
                                                color={selectedPrescription.status === 'Ativa' ? 'success' : 'default'}
                                            />
                                        </Typography>

                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <span style={{ opacity: 0.7, marginRight: 8 }}>Uso:</span>
                                            {selectedPrescription.uso || 'Interno'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Medicamentos */}
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Medicamentos Prescritos
                                </Typography>

                                {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                                    selectedPrescription.medications.map((med, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                border: '1px solid',
                                                borderColor: 'grey.200',
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {med.medicationName} {med.dosage}
                                            </Typography>

                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                {med.frequency && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography variant="body2">
                                                            <strong>Frequência:</strong> {med.frequency}
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.duration && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography variant="body2">
                                                            <strong>Duração:</strong> {med.duration}
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.form && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography variant="body2">
                                                            <strong>Forma:</strong> {med.form}
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {med.quantidade && (
                                                    <Grid item xs={12} sm={4}>
                                                        <Typography variant="body2">
                                                            <strong>Quantidade:</strong> {med.quantidade}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            {med.posologia && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2">
                                                        <strong>Posologia:</strong> {med.posologia}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {med.instructions && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2">
                                                        <strong>Instruções:</strong> {med.instructions}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {med.observacao && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2">
                                                        <strong>Observações:</strong> {med.observacao}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Nenhum medicamento registrado nesta receita.
                                    </Typography>
                                )}
                            </Box>

                            {/* Instruções gerais */}
                            {selectedPrescription.orientacaoGeral && (
                                <Box sx={{ px: 3, pb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Instruções Gerais
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: 'grey.200',
                                            borderRadius: 2,
                                            backgroundColor: alpha(theme.palette.info.main, 0.05)
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {selectedPrescription.orientacaoGeral}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {/* Observações */}
                            {selectedPrescription.observacoes && (
                                <Box sx={{ px: 3, pb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Observações
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: 'grey.200',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {selectedPrescription.observacoes}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2 }}>
                            <Button
                                onClick={handleCloseDetailDialog}
                                variant="outlined"
                            >
                                Fechar
                            </Button>
                            {selectedPrescription.pdfUrl && (
                                <Button
                                    variant="contained"
                                    startIcon={<PictureAsPdfOutlined />}
                                    onClick={() => window.open(selectedPrescription.pdfUrl, '_blank')}
                                >
                                    Visualizar PDF
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Dialog de medicamento */}
            <Dialog
                open={medicationDialogOpen}
                onClose={handleCloseMedicationDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {selectedMedication ? 'Editar Medicamento' : 'Novo Medicamento'}
                        </Typography>
                        <IconButton onClick={handleCloseMedicationDialog}>
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
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
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
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    onClick={handleAddDosage}
                                                    disabled={!newDosage.trim()}
                                                    variant="contained"
                                                    size="small"
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

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {medicationFormData.dosages.map((dosage, index) => (
                                    <Chip
                                        key={index}
                                        label={dosage}
                                        onDelete={() => handleRemoveDosage(index)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                                {medicationFormData.dosages.length === 0 && (
                                    <Typography variant="body2" color="textSecondary">
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
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseMedicationDialog}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveOutlined />}
                        onClick={handleSaveMedication}
                        disabled={!medicationFormData.name}
                    >
                        {selectedMedication ? 'Atualizar' : 'Salvar'} Medicamento
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de filtros */}
            <Drawer
                anchor="right"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderBottomLeftRadius: 16,
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Filtros e Ordenação</Typography>
                    <IconButton onClick={() => setFiltersOpen(false)}>
                        <CloseOutlined />
                    </IconButton>
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                    Status da Receita
                </Typography>
                <FormControl fullWidth margin="normal">
                    <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        displayEmpty
                    >
                        <MenuItem value="all">Todos os status</MenuItem>
                        <MenuItem value="Ativa">Ativas</MenuItem>
                        <MenuItem value="Renovada">Renovadas</MenuItem>
                        <MenuItem value="Suspensa">Suspensas</MenuItem>
                        <MenuItem value="Concluída">Concluídas</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Período
                </Typography>
                <Grid container spacing={2}>
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
                        />
                    </Grid>
                </Grid>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Ordenação
                </Typography>
                <FormControl fullWidth margin="normal">
                    <Select
                        value={sort}
                        onChange={(e) => handleSortChange(e.target.value)}
                    >
                        <MenuItem value="date-desc">Data (mais recente primeiro)</MenuItem>
                        <MenuItem value="date-asc">Data (mais antiga primeiro)</MenuItem>
                        <MenuItem value="patient-asc">Nome do paciente (A-Z)</MenuItem>
                        <MenuItem value="patient-desc">Nome do paciente (Z-A)</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResetFilters}
                        startIcon={<ClearOutlined />}
                        sx={{ mb: 2 }}
                    >
                        Limpar filtros
                    </Button>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setFiltersOpen(false)}
                    >
                        Aplicar filtros
                    </Button>
                </Box>
            </Drawer>

            {/* Snackbar para mensagens */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default PrescriptionsPage;