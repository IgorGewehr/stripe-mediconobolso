// ✅ VERSÃO FINAL DO SECRETARYMANAGERDIALOG - COMPLETAMENTE FUNCIONAL

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
    Grid,
    Tabs,
    Tab,
    Card,
    CardContent,
    Avatar,
    Chip,
    Switch,
    FormControlLabel,
    FormGroup,
    IconButton,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    Paper,
    LinearProgress
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Close as CloseIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PowerSettingsNew as PowerIcon,
    History as HistoryIcon,
    Info as InfoIcon,
    AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useAuth } from '../authProvider';
import firebaseService from '../../../lib/firebaseService';
import globalCache from '../globalCache';

// ✅ CONFIGURAÇÃO DOS MÓDULOS E PERMISSÕES
const MODULE_PERMISSIONS = {
    patients: {
        name: 'Pacientes',
        icon: '👥',
        color: '#3B82F6',
        description: 'Gerenciar informações dos pacientes',
        actions: {
            read: 'Visualizar lista de pacientes',
            write: 'Criar e editar pacientes',
            viewDetails: 'Ver dados sensíveis (histórico médico)'
        }
    },
    appointments: {
        name: 'Agenda',
        icon: '📅',
        color: '#10B981',
        description: 'Gerenciar consultas e agendamentos',
        actions: {
            read: 'Visualizar agenda',
            write: 'Agendar e editar consultas'
        }
    },
    prescriptions: {
        name: 'Receitas',
        icon: '💊',
        color: '#F59E0B',
        description: 'Visualizar e gerenciar receitas médicas',
        actions: {
            read: 'Visualizar receitas',
            write: 'Criar e editar receitas'
        }
    },
    exams: {
        name: 'Exames',
        icon: '🔬',
        color: '#8B5CF6',
        description: 'Gerenciar exames e resultados',
        actions: {
            read: 'Visualizar exames',
            write: 'Cadastrar e editar exames'
        }
    },
    notes: {
        name: 'Notas',
        icon: '📝',
        color: '#06B6D4',
        description: 'Acessar anotações médicas',
        actions: {
            read: 'Visualizar notas',
            write: 'Criar e editar notas'
        }
    },
    financial: {
        name: 'Financeiro',
        icon: '💰',
        color: '#DC2626',
        description: 'Acessar informações financeiras',
        actions: {
            read: 'Visualizar relatórios financeiros',
            write: 'Gerenciar dados financeiros'
        }
    },
    reports: {
        name: 'Relatórios',
        icon: '📊',
        color: '#7C3AED',
        description: 'Gerar e visualizar relatórios',
        actions: {
            read: 'Visualizar relatórios',
            write: 'Gerar novos relatórios'
        }
    }
};

// ✅ PERMISSÕES PADRÃO PARA NOVA SECRETÁRIA
const DEFAULT_PERMISSIONS = {
    patients: { read: true, write: false, viewDetails: false },
    appointments: { read: true, write: true },
    prescriptions: { read: true, write: false },
    exams: { read: true, write: false },
    notes: { read: true, write: false },
    financial: { read: false, write: false },
    reports: { read: true, write: false }
};

// ✅ COMPONENTE PRINCIPAL
const SecretaryManagerDialog = ({ open, onClose }) => {
    const { user, isSecretary, reloadUserContext } = useAuth();

    // Estados principais
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [secretaries, setSecretaries] = useState([]);
    const [secretaryStats, setSecretaryStats] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

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
        confirmPassword: '',
        permissions: { ...DEFAULT_PERMISSIONS }
    });
    const [createErrors, setCreateErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // Estados para edição de permissões
    const [editingSecretary, setEditingSecretary] = useState(null);
    const [editPermissions, setEditPermissions] = useState({});
    const [savingPermissions, setSavingPermissions] = useState(false);

    // ✅ FUNÇÃO PARA MOSTRAR ALERTAS
    const showAlert = useCallback((message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    }, []);

    const handleCloseAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);

    // ✅ FUNÇÃO PARA CARREGAR LIMITES DO PLANO
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

        setPlanLimits({
            current,
            max,
            planName,
            canCreateMore,
            remaining
        });
    }, [user, secretaries]);

    // ✅ FUNÇÃO PARA CARREGAR LISTA DE SECRETÁRIAS
    const loadSecretaries = useCallback(async (forceReload = false) => {
        if (!user?.uid || isSecretary) return;

        try {
            setLoading(true);

            if (forceReload) {
                globalCache.invalidate('secretaryInfo', user.uid);
                globalCache.invalidate('profileData', user.uid);
            }

            const secretariesList = await firebaseService.listDoctorSecretaries(user.uid, true);
            setSecretaries(secretariesList);

            // Gerar estatísticas
            const stats = {
                total: secretariesList.length,
                active: secretariesList.filter(s => s.active).length,
                inactive: secretariesList.filter(s => !s.active).length,
                totalLogins: secretariesList.reduce((sum, s) => sum + (s.loginCount || 0), 0)
            };
            setSecretaryStats(stats);

            console.log(`✅ ${secretariesList.length} secretária(s) carregada(s)`);

        } catch (error) {
            console.error('❌ Erro ao carregar secretárias:', error);
            showAlert('Erro ao carregar lista de secretárias', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, isSecretary, showAlert]);

    // ✅ ATUALIZAR LIMITES QUANDO SECRETÁRIAS MUDAM
    useEffect(() => {
        loadPlanLimits();
    }, [secretaries, loadPlanLimits]);

    // ✅ VALIDAÇÃO DO FORMULÁRIO DE CRIAÇÃO
    const validateCreateForm = useCallback(() => {
        const errors = {};

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

        setCreateErrors(errors);
        return Object.keys(errors).length === 0;
    }, [createForm]);

    // ✅ HANDLER PARA MUDANÇAS NO FORMULÁRIO
    const handleFormChange = useCallback((field) => (event) => {
        setCreateForm(prev => ({
            ...prev,
            [field]: event.target.value
        }));

        // Limpar erro do campo
        if (createErrors[field]) {
            setCreateErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    }, [createErrors]);

    // ✅ HANDLER PARA MUDANÇAS NAS PERMISSÕES
    const handlePermissionChange = useCallback((module, action) => (event) => {
        setCreateForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: {
                    ...prev.permissions[module],
                    [action]: event.target.checked
                }
            }
        }));
    }, []);

    // ✅ FUNÇÃO PARA CRIAR SECRETÁRIA
    const handleCreateSecretary = useCallback(async () => {
        if (!validateCreateForm()) {
            showAlert('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        if (!planLimits.canCreateMore) {
            showAlert(`Você atingiu o limite de secretárias para o plano ${planLimits.planName}`, 'warning');
            return;
        }

        try {
            setCreating(true);
            showAlert('Criando secretária...', 'info');

            const secretaryData = {
                name: createForm.name.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                permissions: createForm.permissions
            };

            const result = await firebaseService.createSecretaryAccount(user.uid, secretaryData);

            if (result.success) {
                showAlert(`✅ Secretária ${secretaryData.name} criada com sucesso!`, 'success');

                // Limpar formulário
                setCreateForm({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    permissions: { ...DEFAULT_PERMISSIONS }
                });
                setCreateErrors({});

                // Recarregar listas
                setTimeout(async () => {
                    await Promise.all([
                        loadSecretaries(true),
                        reloadUserContext?.(true)
                    ]);
                    setCurrentTab(1); // Ir para aba de gerenciamento
                }, 1500);
            } else {
                throw new Error(result.error || 'Erro desconhecido na criação');
            }

        } catch (error) {
            console.error('❌ Erro ao criar secretária:', error);

            let errorMessage = error.message;
            if (errorMessage.includes('email-already-in-use')) {
                errorMessage = 'Este e-mail já está sendo usado';
            } else if (errorMessage.includes('weak-password')) {
                errorMessage = 'Senha muito fraca. Use pelo menos 8 caracteres';
            } else if (errorMessage.includes('invalid-email')) {
                errorMessage = 'E-mail inválido';
            }

            showAlert(errorMessage, 'error');
        } finally {
            setCreating(false);
        }
    }, [validateCreateForm, planLimits, createForm, user?.uid, showAlert, loadSecretaries, reloadUserContext]);

    // ✅ FUNÇÃO PARA EDITAR PERMISSÕES
    const handleEditPermissions = useCallback((secretary) => {
        setEditingSecretary(secretary);
        setEditPermissions({ ...secretary.permissions });
    }, []);

    // ✅ FUNÇÃO PARA SALVAR PERMISSÕES EDITADAS
    const handleSavePermissions = useCallback(async () => {
        if (!editingSecretary) return;

        try {
            setSavingPermissions(true);

            await firebaseService.updateSecretaryPermissions(
                user.uid,
                editingSecretary.id,
                editPermissions
            );

            showAlert('Permissões atualizadas com sucesso!', 'success');
            setEditingSecretary(null);
            setEditPermissions({});

            // Recarregar lista
            await loadSecretaries(true);

        } catch (error) {
            console.error('❌ Erro ao atualizar permissões:', error);
            showAlert('Erro ao atualizar permissões', 'error');
        } finally {
            setSavingPermissions(false);
        }
    }, [editingSecretary, editPermissions, user?.uid, showAlert, loadSecretaries]);

    // ✅ FUNÇÃO PARA DESATIVAR/REATIVAR SECRETÁRIA
    const handleToggleSecretaryStatus = useCallback(async (secretary) => {
        try {
            if (secretary.active) {
                await firebaseService.deactivateSecretaryAccount(user.uid, secretary.id);
                showAlert(`Secretária ${secretary.name} desativada`, 'success');
            } else {
                await firebaseService.reactivateSecretaryAccount(user.uid, secretary.id);
                showAlert(`Secretária ${secretary.name} reativada`, 'success');
            }

            // Recarregar lista
            await loadSecretaries(true);

        } catch (error) {
            console.error('❌ Erro ao alterar status da secretária:', error);
            showAlert(`Erro ao ${secretary.active ? 'desativar' : 'reativar'} secretária`, 'error');
        }
    }, [user?.uid, showAlert, loadSecretaries]);

    // ✅ CARREGAR DADOS QUANDO DIALOG ABRE
    useEffect(() => {
        if (open && user?.uid && !isSecretary) {
            loadSecretaries();
        }
    }, [open, user?.uid, isSecretary, loadSecretaries]);

    // ✅ RESET AO FECHAR
    useEffect(() => {
        if (!open) {
            setCurrentTab(0);
            setEditingSecretary(null);
            setEditPermissions({});
        }
    }, [open]);

    // ✅ VERIFICAÇÃO PARA SECRETÁRIAS
    if (isSecretary) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                    <WarningIcon sx={{ fontSize: 64, color: '#FF9800', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Acesso Restrito
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Secretárias não podem gerenciar outras secretárias.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Fechar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    // ✅ COMPONENTE DE PERMISSÕES PARA CRIAÇÃO
    const PermissionModule = ({ module, moduleInfo, permissions, onChange, disabled = false }) => (
        <Card sx={{ height: '100%', border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: '20px', mr: 1 }}>
                        {moduleInfo.icon}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {moduleInfo.name}
                    </Typography>
                </Box>

                <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                    {moduleInfo.description}
                </Typography>

                <FormGroup>
                    {Object.entries(moduleInfo.actions).map(([action, description]) => (
                        <FormControlLabel
                            key={action}
                            control={
                                <Switch
                                    checked={permissions[action] || false}
                                    onChange={onChange(module, action)}
                                    size="small"
                                    disabled={disabled}
                                />
                            }
                            label={
                                <Tooltip title={description} arrow>
                                    <Typography variant="caption">
                                        {action === 'read' ? 'Visualizar' :
                                            action === 'write' ? 'Editar' :
                                                action === 'viewDetails' ? 'Ver Detalhes' : action}
                                    </Typography>
                                </Tooltip>
                            }
                        />
                    ))}
                </FormGroup>
            </CardContent>
        </Card>
    );

    // ✅ COMPONENTE DE CARD DA SECRETÁRIA
    const SecretaryCard = ({ secretary }) => (
        <Card sx={{ mb: 2, border: '1px solid', borderColor: secretary.active ? 'success.light' : 'grey.300' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: secretary.active ? 'success.main' : 'grey.500' }}>
                        {secretary.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {secretary.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {secretary.email}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                            icon={secretary.active ? <CheckCircleIcon /> : <BlockIcon />}
                            label={secretary.active ? 'Ativa' : 'Inativa'}
                            color={secretary.active ? 'success' : 'default'}
                            size="small"
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="caption" color="textSecondary">
                            Logins realizados: {secretary.loginCount || 0}
                        </Typography>
                        {secretary.lastLogin && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                Último acesso: {new Date(secretary.lastLogin.toDate()).toLocaleDateString('pt-BR')}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditPermissions(secretary)}
                    >
                        Editar Permissões
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color={secretary.active ? 'error' : 'success'}
                        startIcon={<PowerIcon />}
                        onClick={() => handleToggleSecretaryStatus(secretary)}
                    >
                        {secretary.active ? 'Desativar' : 'Reativar'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '20px', minHeight: '80vh', maxHeight: '90vh' }
                }}
            >
                <DialogTitle sx={{ p: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            <PeopleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                            Gerenciar Secretárias
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {currentTab === 1 && (
                                <IconButton
                                    onClick={() => loadSecretaries(true)}
                                    disabled={loading}
                                    size="small"
                                    title="Atualizar informações"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            )}
                            <IconButton onClick={onClose} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Indicador de estatísticas */}
                    {secretaryStats && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <Typography variant="body2">
                                    <strong>Plano {planLimits.planName}:</strong> {planLimits.current}/{planLimits.max} secretária(s) •
                                    {secretaryStats.active} ativa(s) • {secretaryStats.totalLogins} logins totais
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                </DialogTitle>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        variant="fullWidth"
                    >
                        <Tab
                            label="Criar Nova"
                            icon={<PersonAddIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label={`Gerenciar (${secretaries.filter(s => s.active).length})`}
                            icon={<SettingsIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                <DialogContent sx={{ p: 0, minHeight: '500px', maxHeight: '60vh', overflow: 'auto' }}>
                    {loading && <LinearProgress />}

                    {/* ✅ ABA DE CRIAÇÃO */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Indicador de limite */}
                            <Card sx={{ mb: 3, bgcolor: planLimits.canCreateMore ? 'success.light' : 'warning.light' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                Seu Plano: {planLimits.planName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {planLimits.current} de {planLimits.max} secretária{planLimits.max > 1 ? 's' : ''} utilizada{planLimits.max > 1 ? 's' : ''}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={planLimits.canCreateMore ? `${planLimits.remaining} disponível${planLimits.remaining !== 1 ? 'is' : ''}` : 'Limite atingido'}
                                            color={planLimits.canCreateMore ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </Box>

                                    {!planLimits.canCreateMore && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                Você atingiu o limite de secretárias para o plano {planLimits.planName}.
                                                {planLimits.planName === 'Gratuito' && (
                                                    <><br/><strong>Dica:</strong> Faça upgrade para ter até 5 secretárias!</>
                                                )}
                                            </Typography>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Formulário de criação */}
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon sx={{ mr: 1 }} />
                                        Dados da Secretária
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
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
                                                    <PersonIcon />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
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
                                                    <EmailIcon />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type={showPassword ? 'text' : 'password'}
                                        label="Senha"
                                        value={createForm.password}
                                        onChange={handleFormChange('password')}
                                        error={!!createErrors.password}
                                        helperText={createErrors.password}
                                        disabled={creating}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SecurityIcon />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
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
                                                    <SecurityIcon />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                {/* Permissões */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Permissões de Acesso
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {Object.entries(MODULE_PERMISSIONS).map(([module, moduleInfo]) => (
                                            <Grid item xs={12} md={6} lg={4} key={module}>
                                                <PermissionModule
                                                    module={module}
                                                    moduleInfo={moduleInfo}
                                                    permissions={createForm.permissions[module] || {}}
                                                    onChange={handlePermissionChange}
                                                    disabled={creating}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ✅ ABA DE GERENCIAMENTO */}
                    {currentTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Carregando secretárias...
                                    </Typography>
                                </Box>
                            ) : secretaries.length > 0 ? (
                                <>
                                    {secretaries.map((secretary) => (
                                        <SecretaryCard key={secretary.id} secretary={secretary} />
                                    ))}
                                </>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <PeopleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary">
                                        Nenhuma Secretária Cadastrada
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        Use a aba "Criar Nova" para adicionar uma secretária
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAddIcon />}
                                        onClick={() => setCurrentTab(0)}
                                    >
                                        Criar Primeira Secretária
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {/* ✅ BOTÕES */}
                {currentTab === 0 && (
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button onClick={onClose} disabled={creating}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
                            onClick={handleCreateSecretary}
                            disabled={creating || !planLimits.canCreateMore}
                        >
                            {creating ? 'Criando...' : 'Criar Secretária'}
                        </Button>

                        {!planLimits.canCreateMore && planLimits.planName === 'Gratuito' && (
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => window.open('/checkout', '_blank')}
                                sx={{ ml: 1 }}
                            >
                                Fazer Upgrade
                            </Button>
                        )}
                    </DialogActions>
                )}
            </Dialog>

            {/* ✅ DIALOG DE EDIÇÃO DE PERMISSÕES */}
            <Dialog
                open={!!editingSecretary}
                onClose={() => setEditingSecretary(null)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ mr: 2 }} />
                        Editar Permissões: {editingSecretary?.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {Object.entries(MODULE_PERMISSIONS).map(([module, moduleInfo]) => (
                            <Grid item xs={12} md={6} lg={4} key={module}>
                                <PermissionModule
                                    module={module}
                                    moduleInfo={moduleInfo}
                                    permissions={editPermissions[module] || {}}
                                    onChange={(module, action) => (event) => {
                                        setEditPermissions(prev => ({
                                            ...prev,
                                            [module]: {
                                                ...prev[module],
                                                [action]: event.target.checked
                                            }
                                        }));
                                    }}
                                    disabled={savingPermissions}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingSecretary(null)} disabled={savingPermissions}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                        startIcon={savingPermissions ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {savingPermissions ? 'Salvando...' : 'Salvar Permissões'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar de alertas */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity={alert.severity}
                    variant="filled"
                    sx={{ borderRadius: '10px' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SecretaryManagerDialog;