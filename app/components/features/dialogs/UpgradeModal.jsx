"use client";

import React, { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement
} from '@stripe/react-stripe-js';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Grid,
    Alert,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    IconButton,
    useTheme,
    useMediaQuery,
    Paper,
    Divider,
    Radio,
    RadioGroup,
    FormLabel,
    Stack,
    Avatar,
    Chip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    CreditCard as CreditCardIcon,
    Receipt as ReceiptIcon,
    Star as StarIcon,
    EmojiEvents as CrownIcon,
    Diamond as DiamondIcon,
    SavingsOutlined as SavingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../providers/authProvider';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

// Tema atualizado e consistente
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#F9B934',
        },
        background: {
            default: '#0F0F0F',
            paper: '#1F1F1F',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 12
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12
                }
            }
        }
    }
});

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Inter, Arial, sans-serif',
            '::placeholder': { color: '#999999' },
            backgroundColor: 'transparent',
        },
        invalid: {
            color: '#F44336',
            iconColor: '#F44336',
        },
    },
};

// Configuração dos planos atualizada
const plansData = {
    monthly: {
        id: 'monthly',
        name: 'Essencial',
        price: 'R$127',
        pricePerMonth: 'R$127/mês',
        period: '/mês',
        features: [
            'Exames automáticos com IA',
            'Resumo Clínico com IA',
            'Pacientes Ilimitados',
            'Relatórios básicos',
            'Suporte por email'
        ],
        priceId: 'price_1QyKrNI2qmEooUtqKfgYIemz',
        paymentMethods: ['card'],
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: <StarIcon />
    },
    quarterly: {
        id: 'quarterly',
        name: 'Profissional',
        price: 'R$345',
        pricePerMonth: 'R$115/mês',
        period: '/trimestre',
        popular: true,
        features: [
            'Tudo do Essencial',
            'Módulo financeiro completo',
            'Chat com IA médica em tempo real',
            'Relatórios avançados',
            'Integrações básicas',
            'Suporte prioritário'
        ],
        priceId: 'price_1RIH5eI2qmEooUtqsdXyxnEP',
        paymentMethods: ['card', 'boleto'],
        savings: '9% de economia',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: <CrownIcon />
    },
    annual: {
        id: 'annual',
        name: 'Premium',
        price: 'R$1143',
        pricePerMonth: 'R$95,25/mês',
        period: '/ano',
        features: [
            'Tudo do Profissional',
            'Suporte prioritário VIP',
            'Integrações avançadas',
            'Analytics premium',
            'Consultoria incluída',
            'Recursos beta antecipados'
        ],
        priceId: 'price_1QyKwWI2qmEooUtqOJ9lCFBl',
        paymentMethods: ['card', 'boleto'],
        savings: '25% de economia',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: <DiamondIcon />
    }
};

// Componente de seleção de método de pagamento
const PaymentMethodSelector = ({ paymentMethod, onPaymentMethodChange, allowedMethods = ['card', 'boleto'] }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Método de pagamento:
            </FormLabel>
            <RadioGroup
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                sx={{ gap: 2 }}
            >
                {/* Cartão de Crédito */}
                <Paper sx={{
                    backgroundColor: paymentMethod === 'card' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                    border: paymentMethod === 'card' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: allowedMethods.includes('card') ? 1 : 0.5
                }} onClick={() => allowedMethods.includes('card') && onPaymentMethodChange('card')}>
                    <FormControlLabel
                        value="card"
                        control={<Radio sx={{ color: '#F9B934' }} disabled={!allowedMethods.includes('card')} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{
                                    backgroundColor: allowedMethods.includes('card') ? '#F9B93420' : '#6B728020',
                                    color: allowedMethods.includes('card') ? '#F9B934' : '#6B7280',
                                    width: 40,
                                    height: 40
                                }}>
                                    <CreditCardIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" sx={{
                                        color: allowedMethods.includes('card') ? 'white' : '#6B7280',
                                        fontWeight: 'bold'
                                    }}>
                                        Cartão de Crédito
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                        Pagamento instantâneo • Acesso imediato
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                        disabled={!allowedMethods.includes('card')}
                    />
                </Paper>

                {/* Boleto Bancário */}
                <Paper sx={{
                    backgroundColor: paymentMethod === 'boleto' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                    border: paymentMethod === 'boleto' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                    borderRadius: 2,
                    p: 2,
                    cursor: allowedMethods.includes('boleto') ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    opacity: allowedMethods.includes('boleto') ? 1 : 0.5
                }} onClick={() => allowedMethods.includes('boleto') && onPaymentMethodChange('boleto')}>
                    <FormControlLabel
                        value="boleto"
                        control={<Radio sx={{ color: '#F9B934' }} disabled={!allowedMethods.includes('boleto')} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{
                                    backgroundColor: allowedMethods.includes('boleto') ? '#8B5CF620' : '#6B728020',
                                    color: allowedMethods.includes('boleto') ? '#8B5CF6' : '#6B7280',
                                    width: 40,
                                    height: 40
                                }}>
                                    <ReceiptIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" sx={{
                                        color: allowedMethods.includes('boleto') ? 'white' : '#6B7280',
                                        fontWeight: 'bold'
                                    }}>
                                        Boleto Bancário
                                        {!allowedMethods.includes('boleto') && (
                                            <Typography component="span" variant="caption" sx={{
                                                ml: 1,
                                                color: 'orange',
                                                fontWeight: 'normal'
                                            }}>
                                                (Não disponível)
                                            </Typography>
                                        )}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                        {allowedMethods.includes('boleto')
                                            ? 'Vencimento em 3 dias • Acesso após confirmação'
                                            : 'Disponível apenas para planos trimestrais e anuais'
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                        disabled={!allowedMethods.includes('boleto')}
                    />
                </Paper>
            </RadioGroup>
        </Box>
    );
};

// Componente do card de plano
const PlanCard = ({ plan, isSelected, onSelect }) => {
    return (
        <Paper sx={{
            backgroundColor: isSelected ? plan.bgColor : '#1F1F1F',
            color: 'white',
            borderRadius: 3,
            border: isSelected ? `2px solid ${plan.color}` : '1px solid #3F3F3F',
            position: 'relative',
            p: 0,
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            boxShadow: isSelected ? `0 8px 16px ${plan.color}20` : 'none',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 12px ${plan.color}20`,
                borderColor: plan.color
            }
        }}
               onClick={onSelect}
               elevation={isSelected ? 8 : 1}>

            {plan.popular && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: plan.color,
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    py: 0.5,
                    px: 1,
                    textAlign: 'center',
                    zIndex: 1,
                    borderRadius: '12px 12px 0 0'
                }}>
                    MAIS POPULAR
                </Box>
            )}

            <Box sx={{ p: 3, flexGrow: 1, pt: plan.popular ? 4 : 3 }}>
                {/* Ícone e Nome do Plano */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{
                        backgroundColor: `${plan.color}20`,
                        color: plan.color,
                        width: 48,
                        height: 48
                    }}>
                        {plan.icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{
                            fontWeight: 'bold',
                            color: plan.color
                        }}>
                            {plan.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                            {plan.description}
                        </Typography>
                    </Box>
                </Box>

                {/* Preço */}
                <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5
                }}>
                    {plan.price}
                    <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>
                        {plan.period}
                    </Typography>
                </Typography>

                {/* Preço mensal em destaque */}
                {plan.pricePerMonth && (
                    <Box sx={{
                        backgroundColor: `${plan.color}20`,
                        border: `1px solid ${plan.color}`,
                        borderRadius: 2,
                        p: 1.5,
                        mb: 2,
                        textAlign: 'center'
                    }}>
                        <Typography variant="body1" sx={{
                            color: plan.color,
                            fontWeight: 'bold'
                        }}>
                            {plan.pricePerMonth}
                        </Typography>
                    </Box>
                )}

                {/* Badge de economia */}
                {plan.savings && (
                    <Chip
                        icon={<SavingsIcon />}
                        label={plan.savings}
                        size="small"
                        sx={{
                            backgroundColor: '#22C55E20',
                            color: '#22C55E',
                            border: '1px solid #22C55E40',
                            mb: 2,
                            fontWeight: 600
                        }}
                    />
                )}

                {/* Lista de funcionalidades */}
                <Box sx={{ mb: 2 }}>
                    {plan.features.map((feature, idx) => (
                        <Box key={idx} sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            mb: 1.5,
                            gap: 1
                        }}>
                            <CheckCircleIcon sx={{
                                fontSize: 16,
                                color: plan.color,
                                mt: 0.2,
                                flexShrink: 0
                            }} />
                            <Typography variant="body2" sx={{
                                color: 'grey.300',
                                fontSize: '0.9rem',
                                lineHeight: 1.4
                            }}>
                                {feature}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Indicador de métodos de pagamento */}
                <Box sx={{
                    mt: 'auto',
                    pt: 2,
                    borderTop: '1px solid #3F3F3F'
                }}>
                    <Typography variant="caption" sx={{
                        color: 'grey.500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}>
                        {plan.paymentMethods.includes('boleto') ? (
                            <>
                                <CreditCardIcon sx={{ fontSize: 14 }} />
                                <ReceiptIcon sx={{ fontSize: 14 }} />
                                Cartão ou Boleto
                            </>
                        ) : (
                            <>
                                <CreditCardIcon sx={{ fontSize: 14 }} />
                                Apenas Cartão
                            </>
                        )}
                    </Typography>
                </Box>
            </Box>

            {/* Botão de seleção */}
            <Button variant="contained" fullWidth sx={{
                py: 1.5,
                backgroundColor: isSelected ? plan.color : '#2F2F2F',
                color: isSelected ? 'white' : 'grey.400',
                fontWeight: 'bold',
                borderRadius: '0 0 12px 12px',
                '&:hover': {
                    backgroundColor: plan.color,
                    color: 'white'
                },
                marginTop: 'auto'
            }}>
                {isSelected ? 'SELECIONADO' : 'ESCOLHER PLANO'}
            </Button>
        </Paper>
    );
};

// Componente principal do formulário de upgrade
function UpgradeForm({ onClose, onSuccess, selectedPlan: initialPlan = 'quarterly', allowedPaymentMethods = ['card', 'boleto'] }) {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();

    const [selectedPlan, setSelectedPlan] = useState(initialPlan);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardholderName, setCardholderName] = useState(user?.fullName || '');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Determinar métodos de pagamento permitidos para o plano selecionado
    const currentPlanPaymentMethods = plansData[selectedPlan]?.paymentMethods || ['card'];
    const finalAllowedMethods = allowedPaymentMethods.filter(method =>
        currentPlanPaymentMethods.includes(method)
    );

    // Se o método atual não é permitido, resetar para cartão
    React.useEffect(() => {
        if (!finalAllowedMethods.includes(paymentMethod)) {
            setPaymentMethod('card');
        }
    }, [selectedPlan, finalAllowedMethods, paymentMethod]);

    const handleSubmitUpgrade = useCallback(async (e) => {
        e.preventDefault();

        if (!termsAccepted) {
            setError('Você deve aceitar os termos e condições');
            return;
        }

        if (paymentMethod === 'card' && !cardholderName.trim()) {
            setError('Nome do titular do cartão é obrigatório');
            return;
        }

        if (paymentMethod === 'card' && (!stripe || !elements)) {
            setError('Aguarde o carregamento do formulário de pagamento');
            return;
        }

        // Validação adicional: boleto não permitido para plano mensal
        if (selectedPlan === 'monthly' && paymentMethod === 'boleto') {
            setError('Pagamento por boleto não está disponível para o plano mensal');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            console.log('🔄 Processando upgrade para usuário:', {
                uid: user.uid,
                email: user.email,
                plan: selectedPlan,
                paymentMethod
            });

            // Chamar API específica para upgrade
            const response = await fetch('/api/upgrade-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    uid: user.uid,
                    email: user.email,
                    name: user.fullName || cardholderName,
                    cpf: user.cpf || '',
                    paymentMethod: paymentMethod,
                    address: user.address || {},
                    isUpgrade: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar assinatura');
            }

            const data = await response.json();
            console.log('✅ Resposta do upgrade:', data);

            if (paymentMethod === 'boleto') {
                // Processar boleto
                if (data.boletoUrl) {
                    setSuccess('Boleto gerado com sucesso! Abrindo em nova aba...');
                    setTimeout(() => {
                        try {
                            window.open(data.boletoUrl, '_blank');
                        } catch (openError) {
                            console.warn('Erro ao abrir boleto:', openError);
                        }
                        // Chamar callback de sucesso
                        handleUpgradeSuccess();
                    }, 1000);
                } else {
                    setSuccess('Boleto está sendo processado. Você receberá um email com as instruções.');
                    setTimeout(() => handleUpgradeSuccess(), 2000);
                }
            } else {
                // Confirmar pagamento via cartão
                const { error: paymentError } = await stripe.confirmCardPayment(
                    data.clientSecret,
                    {
                        payment_method: {
                            card: elements.getElement(CardNumberElement),
                            billing_details: {
                                name: cardholderName,
                                email: user.email
                            }
                        }
                    }
                );

                if (paymentError) {
                    throw new Error(paymentError.message);
                }

                setSuccess('Upgrade realizado com sucesso! Sua conta será atualizada em instantes.');
                setTimeout(() => handleUpgradeSuccess(), 2000);
            }

        } catch (error) {
            console.error('Erro no upgrade:', error);
            setError(error.message || 'Ocorreu um erro durante o processamento');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedPlan, paymentMethod, cardholderName, termsAccepted, stripe, elements, user]);

    // Função de sucesso aprimorada
    const handleUpgradeSuccess = useCallback(() => {
        // Chamar callback de sucesso do parent
        onSuccess?.();

        // Tracking opcional
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'upgrade_completed', {
                plan_type: selectedPlan,
                payment_method: paymentMethod,
                user_id: user?.uid
            });
        }
    }, [selectedPlan, paymentMethod, user?.uid, onSuccess]);

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    mb: 1,
                    background: 'linear-gradient(45deg, #F9B934, #E5A830)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Escolha seu plano
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Desbloqueie todo o potencial da plataforma
                </Typography>
            </Box>

            {/* Seleção de plano */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {Object.values(plansData).map((plan) => (
                    <Grid item xs={12} sm={4} key={plan.id}>
                        <PlanCard
                            plan={plan}
                            isSelected={selectedPlan === plan.id}
                            onSelect={() => setSelectedPlan(plan.id)}
                        />
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 4, borderColor: '#3F3F3F' }} />

            {/* Método de pagamento */}
            <PaymentMethodSelector
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                allowedMethods={finalAllowedMethods}
            />

            {/* Campos específicos para cartão */}
            {paymentMethod === 'card' && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                        Dados do cartão
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Nome no cartão
                        </Typography>
                        <Box sx={{
                            p: 2,
                            backgroundColor: '#2F2F2F',
                            borderRadius: 2,
                            border: '1px solid #5F5F5F'
                        }}>
                            <input
                                type="text"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                                placeholder="Nome como aparece no cartão"
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none'
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Número do cartão
                        </Typography>
                        <Box sx={{
                            p: 2,
                            backgroundColor: '#2F2F2F',
                            borderRadius: 2,
                            border: '1px solid #5F5F5F'
                        }}>
                            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Validade
                            </Typography>
                            <Box sx={{
                                p: 2,
                                backgroundColor: '#2F2F2F',
                                borderRadius: 2,
                                border: '1px solid #5F5F5F'
                            }}>
                                <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                CVC
                            </Typography>
                            <Box sx={{
                                p: 2,
                                backgroundColor: '#2F2F2F',
                                borderRadius: 2,
                                border: '1px solid #5F5F5F'
                            }}>
                                <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Informações sobre boleto */}
            {paymentMethod === 'boleto' && (
                <Box sx={{
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid #8B5CF6',
                    borderRadius: 2,
                    p: 3,
                    mb: 3
                }}>
                    <Typography variant="h6" sx={{ color: '#8B5CF6', mb: 2, fontWeight: 'bold' }}>
                        📄 Pagamento por Boleto
                    </Typography>
                    <Stack spacing={1}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            • Boleto será gerado após confirmação
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            • Vencimento em 3 dias úteis
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            • Acesso será liberado após confirmação do pagamento
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                            • Você receberá o boleto por email
                        </Typography>
                    </Stack>
                </Box>
            )}

            {/* Resumo do pedido */}
            <Paper sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                p: 3,
                backgroundColor: 'rgba(249, 185, 52, 0.1)',
                borderRadius: 2,
                border: '1px solid #F9B934'
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                        {plansData[selectedPlan]?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {plansData[selectedPlan]?.pricePerMonth}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#F9B934' }}>
                        {plansData[selectedPlan]?.price}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#F9B934' }}>
                        via {paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'}
                    </Typography>
                </Box>
            </Paper>

            {/* Termos */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        sx={{
                            color: 'grey.500',
                            '&.Mui-checked': {
                                color: '#F9B934',
                            },
                        }}
                    />
                }
                label={
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Aceito os{' '}
                        <span style={{ color: '#F9B934', textDecoration: 'underline', cursor: 'pointer' }}>
                            termos e condições
                        </span>
                        {' '}e{' '}
                        <span style={{ color: '#F9B934', textDecoration: 'underline', cursor: 'pointer' }}>
                            política de privacidade
                        </span>
                    </Typography>
                }
                sx={{ mb: 3 }}
            />

            {/* Mensagens de erro/sucesso */}
            {error && (
                <Alert severity="error" sx={{ mb: 2, bgcolor: '#381111', color: 'white' }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2, bgcolor: '#113828', color: 'white' }}>
                    {success}
                </Alert>
            )}

            {/* Botões */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={isProcessing}
                    sx={{
                        borderColor: '#5F5F5F',
                        color: 'white',
                        '&:hover': {
                            borderColor: '#7F7F7F',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!termsAccepted || isProcessing}
                    onClick={handleSubmitUpgrade}
                    sx={{
                        backgroundColor: '#F9B934',
                        color: 'black',
                        fontWeight: 'bold',
                        px: 4,
                        '&:hover': {
                            backgroundColor: '#E5A830',
                        },
                        '&.Mui-disabled': {
                            backgroundColor: '#7F7F7F',
                            color: '#E0E0E0'
                        }
                    }}
                    startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isProcessing
                        ? (paymentMethod === 'boleto' ? 'Gerando boleto...' : 'Processando...')
                        : (paymentMethod === 'boleto' ? 'Gerar Boleto' : 'Finalizar Upgrade')
                    }
                </Button>
            </Stack>
        </Box>
    );
}

// Componente principal do modal
const UpgradeModal = ({
                          open,
                          onClose,
                          onSuccess,
                          selectedPlan = 'quarterly',
                          allowedPaymentMethods = ['card', 'boleto']
                      }) => {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    return (
        <ThemeProvider theme={theme}>
            <Elements stripe={stripePromise}>
                <Dialog
                    open={open}
                    onClose={onClose}
                    maxWidth="lg"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            backgroundColor: '#0F0F0F',
                            color: 'white',
                            borderRadius: isMobile ? 0 : 3,
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
                        borderBottom: '1px solid #3F3F3F'
                    }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Upgrade para Premium
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Desbloqueie todo o potencial da plataforma
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            sx={{
                                color: 'white',
                                backgroundColor: '#2F2F2F',
                                '&:hover': {
                                    backgroundColor: '#3F3F3F'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <DialogContent sx={{ p: 0 }}>
                        <UpgradeForm
                            onClose={onClose}
                            onSuccess={onSuccess}
                            selectedPlan={selectedPlan}
                            allowedPaymentMethods={allowedPaymentMethods}
                        />
                    </DialogContent>
                </Dialog>
            </Elements>
        </ThemeProvider>
    );
};

export default UpgradeModal;