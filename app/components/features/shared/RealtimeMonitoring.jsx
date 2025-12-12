import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Grid,
    Paper,
    Divider,
    IconButton,
    Tooltip,
    LinearProgress,
    Badge,
    TextField,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    Alert,
    Fade,
    Skeleton
} from '@mui/material';

import {
    Circle as CircleIcon,
    Refresh as RefreshIcon,
    Computer as ComputerIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Visibility as VisibilityIcon,
    Speed as SpeedIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    SignalWifi4Bar as ExcellentIcon,
    SignalWifi3Bar as GoodIcon,
    SignalWifi2Bar as FairIcon,
    SignalWifi1Bar as PoorIcon,
    SignalWifiOff as UnknownIcon
} from '@mui/icons-material';

import optimizedPresenceService from '../../../../lib/presenceService';
import firebaseService from '../../../../lib/firebaseService';

const EnhancedRealtimeMonitoring = () => {
    // Estados básicos
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [presenceStats, setPresenceStats] = useState(null);
    const [userDetails, setUserDetails] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados de filtro e busca
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    // Estado para cache e performance
    const [lastUpdate, setLastUpdate] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // ====================================================
    // CARREGAMENTO DE DADOS OTIMIZADO
    // ====================================================

    const loadUserDetails = useCallback(async (users) => {
        const detailsMap = new Map();
        const userPromises = users.map(async (presenceData) => {
            try {
                const userData = await firebaseService.getUserData(presenceData.userId);
                return {
                    userId: presenceData.userId,
                    userData: {
                        ...userData,
                        presence: presenceData
                    }
                };
            } catch (error) {
                console.warn(`Erro ao buscar dados do usuário ${presenceData.userId}:`, error);
                return {
                    userId: presenceData.userId,
                    userData: {
                        fullName: 'Usuário Desconhecido',
                        email: presenceData.userId,
                        presence: presenceData
                    }
                };
            }
        });

        const results = await Promise.allSettled(userPromises);
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                detailsMap.set(result.value.userId, result.value.userData);
            }
        });

        setUserDetails(detailsMap);
    }, []);

    // ====================================================
    // CONFIGURAÇÃO DE LISTENERS
    // ====================================================

    useEffect(() => {
        let unsubscribePresence = null;
        let statsInterval = null;

        const initializeMonitoring = async () => {
            try {
                setLoading(true);
                setError(null);

                // Listener para usuários online com opções otimizadas
                unsubscribePresence = optimizedPresenceService.getOnlineUsers(
                    async (users) => {
                        setOnlineUsers(users);
                        setLastUpdate(new Date());

                        // Carregar detalhes dos usuários
                        await loadUserDetails(users);
                        setLoading(false);
                    },
                    {
                        includeStatus: true,
                        maxUsers: 100
                    }
                );

                // Atualizar estatísticas periodicamente
                const updateStats = async () => {
                    try {
                        const stats = await optimizedPresenceService.getPresenceStats();
                        setPresenceStats(stats);
                    } catch (error) {
                        console.error('Erro ao buscar estatísticas:', error);
                        setError('Erro ao carregar estatísticas');
                    }
                };

                await updateStats();

                if (autoRefresh) {
                    statsInterval = setInterval(updateStats, 30000);
                }

            } catch (error) {
                console.error('Erro ao inicializar monitoramento:', error);
                setError('Erro ao inicializar monitoramento');
                setLoading(false);
            }
        };

        initializeMonitoring();

        return () => {
            if (unsubscribePresence) {
                unsubscribePresence();
            }
            if (statsInterval) {
                clearInterval(statsInterval);
            }
        };
    }, [loadUserDetails, autoRefresh]);

    // ====================================================
    // FILTROS E BUSCA
    // ====================================================

    const filteredUsers = useMemo(() => {
        let filtered = [...onlineUsers];

        // Filtro de busca
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(presenceData => {
                const user = userDetails.get(presenceData.userId);
                if (!user) return false;

                return (
                    user.fullName?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    presenceData.userId.toLowerCase().includes(query)
                );
            });
        }

        // Filtro de status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(presenceData => {
                return presenceData.status === statusFilter;
            });
        }

        // Filtro de role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(presenceData => {
                const user = userDetails.get(presenceData.userId);
                if (roleFilter === 'admin') return user?.administrador === true;
                if (roleFilter === 'premium') return user?.assinouPlano === true;
                if (roleFilter === 'free') return user?.gratuito === true;
                return true;
            });
        }

        // Ordenar por tempo de sessão (mais longo primeiro)
        filtered.sort((a, b) => {
            const sessionA = a.sessionDuration || 0;
            const sessionB = b.sessionDuration || 0;
            return sessionB - sessionA;
        });

        return filtered;
    }, [onlineUsers, userDetails, searchQuery, statusFilter, roleFilter]);

    // ====================================================
    // UTILITÁRIOS DE FORMATAÇÃO
    // ====================================================

    const formatSessionTime = (sessionDuration) => {
        if (!sessionDuration) return '0min';

        if (sessionDuration < 1) return 'Agora';
        if (sessionDuration < 60) return `${sessionDuration}min`;

        const hours = Math.floor(sessionDuration / 60);
        const minutes = sessionDuration % 60;
        return `${hours}h ${minutes}min`;
    };

    const getSessionColor = (sessionDuration) => {
        if (!sessionDuration) return 'default';
        if (sessionDuration < 5) return 'success';
        if (sessionDuration < 30) return 'info';
        if (sessionDuration < 120) return 'warning';
        return 'error';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />;
            case 'idle': return <CircleIcon sx={{ fontSize: 12, color: '#FF9800' }} />;
            case 'away': return <CircleIcon sx={{ fontSize: 12, color: '#9E9E9E' }} />;
            default: return <CircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />;
        }
    };

    const getConnectionIcon = (quality) => {
        switch (quality) {
            case 'Excellent': return <ExcellentIcon sx={{ fontSize: 14, color: '#4CAF50' }} />;
            case 'Good': return <GoodIcon sx={{ fontSize: 14, color: '#8BC34A' }} />;
            case 'Fair': return <FairIcon sx={{ fontSize: 14, color: '#FF9800' }} />;
            case 'Poor': return <PoorIcon sx={{ fontSize: 14, color: '#F44336' }} />;
            default: return <UnknownIcon sx={{ fontSize: 14, color: '#9E9E9E' }} />;
        }
    };

    // ====================================================
    // COMPONENTES DE RENDERIZAÇÃO
    // ====================================================

    const renderStatsCards = () => {
        if (!presenceStats) {
            return (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Skeleton variant="circular" width={32} height={32} sx={{ mx: 'auto', mb: 1 }} />
                                <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
                                <Skeleton variant="text" width={100} height={20} sx={{ mx: 'auto' }} />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            );
        }

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CircleIcon sx={{ color: '#4CAF50', fontSize: 32, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                            {onlineUsers.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Online
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <TrendingUpIcon sx={{ color: '#2196F3', fontSize: 32, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                            {presenceStats.activeUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ativos
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <ScheduleIcon sx={{ color: '#FF9800', fontSize: 32, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                            {presenceStats.avgSessionTime}min
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Tempo Médio
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <SpeedIcon sx={{ color: '#9C27B0', fontSize: 32, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                            {presenceStats.idleUsers + presenceStats.awayUsers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Inativos
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        );
    };

    const renderFilters = () => (
        <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                {/* Busca */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar usuários..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#4285F4' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                {/* Filtro de Status */}
                <Grid item xs={12} md={3}>
                    <ToggleButtonGroup
                        value={statusFilter}
                        exclusive
                        onChange={(e, value) => value && setStatusFilter(value)}
                        size="small"
                        fullWidth
                    >
                        <ToggleButton value="all">Todos</ToggleButton>
                        <ToggleButton value="active">Ativos</ToggleButton>
                        <ToggleButton value="idle">Ausentes</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                {/* Filtro de Role */}
                <Grid item xs={12} md={3}>
                    <ToggleButtonGroup
                        value={roleFilter}
                        exclusive
                        onChange={(e, value) => value && setRoleFilter(value)}
                        size="small"
                        fullWidth
                    >
                        <ToggleButton value="all">Todos</ToggleButton>
                        <ToggleButton value="admin">Admin</ToggleButton>
                        <ToggleButton value="premium">Premium</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>
            </Grid>
        </Box>
    );

    const renderUsersList = () => {
        if (loading) {
            return (
                <Box sx={{ p: 3 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                        Carregando usuários online...
                    </Typography>
                </Box>
            );
        }

        if (filteredUsers.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <VisibilityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário online'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'Tente ajustar os filtros de busca' : 'Aguardando atividade de usuários...'}
                    </Typography>
                </Box>
            );
        }

        return (
            <List>
                {filteredUsers.map((presenceData) => {
                    const user = userDetails.get(presenceData.userId);
                    const sessionTime = formatSessionTime(presenceData.sessionDuration);
                    const sessionColor = getSessionColor(presenceData.sessionDuration);

                    return (
                        <Fade in key={presenceData.userId}>
                            <div>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            badgeContent={getStatusIcon(presenceData.status)}
                                        >
                                            <Avatar src={user?.photoURL} sx={{ width: 40, height: 40 }}>
                                                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="subtitle2">
                                                    {user?.fullName || 'Usuário Desconhecido'}
                                                </Typography>
                                                {user?.administrador && (
                                                    <Chip label="Admin" color="error" size="small" />
                                                )}
                                                {user?.assinouPlano && (
                                                    <Chip label="Premium" color="primary" size="small" />
                                                )}
                                                {user?.gratuito && (
                                                    <Chip label="Gratuito" color="default" size="small" />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    {user?.email || presenceData.userId}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <ComputerIcon sx={{ fontSize: 12 }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {presenceData.platform || 'Desconhecido'}
                                                    </Typography>
                                                    {presenceData.connectionQuality && (
                                                        <>
                                                            {getConnectionIcon(presenceData.connectionQuality)}
                                                            <Typography variant="caption" color="text.secondary">
                                                                {presenceData.connectionQuality}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ textAlign: 'right' }}>
                                        <Chip
                                            label={sessionTime}
                                            color={sessionColor}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            {presenceData.status === 'active' ? 'Ativo agora' :
                                                presenceData.status === 'idle' ? 'Ausente' :
                                                    presenceData.status === 'away' ? 'Afastado' : 'Online'}
                                        </Typography>
                                    </Box>
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </div>
                        </Fade>
                    );
                })}
            </List>
        );
    };

    // ====================================================
    // RENDER PRINCIPAL
    // ====================================================

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    <CircleIcon sx={{ color: '#4CAF50', mr: 1, verticalAlign: 'middle' }} />
                    Monitoramento em Tempo Real
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={autoRefresh ? "Pausar atualização automática" : "Ativar atualização automática"}>
                        <IconButton
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            color={autoRefresh ? "primary" : "default"}
                            size="small"
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Alertas de erro */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Cards de estatísticas */}
            {renderStatsCards()}

            {/* Filtros */}
            {renderFilters()}

            {/* Lista de usuários */}
            <Card>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2, pb: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Usuários Online ({filteredUsers.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {lastUpdate && `Última atualização: ${lastUpdate.toLocaleTimeString()}`}
                        </Typography>
                    </Box>

                    {renderUsersList()}
                </CardContent>
            </Card>
        </Box>
    );
};

export default EnhancedRealtimeMonitoring;