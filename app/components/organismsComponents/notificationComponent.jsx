"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    IconButton,
    Badge,
    Popover,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Button,
    Avatar,
    Chip,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {
    Notifications as NotificationsIcon,
    Message as MessageIcon,
    BugReport as BugIcon,
    Feedback as FeedbackIcon,
    Info as InfoIcon,
    Support as SupportIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    MarkEmailRead as MarkReadIcon
} from "@mui/icons-material";
import firebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";

const NotificationComponent = ({ onMessageClick }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [reports, setReports] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const open = Boolean(anchorEl);

    // ✨ FUNÇÃO ATUALIZADA PARA CARREGAR REPORTS NÃO LIDOS
    const loadUnreadReports = async () => {
        if (!user?.uid) return;

        try {
            console.log('🔔 Carregando reports para notificações...');

            // ✨ USAR A NOVA FUNÇÃO DE REPORTS
            const userReports = await firebaseService.getUserReports(user.uid);
            const unreadReports = userReports.filter(report => report.hasUnreadResponses === true);
            const recentReports = userReports.slice(0, 5); // Mostrar apenas os 5 mais recentes

            console.log(`📊 Reports encontrados: ${userReports.length}, não lidos: ${unreadReports.length}`);

            setReports(recentReports);
            setUnreadCount(unreadReports.length);
        } catch (error) {
            console.error("❌ Erro ao carregar reports:", error);
        }
    };

    // Atualizar reports periodicamente
    useEffect(() => {
        if (user?.uid) {
            loadUnreadReports();

            // Atualizar a cada 30 segundos
            const interval = setInterval(loadUnreadReports, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.uid]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        loadUnreadReports(); // Atualizar ao abrir
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // ✨ FUNÇÃO ATUALIZADA PARA MARCAR COMO LIDO
    const handleMarkAllAsRead = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const unreadReportIds = reports
                .filter(report => report.hasUnreadResponses === true)
                .map(report => report.id);

            console.log(`🔄 Marcando ${unreadReportIds.length} reports como lidos...`);

            // ✨ MARCAR CADA REPORT COMO LIDO INDIVIDUALMENTE
            for (const reportId of unreadReportIds) {
                await firebaseService.markReportAsReadByUser(reportId);
            }

            if (unreadReportIds.length > 0) {
                await loadUnreadReports();
            }
        } catch (error) {
            console.error("❌ Erro ao marcar reports como lidos:", error);
        }
        setLoading(false);
    };

    const handleReportClick = async (report) => {
        console.log('🔔 Clicando em report:', report.id);

        // Marcar como lido se não estava lido
        if (report.hasUnreadResponses) {
            try {
                await firebaseService.markReportAsReadByUser(report.id);
                await loadUnreadReports(); // Atualizar contador
            } catch (error) {
                console.error("❌ Erro ao marcar report como lido:", error);
            }
        }

        handleClose();
        if (onMessageClick) {
            // ✨ REDIRECIONAMENTO CORRETO PARA CENTRAL DE AJUDA
            onMessageClick({
                action: 'openCentralAjuda', // Ação específica para abrir a Central de Ajuda
                selectedReportId: report.id,
                report: report,
                tab: 'messages' // Especifica que deve ir para a aba de mensagens
            });
        }
    };

    // ✨ FUNÇÃO ATUALIZADA PARA INCLUIR admin_chat
    const getMessageIcon = (type) => {
        switch (type) {
            case 'bug':
                return <BugIcon sx={{ fontSize: 20, color: '#f44336' }} />;
            case 'feedback':
                return <FeedbackIcon sx={{ fontSize: 20, color: '#2196f3' }} />;
            case 'support':
                return <SupportIcon sx={{ fontSize: 20, color: '#ff9800' }} />;
            case 'system':
                return <InfoIcon sx={{ fontSize: 20, color: '#4caf50' }} />;
            case 'admin_chat':
                return <AdminPanelSettingsIcon sx={{ fontSize: 20, color: '#9c27b0' }} />;
            default:
                return <MessageIcon sx={{ fontSize: 20, color: '#9e9e9e' }} />;
        }
    };

    // ✨ FUNÇÃO ATUALIZADA PARA INCLUIR admin_chat
    const getMessageTypeLabel = (type) => {
        switch (type) {
            case 'bug':
                return 'Bug Report';
            case 'feedback':
                return 'Feedback';
            case 'support':
                return 'Suporte';
            case 'system':
                return 'Sistema';
            case 'admin_chat':
                return 'Chat Admin';
            default:
                return 'Mensagem';
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'new':
                return '#2196f3';
            case 'in_progress':
                return '#ff9800';
            case 'resolved':
                return '#4caf50';
            default:
                return '#9e9e9e';
        }
    };

    const formatMessageDate = (date) => {
        if (!date) return '';

        const messageDate = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffMs = now - messageDate;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return messageDate.toLocaleDateString('pt-BR');
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(24, 82, 254, 0.1)',
                    border: '1px solid rgba(24, 82, 254, 0.2)',
                    '&:hover': {
                        backgroundColor: 'rgba(24, 82, 254, 0.15)',
                    }
                }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: isMobile ? '0.65rem' : '0.75rem',
                            minWidth: isMobile ? '16px' : '18px',
                            height: isMobile ? '16px' : '18px'
                        }
                    }}
                >
                    <NotificationsIcon
                        sx={{
                            fontSize: isMobile ? 20 : 22,
                            color: '#1852FE'
                        }}
                    />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: isMobile ? 'left' : 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: isMobile ? 'left' : 'right',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? '8px' : '12px',
                        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        maxWidth: isMobile ? '320px' : isTablet ? '350px' : '380px',
                        width: isMobile ? 'calc(100vw - 32px)' : '100%',
                        maxHeight: isMobile ? '400px' : '500px',
                        ...(isMobile && {
                            position: 'fixed',
                            top: '16px',
                            right: '16px',
                            left: '16px',
                            zIndex: 9999
                        })
                    }
                }}
            >
                <Paper sx={{ p: 0 }}>
                    {/* Header */}
                    <Box sx={{
                        p: isMobile ? 1.5 : 2,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: '#111E5A',
                                fontSize: isMobile ? '14px' : '16px'
                            }}>
                                Notificações
                            </Typography>
                            {unreadCount > 0 && (
                                <Button
                                    variant="text"
                                    size="small"
                                    startIcon={<MarkReadIcon />}
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                    sx={{
                                        fontSize: isMobile ? '10px' : '12px',
                                        color: '#1852FE',
                                        textTransform: 'none',
                                        minWidth: 'auto',
                                        px: isMobile ? 1 : 2
                                    }}
                                >
                                    Marcar como lidas
                                </Button>
                            )}
                        </Box>

                        {/* ✨ ESTATÍSTICAS DETALHADAS */}
                        {unreadCount > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {(() => {
                                        const adminChats = reports.filter(r => r.type === 'admin_chat' && r.hasUnreadResponses).length;
                                        const regularReports = unreadCount - adminChats;

                                        if (adminChats > 0 && regularReports > 0) {
                                            return `${adminChats} chat${adminChats !== 1 ? 's' : ''} admin • ${regularReports} report${regularReports !== 1 ? 's' : ''}`;
                                        } else if (adminChats > 0) {
                                            return `${adminChats} chat${adminChats !== 1 ? 's' : ''} com administrador`;
                                        } else {
                                            return `${unreadCount} mensagem${unreadCount !== 1 ? 's' : ''} não lida${unreadCount !== 1 ? 's' : ''}`;
                                        }
                                    })()}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Lista de reports */}
                    <List sx={{ p: 0, maxHeight: isMobile ? '300px' : '400px', overflow: 'auto' }}>
                        {reports.length === 0 ? (
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ textAlign: 'center', py: 2 }}
                                        >
                                            Nenhuma mensagem encontrada
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ) : (
                            reports.map((report, index) => (
                                <React.Fragment key={report.id}>
                                    <ListItem
                                        button
                                        onClick={() => handleReportClick(report)}
                                        sx={{
                                            py: isMobile ? 1 : 1.5,
                                            px: isMobile ? 1.5 : 2,
                                            backgroundColor: report.hasUnreadResponses
                                                ? 'rgba(24, 82, 254, 0.04)'
                                                : 'transparent',
                                            // ✨ BORDA ESPECIAL PARA admin_chat
                                            borderLeft: report.type === 'admin_chat'
                                                ? '3px solid #9c27b0'
                                                : report.hasUnreadResponses
                                                    ? '3px solid #1852FE'
                                                    : '3px solid transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(24, 82, 254, 0.08)'
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: isMobile ? 28 : 36 }}>
                                            {getMessageIcon(report.type)}
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: report.hasUnreadResponses ? 600 : 500,
                                                            color: '#111E5A',
                                                            flex: 1,
                                                            fontSize: isMobile ? '13px' : '14px'
                                                        }}
                                                        noWrap
                                                    >
                                                        {/* ✨ TÍTULO ESPECIAL PARA admin_chat */}
                                                        {report.type === 'admin_chat' && report.isAdminInitiated
                                                            ? '💬 Conversa com Admin'
                                                            : (report.subject || getMessageTypeLabel(report.type))
                                                        }
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ fontSize: isMobile ? '10px' : '11px' }}
                                                    >
                                                        {formatMessageDate(report.updatedAt)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            lineHeight: 1.3,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        {report.content}
                                                    </Typography>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                        <Chip
                                                            label={getMessageTypeLabel(report.type)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontSize: isMobile ? '9px' : '10px',
                                                                height: isMobile ? '18px' : '20px',
                                                                borderColor: 'rgba(0, 0, 0, 0.12)',
                                                                // ✨ COR ESPECIAL PARA admin_chat
                                                                ...(report.type === 'admin_chat' && {
                                                                    borderColor: '#9c27b0',
                                                                    color: '#9c27b0'
                                                                })
                                                            }}
                                                        />

                                                        <Chip
                                                            label={getStatusLabel(report.status)}
                                                            size="small"
                                                            sx={{
                                                                fontSize: isMobile ? '9px' : '10px',
                                                                height: isMobile ? '18px' : '20px',
                                                                backgroundColor: getStatusColor(report.status),
                                                                color: 'white',
                                                                fontWeight: 500
                                                            }}
                                                        />

                                                        {report.responses && report.responses.length > 0 && (
                                                            <Typography
                                                                variant="caption"
                                                                color="primary"
                                                                sx={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 500 }}
                                                            >
                                                                {report.responses.length} resposta{report.responses.length !== 1 ? 's' : ''}
                                                            </Typography>
                                                        )}

                                                        {/* ✨ INDICADOR ESPECIAL PARA CHAT ADMIN */}
                                                        {report.type === 'admin_chat' && report.hasUnreadResponses && (
                                                            <Chip
                                                                label="Mensagem do Admin!"
                                                                size="small"
                                                                sx={{
                                                                    fontSize: isMobile ? '8px' : '9px',
                                                                    height: isMobile ? '16px' : '18px',
                                                                    backgroundColor: '#9c27b0',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    animation: 'pulse 2s infinite',
                                                                    '@keyframes pulse': {
                                                                        '0%': { opacity: 1 },
                                                                        '50%': { opacity: 0.7 },
                                                                        '100%': { opacity: 1 }
                                                                    }
                                                                }}
                                                            />
                                                        )}

                                                        {/* INDICADOR DE NOVA RESPOSTA NORMAL */}
                                                        {report.hasUnreadResponses && report.type !== 'admin_chat' && (
                                                            <Chip
                                                                label="Nova resposta!"
                                                                size="small"
                                                                color="error"
                                                                sx={{
                                                                    fontSize: isMobile ? '8px' : '9px',
                                                                    height: isMobile ? '16px' : '18px',
                                                                    fontWeight: 600,
                                                                    animation: 'pulse 2s infinite'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < reports.length - 1 && (
                                        <Divider sx={{ mx: 2, opacity: 0.5 }} />
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </List>

                    {/* Footer */}
                    <Divider />
                    <Box sx={{ p: isMobile ? 1 : 1.5, textAlign: 'center' }}>
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                                handleClose();
                                if (onMessageClick) {
                                    // ✨ REDIRECIONAMENTO CORRETO
                                    onMessageClick({
                                        action: 'openCentralAjuda',
                                        tab: 'messages'
                                    });
                                }
                            }}
                            sx={{
                                fontSize: isMobile ? '11px' : '12px',
                                color: '#1852FE',
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Ver todas as mensagens
                        </Button>
                    </Box>
                </Paper>
            </Popover>
        </>
    );
};

export default NotificationComponent;