"use client";

import React, { useState, useRef, useEffect } from "react";
import {
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
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Menu,
    MenuItem,
    Tooltip,
    Chip,
    Card,
    CardContent,
    Fade,
    Skeleton,
    InputAdornment,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    TrendingUp as TrendingUpIcon,
    CleaningServices as CleaningServicesIcon,
    Analytics as AnalyticsIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon
} from "@mui/icons-material";
import { useAuth } from "./authProvider";
import FirebaseService from "../../lib/firebaseService";
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FloatingVoiceRecorder from './organismsComponents/FloatingVoiceRecorder';
import AccessDeniedDialog from './organismsComponents/accessDeniedDialog';

const DoctorAITemplate = () => {
    const { user, isFreeUser } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Estados do chat
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados do histórico
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Estados da UI
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedConversationMenu, setSelectedConversationMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [stats, setStats] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

    // ✅ CONTROLE DE LIMITE PARA USUÁRIOS FREE
    const [freeUsageCount, setFreeUsageCount] = useState(0);
    const FREE_USAGE_LIMIT = 5;

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Função para validar e converter data
    const validateDate = (dateInput) => {
        if (!dateInput) return new Date();

        let date;
        if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
            // Firestore Timestamp
            date = dateInput.toDate();
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else {
            date = new Date();
        }

        return isValid(date) ? date : new Date();
    };

    // ✅ CARREGAR CONTADOR DE USOS FREE
    useEffect(() => {
        if (user?.uid && isFreeUser) {
            loadFreeUsageCount();
        }
    }, [user, isFreeUser]);

    // Carregar dados ao montar componente
    useEffect(() => {
        if (user?.uid) {
            loadConversationHistory();
            loadStats();
        }
    }, [user]);

    // Auto scroll para a última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focar no input quando carregar
    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }, []);

    // ✅ CARREGAR CONTADOR DE USOS FREE
    const loadFreeUsageCount = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usageKey = `doctorAI_${user.uid}_${today}`;
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
        const usageKey = `doctorAI_${user.uid}_${today}`;
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

    // Carregar estatísticas
    const loadStats = async () => {
        try {
            const conversationStats = await FirebaseService.getConversationStats(user.uid);
            setStats(conversationStats);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    };

    // Carregar histórico de conversas
    const loadConversationHistory = async () => {
        try {
            setIsLoadingHistory(true);
            const history = await FirebaseService.getConversations(user.uid);
            setConversations(history || []);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            setError("Erro ao carregar histórico de conversas");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Buscar conversas
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadConversationHistory();
            return;
        }

        try {
            setIsSearching(true);
            const results = await FirebaseService.searchConversations(user.uid, searchTerm);
            setConversations(results || []);
        } catch (error) {
            console.error("Erro na busca:", error);
            setError("Erro ao buscar conversas");
        } finally {
            setIsSearching(false);
        }
    };

    // Limpar busca
    const clearSearch = () => {
        setSearchTerm('');
        loadConversationHistory();
    };

    // Limpar conversas antigas
    const cleanOldConversations = async () => {
        try {
            const deleted = await FirebaseService.cleanOldConversations(user.uid, 30);
            if (deleted > 0) {
                await loadConversationHistory();
                await loadStats();
                setError(`${deleted} conversas antigas foram removidas`);
                setTimeout(() => setError(''), 3000);
            }
        } catch (error) {
            console.error("Erro ao limpar conversas:", error);
            setError("Erro ao limpar conversas antigas");
        }
    };

    // Criar nova conversa
    const createNewConversation = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setError('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Carregar conversa específica
    const loadConversation = async (conversationId) => {
        try {
            const conversation = await FirebaseService.getConversation(user.uid, conversationId);
            if (conversation) {
                setMessages(conversation.messages || []);
                setCurrentConversationId(conversationId);
                setError('');
            }
        } catch (error) {
            console.error("Erro ao carregar conversa:", error);
            setError("Erro ao carregar conversa");
        }
    };

    // Salvar conversa
    const saveConversation = async (messagesData, conversationId = null) => {
        try {
            if (!user?.uid || messagesData.length === 0) return null;

            const conversationData = {
                messages: messagesData,
                title: generateConversationTitle(messagesData[0]?.content || "Nova conversa"),
                lastMessageAt: new Date(),
                messageCount: messagesData.length
            };

            let savedId;
            if (conversationId) {
                await FirebaseService.updateConversation(user.uid, conversationId, conversationData);
                savedId = conversationId;
            } else {
                savedId = await FirebaseService.saveConversation(user.uid, conversationData);
            }

            // Recarregar histórico e stats
            await loadConversationHistory();
            await loadStats();
            return savedId;
        } catch (error) {
            console.error("Erro ao salvar conversa:", error);
            setError("Erro ao salvar conversa");
            return null;
        }
    };

    // Gerar título da conversa baseado na primeira mensagem
    const generateConversationTitle = (firstMessage) => {
        if (!firstMessage) return "Nova conversa";

        // Limitar a 50 caracteres e adicionar reticências se necessário
        const title = firstMessage.length > 50
            ? firstMessage.substring(0, 50) + "..."
            : firstMessage;

        return title;
    };

    // Deletar conversa
    const deleteConversation = async (conversationId) => {
        try {
            await FirebaseService.deleteConversation(user.uid, conversationId);

            // Se era a conversa atual, limpar
            if (currentConversationId === conversationId) {
                setMessages([]);
                setCurrentConversationId(null);
            }

            // Recarregar histórico e stats
            await loadConversationHistory();
            await loadStats();
            setMenuAnchor(null);
        } catch (error) {
            console.error("Erro ao deletar conversa:", error);
            setError("Erro ao deletar conversa");
        }
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

            const finalMessages = [...updatedMessages, aiMessage];
            setMessages(finalMessages);

            // ✅ INCREMENTAR CONTADOR DE USOS FREE APÓS SUCESSO
            incrementFreeUsage();

            // Salvar conversa automaticamente
            const savedId = await saveConversation(finalMessages, currentConversationId);
            if (!currentConversationId && savedId) {
                setCurrentConversationId(savedId);
            }

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

    // Handle voice transcription
    const handleVoiceTranscription = (transcription) => {
        setCurrentMessage(transcription);
        setShowVoiceRecorder(false);
        // Auto-send the transcribed message
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    // Formatizar tempo relativo
    const formatRelativeTime = (date) => {
        const validDate = validateDate(date);

        if (isToday(validDate)) {
            return format(validDate, 'HH:mm', { locale: ptBR });
        } else if (isYesterday(validDate)) {
            return 'Ontem';
        } else if (isThisWeek(validDate)) {
            return format(validDate, 'EEEE', { locale: ptBR });
        } else if (isThisMonth(validDate)) {
            return format(validDate, 'dd/MM', { locale: ptBR });
        } else {
            return format(validDate, 'dd/MM/yy', { locale: ptBR });
        }
    };

    // Formatizar tempo das mensagens
    const formatMessageTime = (date) => {
        const validDate = validateDate(date);
        return format(validDate, 'HH:mm', { locale: ptBR });
    };

    // Agrupar conversas por período
    const groupedConversations = React.useMemo(() => {
        const filtered = searchTerm.trim()
            ? conversations
            : conversations;

        const groups = {
            hoje: [],
            ontem: [],
            semana: [],
            mes: [],
            antigo: []
        };

        filtered.forEach(conversation => {
            const date = validateDate(conversation.lastMessageAt);

            if (isToday(date)) {
                groups.hoje.push(conversation);
            } else if (isYesterday(date)) {
                groups.ontem.push(conversation);
            } else if (isThisWeek(date)) {
                groups.semana.push(conversation);
            } else if (isThisMonth(date)) {
                groups.mes.push(conversation);
            } else {
                groups.antigo.push(conversation);
            }
        });

        return groups;
    }, [conversations, searchTerm]);

    return (
        <Box sx={{
            display: 'flex',
            height: 'calc(100vh - 140px)',
            maxHeight: 'calc(100vh - 140px)',
            backgroundColor: '#FAFBFC',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB'
        }}>
            {/* Sidebar do Histórico */}
            <Box
                sx={{
                    width: isMobile ? '100%' : '300px',
                    backgroundColor: 'white',
                    borderRight: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    position: isMobile ? 'absolute' : 'relative',
                    zIndex: isMobile ? 1000 : 1,
                    height: '100%',
                    overflow: 'hidden' /* Adicionado */
                }}
            >
                {/* Header do Histórico */}
                <Box sx={{ p: 2.5, borderBottom: '1px solid #F3F4F6' }}> {/* Reduzido padding */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}> {/* Reduzido */}
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                            Doctor AI
                        </Typography>
                        <Tooltip title="Ver estatísticas">
                            <IconButton
                                size="small"
                                onClick={() => setShowStats(!showStats)}
                                sx={{ color: '#6B7280' }}
                            >
                                <AnalyticsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Estatísticas */}
                    {showStats && stats && (
                        <Card sx={{ mb: 2, backgroundColor: '#F9FAFB' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                                    Estatísticas de Uso
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span>{stats.totalConversations} conversas</span>
                                    <span>{stats.totalMessages} mensagens</span>
                                    <span>{stats.totalTokens} tokens</span>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contador de Usos Free */}
                    {isFreeUser && (
                        <Card sx={{ mb: 2, backgroundColor: freeUsageCount >= FREE_USAGE_LIMIT ? '#FEF2F2' : '#F0F9FF' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                                    Plano Gratuito
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                    <span style={{ color: freeUsageCount >= FREE_USAGE_LIMIT ? '#EF4444' : '#1976D2' }}>
                                        {freeUsageCount}/{FREE_USAGE_LIMIT} usos hoje
                                    </span>
                                    {freeUsageCount >= FREE_USAGE_LIMIT && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => setUpgradeDialogOpen(true)}
                                            sx={{
                                                fontSize: '0.6rem',
                                                py: 0.5,
                                                px: 1,
                                                bgcolor: '#EF4444',
                                                '&:hover': { bgcolor: '#DC2626' }
                                            }}
                                        >
                                            Upgrade
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Busca */}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        sx={{ mb: 1.5, backgroundColor: '#F9FAFB' }} /* Reduzido */
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: '#6B7280' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={clearSearch}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Botões de Ação */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={createNewConversation}
                            sx={{
                                backgroundColor: '#111827',
                                color: 'white',
                                fontWeight: 500,
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#1F2937',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            Nova Conversa
                        </Button>

                        <Tooltip title="Limpar conversas antigas (30+ dias)">
                            <IconButton
                                onClick={cleanOldConversations}
                                sx={{
                                    border: '1px solid #E5E7EB',
                                    color: '#6B7280',
                                    '&:hover': { backgroundColor: '#F9FAFB' }
                                }}
                            >
                                <CleaningServicesIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Lista de Conversas */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {isLoadingHistory || isSearching ? (
                        // Skeleton loading
                        <Box sx={{ p: 2 }}>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <Box key={item} sx={{ mb: 2 }}>
                                    <Skeleton variant="rectangular" height={52} sx={{ borderRadius: '8px' }} />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <>
                            {Object.entries(groupedConversations).map(([period, convs]) => {
                                if (convs.length === 0) return null;

                                const periodLabels = {
                                    hoje: 'Hoje',
                                    ontem: 'Ontem',
                                    semana: 'Esta semana',
                                    mes: 'Este mês',
                                    antigo: 'Mais antigo'
                                };

                                return (
                                    <Box key={period} sx={{ mb: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                ml: 3,
                                                color: '#6B7280',
                                                fontWeight: 500,
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {periodLabels[period]}
                                        </Typography>

                                        <List sx={{ py: 0.3 }}> {/* Reduzido padding */}
                                            {convs.map((conversation) => (
                                                <ListItem key={conversation.id} sx={{ px: 2, py: 0 }}>
                                                    <ListItemButton
                                                        selected={currentConversationId === conversation.id}
                                                        onClick={() => loadConversation(conversation.id)}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            mb: 0.3, /* Reduzido */
                                                            py: 1, /* Reduzido padding vertical */
                                                            px: 1.5, /* Reduzido padding horizontal */
                                                            minHeight: 'auto',
                                                            '&.Mui-selected': {
                                                                backgroundColor: '#F3F4F6',
                                                                borderLeft: '2px solid #111827'
                                                            },
                                                            '&:hover': {
                                                                backgroundColor: '#F9FAFB'
                                                            }
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 28 }}> {/* Reduzido */}
                                                            <PsychologyIcon
                                                                sx={{
                                                                    fontSize: 18, /* Reduzido */
                                                                    color: currentConversationId === conversation.id ? '#111827' : '#6B7280'
                                                                }}
                                                            />
                                                        </ListItemIcon>

                                                        <ListItemText
                                                            primary={conversation.title}
                                                            secondary={
                                                                // Usando string simples em vez de componente para evitar nesting
                                                                `${conversation.messageCount} msgs • ${formatRelativeTime(conversation.lastMessageAt)}`
                                                            }
                                                            primaryTypographyProps={{
                                                                fontSize: '0.75rem !important',
                                                                fontWeight: 500,
                                                                noWrap: true,
                                                                color: '#374151',
                                                                lineHeight: 1.3
                                                            }}
                                                            secondaryTypographyProps={{
                                                                sx: {
                                                                    mt: 0.3, // Reduzido spacing
                                                                    fontSize: '0.65rem', // Bem pequeno
                                                                    color: '#6B7280',
                                                                    lineHeight: 1.2
                                                                }
                                                            }}
                                                        />

                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedConversationMenu(conversation.id);
                                                                setMenuAnchor(e.currentTarget);
                                                            }}
                                                            sx={{
                                                                opacity: 0.5,
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                );
                            })}

                            {conversations.length === 0 && !searchTerm && (
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        py: 6,
                                        color: '#6B7280'
                                    }}
                                >
                                    <PsychologyIcon sx={{ fontSize: 40, mb: 2, opacity: 0.3 }} />
                                    <Typography variant="body2">
                                        Nenhuma conversa ainda
                                    </Typography>
                                    <Typography variant="caption">
                                        Comece uma nova conversa!
                                    </Typography>
                                </Box>
                            )}

                            {searchTerm && conversations.length === 0 && (
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        py: 6,
                                        color: '#6B7280'
                                    }}
                                >
                                    <SearchIcon sx={{ fontSize: 40, mb: 2, opacity: 0.3 }} />
                                    <Typography variant="body2">
                                        Nenhum resultado encontrado
                                    </Typography>
                                    <Typography variant="caption">
                                        Tente outros termos de busca
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* Área Principal do Chat */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                overflow: 'hidden' /* Adicionado */
            }}>
                {/* Header do Chat */}
                <Box
                    sx={{
                        p: 2.5, /* Reduzido */
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                            Assistente Médico
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Dúvidas clínicas, dosagens e protocolos médicos
                        </Typography>
                    </Box>
                </Box>

                {/* Área das Mensagens */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 2.5, /* Reduzido */
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#FAFBFC'
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
                                color: '#6B7280'
                            }}
                        >
                            <PsychologyIcon sx={{ fontSize: 64, mb: 3, opacity: 0.2, color: '#9CA3AF' }} />
                            <Typography variant="h4" sx={{ mb: 2, fontWeight: 500, color: '#374151' }}>
                                Como posso ajudar?
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, color: '#6B7280' }}>
                                Faça perguntas sobre dosagens, protocolos, diagnósticos diferenciais ou qualquer dúvida clínica.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    "Dosagem de amoxicilina pediátrica",
                                    "Protocolo para IAM",
                                    "Diagnóstico diferencial cefaleia",
                                    "Manejo hipertensão resistente"
                                ].map((suggestion, index) => (
                                    <Chip
                                        key={index}
                                        label={suggestion}
                                        variant="outlined"
                                        clickable
                                        onClick={() => setCurrentMessage(suggestion)}
                                        sx={{
                                            borderColor: '#E5E7EB',
                                            color: '#6B7280',
                                            fontSize: '0.875rem',
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
                            {messages.map((message, index) => (
                                <Fade in={true} key={message.id} timeout={200}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            mb: 2, /* Reduzido */
                                            alignItems: 'flex-start',
                                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        {message.role !== 'user' && (
                                            <Avatar
                                                sx={{
                                                    bgcolor: message.role === 'error' ? '#EF4444' : '#111827',
                                                    width: 32,
                                                    height: 32,
                                                    mr: 2,
                                                    mt: 0.5
                                                }}
                                            >
                                                {message.role === 'error' ? '⚠️' : <PsychologyIcon sx={{ fontSize: 16 }} />}
                                            </Avatar>
                                        )}

                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                maxWidth: '75%',
                                                backgroundColor: message.role === 'user'
                                                    ? '#111827'
                                                    : message.role === 'error'
                                                        ? '#FEF2F2'
                                                        : 'white',
                                                color: message.role === 'user' ? 'white' : '#374151',
                                                borderRadius: message.role === 'user'
                                                    ? '16px 16px 4px 16px'
                                                    : '16px 16px 16px 4px',
                                                border: '1px solid',
                                                borderColor: message.role === 'user'
                                                    ? '#111827'
                                                    : message.role === 'error'
                                                        ? '#FECACA'
                                                        : '#F3F4F6'
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: 1.6,
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                {message.content}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        opacity: 0.6,
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {formatMessageTime(message.timestamp)}
                                                </Typography>
                                                {message.tokensUsed && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            opacity: 0.5
                                                        }}
                                                    >
                                                        {message.tokensUsed} tokens
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>

                                        {message.role === 'user' && (
                                            <Avatar
                                                sx={{
                                                    bgcolor: '#6B7280',
                                                    width: 32,
                                                    height: 32,
                                                    ml: 2,
                                                    mt: 0.5
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 16 }} />
                                            </Avatar>
                                        )}
                                    </Box>
                                </Fade>
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
                                            bgcolor: '#111827',
                                            width: 32,
                                            height: 32,
                                            mr: 2
                                        }}
                                    >
                                        <PsychologyIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            backgroundColor: 'white',
                                            borderRadius: '16px 16px 16px 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '1px solid #F3F4F6'
                                        }}
                                    >
                                        <CircularProgress size={16} sx={{ mr: 2, color: '#6B7280' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Analisando...
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>
                    )}
                </Box>

                {/* Área de Input */}
                <Box sx={{
                    p: 2.5, /* Reduzido */
                    backgroundColor: 'white',
                    borderTop: '1px solid #F3F4F6'
                }}>
                    {error && (
                        <Alert
                            severity={error.includes('removidas') ? 'success' : 'error'}
                            sx={{ mb: 2, fontSize: '0.875rem' }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: '#FAFBFC',
                                    borderColor: '#E5E7EB',
                                    '&:hover': {
                                        backgroundColor: '#F9FAFB'
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'white',
                                        borderColor: '#111827'
                                    }
                                }
                            }}
                        />
                        <IconButton
                            onClick={() => setShowVoiceRecorder(true)}
                            disabled={isLoading}
                            sx={{
                                bgcolor: '#22C55E',
                                color: 'white',
                                width: 44,
                                height: 44,
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
                                bgcolor: '#111827',
                                color: 'white',
                                width: 44,
                                height: 44,
                                '&:hover': {
                                    bgcolor: '#1F2937'
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
                </Box>
            </Box>

            {/* Menu de Contexto para Conversas */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                PaperProps={{
                    sx: { borderRadius: '8px', minWidth: 140 }
                }}
            >
                <MenuItem
                    onClick={() => deleteConversation(selectedConversationMenu)}
                    sx={{ color: 'error.main', fontSize: '0.875rem' }}
                >
                    <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
                    Excluir
                </MenuItem>
            </Menu>

            {/* Dialog de Upgrade */}
            <AccessDeniedDialog
                open={upgradeDialogOpen}
                onClose={() => setUpgradeDialogOpen(false)}
                feature="Doctor AI"
                usageCount={freeUsageCount}
                usageLimit={FREE_USAGE_LIMIT}
            />

            {/* Floating Voice Recorder */}
            {showVoiceRecorder && (
                <FloatingVoiceRecorder
                    onTranscription={handleVoiceTranscription}
                    onClose={() => setShowVoiceRecorder(false)}
                    position="top-right"
                    context="medical-chat"
                />
            )}
        </Box>
    );
};


export default DoctorAITemplate;