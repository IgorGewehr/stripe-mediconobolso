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
    Chip
} from "@mui/material";
import {
    Notifications as NotificationsIcon,
    Message as MessageIcon,
    BugReport as BugIcon,
    Feedback as FeedbackIcon,
    Info as InfoIcon,
    Support as SupportIcon,
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
            // ✨ PASSAR O REPORT ID PARA ABRIR DIRETAMENTE
            onMessageClick({
                openCentralAjuda: true,
                selectedReportId: report.id,
                report: report
            });
        }
    };

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
            default:
                return <MessageIcon sx={{ fontSize: 20, color: '#9e9e9e' }} />;
        }
    };

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
                    width: 40,
                    height: 40,
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
                            fontSize: '0.75rem',
                            minWidth: '18px',
                            height: '18px'
                        }
                    }}
                >
                    <NotificationsIcon
                        sx={{
                            fontSize: 22,
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
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        maxWidth: '380px',
                        width: '100%',
                        maxHeight: '500px'
                    }
                }}
            >
                <Paper sx={{ p: 0 }}>
                    {/* Header */}
                    <Box sx={{
                        p: 2,
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
                                fontSize: '16px'
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
                                        fontSize: '12px',
                                        color: '#1852FE',
                                        textTransform: 'none'
                                    }}
                                >
                                    Marcar como lidas
                                </Button>
                            )}
                        </Box>

                        {unreadCount > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                {unreadCount} mensagem{unreadCount !== 1 ? 's' : ''} não lida{unreadCount !== 1 ? 's' : ''}
                            </Typography>
                        )}
                    </Box>

                    {/* Lista de reports */}
                    <List sx={{ p: 0, maxHeight: '400px', overflow: 'auto' }}>
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
                                            py: 1.5,
                                            px: 2,
                                            backgroundColor: report.hasUnreadResponses
                                                ? 'rgba(24, 82, 254, 0.04)'
                                                : 'transparent',
                                            borderLeft: report.hasUnreadResponses
                                                ? '3px solid #1852FE'
                                                : '3px solid transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(24, 82, 254, 0.08)'
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
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
                                                            flex: 1
                                                        }}
                                                        noWrap
                                                    >
                                                        {report.subject || getMessageTypeLabel(report.type)}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ fontSize: '11px' }}
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

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                        <Chip
                                                            label={getMessageTypeLabel(report.type)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontSize: '10px',
                                                                height: '20px',
                                                                borderColor: 'rgba(0, 0, 0, 0.12)'
                                                            }}
                                                        />

                                                        <Chip
                                                            label={getStatusLabel(report.status)}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '10px',
                                                                height: '20px',
                                                                backgroundColor: getStatusColor(report.status),
                                                                color: 'white',
                                                                fontWeight: 500
                                                            }}
                                                        />

                                                        {report.responses && report.responses.length > 0 && (
                                                            <Typography
                                                                variant="caption"
                                                                color="primary"
                                                                sx={{ fontSize: '10px', fontWeight: 500 }}
                                                            >
                                                                {report.responses.length} resposta{report.responses.length !== 1 ? 's' : ''}
                                                            </Typography>
                                                        )}

                                                        {/* ✨ INDICADOR DE NOVA RESPOSTA */}
                                                        {report.hasUnreadResponses && (
                                                            <Chip
                                                                label="Nova resposta!"
                                                                size="small"
                                                                color="error"
                                                                sx={{
                                                                    fontSize: '9px',
                                                                    height: '18px',
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
                    <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => {
                                handleClose();
                                if (onMessageClick) {
                                    onMessageClick({ openCentralAjuda: true });
                                }
                            }}
                            sx={{
                                fontSize: '12px',
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