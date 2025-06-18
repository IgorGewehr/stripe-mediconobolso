"use client";
import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    CircularProgress,
    TextField,
    Paper,
    useTheme,
    useMediaQuery,
    Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const MedicalChatDialog = ({ open, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll para a última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focar no input quando abrir
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }, [open]);

    // Reset quando fechar
    const handleClose = () => {
        setMessages([]);
        setCurrentMessage('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    // Enviar mensagem
    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage = currentMessage.trim();
        setCurrentMessage('');
        setError('');
        setIsLoading(true);

        // Adicionar mensagem do usuário
        const newUserMessage = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);

        try {
            // Preparar histórico para enviar à API
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch('/api/medical-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: conversationHistory
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Erro ${response.status}`);
            }

            // Adicionar resposta da IA
            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: result.message,
                timestamp: new Date(),
                tokensUsed: result.tokensUsed
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setError(error.message || 'Erro ao comunicar com a IA');

            // Adicionar mensagem de erro
            const errorMessage = {
                id: Date.now() + 1,
                role: 'error',
                content: 'Desculpe, ocorreu um erro. Tente novamente.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Enter para enviar
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    // Formatizar tempo
    const formatTime = (date) => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    overflow: 'hidden',
                    height: fullScreen ? '100vh' : '80vh',
                    maxHeight: fullScreen ? '100vh' : '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #EAECEF',
                    backgroundColor: '#E3F2FD',
                    flexShrink: 0
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: '#1976D2',
                            color: 'white',
                            width: 40,
                            height: 40,
                            mr: 2
                        }}
                    >
                        <MedicalServicesIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976D2' }}>
                            Assistente Médico IA
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Dúvidas rápidas e orientações técnicas
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#64748B' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Messages Area */}
            <DialogContent
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        p: 2,
                        backgroundColor: '#F8FAFC'
                    }}
                >
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                textAlign: 'center',
                                color: '#64748B'
                            }}
                        >
                            <MedicalServicesIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Assistente Médico Pronto
                            </Typography>
                            <Typography variant="body2">
                                Pergunte sobre dosagens, protocolos, diagnósticos diferenciais...
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <Box
                                    key={message.id}
                                    sx={{
                                        display: 'flex',
                                        mb: 3,
                                        alignItems: 'flex-start',
                                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    {message.role !== 'user' && (
                                        <Avatar
                                            sx={{
                                                bgcolor: message.role === 'error' ? '#F44336' : '#1976D2',
                                                width: 32,
                                                height: 32,
                                                mr: 1,
                                                mt: 0.5
                                            }}
                                        >
                                            {message.role === 'error' ? '⚠️' : <SmartToyIcon sx={{ fontSize: 18 }} />}
                                        </Avatar>
                                    )}

                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            maxWidth: '75%',
                                            backgroundColor: message.role === 'user'
                                                ? '#1976D2'
                                                : message.role === 'error'
                                                    ? '#FFEBEE'
                                                    : 'white',
                                            color: message.role === 'user' ? 'white' : '#2D3748',
                                            borderRadius: message.role === 'user'
                                                ? '18px 18px 4px 18px'
                                                : '18px 18px 18px 4px'
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.5
                                            }}
                                        >
                                            {message.content}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                mt: 1,
                                                opacity: 0.7,
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {formatTime(message.timestamp)}
                                            {message.tokensUsed && ` • ${message.tokensUsed} tokens`}
                                        </Typography>
                                    </Paper>

                                    {message.role === 'user' && (
                                        <Avatar
                                            sx={{
                                                bgcolor: '#64748B',
                                                width: 32,
                                                height: 32,
                                                ml: 1,
                                                mt: 0.5
                                            }}
                                        >
                                            <PersonIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                    )}
                                </Box>
                            ))}

                            {isLoading && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 2
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: '#1976D2',
                                            width: 32,
                                            height: 32,
                                            mr: 1
                                        }}
                                    >
                                        <SmartToyIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            backgroundColor: 'white',
                                            borderRadius: '18px 18px 18px 4px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Analisando...
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #EAECEF' }}>
                    {error && (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mb: 1 }}
                        >
                            {error}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                        <TextField
                            ref={inputRef}
                            fullWidth
                            multiline
                            maxRows={4}
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite sua dúvida médica..."
                            disabled={isLoading}
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px',
                                }
                            }}
                        />
                        <IconButton
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() || isLoading}
                            sx={{
                                bgcolor: '#1976D2',
                                color: 'white',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    bgcolor: '#1565C0'
                                },
                                '&:disabled': {
                                    bgcolor: '#E0E0E0'
                                }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default MedicalChatDialog;