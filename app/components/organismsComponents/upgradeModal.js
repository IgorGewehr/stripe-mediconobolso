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
    Paper,
    CircularProgress,
    Alert,
    Checkbox,
    FormControlLabel,
    Radio,
    RadioGroup,
    FormLabel,
    Divider,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useAuth } from '../authProvider';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Tema consistente
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
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
});

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': { color: '#999999' },
            backgroundColor: 'transparent',
        },
        invalid: {
            color: '#F44336',
            iconColor: '#F44336',
        },
    },
};

// Dados dos planos
const plansData = {
    monthly: {
        id: 'monthly',
        name: 'Pro',
        price: 'R$127',
        pricePerMonth: 'R$127/mês',
        period: '/mês',
        features: [
            'Acesso completo a todas as funcionalidades',
            'Análise de IA para exames e relatórios',
            'Pacientes ilimitados',
            'Suporte prioritário'
        ],
        priceId: 'price_1QyKrNI2qmEooUtqKfgYIemz'
    },
    annual: {
        id: 'annual',
        name: 'Especialista',
        price: 'R$1143',
        pricePerMonth: 'R$95,25/mês',
        period: '/ano',
        popular: true,
        features: [
            'Acesso completo a todas as funcionalidades',
            'Análise de IA para exames e relatórios',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Economia de 25% em relação ao plano mensal'
        ],
        priceId: 'price_1QyKwWI2qmEooUtqOJ9lCFBl'
    }
};

// Componente de seleção de método de pagamento
const PaymentMethodSelector = ({ paymentMethod, onPaymentMethodChange }) => {
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
                <Paper sx={{
                    backgroundColor: paymentMethod === 'card' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                    border: paymentMethod === 'card' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }} onClick={() => onPaymentMethodChange('card')}>
                    <FormControlLabel
                        value="card"
                        control={<Radio sx={{ color: '#F9B934' }} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CreditCardIcon sx={{ color: '#F9B934' }} />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Cartão de Crédito
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                        Pagamento instantâneo • Acesso imediato
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                    />
                </Paper>

                <Paper sx={{
                    backgroundColor: paymentMethod === 'boleto' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                    border: paymentMethod === 'boleto' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }} onClick={() => onPaymentMethodChange('boleto')}>
                    <FormControlLabel
                        value="boleto"
                        control={<Radio sx={{ color: '#F9B934' }} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ReceiptIcon sx={{ color: '#F9B934' }} />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Boleto Bancário
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                        Vencimento em 3 dias • Acesso após confirmação
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
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
            backgroundColor: '#1F1F1F',
            color: 'white',
            borderRadius: 2,
            border: isSelected ? '2px solid #F9B934' : '1px solid #3F3F3F',
            position: 'relative',
            p: 2,
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            boxShadow: isSelected ? '0 8px 16px rgba(249, 185, 52, 0.2)' : 'none',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
            }
        }}
               onClick={onSelect}
               elevation={isSelected ? 8 : 1}>

            {plan.popular && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    backgroundColor: '#F9B934', color: 'black',
                    fontSize: '0.8rem', fontWeight: 'bold',
                    py: 0.5, px: 1, textAlign: 'center', zIndex: 1
                }}>
                    MAIS POPULAR
                </Box>
            )}

            <Box sx={{ p: 1, flexGrow: 1, pt: plan.popular ? 3 : 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    {plan.price}
                    <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>
                        {plan.period}
                    </Typography>
                </Typography>

                <Typography variant="h6" sx={{ mb: 2 }}>
                    {plan.name}
                </Typography>

                <Typography variant="body1" sx={{
                    color: '#F9B934', mb: 2, fontWeight: 'bold', fontSize: '1rem',
                    border: '1px dashed #F9B934', p: 1, borderRadius: 1, textAlign: 'center'
                }}>
                    {plan.pricePerMonth}
                </Typography>

                {plan.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <CheckIcon sx={{ fontSize: '1rem', color: '#F9B934', mr: 1, mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: 'grey.300', fontSize: '0.9rem' }}>
                            {feature}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Button variant="contained" fullWidth sx={{
                py: 1.5, borderRadius: 1,
                backgroundColor: isSelected ? '#F9B934' : '#2F2F2F',
                color: isSelected ? 'black' : 'white',
                fontWeight: 'bold',
                '&:hover': {
                    backgroundColor: isSelected ? '#E5A830' : '#3F3F3F',
                },
                marginTop: 'auto'
            }}>
                {isSelected ? 'SELECIONADO' : 'ESCOLHER PLANO'}
            </Button>
        </Paper>
    );
};

// Componente principal do formulário de upgrade
function UpgradeForm({ onClose, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();

    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardholderName, setCardholderName] = useState(user?.fullName || '');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

        setIsProcessing(true);
        setError('');

        try {
            // Usar dados do usuário atual
            const userData = {
                uid: user.uid,
                email: user.email,
                fullName: user.fullName || cardholderName,
                cpf: user.cpf || '', // Usar CPF existente ou vazio
                address: user.address || {} // Usar endereço existente ou vazio
            };

            console.log('🔄 Processando upgrade para usuário:', userData);

            // Chamar API específica para upgrade
            const response = await fetch('/api/upgrade-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    uid: user.uid,
                    email: user.email,
                    name: userData.fullName,
                    cpf: userData.cpf,
                    paymentMethod: paymentMethod,
                    address: userData.address,
                    isUpgrade: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar assinatura');
            }

            const data = await response.json();
            const { subscriptionId, clientSecret, boletoUrl } = data;

            if (paymentMethod === 'boleto') {
                if (boletoUrl) {
                    setSuccess('Boleto gerado com sucesso! Abrindo em nova aba...');
                    setTimeout(() => {
                        window.open(boletoUrl, '_blank');
                        onSuccess?.();
                    }, 1000);
                } else {
                    setSuccess('Boleto está sendo processado. Você receberá um email com as instruções.');
                    setTimeout(() => onSuccess?.(), 2000);
                }
            } else if (clientSecret) {
                // Confirmar pagamento via cartão
                const { error: paymentError } = await stripe.confirmCardPayment(
                    clientSecret,
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

                setSuccess('Pagamento processado com sucesso! Sua conta será atualizada em instantes.');
                setTimeout(() => onSuccess?.(), 2000);
            }

        } catch (error) {
            console.error('Erro no upgrade:', error);
            setError(error.message || 'Ocorreu um erro durante o processamento');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedPlan, paymentMethod, cardholderName, termsAccepted, stripe, elements, user, onSuccess]);

    return (
        <Box component="form" onSubmit={handleSubmitUpgrade} sx={{ p: 3 }}>
            {/* Seleção de plano */}
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Escolha seu plano:
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
                {Object.values(plansData).map((plan) => (
                    <Grid item xs={12} sm={6} key={plan.id}>
                        <PlanCard
                            plan={plan}
                            isSelected={selectedPlan === plan.id}
                            onSelect={() => setSelectedPlan(plan.id)}
                        />
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 3, borderColor: '#3F3F3F' }} />

            {/* Método de pagamento */}
            <PaymentMethodSelector
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
            />

            {/* Campos específicos para cartão */}
            {paymentMethod === 'card' && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Nome no cartão
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: '#2F2F2F',
                        borderRadius: 1,
                        border: '1px solid #5F5F5F',
                        mb: 2
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

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Número do cartão
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: '#2F2F2F',
                        borderRadius: 1,
                        border: '1px solid #5F5F5F',
                        mb: 2
                    }}>
                        <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Validade
                            </Typography>
                            <Box sx={{
                                p: 2,
                                backgroundColor: '#2F2F2F',
                                borderRadius: 1,
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
                                borderRadius: 1,
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
                    backgroundColor: 'rgba(249, 185, 52, 0.1)',
                    border: '1px solid #F9B934',
                    borderRadius: 2,
                    p: 3,
                    mb: 3
                }}>
                    <Typography variant="h6" sx={{ color: '#F9B934', mb: 2, fontWeight: 'bold' }}>
                        📄 Pagamento por Boleto
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        • Boleto será gerado após confirmação
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                        • Vencimento em 3 dias úteis
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                        • Acesso será liberado após confirmação do pagamento
                    </Typography>
                </Box>
            )}

            {/* Resumo do pedido */}
            <Paper sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(249, 185, 52, 0.1)',
                borderRadius: 1
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {plansData[selectedPlan]?.price}
                    <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>
                        {plansData[selectedPlan]?.period}
                    </Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#F9B934' }}>
                    via {paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'}
                </Typography>
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
                        Aceito os termos e condições do serviço
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
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                    sx={{
                        backgroundColor: '#F9B934',
                        color: 'black',
                        fontWeight: 'bold',
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
            </Box>
        </Box>
    );
}

// Componente principal do modal
const UpgradeModal = ({ open, onClose, onSuccess }) => {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    return (
        <ThemeProvider theme={theme}>
            <Elements stripe={stripePromise}>
                <Dialog
                    open={open}
                    onClose={onClose}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            backgroundColor: '#0F0F0F',
                            color: 'white',
                            borderRadius: isMobile ? 0 : '16px',
                            maxHeight: '90vh'
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderBottom: '1px solid #3F3F3F'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Upgrade para Premium
                        </Typography>
                        <IconButton
                            onClick={onClose}
                            sx={{ color: 'white' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <DialogContent sx={{ p: 0 }}>
                        <UpgradeForm
                            onClose={onClose}
                            onSuccess={onSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </Elements>
        </ThemeProvider>
    );
};

export default UpgradeModal;