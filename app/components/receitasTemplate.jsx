"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Grid,
    Stack,
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
    Pagination,
    InputBase,
    Badge,
    Divider,
    Fade,
    Zoom,
    ButtonGroup, CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CardHeader,
    ListItem,
    ListItemText,
    ListItemIcon, CardActions
} from '@mui/material';
import {
    SearchOutlined,
    FilterListOutlined,
    SortOutlined,
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
    ClearOutlined,
    SaveOutlined,
    LocalHospitalOutlined,
    PersonOutlined,
    CheckCircleOutlineOutlined,
    CalendarTodayOutlined,
    EditOutlined as EditIcon,
    ArrowBackOutlined,
    KeyboardArrowRightOutlined,
    AssignmentOutlined,
    LocalOfferOutlined,
    StarOutline,
    StarRate,
    FilterAlt as FilterAltIcon,
    ViewList as ViewListIcon,
    GridView as GridViewIcon,
} from '@mui/icons-material';
import FirebaseService from "../../lib/firebaseService";
import { format, formatDistanceToNow, isToday, isYesterday, isValid, parse, isPast, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from "./authProvider";
import SearchBar from "./basicComponents/searchBar";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatDistance } from 'date-fns';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { styled } from '@mui/material/styles';

// Adicione após os imports
const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
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

const convertToDate = (value) => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'string') {
        // Se a string tiver "/" assume formato "dd/MM/yyyy"
        if (value.includes('/')) {
            const parsed = parse(value, 'dd/MM/yyyy', new Date());
            return isValid(parsed) ? parsed : new Date();
        }
        const parsed = new Date(value);
        return isValid(parsed) ? parsed : new Date();
    }
    if (typeof value === 'object') {
        // Se for um objeto vazio, retorne a data atual (ou trate conforme sua necessidade)
        if (Object.keys(value).length === 0) return new Date();
        const parsed = new Date(value);
        return isValid(parsed) ? parsed : new Date();
    }
    return new Date(value);
};

// Componente principal da página
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
    // Estados para métricas de medicamentos
    const [topMedications, setTopMedications] = useState([]);
    const [recentMedications, setRecentMedications] = useState([]);
    const [formDistribution, setFormDistribution] = useState([]);

    // Medication states
    const [medications, setMedications] = useState([]);
    const [currentTab, setCurrentTab] = useState('prescriptions');
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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        patientId: '',
        medicationName: '',
    });
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [sort, setSort] = useState('date-desc');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    // Pagination states
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Feedback state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Métricas
    const [metrics, setMetrics] = useState({
        totalPrescriptions: 0,
        activePrescriptions: 0,
        pendingPrescriptions: 0,
        totalMedications: 0
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

                // Validar os dados recebidos
                if (!Array.isArray(prescriptionsData)) {
                    console.error("Dados de prescrições inválidos:", prescriptionsData);
                    throw new Error("Formato de dados inválido para prescrições");
                }

                if (!Array.isArray(medicationsData)) {
                    console.error("Dados de medicamentos inválidos:", medicationsData);
                    throw new Error("Formato de dados inválido para medicamentos");
                }

                // Ensure all prescriptions have a status and valid timestamps
                const processedPrescriptions = prescriptionsData.map(p => ({
                    ...p,
                    status: p.status || 'Ativa', // Default to 'Ativa' if status is missing
                    createdAt: convertToDate(p.createdAt),
                    updatedAt: convertToDate(p.updatedAt),
                }));

                setPrescriptions(processedPrescriptions);
                setFilteredPrescriptions(processedPrescriptions);
                setMedications(medicationsData);

                // Calculate metrics
                setMetrics({
                    totalPrescriptions: processedPrescriptions.length,
                    activePrescriptions: processedPrescriptions.filter(p => p.status === 'Ativa').length,
                    pendingPrescriptions: processedPrescriptions.filter(p => p.status === 'Pendente').length,
                    totalMedications: medicationsData.length
                });
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setError(`Não foi possível carregar os dados. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [doctorId]);

    // Filter prescriptions when filters or search term change
    // Filter prescriptions when filters or search term change
    useEffect(() => {
        if (!prescriptions.length) return;

        let results = [...prescriptions];

        // Apply tab filter
        if (currentTab === 'active') {
            results = results.filter(p => p.status === 'Ativa');
        } else if (currentTab === 'pending') {
            results = results.filter(p => p.status === 'Pendente');
        } else if (currentTab === 'recent') {
            // Last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            results = results.filter(p => {
                const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                return createdAt >= thirtyDaysAgo;
            });
        }

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(p =>
                p.patientData?.name?.toLowerCase().includes(term) ||
                p.medications?.some(med => med.medicationName?.toLowerCase().includes(term))
            );
        }

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

        // Apply sorting
        results = sortPrescriptions(results, sort);

        setFilteredPrescriptions(results);
        setPage(1);
    }, [prescriptions, searchTerm, filters, sort, currentTab]);

    // Pagination
    const paginatedPrescriptions = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredPrescriptions.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredPrescriptions, page, rowsPerPage]);


// Função auxiliar para determinar a cor por categoria
    const getMedicationCategoryColor = (category) => {
        const categories = {
            'Analgésico': theme.palette.primary.main,
            'Antibiótico': theme.palette.success.main,
            'Anti-inflamatório': theme.palette.warning.main,
            'Antidepressivo': theme.palette.info.main,
            'Ansiolítico': theme.palette.secondary.main
        };

        return categories[category] || theme.palette.grey[500];
    };

// Função para adicionar medicamento à receita atual (para implementar)
    const handleAddToCurrentPrescription = (medication) => {
        // Implementar lógica para adicionar à receita atual ou criar nova receita
        setSnackbar({
            open: true,
            message: `${medication.name} adicionado à receita`,
            severity: 'success'
        });
    };

// Função para selecionar medicamento da pesquisa
    const handleMedicationSelect = (medication) => {
        // Implementar ação ao selecionar medicamento na pesquisa
        handleOpenMedicationDialog(medication);
    };

    // Use este useEffect para calcular as métricas
    useEffect(() => {
        if (medications.length > 0) {
            // Calcular medicamentos mais receitados com base em prescrições reais
            const medicationCounts = {};

            // Conta ocorrências de cada medicamento nas prescrições
            prescriptions.forEach(prescription => {
                prescription.medications?.forEach(med => {
                    if (med.medicationName) {
                        medicationCounts[med.medicationName] = (medicationCounts[med.medicationName] || 0) + 1;
                    }
                });
            });

            // Converte para array e ordena
            const medCounts = Object.entries(medicationCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setTopMedications(medCounts.length > 0 ? medCounts : []);

            // Medicamentos recentes - usar criados realmente mais recentes
            const recent = [...medications]
                .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 5)
                .map(med => ({
                    name: med.name,
                    addedDate: med.createdAt || new Date()
                }));
            setRecentMedications(recent);

            // Distribuição por forma farmacêutica
            const formCounts = {};
            medications.forEach(med => {
                if (med.form) {
                    formCounts[med.form] = (formCounts[med.form] || 0) + 1;
                }
            });

            const formData = Object.entries(formCounts).map(([name, value]) => ({
                name,
                value
            }));
            setFormDistribution(formData);
        }
    }, [medications, prescriptions]);

    // Sort prescriptions
    const sortPrescriptions = useMemo(() => {
        return (prescriptionsToSort, sortOrder) => {
            return [...prescriptionsToSort].sort((a, b) => {
                const dateA = convertToDate(a.createdAt);
                const dateB = convertToDate(b.createdAt);

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
    }, []);

    // Função para verificar se existem filtros ativos
    const hasActiveFilters =
        filters.status !== 'all' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        filters.patientId !== '' ||
        filters.medicationName !== '';

    // Functions for handling medications
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
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

    // Componente simples para o gráfico de rosca
    // Componente DonutChart - adicione junto às outras funções auxiliares
// (antes do return principal, aproximadamente por volta da linha 580-590)
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const DonutChart = ({ data }) => {
        // Se não houver dados ou estiver vazio, renderize uma mensagem
        if (!data || data.length === 0) {
            return (
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Sem dados disponíveis
                    </Typography>
                </Box>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${value} medicamentos`, 'Quantidade']}
                        contentStyle={{
                            borderRadius: 8,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            border: 'none',
                            padding: '8px 12px'
                        }}
                    />
                    <Legend
                        formatter={(value) => <span style={{ fontSize: '0.75rem' }}>{value}</span>}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
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

            // Update metrics
            setMetrics(prev => ({
                ...prev,
                totalMedications: selectedMedication ? prev.totalMedications : prev.totalMedications + 1
            }));

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

            // Update metrics
            setMetrics(prev => ({
                ...prev,
                totalMedications: prev.totalMedications - 1
            }));

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

    // Função para busca com atraso
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const handleFilterClick = (event) => {
        setFiltersOpen(true);
    };

    const handleFilterClose = () => {
        setFiltersOpen(false);
    };


    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Back to first page when filtering
    };

    const handleRemoveFilter = (type, value) => {
        if (type === 'status') {
            setFilters(prev => ({ ...prev, status: 'all' }));
        } else if (type === 'dateFrom') {
            setFilters(prev => ({ ...prev, dateFrom: '' }));
        } else if (type === 'dateTo') {
            setFilters(prev => ({ ...prev, dateTo: '' }));
        } else if (type === 'patientId') {
            setFilters(prev => ({ ...prev, patientId: '' }));
        } else if (type === 'medicationName') {
            setFilters(prev => ({ ...prev, medicationName: '' }));
        }
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

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };
    // Localização: função handleStatusChange
    const handleStatusChange = async (prescriptionId, patientId, newStatus) => {
        try {
            setLoading(true);

            if (!doctorId || !patientId || !prescriptionId) {
                throw new Error("Dados incompletos para atualizar o status");
            }

            // Encontrar a prescrição no array atual
            const prescriptionToUpdate = prescriptions.find(p => p.id === prescriptionId);
            if (!prescriptionToUpdate) {
                throw new Error("Prescrição não encontrada");
            }

            // Atualizar o status no Firebase
            await FirebaseService.updatePrescription(doctorId, patientId, prescriptionId, {
                status: newStatus,
                updatedAt: new Date()
            });

            // Atualizar o estado local
            const updatedPrescriptions = prescriptions.map(p =>
                p.id === prescriptionId ? { ...p, status: newStatus, updatedAt: new Date() } : p
            );
            setPrescriptions(updatedPrescriptions);

            // Atualizar a prescrição selecionada, se estiver aberta no modal
            if (selectedPrescription && selectedPrescription.id === prescriptionId) {
                setSelectedPrescription({ ...selectedPrescription, status: newStatus, updatedAt: new Date() });
            }

            // Recalcular métricas
            const activePrescriptions = updatedPrescriptions.filter(p => p.status === 'Ativa').length;
            const pendingPrescriptions = updatedPrescriptions.filter(p => p.status === 'Pendente').length;

            setMetrics(prevMetrics => ({
                ...prevMetrics,
                activePrescriptions,
                pendingPrescriptions
            }));

            setSnackbar({
                open: true,
                message: `Status alterado para ${newStatus}`,
                severity: 'success'
            });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            setSnackbar({
                open: true,
                message: `Erro ao atualizar status: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };


    // Utility functions for formatting
    const formatDate = (date) => {
        if (!date) return '';
        try {
            const jsDate = convertToDate(date);
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
    const formatRelativeTime = (date) => {
        if (!date) return '';
        try {
            const jsDate = convertToDate(date);
            if (!isValid(jsDate)) {
                console.error("Invalid date for relative time:", date);
                return '';
            }
            return formatDistanceToNow(jsDate, { addSuffix: true, locale: ptBR });
        } catch (error) {
            console.error("Error formatting relative time:", error);
            return '';
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



    // Componente para o chip de status
    const StatusChip = ({ status }) => {
        let color, bgColor, textColor;

        switch(status?.toLowerCase()) {
            case 'ativa':
                color = theme.palette.success.main;
                bgColor = alpha(theme.palette.success.main, 0.12);
                textColor = theme.palette.success.dark;
                break;
            case 'suspensa':
                color = theme.palette.warning.main;
                bgColor = alpha(theme.palette.warning.main, 0.12);
                textColor = theme.palette.warning.dark;
                break;
            case 'concluída':
                color = theme.palette.grey[500];
                bgColor = alpha(theme.palette.grey[300], 0.4);
                textColor = theme.palette.grey[800];
                break;
            case 'renovada':
                color = theme.palette.info.main;
                bgColor = alpha(theme.palette.info.main, 0.12);
                textColor = theme.palette.info.dark;
                break;
            case 'pendente':
                color = theme.palette.warning.main;
                bgColor = alpha(theme.palette.warning.main, 0.08);
                textColor = theme.palette.warning.dark;
                break;
            default:
                color = theme.palette.info.main;
                bgColor = alpha(theme.palette.info.main, 0.1);
                textColor = theme.palette.info.dark;
        }

        return (
            <Chip
                label={status || 'Ativa'}
                size="small"
                sx={{
                    borderRadius: 12,
                    border: `1px solid ${color}`,
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: 600,
                    '& .MuiChip-label': {
                        padding: '0 10px',
                    },
                    boxShadow: `0 1px 3px ${alpha(color, 0.1)}`,
                }}
            />
        );
    };

    // Componente para chip de filtro no cabeçalho
    const FilterChip = ({ label, onDelete }) => {
        return (
            <Chip
                label={label}
                onDelete={onDelete}
                deleteIcon={<CloseOutlined fontSize="small" />}
                sx={{
                    margin: '0 4px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    borderRadius: '50px',
                    fontWeight: 500,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '& .MuiChip-deleteIcon': {
                        color: theme.palette.primary.main,
                        '&:hover': {
                            color: alpha(theme.palette.primary.main, 0.7),
                        },
                    },
                }}
            />
        );
    };

    // Rendering loading state
    if (loading && !prescriptions.length && !medications.length) {
        return (
            <Box sx={{ p: 0, backgroundColor: '#F4F9FF', height: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <CircularProgress size={60} sx={{ mb: 3, color: theme.palette.primary.main }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Carregando seus dados médicos...
                    </Typography>
                </Box>
            </Box>
        );
    }

    // Rendering error state
    if (error) {
        return (
            <Box sx={{ p: 0, backgroundColor: '#F4F9FF', height: '100%' }}>
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
            </Box>
        );
    }

    return (
        <Box sx={{ p: 0, backgroundColor: '#F4F9FF' }}>
            {/* Cabeçalho com abas */}
            <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="standard"
                scrollButtons="auto"
                sx={{
                    mb: 3,
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
                    value="prescriptions"
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
                    value="active"
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Pendentes
                            <Chip
                                label={metrics.pendingPrescriptions}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value="pending"
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Recentes
                            <Chip
                                label="30d"
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value="recent"
                />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Medicamentos
                            <Chip
                                label={metrics.totalMedications}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    }
                    value="medications"
                />
            </Tabs>

            {/* Cards de métricas */}
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
                            <Typography component="div" variant="h4" sx={{ mt: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : metrics.totalPrescriptions}
                            </Typography>
                            {loading ? (
                                <Box sx={{ mt: 1 }}>
                                    <Chip size="small" label="Carregando..." />
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    +3 receitas nesta semana
                                </Typography>
                            )}
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
                            <Typography component="div"  variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#4CAF50' }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : metrics.activePrescriptions}
                            </Typography>
                            {loading ? (
                                <Box sx={{ mt: 1 }}>
                                    <Chip size="small" label="Carregando..." />
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    <span style={{ color: '#4CAF50' }}>{Math.round((metrics.activePrescriptions / metrics.totalPrescriptions) * 100) || 0}%</span> do total
                                </Typography>
                            )}
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
                                Receitas Pendentes
                            </Typography>
                            <Typography component="div" variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#FF9800' }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : metrics.pendingPrescriptions}
                            </Typography>
                            <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : 'Requerem sua atenção'}
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
                                Medicamentos Cadastrados
                            </Typography>
                            <Typography component="div" variant="h4" sx={{ mt: 1, fontWeight: 600, color: '#2196F3' }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : metrics.totalMedications}
                            </Typography>
                            <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {loading ? <Chip size="small" label="Carregando..." /> : `${medications.filter(m => m.dosages?.length > 0).length} com dosagens definidas`}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Barra de Pesquisa e Filtros principal - escondida na seção de medicamentos */}
            {currentTab !== 'medications' && (
                <Box
                    sx={{
                        mb: 3,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: 2
                    }}
                >
                    <SearchBar
                        onSearch={handleSearch}
                        isTablet={false}
                        placeholder="Buscar receitas..."
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            flex: { xs: '1', sm: '1 1 50%' }
                        }}
                    >
                        {hasActiveFilters && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FilterAltIcon />}
                                onClick={handleResetFilters}
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
                                startIcon={<FilterListOutlined />}
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
                                    onClick={() => handleViewModeChange('table')}
                                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
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
                                    onClick={() => handleViewModeChange('grid')}
                                    variant={viewMode === 'grid' ? 'contained' : 'outlined'}
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
            )}

            {/* Chips de filtros ativos - apenas quando não estiver na aba de medicamentos */}
            {hasActiveFilters && currentTab !== 'medications' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {filters.status !== 'all' && (
                        <FilterChip
                            label={`Status: ${filters.status}`}
                            onDelete={() => handleRemoveFilter('status')}
                        />
                    )}

                    {filters.dateFrom && (
                        <FilterChip
                            label={`De: ${filters.dateFrom}`}
                            onDelete={() => handleRemoveFilter('dateFrom')}
                        />
                    )}

                    {filters.dateTo && (
                        <FilterChip
                            label={`Até: ${filters.dateTo}`}
                            onDelete={() => handleRemoveFilter('dateTo')}
                        />
                    )}

                    {filters.patientId && (
                        <FilterChip
                            label="Paciente específico"
                            onDelete={() => handleRemoveFilter('patientId')}
                        />
                    )}

                    {filters.medicationName && (
                        <FilterChip
                            label={`Medicamento: ${filters.medicationName}`}
                            onDelete={() => handleRemoveFilter('medicationName')}
                        />
                    )}
                </Box>
            )}

            {/* Conteúdo Principal */}
            <Box sx={{ mt: 2 }}>
                {/* Aba de Receitas */}
                {currentTab !== 'medications' && (
                    <>
                        {paginatedPrescriptions.length === 0 ? (
                            <Paper sx={{
                                padding: 6,
                                borderRadius: 4,
                                textAlign: 'center',
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.grey[300], 0.7),
                                backgroundColor: alpha(theme.palette.grey[50], 0.5),
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
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
                                    {searchTerm || hasActiveFilters ?
                                        'Tente ajustar os filtros ou termos de pesquisa para encontrar o que procura.' :
                                        'Você ainda não tem receitas cadastradas. Crie sua primeira receita agora mesmo.'}
                                </Typography>
                            </Paper>
                        ) : (
                            <>
                                {/* Vista em Tabela */}
                                {viewMode === 'table' && (
                                    <Paper sx={{
                                        borderRadius: '24px',
                                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{ p: 3 }}>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                                Mostrando {paginatedPrescriptions.length} de {filteredPrescriptions.length} receitas
                                            </Typography>

                                            <Grid container spacing={2}>
                                                {paginatedPrescriptions.map((prescription, index) => (
                                                    <Grid item xs={12} key={prescription.id}>
                                                        <Paper
                                                            elevation={0}
                                                            onClick={() => handleOpenPrescriptionDetail(prescription)}
                                                            sx={{
                                                                p: 0,
                                                                borderRadius: 3,
                                                                overflow: 'hidden',
                                                                cursor: 'pointer',
                                                                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                                                transition: 'all 0.3s ease',
                                                                '&:hover': {
                                                                    boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
                                                                    transform: 'translateY(-4px)',
                                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                p: 2,
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(theme.palette.divider, 0.5),
                                                                bgcolor: alpha(theme.palette.background.default, 0.5)
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <CalendarTodayOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {formatDate(prescription.createdAt)}
                                                                        <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                                            ({formatRelativeTime(prescription.createdAt)})
                                                                        </Typography>
                                                                    </Typography>
                                                                </Box>
                                                                <StatusChip status={prescription.status || 'Ativa'} />
                                                            </Box>

                                                            <Box sx={{ p: 2 }}>
                                                                <Grid container spacing={2} alignItems="center">
                                                                    <Grid item xs={12} md={5}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <Avatar
                                                                                sx={{
                                                                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                                    color: theme.palette.secondary.main,
                                                                                    width: 40,
                                                                                    height: 40,
                                                                                    mr: 2
                                                                                }}
                                                                            >
                                                                                <PersonOutlined />
                                                                            </Avatar>
                                                                            <Box>
                                                                                <Typography variant="subtitle2" fontWeight={600}>
                                                                                    {prescription.patientData?.name || 'Paciente não encontrado'}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {prescription.patientData?.email || 'Sem e-mail'}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Grid>

                                                                    <Grid item xs={12} md={5}>
                                                                        <Box>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                                                <MedicationOutlined fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                                                                Medicamentos:
                                                                            </Typography>
                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                {prescription.medications?.slice(0, 2).map((med, idx) => (
                                                                                    <Chip
                                                                                        key={idx}
                                                                                        label={med.medicationName}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            borderRadius: 2,
                                                                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                                                            color: theme.palette.primary.main,
                                                                                            fontWeight: 500
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                                {prescription.medications?.length > 2 && (
                                                                                    <Chip
                                                                                        label={`+${prescription.medications.length - 2}`}
                                                                                        size="small"
                                                                                        sx={{
                                                                                            borderRadius: 2,
                                                                                            bgcolor: alpha(theme.palette.grey[400], 0.1),
                                                                                            fontWeight: 500
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </Grid>

                                                                    <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                                                                        <Button
                                                                            endIcon={<KeyboardArrowRightOutlined />}
                                                                            sx={{
                                                                                textTransform: 'none',
                                                                                fontWeight: 500
                                                                            }}
                                                                        >
                                                                            Detalhes
                                                                        </Button>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>

                                        {/* Paginação */}
                                        {filteredPrescriptions.length > rowsPerPage && (
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
                                    </Paper>
                                )}

                                {/* Vista em Grid */}
                                {viewMode === 'grid' && (
                                    <>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Mostrando {paginatedPrescriptions.length} de {filteredPrescriptions.length} receitas
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={3}>
                                            {paginatedPrescriptions.map((prescription, index) => (
                                                <Grid item xs={12} sm={6} md={4} key={prescription.id}>
                                                    <Zoom
                                                        in={true}
                                                        style={{
                                                            transitionDelay: `${index * 50}ms`,
                                                            transformOrigin: 'center top'
                                                        }}
                                                    >
                                                        <Paper
                                                            onClick={() => handleOpenPrescriptionDetail(prescription)}
                                                            elevation={0}
                                                            sx={{
                                                                height: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                borderRadius: '24px',
                                                                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                                                                overflow: 'hidden',
                                                                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                '&:hover': {
                                                                    boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1)',
                                                                    transform: 'translateY(-5px)',
                                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                                },
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Box sx={{
                                                                p: 2,
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                borderBottom: '1px solid',
                                                                borderColor: alpha(theme.palette.divider, 0.5),
                                                                bgcolor: alpha(theme.palette.background.default, 0.5)
                                                            }}>
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
                                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                                            {formatDate(prescription.createdAt)}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {formatRelativeTime(prescription.createdAt)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <StatusChip status={prescription.status || 'Ativa'} />
                                                            </Box>

                                                            <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                                                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                                                            {prescription.patientData?.name || 'Paciente não encontrado'}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                                            {prescription.patientData?.email || 'Sem e-mail'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                <Divider sx={{ my: 1.5 }} />

                                                                <Box sx={{ mb: 'auto' }}>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                        <MedicationOutlined fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                                                        Medicamentos prescritos:
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                                        {prescription.medications?.map((med, idx) => (
                                                                            <Chip
                                                                                key={idx}
                                                                                label={`${med.medicationName} ${med.dosage || ''}`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    borderRadius: 10,
                                                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                                    mb: 0.5
                                                                                }}
                                                                            />
                                                                        ))}
                                                                        {!prescription.medications?.length && (
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Nenhum medicamento registrado
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ display: 'flex', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'flex-end' }}>
                                                                    <Button
                                                                        size="small"
                                                                        endIcon={<KeyboardArrowRightOutlined />}
                                                                        variant="contained"
                                                                        color="primary"
                                                                        sx={{
                                                                            borderRadius: '50px',
                                                                            fontSize: '0.75rem',
                                                                            boxShadow: '0 2px 8px 0 rgba(0,118,255,0.25)',
                                                                            textTransform: 'none'
                                                                        }}
                                                                    >
                                                                        Ver Detalhes
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    </Zoom>
                                                </Grid>
                                            ))}
                                        </Grid>

                                        {/* Paginação */}
                                        {filteredPrescriptions.length > rowsPerPage && (
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                mt: 4,
                                                mb: 2
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
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Aba de Medicamentos */}
                {currentTab === 'medications' && (
                    <>
                        {/* Cards de métricas otimizados */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {/* Card de Total de Medicamentos */}
                            <Grid item xs={12} sm={6} md={4}>
                                <Card sx={{
                                    borderRadius: 3,
                                    height: '100%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Medicamentos Cadastrados
                                        </Typography>
                                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                                            {metrics.totalMedications}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {medications.filter(m => m.dosages?.length > 0).length} com dosagens definidas
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Card de Formas Farmacêuticas - Melhorado */}
                            <Grid item xs={12} sm={6} md={4}>
                                <Card sx={{
                                    borderRadius: 3,
                                    height: '100%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Formas Farmacêuticas
                                        </Typography>
                                        <Box sx={{ height: 180, width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={formDistribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        outerRadius={70}
                                                        innerRadius={30}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {formDistribution.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value) => [`${value} medicamentos`, 'Quantidade']}
                                                        contentStyle={{
                                                            borderRadius: 8,
                                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                            border: 'none',
                                                            padding: '8px 12px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Card de Medicamentos Recentes - Melhorado */}
                            <Grid item xs={12} sm={6} md={4}>
                                <Card sx={{
                                    borderRadius: 3,
                                    height: '100%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <CardHeader
                                        title="Medicamentos Recentes"
                                        titleTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                                        action={
                                            <Button
                                                variant="contained"
                                                startIcon={<AddOutlined />}
                                                onClick={() => handleOpenMedicationDialog()}
                                                size="small"
                                                sx={{
                                                    borderRadius: 8,
                                                    textTransform: 'none',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    bgcolor: theme.palette.success.main,
                                                    '&:hover': {
                                                        bgcolor: theme.palette.success.dark
                                                    }
                                                }}
                                            >
                                                Novo Medicamento
                                            </Button>
                                        }
                                    />
                                    <CardContent sx={{ pt: 0 }}>
                                        <List sx={{ mt: 1 }}>
                                            {[...medications]
                                                .sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()))
                                                .slice(0, 3)
                                                .map((med, index) => (
                                                    <ListItem key={index} disablePadding sx={{
                                                        mb: 1,
                                                        pb: 1,
                                                        borderBottom: index < 2 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none'
                                                    }}>
                                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                                            <LocalPharmacyOutlined fontSize="small" color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={med.name}
                                                            secondary={med.form || 'Não especificado'}
                                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                                            secondaryTypographyProps={{ variant: 'caption' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                        </List>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Barra de Pesquisa e Botão de Novo Medicamento - sem filtros */}
                        <Box
                            sx={{
                                mb: 3,
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 2
                            }}
                        >
                            <SearchBar
                                onSearch={handleSearch}
                                isTablet={false}
                                placeholder="Buscar medicamentos..."
                            />

                            <Button
                                size="medium"
                                variant="contained"
                                startIcon={<AddOutlined />}
                                onClick={() => handleOpenMedicationDialog()}
                                sx={{
                                    borderRadius: '50px',
                                    backgroundColor: theme.palette.success.main,
                                    '&:hover': {
                                        backgroundColor: theme.palette.success.dark,
                                    },
                                    alignSelf: { xs: 'stretch', sm: 'auto' },
                                    whitespace: 'nowrap',
                                    px: 3
                                }}
                            >
                                Novo Medicamento
                            </Button>
                        </Box>

                        {medications.length === 0 ? (
                            <Paper sx={{
                                padding: 6,
                                borderRadius: 4,
                                textAlign: 'center',
                                border: '2px dashed',
                                borderColor: alpha(theme.palette.grey[300], 0.7),
                                backgroundColor: alpha(theme.palette.grey[50], 0.5),
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
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
                            </Paper>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {medications
                                        .filter(med => !searchTerm || med.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((medication, index) => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={medication.id}>
                                                <Card sx={{
                                                    borderRadius: 4,
                                                    height: '100%',
                                                    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                                    boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.03)',
                                                    '&:hover': {
                                                        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.08)',
                                                        transform: 'translateY(-4px)',
                                                    },
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}>
                                                    <Box sx={{
                                                        p: 2,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}>
                                                        <Typography variant="subtitle1" fontWeight={600}>
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
                                                                    if (window.confirm(`Deseja excluir ${medication.name}?`)) {
                                                                        handleDeleteMedication(medication.id);
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                    <CardContent sx={{ pt: 2, flexGrow: 1 }}>
                                                        {medication.form && (
                                                            <Chip
                                                                label={medication.form}
                                                                size="small"
                                                                sx={{
                                                                    mb: 2,
                                                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                    color: theme.palette.secondary.main,
                                                                    fontWeight: 500,
                                                                    borderRadius: '12px'
                                                                }}
                                                                icon={<CategoryOutlined style={{ fontSize: '16px' }} />}
                                                            />
                                                        )}

                                                        {medication.dosages && medication.dosages.length > 0 ? (
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                                                                    Dosagens:
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                                    {medication.dosages.map((dosage, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={dosage}
                                                                            size="small"
                                                                            sx={{
                                                                                borderRadius: 10,
                                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                                color: theme.palette.primary.main,
                                                                                mb: 0.5
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                                                                Nenhuma dosagem definida
                                                            </Typography>
                                                        )}

                                                        {medication.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{
                                                                display: '-webkit-box',
                                                                WebkitBoxOrient: 'vertical',
                                                                WebkitLineClamp: 2,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {medication.description}
                                                            </Typography>
                                                        )}
                                                    </CardContent>
                                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleOpenMedicationDialog(medication)}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            Editar
                                                        </Button>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}
                                </Grid>
                            </>
                        )}
                    </>
                )}
            </Box>

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
                                                <StatusChip status={selectedPrescription.status || 'Ativa'} />
                                            </Box>


                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                    mt: 2,
                                                    color: alpha(theme.palette.text.primary, 0.8),
                                                    fontSize: theme.typography.body2.fontSize
                                                }}
                                            >
                                                <Box component="span" sx={{ opacity: 0.7, mr: 1, minWidth: 100 }}>Alterar status:</Box>
                                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                                    <Select
                                                        value={selectedPrescription.status || 'Ativa'}
                                                        onChange={(e) => handleStatusChange(selectedPrescription.id, selectedPrescription.patientData.id, e.target.value)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            '& .MuiSelect-select': { py: 0.5 }
                                                        }}
                                                    >
                                                        <MenuItem value="Ativa">Ativa</MenuItem>
                                                        <MenuItem value="Pendente">Pendente</MenuItem>
                                                        <MenuItem value="Suspensa">Suspensa</MenuItem>
                                                        <MenuItem value="Concluída">Concluída</MenuItem>
                                                        <MenuItem value="Renovada">Renovada</MenuItem>
                                                    </Select>
                                                </FormControl>
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
                    {/* Layout simplificado - apenas campos essenciais visíveis inicialmente */}
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Nome do Medicamento"
                                name="name"
                                value={medicationFormData.name}
                                onChange={handleMedicationChange}
                                fullWidth
                                required
                                autoFocus
                                placeholder="Ex: Dipirona, Amoxicilina, Losartana..."
                                variant="outlined"
                                InputProps={{
                                    sx: { borderRadius: 2 },
                                    endAdornment: medicationFormData.name ? (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setMedicationFormData(prev => ({ ...prev, name: '' }))}>
                                                <ClearOutlined fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Forma</InputLabel>
                                <Select
                                    name="form"
                                    value={medicationFormData.form}
                                    onChange={handleMedicationChange}
                                    label="Forma"
                                >
                                    <MenuItem value="">Selecione...</MenuItem>
                                    <MenuItem value="Comprimido">Comprimido</MenuItem>
                                    <MenuItem value="Cápsula">Cápsula</MenuItem>
                                    <MenuItem value="Solução Oral">Solução Oral</MenuItem>
                                    <MenuItem value="Xarope">Xarope</MenuItem>
                                    <MenuItem value="Injetável">Injetável</MenuItem>
                                    <MenuItem value="Pomada">Pomada</MenuItem>
                                    <MenuItem value="Creme">Creme</MenuItem>
                                    <MenuItem value="Gotas">Gotas</MenuItem>
                                    <MenuItem value="Spray">Spray</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Dosagem Principal"
                                name="newDosage"
                                value={newDosage}
                                onChange={(e) => setNewDosage(e.target.value)}
                                fullWidth
                                placeholder="Ex: 500mg, 50mg/ml"
                                InputProps={{
                                    endAdornment: newDosage ? (
                                        <InputAdornment position="end">
                                            <Button
                                                onClick={handleAddDosage}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            >
                                                Adicionar
                                            </Button>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Dosagens adicionadas */}
                    {medicationFormData.dosages.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {medicationFormData.dosages.map((dosage, index) => (
                                <Chip
                                    key={index}
                                    label={dosage}
                                    onDelete={() => handleRemoveDosage(index)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ borderRadius: 10 }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Accordion para campos opcionais - expandidos somente se necessário */}
                    <Accordion
                        sx={{
                            mt: 3,
                            backgroundColor: 'transparent',
                            '&:before': { display: 'none' },
                            boxShadow: 'none',
                            border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                            borderRadius: 2,
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography color="primary" sx={{ fontWeight: 500 }}>
                                Informações adicionais (opcional)
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Categoria"
                                        name="category"
                                        value={medicationFormData.category}
                                        onChange={handleMedicationChange}
                                        fullWidth
                                        placeholder="Ex: Analgésico, Antibiótico"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Instruções"
                                        name="instructions"
                                        value={medicationFormData.instructions}
                                        onChange={handleMedicationChange}
                                        fullWidth
                                        placeholder="Ex: Tomar com água"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Descrição"
                                        name="description"
                                        value={medicationFormData.description}
                                        onChange={handleMedicationChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Informações adicionais sobre o medicamento"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
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
                        <MenuItem value="Pendente">Pendentes</MenuItem>
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

                {/* Filtro por paciente */}
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
                    <PersonOutlined sx={{ mr: 1, fontSize: '1.1rem', color: theme.palette.secondary.main }} />
                    Paciente
                </Typography>
                <FormControl fullWidth margin="normal" variant="outlined" sx={{ mt: 1 }}>
                    <TextField
                        label="Buscar por nome do paciente"
                        value={filters.patientId}
                        onChange={(e) => handleFilterChange('patientId', e.target.value)}
                        fullWidth
                        placeholder="Digite o nome do paciente"
                        variant="outlined"
                        InputProps={{
                            sx: { borderRadius: 2 }
                        }}
                    />
                </FormControl>

                {/* Filtro por medicamento */}
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
                    <MedicationOutlined sx={{ mr: 1, fontSize: '1.1rem', color: theme.palette.info.main }} />
                    Medicamento
                </Typography>
                <FormControl fullWidth margin="normal" variant="outlined" sx={{ mt: 1 }}>
                    <TextField
                        label="Buscar por medicamento"
                        value={filters.medicationName}
                        onChange={(e) => handleFilterChange('medicationName', e.target.value)}
                        fullWidth
                        placeholder="Digite o nome do medicamento"
                        variant="outlined"
                        InputProps={{
                            sx: { borderRadius: 2 }
                        }}
                    />
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
        </Box>
    );
};

export default PrescriptionsPage;