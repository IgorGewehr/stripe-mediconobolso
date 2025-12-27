
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Avatar,
    Badge,
    Tabs,
    Tab,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress,
    CardHeader
} from '@mui/material';

import {
    Info as InfoIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Analytics as AnalyticsIcon,
    Circle as CircleIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CalendarMonth as CalendarIcon,
    MedicalServices as MedicalIcon,
    Assignment as AssignmentIcon,
    Receipt as ReceiptIcon,
    Science as ScienceIcon,
    Note as NoteIcon,
    LocationOn as LocationIcon,
    Computer as ComputerIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    Login as LoginIcon,
    ExpandMore as ExpandMoreIcon,
    AdminPanelSettings as AdminIcon,
    Star as StarIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';

import { adminService } from '@/lib/services/api';
import presenceService from '../../../../lib/presenceService';
import useModuleAccess from '../../hooks/useModuleAccess';

const AdminDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [users, setUsers] = useState([]);
    const [platformStats, setPlatformStats] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const { isAdmin } = useModuleAccess();

    // Carregar dados iniciais
    useEffect(() => {
        if (!isAdmin) return;

        loadUsers();
        loadPlatformStats();

        // Setup listener para usuários online
        const unsubscribe = presenceService.getOnlineUsers((users) => {
            setOnlineUsers(users);
        });

        return () => {
            unsubscribe();
        };
    }, [isAdmin, searchTerm]);

    // Carregar usuários
    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersList = await adminService.getUsersWithPresenceData({
                pageSize: 100,
                searchQuery: searchTerm
            });
            setUsers(usersList);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            showNotification('Erro ao carregar usuários', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Carregar estatísticas da plataforma
    const loadPlatformStats = async () => {
        try {
            const stats = await adminService.getEnhancedPlatformStats();
            setPlatformStats(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            showNotification('Erro ao carregar estatísticas', 'error');
        }
    };

    // Carregar detalhes completos do usuário
    const loadUserDetails = async (userId) => {
        setDetailsLoading(true);
        try {
            const details = await adminService.getUserDetailedStats(userId);
            setUserDetails(details);
        } catch (error) {
            console.error('Erro ao carregar detalhes do usuário:', error);
            showNotification('Erro ao carregar detalhes do usuário', 'error');
        } finally {
            setDetailsLoading(false);
        }
    };

    // Abrir detalhes do usuário
    const handleViewDetails = async (user) => {
        setSelectedUser(user);
        setDialogOpen(true);
        await loadUserDetails(user.id);
    };

    // Mostrar notificação
    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    // Renderizar cards de estatísticas
    const renderStatsCards = () => {
        if (!platformStats) return null;

        const cards = [
            {
                title: 'Usuários Totais',
                value: platformStats.totalUsers,
                icon: <GroupIcon />,
                color: '#2196F3',
                subtitle: `${platformStats.newUsersToday} novos hoje`
            },
            {
                title: 'Online Agora',
                value: platformStats.onlineUsers,
                icon: <CircleIcon sx={{ color: '#4CAF50' }} />,
                color: '#4CAF50',
                subtitle: `${Math.round((platformStats.onlineUsers / platformStats.totalUsers) * 100)}% do total`
            },
            {
                title: 'Usuários Premium',
                value: platformStats.paidUsers,
                icon: <StarIcon />,
                color: '#FF9800',
                subtitle: `${Math.round((platformStats.paidUsers / platformStats.totalUsers) * 100)}% do total`
            },
            {
                title: 'Novos (7d)',
                value: platformStats.newUsersThisWeek,
                icon: <PersonAddIcon />,
                color: '#9C27B0',
                subtitle: `${platformStats.newUsersThisMonth} no mês`
            },
            {
                title: 'Ativos Hoje',
                value: platformStats.activeUsersToday,
                icon: <LoginIcon />,
                color: '#00BCD4',
                subtitle: `${platformStats.activeUsersThisWeek} na semana`
            },
            {
                title: 'Via Enrico',
                value: platformStats.enricoUsers,
                icon: <TrendingUpIcon />,
                color: '#795548',
                subtitle: `${Math.round((platformStats.enricoUsers / platformStats.totalUsers) * 100)}% do total`
            }
        ];

        return (
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                        <Card sx={{
                            background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 100%)`,
                            borderLeft: `4px solid ${card.color}`,
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        {card.title}
                                    </Typography>
                                    <Box sx={{ color: card.color }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: card.color, mb: 0.5 }}>
                                    {card.value.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {card.subtitle}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // Renderizar tabela de usuários
    const renderUsersTable = () => (
        <Card>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon />
                        <Typography variant="h6">Usuários da Plataforma</Typography>
                        <Chip label={`${users.length} usuários`} size="small" variant="outlined" />
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ width: 250 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={loadUsers}
                            disabled={loading}
                            startIcon={<RefreshIcon />}
                            size="small"
                        >
                            Atualizar
                        </Button>
                    </Box>
                }
            />
            <Divider />

            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Carregando usuários...
                    </Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>Usuário</TableCell>
                                <TableCell>Plano</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Último Login</TableCell>
                                <TableCell>Registrado</TableCell>
                                <TableCell>Localização</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
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
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </Badge>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {user.fullName}
                                                    {user.isAdmin && (
                                                        <AdminIcon sx={{ ml: 1, fontSize: 16, color: 'error.main' }} />
                                                    )}
                                                    {user.enrico && (
                                                        <StarIcon sx={{ ml: 1, fontSize: 16, color: 'warning.main' }} />
                                                    )}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={user.planType}
                                            color={user.planColor}
                                            size="small"
                                            variant={user.assinouPlano ? "filled" : "outlined"}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={user.isOnline ? 'Online' : 'Offline'}
                                            color={user.onlineColor}
                                            size="small"
                                            icon={<CircleIcon sx={{ fontSize: '0.75rem !important' }} />}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {user.lastLoginText}
                                            </Typography>
                                            {user.loginCount > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.loginCount} logins • {user.lastLoginMethod}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.registrationText}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.city && user.state ? `${user.city}, ${user.state}` : 'Não informado'}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Tooltip title="Ver detalhes completos">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(user)}
                                                color="primary"
                                            >
                                                <InfoIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Card>
    );

    // Renderizar dialog de detalhes do usuário
    const renderUserDetailsDialog = () => (
        <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={selectedUser?.photoURL}
                        sx={{ width: 48, height: 48 }}
                    >
                        {selectedUser?.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            {selectedUser?.fullName}
                            {selectedUser?.isAdmin && (
                                <AdminIcon sx={{ ml: 1, color: 'error.main' }} />
                            )}
                            {selectedUser?.enrico && (
                                <StarIcon sx={{ ml: 1, color: 'warning.main' }} />
                            )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Detalhes Completos do Usuário
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Chip
                            label={selectedUser?.isOnline ? 'Online' : 'Offline'}
                            color={selectedUser?.onlineColor}
                            size="small"
                            icon={<CircleIcon />}
                        />
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {detailsLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Carregando informações detalhadas...
                        </Typography>
                    </Box>
                ) : userDetails ? (
                    <Grid container spacing={3}>
                        {/* Informações Básicas */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Informações Básicas"
                                    avatar={<PersonIcon color="primary" />}
                                />
                                <CardContent>
                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon><EmailIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Email"
                                                secondary={userDetails.userData.email}
                                            />
                                        </ListItem>
                                        {userDetails.userData.phone && (
                                            <ListItem>
                                                <ListItemIcon><PhoneIcon /></ListItemIcon>
                                                <ListItemText
                                                    primary="Telefone"
                                                    secondary={userDetails.userData.phone}
                                                />
                                            </ListItem>
                                        )}
                                        {userDetails.userData.cpf && (
                                            <ListItem>
                                                <ListItemIcon><AssignmentIcon /></ListItemIcon>
                                                <ListItemText
                                                    primary="CPF"
                                                    secondary={userDetails.userData.cpf}
                                                />
                                            </ListItem>
                                        )}
                                        <ListItem>
                                            <ListItemIcon><LocationIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Localização"
                                                secondary={
                                                    userDetails.userData.address ?
                                                        `${userDetails.userData.address.city}, ${userDetails.userData.address.state}` :
                                                        `${userDetails.userData.city || ''}, ${userDetails.userData.state || ''}` || 'Não informado'
                                                }
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Estatísticas de Uso */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Estatísticas de Uso"
                                    avatar={<AnalyticsIcon color="primary" />}
                                />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1 }}>
                                                <Typography variant="h4" color="primary">
                                                    {userDetails.stats.patientsCount}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Pacientes
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1 }}>
                                                <Typography variant="h4" color="secondary">
                                                    {userDetails.stats.consultationsCount}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Consultas
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1 }}>
                                                <Typography variant="h4" color="warning.main">
                                                    {userDetails.stats.prescriptionsCount}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Receitas
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1 }}>
                                                <Typography variant="h4" color="info.main">
                                                    {userDetails.stats.examsCount}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Exames
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Informações de Acesso */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Informações de Acesso"
                                    avatar={<LoginIcon color="primary" />}
                                />
                                <CardContent>
                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon><ScheduleIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Último Login"
                                                secondary={userDetails.stats.lastLoginFormatted}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CalendarIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Registrado em"
                                                secondary={userDetails.stats.registrationFormatted}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><ComputerIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Último Dispositivo"
                                                secondary={userDetails.stats.lastUserAgent || 'Não informado'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                                            <ListItemText
                                                primary="Total de Logins"
                                                secondary={`${userDetails.stats.loginCount} acessos`}
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Próximas Consultas */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Próximas Consultas"
                                    avatar={<MedicalIcon color="primary" />}
                                />
                                <CardContent>
                                    {userDetails.stats.upcomingConsultations.length > 0 ? (
                                        <List dense>
                                            {userDetails.stats.upcomingConsultations.slice(0, 3).map((consultation, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText
                                                        primary={consultation.title || 'Consulta'}
                                                        secondary={consultation.consultationDate}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhuma consulta agendada
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Informações Adicionais */}
                        <Grid item xs={12}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1">
                                        Informações Técnicas Adicionais
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Dados de Referência
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Via Enrico:</strong> {userDetails.userData.enrico ? 'Sim' : 'Não'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Fonte de Referência:</strong> {userDetails.userData.referralSource || 'Não informado'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Método de Login:</strong> {userDetails.stats.lastLoginMethod}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Dados de Plano
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Tipo:</strong> {userDetails.userData.planType || 'Gratuito'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Assinou Plano:</strong> {userDetails.userData.assinouPlano ? 'Sim' : 'Não'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>ID do Usuário:</strong> {selectedUser?.id}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography>Erro ao carregar detalhes</Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Se não for admin, negar acesso
    if (!isAdmin) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <AdminIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DashboardIcon />
                Painel Administrativo
                <Chip label="ADMIN" color="error" size="small" />
            </Typography>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Dashboard" icon={<DashboardIcon />} />
                <Tab label="Usuários" icon={<PeopleIcon />} />
                <Tab label="Análises" icon={<AnalyticsIcon />} />
            </Tabs>

            {tabValue === 0 && (
                <Box>
                    {renderStatsCards()}

                    {/* Usuários Online em Tempo Real */}
                    <Card sx={{ mb: 4 }}>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircleIcon sx={{ color: '#4CAF50' }} />
                                    <Typography variant="h6">Usuários Online</Typography>
                                    <Chip label={`${onlineUsers.length} online`} color="success" size="small" />
                                </Box>
                            }
                        />
                        <CardContent>
                            {onlineUsers.length > 0 ? (
                                <Grid container spacing={2}>
                                    {onlineUsers.slice(0, 8).map((user) => (
                                        <Grid item key={user.userId}>
                                            <Tooltip title={`Online desde ${new Date(user.sessionStart?.toMillis()).toLocaleTimeString()}`}>
                                                <Chip
                                                    avatar={<Avatar sx={{ width: 24, height: 24 }} />}
                                                    label={user.userId.substring(0, 8)}
                                                    color="success"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Typography color="text.secondary">
                                    Nenhum usuário online no momento
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {renderUsersTable()}
                </Box>
            )}

            {tabValue === 1 && (
                <Box>
                    {renderUsersTable()}
                </Box>
            )}

            {tabValue === 2 && (
                <Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Análises Detalhadas
                            </Typography>
                            <Alert severity="info">
                                Funcionalidades de análises avançadas em desenvolvimento.
                            </Alert>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {renderUserDetailsDialog()}

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

export default AdminDashboard;