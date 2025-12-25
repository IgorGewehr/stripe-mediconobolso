"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Divider,
    Typography,
    Button,
    IconButton,
    Box,
    CircularProgress,
    InputAdornment,
    Autocomplete,
    Avatar,
    Chip,
    alpha,
    styled
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    AccessTime as AccessTimeIcon,
    Event as EventIcon,
    MoreVert as MoreVertIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { patientsService } from '@/lib/services/api';
import { consultationModel } from '../../../../lib/modelObjects';
import { useAuth } from '../../providers/authProvider';
import useModuleAccess from '../../hooks/useModuleAccess';

// Estilos personalizados
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '24px',
        boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '650px',
        width: '100%'
    }
}));

const DialogHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px 24px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '50px',
        '& fieldset': {
            borderColor: '#CED4DA',
        },
        '&:hover fieldset': {
            borderColor: '#B0B8C4',
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        }
    },
    '& .MuiInputLabel-outlined': {
        transform: 'translate(14px, 16px) scale(1)',
    },
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.75)',
    },
    '& .MuiOutlinedInput-input': {
        padding: '14px 16px',
    }
}));

const StyledSelect = styled(FormControl)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '50px',
        '& fieldset': {
            borderColor: '#CED4DA',
        },
        '&:hover fieldset': {
            borderColor: '#B0B8C4',
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        }
    },
    '& .MuiInputLabel-outlined': {
        transform: 'translate(14px, 16px) scale(1)',
    },
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.75)',
    },
    '& .MuiSelect-select': {
        padding: '14px 16px',
    }
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '50px',
        padding: '4px 16px',
        '& fieldset': {
            borderColor: '#CED4DA',
        },
        '&:hover fieldset': {
            borderColor: '#B0B8C4',
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        }
    }
}));

const ActionButton = styled(Button)(({ theme }) => ({
    borderRadius: '50px',
    padding: '10px 24px',
    textTransform: 'none',
    fontWeight: 500,
    boxShadow: 'none',
    '&.MuiButton-contained': {
        '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        }
    },
    '&.MuiButton-outlined': {
        borderColor: '#CED4DA',
        '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
        }
    }
}));

const ErrorMessage = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
    fontSize: '0.75rem',
    marginTop: '4px',
    marginLeft: '14px'
}));

const PatientItem = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
}));

const PatientAvatar = styled(Avatar)(({ theme }) => ({
    width: 32,
    height: 32,
    marginRight: 16,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
}));

const DialogTitleText = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    fontSize: '1.25rem',
    color: theme.palette.text.primary
}));

// Modal para criar/editar eventos de consulta
const EventoModal = ({ isOpen, onClose, onSave, evento }) => {
    const { user, isSecretary } = useAuth();
    const { hasAccess, canPerformAction, getUserContext } = useModuleAccess();
    const [formData, setFormData] = useState({
        patientId: '',
        consultationDate: new Date(),
        consultationTime: '09:00',
        consultationDuration: 30,
        consultationType: 'Presencial',
        reasonForVisit: '',
        status: 'Agendada'
    });

    const [errors, setErrors] = useState({});
    const [pacientes, setPacientes] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [savingConsultation, setSavingConsultation] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [patientOptions, setPatientOptions] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Efeito para carregar pacientes ao abrir o modal
    useEffect(() => {
        if (!isOpen) {
            // Reset states when modal is closed
            setLoadingPatients(false);
            setSavingConsultation(false);
            setErrors({});
            setPacientes([]);
            setPatientOptions([]);
            setSelectedPatient(null);
            return;
        }

        if (!user) {
            setLoadingPatients(false);
            return;
        }

        setLoadingPatients(true);

        const loadPatients = async () => {
            try {
                // Determinar o ID do médico correto
                const doctorId = isSecretary ? user.workingDoctorId : user.uid;
                
                if (!doctorId) {
                    console.error('❌ ID do médico não encontrado');
                    setErrors(prev => ({ ...prev, general: "Erro: ID do médico não encontrado." }));
                    return;
                }

                console.log('🏥 Carregando pacientes para médico:', doctorId, '(secretária:', isSecretary, ')');

                // Carregar pacientes do médico via API
                const response = await patientsService.list({ perPage: 1000 });
                const patientsData = response.items || [];
                setPacientes(patientsData);

                // Preparar opções para o Autocomplete
                const options = (patientsData || []).map(patient => ({
                    id: patient.id,
                    name: patient.patientName,
                    gender: patient.patientGender,
                    age: patient.patientAge,
                    phone: patient.phone,
                    email: patient.patientEmail,
                    fotoPerfil: patient.patientPhotoUrl
                }));

                setPatientOptions(options);

                // Se for edição, buscar e selecionar o paciente correspondente
                if (evento?.patientId) {
                    const foundPatient = options.find(p => p.id === evento.patientId);
                    if (foundPatient) {
                        setSelectedPatient(foundPatient);
                    }
                }
            } catch (error) {
                console.error("❌ Erro ao carregar pacientes:", error);
                setErrors(prev => ({ ...prev, general: "Erro ao carregar lista de pacientes." }));
            } finally {
                setLoadingPatients(false);
            }
        };

        loadPatients();
    }, [isOpen, user?.uid, user?.workingDoctorId, isSecretary, evento?.patientId]);

    // Efeito para preencher o formulário em caso de edição
    useEffect(() => {
        if (evento) {
            setFormData({
                patientId: evento.patientId || '',
                consultationDate: evento.consultationDate instanceof Date
                    ? evento.consultationDate
                    : evento.data
                        ? parseLocalDate(evento.data)
                        : new Date(),
                consultationTime: evento.horaInicio || evento.consultationTime || '09:00',
                consultationDuration: evento.consultationDuration || 30,
                consultationType: evento.consultationType || 'Presencial',
                reasonForVisit: evento.reasonForVisit || '',
                status: mapStatusToConsultation(evento.status) || 'Agendada'
            });
        } else {
            // Reset para valores padrão quando for novo evento
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const roundedMinute = Math.ceil(currentMinute / 15) * 15;
            const defaultTime = `${currentHour.toString().padStart(2, '0')}:${roundedMinute === 60 ? '00' : roundedMinute.toString().padStart(2, '0')}`;

            setFormData({
                patientId: '',
                consultationDate: now,
                consultationTime: defaultTime,
                consultationDuration: 30,
                consultationType: 'Presencial',
                reasonForVisit: '',
                status: 'Agendada'
            });
            setSelectedPatient(null);
        }

        // Limpar erros ao abrir o modal
        setErrors({});
    }, [evento, isOpen]);

    // Mapear status do evento para o formato de consulta
    const mapStatusToConsultation = (status) => {
        if (!status) return 'Agendada';

        switch (status.toLowerCase()) {
            case 'confirmado':
                return 'Concluída';
            case 'a confirmar':
                return 'Agendada';
            case 'cancelado':
                return 'Cancelada';
            case 'em andamento':
                return 'Em Andamento';
            default:
                return 'Agendada';
        }
    };

    // Handler para mudanças nos campos de formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpar erro do campo quando o usuário digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const parseLocalDate = (dateString) => {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date(dateString);
    };

    // Handler específico para mudança de data
    // Em EventoModal.jsx, modifique o handleDateChange:
    const handleDateChange = (e) => {
        const dateParts = e.target.value.split('-');
        if (dateParts.length === 3) {
            // Criar uma nova data preservando exatamente o dia selecionado
            const newDate = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
            );

            setFormData(prev => ({
                ...prev,
                consultationDate: newDate
            }));
        }

        if (errors.consultationDate) {
            setErrors(prev => ({ ...prev, consultationDate: undefined }));
        }
    };

    // Handler para selecionar paciente
    const handlePatientSelect = (event, newValue) => {
        setSelectedPatient(newValue);
        if (newValue) {
            setFormData(prev => ({ ...prev, patientId: newValue.id }));
            setErrors(prev => ({ ...prev, patientId: undefined }));
        } else {
            setFormData(prev => ({ ...prev, patientId: '' }));
        }
    };

    // Validação do formulário
    const validateForm = () => {
        const newErrors = {};

        if (!formData.patientId) {
            newErrors.patientId = 'Selecione um paciente';
        }

        if (!formData.consultationTime) {
            newErrors.consultationTime = 'Informe o horário da consulta';
        }

        if (!formData.consultationDate) {
            newErrors.consultationDate = 'Selecione uma data para a consulta';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handler para envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🚀 Iniciando submit do agendamento...');

        // Evitar múltiplas submissões
        if (savingConsultation) {
            console.log('⏳ Submit já em andamento, ignorando...');
            return;
        }

        if (!validateForm()) {
            console.log('❌ Validação falhou');
            return;
        }

        if (!user) {
            setErrors({ general: "Usuário não autenticado. Faça login novamente." });
            console.log('❌ Usuário não autenticado');
            return;
        }

        console.log('✅ Validação passou, criando dados da consulta...');
        setSavingConsultation(true);

        try {
            // Determinar o ID do médico correto
            const doctorId = isSecretary ? user.workingDoctorId : user.uid;
            
            // Criar formato de consulta para salvar
            const consultationData = {
                ...consultationModel,
                patientId: formData.patientId,
                doctorId: doctorId,
                consultationDate: formData.consultationDate,
                consultationTime: formData.consultationTime,
                consultationDuration: parseInt(formData.consultationDuration),
                consultationType: formData.consultationType,
                status: formData.status,
                reasonForVisit: formData.reasonForVisit
            };

            // Se for edição, manter o ID original
            if (evento?.id) {
                consultationData.id = evento.id;
                console.log('🔄 Modo edição, ID:', evento.id);
            } else {
                console.log('➕ Modo criação');
            }

            console.log('📋 Dados da consulta:', consultationData);
            console.log('📞 Chamando onSave...');
            
            await onSave(consultationData);
            console.log('✅ onSave completado com sucesso');
            // Modal será fechado pelo componente pai após salvar com sucesso
        } catch (error) {
            console.error('❌ Erro durante onSave:', error);
            setErrors(prev => ({ ...prev, general: "Erro ao salvar consulta. Tente novamente." }));
        } finally {
            setSavingConsultation(false);
        }
    };

    // Formatação da data para display
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Renderização de cada item de paciente no dropdown
    const renderPatientOption = (props, option) => {
        if (!option) return null;

        // Usar o ID do paciente como parte da chave para garantir unicidade
        const uniqueKey = `patient-${option.id}`;
        const { key, ...otherProps } = props;

        return (
            <Box component="li" key={uniqueKey} {...otherProps}>
                <PatientItem>
                    <PatientAvatar src={option.fotoPerfil || undefined}>
                        {option.fotoPerfil
                            ? ''
                            : (option.name ? option.name.charAt(0).toUpperCase() : <PersonIcon />)}
                    </PatientAvatar>
                    <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {option.phone ? `Contato: ${option.phone}` : "Telefone não informado"}
                            {option.age ? `, ${option.age} anos` : ''}
                        </Typography>
                    </Box>
                </PatientItem>
            </Box>
        );
    };

    return (
        <StyledDialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitleText>
                        {evento ? 'Editar Consulta' : 'Nova Consulta'}
                    </DialogTitleText>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogHeader>

                <Divider />

                <DialogContent sx={{ py: 3 }}>
                    {errors.general && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: alpha('#f44336', 0.1), borderRadius: 2 }}>
                            <Typography color="error">{errors.general}</Typography>
                        </Box>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ position: 'relative' }}>
                                {!hasAccess('patients') ? (
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: alpha('#f44336', 0.1),
                                        borderRadius: 2,
                                        border: `1px solid ${alpha('#f44336', 0.3)}`,
                                        textAlign: 'center'
                                    }}>
                                        <PersonIcon sx={{ color: '#f44336', fontSize: 40, mb: 1 }} />
                                        <Typography color="error" variant="body2" fontWeight={500}>
                                            Sem permissão para visualizar pacientes
                                        </Typography>
                                        <Typography color="text.secondary" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                            Entre em contato com o médico responsável para solicitar acesso aos pacientes
                                        </Typography>
                                    </Box>
                                ) : (
                                    <StyledAutocomplete
                                        value={selectedPatient}
                                        onChange={handlePatientSelect}
                                        options={patientOptions}
                                        getOptionLabel={(option) => option.name || ''}
                                        loading={loadingPatients}
                                        renderOption={renderPatientOption}
                                        getOptionKey={(option) => option.id}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Paciente"
                                                required
                                                error={!!errors.patientId}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <>
                                                            <InputAdornment position="start">
                                                                <PersonIcon color="action" />
                                                            </InputAdornment>
                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    ),
                                                    endAdornment: (
                                                        <>
                                                            {loadingPatients ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                )}
                                {errors.patientId && <ErrorMessage>{errors.patientId}</ErrorMessage>}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ position: 'relative' }}>
                                <StyledTextField
                                    fullWidth
                                    label="Data"
                                    type="date"
                                    value={formatDate(formData.consultationDate)}
                                    onChange={handleDateChange}
                                    required
                                    error={!!errors.consultationDate}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EventIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                {errors.consultationDate && <ErrorMessage>{errors.consultationDate}</ErrorMessage>}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ position: 'relative' }}>
                                <StyledTextField
                                    fullWidth
                                    label="Horário"
                                    type="time"
                                    name="consultationTime"
                                    value={formData.consultationTime}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.consultationTime}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccessTimeIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                {errors.consultationTime && <ErrorMessage>{errors.consultationTime}</ErrorMessage>}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <StyledSelect fullWidth variant="outlined">
                                <InputLabel id="duracao-select-label">Duração</InputLabel>
                                <Select
                                    labelId="duracao-select-label"
                                    id="consultationDuration"
                                    name="consultationDuration"
                                    value={formData.consultationDuration}
                                    onChange={handleChange}
                                    label="Duração"
                                >
                                    <MenuItem value={15}>15 minutos</MenuItem>
                                    <MenuItem value={30}>30 minutos</MenuItem>
                                    <MenuItem value={45}>45 minutos</MenuItem>
                                    <MenuItem value={60}>1 hora</MenuItem>
                                    <MenuItem value={90}>1h30</MenuItem>
                                    <MenuItem value={120}>2 horas</MenuItem>
                                </Select>
                            </StyledSelect>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <StyledSelect fullWidth variant="outlined">
                                <InputLabel id="tipo-select-label">Tipo</InputLabel>
                                <Select
                                    labelId="tipo-select-label"
                                    id="consultationType"
                                    name="consultationType"
                                    value={formData.consultationType}
                                    onChange={handleChange}
                                    label="Tipo"
                                >
                                    <MenuItem value="Presencial">Presencial</MenuItem>
                                    <MenuItem value="Telemedicina">Telemedicina</MenuItem>
                                </Select>
                            </StyledSelect>
                        </Grid>

                        <Grid item xs={12}>
                            <StyledTextField
                                fullWidth
                                label="Motivo da Consulta"
                                name="reasonForVisit"
                                value={formData.reasonForVisit}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                            <AssignmentIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '24px',
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <StyledSelect fullWidth variant="outlined">
                                <InputLabel id="status-select-label">Status</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value="Agendada">Agendada</MenuItem>
                                    <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                                    <MenuItem value="Concluída">Confirmado</MenuItem>
                                    <MenuItem value="Cancelada">Cancelada</MenuItem>
                                </Select>
                            </StyledSelect>
                        </Grid>
                    </Grid>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                    <ActionButton
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        startIcon={<CloseIcon />}
                    >
                        Cancelar
                    </ActionButton>

                    <ActionButton
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={savingConsultation || loadingPatients}
                    >
                        {(savingConsultation || loadingPatients) ? <CircularProgress size={24} /> : evento ? 'Atualizar Consulta' : 'Agendar Consulta'}
                    </ActionButton>
                </DialogActions>
            </form>
        </StyledDialog>
    );
};

export default EventoModal;
