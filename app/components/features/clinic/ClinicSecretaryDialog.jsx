'use client';

/**
 * @fileoverview ClinicSecretaryDialog Component
 * @description Modern dialog for creating/editing clinic secretaries with scope selection
 * @design Uses ResponsiveDialog pattern with modern styling
 */

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Switch,
    Alert,
    CircularProgress,
    Chip,
    alpha,
    Grid,
    Collapse,
    IconButton,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Tabs,
    Tab,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Security as SecurityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    EventNote as CalendarIcon,
    LocalHospital as StethoscopeIcon,
    Chat as ChatIcon,
    AttachMoney as MoneyIcon,
    Description as DescriptionIcon,
    MedicalServices as MedicalIcon,
    Assignment as AssignmentIcon,
    Group as GroupIcon,
} from '@mui/icons-material';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import clinicService from '@/lib/services/api/clinic.service';
import { useClinicDoctors } from '../../hooks/useClinicDoctors';

// Theme colors
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    primaryDark: '#0A3AA8',
    success: '#0CAF60',
    successLight: '#E6F7EF',
    error: '#FF4B55',
    warning: '#FFAB2B',
    warningLight: '#FFF8E6',
    purple: '#8B5CF6',
    purpleLight: '#F3E8FF',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

const SCOPE_TYPES = [
    { value: 'all_doctors', label: 'Todos os Medicos', description: 'Acesso a todos os medicos da clinica', icon: GroupIcon, color: themeColors.primary },
    { value: 'specific_doctors', label: 'Medicos Especificos', description: 'Selecione quais medicos pode acessar', icon: PeopleIcon, color: themeColors.purple },
    { value: 'single_doctor', label: 'Medico Unico', description: 'Acesso a apenas um medico', icon: PersonIcon, color: themeColors.warning },
];

/**
 * Section Header component
 */
function SectionHeader({ icon: Icon, title, color = themeColors.primary, subtitle }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.1),
                }}
            >
                <Icon sx={{ color, fontSize: 20 }} />
            </Box>
            <Box>
                <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color={themeColors.textTertiary}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

/**
 * Permission Module Card
 */
function PermissionModuleCard({ icon: Icon, title, color, permissions, onChange }) {
    const hasRead = permissions?.read ?? false;
    const hasWrite = permissions?.write ?? false;

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: (hasRead || hasWrite) ? alpha(color, 0.3) : themeColors.borderColor,
                bgcolor: (hasRead || hasWrite) ? alpha(color, 0.03) : 'white',
                transition: 'all 0.2s ease',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Icon sx={{ color: (hasRead || hasWrite) ? color : themeColors.textTertiary, fontSize: 18 }} />
                <Typography variant="body2" fontWeight={600} color={themeColors.textPrimary}>
                    {title}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                    onClick={() => onChange({ ...permissions, read: !hasRead })}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        bgcolor: hasRead ? alpha(themeColors.success, 0.1) : themeColors.backgroundSecondary,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: alpha(themeColors.success, 0.15),
                        },
                    }}
                >
                    <VisibilityIcon sx={{ fontSize: 14, color: hasRead ? themeColors.success : themeColors.textTertiary }} />
                    <Typography
                        variant="caption"
                        fontWeight={500}
                        color={hasRead ? themeColors.success : themeColors.textTertiary}
                    >
                        Ver
                    </Typography>
                </Box>
                <Box
                    onClick={() => onChange({ ...permissions, write: !hasWrite })}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        bgcolor: hasWrite ? alpha(themeColors.primary, 0.1) : themeColors.backgroundSecondary,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: alpha(themeColors.primary, 0.15),
                        },
                    }}
                >
                    <EditIcon sx={{ fontSize: 14, color: hasWrite ? themeColors.primary : themeColors.textTertiary }} />
                    <Typography
                        variant="caption"
                        fontWeight={500}
                        color={hasWrite ? themeColors.primary : themeColors.textTertiary}
                    >
                        Editar
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

/**
 * Special Permission Toggle
 */
function SpecialPermissionToggle({ label, description, checked, onChange, color = themeColors.primary }) {
    return (
        <Box
            onClick={() => onChange(!checked)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: 2,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: checked ? alpha(color, 0.05) : 'transparent',
                '&:hover': {
                    bgcolor: alpha(color, 0.08),
                },
            }}
        >
            <Box>
                <Typography variant="body2" fontWeight={500} color={themeColors.textPrimary}>
                    {label}
                </Typography>
                {description && (
                    <Typography variant="caption" color={themeColors.textTertiary}>
                        {description}
                    </Typography>
                )}
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: color },
                }}
            />
        </Box>
    );
}

/**
 * Dialog for creating/editing clinic secretaries
 */
export function ClinicSecretaryDialog({ open, secretary = null, onClose, onSuccess }) {
    const { doctors } = useClinicDoctors({ activeOnly: true });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
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
        // Module permissions
        patients: { read: true, write: true },
        appointments: { read: true, write: true },
        prescriptions: { read: true, write: false },
        exams: { read: true, write: false },
        notes: { read: true, write: false },
        financial: { read: false, write: false },
        conversations: { read: true, write: true },
        // Special permissions
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
                scopeType: secretary.scopeType || secretary.scope_type || 'all_doctors',
                scopeDoctors: secretary.scopeDoctors || secretary.scope_doctors || [],
                singleDoctorId: secretary.singleDoctorId || secretary.single_doctor_id || '',
                password: '',
                patients: { read: perms.patients?.read ?? true, write: perms.patients?.write ?? true },
                appointments: { read: perms.appointments?.read ?? true, write: perms.appointments?.write ?? true },
                prescriptions: { read: perms.prescriptions?.read ?? true, write: perms.prescriptions?.write ?? false },
                exams: { read: perms.exams?.read ?? true, write: perms.exams?.write ?? false },
                notes: { read: perms.notes?.read ?? true, write: perms.notes?.write ?? false },
                financial: { read: perms.financial?.read ?? false, write: perms.financial?.write ?? false },
                conversations: { read: perms.conversations?.read ?? true, write: perms.conversations?.write ?? true },
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

    const handleModulePermissionChange = (module) => (permissions) => {
        setFormData((prev) => ({ ...prev, [module]: permissions }));
    };

    const handleSpecialPermissionChange = (field) => (value) => {
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
                patients: { ...formData.patients, viewDetails: false },
                appointments: { ...formData.appointments, viewDetails: true },
                prescriptions: { ...formData.prescriptions, viewDetails: false },
                exams: { ...formData.exams, viewDetails: false },
                notes: { ...formData.notes, viewDetails: false },
                financial: { ...formData.financial, viewDetails: false },
                reports: { read: true, write: false, viewDetails: false },
                conversations: { ...formData.conversations, viewDetails: true },
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
            setError(err.message || 'Erro ao salvar secretaria');
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
            patients: { read: true, write: true },
            appointments: { read: true, write: true },
            prescriptions: { read: true, write: false },
            exams: { read: true, write: false },
            notes: { read: true, write: false },
            financial: { read: false, write: false },
            conversations: { read: true, write: true },
            canCreatePatients: true,
            canAssignToAnyDoctor: true,
            canViewAllSchedules: true,
            canManageWaitingRoom: true,
        });
        setError(null);
        setActiveTab(0);
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

    const selectedScope = SCOPE_TYPES.find(s => s.value === formData.scopeType);

    return (
        <ResponsiveDialog
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar Secretaria' : 'Nova Secretaria'}
            titleIcon={<PersonAddIcon />}
            maxWidth="md"
            disableBackdropClick={loading}
            actions={
                <>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            color: themeColors.textSecondary,
                            px: 3,
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                            boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.25)}`,
                            '&:hover': {
                                boxShadow: `0 6px 20px ${alpha(themeColors.primary, 0.35)}`,
                            },
                            '&:disabled': {
                                background: themeColors.borderColor,
                            },
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                                Salvando...
                            </>
                        ) : isEditing ? (
                            'Salvar Alteracoes'
                        ) : (
                            'Criar Secretaria'
                        )}
                    </Button>
                </>
            }
        >
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { alignItems: 'center' },
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                    mb: 3,
                    borderBottom: '1px solid',
                    borderColor: themeColors.borderColor,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        minHeight: 48,
                    },
                }}
            >
                <Tab label="Dados Pessoais" />
                <Tab label="Escopo de Acesso" />
                <Tab label="Permissoes" />
            </Tabs>

            {/* Tab 0: Dados Pessoais */}
            {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <SectionHeader
                        icon={PersonIcon}
                        title="Informacoes da Secretaria"
                        subtitle="Dados basicos para cadastro"
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Nome completo"
                                value={formData.name}
                                onChange={handleChange('name')}
                                required
                                fullWidth
                                placeholder="Nome da Secretaria"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                required
                                fullWidth
                                placeholder="email@exemplo.com"
                                disabled={isEditing}
                                helperText={isEditing ? 'Email nao pode ser alterado' : ''}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Telefone"
                                value={formData.phone}
                                onChange={handleChange('phone')}
                                fullWidth
                                placeholder="(00) 00000-0000"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="CPF"
                                value={formData.cpf}
                                onChange={handleChange('cpf')}
                                fullWidth
                                placeholder="000.000.000-00"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        {!isEditing && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Senha inicial"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    fullWidth
                                    helperText="Opcional - sera gerada automaticamente"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}

            {/* Tab 1: Escopo de Acesso */}
            {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <SectionHeader
                        icon={GroupIcon}
                        title="Escopo de Acesso"
                        subtitle="Defina quais medicos esta secretaria pode acessar"
                        color={themeColors.purple}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {SCOPE_TYPES.map((scope) => {
                            const IconComponent = scope.icon;
                            const isSelected = formData.scopeType === scope.value;
                            return (
                                <Box
                                    key={scope.value}
                                    onClick={() => setFormData(prev => ({ ...prev, scopeType: scope.value }))}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        borderRadius: '12px',
                                        border: '2px solid',
                                        borderColor: isSelected ? scope.color : themeColors.borderColor,
                                        bgcolor: isSelected ? alpha(scope.color, 0.05) : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: scope.color,
                                            bgcolor: alpha(scope.color, 0.08),
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(scope.color, 0.1),
                                        }}
                                    >
                                        <IconComponent sx={{ color: scope.color, fontSize: 24 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={600} color={themeColors.textPrimary}>
                                            {scope.label}
                                        </Typography>
                                        <Typography variant="caption" color={themeColors.textTertiary}>
                                            {scope.description}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: isSelected ? scope.color : themeColors.borderColor,
                                            bgcolor: isSelected ? scope.color : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isSelected && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {formData.scopeType === 'specific_doctors' && (
                        <FormControl fullWidth required sx={{ mt: 2 }}>
                            <InputLabel>Selecione os Medicos</InputLabel>
                            <Select
                                multiple
                                value={formData.scopeDoctors}
                                onChange={handleScopeDoctorsChange}
                                input={<OutlinedInput label="Selecione os Medicos" sx={{ borderRadius: '10px' }} />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const doc = doctors.find(d => d.id === id || d.association?.profissionalId === id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={doc?.name || id}
                                                    size="small"
                                                    sx={{ borderRadius: '8px' }}
                                                />
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
                        <FormControl fullWidth required sx={{ mt: 2 }}>
                            <InputLabel>Selecione o Medico</InputLabel>
                            <Select
                                value={formData.singleDoctorId}
                                onChange={handleChange('singleDoctorId')}
                                label="Selecione o Medico"
                                sx={{ borderRadius: '10px' }}
                            >
                                {doctors.map((doctor) => (
                                    <MenuItem key={doctor.id} value={doctor.association?.profissionalId || doctor.id}>
                                        Dr(a). {doctor.name} {doctor.specialty && `- ${doctor.specialty}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
            )}

            {/* Tab 2: Permissoes */}
            {activeTab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <SectionHeader
                        icon={SecurityIcon}
                        title="Permissoes por Modulo"
                        subtitle="Configure o que a secretaria pode ver e editar"
                        color={themeColors.success}
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={PeopleIcon}
                                title="Pacientes"
                                color={themeColors.primary}
                                permissions={formData.patients}
                                onChange={handleModulePermissionChange('patients')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={CalendarIcon}
                                title="Agenda"
                                color={themeColors.purple}
                                permissions={formData.appointments}
                                onChange={handleModulePermissionChange('appointments')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={DescriptionIcon}
                                title="Receitas"
                                color={themeColors.success}
                                permissions={formData.prescriptions}
                                onChange={handleModulePermissionChange('prescriptions')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={MedicalIcon}
                                title="Exames"
                                color={themeColors.warning}
                                permissions={formData.exams}
                                onChange={handleModulePermissionChange('exams')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={MoneyIcon}
                                title="Financeiro"
                                color={themeColors.error}
                                permissions={formData.financial}
                                onChange={handleModulePermissionChange('financial')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <PermissionModuleCard
                                icon={ChatIcon}
                                title="Conversas"
                                color="#0EA5E9"
                                permissions={formData.conversations}
                                onChange={handleModulePermissionChange('conversations')}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <SectionHeader
                            icon={AssignmentIcon}
                            title="Permissoes Especiais"
                            subtitle="Acoes adicionais permitidas"
                            color={themeColors.warning}
                        />
                        <Box
                            sx={{
                                borderRadius: '12px',
                                border: '1px solid',
                                borderColor: themeColors.borderColor,
                                overflow: 'hidden',
                            }}
                        >
                            <SpecialPermissionToggle
                                label="Pode cadastrar novos pacientes"
                                description="Criar fichas de pacientes"
                                checked={formData.canCreatePatients}
                                onChange={handleSpecialPermissionChange('canCreatePatients')}
                                color={themeColors.primary}
                            />
                            <Box sx={{ borderTop: '1px solid', borderColor: themeColors.borderColor }}>
                                <SpecialPermissionToggle
                                    label="Pode agendar para qualquer medico"
                                    description="Marcar consultas com todos"
                                    checked={formData.canAssignToAnyDoctor}
                                    onChange={handleSpecialPermissionChange('canAssignToAnyDoctor')}
                                    color={themeColors.purple}
                                />
                            </Box>
                            <Box sx={{ borderTop: '1px solid', borderColor: themeColors.borderColor }}>
                                <SpecialPermissionToggle
                                    label="Pode ver agenda de todos os medicos"
                                    description="Visualizar horarios disponiveis"
                                    checked={formData.canViewAllSchedules}
                                    onChange={handleSpecialPermissionChange('canViewAllSchedules')}
                                    color={themeColors.warning}
                                />
                            </Box>
                            <Box sx={{ borderTop: '1px solid', borderColor: themeColors.borderColor }}>
                                <SpecialPermissionToggle
                                    label="Pode gerenciar sala de espera"
                                    description="Check-in de pacientes"
                                    checked={formData.canManageWaitingRoom}
                                    onChange={handleSpecialPermissionChange('canManageWaitingRoom')}
                                    color={themeColors.success}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}
        </ResponsiveDialog>
    );
}

export default ClinicSecretaryDialog;
