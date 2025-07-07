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
    LinearProgress,
    InputAdornment
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
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../authProvider';
import firebaseService from '../../../lib/firebaseService';
import globalCache from '../globalCache';

const SecretaryManagerDialog = ({ open, onClose }) => {
    const { user, isSecretary, reloadUserContext } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [secretaryInfo, setSecretaryInfo] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // ✅ ESTADOS PARA LIMITES DO PLANO
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
        permissions: {
            patients: { read: true, write: false, viewDetails: false },
            appointments: { read: true, write: true },
            prescriptions: { read: true, write: false },
            exams: { read: true, write: false },
            notes: { read: true, write: false },
            financial: { read: false, write: false },
            reports: { read: true, write: false }
        }
    });
    const [createErrors, setCreateErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);

    // ✅ FUNÇÃO SIMPLIFICADA PARA CARREGAR LIMITES DO PLANO
    const loadPlanLimits = async () => {
        try {
            console.log('📊 Carregando limites do plano...');

            let max, planName;
            if (user?.administrador) {
                max = 10;
                planName = 'Administrador';
            } else if (user?.assinouPlano) {
                max = 5;
                planName = 'Pago';
            } else {
                max = 1;
                planName = 'Gratuito';
            }

            const current = secretaryInfo ? 1 : 0;
            const canCreateMore = current < max;
            const remaining = Math.max(0, max - current);

            const limits = {
                current,
                max,
                planName,
                canCreateMore,
                remaining
            };

            setPlanLimits(limits);
            console.log('✅ Limites do plano carregados:', limits);
        } catch (error) {
            console.error('❌ Erro ao carregar limites do plano:', error);
            setPlanLimits({
                current: 0,
                max: 1,
                planName: 'Gratuito',
                canCreateMore: true,
                remaining: 1
            });
        }
    };

    // ✅ FUNÇÃO SIMPLIFICADA PARA CRIAR SECRETÁRIA
    const handleCreateSecretary = async () => {
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
            console.log('🔄 Iniciando criação simplificada de secretária...');

            const secretaryData = {
                name: createForm.name.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                permissions: createForm.permissions
            };

            showAlert('Criando secretária...', 'info');

            // ✅ CRIAR SECRETÁRIA SEM LOGOUT
            const result = await firebaseService.createSecretaryAccount(user.uid, secretaryData);

            if (result.success) {
                console.log('✅ Secretária criada com sucesso!');
                showAlert('Secretária criada com sucesso! 🎉', 'success');

                // ✅ PROCESSAR SUCESSO IMEDIATAMENTE
                await handleSuccessfulCreation(result.data);
            } else {
                throw new Error(result.error || 'Erro desconhecido na criação');
            }

        } catch (error) {
            console.error('❌ Erro ao criar secretária:', error);
            showAlert(error.message || 'Erro ao criar secretária', 'error');
        } finally {
            setCreating(false);
        }
    };

    // ✅ FUNÇÃO SIMPLIFICADA PARA LIDAR COM SUCESSO DA CRIAÇÃO
    const handleSuccessfulCreation = async (createdData) => {
        try {
            console.log('🎉 Processando sucesso da criação...');

            // Limpar formulário
            setCreateForm({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                permissions: {
                    patients: { read: true, write: false, viewDetails: false },
                    appointments: { read: true, write: true },
                    prescriptions: { read: true, write: false },
                    exams: { read: true, write: false },
                    notes: { read: true, write: false },
                    financial: { read: false, write: false },
                    reports: { read: true, write: false }
                }
            });
            setCreateErrors({});

            // ✅ INVALIDAR CACHE
            console.log('🗑️ Invalidando caches...');
            globalCache.invalidate('userContext', user.uid);
            globalCache.invalidate('secretaryInfo', user.uid);
            globalCache.invalidate('profileData', user.uid);

            // ✅ AGUARDAR UM POUCO PARA PROPAGAÇÃO
            await new Promise(resolve => setTimeout(resolve, 1000));

            // ✅ RECARREGAR INFORMAÇÕES
            await Promise.all([
                loadSecretaryInfo(true),
                loadPlanLimits(),
                reloadUserContext().catch(error => {
                    console.warn('⚠️ Erro ao recarregar contexto:', error);
                })
            ]);

            // Ir para aba de gerenciamento
            setCurrentTab(1);

            console.log('✅ Sucesso processado completamente');

        } catch (error) {
            console.error('❌ Erro no pós-processamento:', error);
            showAlert('Secretária criada, mas houve erro ao atualizar interface. Atualize a página.', 'warning');
        }
    };

    // ✅ FUNÇÃO MELHORADA PARA CARREGAR INFORMAÇÕES DA SECRETÁRIA
    const loadSecretaryInfo = async (forceReload = false) => {
        try {
            setLoading(true);

            if (forceReload) {
                globalCache.invalidate('secretaryInfo', user.uid);
                console.log('🔄 Força recarregamento das informações da secretária...');
                // Aguardar propagação dos dados
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            const info = await firebaseService.getDoctorSecretaryInfo(user.uid);
            setSecretaryInfo(info);

            if (info) {
                console.log(`✅ Informações da secretária carregadas: ${info.name}`);
            } else {
                console.log('📝 Nenhuma secretária encontrada');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar informações da secretária:', error);
            showAlert('Erro ao carregar informações da secretária', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FUNÇÃO PARA ATUALIZAR MANUALMENTE
    const handleRefreshSecretaryInfo = async () => {
        console.log('🔄 Atualizando informações da secretária manualmente...');
        await loadSecretaryInfo(true);
        await loadPlanLimits();
    };

    // Função para mostrar alert
    const showAlert = (message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    };

    // Função para fechar alert
    const handleCloseAlert = () => {
        setAlert({ ...alert, open: false });
    };

    // Validação do formulário
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
        } else if (createForm.password.length < 8) {
            errors.password = 'Senha deve ter pelo menos 8 caracteres';
        }

        if (createForm.password !== createForm.confirmPassword) {
            errors.confirmPassword = 'Senhas não coincidem';
        }

        setCreateErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handlers para mudanças no formulário
    const handleFormChange = (field) => (event) => {
        setCreateForm(prev => ({
            ...prev,
            [field]: event.target.value
        }));

        if (createErrors[field]) {
            setCreateErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Handler para mudanças nas permissões
    const handlePermissionChange = (module, action) => (event) => {
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
    };

    // ✅ CARREGAR INFORMAÇÕES AO ABRIR O DIALOG
    useEffect(() => {
        if (open && user?.uid && !isSecretary) {
            console.log('📂 Dialog aberto, carregando informações...');
            loadSecretaryInfo();
            loadPlanLimits();
        }
    }, [open, user?.uid, isSecretary]);

    // ✅ RESETAR ESTADOS AO FECHAR
    useEffect(() => {
        if (!open) {
            setCurrentTab(0);
            setSecretaryInfo(null);
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
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Secretárias não podem gerenciar outras secretárias.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Fechar</Button>
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
                    sx: { borderRadius: '20px', minHeight: '70vh' }
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
                                    onClick={handleRefreshSecretaryInfo}
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
                            label="Gerenciar"
                            icon={<SettingsIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                <DialogContent sx={{ p: 0, minHeight: '500px' }}>
                    {/* ✅ ABA DE CRIAÇÃO */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Indicador de limite */}
                            <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
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

                            <Grid container spacing={3}>
                                {/* Dados básicos */}
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

                                {/* Permissões simplificadas */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Permissões de Acesso
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {Object.entries(createForm.permissions).map(([module, permissions]) => (
                                            <Grid item xs={12} md={6} lg={4} key={module}>
                                                <Card sx={{ p: 2, height: '100%' }}>
                                                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                                                        {module === 'patients' ? 'Pacientes' :
                                                            module === 'appointments' ? 'Agenda' :
                                                                module === 'prescriptions' ? 'Receitas' :
                                                                    module === 'exams' ? 'Exames' :
                                                                        module === 'notes' ? 'Notas' :
                                                                            module === 'financial' ? 'Financeiro' :
                                                                                module === 'reports' ? 'Relatórios' : module}
                                                    </Typography>

                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={permissions.read}
                                                                    onChange={handlePermissionChange(module, 'read')}
                                                                    size="small"
                                                                />
                                                            }
                                                            label="Visualizar"
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Switch
                                                                    checked={permissions.write}
                                                                    onChange={handlePermissionChange(module, 'write')}
                                                                    size="small"
                                                                />
                                                            }
                                                            label="Editar"
                                                        />
                                                        {permissions.viewDetails !== undefined && (
                                                            <FormControlLabel
                                                                control={
                                                                    <Switch
                                                                        checked={permissions.viewDetails}
                                                                        onChange={handlePermissionChange(module, 'viewDetails')}
                                                                        size="small"
                                                                    />
                                                                }
                                                                label="Ver Detalhes"
                                                            />
                                                        )}
                                                    </FormGroup>
                                                </Card>
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
                                        Carregando informações da secretária...
                                    </Typography>
                                </Box>
                            ) : secretaryInfo ? (
                                <Card>
                                    <CardContent>
                                        <Alert severity="success" sx={{ mb: 3 }}>
                                            <Typography variant="body2">
                                                ✅ <strong>Secretária ativa encontrada!</strong> Sua secretária está configurada e operacional.
                                            </Typography>
                                        </Alert>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                {secretaryInfo.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6">
                                                    {secretaryInfo.name}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {secretaryInfo.email}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ ml: 'auto' }}>
                                                <Chip
                                                    icon={secretaryInfo.active ? <CheckCircleIcon /> : <BlockIcon />}
                                                    label={secretaryInfo.active ? 'Ativa' : 'Inativa'}
                                                    color={secretaryInfo.active ? 'success' : 'error'}
                                                />
                                            </Box>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Estatísticas:
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Logins realizados: {secretaryInfo.loginCount || 0}
                                        </Typography>
                                        {secretaryInfo.lastLogin && (
                                            <Typography variant="body2" color="textSecondary">
                                                Último acesso: {new Date(secretaryInfo.lastLogin.toDate()).toLocaleString('pt-BR')}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <PeopleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary">
                                        Nenhuma Secretária Cadastrada
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        Use a aba "Criar Nova" para adicionar uma secretária
                                    </Typography>

                                    <Alert severity="info" sx={{ maxWidth: 400, mx: 'auto' }}>
                                        <Typography variant="caption">
                                            <strong>💡 Dica:</strong> Se você acabou de criar uma secretária e não está aparecendo aqui,
                                            clique no botão de atualizar (↻) no canto superior direito.
                                        </Typography>
                                    </Alert>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {/* ✅ BOTÕES DE AÇÃO SIMPLIFICADOS */}
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