"use client";

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Visibility as VisibilityIcon,
    ChevronRight as ChevronRightIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import FirebaseService from '../../lib/FirebaseService';
import { prescriptionModel } from '../../lib/modelObjects';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes estilizados
const PrescriptionCard = styled(Card)(({ theme }) => ({
    position: 'relative',
    width: '100%',
    borderRadius: 24,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
    '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.12)',
    },
    border: '1px solid rgba(0, 0, 0, 0.05)',
}));

const PrescriptionNumber = styled(Typography)(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 300,
    color: alpha(theme.palette.primary.main, 0.8),
    marginRight: theme.spacing(2),
}));

const PrescriptionDate = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
}));

const ViewButton = styled(Button)(({ theme }) => ({
    borderRadius: '999px',
    boxShadow: 'none',
    textTransform: 'none',
    padding: '8px 20px',
    fontWeight: 600,
    fontSize: '0.875rem',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        boxShadow: '0px 4px 8px rgba(51, 102, 255, 0.15)',
        transform: 'translateY(-1px)',
    },
}));

const CreateButton = styled(Button)(({ theme }) => ({
    borderRadius: '999px',
    textTransform: 'none',
    padding: '10px 24px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    boxShadow: '0px 6px 16px rgba(51, 102, 255, 0.25)',
    backgroundColor: theme.palette.primary.main,
    fontSize: '0.95rem',
    letterSpacing: '0.2px',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: '0px 8px 20px rgba(51, 102, 255, 0.4)',
        transform: 'translateY(-2px)',
    },
}));

const MedicationChip = styled(Chip)(({ theme }) => ({
    borderRadius: '999px',
    margin: theme.spacing(0.5),
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 500,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    '& .MuiChip-label': {
        padding: '4px 8px',
    },
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginBottom: theme.spacing(0.5),
}));

const DetailValue = styled(Typography)(({ theme }) => ({
    fontWeight: 400,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
}));

const PatientName = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
}));

// Componente principal
const PrescriptionsPage = () => {
    const theme = useTheme();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Form para nova receita
    const [newPrescription, setNewPrescription] = useState({
        patientId: '',
        doctorId: '', // Será definido dinamicamente com o ID do médico logado
        medications: [
            {
                medicationName: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: ''
            }
        ],
        generalInstructions: '',
        status: 'Ativa',
        prescriptionDate: new Date().toISOString().split('T')[0],
    });

    // Fetch das receitas
    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                setLoading(true);
                // Aqui você usará o ID do médico logado. Por enquanto, usando um placeholder
                const doctorId = "DOCTOR_ID"; // Substitua pelo ID do médico autenticado
                const prescriptionsData = await FirebaseService.listAllPrescriptions(doctorId);

                // Ordenando por data de criação e limitando a 10
                const sortedPrescriptions = prescriptionsData
                    .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
                    .slice(0, 10);

                // Para cada prescrição, buscar o nome do paciente
                const prescriptionsWithPatientNames = await Promise.all(
                    sortedPrescriptions.map(async (prescription) => {
                        try {
                            const patient = await FirebaseService.getPatient(prescription.patientId);
                            return {
                                ...prescription,
                                patientName: patient ? patient.patientName : 'Paciente não encontrado'
                            };
                        } catch (err) {
                            console.error(`Erro ao buscar paciente ${prescription.patientId}:`, err);
                            return {
                                ...prescription,
                                patientName: 'Paciente não encontrado'
                            };
                        }
                    })
                );

                setPrescriptions(prescriptionsWithPatientNames);
            } catch (err) {
                console.error("Erro ao carregar receitas:", err);
                setError("Não foi possível carregar as receitas. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        };

        const fetchPatients = async () => {
            try {
                // Usando o ID do médico logado
                const doctorId = "DOCTOR_ID"; // Substitua pelo ID do médico autenticado
                const patients = await FirebaseService.getPatientsByDoctor(doctorId);
                setPatientsList(patients);
            } catch (err) {
                console.error("Erro ao carregar lista de pacientes:", err);
            }
        };

        fetchPrescriptions();
        fetchPatients();
    }, []);

    // Formatador de data
    const formatDate = (date) => {
        if (!date) return '';
        try {
            const jsDate = date instanceof Date ? date : date.toDate();
            return format(jsDate, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return 'Data inválida';
        }
    };

    // Manipuladores de eventos
    const handleViewPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setOpenDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setOpenDetailDialog(false);
        setSelectedPrescription(null);
    };

    const handleOpenCreateDialog = () => {
        setOpenCreateDialog(true);
    };

    const handleCloseCreateDialog = () => {
        setOpenCreateDialog(false);
        // Reset do formulário
        setNewPrescription({
            patientId: '',
            doctorId: '', // Será definido dinamicamente com o ID do médico logado
            medications: [
                {
                    medicationName: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                }
            ],
            generalInstructions: '',
            status: 'Ativa',
            prescriptionDate: new Date().toISOString().split('T')[0],
        });
    };

    const handleAddMedication = () => {
        setNewPrescription({
            ...newPrescription,
            medications: [
                ...newPrescription.medications,
                {
                    medicationName: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                }
            ]
        });
    };

    const handleRemoveMedication = (index) => {
        const updatedMedications = [...newPrescription.medications];
        updatedMedications.splice(index, 1);
        setNewPrescription({
            ...newPrescription,
            medications: updatedMedications
        });
    };

    const handleMedicationChange = (index, field, value) => {
        const updatedMedications = [...newPrescription.medications];
        updatedMedications[index] = {
            ...updatedMedications[index],
            [field]: value
        };
        setNewPrescription({
            ...newPrescription,
            medications: updatedMedications
        });
    };

    const handlePrescriptionChange = (field, value) => {
        setNewPrescription({
            ...newPrescription,
            [field]: value
        });
    };

    const handleCreatePrescription = async () => {
        try {
            setLoading(true);
            // Adicionar ID do médico logado
            const doctorId = "DOCTOR_ID"; // Substitua pelo ID do médico autenticado

            const prescriptionData = {
                ...newPrescription,
                doctorId,
                prescriptionDate: new Date(newPrescription.prescriptionDate),
            };

            await FirebaseService.createPrescription(newPrescription.patientId, prescriptionData);

            // Atualizar a lista de receitas
            const updatedPrescriptions = await FirebaseService.listAllPrescriptions(doctorId);
            const sortedPrescriptions = updatedPrescriptions
                .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
                .slice(0, 10);

            setPrescriptions(sortedPrescriptions);

            setSnackbar({
                open: true,
                message: 'Receita criada com sucesso!',
                severity: 'success'
            });

            handleCloseCreateDialog();
        } catch (err) {
            console.error("Erro ao criar receita:", err);
            setSnackbar({
                open: true,
                message: 'Erro ao criar receita. Tente novamente.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    // Renderização condicional durante carregamento
    if (loading && prescriptions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Renderização se houver erro
    if (error) {
        return (
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
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                    <Box
                        component="img"
                        src="/receitascard.svg"
                        alt="Receitas"
                        sx={{
                            width: 88.391,
                            height: 139.179,
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Typography variant="h3" component="h1" sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        textAlign: 'center',
                        mb: 3,
                        position: 'relative',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 80,
                            height: 3,
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 2
                        }
                    }}>
                        Receitas
                    </Typography>
                </Box>

                <CreateButton
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                    Criar nova receita
                </CreateButton>
            </Box>

            {/* Lista de receitas */}
            <Paper
                elevation={2}
                sx={{
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                }}
            >
                {prescriptions.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Nenhuma receita encontrada
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Clique em "Criar nova receita" para adicionar sua primeira prescrição.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {prescriptions.map((prescription, index) => (
                            <React.Fragment key={prescription.id}>
                                <ListItem
                                    sx={{
                                        p: 0,
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', width: '100%', p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100px' }}>
                                            <PrescriptionNumber>
                                                {String(index + 1).padStart(3, '0')}
                                            </PrescriptionNumber>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <PrescriptionDate>
                                                {formatDate(prescription.prescriptionDate || prescription.createdAt)}
                                            </PrescriptionDate>
                                            <PatientName>
                                                Paciente: {prescription.patientName}
                                            </PatientName>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                                                {prescription.medications && prescription.medications.slice(0, 3).map((med, idx) => (
                                                    <MedicationChip
                                                        key={idx}
                                                        label={`${med.medicationName} ${med.dosage}`}
                                                        size="small"
                                                    />
                                                ))}
                                                {prescription.medications && prescription.medications.length > 3 && (
                                                    <MedicationChip
                                                        label={`+${prescription.medications.length - 3}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 120 }}>
                                            <ViewButton
                                                endIcon={<ChevronRightIcon />}
                                                onClick={() => handleViewPrescription(prescription)}
                                            >
                                                Ver receita
                                            </ViewButton>
                                        </Box>
                                    </Box>
                                </ListItem>
                                {index < prescriptions.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Modal de detalhes da receita */}
            <Dialog
                open={openDetailDialog}
                onClose={handleCloseDetailDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                {selectedPrescription && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Detalhes da Receita</Typography>
                                <IconButton onClick={handleCloseDetailDialog}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <DetailLabel>Paciente</DetailLabel>
                                    <DetailValue variant="body1">
                                        {selectedPrescription.patientName}
                                    </DetailValue>

                                    <DetailLabel>Data da Prescrição</DetailLabel>
                                    <DetailValue variant="body1">
                                        {formatDate(selectedPrescription.prescriptionDate || selectedPrescription.createdAt)}
                                    </DetailValue>

                                    <DetailLabel>Status</DetailLabel>
                                    <DetailValue variant="body1">
                                        <Chip
                                            label={selectedPrescription.status || 'Ativa'}
                                            size="small"
                                            color={selectedPrescription.status === 'Ativa' ? 'success' : 'default'}
                                        />
                                    </DetailValue>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <DetailLabel>Código</DetailLabel>
                                    <DetailValue variant="body1">
                                        {selectedPrescription.id}
                                    </DetailValue>

                                    <DetailLabel>Criado em</DetailLabel>
                                    <DetailValue variant="body1">
                                        {formatDate(selectedPrescription.createdAt)}
                                    </DetailValue>
                                </Grid>

                                <Grid item xs={12}>
                                    <DetailLabel>Instruções Gerais</DetailLabel>
                                    <DetailValue variant="body1">
                                        {selectedPrescription.generalInstructions || 'Nenhuma instrução geral.'}
                                    </DetailValue>
                                </Grid>

                                <Grid item xs={12}>
                                    <DetailLabel>Medicamentos</DetailLabel>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                                            <List disablePadding>
                                                {selectedPrescription.medications.map((med, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <ListItem sx={{ px: 0, py: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Typography variant="subtitle1" fontWeight={500}>
                                                                {med.medicationName} {med.dosage}
                                                            </Typography>
                                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                                <Grid item xs={12} sm={4}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <strong>Frequência:</strong> {med.frequency || 'Não especificada'}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <strong>Duração:</strong> {med.duration || 'Não especificada'}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={12} sm={4}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <strong>Forma:</strong> {med.form || 'Não especificada'}
                                                                    </Typography>
                                                                </Grid>
                                                                {med.instructions && (
                                                                    <Grid item xs={12}>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            <strong>Instruções:</strong> {med.instructions}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}
                                                            </Grid>
                                                        </ListItem>
                                                        {idx < selectedPrescription.medications.length - 1 && (
                                                            <Divider />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Nenhum medicamento registrado.
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button
                                onClick={handleCloseDetailDialog}
                                color="inherit"
                            >
                                Fechar
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    // Aqui você pode implementar a impressão da receita
                                    window.print();
                                }}
                                startIcon={<VisibilityIcon />}
                            >
                                Imprimir Receita
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Modal de criação de receita */}
            <Dialog
                open={openCreateDialog}
                onClose={handleCloseCreateDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Nova Receita</Typography>
                        <IconButton onClick={handleCloseCreateDialog}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                <InputLabel id="patient-select-label">Paciente</InputLabel>
                                <Select
                                    labelId="patient-select-label"
                                    id="patient-select"
                                    value={newPrescription.patientId}
                                    onChange={(e) => handlePrescriptionChange('patientId', e.target.value)}
                                    label="Paciente"
                                    required
                                    sx={{
                                        borderRadius: '999px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.primary.main,
                                        }
                                    }}
                                >
                                    {patientsList.map((patient) => (
                                        <MenuItem key={patient.id} value={patient.id}>
                                            {patient.patientName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Data da Prescrição"
                                type="date"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                value={newPrescription.prescriptionDate}
                                onChange={(e) => handlePrescriptionChange('prescriptionDate', e.target.value)}
                                required
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '999px',
                                        '& fieldset': {
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                        '&:hover fieldset': {
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                        }
                                    }
                                }}
                            />

                            <FormControl fullWidth variant="outlined" sx={{ my: 2 }}>
                                <InputLabel id="status-select-label">Status</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    id="status-select"
                                    value={newPrescription.status}
                                    onChange={(e) => handlePrescriptionChange('status', e.target.value)}
                                    label="Status"
                                    sx={{
                                        borderRadius: '999px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.primary.main,
                                        }
                                    }}
                                >
                                    <MenuItem value="Ativa">Ativa</MenuItem>
                                    <MenuItem value="Renovada">Renovada</MenuItem>
                                    <MenuItem value="Suspensa">Suspensa</MenuItem>
                                    <MenuItem value="Concluída">Concluída</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Instruções Gerais"
                                multiline
                                rows={4}
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                value={newPrescription.generalInstructions}
                                onChange={(e) => handlePrescriptionChange('generalInstructions', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        '& fieldset': {
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                        '&:hover fieldset': {
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Medicamentos</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddMedication}
                                >
                                    Adicionar Medicamento
                                </Button>
                            </Box>

                            {newPrescription.medications.map((med, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        mb: 2,
                                        borderRadius: 4,
                                        position: 'relative',
                                        borderColor: alpha(theme.palette.primary.main, 0.15),
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                        '&:hover': {
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                                        }
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: theme.palette.error.main
                                        }}
                                        onClick={() => handleRemoveMedication(index)}
                                        disabled={newPrescription.medications.length <= 1}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Nome do Medicamento"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.medicationName}
                                                onChange={(e) => handleMedicationChange(index, 'medicationName', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '999px',
                                                        '& fieldset': {
                                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: theme.palette.primary.main,
                                                        }
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Dosagem"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.dosage}
                                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                placeholder="Ex: 500mg"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="Frequência"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.frequency}
                                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                                placeholder="Ex: 8/8h"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="Duração"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.duration}
                                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                                placeholder="Ex: 7 dias"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="Forma"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.form || ''}
                                                onChange={(e) => handleMedicationChange(index, 'form', e.target.value)}
                                                placeholder="Ex: Comprimido"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Instruções Específicas"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                                placeholder="Ex: Tomar após as refeições"
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseCreateDialog} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreatePrescription}
                        disabled={loading || !newPrescription.patientId || !newPrescription.medications[0].medicationName}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Criar Receita'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para feedback */}
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
                    elevation={6}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default PrescriptionsPage;