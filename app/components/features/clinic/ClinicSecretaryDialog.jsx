'use client';

/**
 * @fileoverview ClinicSecretaryDialog Component
 * @description Dialog for creating/editing clinic secretaries with scope selection
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Checkbox,
    ListItemText,
    OutlinedInput,
} from '@mui/material';
import clinicService from '@/lib/services/api/clinic.service';
import { useClinicDoctors } from '../../hooks/useClinicDoctors';

const SCOPE_TYPES = [
    { value: 'all_doctors', label: 'Todos os Médicos', description: 'Acesso a todos os médicos da clínica' },
    { value: 'specific_doctors', label: 'Médicos Específicos', description: 'Selecione quais médicos pode acessar' },
    { value: 'single_doctor', label: 'Médico Único', description: 'Acesso a apenas um médico (modo tradicional)' },
];

/**
 * Dialog for creating/editing clinic secretaries
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Object} [props.secretary] - Existing secretary for editing (null for create)
 * @param {() => void} props.onClose - Close handler
 * @param {() => void} props.onSuccess - Success handler
 */
export function ClinicSecretaryDialog({ open, secretary = null, onClose, onSuccess }) {
    const { doctors } = useClinicDoctors({ activeOnly: true });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isEditing = !!secretary;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        scopeType: 'all_doctors',
        scopeDoctors: [],
        singleDoctorId: '',
        password: '',
        // Permissions
        patientsRead: true,
        patientsWrite: true,
        patientsViewDetails: false,
        appointmentsRead: true,
        appointmentsWrite: true,
        prescriptionsRead: true,
        prescriptionsWrite: false,
        examsRead: true,
        examsWrite: false,
        notesRead: true,
        notesWrite: false,
        financialRead: false,
        financialWrite: false,
        conversationsRead: true,
        conversationsWrite: true,
        canCreatePatients: true,
        canAssignToAnyDoctor: true,
        canViewAllSchedules: true,
        canManageWaitingRoom: true,
    });

    // Populate form when editing
    useEffect(() => {
        if (secretary && open) {
            const perms = secretary.permissions || {};
            setFormData({
                name: secretary.name || '',
                email: secretary.email || '',
                phone: secretary.phone || '',
                cpf: secretary.cpf || '',
                scopeType: secretary.scopeType || 'all_doctors',
                scopeDoctors: secretary.scopeDoctors || [],
                singleDoctorId: secretary.singleDoctorId || '',
                password: '',
                patientsRead: perms.patients?.read ?? true,
                patientsWrite: perms.patients?.write ?? true,
                patientsViewDetails: perms.patients?.viewDetails ?? false,
                appointmentsRead: perms.appointments?.read ?? true,
                appointmentsWrite: perms.appointments?.write ?? true,
                prescriptionsRead: perms.prescriptions?.read ?? true,
                prescriptionsWrite: perms.prescriptions?.write ?? false,
                examsRead: perms.exams?.read ?? true,
                examsWrite: perms.exams?.write ?? false,
                notesRead: perms.notes?.read ?? true,
                notesWrite: perms.notes?.write ?? false,
                financialRead: perms.financial?.read ?? false,
                financialWrite: perms.financial?.write ?? false,
                conversationsRead: perms.conversations?.read ?? true,
                conversationsWrite: perms.conversations?.write ?? true,
                canCreatePatients: perms.canCreatePatients ?? true,
                canAssignToAnyDoctor: perms.canAssignToAnyDoctor ?? true,
                canViewAllSchedules: perms.canViewAllSchedules ?? true,
                canManageWaitingRoom: perms.canManageWaitingRoom ?? true,
            });
        }
    }, [secretary, open]);

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleScopeDoctorsChange = (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            scopeDoctors: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const permissions = {
                patients: {
                    read: formData.patientsRead,
                    write: formData.patientsWrite,
                    viewDetails: formData.patientsViewDetails,
                },
                appointments: {
                    read: formData.appointmentsRead,
                    write: formData.appointmentsWrite,
                    viewDetails: true,
                },
                prescriptions: {
                    read: formData.prescriptionsRead,
                    write: formData.prescriptionsWrite,
                    viewDetails: false,
                },
                exams: {
                    read: formData.examsRead,
                    write: formData.examsWrite,
                    viewDetails: false,
                },
                notes: {
                    read: formData.notesRead,
                    write: formData.notesWrite,
                    viewDetails: false,
                },
                financial: {
                    read: formData.financialRead,
                    write: formData.financialWrite,
                    viewDetails: false,
                },
                reports: { read: true, write: false, viewDetails: false },
                conversations: {
                    read: formData.conversationsRead,
                    write: formData.conversationsWrite,
                    viewDetails: true,
                },
                analytics: { read: true, write: false, viewDetails: false },
                canCreatePatients: formData.canCreatePatients,
                canAssignToAnyDoctor: formData.canAssignToAnyDoctor,
                canViewAllSchedules: formData.canViewAllSchedules,
                canManageWaitingRoom: formData.canManageWaitingRoom,
            };

            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                cpf: formData.cpf || undefined,
                scopeType: formData.scopeType,
                scopeDoctors: formData.scopeType === 'specific_doctors' ? formData.scopeDoctors : undefined,
                singleDoctorId: formData.scopeType === 'single_doctor' ? formData.singleDoctorId : undefined,
                permissions,
                password: formData.password || undefined,
            };

            if (isEditing) {
                await clinicService.updateClinicSecretary(secretary.id, payload);
            } else {
                await clinicService.createClinicSecretary(payload);
            }

            onSuccess?.();
            resetForm();
        } catch (err) {
            console.error('Error saving secretary:', err);
            setError(err.message || 'Erro ao salvar secretária');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            cpf: '',
            scopeType: 'all_doctors',
            scopeDoctors: [],
            singleDoctorId: '',
            password: '',
            patientsRead: true,
            patientsWrite: true,
            patientsViewDetails: false,
            appointmentsRead: true,
            appointmentsWrite: true,
            prescriptionsRead: true,
            prescriptionsWrite: false,
            examsRead: true,
            examsWrite: false,
            notesRead: true,
            notesWrite: false,
            financialRead: false,
            financialWrite: false,
            conversationsRead: true,
            conversationsWrite: true,
            canCreatePatients: true,
            canAssignToAnyDoctor: true,
            canViewAllSchedules: true,
            canManageWaitingRoom: true,
        });
        setError(null);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose?.();
        }
    };

    const isValid = formData.name && formData.email && (
        formData.scopeType === 'all_doctors' ||
        (formData.scopeType === 'specific_doctors' && formData.scopeDoctors.length > 0) ||
        (formData.scopeType === 'single_doctor' && formData.singleDoctorId)
    );

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? 'Editar Secretária' : 'Nova Secretária da Clínica'}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Basic info */}
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Dados Pessoais
                    </Typography>

                    <TextField
                        label="Nome completo"
                        value={formData.name}
                        onChange={handleChange('name')}
                        required
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            required
                            sx={{ flex: 1 }}
                            disabled={isEditing}
                            helperText={isEditing ? 'Email não pode ser alterado' : ''}
                        />
                        <TextField
                            label="Telefone"
                            value={formData.phone}
                            onChange={handleChange('phone')}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    <TextField
                        label="CPF"
                        value={formData.cpf}
                        onChange={handleChange('cpf')}
                        fullWidth
                    />

                    {!isEditing && (
                        <TextField
                            label="Senha inicial"
                            type="password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            fullWidth
                            helperText="Opcional - será gerada automaticamente se não informada"
                        />
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Scope */}
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Escopo de Acesso
                    </Typography>

                    <FormControl fullWidth required>
                        <InputLabel>Tipo de Acesso</InputLabel>
                        <Select
                            value={formData.scopeType}
                            onChange={handleChange('scopeType')}
                            label="Tipo de Acesso"
                        >
                            {SCOPE_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box>
                                        <Typography>{type.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {type.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {formData.scopeType === 'specific_doctors' && (
                        <FormControl fullWidth required>
                            <InputLabel>Médicos</InputLabel>
                            <Select
                                multiple
                                value={formData.scopeDoctors}
                                onChange={handleScopeDoctorsChange}
                                input={<OutlinedInput label="Médicos" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const doc = doctors.find(d => d.id === id || d.association?.profissionalId === id);
                                            return (
                                                <Chip key={id} label={doc?.name || id} size="small" />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {doctors.map((doctor) => (
                                    <MenuItem key={doctor.id} value={doctor.association?.profissionalId || doctor.id}>
                                        <Checkbox checked={formData.scopeDoctors.includes(doctor.association?.profissionalId || doctor.id)} />
                                        <ListItemText primary={`Dr(a). ${doctor.name}`} secondary={doctor.specialty} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {formData.scopeType === 'single_doctor' && (
                        <FormControl fullWidth required>
                            <InputLabel>Médico</InputLabel>
                            <Select
                                value={formData.singleDoctorId}
                                onChange={handleChange('singleDoctorId')}
                                label="Médico"
                            >
                                {doctors.map((doctor) => (
                                    <MenuItem key={doctor.id} value={doctor.association?.profissionalId || doctor.id}>
                                        Dr(a). {doctor.name} {doctor.specialty && `- ${doctor.specialty}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Permissions */}
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Permissões por Módulo
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        {/* Patients */}
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Pacientes</Typography>
                            <FormControlLabel
                                control={<Switch checked={formData.patientsRead} onChange={handleChange('patientsRead')} size="small" />}
                                label="Visualizar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.patientsWrite} onChange={handleChange('patientsWrite')} size="small" />}
                                label="Editar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.patientsViewDetails} onChange={handleChange('patientsViewDetails')} size="small" />}
                                label="Ver detalhes"
                            />
                        </Box>

                        {/* Appointments */}
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Agenda</Typography>
                            <FormControlLabel
                                control={<Switch checked={formData.appointmentsRead} onChange={handleChange('appointmentsRead')} size="small" />}
                                label="Visualizar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.appointmentsWrite} onChange={handleChange('appointmentsWrite')} size="small" />}
                                label="Agendar"
                            />
                        </Box>

                        {/* Prescriptions */}
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Receitas</Typography>
                            <FormControlLabel
                                control={<Switch checked={formData.prescriptionsRead} onChange={handleChange('prescriptionsRead')} size="small" />}
                                label="Visualizar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.prescriptionsWrite} onChange={handleChange('prescriptionsWrite')} size="small" />}
                                label="Criar"
                            />
                        </Box>

                        {/* Financial */}
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Financeiro</Typography>
                            <FormControlLabel
                                control={<Switch checked={formData.financialRead} onChange={handleChange('financialRead')} size="small" />}
                                label="Visualizar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.financialWrite} onChange={handleChange('financialWrite')} size="small" />}
                                label="Gerenciar"
                            />
                        </Box>

                        {/* Conversations */}
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Conversas</Typography>
                            <FormControlLabel
                                control={<Switch checked={formData.conversationsRead} onChange={handleChange('conversationsRead')} size="small" />}
                                label="Visualizar"
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.conversationsWrite} onChange={handleChange('conversationsWrite')} size="small" />}
                                label="Responder"
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Special permissions */}
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Permissões Especiais
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={<Switch checked={formData.canCreatePatients} onChange={handleChange('canCreatePatients')} />}
                            label="Pode cadastrar novos pacientes"
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.canAssignToAnyDoctor} onChange={handleChange('canAssignToAnyDoctor')} />}
                            label="Pode agendar para qualquer médico"
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.canViewAllSchedules} onChange={handleChange('canViewAllSchedules')} />}
                            label="Pode ver agenda de todos os médicos"
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.canManageWaitingRoom} onChange={handleChange('canManageWaitingRoom')} />}
                            label="Pode gerenciar sala de espera"
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !isValid}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {isEditing ? 'Salvar' : 'Criar Secretária'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ClinicSecretaryDialog;
