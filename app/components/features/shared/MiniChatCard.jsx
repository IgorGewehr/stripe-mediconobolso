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
    useMediaQuery,
    alpha,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    Person as PersonIcon,
    AutoAwesome as AutoAwesomeIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    TrendingUp as TrendingUpIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import AudioProcessingDialog from '../dialogs/AudioProcessingDialog';
import { useAuth } from '../../authProvider';

const MiniChatCard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMedium = useMediaQuery(theme.breakpoints.down('md'));
    const { user, isFreeUser } = useAuth();

    // Estados do chat
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioDialogOpen, setAudioDialogOpen] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

    // ✅ CONTROLE DE LIMITE PARA USUÁRIOS FREE
    const [freeUsageCount, setFreeUsageCount] = useState(0);
    const FREE_USAGE_LIMIT = 5;

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll para a última mensagem (apenas dentro do container do chat)
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            const chatContainer = messagesEndRef.current.closest('[data-chat-messages]');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ CARREGAR CONTADOR DE USOS FREE
    useEffect(() => {
        if (user?.uid && isFreeUser) {
            loadFreeUsageCount();
        }
    }, [user, isFreeUser]);

    // ✅ CARREGAR CONTADOR DE USOS FREE
    const loadFreeUsageCount = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usageKey = `miniChat_${user.uid}_${today}`;
            const currentUsage = localStorage.getItem(usageKey) || '0';
            setFreeUsageCount(parseInt(currentUsage));
        } catch (error) {
            console.error("Erro ao carregar contador de usos:", error);
        }
    };

    // ✅ INCREMENTAR CONTADOR DE USOS FREE
    const incrementFreeUsage = () => {
        if (!isFreeUser) return;
        
        const today = new Date().toISOString().split('T')[0];
        const usageKey = `miniChat_${user.uid}_${today}`;
        const newCount = freeUsageCount + 1;
        
        localStorage.setItem(usageKey, newCount.toString());
        setFreeUsageCount(newCount);
        
        console.log(`🔢 Uso incrementado: ${newCount}/${FREE_USAGE_LIMIT}`);
    };

    // ✅ VERIFICAR SE PODE USAR CHAT IA
    const canUseChatAI = () => {
        if (!isFreeUser) return true;
        return freeUsageCount < FREE_USAGE_LIMIT;
    };

    // Enviar mensagem
    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        // ✅ VERIFICAR LIMITE PARA USUÁRIOS FREE
        if (isFreeUser && !canUseChatAI()) {
            console.log(`❌ Limite de uso atingido: ${freeUsageCount}/${FREE_USAGE_LIMIT}`);
            setUpgradeDialogOpen(true);
            return;
        }

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
                    conversationHistory: conversationHistory,
                    userId: user?.uid
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

            // ✅ INCREMENTAR CONTADOR DE USOS FREE APÓS SUCESSO
            incrementFreeUsage();

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

    // Handle audio processing result
    const handleAudioResult = (result) => {
        if (result && result.transcription) {
            setCurrentMessage(result.transcription);
            setAudioDialogOpen(false);
            // Auto-send if it's just transcription, or let user review if there's analysis
            if (!result.analysis) {
                // Simulate user message with transcription
                setTimeout(() => {
                    handleSendMessage();
                }, 100);
            }
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                height: isMobile ? '400px' : isTablet ? '500px' : '600px', // Altura responsiva
                borderRadius: isMobile ? '16px' : '20px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: 'white',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{
                p: isMobile ? 1.5 : 2.5,
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
                            sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                        >
                            Doctor AI
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        {isFreeUser && (
                            <Chip
                                label={`${freeUsageCount}/${FREE_USAGE_LIMIT}`}
                                size="small"
                                icon={freeUsageCount >= FREE_USAGE_LIMIT ? <LockIcon /> : undefined}
                                onClick={freeUsageCount >= FREE_USAGE_LIMIT ? () => setUpgradeDialogOpen(true) : undefined}
                                sx={{
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    backgroundColor: freeUsageCount >= FREE_USAGE_LIMIT ? '#FEF2F2' : '#F0F9FF',
                                    color: freeUsageCount >= FREE_USAGE_LIMIT ? '#EF4444' : '#1976D2',
                                    fontWeight: 600,
                                    cursor: freeUsageCount >= FREE_USAGE_LIMIT ? 'pointer' : 'default',
                                    '&:hover': freeUsageCount >= FREE_USAGE_LIMIT ? {
                                        backgroundColor: '#FEE2E2'
                                    } : {}
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Área das Mensagens */}
                <Box
                    data-chat-messages
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
                        onClick={() => setAudioDialogOpen(true)}
                        disabled={isLoading}
                        sx={{
                            bgcolor: '#22C55E',
                            color: 'white',
                            width: 32,
                            height: 32,
                            mr: 0.5,
                            '&:hover': {
                                bgcolor: '#16A34A'
                            },
                            '&:disabled': {
                                bgcolor: '#E5E7EB',
                                color: '#9CA3AF'
                            }
                        }}
                    >
                        <MicIcon fontSize="small" />
                    </IconButton>
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

                {/* Audio Processing Dialog */}
                <AudioProcessingDialog
                    open={audioDialogOpen}
                    onClose={() => setAudioDialogOpen(false)}
                    onResult={handleAudioResult}
                />

                {/* Dialog de Upgrade */}
                <AccessDeniedDialog
                    open={upgradeDialogOpen}
                    onClose={() => setUpgradeDialogOpen(false)}
                    feature="Mini Chat"
                    usageCount={freeUsageCount}
                    usageLimit={FREE_USAGE_LIMIT}
                />
            </CardContent>
        </Card>
    );
};

// Componente AccessDeniedDialog
const AccessDeniedDialog = ({ open, onClose, feature, usageCount, usageLimit }) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    p: 2
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            bgcolor: '#FEF2F2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <TrendingUpIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                            Limite de Uso Atingido
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Plano Gratuito
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
                        Você atingiu o limite de {usageLimit} usos diários do {feature}.
                    </Typography>
                    
                    <Card sx={{ bgcolor: '#FEF2F2', border: '1px solid #FECACA', mb: 3 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="textSecondary">
                                    Uso atual:
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 600 }}>
                                    {usageCount}/{usageLimit}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
                        Para continuar usando todas as funcionalidades do {feature}, faça upgrade para um plano pago:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Card sx={{ border: '1px solid #E5E7EB' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
                                            Plano Mensal
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Uso ilimitado + recursos avançados
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ color: '#059669', fontWeight: 600 }}>
                                        R$ 29,90/mês
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ border: '2px solid #059669', bgcolor: '#F0FDF4' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
                                            Plano Anual
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Economia de 30% + todos os recursos
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h6" sx={{ color: '#059669', fontWeight: 600 }}>
                                            R$ 299,90/ano
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                            (~R$ 25/mês)
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#6B7280', textAlign: 'center', mt: 2 }}>
                    O limite será renovado automaticamente amanhã às 00:00.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    onClick={onClose}
                    sx={{ 
                        color: '#6B7280',
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    Fechar
                </Button>
                <Button
                    variant="contained"
                    onClick={() => window.open('/assinatura', '_blank')}
                    sx={{
                        bgcolor: '#059669',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': {
                            bgcolor: '#047857'
                        }
                    }}
                >
                    Fazer Upgrade
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MiniChatCard;