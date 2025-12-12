"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Badge,
    Chip,
    InputAdornment,
    Grid,
    LinearProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    CircularProgress,
    Card,
    CardContent,
    Stack,
    Tab,
    Tabs
} from "@mui/material";

import {
    Send as SendIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Message as MessageIcon,
    BugReport as BugReportIcon,
    Feedback as FeedbackIcon,
    Support as SupportIcon,
    Info as InfoIcon,
    Check as CheckIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    DoneAll as DoneAllIcon,
    Priority as PriorityIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Email as EmailIcon
} from '@mui/icons-material';

import firebaseService from "../../../../lib/firebaseService";
import { useAuth } from "../../authProvider";

const AdminMessagesComponent = ({ open, onClose }) => {
    // Estados principais
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    // Estados de mensagem
    const [newResponse, setNewResponse] = useState('');

    // Estados de filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    // Estados de UI
    const [lastUpdate, setLastUpdate] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const messagesEndRef = useRef(null);
    const { user: currentUser } = useAuth();

    // ====================================================
    // FUNÇÕES OTIMIZADAS
    // ====================================================

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    // Carregar reports com otimização
    const loadReports = useCallback(async () => {
        if (!currentUser?.administrador) {
            setError('Você não tem permissão para acessar as mensagens');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Criar filtros para a consulta
            const filters = {};

            if (statusFilter !== 'all') filters.status = statusFilter;
            if (typeFilter !== 'all') filters.type = typeFilter;
            if (priorityFilter !== 'all') filters.priority = priorityFilter;
            if (showUnreadOnly) filters.hasUnreadFromUser = true;

            // Buscar reports (muito mais rápido que a versão antiga)
            const allReports = await firebaseService.getAllReports(filters);

            setReports(allReports);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Erro ao carregar reports:", error);
            setError('Erro ao carregar mensagens: ' + error.message);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser, statusFilter, typeFilter, priorityFilter, showUnreadOnly]);

    // Carregar estatísticas
    const loadStats = useCallback(async () => {
        if (!currentUser?.administrador) return;

        try {
            const reportStats = await firebaseService.getReportsStats();
            setStats(reportStats);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }, [currentUser]);

    // Filtrar reports localmente por busca de texto
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports;

        const search = searchQuery.toLowerCase();
        return reports.filter(report =>
            report.userName?.toLowerCase().includes(search) ||
            report.userEmail?.toLowerCase().includes(search) ||
            report.subject?.toLowerCase().includes(search) ||
            report.content?.toLowerCase().includes(search)
        );
    }, [reports, searchQuery]);

    // Enviar resposta otimizada
    const handleSendResponse = useCallback(async () => {
        if (!newResponse.trim() || !selectedReport || sending) return;

        setSending(true);
        try {
            await firebaseService.addReportResponse(selectedReport.id, {
                content: newResponse.trim(),
                isAdmin: true,
                authorId: currentUser.uid,
                authorName: currentUser.fullName || 'Administrador'
            });

            setNewResponse('');

            // Recarregar o report selecionado
            const updatedReport = await firebaseService.getReport(selectedReport.id);
            if (updatedReport) {
                setSelectedReport(updatedReport);
            }

            // Recarregar lista de reports
            await loadReports();
            await loadStats();

        } catch (error) {
            console.error("Erro ao enviar resposta:", error);
            setError('Erro ao enviar resposta: ' + error.message);
        } finally {
            setSending(false);
        }
    }, [newResponse, selectedReport, currentUser, loadReports, loadStats, sending]);

    // Marcar como resolvida
    const handleMarkAsResolved = useCallback(async (reportId) => {
        if (!reportId) return;

        try {
            await firebaseService.updateReportStatus(
                reportId,
                'resolved',
                currentUser.fullName || 'Administrador'
            );

            // Atualizar localmente
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: 'resolved' }));
            }

            // Recarregar dados
            await loadReports();
            await loadStats();
        } catch (error) {
            console.error("Erro ao marcar como resolvida:", error);
            setError('Erro ao atualizar status da mensagem');
        }
    }, [selectedReport, currentUser, loadReports, loadStats]);

    // Marcar como lida pelo admin
    const handleMarkAsRead = useCallback(async (reportId) => {
        try {
            await firebaseService.markReportAsReadByAdmin(reportId);
            await loadReports();
            await loadStats();
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    }, [loadReports, loadStats]);

    // ====================================================
    // EFFECTS
    // ====================================================

    useEffect(() => {
        if (open && currentUser?.administrador) {
            loadReports();
            loadStats();
        }
    }, [open, currentUser, loadReports, loadStats]);

    useEffect(() => {
        if (selectedReport?.responses?.length) {
            scrollToBottom();
        }
    }, [selectedReport?.responses, scrollToBottom]);

    // Auto-refresh a cada 30 segundos
    useEffect(() => {
        if (!open) return;

        const interval = setInterval(() => {
            loadReports();
            loadStats();
        }, 30000);

        return () => clearInterval(interval);
    }, [open, loadReports, loadStats]);

    // ====================================================
    // FUNÇÕES DE UTILIDADE
    // ====================================================

    const getMessageIcon = useCallback((type) => {
        const icons = {
            bug: <BugReportIcon sx={{ color: '#f44336', fontSize: 20 }} />,
            feedback: <FeedbackIcon sx={{ color: '#2196f3', fontSize: 20 }} />,
            support: <SupportIcon sx={{ color: '#ff9800', fontSize: 20 }} />,
            system: <InfoIcon sx={{ color: '#4caf50', fontSize: 20 }} />
        };
        return icons[type] || <MessageIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />;
    }, []);

    const getPriorityColor = useCallback((priority) => {
        switch (priority) {
            case 'high': return '#f44336';
            case 'medium': return '#ff9800';
            case 'low': return '#4caf50';
            default: return '#9e9e9e';
        }
    }, []);

    const formatTime = useCallback((date) => {
        if (!date) return '';
        const messageDate = date.toDate ? date.toDate() : new Date(date);
        const diffMs = Date.now() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return messageDate.toLocaleDateString('pt-BR');
    }, []);

    // ====================================================
    // COMPONENTES DE RENDERIZAÇÃO
    // ====================================================

    const renderStatsCards = () => {
        if (!stats) return null;

        return (
            <Grid container spacing={2} sx={{ mb: 3, p: 2 }}>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                            {stats.total}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{
                        textAlign: 'center',
                        p: 1.5,
                        border: stats.unreadByAdmin > 0 ? '2px solid #f44336' : 'none'
                    }}>
                        <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>
                            {stats.unreadByAdmin}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Não Lidas
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                            {stats.inProgress}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Em Andamento
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            {stats.resolved}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Resolvidas
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderFilters = () => (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Buscar por usuário, email ou conteúdo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="new">Novas</MenuItem>
                            <MenuItem value="in_progress">Em andamento</MenuItem>
                            <MenuItem value="resolved">Resolvidas</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={typeFilter}
                            label="Tipo"
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="support">Suporte</MenuItem>
                            <MenuItem value="feedback">Feedback</MenuItem>
                            <MenuItem value="bug">Bug</MenuItem>
                            <MenuItem value="system">Sistema</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Prioridade</InputLabel>
                        <Select
                            value={priorityFilter}
                            label="Prioridade"
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todas</MenuItem>
                            <MenuItem value="high">Alta</MenuItem>
                            <MenuItem value="medium">Média</MenuItem>
                            <MenuItem value="low">Baixa</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Button
                        fullWidth
                        variant={showUnreadOnly ? "contained" : "outlined"}
                        onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        size="small"
                        sx={{ height: '40px' }}
                    >
                        Só não lidas
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );

    const renderReportsList = () => (
        <Box sx={{ width: '400px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderFilters()}
            {renderStatsCards()}

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ p: 3 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Carregando mensagens...
                        </Typography>
                    </Box>
                ) : filteredReports.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <MessageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            {reports.length === 0 ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem corresponde aos filtros'}
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {filteredReports.map((report) => (
                            <ListItem
                                key={report.id}
                                button
                                onClick={() => {
                                    setSelectedReport(report);
                                    if (report.hasUnreadFromUser) {
                                        handleMarkAsRead(report.id);
                                    }
                                }}
                                selected={selectedReport?.id === report.id}
                                sx={{
                                    py: 2,
                                    px: 2,
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                    backgroundColor: report.hasUnreadFromUser
                                        ? 'rgba(244, 67, 54, 0.04)'
                                        : 'transparent',
                                    borderLeft: report.priority === 'high'
                                        ? '4px solid #f44336'
                                        : report.hasUnreadFromUser
                                            ? '4px solid #ff9800'
                                            : 'none',
                                }}
                            >
                                <ListItemAvatar>
                                    <Badge
                                        badgeContent={report.hasUnreadFromUser ? '!' : 0}
                                        color="error"
                                        invisible={!report.hasUnreadFromUser}
                                    >
                                        <Avatar sx={{
                                            border: `2px solid ${getPriorityColor(report.priority)}`
                                        }}>
                                            {report.userName?.charAt(0) || 'U'}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="subtitle2" sx={{
                                                fontWeight: report.hasUnreadFromUser ? 600 : 500,
                                                fontSize: '14px'
                                            }}>
                                                {report.userName}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTime(report.updatedAt)}
                                                </Typography>
                                                {report.priority === 'high' && (
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#f44336'
                                                    }} />
                                                )}
                                            </Box>
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" sx={{
                                                fontWeight: report.hasUnreadFromUser ? 500 : 400,
                                                mb: 0.5,
                                                fontSize: '13px',
                                                color: 'text.secondary',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {report.subject}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                {getMessageIcon(report.type)}
                                                <Chip
                                                    label={report.status}
                                                    size="small"
                                                    color={
                                                        report.status === 'resolved' ? 'success' :
                                                            report.status === 'in_progress' ? 'warning' : 'error'
                                                    }
                                                    sx={{ fontSize: '10px', height: '20px' }}
                                                />
                                                {report.responses?.length > 0 && (
                                                    <Typography variant="caption" color="primary">
                                                        {report.responses.length} resp.
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );

    const renderChatArea = () => {
        if (!selectedReport) {
            return (
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    textAlign: 'center'
                }}>
                    <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Selecione uma mensagem
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Escolha uma mensagem da lista para visualizar e responder
                    </Typography>
                    {stats?.unreadByAdmin > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Você tem {stats.unreadByAdmin} mensagem(ns) não lida(s)
                        </Alert>
                    )}
                </Box>
            );
        }

        return (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header do Chat */}
                <Box sx={{
                    p: 3,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#f8f9fa'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                            {selectedReport.userName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {selectedReport.userName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <EmailIcon sx={{ fontSize: 14 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {selectedReport.userEmail}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={selectedReport.type}
                                color={selectedReport.type === 'bug' ? 'error' : 'primary'}
                                size="small"
                                icon={getMessageIcon(selectedReport.type)}
                            />
                            <Chip
                                label={selectedReport.priority}
                                size="small"
                                sx={{
                                    backgroundColor: getPriorityColor(selectedReport.priority),
                                    color: 'white'
                                }}
                            />
                            <Chip
                                label={selectedReport.status}
                                color={
                                    selectedReport.status === 'resolved' ? 'success' :
                                        selectedReport.status === 'in_progress' ? 'warning' : 'error'
                                }
                                size="small"
                            />
                            {selectedReport.status !== 'resolved' && (
                                <Tooltip title="Marcar como resolvida">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleMarkAsResolved(selectedReport.id)}
                                        sx={{ color: '#4caf50' }}
                                    >
                                        <CheckIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Mensagens */}
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 3,
                    backgroundColor: '#fafafa'
                }}>
                    {/* Mensagem Original */}
                    <Paper sx={{
                        p: 3,
                        mb: 3,
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        borderRadius: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar>
                                {selectedReport.userName?.charAt(0) || 'U'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {selectedReport.subject}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedReport.userName}
                                    </Typography>
                                    <ScheduleIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(selectedReport.createdAt.toDate?.() || selectedReport.createdAt).toLocaleString('pt-BR')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {selectedReport.content}
                        </Typography>
                    </Paper>

                    {/* Respostas */}
                    {selectedReport.responses && selectedReport.responses.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Conversa ({selectedReport.responses.length} resposta{selectedReport.responses.length !== 1 ? 's' : ''})
                            </Typography>
                            {selectedReport.responses.map((response, index) => (
                                <Paper key={index} sx={{
                                    p: 2,
                                    mb: 2,
                                    backgroundColor: response.isAdmin ? '#e3f2fd' : '#f5f5f5',
                                    borderLeft: `4px solid ${response.isAdmin ? '#1976d2' : '#666'}`,
                                    borderRadius: 1
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{
                                            width: 28,
                                            height: 28,
                                            backgroundColor: response.isAdmin ? '#1976d2' : '#666',
                                            fontSize: '12px'
                                        }}>
                                            {response.isAdmin ? 'A' : response.authorName?.charAt(0) || 'U'}
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {response.isAdmin ? 'Administrador' : response.authorName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(response.createdAt.toDate?.() || response.createdAt).toLocaleString('pt-BR')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                        {response.content}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Campo de Resposta */}
                <Box sx={{
                    p: 3,
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#fff'
                }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={4}
                            placeholder="Digite sua resposta..."
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendResponse();
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px'
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSendResponse}
                            disabled={!newResponse.trim() || sending}
                            sx={{
                                minWidth: '80px',
                                height: 'fit-content',
                                backgroundColor: '#1852FE',
                                borderRadius: '12px',
                                py: 2,
                                '&:hover': { backgroundColor: '#0039CB' },
                                '&:disabled': { backgroundColor: '#ccc' }
                            }}
                        >
                            {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    };

    // ====================================================
    // RENDERIZAÇÃO PRINCIPAL
    // ====================================================

    if (!currentUser?.administrador) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="error">
                            Acesso negado
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Esta área é restrita para administradores.
                        </Typography>
                        <Button variant="contained" onClick={onClose} sx={{ mt: 2 }}>
                            Fechar
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    height: '90vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                py: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MessageIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Central de Mensagens
                    </Typography>
                    {stats?.unreadByAdmin > 0 && (
                        <Chip
                            label={`${stats.unreadByAdmin} novas`}
                            color="error"
                            size="small"
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                        onClick={() => {
                            loadReports();
                            loadStats();
                        }}
                        disabled={loading}
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, height: '100%', display: 'flex' }}>
                {error ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '400px',
                        p: 4,
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                                setError('');
                                loadReports();
                                loadStats();
                            }}
                        >
                            Tentar Novamente
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* Lista de Reports */}
                        <Box sx={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                            {renderReportsList()}
                        </Box>

                        {/* Área de Chat */}
                        {renderChatArea()}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AdminMessagesComponent;