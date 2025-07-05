"use client";

import React, { useState, useEffect } from 'react';
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
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    alpha,
    InputAdornment
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    AdminPanelSettings as AdminIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../authProvider';
import firebaseService from '../../../lib/firebaseService';

const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.1)"
};

// Configuração dos módulos e suas permissões
const moduleConfig = {
    patients: {
        name: 'Pacientes',
        icon: '👥',
        permissions: ['read', 'write', 'viewDetails'],
        permissionLabels: {
            read: 'Visualizar lista',
            write: 'Criar/Editar',
            viewDetails: 'Ver dados sensíveis'
        }
    },
    appointments: {
        name: 'Agendamentos',
        icon: '📅',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Criar/Editar'
        }
    },
    prescriptions: {
        name: 'Receitas',
        icon: '💊',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Criar/Editar'
        }
    },
    exams: {
        name: 'Exames',
        icon: '🔬',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Criar/Editar'
        }
    },
    notes: {
        name: 'Anotações',
        icon: '📝',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Criar/Editar'
        }
    },
    financial: {
        name: 'Financeiro',
        icon: '💰',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Editar'
        }
    },
    reports: {
        name: 'Relatórios',
        icon: '📊',
        permissions: ['read', 'write'],
        permissionLabels: {
            read: 'Visualizar',
            write: 'Gerar'
        }
    }
};

// Permissões padrão para nova secretária
const defaultPermissions = {
    patients: { read: true, write: false, viewDetails: false },
    appointments: { read: true, write: true },
    prescriptions: { read: true, write: false },
    exams: { read: true, write: false },
    notes: { read: true, write: false },
    financial: { read: false, write: false },
    reports: { read: true, write: false }
};

const SecretaryManagerDialog = ({ open, onClose }) => {
    const { user, isSecretary } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [secretaryInfo, setSecretaryInfo] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Estados para criação de secretária
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        permissions: { ...defaultPermissions }
    });
    const [createErrors, setCreateErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // Estados para edição de permissões
    const [editingPermissions, setEditingPermissions] = useState(false);
    const [tempPermissions, setTempPermissions] = useState({});
    const [savingPermissions, setSavingPermissions] = useState(false);

    // Carregar informações da secretária ao abrir o dialog
    useEffect(() => {
        if (open && user?.uid && !isSecretary) {
            loadSecretaryInfo();
        }
    }, [open, user?.uid, isSecretary]);

    const loadSecretaryInfo = async () => {
        try {
            setLoading(true);
            const info = await firebaseService.getDoctorSecretaryInfo(user.uid);
            setSecretaryInfo(info);
        } catch (error) {
            console.error('Erro ao carregar informações da secretária:', error);
            showAlert('Erro ao carregar informações da secretária', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    };

    const handleCloseAlert = () => {
        setAlert({ ...alert, open: false });
    };

    // Validação do formulário de criação
    const validateCreateForm = () => {
        const errors = {};

        if (!createForm.name.trim()) {
            errors.name = 'Nome é obrigatório';
        }

        if (!createForm.email.trim()) {
            errors.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
            errors.email = 'E-mail inválido';
        }

        if (!createForm.password) {
            errors.password = 'Senha é obrigatória';
        } else if (createForm.password.length < 6) {
            errors.password = 'Senha deve ter pelo menos 6 caracteres';
        }

        if (createForm.password !== createForm.confirmPassword) {
            errors.confirmPassword = 'Senhas não coincidem';
        }

        setCreateErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Criar nova secretária
    const handleCreateSecretary = async () => {
        if (!validateCreateForm()) {
            showAlert('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            setCreating(true);

            const secretaryData = {
                name: createForm.name.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                permissions: createForm.permissions
            };

            const result = await firebaseService.createSecretaryAccount(user.uid, secretaryData);

            if (result.success) {
                showAlert('Secretária criada com sucesso!', 'success');
                setCreateForm({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    permissions: { ...defaultPermissions }
                });
                setCreateErrors({});
                await loadSecretaryInfo(); // Recarregar informações
                setCurrentTab(1); // Ir para aba de gerenciamento
            }
        } catch (error) {
            console.error('Erro ao criar secretária:', error);
            showAlert(error.message || 'Erro ao criar secretária', 'error');
        } finally {
            setCreating(false);
        }
    };

    // Atualizar permissões da secretária
    const handleUpdatePermissions = async () => {
        try {
            setSavingPermissions(true);

            await firebaseService.updateSecretaryPermissions(
                user.uid,
                secretaryInfo.id,
                tempPermissions
            );

            setSecretaryInfo(prev => ({
                ...prev,
                permissions: tempPermissions
            }));

            setEditingPermissions(false);
            showAlert('Permissões atualizadas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar permissões:', error);
            showAlert('Erro ao atualizar permissões', 'error');
        } finally {
            setSavingPermissions(false);
        }
    };

    // Desativar secretária
    const handleDeactivateSecretary = async () => {
        if (!window.confirm('Tem certeza que deseja desativar esta secretária? Ela perderá o acesso ao sistema.')) {
            return;
        }

        try {
            setLoading(true);

            await firebaseService.deactivateSecretaryAccount(user.uid, secretaryInfo.id);

            showAlert('Secretária desativada com sucesso!', 'success');
            await loadSecretaryInfo(); // Recarregar informações
        } catch (error) {
            console.error('Erro ao desativar secretária:', error);
            showAlert('Erro ao desativar secretária', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Renderizar campo de permissão
    const renderPermissionField = (moduleId, permission, isEditing = false) => {
        const module = moduleConfig[moduleId];
        if (!module || !module.permissions.includes(permission)) return null;

        const currentPermissions = isEditing ? tempPermissions : secretaryInfo?.permissions || {};
        const isChecked = currentPermissions[moduleId]?.[permission] || false;

        return (
            <FormControlLabel
                key={`${moduleId}-${permission}`}
                control={
                    <Switch
                        checked={isChecked}
                        onChange={(e) => {
                            if (isEditing) {
                                setTempPermissions(prev => ({
                                    ...prev,
                                    [moduleId]: {
                                        ...prev[moduleId],
                                        [permission]: e.target.checked
                                    }
                                }));
                            }
                        }}
                        disabled={!isEditing}
                        size="small"
                        color={isChecked ? "success" : "default"}
                    />
                }
                label={
                    <Typography variant="caption" sx={{ fontSize: '12px', color: themeColors.textSecondary }}>
                        {module.permissionLabels[permission]}
                    </Typography>
                }
            />
        );
    };

    // Renderizar aba de criação
    const renderCreateTab = () => (
        <Box sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontFamily: 'Gellix, sans-serif' }}>
                    Crie uma conta para sua secretária gerenciar pacientes e agendamentos conforme as permissões definidas.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Nome da Secretária"
                        value={createForm.name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                        error={!!createErrors.name}
                        helperText={createErrors.name}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon sx={{ color: themeColors.primary }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="E-mail de Login"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        error={!!createErrors.email}
                        helperText={createErrors.email}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: themeColors.primary }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        error={!!createErrors.password}
                        helperText={createErrors.password}
                        InputProps={{
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
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Confirmar Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        error={!!createErrors.confirmPassword}
                        helperText={createErrors.confirmPassword}
                        sx={{ mb: 2 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: themeColors.textPrimary, fontWeight: 600 }}>
                        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Permissões de Acesso
                    </Typography>

                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {Object.entries(moduleConfig).map(([moduleId, module]) => (
                            <Card key={moduleId} sx={{ mb: 2, borderRadius: '8px' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.textPrimary }}>
                                        <span style={{ marginRight: 8 }}>{module.icon}</span>
                                        {module.name}
                                    </Typography>
                                    <FormGroup>
                                        {module.permissions.map(permission => (
                                            <FormControlLabel
                                                key={permission}
                                                control={
                                                    <Switch
                                                        checked={createForm.permissions[moduleId]?.[permission] || false}
                                                        onChange={(e) => {
                                                            setCreateForm(prev => ({
                                                                ...prev,
                                                                permissions: {
                                                                    ...prev.permissions,
                                                                    [moduleId]: {
                                                                        ...prev.permissions[moduleId],
                                                                        [permission]: e.target.checked
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="caption" sx={{ fontSize: '12px' }}>
                                                        {module.permissionLabels[permission]}
                                                    </Typography>
                                                }
                                            />
                                        ))}
                                    </FormGroup>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // Renderizar aba de gerenciamento
    const renderManageTab = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (!secretaryInfo) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 64, color: themeColors.textTertiary, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: themeColors.textSecondary, mb: 1 }}>
                        Nenhuma secretária encontrada
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.textTertiary, mb: 3 }}>
                        Crie uma conta para sua secretária na aba "Criar Nova"
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setCurrentTab(0)}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif'
                        }}
                    >
                        Criar Secretária
                    </Button>
                </Box>
            );
        }

        return (
            <Box sx={{ p: 2 }}>
                {/* Card da secretária */}
                <Card sx={{ mb: 3, borderRadius: '12px', border: `1px solid ${themeColors.borderColor}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 60,
                                    height: 60,
                                    backgroundColor: alpha(themeColors.primary, 0.1),
                                    color: themeColors.primary,
                                    mr: 3
                                }}
                            >
                                <PersonIcon fontSize="large" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ color: themeColors.textPrimary, fontWeight: 600 }}>
                                    {secretaryInfo.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 1 }}>
                                    {secretaryInfo.email}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={secretaryInfo.active ? <CheckCircleIcon /> : <BlockIcon />}
                                        label={secretaryInfo.active ? 'Ativa' : 'Inativa'}
                                        color={secretaryInfo.active ? 'success' : 'error'}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Typography variant="caption" sx={{ color: themeColors.textTertiary }}>
                                        {secretaryInfo.loginCount || 0} login(s)
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Permissões */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: themeColors.textPrimary, fontWeight: 600 }}>
                                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Permissões de Acesso
                                </Typography>
                                {!editingPermissions && (
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => {
                                            setEditingPermissions(true);
                                            setTempPermissions(secretaryInfo.permissions || {});
                                        }}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Editar
                                    </Button>
                                )}
                            </Box>

                            <Grid container spacing={2}>
                                {Object.entries(moduleConfig).map(([moduleId, module]) => (
                                    <Grid item xs={12} md={6} key={moduleId}>
                                        <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                                            <CardContent sx={{ p: 2 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.textPrimary }}>
                                                    <span style={{ marginRight: 8 }}>{module.icon}</span>
                                                    {module.name}
                                                </Typography>
                                                <FormGroup>
                                                    {module.permissions.map(permission =>
                                                        renderPermissionField(moduleId, permission, editingPermissions)
                                                    )}
                                                </FormGroup>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {editingPermissions && (
                                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CancelIcon />}
                                        onClick={() => {
                                            setEditingPermissions(false);
                                            setTempPermissions({});
                                        }}
                                        disabled={savingPermissions}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={savingPermissions ? <CircularProgress size={16} /> : <SaveIcon />}
                                        onClick={handleUpdatePermissions}
                                        disabled={savingPermissions}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {savingPermissions ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Ações perigosas */}
                        {secretaryInfo.active && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${themeColors.borderColor}` }}>
                                <Typography variant="subtitle2" sx={{ color: themeColors.error, fontWeight: 600, mb: 2 }}>
                                    Zona Perigosa
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleDeactivateSecretary}
                                    disabled={loading}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Desativar Secretária
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    };

    // Verificar se é secretária (não pode gerenciar outras secretárias)
    if (isSecretary) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                    <WarningIcon sx={{ fontSize: 64, color: themeColors.warning, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: themeColors.textPrimary, mb: 1 }}>
                        Acesso Restrito
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                        Apenas médicos podem gerenciar secretárias.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        minHeight: '70vh'
                    }
                }}
            >
                <DialogTitle sx={{ p: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{
                            color: themeColors.textPrimary,
                            fontWeight: 600,
                            fontFamily: 'Gellix, sans-serif'
                        }}>
                            <AdminIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                            Gerenciar Secretárias
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
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
                            sx={{ textTransform: 'none', fontFamily: 'Gellix, sans-serif' }}
                        />
                        <Tab
                            label="Gerenciar"
                            icon={<SettingsIcon />}
                            iconPosition="start"
                            sx={{ textTransform: 'none', fontFamily: 'Gellix, sans-serif' }}
                        />
                    </Tabs>
                </Box>

                <DialogContent sx={{ p: 0, minHeight: '500px' }}>
                    {currentTab === 0 && renderCreateTab()}
                    {currentTab === 1 && renderManageTab()}
                </DialogContent>

                {currentTab === 0 && (
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={onClose}
                            disabled={creating}
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
                            onClick={handleCreateSecretary}
                            disabled={creating}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '8px',
                                backgroundColor: themeColors.primary
                            }}
                        >
                            {creating ? 'Criando...' : 'Criar Secretária'}
                        </Button>
                    </DialogActions>
                )}
            </Dialog>

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