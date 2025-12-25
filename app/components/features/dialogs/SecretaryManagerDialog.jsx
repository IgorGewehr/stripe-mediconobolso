"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Tabs,
    Tab,
    Avatar,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    InputAdornment,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    Fade,
    Slide,
    Collapse,
    alpha,
    useMediaQuery,
    useTheme,
    Divider,
    Chip,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    PersonAdd as PersonAddIcon,
    Close as CloseIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ArrowBack as BackIcon,
    ArrowForward as NextIcon,
    Check as CheckIcon,
    Shield as ShieldIcon,
    Celebration as CelebrationIcon
} from '@mui/icons-material';
import { useAuth } from '../../providers/authProvider';
import { secretaryService } from '@/lib/services/api';
import globalCache from '../../utils/globalCache';

// Importar novos componentes
import {
    PermissionPresetSelector,
    PERMISSION_PRESETS,
    PermissionMatrix,
    SecretaryCard,
    SecretaryStatsHeader
} from '../secretary';

// Stepper customizado
const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
    '&.MuiStepConnector-alternativeLabel': {
        top: 22
    },
    '& .MuiStepConnector-line': {
        height: 3,
        border: 0,
        backgroundColor: '#EAECEF',
        borderRadius: 1
    },
    '&.Mui-active .MuiStepConnector-line': {
        backgroundColor: '#1852FE'
    },
    '&.Mui-completed .MuiStepConnector-line': {
        backgroundColor: '#10B981'
    }
}));

const CustomStepIcon = styled('div')(({ ownerState }) => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ownerState.completed
        ? '#10B981'
        : ownerState.active
            ? '#1852FE'
            : '#F1F5F9',
    color: ownerState.completed || ownerState.active ? '#FFFFFF' : '#94A3B8',
    fontWeight: 600,
    fontSize: '16px',
    transition: 'all 0.3s ease',
    boxShadow: ownerState.active ? '0 4px 12px rgba(24, 82, 254, 0.3)' : 'none'
}));

const StepIconComponent = (props) => {
    const { active, completed, icon } = props;
    const icons = {
        1: <PersonIcon />,
        2: <ShieldIcon />,
        3: <CheckCircleIcon />
    };

    return (
        <CustomStepIcon ownerState={{ completed, active }}>
            {completed ? <CheckIcon /> : icons[String(icon)]}
        </CustomStepIcon>
    );
};

// Passos do stepper
const STEPS = [
    { label: 'Dados Básicos', description: 'Informações da secretária' },
    { label: 'Permissões', description: 'Níveis de acesso' },
    { label: 'Confirmação', description: 'Revisar e criar' }
];

// Permissões padrão
const DEFAULT_PERMISSIONS = {
    patients: { read: true, create: true, write: false, viewDetails: false },
    appointments: { read: true, write: true },
    prescriptions: { read: true, write: false },
    exams: { read: true, write: false },
    notes: { read: true, write: false },
    financial: { read: false, write: false },
    reports: { read: true, write: false }
};

// Componente principal
const SecretaryManagerDialog = ({ open, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user, isSecretary, reloadUserContext } = useAuth();

    // Estados principais
    const [currentTab, setCurrentTab] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [secretaries, setSecretaries] = useState([]);
    const [secretaryStats, setSecretaryStats] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const [creationSuccess, setCreationSuccess] = useState(false);

    // Estados para limites do plano
    const [planLimits, setPlanLimits] = useState({
        current: 0,
        max: 1,
        planName: 'Gratuito',
        canCreateMore: true,
        remaining: 1
    });

    // Estados para criação de secretária
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [selectedPreset, setSelectedPreset] = useState('standard');
    const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS });
    const [createErrors, setCreateErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // Estados para edição de permissões
    const [editingSecretary, setEditingSecretary] = useState(null);
    const [editPermissions, setEditPermissions] = useState({});
    const [savingPermissions, setSavingPermissions] = useState(false);

    // Funções de alerta
    const showAlert = useCallback((message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    }, []);

    const handleCloseAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);

    // Carregar limites do plano
    const loadPlanLimits = useCallback(() => {
        if (!user) return;

        let max, planName;
        if (user.administrador) {
            max = 10;
            planName = 'Administrador';
        } else if (user.assinouPlano) {
            max = 5;
            planName = 'Pago';
        } else {
            max = 1;
            planName = 'Gratuito';
        }

        const current = secretaries.filter(s => s.active).length;
        const canCreateMore = current < max;
        const remaining = Math.max(0, max - current);

        setPlanLimits({ current, max, planName, canCreateMore, remaining });
    }, [user, secretaries]);

    // Carregar lista de secretárias
    const loadSecretaries = useCallback(async (forceReload = false) => {
        if (!user?.uid || isSecretary) return;

        try {
            setLoading(true);

            if (forceReload) {
                globalCache.invalidate('secretaryInfo', user.uid);
                globalCache.invalidate('profileData', user.uid);
            }

            const secretariesList = await secretaryService.listDoctorSecretaries(user.uid, true);
            setSecretaries(secretariesList);

            const stats = {
                total: secretariesList.length,
                active: secretariesList.filter(s => s.active).length,
                inactive: secretariesList.filter(s => !s.active).length,
                totalLogins: secretariesList.reduce((sum, s) => sum + (s.loginCount || 0), 0)
            };
            setSecretaryStats(stats);

        } catch (error) {
            console.error('Erro ao carregar secretárias:', error);
            showAlert('Erro ao carregar lista de secretárias', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, isSecretary, showAlert]);

    // Atualizar limites quando secretárias mudam
    useEffect(() => {
        loadPlanLimits();
    }, [secretaries, loadPlanLimits]);

    // Validação do formulário por etapa
    const validateStep = useCallback((step) => {
        const errors = {};

        if (step === 0) {
            if (!createForm.name.trim()) {
                errors.name = 'Nome é obrigatório';
            } else if (createForm.name.trim().length < 3) {
                errors.name = 'Nome deve ter pelo menos 3 caracteres';
            }

            if (!createForm.email.trim()) {
                errors.email = 'E-mail é obrigatório';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
                errors.email = 'E-mail inválido';
            }

            if (!createForm.password) {
                errors.password = 'Senha é obrigatória';
            } else if (createForm.password.length < 8) {
                errors.password = 'Senha deve ter pelo menos 8 caracteres';
            }

            if (createForm.password !== createForm.confirmPassword) {
                errors.confirmPassword = 'Senhas não coincidem';
            }
        }

        setCreateErrors(errors);
        return Object.keys(errors).length === 0;
    }, [createForm]);

    // Handler para mudanças no formulário
    const handleFormChange = useCallback((field) => (event) => {
        setCreateForm(prev => ({
            ...prev,
            [field]: event.target.value
        }));

        if (createErrors[field]) {
            setCreateErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [createErrors]);

    // Handler para seleção de preset
    const handlePresetChange = useCallback((presetId, presetPermissions) => {
        setSelectedPreset(presetId);
        if (presetPermissions) {
            setPermissions({ ...presetPermissions });
        }
    }, []);

    // Handler para mudanças individuais de permissão
    const handlePermissionChange = useCallback((module, action, value) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: value
            }
        }));
        setSelectedPreset('custom');
    }, []);

    // Navegar entre etapas
    const handleNext = useCallback(() => {
        if (validateStep(activeStep)) {
            setActiveStep(prev => prev + 1);
        }
    }, [activeStep, validateStep]);

    const handleBack = useCallback(() => {
        setActiveStep(prev => prev - 1);
    }, []);

    // Criar secretária
    const handleCreateSecretary = useCallback(async () => {
        if (!planLimits.canCreateMore) {
            showAlert(`Limite de secretárias atingido para o plano ${planLimits.planName}`, 'warning');
            return;
        }

        try {
            setCreating(true);

            const secretaryData = {
                name: createForm.name.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                permissions: permissions
            };

            const result = await secretaryService.createSecretaryAccount(user.uid, secretaryData);

            if (result.success) {
                setCreationSuccess(true);

                // Reset após 2 segundos
                setTimeout(async () => {
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                    setSelectedPreset('standard');
                    setPermissions({ ...DEFAULT_PERMISSIONS });
                    setActiveStep(0);
                    setCreationSuccess(false);
                    setCurrentTab(1);

                    await Promise.all([
                        loadSecretaries(true),
                        reloadUserContext?.(true)
                    ]);
                }, 2000);

            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('Erro ao criar secretária:', error);

            let errorMessage = error.message;
            if (errorMessage.includes('email-already-in-use')) {
                errorMessage = 'Este e-mail já está sendo usado';
            } else if (errorMessage.includes('weak-password')) {
                errorMessage = 'Senha muito fraca';
            }

            showAlert(errorMessage, 'error');
        } finally {
            setCreating(false);
        }
    }, [planLimits, createForm, permissions, user?.uid, showAlert, loadSecretaries, reloadUserContext]);

    // Editar permissões
    const handleEditPermissions = useCallback((secretary) => {
        setEditingSecretary(secretary);
        setEditPermissions({ ...secretary.permissions });
    }, []);

    // Salvar permissões editadas
    const handleSavePermissions = useCallback(async () => {
        if (!editingSecretary) return;

        try {
            setSavingPermissions(true);

            await secretaryService.updatePermissions(
                editingSecretary.id,
                editPermissions
            );

            showAlert('Permissões atualizadas!', 'success');
            setEditingSecretary(null);
            setEditPermissions({});
            await loadSecretaries(true);

        } catch (error) {
            console.error('Erro ao atualizar permissões:', error);
            showAlert('Erro ao atualizar permissões', 'error');
        } finally {
            setSavingPermissions(false);
        }
    }, [editingSecretary, editPermissions, user?.uid, showAlert, loadSecretaries]);

    // Toggle status da secretária
    const handleToggleSecretaryStatus = useCallback(async (secretary) => {
        try {
            if (secretary.active) {
                await secretaryService.deactivateSecretaryAccount(user.uid, secretary.id);
                showAlert(`${secretary.name} desativada`, 'success');
            } else {
                await secretaryService.reactivateSecretaryAccount(user.uid, secretary.id);
                showAlert(`${secretary.name} reativada`, 'success');
            }
            await loadSecretaries(true);
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            showAlert('Erro ao alterar status da secretária', 'error');
        }
    }, [user?.uid, showAlert, loadSecretaries]);

    // Carregar dados quando dialog abre
    useEffect(() => {
        if (open && user?.uid && !isSecretary) {
            loadSecretaries();
        }
    }, [open, user?.uid, isSecretary, loadSecretaries]);

    // Reset ao fechar
    useEffect(() => {
        if (!open) {
            setCurrentTab(0);
            setActiveStep(0);
            setEditingSecretary(null);
            setCreationSuccess(false);
        }
    }, [open]);

    // Verificação para secretárias
    if (isSecretary) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                    <WarningIcon sx={{ fontSize: 64, color: '#F59E0B', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Gellix, sans-serif' }}>
                        Acesso Restrito
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'Gellix, sans-serif' }}>
                        Secretárias não podem gerenciar outras secretárias.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} sx={{ fontFamily: 'Gellix, sans-serif' }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // Contar permissões ativas
    const countActivePermissions = () => {
        let count = 0;
        Object.values(permissions).forEach(module => {
            Object.values(module).forEach(action => {
                if (action) count++;
            });
        });
        return count;
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
                TransitionComponent={Slide}
                TransitionProps={{ direction: 'up' }}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '20px',
                        maxHeight: isMobile ? '100%' : '90vh',
                        overflow: 'hidden'
                    }
                }}
            >
                {/* Header */}
                <DialogTitle
                    sx={{
                        p: 0,
                        borderBottom: '1px solid #EAECEF'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2.5,
                            pb: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #1852FE 0%, #3B82F6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <PeopleIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#111E5A',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '18px'
                                    }}
                                >
                                    Gerenciar Secretárias
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#64748B',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '13px'
                                    }}
                                >
                                    Configure sua equipe de apoio
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {currentTab === 1 && (
                                <IconButton
                                    onClick={() => loadSecretaries(true)}
                                    disabled={loading}
                                    size="small"
                                    sx={{ color: '#64748B' }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            )}
                            <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{
                            px: 2.5,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontFamily: 'Gellix, sans-serif',
                                fontWeight: 500,
                                fontSize: '14px',
                                minHeight: 48,
                                color: '#64748B',
                                '&.Mui-selected': {
                                    color: '#1852FE',
                                    fontWeight: 600
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#1852FE',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab
                            label="Criar Nova"
                            icon={<PersonAddIcon sx={{ fontSize: 20 }} />}
                            iconPosition="start"
                            disabled={!planLimits.canCreateMore}
                        />
                        <Tab
                            label={`Equipe (${secretaries.filter(s => s.active).length})`}
                            icon={<SettingsIcon sx={{ fontSize: 20 }} />}
                            iconPosition="start"
                        />
                    </Tabs>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflow: 'auto' }}>
                    {loading && <LinearProgress />}

                    {/* Tab: Criar Nova */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Stepper */}
                            <Stepper
                                activeStep={activeStep}
                                alternativeLabel
                                connector={<CustomStepConnector />}
                                sx={{ mb: 4 }}
                            >
                                {STEPS.map((step, index) => (
                                    <Step key={step.label}>
                                        <StepLabel StepIconComponent={StepIconComponent}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: activeStep === index ? 600 : 400,
                                                    color: activeStep === index ? '#111E5A' : '#64748B',
                                                    fontFamily: 'Gellix, sans-serif',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                {step.label}
                                            </Typography>
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {/* Conteúdo das etapas */}
                            <Fade in={true} timeout={300}>
                                <Box>
                                    {/* Etapa 1: Dados Básicos */}
                                    {activeStep === 0 && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        backgroundColor: createForm.name ? '#1852FE' : '#F1F5F9',
                                                        fontSize: '24px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {createForm.name?.charAt(0)?.toUpperCase() || <PersonIcon />}
                                                </Avatar>
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#111E5A',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }}
                                                    >
                                                        {createForm.name || 'Nova Secretária'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#64748B',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }}
                                                    >
                                                        {createForm.email || 'email@exemplo.com'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                                                    gap: 2.5
                                                }}
                                            >
                                                <TextField
                                                    fullWidth
                                                    label="Nome Completo"
                                                    value={createForm.name}
                                                    onChange={handleFormChange('name')}
                                                    error={!!createErrors.name}
                                                    helperText={createErrors.name}
                                                    disabled={creating}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <PersonIcon sx={{ color: '#94A3B8' }} />
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }
                                                    }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="E-mail"
                                                    type="email"
                                                    value={createForm.email}
                                                    onChange={handleFormChange('email')}
                                                    error={!!createErrors.email}
                                                    helperText={createErrors.email}
                                                    disabled={creating}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EmailIcon sx={{ color: '#94A3B8' }} />
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }
                                                    }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    type={showPassword ? 'text' : 'password'}
                                                    label="Senha"
                                                    value={createForm.password}
                                                    onChange={handleFormChange('password')}
                                                    error={!!createErrors.password}
                                                    helperText={createErrors.password || 'Mínimo 8 caracteres'}
                                                    disabled={creating}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SecurityIcon sx={{ color: '#94A3B8' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    edge="end"
                                                                    size="small"
                                                                >
                                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }
                                                    }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Confirmar Senha"
                                                    type="password"
                                                    value={createForm.confirmPassword}
                                                    onChange={handleFormChange('confirmPassword')}
                                                    error={!!createErrors.confirmPassword}
                                                    helperText={createErrors.confirmPassword}
                                                    disabled={creating}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SecurityIcon sx={{ color: '#94A3B8' }} />
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Etapa 2: Permissões */}
                                    {activeStep === 1 && (
                                        <Box>
                                            <PermissionPresetSelector
                                                selected={selectedPreset}
                                                onChange={handlePresetChange}
                                                disabled={creating}
                                            />

                                            <Divider sx={{ my: 3 }} />

                                            <Collapse in={selectedPreset === 'custom'}>
                                                <PermissionMatrix
                                                    permissions={permissions}
                                                    onChange={handlePermissionChange}
                                                    disabled={creating}
                                                />
                                            </Collapse>

                                            {selectedPreset !== 'custom' && (
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: '12px',
                                                        backgroundColor: '#F8F9FA',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#64748B',
                                                            fontFamily: 'Gellix, sans-serif'
                                                        }}
                                                    >
                                                        Selecione "Personalizado" para configurar permissões individualmente
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* Etapa 3: Confirmação */}
                                    {activeStep === 2 && (
                                        <Box>
                                            {creationSuccess ? (
                                                <Fade in={creationSuccess}>
                                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                                        <Box
                                                            sx={{
                                                                width: 80,
                                                                height: 80,
                                                                borderRadius: '50%',
                                                                backgroundColor: alpha('#10B981', 0.1),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
                                                                mb: 3
                                                            }}
                                                        >
                                                            <CelebrationIcon sx={{ fontSize: 40, color: '#10B981' }} />
                                                        </Box>
                                                        <Typography
                                                            variant="h5"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#111E5A',
                                                                fontFamily: 'Gellix, sans-serif',
                                                                mb: 1
                                                            }}
                                                        >
                                                            Secretária Criada!
                                                        </Typography>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                color: '#64748B',
                                                                fontFamily: 'Gellix, sans-serif'
                                                            }}
                                                        >
                                                            {createForm.name} já pode acessar o sistema
                                                        </Typography>
                                                    </Box>
                                                </Fade>
                                            ) : (
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#111E5A',
                                                            fontFamily: 'Gellix, sans-serif',
                                                            mb: 3,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        Revise os dados antes de criar
                                                    </Typography>

                                                    {/* Resumo dos dados */}
                                                    <Box
                                                        sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                                                            gap: 3
                                                        }}
                                                    >
                                                        {/* Card de dados */}
                                                        <Box
                                                            sx={{
                                                                p: 3,
                                                                borderRadius: '16px',
                                                                backgroundColor: '#F8F9FA',
                                                                border: '1px solid #EAECEF'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        backgroundColor: '#1852FE',
                                                                        fontSize: '18px',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    {createForm.name?.charAt(0)?.toUpperCase()}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography
                                                                        variant="subtitle1"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            color: '#111E5A',
                                                                            fontFamily: 'Gellix, sans-serif'
                                                                        }}
                                                                    >
                                                                        {createForm.name}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: '#64748B',
                                                                            fontFamily: 'Gellix, sans-serif'
                                                                        }}
                                                                    >
                                                                        {createForm.email}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            <Divider sx={{ my: 2 }} />

                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <SecurityIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: '#64748B',
                                                                        fontFamily: 'Gellix, sans-serif'
                                                                    }}
                                                                >
                                                                    Senha definida com {createForm.password?.length || 0} caracteres
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Card de permissões */}
                                                        <Box
                                                            sx={{
                                                                p: 3,
                                                                borderRadius: '16px',
                                                                backgroundColor: '#F8F9FA',
                                                                border: '1px solid #EAECEF'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                                <ShieldIcon sx={{ fontSize: 20, color: '#1852FE' }} />
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: '#111E5A',
                                                                        fontFamily: 'Gellix, sans-serif'
                                                                    }}
                                                                >
                                                                    Perfil de Acesso
                                                                </Typography>
                                                            </Box>

                                                            <Chip
                                                                label={PERMISSION_PRESETS[selectedPreset]?.name || 'Personalizado'}
                                                                sx={{
                                                                    backgroundColor: alpha(PERMISSION_PRESETS[selectedPreset]?.color || '#F59E0B', 0.1),
                                                                    color: PERMISSION_PRESETS[selectedPreset]?.color || '#F59E0B',
                                                                    fontWeight: 600,
                                                                    mb: 2
                                                                }}
                                                            />

                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#64748B',
                                                                    fontFamily: 'Gellix, sans-serif'
                                                                }}
                                                            >
                                                                {countActivePermissions()} permissões ativas em 7 módulos
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Fade>
                        </Box>
                    )}

                    {/* Tab: Gerenciar Equipe */}
                    {currentTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <SecretaryStatsHeader
                                stats={secretaryStats}
                                planLimits={planLimits}
                                loading={loading}
                            />

                            {loading ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Carregando secretárias...
                                    </Typography>
                                </Box>
                            ) : secretaries.length > 0 ? (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                                        gap: 2
                                    }}
                                >
                                    {secretaries.map((secretary) => (
                                        <SecretaryCard
                                            key={secretary.id}
                                            secretary={secretary}
                                            onEditPermissions={handleEditPermissions}
                                            onToggleStatus={handleToggleSecretaryStatus}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            backgroundColor: '#F1F5F9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 3
                                        }}
                                    >
                                        <PeopleIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                                    </Box>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#64748B',
                                            fontFamily: 'Gellix, sans-serif',
                                            mb: 1
                                        }}
                                    >
                                        Nenhuma Secretária
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#94A3B8',
                                            fontFamily: 'Gellix, sans-serif',
                                            mb: 3
                                        }}
                                    >
                                        Adicione sua primeira secretária para delegar tarefas
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAddIcon />}
                                        onClick={() => setCurrentTab(0)}
                                        sx={{
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            px: 3
                                        }}
                                    >
                                        Criar Primeira Secretária
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {/* Footer com ações */}
                {currentTab === 0 && !creationSuccess && (
                    <DialogActions
                        sx={{
                            p: 2.5,
                            borderTop: '1px solid #EAECEF',
                            gap: 1.5
                        }}
                    >
                        <Button
                            onClick={onClose}
                            disabled={creating}
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontFamily: 'Gellix, sans-serif',
                                color: '#64748B'
                            }}
                        >
                            Cancelar
                        </Button>

                        <Box sx={{ flex: 1 }} />

                        {activeStep > 0 && (
                            <Button
                                onClick={handleBack}
                                startIcon={<BackIcon />}
                                disabled={creating}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontFamily: 'Gellix, sans-serif'
                                }}
                            >
                                Voltar
                            </Button>
                        )}

                        {activeStep < STEPS.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                endIcon={<NextIcon />}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontFamily: 'Gellix, sans-serif',
                                    fontWeight: 500,
                                    px: 3,
                                    backgroundColor: '#1852FE',
                                    '&:hover': {
                                        backgroundColor: '#1340E5'
                                    }
                                }}
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleCreateSecretary}
                                startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                                disabled={creating || !planLimits.canCreateMore}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontFamily: 'Gellix, sans-serif',
                                    fontWeight: 500,
                                    px: 3,
                                    backgroundColor: '#10B981',
                                    '&:hover': {
                                        backgroundColor: '#059669'
                                    }
                                }}
                            >
                                {creating ? 'Criando...' : 'Criar Secretária'}
                            </Button>
                        )}
                    </DialogActions>
                )}
            </Dialog>

            {/* Dialog de Edição de Permissões */}
            <Dialog
                open={!!editingSecretary}
                onClose={() => setEditingSecretary(null)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                TransitionComponent={Slide}
                TransitionProps={{ direction: 'up' }}
                PaperProps={{
                    sx: { borderRadius: isMobile ? 0 : '20px' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #EAECEF' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ShieldIcon sx={{ color: '#1852FE' }} />
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#111E5A',
                                    fontFamily: 'Gellix, sans-serif'
                                }}
                            >
                                Editar Permissões
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#64748B',
                                    fontFamily: 'Gellix, sans-serif'
                                }}
                            >
                                {editingSecretary?.name}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <PermissionMatrix
                        permissions={editPermissions}
                        onChange={(module, action, value) => {
                            setEditPermissions(prev => ({
                                ...prev,
                                [module]: {
                                    ...prev[module],
                                    [action]: value
                                }
                            }));
                        }}
                        disabled={savingPermissions}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #EAECEF' }}>
                    <Button
                        onClick={() => setEditingSecretary(null)}
                        disabled={savingPermissions}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif'
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                        startIcon={savingPermissions ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500,
                            backgroundColor: '#1852FE',
                            '&:hover': {
                                backgroundColor: '#1340E5'
                            }
                        }}
                    >
                        {savingPermissions ? 'Salvando...' : 'Salvar Permissões'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar de alertas */}
            <Snackbar
                open={alert.open}
                autoHideDuration={5000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity={alert.severity}
                    variant="filled"
                    sx={{
                        borderRadius: '12px',
                        fontFamily: 'Gellix, sans-serif'
                    }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SecretaryManagerDialog;
