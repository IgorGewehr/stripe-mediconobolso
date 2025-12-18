"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Paper,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    Divider
} from "@mui/material";

import {
    Close as CloseIcon,
    Send as SendIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Circle as CircleIcon
} from '@mui/icons-material';

import firebaseService from "../../../../lib/firebaseService";
import { useAuth } from '../../providers/authProvider';

const AdminChatDialog = ({
                             selectedUser,
                             open,
                             onClose,
                             onConversationCreated = () => {}
                         }) => {
    // Estados principais
    const [conversation, setConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [isNewConversation, setIsNewConversation] = useState(false);

    const messagesEndRef = useRef(null);
    const { user: currentUser } = useAuth();

    // ====================================================
    // FUNÇÕES PRINCIPAIS
    // ====================================================

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    }, []);

    const loadConversation = useCallback(async () => {
        if (!selectedUser?.id || !currentUser?.administrador) return;

        setLoading(true);
        setError('');

        try {
            console.log(`🔄 Carregando conversa com usuário ${selectedUser.id}...`);

            const existingConversation = await firebaseService.getAdminUserConversation(selectedUser.id);

            if (existingConversation) {
                console.log('✅ Conversa existente encontrada:', existingConversation.id);
                console.log('📝 Dados da conversa:', {
                    content: existingConversation.content,
                    isAdminInitiated: existingConversation.isAdminInitiated,
                    responses: existingConversation.responses?.length || 0
                });
                setConversation(existingConversation);
                setIsNewConversation(false);
            } else {
                console.log('📝 Nenhuma conversa encontrada - será criada nova conversa');
                setConversation(null);
                setIsNewConversation(true);
            }
        } catch (error) {
            console.error("❌ Erro ao carregar conversa:", error);
            setError('Erro ao carregar conversa: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedUser?.id, currentUser]);

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || sending || !selectedUser || !currentUser) return;

        setSending(true);
        setError('');

        try {
            let conversationId = conversation?.id;

            // Se é nova conversa, criar primeiro
            if (isNewConversation || !conversationId) {
                console.log('📤 Criando nova conversa com usuário...');

                conversationId = await firebaseService.createAdminUserConversation(
                    selectedUser.id,
                    newMessage.trim(),
                    {
                        uid: currentUser.uid,
                        fullName: currentUser.fullName || 'Administrador'
                    }
                );

                console.log('✅ Nova conversa criada:', conversationId);

                // Aguardar um pouco para garantir que o documento foi salvo
                await new Promise(resolve => setTimeout(resolve, 500));

                setIsNewConversation(false);
                onConversationCreated(conversationId);

                // Limpar campo de mensagem ANTES de recarregar
                setNewMessage('');

                // Recarregar a conversa recém-criada
                const newConversation = await firebaseService.getReport(conversationId);
                if (newConversation) {
                    console.log('✅ Conversa inicial carregada:', newConversation);
                    setConversation(newConversation);
                } else {
                    console.error('❌ Não foi possível carregar a conversa criada');
                    setError('Erro ao carregar a conversa criada');
                }
            } else {
                console.log('📤 Enviando mensagem para conversa existente...');

                await firebaseService.sendAdminMessage(
                    conversationId,
                    newMessage.trim(),
                    {
                        uid: currentUser.uid,
                        fullName: currentUser.fullName || 'Administrador'
                    }
                );

                // Limpar campo de mensagem
                setNewMessage('');

                // Recarregar conversa atualizada
                const updatedConversation = await firebaseService.getReport(conversationId);
                if (updatedConversation) {
                    setConversation(updatedConversation);
                    console.log('✅ Conversa atualizada com sucesso');
                }
            }

        } catch (error) {
            console.error("❌ Erro ao enviar mensagem:", error);
            setError('Erro ao enviar mensagem: ' + error.message);
        } finally {
            setSending(false);
        }
    }, [newMessage, conversation, isNewConversation, selectedUser, currentUser, sending, onConversationCreated]);

    // ====================================================
    // EFFECTS
    // ====================================================

    useEffect(() => {
        if (open && selectedUser) {
            loadConversation();
        }
    }, [open, selectedUser, loadConversation]);

    useEffect(() => {
        if (conversation?.responses?.length) {
            scrollToBottom();
        }
    }, [conversation?.responses, scrollToBottom]);

    // Reset ao fechar
    useEffect(() => {
        if (!open) {
            setConversation(null);
            setNewMessage('');
            setError('');
            setIsNewConversation(false);
        }
    }, [open]);

    // ====================================================
    // HANDLERS
    // ====================================================

    const handleClose = () => {
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRefresh = useCallback(async () => {
        if (!selectedUser?.id || !currentUser?.administrador) return;

        console.log('🔄 Refresh manual solicitado');

        // Se temos uma conversa ativa, recarregar diretamente
        if (conversation?.id) {
            try {
                setLoading(true);
                const refreshedConversation = await firebaseService.getReport(conversation.id);
                if (refreshedConversation) {
                    console.log('✅ Conversa recarregada:', {
                        id: refreshedConversation.id,
                        content: refreshedConversation.content,
                        responses: refreshedConversation.responses?.length || 0
                    });
                    setConversation(refreshedConversation);
                } else {
                    // Fallback para busca por usuário
                    loadConversation();
                }
            } catch (error) {
                console.error('❌ Erro no refresh:', error);
                loadConversation();
            } finally {
                setLoading(false);
            }
        } else {
            // Se não tem conversa, carregar do zero
            loadConversation();
        }
    }, [selectedUser?.id, currentUser, conversation?.id, loadConversation]);

    // ====================================================
    // FUNÇÕES AUXILIARES
    // ====================================================

    const formatDate = (date) => {
        if (!date) return '';
        const messageDate = date.toDate ? date.toDate() : new Date(date);
        return messageDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ====================================================
    // RENDERIZAÇÃO
    // ====================================================

    if (!selectedUser) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    height: '700px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                py: 2,
                flexShrink: 0,
                backgroundColor: '#f8f9fa'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={selectedUser.photoURL}
                            sx={{ width: 48, height: 48 }}
                        >
                            {selectedUser.fullName?.charAt(0) || 'U'}
                        </Avatar>
                        {selectedUser.isOnline && (
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: '#4CAF50',
                                border: '2px solid white'
                            }} />
                        )}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111E5A' }}>
                            Chat com {selectedUser.fullName || 'Usuário'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={selectedUser.planType}
                                color={selectedUser.planColor}
                                size="small"
                            />
                            {selectedUser.isOnline && (
                                <Chip
                                    label="Online"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {selectedUser.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {conversation && (
                        <Tooltip title="Recarregar conversa">
                            <IconButton
                                onClick={handleRefresh}
                                disabled={loading}
                                size="small"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden'
            }}>
                {error && (
                    <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        p: 4
                    }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Carregando conversa...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Área de Mensagens */}
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                            p: 3,
                            backgroundColor: '#f8f9fa'
                        }}>
                            {isNewConversation ? (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    px: 4
                                }}>
                                    <Box sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(24, 82, 254, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 3
                                    }}>
                                        <AdminIcon sx={{ fontSize: 40, color: '#1852FE' }} />
                                    </Box>
                                    <Typography variant="h6" gutterBottom sx={{ color: '#111E5A', fontWeight: 600 }}>
                                        Iniciar Nova Conversa
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
                                        Você está iniciando uma conversa com <strong>{selectedUser.fullName}</strong>.
                                        <br />
                                        O usuário receberá uma notificação.
                                    </Typography>
                                </Box>
                            ) : conversation ? (
                                <Box>
                                    {/* Mensagem Original/Inicial (sempre mostrar se houver content) */}
                                    {conversation.content && (
                                        <Paper sx={{
                                            p: 3,
                                            mb: 3,
                                            backgroundColor: conversation.isAdminInitiated
                                                ? 'rgba(24, 82, 254, 0.08)'
                                                : 'rgba(156, 39, 176, 0.08)',
                                            borderRadius: '12px',
                                            border: conversation.isAdminInitiated
                                                ? '1px solid rgba(24, 82, 254, 0.2)'
                                                : '1px solid rgba(156, 39, 176, 0.2)'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Avatar sx={{
                                                    backgroundColor: conversation.isAdminInitiated ? '#1852FE' : '#9c27b0',
                                                    width: 40,
                                                    height: 40
                                                }}>
                                                    {conversation.isAdminInitiated ? <AdminIcon /> : <PersonIcon />}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111E5A' }}>
                                                        {conversation.isAdminInitiated
                                                            ? 'Conversa iniciada pelo administrador'
                                                            : conversation.subject || 'Mensagem'
                                                        }
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {conversation.isAdminInitiated
                                                            ? conversation.adminInitiatorName || 'Administrador'
                                                            : conversation.userName || selectedUser.fullName
                                                        } • {formatDate(conversation.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                                {conversation.content}
                                            </Typography>
                                        </Paper>
                                    )}

                                    {/* Respostas */}
                                    {conversation.responses && conversation.responses.length > 0 && (
                                        <Box>
                                            {conversation.responses.map((response, index) => (
                                                <Box key={`response-${conversation.id}-${index}-${response.createdAt || index}`} sx={{ mb: 3 }}>
                                                    <Paper sx={{
                                                        p: 3,
                                                        backgroundColor: response.isAdmin ? 'rgba(24, 82, 254, 0.08)' : '#ffffff',
                                                        borderLeft: `4px solid ${response.isAdmin ? '#1852FE' : '#9c27b0'}`,
                                                        borderRadius: '12px',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Avatar sx={{
                                                                width: 32,
                                                                height: 32,
                                                                backgroundColor: response.isAdmin ? '#1852FE' : '#9c27b0',
                                                                fontSize: '14px'
                                                            }}>
                                                                {response.isAdmin ? (
                                                                    <AdminIcon sx={{ fontSize: 18 }} />
                                                                ) : (
                                                                    <PersonIcon sx={{ fontSize: 18 }} />
                                                                )}
                                                            </Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111E5A' }}>
                                                                    {response.isAdmin ? 'Administrador' : (response.authorName || selectedUser.fullName)}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formatDate(response.createdAt)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                                            {response.content}
                                                        </Typography>
                                                    </Paper>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    {/* Se não há content nem responses, mostrar aviso */}
                                    {!conversation.content && (!conversation.responses || conversation.responses.length === 0) && (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Conversa carregada mas sem mensagens visíveis
                                            </Typography>
                                        </Box>
                                    )}

                                    <div ref={messagesEndRef} />
                                </Box>
                            ) : (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 4
                                }}>
                                    <Typography variant="body2" color="error">
                                        Erro ao carregar conversa
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>

            {/* Footer - Campo de Mensagem */}
            <Box sx={{
                p: 3,
                borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#fff',
                flexShrink: 0
            }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder={
                            isNewConversation
                                ? "Digite sua mensagem para iniciar a conversa..."
                                : "Digite sua mensagem..."
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={sending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
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
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
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

                {conversation && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            ID: {conversation.id} | Msgs: {(conversation.responses?.length || 0) + (conversation.content ? 1 : 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Status: {conversation.status === 'resolved' ? '✅ Resolvida' : '🔄 Ativa'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
};

export default AdminChatDialog;