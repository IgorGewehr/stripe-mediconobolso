"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Grid,
    Divider,
    Collapse,
    useTheme,
    useMediaQuery,
    Avatar,
    Stack,
    Paper,
    Fade,
    Tooltip
} from '@mui/material';
import {
    Close as CloseIcon,
    CreditCard as CreditCardIcon,
    Receipt as ReceiptIcon,
    Cancel as CancelIcon,
    Upgrade as UpgradeIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Payment as PaymentIcon,
    Info as InfoIcon,
    Star as StarIcon,
    WorkspacePremium as CrownIcon,
    Diamond as DiamondIcon,
    AccountCircle as AccountCircleIcon,
    SwapHoriz as SwapHorizIcon,
    Email as EmailIcon,
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useAuth } from '../authProvider';
import UpgradeModal from '../organismsComponents/upgradeModal';

// Configuração dos planos com ícones e cores melhoradas
const plansConfig = {
    free: {
        name: 'Gratuito',
        price: 'R$ 0',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: <AccountCircleIcon />,
        description: 'Acesso básico'
    },
    monthly: {
        name: 'Essencial',
        price: 'R$ 127',
        period: '/mês',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: <StarIcon />,
        description: 'Ideal para começar'
    },
    quarterly: {
        name: 'Profissional',
        price: 'R$ 345',
        period: '/trimestre',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: <CrownIcon />,
        description: 'Mais popular',
        popular: true,
        savings: '9% de economia'
    },
    annual: {
        name: 'Premium',
        price: 'R$ 1143',
        period: '/ano',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: <DiamondIcon />,
        description: 'Máximo valor',
        savings: '25% de economia'
    }
};

// 🔧 FUNÇÕES AUXILIARES PARA DATAS (mantidas do original)
const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (dateValue, locale = 'pt-BR') => {
    const date = parseDate(dateValue);
    if (!date) return 'Data inválida';
    try {
        return date.toLocaleDateString(locale);
    } catch (error) {
        console.warn('Erro ao formatar data:', error);
        return 'Data inválida';
    }
};

// Função auxiliar para obter configuração segura do plano
const getSafePlanConfig = (planType) => {
    // Se o planType existir no plansConfig, retorna ele
    if (planType && plansConfig[planType]) {
        return plansConfig[planType];
    }
    // Caso contrário, retorna o plano free como fallback
    return plansConfig.free;
};

// Componente para Status Badge
const StatusBadge = ({ status, paymentMethod }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'active':
                return {
                    label: 'Ativo',
                    color: '#22C55E',
                    bgColor: 'rgba(34, 197, 94, 0.1)',
                    icon: <CheckCircleIcon />
                };
            case 'canceled':
                return {
                    label: 'Cancelado',
                    color: '#EF4444',
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    icon: <CancelIcon />
                };
            case 'past_due':
                return {
                    label: 'Vencido',
                    color: '#F59E0B',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    icon: <WarningIcon />
                };
            case 'incomplete':
                return {
                    label: 'Pendente',
                    color: '#8B5CF6',
                    bgColor: 'rgba(139, 92, 246, 0.1)',
                    icon: <ScheduleIcon />
                };
            case 'free':
                return {
                    label: 'Gratuito',
                    color: '#6B7280',
                    bgColor: 'rgba(107, 114, 128, 0.1)',
                    icon: null
                };
            default:
                return {
                    label: 'Desconhecido',
                    color: '#6B7280',
                    bgColor: 'rgba(107, 114, 128, 0.1)',
                    icon: <InfoIcon />
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: 2,
            backgroundColor: config.bgColor,
            border: `1px solid ${config.color}20`
        }}>
            {config.icon && React.cloneElement(config.icon, {
                sx: { fontSize: 16, color: config.color }
            })}
            <Typography variant="body2" sx={{
                color: config.color,
                fontWeight: 600,
                fontSize: '0.875rem'
            }}>
                {config.label}
            </Typography>
        </Box>
    );
};

// Componente para Histórico de Pagamentos Melhorado
const PaymentHistory = ({ history = [], loading = false }) => {
    const [expanded, setExpanded] = useState(false);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ color: '#F9B934' }} />
            </Box>
        );
    }

    if (!history || history.length === 0) {
        return (
            <Box sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary'
            }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2">
                    Nenhum histórico de pagamento encontrado
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Button
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                    mb: 2,
                    color: '#F9B934',
                    '&:hover': {
                        backgroundColor: 'rgba(249, 185, 52, 0.08)'
                    }
                }}
            >
                Histórico de Pagamentos ({history.length})
            </Button>

            <Collapse in={expanded}>
                <Stack spacing={2}>
                    {history.slice(0, 5).map((payment, index) => {
                        const paymentDate = parseDate(payment.date);
                        const paidDate = parseDate(payment.paidDate);
                        const isPaid = payment.status === 'paid';

                        return (
                            <Paper key={payment.id || index} sx={{
                                p: 2,
                                backgroundColor: '#FAFAFA',
                                border: '1px solid #E5E5E5',
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: '#F5F5F5',
                                    borderColor: '#D1D1D1'
                                }
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: isPaid ? '#22C55E20' : '#F59E0B20'
                                        }}>
                                            <PaymentIcon sx={{
                                                fontSize: 16,
                                                color: isPaid ? '#22C55E' : '#F59E0B'
                                            }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {paymentDate ? formatDate(paymentDate) : 'Data não disponível'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StatusBadge
                                            status={isPaid ? 'active' : 'incomplete'}
                                        />
                                        {payment.downloadUrl && (
                                            <Tooltip title="Baixar fatura">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => window.open(payment.downloadUrl, '_blank')}
                                                    sx={{
                                                        color: '#F9B934',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(249, 185, 52, 0.08)'
                                                        }
                                                    }}
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                                {paidDate && (
                                    <Typography variant="caption" color="success.main">
                                        Pago em {formatDate(paidDate)}
                                    </Typography>
                                )}
                            </Paper>
                        );
                    })}
                </Stack>
            </Collapse>
        </Box>
    );
};

// Componente para Card de Plano no Modal
const PlanOptionCard = ({ plan, planKey, isSelected, onSelect, subscriptionData }) => {
    const canSelectBoleto = ['quarterly', 'annual'].includes(planKey);
    const isCurrentPlan = subscriptionData?.planType === planKey;

    return (
        <Card sx={{
            cursor: isCurrentPlan ? 'default' : 'pointer',
            border: isSelected ? `2px solid ${plan.color}` : '1px solid #E5E5E5',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            opacity: isCurrentPlan ? 0.7 : 1,
            position: 'relative',
            '&:hover': !isCurrentPlan ? {
                borderColor: plan.color,
                boxShadow: `0 4px 12px ${plan.color}20`,
                transform: 'translateY(-2px)'
            } : {},
            backgroundColor: isSelected ? `${plan.bgColor}` : 'white'
        }}
              onClick={!isCurrentPlan ? onSelect : undefined}>

            {plan.popular && (
                <Box sx={{
                    position: 'absolute',
                    top: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: plan.color,
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: '0 0 8px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 1
                }}>
                    MAIS POPULAR
                </Box>
            )}

            {isCurrentPlan && (
                <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#22C55E',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 1
                }}>
                    ATUAL
                </Box>
            )}

            <CardContent sx={{ p: 3, pt: plan.popular ? 4 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{
                        backgroundColor: plan.bgColor,
                        color: plan.color,
                        width: 40,
                        height: 40
                    }}>
                        {plan.icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: plan.color }}>
                            {plan.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {plan.description}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {plan.price}
                        {plan.period && (
                            <Typography variant="body2" component="span" color="text.secondary">
                                {plan.period}
                            </Typography>
                        )}
                    </Typography>
                    {plan.savings && (
                        <Typography variant="caption" sx={{
                            color: '#22C55E',
                            fontWeight: 600,
                            backgroundColor: '#22C55E20',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            display: 'inline-block',
                            mt: 0.5
                        }}>
                            {plan.savings}
                        </Typography>
                    )}
                </Box>

                {canSelectBoleto && (
                    <Box sx={{
                        backgroundColor: '#FFF3CD',
                        border: '1px solid #F9B934',
                        borderRadius: 1,
                        p: 1,
                        mb: 2
                    }}>
                        <Typography variant="caption" sx={{
                            color: '#856404',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                        }}>
                            <ReceiptIcon sx={{ fontSize: 14 }} />
                            Pagamento por boleto disponível
                        </Typography>
                    </Box>
                )}

                {!isCurrentPlan && (
                    <Button
                        variant={isSelected ? "contained" : "outlined"}
                        fullWidth
                        sx={{
                            mt: 'auto',
                            py: 1,
                            fontWeight: 600,
                            backgroundColor: isSelected ? plan.color : 'transparent',
                            borderColor: plan.color,
                            color: isSelected ? 'white' : plan.color,
                            '&:hover': {
                                backgroundColor: plan.color,
                                color: 'white'
                            }
                        }}
                    >
                        {isSelected ? 'SELECIONADO' : 'SELECIONAR'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

// Componente Principal
const SubscriptionManagerDialog = ({ open, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    // Estados
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showPlanOptions, setShowPlanOptions] = useState(false);
    const [selectedNewPlan, setSelectedNewPlan] = useState('');

    // 🔧 FUNÇÃO PARA PROCESSAR DADOS RECEBIDOS DA API (mantida do original)
    const processSubscriptionData = (data) => {
        try {
            if (data.nextBillingDate) {
                data.nextBillingDate = parseDate(data.nextBillingDate);
            }
            if (data.nextBoletoDate) {
                data.nextBoletoDate = parseDate(data.nextBoletoDate);
            }
            if (data.lastPaymentDate) {
                data.lastPaymentDate = parseDate(data.lastPaymentDate);
            }

            if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
                data.paymentHistory = data.paymentHistory.map(payment => ({
                    ...payment,
                    date: parseDate(payment.date),
                    paidDate: parseDate(payment.paidDate),
                    amount: typeof payment.amount === 'number' ? payment.amount : 0
                }));
            }

            return data;
        } catch (error) {
            console.warn('Erro ao processar dados da assinatura:', error);
            return data;
        }
    };

    // Carregar dados da assinatura
    const loadSubscriptionData = useCallback(async () => {
        if (!user?.uid || !open) return;

        try {
            setLoading(true);
            setError('');

            const response = await fetch(`/api/subscription-status?uid=${user.uid}`);
            const rawData = await response.json();

            if (!response.ok) {
                throw new Error(rawData.message || 'Erro ao carregar dados da assinatura');
            }

            const processedData = processSubscriptionData(rawData);
            setSubscriptionData(processedData);

        } catch (err) {
            console.error('Erro ao carregar subscription data:', err);
            setError(err.message || 'Erro ao carregar dados da assinatura');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, open]);

    // Carregar dados quando o modal abrir
    useEffect(() => {
        if (open) {
            loadSubscriptionData();
        }
    }, [open, loadSubscriptionData]);

    // Cancelar assinatura
    const handleCancelSubscription = async () => {
        if (!user?.uid) return;

        try {
            setActionLoading(true);
            setError('');

            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    reason: 'user_requested'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao cancelar assinatura');
            }

            const accessEndsDate = parseDate(data.accessEndsAt);
            setSuccess('Assinatura cancelada com sucesso! Você terá acesso até ' +
                (accessEndsDate ? formatDate(accessEndsDate) : 'o final do período atual'));
            setShowCancelConfirm(false);

            setTimeout(() => {
                loadSubscriptionData();
            }, 2000);

        } catch (err) {
            console.error('Erro ao cancelar assinatura:', err);
            setError(err.message || 'Erro ao cancelar assinatura');
        } finally {
            setActionLoading(false);
        }
    };

    // Gerar novo boleto
    const handleGenerateBoleto = async (planType) => {
        if (!user?.uid) return;

        try {
            setActionLoading(true);
            setError('');

            const response = await fetch('/api/generate-boleto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    planType: planType
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao gerar boleto');
            }

            setSuccess('Boleto gerado com sucesso!');

            if (data.boletoUrl) {
                setTimeout(() => {
                    window.open(data.boletoUrl, '_blank');
                }, 1000);
            }

            setTimeout(() => {
                loadSubscriptionData();
            }, 2000);

        } catch (err) {
            console.error('Erro ao gerar boleto:', err);
            setError(err.message || 'Erro ao gerar boleto');
        } finally {
            setActionLoading(false);
        }
    };

    // Limpar mensagens
    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    // Fechar modal
    const handleClose = () => {
        clearMessages();
        setShowPlanOptions(false);
        setSelectedNewPlan('');
        onClose();
    };

    // Definir configuração do plano atual - FIX APLICADO AQUI
    const currentPlanConfig = getSafePlanConfig(subscriptionData?.planType);

    // Renderização do loading inicial
    if (!subscriptionData && loading) {
        return (
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backgroundColor: '#FAFAFA'
                    }
                }}
            >
                <DialogContent>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8
                    }}>
                        <CircularProgress size={48} sx={{ color: '#F9B934', mb: 3 }} />
                        <Typography variant="h6" color="text.secondary">
                            Carregando informações da assinatura...
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        backgroundColor: '#FAFAFA',
                        maxHeight: '95vh'
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 3,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E5E5E5'
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Gerenciar Assinatura
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Visualize e gerencie seu plano atual
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            backgroundColor: '#F5F5F5',
                            '&:hover': { backgroundColor: '#E5E5E5' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    {/* Mensagens de erro/sucesso */}
                    {error && (
                        <Box sx={{ p: 3, pb: 0 }}>
                            <Alert
                                severity="error"
                                onClose={clearMessages}
                                sx={{ borderRadius: 2 }}
                            >
                                {error}
                            </Alert>
                        </Box>
                    )}

                    {success && (
                        <Box sx={{ p: 3, pb: 0 }}>
                            <Alert
                                severity="success"
                                onClose={clearMessages}
                                sx={{ borderRadius: 2 }}
                            >
                                {success}
                            </Alert>
                        </Box>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                            <CircularProgress size={48} sx={{ color: '#F9B934' }} />
                        </Box>
                    ) : (
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Card do Plano Atual */}
                                <Grid item xs={12} lg={8}>
                                    <Card sx={{
                                        backgroundColor: 'white',
                                        borderRadius: 3,
                                        border: `2px solid ${currentPlanConfig.color}20`,
                                        position: 'relative',
                                        overflow: 'visible'
                                    }}>
                                        <CardContent sx={{ p: 4 }}>
                                            {/* Header do Card */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                mb: 3
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{
                                                        backgroundColor: currentPlanConfig.bgColor,
                                                        color: currentPlanConfig.color,
                                                        width: 64,
                                                        height: 64
                                                    }}>
                                                        {currentPlanConfig.icon}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 'bold',
                                                            color: currentPlanConfig.color,
                                                            mb: 0.5
                                                        }}>
                                                            {currentPlanConfig.name}
                                                        </Typography>
                                                        <Typography variant="h6" color="text.secondary">
                                                            {currentPlanConfig.price}
                                                            {currentPlanConfig.period && (
                                                                <span style={{ fontSize: '0.8em' }}>
                                                                    {currentPlanConfig.period}
                                                                </span>
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <StatusBadge
                                                        status={subscriptionData?.subscriptionStatus}
                                                        paymentMethod={subscriptionData?.paymentMethod}
                                                    />
                                                    <Tooltip title="Atualizar dados">
                                                        <IconButton
                                                            onClick={loadSubscriptionData}
                                                            disabled={loading}
                                                            size="small"
                                                            sx={{
                                                                color: '#F9B934',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(249, 185, 52, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            <RefreshIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            {/* Informações de Pagamento */}
                                            <Stack spacing={2}>
                                                {subscriptionData?.paymentMethod && (
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 2,
                                                        backgroundColor: '#F8F9FA',
                                                        borderRadius: 2
                                                    }}>
                                                        {subscriptionData.paymentMethod === 'card' ? (
                                                            <CreditCardIcon sx={{ color: '#3B82F6' }} />
                                                        ) : (
                                                            <ReceiptIcon sx={{ color: '#8B5CF6' }} />
                                                        )}
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {subscriptionData.paymentMethod === 'card'
                                                                ? 'Cartão de Crédito'
                                                                : 'Boleto Bancário'
                                                            }
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* Próximo vencimento */}
                                                {subscriptionData?.nextBillingDate && (
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 2,
                                                        backgroundColor: '#F0F9FF',
                                                        borderRadius: 2,
                                                        border: '1px solid #DBEAFE'
                                                    }}>
                                                        <CalendarTodayIcon sx={{ color: '#3B82F6' }} />
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Próximo vencimento
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                {formatDate(subscriptionData.nextBillingDate)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}

                                                {/* Próximo boleto */}
                                                {subscriptionData?.nextBoletoDate && (
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 2,
                                                        backgroundColor: '#FEF3C7',
                                                        borderRadius: 2,
                                                        border: '1px solid #F9B934'
                                                    }}>
                                                        <ReceiptIcon sx={{ color: '#F59E0B' }} />
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Próximo boleto disponível em
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                {formatDate(subscriptionData.nextBoletoDate)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Ações Rápidas */}
                                <Grid item xs={12} lg={4}>
                                    <Card sx={{
                                        backgroundColor: 'white',
                                        borderRadius: 3,
                                        height: 'fit-content'
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{
                                                fontWeight: 700,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <UpgradeIcon sx={{ color: '#F9B934' }} />
                                                Ações Disponíveis
                                            </Typography>

                                            <Stack spacing={2}>
                                                {/* Upgrade para usuários gratuitos */}
                                                {subscriptionData?.canUpgrade && (
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        startIcon={<UpgradeIcon />}
                                                        onClick={() => setShowUpgradeModal(true)}
                                                        disabled={actionLoading}
                                                        sx={{
                                                            backgroundColor: '#F9B934',
                                                            color: 'black',
                                                            fontWeight: 600,
                                                            py: 1.5,
                                                            '&:hover': {
                                                                backgroundColor: '#E5A830'
                                                            }
                                                        }}
                                                    >
                                                        Assinar Plano Premium
                                                    </Button>
                                                )}

                                                {/* Mudar plano para usuários pagos */}
                                                {!subscriptionData?.canUpgrade && subscriptionData?.subscriptionStatus === 'active' && (
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<SwapHorizIcon />}
                                                        onClick={() => setShowPlanOptions(!showPlanOptions)}
                                                        disabled={actionLoading}
                                                        sx={{
                                                            borderColor: '#F9B934',
                                                            color: '#F9B934',
                                                            fontWeight: 600,
                                                            py: 1.5,
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(249, 185, 52, 0.08)',
                                                                borderColor: '#E5A830'
                                                            }
                                                        }}
                                                    >
                                                        Alterar Plano
                                                    </Button>
                                                )}

                                                {/* Gerar boleto */}
                                                {subscriptionData?.canGenerateBoleto && (
                                                    <>
                                                        <Divider sx={{ my: 1 }} />
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                                            Gerar novo boleto:
                                                        </Typography>

                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            size="small"
                                                            startIcon={<ReceiptIcon />}
                                                            onClick={() => handleGenerateBoleto('quarterly')}
                                                            disabled={actionLoading}
                                                            sx={{
                                                                borderColor: '#8B5CF6',
                                                                color: '#8B5CF6',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(139, 92, 246, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            Trimestral - R$ 345
                                                        </Button>

                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            size="small"
                                                            startIcon={<ReceiptIcon />}
                                                            onClick={() => handleGenerateBoleto('annual')}
                                                            disabled={actionLoading}
                                                            sx={{
                                                                borderColor: '#F59E0B',
                                                                color: '#F59E0B',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(245, 158, 11, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            Anual - R$ 1.143
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Cancelar assinatura */}
                                                {subscriptionData?.canCancel && (
                                                    <>
                                                        <Divider sx={{ my: 1 }} />
                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            color="error"
                                                            size="small"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => setShowCancelConfirm(true)}
                                                            disabled={actionLoading}
                                                        >
                                                            Cancelar Assinatura
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Aviso para boleto pendente */}
                                                {subscriptionData?.pendingBoleto && (
                                                    <Alert
                                                        severity="warning"
                                                        icon={<WarningIcon />}
                                                        sx={{ fontSize: '0.875rem' }}
                                                    >
                                                        Você possui um boleto pendente.
                                                        Verifique seu email ou gere um novo.
                                                    </Alert>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Opções de Mudança de Plano */}
                                {showPlanOptions && (
                                    <Grid item xs={12}>
                                        <Fade in={showPlanOptions}>
                                            <Card sx={{
                                                backgroundColor: 'white',
                                                borderRadius: 3,
                                                border: '2px solid #F9B934'
                                            }}>
                                                <CardContent sx={{ p: 4 }}>
                                                    <Typography variant="h6" sx={{
                                                        fontWeight: 700,
                                                        mb: 3,
                                                        color: '#F9B934'
                                                    }}>
                                                        Escolha seu novo plano
                                                    </Typography>

                                                    <Grid container spacing={3}>
                                                        {Object.entries(plansConfig)
                                                            .filter(([key]) => key !== 'free')
                                                            .map(([planKey, plan]) => (
                                                                <Grid item xs={12} sm={6} md={4} key={planKey}>
                                                                    <PlanOptionCard
                                                                        plan={plan}
                                                                        planKey={planKey}
                                                                        isSelected={selectedNewPlan === planKey}
                                                                        onSelect={() => setSelectedNewPlan(planKey)}
                                                                        subscriptionData={subscriptionData}
                                                                    />
                                                                </Grid>
                                                            ))}
                                                    </Grid>

                                                    {selectedNewPlan && selectedNewPlan !== subscriptionData?.planType && (
                                                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    setShowPlanOptions(false);
                                                                    setSelectedNewPlan('');
                                                                }}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => {
                                                                    setShowUpgradeModal(true);
                                                                    setShowPlanOptions(false);
                                                                }}
                                                                sx={{
                                                                    backgroundColor: '#F9B934',
                                                                    color: 'black',
                                                                    '&:hover': {
                                                                        backgroundColor: '#E5A830'
                                                                    }
                                                                }}
                                                            >
                                                                Confirmar Mudança
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Fade>
                                    </Grid>
                                )}

                                {/* Histórico de Pagamentos */}
                                {subscriptionData?.paymentHistory && subscriptionData.paymentHistory.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card sx={{
                                            backgroundColor: 'white',
                                            borderRadius: 3
                                        }}>
                                            <CardContent sx={{ p: 4 }}>
                                                <Typography variant="h6" sx={{
                                                    fontWeight: 700,
                                                    mb: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <HistoryIcon sx={{ color: '#6B7280' }} />
                                                    Histórico de Pagamentos
                                                </Typography>
                                                <PaymentHistory
                                                    history={subscriptionData.paymentHistory}
                                                    loading={loading}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de confirmação para cancelamento */}
            <Dialog
                open={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <WarningIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Confirmar Cancelamento
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        Tem certeza que deseja cancelar sua assinatura?
                        Você perderá o acesso às funcionalidades premium no final do período atual.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            onClick={() => setShowCancelConfirm(false)}
                        >
                            Manter Assinatura
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleCancelSubscription}
                            disabled={actionLoading}
                            startIcon={actionLoading ? <CircularProgress size={16} /> : <CancelIcon />}
                        >
                            Confirmar Cancelamento
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* Modal de upgrade */}
            {showUpgradeModal && (
                <UpgradeModal
                    open={showUpgradeModal}
                    onClose={() => {
                        setShowUpgradeModal(false);
                        setSelectedNewPlan('');
                    }}
                    onSuccess={() => {
                        setShowUpgradeModal(false);
                        setSelectedNewPlan('');
                        setSuccess('Assinatura atualizada com sucesso!');
                        setTimeout(() => loadSubscriptionData(), 2000);
                    }}
                    selectedPlan={selectedNewPlan || "quarterly"}
                />
            )}
        </>
    );
};

export default SubscriptionManagerDialog;