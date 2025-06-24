"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Avatar,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Tooltip,
    LinearProgress,
    Alert,
    TableSortLabel,
    Switch,
    FormControlLabel,
    Stack
} from "@mui/material";

import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Circle as CircleIcon,
    Visibility as VisibilityIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    CalendarToday as CalendarIcon,
    Assignment as AssignmentIcon,
    Description as DescriptionIcon,
    LocalHospital as ExamIcon,
    Group as GroupIcon,
    Timeline as TimelineIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Close as CloseIcon
} from '@mui/icons-material';

import firebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";

const UnifiedUserManagement = () => {
    // Estados básicos
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados da tabela
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [orderBy, setOrderBy] = useState('lastLogin');
    const [order, setOrder] = useState('desc');

    // Estados de filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Estados do modal de detalhes
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    // Estados de estatísticas gerais
    const [platformStats, setPlatformStats] = useState(null);

    // Estados de controle
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const { user: currentUser } = useAuth();

    // ====================================================
    // CARREGAMENTO DE DADOS
    // ====================================================

    const loadUsers = useCallback(async () => {
        if (!currentUser?.administrador) return;

        setLoading(true);
        setError('');

        try {
            const result = await firebaseService.getUsersWithPresenceData({
                pageSize: 100,
                searchQuery,
                planFilter,
                statusFilter,
                sortBy: orderBy,
                sortOrder: order
            });

            setUsers(result.users);
            setLastUpdate(new Date());

        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            setError('Erro ao carregar dados dos usuários');
        } finally {
            setLoading(false);
        }
    }, [currentUser, searchQuery, planFilter, statusFilter, orderBy, order]);

    const loadPlatformStats = useCallback(async () => {
        if (!currentUser?.administrador) return;

        try {
            const stats = await firebaseService.getEnhancedPlatformStats();
            setPlatformStats(stats);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }, [currentUser]);

    // ====================================================
    // EFFECTS
    // ====================================================

    useEffect(() => {
        if (currentUser?.administrador) {
            loadUsers();
            loadPlatformStats();
        }
    }, [currentUser, loadUsers, loadPlatformStats]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length === 0 || searchQuery.length > 2) {
                loadUsers();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, loadUsers]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            loadUsers();
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [autoRefresh, loadUsers]);

    // ====================================================
    // HANDLERS
    // ====================================================

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenUserDetails = async (user) => {
        setSelectedUser(user);
        setOpenDialog(true);
        setLoadingStats(true);
        setUserStats(null);

        try {
            const stats = await firebaseService.getUserDetailedStats(user.id);
            setUserStats(stats);
        } catch (error) {
            console.error("Erro ao carregar estatísticas do usuário:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
        setUserStats(null);
    };

    const handleToggleAdminStatus = async (userId, currentStatus) => {
        try {
            await firebaseService.updateUserAdminStatus(userId, !currentStatus);
            await loadUsers(); // Recarregar dados
        } catch (error) {
            console.error("Erro ao atualizar status de administrador:", error);
            setError('Erro ao atualizar permissões do usuário');
        }
    };

    // ====================================================
    // RENDERIZAÇÃO DAS ESTATÍSTICAS
    // ====================================================

    const renderPlatformStats = () => {
        if (!platformStats) return null;

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            {platformStats.totalUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <CircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                                {platformStats.onlineUsers}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Online
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                            {platformStats.paidUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Premium
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9E9E9E' }}>
                            {platformStats.freeUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Gratuito
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                            {platformStats.newUsersToday}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Hoje
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                            {platformStats.enricoUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Enrico
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    // ====================================================
    // RENDERIZAÇÃO DO MODAL DE DETALHES
    // ====================================================

    const renderUserDetailsDialog = () => {
        if (!selectedUser) return null;

        return (
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={selectedUser.photoURL}
                            sx={{ width: 48, height: 48 }}
                        >
                            {selectedUser.fullName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {selectedUser.fullName || 'Nome não informado'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    label={selectedUser.planType}
                                    color={selectedUser.planColor}
                                    size="small"
                                />
                                {selectedUser.isOnline && (
                                    <Chip
                                        icon={<CircleIcon sx={{ fontSize: 12 }} />}
                                        label="Online"
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                    <IconButton onClick={handleCloseDialog}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {loadingStats ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <LinearProgress sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Carregando estatísticas...
                            </Typography>
                        </Box>
                    ) : userStats ? (
                        <Grid container spacing={3}>
                            {/* Informações Pessoais */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Informações Pessoais
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Email"
                                            secondary={selectedUser.email || 'Não informado'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Telefone"
                                            secondary={selectedUser.phone || 'Não informado'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Localização"
                                            secondary={
                                                selectedUser.address ?
                                                    `${selectedUser.address.city}, ${selectedUser.address.state}` :
                                                    'Não informado'
                                            }
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Conta criada"
                                            secondary={userStats.registrationTime}
                                        />
                                    </ListItem>
                                </List>
                            </Grid>

                            {/* Estatísticas de Uso */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Estatísticas de Uso
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Card sx={{ textAlign: 'center', p: 2 }}>
                                            <GroupIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {userStats.patientsCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Pacientes
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card sx={{ textAlign: 'center', p: 2 }}>
                                            <CalendarIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {userStats.consultationsCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Consultas
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card sx={{ textAlign: 'center', p: 2 }}>
                                            <AssignmentIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {userStats.prescriptionsCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Receitas
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card sx={{ textAlign: 'center', p: 2 }}>
                                            <ExamIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {userStats.examsCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Exames
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Atividade Recente */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Atividade Recente
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Consultas este mês
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {userStats.consultationsThisMonth}
                                                </Typography>
                                                {userStats.monthlyGrowthPercent !== 0 && (
                                                    <Chip
                                                        label={`${userStats.monthlyGrowthPercent > 0 ? '+' : ''}${userStats.monthlyGrowthPercent}%`}
                                                        color={userStats.monthlyGrowthPercent > 0 ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Último login
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {selectedUser.lastSeenText}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Total de logins
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {userStats.loginCount}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Próximas Consultas */}
                            {userStats.upcomingConsultations.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        Próximas Consultas
                                    </Typography>
                                    <List dense>
                                        {userStats.upcomingConsultations.map((consultation, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <ScheduleIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={consultation.patientName || 'Paciente não informado'}
                                                    secondary={new Date(consultation.consultationDate).toLocaleString('pt-BR')}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}

                            {/* Controles Administrativos */}
                            {currentUser?.administrador && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        Controles Administrativos
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={selectedUser.administrador === true}
                                                onChange={() => handleToggleAdminStatus(
                                                    selectedUser.id,
                                                    selectedUser.administrador === true
                                                )}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {selectedUser.administrador ? (
                                                    <AdminIcon color="primary" />
                                                ) : (
                                                    <PersonIcon color="action" />
                                                )}
                                                <Typography>
                                                    {selectedUser.administrador ? 'Administrador' : 'Usuário Padrão'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Alert severity="error">
                            Erro ao carregar estatísticas do usuário
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} variant="outlined">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // ====================================================
    // RENDERIZAÇÃO PRINCIPAL
    // ====================================================

    if (!currentUser?.administrador) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error">
                    Acesso negado. Esta área é restrita para administradores.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#111E5A' }}>
                        Gerenciamento de Usuários
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {lastUpdate && `Última atualização: ${lastUpdate.toLocaleTimeString()}`}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                color="primary"
                                size="small"
                            />
                        }
                        label="Auto-refresh"
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadUsers}
                        disabled={loading}
                    >
                        Atualizar
                    </Button>
                </Box>
            </Box>

            {/* Estatísticas da Plataforma */}
            {renderPlatformStats()}

            {/* Filtros */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Pesquisar por nome, email ou CPF"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Plano</InputLabel>
                        <Select
                            value={planFilter}
                            label="Plano"
                            onChange={(e) => setPlanFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todos os planos</MenuItem>
                            <MenuItem value="admin">Administradores</MenuItem>
                            <MenuItem value="premium">Premium</MenuItem>
                            <MenuItem value="free">Gratuito</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="online">Online</MenuItem>
                            <MenuItem value="offline">Offline</MenuItem>
                            <MenuItem value="recent">Recentes (24h)</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Alerta de erro */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Tabela de usuários */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'fullName'}
                                        direction={orderBy === 'fullName' ? order : 'asc'}
                                        onClick={() => handleSort('fullName')}
                                    >
                                        Usuário
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Plano</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'lastLogin'}
                                        direction={orderBy === 'lastLogin' ? order : 'asc'}
                                        onClick={() => handleSort('lastLogin')}
                                    >
                                        Status / Último Login
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Localização</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'createdAt'}
                                        direction={orderBy === 'createdAt' ? order : 'asc'}
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        Conta
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Origem</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <LinearProgress sx={{ mb: 2 }} />
                                        <Typography>Carregando usuários...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography>Nenhum usuário encontrado</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((user) => (
                                        <TableRow
                                            key={user.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleOpenUserDetails(user)}
                                        >
                                            {/* Usuário */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Badge
                                                        overlap="circular"
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                        badgeContent={
                                                            user.isOnline ? (
                                                                <CircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                                                            ) : null
                                                        }
                                                    >
                                                        <Avatar
                                                            src={user.photoURL}
                                                            sx={{ width: 40, height: 40 }}
                                                        >
                                                            {user.fullName?.charAt(0) || 'U'}
                                                        </Avatar>
                                                    </Badge>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {user.fullName || 'Nome não informado'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Plano */}
                                            <TableCell>
                                                <Chip
                                                    label={user.planType}
                                                    color={user.planColor}
                                                    size="small"
                                                    icon={
                                                        user.planIcon === 'admin' ? <AdminIcon /> :
                                                            user.planIcon === 'premium' ? <CheckCircleIcon /> :
                                                                <PersonIcon />
                                                    }
                                                />
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <Box>
                                                    <Chip
                                                        label={user.isOnline ? 'Online' : user.lastSeenText}
                                                        color={user.isOnline ? 'success' : user.lastSeenColor}
                                                        size="small"
                                                        variant={user.isOnline ? 'filled' : 'outlined'}
                                                    />
                                                </Box>
                                            </TableCell>

                                            {/* Localização */}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {user.address ?
                                                        `${user.address.city}, ${user.address.state}` :
                                                        'Não informado'
                                                    }
                                                </Typography>
                                            </TableCell>

                                            {/* Conta */}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {user.accountAge}
                                                </Typography>
                                            </TableCell>

                                            {/* Origem */}
                                            <TableCell>
                                                <Chip
                                                    label={user.referralDisplay}
                                                    color={user.referralColor}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>

                                            {/* Ações */}
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenUserDetails(user);
                                                    }}
                                                >
                                                    Detalhes
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginação */}
                <TablePagination
                    component="div"
                    count={users.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count}`
                    }
                />
            </Paper>

            {/* Modal de detalhes */}
            {renderUserDetailsDialog()}
        </Box>
    );
};

export default UnifiedUserManagement;