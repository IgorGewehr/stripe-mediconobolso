// components/admin/ModuleAdminPanel.js
// Painel administrativo para gerenciar módulos de usuários

"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Tabs,
    Tab,
    Alert,
    Snackbar,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Person as PersonIcon,
    Security as SecurityIcon
} from '@mui/icons-material';

import firebaseService from '../../../../lib/firebaseService';
import moduleService from '../../../../lib/moduleService';
// Definições locais dos módulos - removido moduleConfig
const MODULE_INFO = {
    'receitas': {
        icon: '💊',
        name: 'Receitas Médicas',
        description: 'Criar e gerenciar receitas digitais'
    },
    'agenda': {
        icon: '📅',
        name: 'Agenda Médica',
        description: 'Agendar e gerenciar consultas'
    },
    'pacientes': {
        icon: '👥',
        name: 'Pacientes',
        description: 'Gerenciar cadastro de pacientes'
    },
    'metricas': {
        icon: '📊',
        name: 'Métricas e Relatórios',
        description: 'Acessar relatórios detalhados'
    },
    'financeiro': {
        icon: '💰',
        name: 'Financeiro',
        description: 'Controle financeiro da clínica'
    },
    'ai_analysis': {
        icon: '🤖',
        name: 'Análise por IA',
        description: 'Análise automatizada de exames e relatórios clínicos'
    },
    'dados': {
        icon: '⚙️',
        name: 'Administração',
        description: 'Painel administrativo avançado'
    }
};

const PLAN_MODULES = {
    'free': {
        name: 'Gratuito',
        modules: ['receitas', 'agenda', 'pacientes']
    },
    'monthly': {
        name: 'Mensal',
        modules: ['receitas', 'agenda', 'pacientes', 'metricas', 'ai_analysis']
    },
    'quarterly': {
        name: 'Trimestral',
        modules: ['receitas', 'agenda', 'pacientes', 'metricas', 'ai_analysis', 'financeiro']
    },
    'annual': {
        name: 'Anual',
        modules: ['receitas', 'agenda', 'pacientes', 'metricas', 'ai_analysis', 'financeiro', 'dados']
    }
};

// Funções auxiliares locais
const getModulesByPlan = (plan) => {
    return PLAN_MODULES[plan]?.modules || [];
};

const getLimitationsByPlan = (plan) => {
    // Definir limitações básicas por plano
    const limitations = {
        'free': { maxPatients: 50, maxPrescriptions: 100 },
        'monthly': { maxPatients: 200, maxPrescriptions: 500 },
        'quarterly': { maxPatients: 500, maxPrescriptions: 1000 },
        'annual': { maxPatients: -1, maxPrescriptions: -1 }
    };
    return limitations[plan] || limitations.free;
};
import useModuleAccess from '../../hooks/useModuleAccess';

const ModuleAdminPanel = () => {
    const [tabValue, setTabValue] = useState(0);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // Estados para edição de módulos
    const [editingModules, setEditingModules] = useState([]);
    const [editingLimitations, setEditingLimitations] = useState({});
    const [selectedPlan, setSelectedPlan] = useState('');

    // Estados para operações em lote
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkModules, setBulkModules] = useState([]);
    const [bulkLimitations, setBulkLimitations] = useState({});

    const { hasAccess, isAdmin } = useModuleAccess();

    // Verificar se tem acesso de admin
    useEffect(() => {
        if (!isAdmin) {
            setNotification({
                open: true,
                message: 'Acesso negado. Apenas administradores podem acessar este painel.',
                severity: 'error'
            });
        }
    }, [isAdmin]);

    // Carregar usuários
    const loadUsers = async () => {
        if (!isAdmin) return;

        setLoading(true);
        try {
            const usersList = await firebaseService.listAllUsers(100, null, searchTerm);
            setUsers(usersList);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            setNotification({
                open: true,
                message: 'Erro ao carregar usuários',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [searchTerm, isAdmin]);

    // Abrir diálogo de edição
    const handleEditUser = async (user) => {
        setLoading(true);
        try {
            const moduleInfo = await moduleService.getUserModuleInfo(user.id);
            setSelectedUser(user);
            setEditingModules(moduleInfo.activeModules || []);
            setEditingLimitations(moduleInfo.limitations || {});
            setSelectedPlan(moduleInfo.planType || 'free');
            setDialogOpen(true);
        } catch (error) {
            console.error('Erro ao carregar informações do usuário:', error);
            setNotification({
                open: true,
                message: 'Erro ao carregar informações do usuário',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Salvar alterações de módulos
    const handleSaveModules = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            await moduleService.setCustomModules(
                selectedUser.id,
                editingModules,
                editingLimitations
            );

            setNotification({
                open: true,
                message: 'Módulos atualizados com sucesso!',
                severity: 'success'
            });

            setDialogOpen(false);
            await loadUsers();
        } catch (error) {
            console.error('Erro ao salvar módulos:', error);
            setNotification({
                open: true,
                message: 'Erro ao salvar módulos',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Resetar para módulos padrão do plano
    const handleResetToDefault = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            await moduleService.resetToDefaultModules(selectedUser.id);

            setNotification({
                open: true,
                message: 'Módulos resetados para padrão do plano!',
                severity: 'success'
            });

            setDialogOpen(false);
            await loadUsers();
        } catch (error) {
            console.error('Erro ao resetar módulos:', error);
            setNotification({
                open: true,
                message: 'Erro ao resetar módulos',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Aplicar módulos baseado no plano selecionado
    const handleApplyPlanModules = () => {
        if (!selectedPlan) return;

        const planModules = getModulesByPlan(selectedPlan);
        const planLimitations = getLimitationsByPlan(selectedPlan);

        setEditingModules(planModules);
        setEditingLimitations(planLimitations);
    };

    // Gerenciar seleção de módulo
    const handleModuleToggle = (moduleId) => {
        setEditingModules(prev => {
            if (prev.includes(moduleId)) {
                return prev.filter(id => id !== moduleId);
            } else {
                return [...prev, moduleId];
            }
        });
    };

    // Operações em lote
    const handleBulkUpdate = async () => {
        if (selectedUsers.length === 0 || bulkModules.length === 0) {
            setNotification({
                open: true,
                message: 'Selecione usuários e módulos para aplicação em lote',
                severity: 'warning'
            });
            return;
        }

        setLoading(true);
        try {
            const result = await moduleService.bulkUpdateModules(
                selectedUsers,
                bulkModules,
                bulkLimitations
            );

            setNotification({
                open: true,
                message: `Atualização em lote concluída: ${result.successCount}/${selectedUsers.length} usuários`,
                severity: 'success'
            });

            setBulkDialogOpen(false);
            setSelectedUsers([]);
            await loadUsers();
        } catch (error) {
            console.error('Erro na atualização em lote:', error);
            setNotification({
                open: true,
                message: 'Erro na atualização em lote',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Migrar usuários existentes
    const handleMigrateUsers = async () => {
        setLoading(true);
        try {
            const result = await moduleService.migrateExistingUsers();

            setNotification({
                open: true,
                message: `Migração concluída: ${result.migratedCount} usuários migrados`,
                severity: 'success'
            });

            await loadUsers();
        } catch (error) {
            console.error('Erro na migração:', error);
            setNotification({
                open: true,
                message: 'Erro na migração de usuários',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Renderizar tabela de usuários
    const renderUsersTable = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                                checked={users.length > 0 && selectedUsers.length === users.length}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedUsers(users.map(u => u.id));
                                    } else {
                                        setSelectedUsers([]);
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>Nome</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Plano</TableCell>
                        <TableCell>Módulos Ativos</TableCell>
                        <TableCell>Customizado</TableCell>
                        <TableCell>Ações</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedUsers(prev => [...prev, user.id]);
                                        } else {
                                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                        }
                                    }}
                                />
                            </TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Chip
                                    label={user.assinouPlano ? 'Premium' : 'Gratuito'}
                                    color={user.assinouPlano ? 'primary' : 'default'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption">
                                    {(user.customModules || user.modules || []).length} módulos
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {user.customModules ? (
                                    <Chip label="Sim" color="secondary" size="small" />
                                ) : (
                                    <Chip label="Padrão" color="default" size="small" />
                                )}
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Editar módulos">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditUser(user)}
                                        disabled={loading}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // Renderizar formulário de edição de módulos
    const renderModuleEditor = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel>Aplicar Plano Padrão</InputLabel>
                    <Select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        label="Aplicar Plano Padrão"
                    >
                        {Object.entries(PLAN_MODULES).map(([planId, planInfo]) => (
                            <MenuItem key={planId} value={planId}>
                                {planInfo.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    onClick={handleApplyPlanModules}
                    sx={{ mt: 1 }}
                    variant="outlined"
                    size="small"
                >
                    Aplicar Módulos do Plano
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Módulos Disponíveis
                </Typography>
                <FormGroup>
                    <Grid container spacing={1}>
                        {Object.entries(MODULE_INFO).map(([moduleId, moduleInfo]) => (
                            <Grid item xs={12} sm={6} md={4} key={moduleId}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editingModules.includes(moduleId)}
                                            onChange={() => handleModuleToggle(moduleId)}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {moduleInfo.icon} {moduleInfo.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {moduleInfo.description}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>
                        ))}
                    </Grid>
                </FormGroup>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Módulos Selecionados ({editingModules.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {editingModules.map(moduleId => (
                        <Chip
                            key={moduleId}
                            label={`${MODULE_INFO[moduleId]?.icon} ${MODULE_INFO[moduleId]?.name}`}
                            onDelete={() => handleModuleToggle(moduleId)}
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Grid>
        </Grid>
    );

    // Se não for admin, mostrar mensagem de acesso negado
    if (!isAdmin) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                    Acesso Restrito
                </Typography>
                <Typography color="text.secondary">
                    Apenas administradores podem acessar este painel.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Gerenciamento de Módulos
            </Typography>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Usuários" icon={<PersonIcon />} />
                <Tab label="Configurações" icon={<SettingsIcon />} />
            </Tabs>

            {tabValue === 0 && (
                <Box>
                    {/* Controles da tabela */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                        <TextField
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="outlined"
                            onClick={loadUsers}
                            disabled={loading}
                            startIcon={<RefreshIcon />}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setBulkDialogOpen(true)}
                            disabled={selectedUsers.length === 0}
                            startIcon={<EditIcon />}
                        >
                            Edição em Lote ({selectedUsers.length})
                        </Button>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        renderUsersTable()
                    )}
                </Box>
            )}

            {tabValue === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Migração de Usuários
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Migra usuários existentes para o novo sistema de módulos.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handleMigrateUsers}
                                    disabled={loading}
                                >
                                    Executar Migração
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Estatísticas
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total de usuários: {users.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Usuários premium: {users.filter(u => u.assinouPlano).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Usuários gratuitos: {users.filter(u => u.gratuito).length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Diálogo de edição individual */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Editar Módulos - {selectedUser?.fullName}
                </DialogTitle>
                <DialogContent>
                    {renderModuleEditor()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleResetToDefault} color="warning">
                        Resetar Padrão
                    </Button>
                    <Button onClick={handleSaveModules} variant="contained" disabled={loading}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de edição em lote */}
            <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Edição em Lote - {selectedUsers.length} usuários selecionados
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        As configurações serão aplicadas a todos os usuários selecionados.
                    </Typography>
                    {/* Reutilizar o editor de módulos para operações em lote */}
                    <Box sx={{ mt: 2 }}>
                        <FormGroup>
                            <Grid container spacing={1}>
                                {Object.entries(MODULE_INFO).map(([moduleId, moduleInfo]) => (
                                    <Grid item xs={12} sm={6} md={4} key={moduleId}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={bulkModules.includes(moduleId)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setBulkModules(prev => [...prev, moduleId]);
                                                        } else {
                                                            setBulkModules(prev => prev.filter(id => id !== moduleId));
                                                        }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {moduleInfo.icon} {moduleInfo.name}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </FormGroup>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleBulkUpdate} variant="contained" disabled={loading}>
                        Aplicar em Lote
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notificação */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            >
                <Alert
                    severity={notification.severity}
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ModuleAdminPanel;