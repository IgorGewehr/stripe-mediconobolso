"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Tab,
    Tabs,
    CircularProgress,
    Tooltip,
    Backdrop
} from "@mui/material";
import {
    Send as SendIcon,
    Message as MessageIcon,
    BugReport as BugIcon,
    Feedback as FeedbackIcon,
    Support as SupportIcon,
    Close as CloseIcon,
    Info as InfoIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useResponsiveScale } from "../hooks/useScale";
import { useAuth } from "../providers/authProvider";
import { adminService } from '@/lib/services/firebase';
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const CentralAjudaTemplate = ({ selectedReportId = null }) => {
    // Estados básicos
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false); // ✨ NOVO: Loading específico para carregar report
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    // Estados do formulário
    const [newReport, setNewReport] = useState({
        subject: "",
        content: "",
        type: "support",
        priority: "medium"
    });

    // Estados dos reports
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newResponse, setNewResponse] = useState("");

    const { scaleStyle } = useResponsiveScale();
    const { user } = useAuth();

    // ✨ FUNÇÃO CORRIGIDA PARA CARREGAR REPORTS
    const loadReports = async () => {
        if (!user?.uid) {
            console.warn('Usuário não logado');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔄 Carregando reports para usuário:', user.uid);

            // Primeira tentativa - método padrão
            let userReports = await adminService.getUserReports(user.uid);
            console.log(`📊 Reports encontrados: ${userReports.length}`);

            // Se não encontrou nada, tentar busca manual como fallback
            if (userReports.length === 0) {
                console.log('🔍 Tentando busca manual como fallback...');
                userReports = await adminService.debugUserReports(user.uid);

                // Se ainda assim não encontrou, verificar se há reports para corrigir
                if (userReports.length === 0) {
                    const fixResult = await adminService.fixUserReports?.(user.uid);
                    if (fixResult?.fixedCount > 0) {
                        // Se corrigiu algum, tentar buscar novamente
                        userReports = await adminService.getUserReports(user.uid);
                    }
                }
            }

            setReports(userReports);
            console.log(`✅ ${userReports.length} reports carregados com sucesso`);

        } catch (error) {
            console.error("❌ Erro ao carregar reports:", error);
            setError('Erro ao carregar suas mensagens. Tente atualizar a página.');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    // ✨ FUNÇÃO CORRIGIDA PARA SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.uid || !newReport.subject.trim() || !newReport.content.trim()) return;

        setLoading(true);
        setError('');

        try {
            console.log('📤 Enviando novo report...');

            // Criar o report
            const reportId = await adminService.createReport(user.uid, {
                subject: newReport.subject.trim(),
                content: newReport.content.trim(),
                type: newReport.type,
                priority: newReport.priority
            });

            console.log('✅ Report criado com ID:', reportId);

            // Limpar formulário
            setNewReport({ subject: "", content: "", type: "support", priority: "medium" });
            setShowSuccess(true);

            // Aguardar um pouco e recarregar para garantir que aparece
            setTimeout(async () => {
                await loadReports();
            }, 1500);

        } catch (error) {
            console.error("❌ Erro ao enviar report:", error);
            setError('Erro ao enviar mensagem: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ✨ FUNÇÃO CORRIGIDA PARA ABRIR REPORT
    const handleReportClick = async (report) => {
        console.log('🔔 Abrindo report:', report.id);
        setLoadingReport(true);

        try {
            // 🔧 CORREÇÃO: Buscar o report completo com todas as respostas
            console.log('📥 Buscando dados completos do report...');
            const fullReport = await adminService.getReport(report.id);

            if (!fullReport) {
                setError('Report não encontrado');
                return;
            }

            console.log('✅ Report completo carregado:', fullReport);

            // Definir o report selecionado com dados completos
            setSelectedReport(fullReport);
            setOpenDialog(true);

            // Marcar como lida se tinha respostas não lidas
            if (fullReport.hasUnreadResponses) {
                try {
                    await adminService.markReportAsReadByUser(report.id);
                    await loadReports(); // Recarregar para atualizar o estado da lista
                } catch (error) {
                    console.error("❌ Erro ao marcar como lido:", error);
                }
            }
        } catch (error) {
            console.error("❌ Erro ao carregar report completo:", error);
            setError('Erro ao carregar conversa: ' + error.message);
        } finally {
            setLoadingReport(false);
        }
    };

    // ✨ FUNÇÃO CORRIGIDA PARA ENVIAR RESPOSTA
    const handleSendResponse = async () => {
        if (!newResponse.trim() || !selectedReport) return;

        try {
            console.log('📤 Enviando resposta do usuário...');

            await adminService.addReportResponse(selectedReport.id, {
                content: newResponse.trim(),
                isAdmin: false,
                authorId: user.uid,
                authorName: user.fullName || user.email
            });

            setNewResponse("");

            // 🔧 CORREÇÃO: Recarregar o report selecionado com dados completos
            const updatedReport = await adminService.getReport(selectedReport.id);
            if (updatedReport) {
                setSelectedReport(updatedReport);
                console.log('✅ Report atualizado após envio de resposta');
            }

            // Recarregar lista de reports
            await loadReports();
        } catch (error) {
            console.error("❌ Erro ao enviar resposta:", error);
            setError('Erro ao enviar resposta: ' + error.message);
        }
    };

    // ✨ EFEITO MELHORADO PARA CARREGAR DADOS
    useEffect(() => {
        if (user?.uid) {
            console.log('🚀 Usuário logado, carregando reports...');
            loadReports();
        }
    }, [user?.uid]);

    // ✨ EFEITO PARA SELECTEDREPORTID
    useEffect(() => {
        if (selectedReportId && reports.length > 0) {
            console.log('🎯 Procurando report específico:', selectedReportId);
            const report = reports.find(r => r.id === selectedReportId);
            if (report) {
                console.log('✅ Report encontrado, abrindo dialog...');
                handleReportClick(report);
                setActiveTab(1);
            }
        }
    }, [selectedReportId, reports]);

    // Funções auxiliares
    const getMessageIcon = (type) => {
        switch (type) {
            case 'bug':
                return <BugIcon sx={{ color: '#f44336' }} />;
            case 'feedback':
                return <FeedbackIcon sx={{ color: '#2196f3' }} />;
            case 'support':
                return <SupportIcon sx={{ color: '#ff9800' }} />;
            case 'system':
                return <InfoIcon sx={{ color: '#4caf50' }} />;
            // ✨ NOVO: Adicionar tipo admin_chat
            case 'admin_chat':
                return <AdminPanelSettingsIcon sx={{ color: '#9c27b0' }} />; // Ícone roxo para admin
            default:
                return <MessageIcon sx={{ color: '#9e9e9e' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new':
                return 'info';
            case 'in_progress':
                return 'warning';
            case 'resolved':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new':
                return 'Nova';
            case 'in_progress':
                return 'Em andamento';
            case 'resolved':
                return 'Resolvida';
            default:
                return 'Pendente';
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high':
                return 'Alta';
            case 'medium':
                return 'Média';
            case 'low':
                return 'Baixa';
            default:
                return 'Média';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const messageDate = date.toDate ? date.toDate() : new Date(date);
        return messageDate.toLocaleString('pt-BR');
    };

    // ✨ RENDER DO FORMULÁRIO
    const renderNewReportForm = () => (
        <Paper elevation={0} sx={{
            p: 4,
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
            <Typography variant="h6" sx={{
                color: "#1852FE",
                mb: 3,
                fontFamily: "Gellix, sans-serif",
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <AddIcon /> Nova Mensagem
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo da mensagem</InputLabel>
                            <Select
                                value={newReport.type}
                                label="Tipo da mensagem"
                                onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                                sx={{
                                    borderRadius: '8px',
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1852FE',
                                    },
                                }}
                            >
                                <MenuItem value="support">Suporte</MenuItem>
                                <MenuItem value="feedback">Feedback</MenuItem>
                                <MenuItem value="bug">Reportar Bug</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Prioridade</InputLabel>
                            <Select
                                value={newReport.priority}
                                label="Prioridade"
                                onChange={(e) => setNewReport(prev => ({ ...prev, priority: e.target.value }))}
                                sx={{
                                    borderRadius: '8px',
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1852FE',
                                    },
                                }}
                            >
                                <MenuItem value="low">Baixa</MenuItem>
                                <MenuItem value="medium">Média</MenuItem>
                                <MenuItem value="high">Alta</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <TextField
                    fullWidth
                    label="Assunto"
                    value={newReport.subject}
                    onChange={(e) => setNewReport(prev => ({ ...prev, subject: e.target.value }))}
                    margin="normal"
                    required
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&.Mui-focused fieldset': {
                                borderColor: '#1852FE',
                            },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1852FE',
                        },
                    }}
                />

                <TextField
                    fullWidth
                    label="Descreva sua mensagem"
                    multiline
                    rows={4}
                    value={newReport.content}
                    onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                    margin="normal"
                    required
                    sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&.Mui-focused fieldset': {
                                borderColor: '#1852FE',
                            },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1852FE',
                        },
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                    sx={{
                        bgcolor: "#1852FE",
                        color: "white",
                        fontFamily: "Gellix, sans-serif",
                        textTransform: "none",
                        fontWeight: 500,
                        px: 4,
                        py: 1.2,
                        borderRadius: "8px",
                        '&:hover': {
                            bgcolor: "#0039CB",
                        },
                    }}
                >
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
            </Box>
        </Paper>
    );

    // ✨ RENDER DO HISTÓRICO LIMPO
    const renderReportsHistory = () => (
        <Paper elevation={0} sx={{
            p: 4,
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{
                    color: "#1852FE",
                    fontFamily: "Gellix, sans-serif",
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <MessageIcon /> Suas Mensagens
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => loadReports()}
                    disabled={loading}
                    sx={{
                        borderColor: '#1852FE',
                        color: '#1852FE',
                        textTransform: 'none'
                    }}
                >
                    Atualizar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress sx={{ mr: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        Carregando suas mensagens...
                    </Typography>
                </Box>
            ) : reports.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <MessageIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                        Você ainda não enviou nenhuma mensagem
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Use a aba "Nova Mensagem" para enviar sua primeira mensagem
                    </Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {reports.map((report) => (
                        <React.Fragment key={report.id}>
                            <ListItem
                                button
                                onClick={() => handleReportClick(report)}
                                sx={{
                                    borderRadius: '8px',
                                    mb: 1,
                                    border: '1px solid rgba(0, 0, 0, 0.08)',
                                    backgroundColor: report.hasUnreadResponses
                                        ? 'rgba(24, 82, 254, 0.04)'
                                        : 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(24, 82, 254, 0.08)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    {getMessageIcon(report.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: report.hasUnreadResponses ? 600 : 500,
                                                    flex: 1
                                                }}
                                            >
                                                {report.subject}
                                            </Typography>
                                            {report.hasUnreadResponses && (
                                                <Chip
                                                    label="Nova resposta"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontSize: '11px' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {report.content}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={getStatusLabel(report.status)}
                                                    size="small"
                                                    color={getStatusColor(report.status)}
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={getPriorityLabel(report.priority)}
                                                    size="small"
                                                    color={getPriorityColor(report.priority)}
                                                    variant="outlined"
                                                />

                                                {report.type === 'admin_chat' && (
                                                    <Chip
                                                        label="Admin"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#9c27b0',
                                                            color: 'white',
                                                            fontSize: '10px'
                                                        }}
                                                    />
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(report.updatedAt)}
                                                </Typography>
                                                {report.responses && report.responses.length > 0 && (
                                                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                                                        {report.responses.length} resposta{report.responses.length !== 1 ? 's' : ''}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Paper>
    );

    // ✨ DIALOG DA CONVERSA
    const renderReportDialog = () => {
        if (!selectedReport) return null;

        return (
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, minHeight: '600px' }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    // ✨ NOVO: Cor especial para admin_chat
                    backgroundColor: selectedReport.type === 'admin_chat' ? 'rgba(156, 39, 176, 0.04)' : 'transparent'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getMessageIcon(selectedReport.type)}
                        <Box>
                            <Typography variant="h6">
                                {/* ✨ NOVO: Título especial para admin_chat */}
                                {selectedReport.type === 'admin_chat' && selectedReport.isAdminInitiated
                                    ? `Conversa com Administrador`
                                    : selectedReport.subject
                                }
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={getStatusLabel(selectedReport.status)}
                                    size="small"
                                    color={getStatusColor(selectedReport.status)}
                                />
                                <Chip
                                    label={getPriorityLabel(selectedReport.priority)}
                                    size="small"
                                    color={getPriorityColor(selectedReport.priority)}
                                />
                                {/* ✨ NOVO: Chip especial para admin_chat */}
                                {selectedReport.type === 'admin_chat' && (
                                    <Chip
                                        label="Conversa com Admin"
                                        size="small"
                                        sx={{
                                            backgroundColor: '#9c27b0',
                                            color: 'white',
                                            fontWeight: 500
                                        }}
                                    />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(selectedReport.createdAt)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setOpenDialog(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '500px' }}>
                    {/* Área de conversação */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {/* ✨ NOVO: Mensagem especial para admin_chat */}
                        {selectedReport.type === 'admin_chat' && selectedReport.isAdminInitiated ? (
                            <Box sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                border: '1px solid rgba(156, 39, 176, 0.2)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Avatar sx={{ width: 32, height: 32, backgroundColor: '#9c27b0' }}>
                                        <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {selectedReport.adminInitiatorName || 'Administrador'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(selectedReport.createdAt)}
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {selectedReport.content}
                                </Typography>
                            </Box>
                        ) : (
                            // Mensagem original normal
                            <Box sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: '#f5f5f5'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Avatar sx={{ width: 32, height: 32 }}>
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        Você
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(selectedReport.createdAt)}
                                    </Typography>
                                </Box>
                                <Typography variant="body1">
                                    {selectedReport.content}
                                </Typography>
                            </Box>
                        )}

                        {/* Renderização das respostas (sem alteração) */}
                        {selectedReport.responses && selectedReport.responses.length > 0 ? (
                            selectedReport.responses.map((response) => (
                                <Box
                                    key={response.id}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: '12px',
                                        backgroundColor: response.isAdmin
                                            ? 'rgba(24, 82, 254, 0.1)'
                                            : '#f5f5f5',
                                        ml: response.isAdmin ? 0 : 4,
                                        mr: response.isAdmin ? 4 : 0
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: response.isAdmin ? '#1852FE' : '#666'
                                        }}>
                                            {response.isAdmin ? 'A' : response.authorName?.charAt(0) || 'U'}
                                        </Avatar>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {response.isAdmin ? 'Administrador' : response.authorName || 'Você'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(response.createdAt)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {response.content}
                                    </Typography>
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedReport.type === 'admin_chat'
                                        ? 'Responda a mensagem do administrador.'
                                        : 'Ainda não há respostas para esta mensagem.'
                                    }
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Campo de resposta - mesmo código, mas com placeholder especial para admin_chat */}
                    {selectedReport.status !== 'resolved' && (
                        <Box sx={{
                            p: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                            backgroundColor: '#fafafa'
                        }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder={
                                        selectedReport.type === 'admin_chat'
                                            ? "Responder ao administrador..."
                                            : "Digite sua resposta..."
                                    }
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            backgroundColor: 'white'
                                        }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSendResponse}
                                    disabled={!newResponse.trim()}
                                    sx={{
                                        bgcolor: '#1852FE',
                                        minWidth: '60px',
                                        height: '56px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <SendIcon />
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Mensagem de resolvida (sem alteração) */}
                    {selectedReport.status === 'resolved' && (
                        <Box sx={{
                            p: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                            backgroundColor: '#f0f7ff',
                            textAlign: 'center'
                        }}>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                ✅ Esta mensagem foi resolvida
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Se você tiver outras dúvidas, crie uma nova mensagem
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <Box sx={{ maxWidth: "1000px", mx: "auto", p: 3, ...scaleStyle }}>
            {/* Loading backdrop para carregamento de report */}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loadingReport}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="inherit" />
                    <Typography variant="body2">
                        Carregando conversa...
                    </Typography>
                </Box>
            </Backdrop>

            <Typography
                variant="h4"
                component="h1"
                sx={{
                    color: "#1852FE",
                    mb: 2,
                    fontWeight: 600,
                    fontFamily: "Gellix, sans-serif",
                    fontSize: { xs: '24px', md: '28px' }
                }}
            >
                Central de Ajuda
            </Typography>

            <Typography
                variant="subtitle1"
                sx={{
                    color: "#111E5A",
                    mb: 4,
                    fontFamily: "Gellix, sans-serif"
                }}
            >
                Como podemos ajudar você hoje?
            </Typography>

            {/* Card de contato direto */}
            <Card sx={{ mb: 4, borderRadius: "12px", boxShadow: 'none', border: '1px solid rgba(66, 133, 244, 0.2)' }}>
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "#1852FE",
                            mb: 2,
                            fontFamily: "Gellix, sans-serif",
                            fontWeight: 500
                        }}
                    >
                        Contato Direto
                    </Typography>
                    <Typography
                        sx={{
                            color: "#111E5A",
                            mb: 1,
                            fontFamily: "Gellix, sans-serif"
                        }}
                    >
                        Para entrar em contato diretamente com nossa equipe:
                    </Typography>
                    <Typography
                        sx={{
                            color: "#1852FE",
                            fontWeight: 600,
                            mb: 0,
                            fontFamily: "Gellix, sans-serif",
                            fontSize: '16px',
                            letterSpacing: '0.2px'
                        }}
                    >
                        mediconobolso@gmail.com
                    </Typography>
                </CardContent>
            </Card>

            <Divider sx={{ my: 4, opacity: 0.6 }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500
                        },
                        '& .Mui-selected': {
                            color: '#1852FE !important'
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1852FE'
                        }
                    }}
                >
                    <Tab label="Nova Mensagem" />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Suas Mensagens
                                {reports.filter(r => r.hasUnreadResponses).length > 0 && (
                                    <Chip
                                        label={reports.filter(r => r.hasUnreadResponses).length}
                                        size="small"
                                        color="primary"
                                        sx={{ fontSize: '11px', minWidth: '20px' }}
                                    />
                                )}
                            </Box>
                        }
                    />
                </Tabs>
            </Box>

            {/* Conteúdo das tabs */}
            {activeTab === 0 && renderNewReportForm()}
            {activeTab === 1 && renderReportsHistory()}

            {/* Dialog de conversa */}
            {renderReportDialog()}

            {/* Snackbar de sucesso */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity="success"
                    sx={{
                        width: '100%',
                        borderRadius: '8px',
                        '& .MuiAlert-icon': {
                            color: '#1852FE'
                        }
                    }}
                >
                    Mensagem enviada com sucesso! Entraremos em contato em breve.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CentralAjudaTemplate;