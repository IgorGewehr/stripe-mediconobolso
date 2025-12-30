'use client';

/**
 * @fileoverview DoctorInviteDialog Component
 * @description Modern dialog for inviting a new doctor to the clinic
 * @design Uses ResponsiveDialog pattern with modern styling
 */

import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Chip,
    alpha,
    Grid,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    LocalHospital as StethoscopeIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    Security as SecurityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import clinicService from '@/lib/services/api/clinic.service';

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

const ASSOCIATION_TYPES = [
    { value: 'employee', label: 'Funcionario', description: 'CLT ou contrato', color: '#0284C7', bg: '#E0F2FE' },
    { value: 'contractor', label: 'Prestador de Servico', description: 'Autonomo/PJ', color: '#F59E0B', bg: '#FFF8E6' },
    { value: 'partner', label: 'Socio', description: 'Participacao na clinica', color: '#8B5CF6', bg: '#F3E8FF' },
    { value: 'guest', label: 'Convidado', description: 'Acesso temporario', color: '#64748B', bg: '#F1F5F9' },
];

const UF_OPTIONS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Section Header component
 */
function SectionHeader({ icon: Icon, title, color = themeColors.primary }) {
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
            <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                {title}
            </Typography>
        </Box>
    );
}

/**
 * Permission Toggle component
 */
function PermissionToggle({ icon: Icon, label, description, checked, onChange, color = themeColors.primary }) {
    return (
        <Box
            onClick={() => onChange(!checked)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: checked ? alpha(color, 0.3) : themeColors.borderColor,
                bgcolor: checked ? alpha(color, 0.05) : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: alpha(color, 0.4),
                    bgcolor: alpha(color, 0.08),
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Icon sx={{ color: checked ? color : themeColors.textTertiary, fontSize: 20 }} />
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
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                        color,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: color,
                    },
                }}
            />
        </Box>
    );
}

/**
 * Dialog for inviting a doctor
 */
export function DoctorInviteDialog({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        crm: '',
        ufCrm: '',
        specialty: '',
        associationType: 'employee',
        defaultRepassePercent: '',
        // Permissions
        canViewFinancial: false,
        canManageFinancial: false,
        canViewAllPatients: false,
        canIssueNfse: false,
        canManageSecretaries: false,
        canViewAnalytics: true,
        canManageWhatsapp: false,
        canManageFacebook: false,
    });

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePermissionChange = (field) => (value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                email: formData.email,
                name: formData.name,
                crm: formData.crm,
                ufCrm: formData.ufCrm,
                specialty: formData.specialty || undefined,
                associationType: formData.associationType,
                defaultRepassePercent: formData.defaultRepassePercent
                    ? parseFloat(formData.defaultRepassePercent)
                    : undefined,
                additionalPermissions: {
                    canViewFinancial: formData.canViewFinancial,
                    canManageFinancial: formData.canManageFinancial,
                    canViewAllPatients: formData.canViewAllPatients,
                    canIssueNfse: formData.canIssueNfse,
                    canManageSecretaries: formData.canManageSecretaries,
                    canViewAnalytics: formData.canViewAnalytics,
                    canManageWhatsapp: formData.canManageWhatsapp,
                    canManageFacebook: formData.canManageFacebook,
                },
            };

            await clinicService.inviteDoctor(payload);
            onSuccess?.();
            resetForm();
        } catch (err) {
            console.error('Error inviting doctor:', err);
            setError(err.message || 'Erro ao enviar convite');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            name: '',
            crm: '',
            ufCrm: '',
            specialty: '',
            associationType: 'employee',
            defaultRepassePercent: '',
            canViewFinancial: false,
            canManageFinancial: false,
            canViewAllPatients: false,
            canIssueNfse: false,
            canManageSecretaries: false,
            canViewAnalytics: true,
            canManageWhatsapp: false,
            canManageFacebook: false,
        });
        setError(null);
        setShowPermissions(false);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose?.();
        }
    };

    const isValid = formData.email && formData.name && formData.crm && formData.ufCrm;
    const selectedAssociation = ASSOCIATION_TYPES.find(t => t.value === formData.associationType);

    return (
        <ResponsiveDialog
            open={open}
            onClose={handleClose}
            title="Convidar Medico"
            titleIcon={<PersonAddIcon />}
            maxWidth="sm"
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
                                Enviando...
                            </>
                        ) : (
                            'Enviar Convite'
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Dados do Profissional */}
                <Box>
                    <SectionHeader icon={StethoscopeIcon} title="Dados do Profissional" />
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Nome completo"
                                value={formData.name}
                                onChange={handleChange('name')}
                                required
                                fullWidth
                                placeholder="Dr(a). Nome Completo"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                required
                                fullWidth
                                placeholder="medico@email.com"
                                helperText="O convite sera enviado para este email"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={8}>
                            <TextField
                                label="CRM"
                                value={formData.crm}
                                onChange={handleChange('crm')}
                                required
                                fullWidth
                                placeholder="123456"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth required>
                                <InputLabel>UF</InputLabel>
                                <Select
                                    value={formData.ufCrm}
                                    onChange={handleChange('ufCrm')}
                                    label="UF"
                                    sx={{ borderRadius: '10px' }}
                                >
                                    {UF_OPTIONS.map((uf) => (
                                        <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Especialidade"
                                value={formData.specialty}
                                onChange={handleChange('specialty')}
                                fullWidth
                                placeholder="Ex: Cardiologia, Dermatologia..."
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Tipo de Vinculo */}
                <Box>
                    <SectionHeader icon={BadgeIcon} title="Tipo de Vinculo" color={themeColors.purple} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {ASSOCIATION_TYPES.map((type) => (
                            <Chip
                                key={type.value}
                                label={type.label}
                                onClick={() => setFormData(prev => ({ ...prev, associationType: type.value }))}
                                sx={{
                                    borderRadius: '10px',
                                    fontWeight: 500,
                                    px: 1,
                                    py: 2.5,
                                    bgcolor: formData.associationType === type.value ? type.bg : 'transparent',
                                    color: formData.associationType === type.value ? type.color : themeColors.textSecondary,
                                    border: '1px solid',
                                    borderColor: formData.associationType === type.value ? type.color : themeColors.borderColor,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: type.bg,
                                        borderColor: type.color,
                                    },
                                }}
                            />
                        ))}
                    </Box>
                    {selectedAssociation && (
                        <Typography variant="caption" color={themeColors.textTertiary} sx={{ mt: 1, display: 'block' }}>
                            {selectedAssociation.description}
                        </Typography>
                    )}
                    <TextField
                        label="Percentual de repasse (%)"
                        type="number"
                        value={formData.defaultRepassePercent}
                        onChange={handleChange('defaultRepassePercent')}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        helperText="Opcional - percentual padrao para repasses"
                        sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                            },
                        }}
                        fullWidth
                    />
                </Box>

                {/* Permissoes */}
                <Box>
                    <Box
                        onClick={() => setShowPermissions(!showPermissions)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            p: 2,
                            borderRadius: '12px',
                            bgcolor: themeColors.backgroundSecondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: alpha(themeColors.primary, 0.05),
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(themeColors.success, 0.1),
                                }}
                            >
                                <SecurityIcon sx={{ color: themeColors.success, fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                                    Permissoes Adicionais
                                </Typography>
                                <Typography variant="caption" color={themeColors.textTertiary}>
                                    Clique para configurar permissoes especiais
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton size="small">
                            {showPermissions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={showPermissions}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                            <PermissionToggle
                                icon={VisibilityIcon}
                                label="Ver dados financeiros"
                                description="Acesso a relatorios e valores"
                                checked={formData.canViewFinancial}
                                onChange={handlePermissionChange('canViewFinancial')}
                                color={themeColors.warning}
                            />
                            <PermissionToggle
                                icon={MoneyIcon}
                                label="Gerenciar financeiro"
                                description="Editar lancamentos e cobrar"
                                checked={formData.canManageFinancial}
                                onChange={handlePermissionChange('canManageFinancial')}
                                color={themeColors.warning}
                            />
                            <PermissionToggle
                                icon={PeopleIcon}
                                label="Ver pacientes de outros medicos"
                                description="Acesso a todos os prontuarios"
                                checked={formData.canViewAllPatients}
                                onChange={handlePermissionChange('canViewAllPatients')}
                                color={themeColors.primary}
                            />
                            <PermissionToggle
                                icon={ReceiptIcon}
                                label="Emitir NFSe"
                                description="Emissao de notas fiscais"
                                checked={formData.canIssueNfse}
                                onChange={handlePermissionChange('canIssueNfse')}
                                color={themeColors.success}
                            />
                            <PermissionToggle
                                icon={PeopleIcon}
                                label="Gerenciar secretarias"
                                description="Adicionar e remover secretarias"
                                checked={formData.canManageSecretaries}
                                onChange={handlePermissionChange('canManageSecretaries')}
                                color={themeColors.purple}
                            />
                        </Box>
                    </Collapse>
                </Box>
            </Box>
        </ResponsiveDialog>
    );
}

export default DoctorInviteDialog;