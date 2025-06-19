"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    IconButton,
    Avatar,
    Paper,
    CircularProgress,
    Fade,
    Chip,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    Person as PersonIcon,
    AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

const MiniChatCard = () => {
    const theme = useTheme();

    // Estados do chat
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll para a última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

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

            setMessages([...updatedMessages, aiMessage]);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setError(error.message || 'Erro ao comunicar com a IA');

            // Adicionar mensagem de erro
            const errorMessage = {
                id: Date.now() + 1,
                role: 'error',
                content: 'Erro na comunicação. Tente novamente.',
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

    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                height: '600px', // Altura fixa - ajuste conforme necessário
                borderRadius: '20px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: 'white',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    flexShrink: 0 // Impede que o header encolha
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: '#1852FE', fontSize: 20 }} />
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            color="#1852FE"
                        >
                            Doctor AI
                        </Typography>
                    </Box>
                    <Chip
                        label="Beta"
                        size="small"
                        sx={{
                            fontSize: '0.65rem',
                            height: '20px',
                            backgroundColor: alpha('#1852FE', 0.1),
                            color: '#1852FE',
                            fontWeight: 600
                        }}
                    />
                </Box>

                {/* Área das Mensagens */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        backgroundColor: '#FAFBFC',
                        borderRadius: '12px',
                        p: 1.5,
                        mb: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0, // Importante para o scroll funcionar
                        border: '1px solid #F0F0F0',
                        // Adiciona scroll customizado
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#c1c1c1',
                            borderRadius: '3px',
                            '&:hover': {
                                backgroundColor: '#a8a8a8',
                            },
                        },
                    }}
                >
                    {messages.length === 0 ? (
                        // Estado vazio
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                textAlign: 'center',
                                color: '#6B7280',
                                py: 2
                            }}
                        >
                            <PsychologyIcon sx={{ fontSize: 32, mb: 1, opacity: 0.3, color: '#9CA3AF' }} />
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                                Assistente Médico
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.3 }}>
                                Tire dúvidas sobre dosagens, protocolos e diagnósticos
                            </Typography>

                            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    "Dosagem amoxicilina",
                                    "Protocolo IAM"
                                ].map((suggestion, index) => (
                                    <Chip
                                        key={index}
                                        label={suggestion}
                                        variant="outlined"
                                        clickable
                                        size="small"
                                        onClick={() => setCurrentMessage(suggestion)}
                                        sx={{
                                            fontSize: '0.65rem',
                                            height: '24px',
                                            borderColor: '#E5E7EB',
                                            color: '#6B7280',
                                            '&:hover': {
                                                backgroundColor: '#F9FAFB',
                                                borderColor: '#D1D5DB'
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        // Mensagens
                        <Box sx={{ flex: 1 }}>
                            {messages.map((message) => (
                                <Fade in={true} key={message.id} timeout={200}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            mb: 1.5,
                                            alignItems: 'flex-start',
                                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        {message.role !== 'user' && (
                                            <Avatar
                                                sx={{
                                                    bgcolor: message.role === 'error' ? '#EF4444' : '#1852FE',
                                                    width: 24,
                                                    height: 24,
                                                    mr: 1
                                                }}
                                            >
                                                {message.role === 'error' ? '⚠️' : <PsychologyIcon sx={{ fontSize: 12 }} />}
                                            </Avatar>
                                        )}

                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                maxWidth: '85%',
                                                backgroundColor: message.role === 'user'
                                                    ? '#1852FE'
                                                    : message.role === 'error'
                                                        ? '#FEF2F2'
                                                        : 'white',
                                                color: message.role === 'user' ? 'white' : '#374151',
                                                borderRadius: message.role === 'user'
                                                    ? '12px 12px 2px 12px'
                                                    : '12px 12px 12px 2px',
                                                border: '1px solid',
                                                borderColor: message.role === 'user'
                                                    ? '#1852FE'
                                                    : message.role === 'error'
                                                        ? '#FECACA'
                                                        : '#F0F0F0'
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: 1.4,
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {message.content}
                                            </Typography>
                                        </Paper>

                                        {message.role === 'user' && (
                                            <Avatar
                                                sx={{
                                                    bgcolor: '#6B7280',
                                                    width: 24,
                                                    height: 24,
                                                    ml: 1
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 12 }} />
                                            </Avatar>
                                        )}
                                    </Box>
                                </Fade>
                            ))}

                            {isLoading && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: '#1852FE',
                                            width: 24,
                                            height: 24,
                                            mr: 1
                                        }}
                                    >
                                        <PsychologyIcon sx={{ fontSize: 12 }} />
                                    </Avatar>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: 'white',
                                            borderRadius: '12px 12px 12px 2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '1px solid #F0F0F0'
                                        }}
                                    >
                                        <CircularProgress size={12} sx={{ mr: 1, color: '#6B7280' }} />
                                        <Typography variant="caption" color="textSecondary">
                                            Analisando...
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>
                    )}
                </Box>

                {/* Erro */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 1,
                            fontSize: '0.75rem',
                            py: 0.5,
                            flexShrink: 0, // Impede que o erro encolha
                            '& .MuiAlert-message': { py: 0.5 }
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* Input */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexShrink: 0 // Impede que o input encolha
                }}>
                    <TextField
                        ref={inputRef}
                        fullWidth
                        size="small"
                        multiline
                        maxRows={2}
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Sua dúvida médica..."
                        disabled={isLoading}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: '#FAFBFC',
                                fontSize: '0.8rem',
                                '& input': {
                                    py: 1
                                },
                                '&:hover': {
                                    backgroundColor: '#F9FAFB'
                                },
                                '&.Mui-focused': {
                                    backgroundColor: 'white',
                                    borderColor: '#1852FE'
                                }
                            }
                        }}
                    />
                    <IconButton
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isLoading}
                        sx={{
                            bgcolor: '#1852FE',
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': {
                                bgcolor: '#1642E1'
                            },
                            '&:disabled': {
                                bgcolor: '#E5E7EB',
                                color: '#9CA3AF'
                            }
                        }}
                    >
                        <SendIcon fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MiniChatCard;