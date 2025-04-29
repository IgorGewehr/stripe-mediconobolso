'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Grid,
    Alert,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    IconButton,
    Collapse,
    Paper,
    Divider,
    useTheme,
    useMediaQuery,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { useRouter } from 'next/navigation';
import firebaseService from '../../lib/firebaseService';
import { useAuth } from './authProvider';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Image from 'next/image';

// Carregando Stripe fora do componente para evitar múltiplas instâncias
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Estilo para os elementos do Stripe
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '18px', // Aumentado de 16px para 18px (aproximadamente 10%)
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

// Função para validação de CPF
const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11) return false;

    // Elimina CPFs inválidos conhecidos
    if (
        cpf === '00000000000' ||
        cpf === '11111111111' ||
        cpf === '22222222222' ||
        cpf === '33333333333' ||
        cpf === '44444444444' ||
        cpf === '55555555555' ||
        cpf === '66666666666' ||
        cpf === '77777777777' ||
        cpf === '88888888888' ||
        cpf === '99999999999'
    ) {
        return false;
    }

    // Validação do primeiro dígito
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
        rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(9))) {
        return false;
    }

    // Validação do segundo dígito
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
        rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(10))) {
        return false;
    }

    return true;
};

// Função para formatar o CPF
const formatCPF = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
};

// Função para formatar CEP
const formatCEP = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    return value;
};

// Lista de estados brasileiros
const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
];

// Dados dos planos - definidos fora do componente para melhor performance
const plansData = {
    monthly: {
        id: 'monthly',
        name: 'Mensal',
        price: 'R$127',
        pricePerMonth: 'R$127/mês',
        period: '/mês',
        features: [
            'Acesso a todas as funcionalidades',
            'Suporte prioritário',
            'Atualizações gratuitas'
        ],
        priceId: 'price_1QyKrNI2qmEooUtqKfgYIemz'
    },
    quarterly: {
        id: 'quarterly',
        name: 'Trimestral',
        price: 'R$345',
        pricePerMonth: 'R$115/mês',
        period: '/trimestre',
        popular: true,
        features: [
            'Acesso a todas as funcionalidades',
            'Suporte prioritário',
            'Atualizações gratuitas',
            'Economia de 10% em relação ao plano mensal'
        ],
        priceId: 'price_1RIH5eI2qmEooUtqsdXyxnEP'
    },
    annual: {
        id: 'annual',
        name: 'Anual',
        price: 'R$1143',
        pricePerMonth: 'R$95,25/mês',
        period: '/ano',
        savings: 'R$381',
        features: [
            'Acesso a todas as funcionalidades',
            'Suporte prioritário',
            'Atualizações gratuitas',
            'Economia de 25% em relação ao plano mensal'
        ],
        priceId: 'price_1QyKwWI2qmEooUtqOJ9lCFBl'
    }
};

// Componente de Cartão de Plano
const PlanCard = React.memo(({ plan, isSelected, onSelect }) => (
    <Paper
        sx={{
            backgroundColor: '#1F1F1F',
            color: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            border: isSelected ? '2px solid #F9B934' : '1px solid #3F3F3F',
            position: 'relative',
            p: 0,
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            boxShadow: isSelected ? '0 8px 16px rgba(249, 185, 52, 0.2)' : 'none',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
            },
            fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }, // Ajustando tamanho de fonte responsivo
            width: '100%' // Garantir que o card ocupe 100% da largura disponível
        }}
        onClick={onSelect}
        elevation={isSelected ? 8 : 1}
    >
        {/* Badge para plano popular ou economia */}
        {plan.popular && (
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#F9B934',
                    color: 'black',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    py: 0.5,
                    px: 1,
                    textAlign: 'center',
                    zIndex: 1
                }}
            >
                MAIS POPULAR
            </Box>
        )}

        {plan.savings && (
            <Box
                sx={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    zIndex: 1
                }}
            >
                ECONOMIZE {plan.savings}
            </Box>
        )}

        <Box sx={{ p: 2, flexGrow: 1, pt: plan.popular ? 4 : 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'baseline' }}>
                {plan.price} <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>{plan.period}</Typography>
            </Typography>
            <Typography variant="subtitle1" sx={{ my: 1 }}>
                {plan.name}
            </Typography>

            {plan.pricePerMonth && (
                <Typography variant="body1" sx={{
                    color: '#F9B934',
                    mb: 2,
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    border: '1px dashed #F9B934',
                    p: 1,
                    borderRadius: 1,
                    textAlign: 'center'
                }}>
                    {plan.pricePerMonth}
                </Typography>
            )}

            {plan.features.map((feature, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <CheckIcon sx={{ fontSize: '0.9rem', color: '#F9B934', mr: 1, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ color: 'grey.400', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                        {feature}
                    </Typography>
                </Box>
            ))}
        </Box>

        <Button
            variant="contained"
            fullWidth
            sx={{
                py: 1.5,
                borderRadius: 0,
                backgroundColor: isSelected ? '#F9B934' : '#2F2F2F',
                color: isSelected ? 'black' : 'white',
                fontWeight: 'bold',
                '&:hover': {
                    backgroundColor: isSelected ? '#E5A830' : '#3F3F3F',
                },
                marginTop: 'auto' // Empurra o botão para baixo
            }}
        >
            {isSelected ? 'SELECIONADO' : 'ESCOLHA O PLANO'}
        </Button>
    </Paper>
));

PlanCard.displayName = 'PlanCard';

// Componente principal de Checkout
function CheckoutForm({ hasFreeTrialOffer }) {
    // Hooks e contexto de autenticação
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Memorizar os dados dos planos
    const plans = useMemo(() => plansData, []);

    // Estados para controlar visibilidade das seções
    // Modificado: exibir planos por padrão
    const [personalInfoCompleted, setPersonalInfoCompleted] = useState(true);

    // Estado para rastrear se o usuário já foi criado no Firebase
    const [userCreated, setUserCreated] = useState(false);

    // Estado para mostrar formulário de pagamento
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Estados para formulário de cadastro e pagamento
    const [formData, setFormData] = useState({
        // Dados de cadastro
        fullName: "", // Campo único de nome completo
        email: "",
        password: "",
        // Removida a confirmação de senha
        // Removido o checkbox de aceitação de termos no cadastro

        // Dados de pagamento
        cardholderName: "",
        billingCpf: "",
        // Formato de endereço
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        termsAccepted: false
    });

    // Estados para senha
    const [showPassword, setShowPassword] = useState(false);

    // Estados para configuração e UI
    const [selectedPlan, setSelectedPlan] = useState('');

    // Estados para feedback ao usuário
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para processamento do webhook
    const [isProcessingWebhook, setIsProcessingWebhook] = useState(false);
    const [webhookTimeout, setWebhookTimeout] = useState(false);
    const [webhookSuccess, setWebhookSuccess] = useState(false);
    const [pollingCount, setPollingCount] = useState(0);

    // Track InitiateCheckout when the component mounts
    useEffect(() => {
        // Track InitiateCheckout event for Facebook Pixel
        if (window.fbq) {
            window.fbq('track', 'InitiateCheckout', {
                currency: 'BRL',
                content_category: 'subscription'
            });
            console.log('Facebook Pixel: InitiateCheckout event tracked');
        }
    }, []);

    // Verificar se o usuário está logado e preencher os dados
    useEffect(() => {
        if (user) {
            setPersonalInfoCompleted(true);
            setUserCreated(true);
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || "",
                email: user.email || ""
            }));
        }
    }, [user]);

    // Polling para verificar o status da assinatura com tempo mínimo de exibição
    const pollUserSubscriptionStatus = useCallback(async (uid, maxAttempts = 15, interval = 2000, minLoadingTime = 12000) => {
        // Only start polling if we have a user ID
        if (!uid) return;

        setIsProcessingWebhook(true);
        let attempts = 0;
        let subscriptionActive = false;
        const startTime = Date.now();

        const checkStatus = async () => {
            attempts++;
            setPollingCount(attempts);

            try {
                // Get fresh user data from Firebase
                const userData = await firebaseService.getUserData(uid);
                console.log(`Polling attempt ${attempts}: User subscription status:`, userData?.assinouPlano);

                // If subscription status is now true, mark as active but don't redirect yet
                if (userData && userData.assinouPlano === true) {
                    subscriptionActive = true;
                    setWebhookSuccess(true);

                    // Track purchase event for Facebook Pixel when subscription is confirmed
                    if (window.fbq) {
                        const planPrice =
                            selectedPlan === 'monthly' ? 127 :
                                selectedPlan === 'quarterly' ? 345 :
                                    selectedPlan === 'annual' ? 1143 : 0;

                        window.fbq('track', 'Purchase', {
                            value: planPrice,
                            currency: 'BRL',
                            content_type: 'product',
                            content_name: plans[selectedPlan]?.name || selectedPlan,
                            content_ids: [plans[selectedPlan]?.priceId]
                        });
                        console.log('Facebook Pixel: Purchase event tracked', planPrice, selectedPlan);
                    }

                    console.log("Subscription active! Will redirect after minimum loading time...");
                }

                // Calculate elapsed time
                const elapsedTime = Date.now() - startTime;

                // If we've been loading for at least minLoadingTime AND subscription is active, redirect
                if (elapsedTime >= minLoadingTime && subscriptionActive) {
                    console.log(`Minimum loading time (${minLoadingTime}ms) reached and subscription active, redirecting to app...`);
                    // Use a short timeout to ensure UI updates before redirect
                    setTimeout(() => {
                        router.push('/app');
                    }, 500);
                    return true;
                }

                // If we've been loading for at least minLoadingTime but subscription is NOT active
                // and we've reached max attempts
                if (elapsedTime >= minLoadingTime && attempts >= maxAttempts) {
                    console.log("Maximum polling attempts reached and minimum time elapsed");
                    setWebhookTimeout(true);
                    return false;
                }

                // If we haven't reached minimum loading time or max attempts yet, continue polling
                setTimeout(checkStatus, interval);

            } catch (error) {
                console.error("Error polling user status:", error);

                // Continue polling despite errors if we haven't reached min time
                const elapsedTime = Date.now() - startTime;

                if (elapsedTime < minLoadingTime && attempts < maxAttempts) {
                    setTimeout(checkStatus, interval);
                } else if (attempts >= maxAttempts || elapsedTime >= minLoadingTime) {
                    // If we've reached max attempts or min time, show timeout
                    setWebhookTimeout(true);
                } else {
                    setTimeout(checkStatus, interval);
                }
            }
        };

        // Start the polling process
        await checkStatus();
    }, [router, selectedPlan, plans]);

    // Handlers de input e navegação com useCallback para otimização
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        // Formatação especial para CPF
        if (name === "billingCpf") {
            const formattedValue = formatCPF(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        }
        // Formatação para CEP
        else if (name === "cep") {
            const formattedValue = formatCEP(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erros ao digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }

        // Limpar erro de autenticação
        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }
    }, [errors, authError]);

    const handleCheckboxChange = useCallback((e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));

        // Limpar erros ao marcar o checkbox
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    }, [errors]);

    const handleTogglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    // Função para mapear erros do Firebase para mensagens amigáveis
    const mapFirebaseError = useCallback((error) => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return "Este email já está em uso.";
            case 'auth/weak-password':
                return "A senha é muito fraca. Use pelo menos 6 caracteres.";
            case 'auth/invalid-email':
                return "Email inválido.";
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return "Email ou senha incorretos.";
            default:
                return `Erro no cadastro: ${error.message}`;
        }
    }, []);

    // Função para mapear erros do Stripe para mensagens amigáveis
    const mapStripeError = useCallback((error) => {
        switch (error.code) {
            case 'card_declined':
                return 'Cartão recusado. Por favor, verifique os dados ou use outro cartão.';
            case 'expired_card':
                return 'Cartão expirado. Por favor, use outro cartão.';
            case 'incorrect_cvc':
                return 'Código de segurança incorreto. Verifique o CVC do seu cartão.';
            case 'processing_error':
                return 'Erro ao processar o pagamento. Por favor, tente novamente.';
            case 'insufficient_funds':
                return 'Fundos insuficientes no cartão. Por favor, use outro método de pagamento.';
            default:
                return error.message || 'Ocorreu um erro durante o processamento do pagamento';
        }
    }, []);

    // Validação das informações pessoais
    const validatePersonalInfo = useCallback(() => {
        const newErrors = {};

        // Validações diferentes para usuários logados vs não logados
        if (!user) {
            if (!formData.fullName.trim()) newErrors.fullName = "Nome completo é obrigatório";

            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email inválido";

            if (!formData.password.trim()) newErrors.password = "Senha é obrigatória";
            else if (formData.password.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres";
        } else {
            // Usuário já está logado, apenas verificações básicas
            if (!formData.fullName.trim()) newErrors.fullName = "Nome completo é obrigatório";
            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, user]);

    // Função modificada para selecionar o plano e criar o usuário
    const handlePlanSelect = useCallback(async (planId) => {
        setSelectedPlan(planId);
        setShowPaymentForm(true);

        // Se o usuário não foi criado ainda, criar conta
        if (!userCreated && !user) {
            try {
                // Validar informações pessoais antes de criar a conta
                if (!validatePersonalInfo()) {
                    return; // Se a validação falhar, não prossegue
                }

                setIsCreatingAccount(true);
                setError('');

                const userData = {
                    fullName: formData.fullName.trim(),
                    email: formData.email,
                    assinouPlano: false,
                    createdAt: new Date(),
                    checkoutStarted: true
                };

                // Registrar usuário no Firebase
                await firebaseService.signUp(
                    formData.email,
                    formData.password,
                    userData
                );

                setSuccess('Conta criada com sucesso!');
                setUserCreated(true);
            } catch (error) {
                console.error("Erro no cadastro:", error);
                setAuthError(mapFirebaseError(error));
            } finally {
                setIsCreatingAccount(false);
            }
        }
    }, [formData, userCreated, user, mapFirebaseError, validatePersonalInfo]);

    // Validação dos dados de pagamento e endereço
    const validatePaymentInfo = useCallback(() => {
        const newErrors = {};

        if (!formData.cardholderName.trim()) {
            newErrors.cardholderName = "Nome do titular é obrigatório";
        }

        if (!formData.billingCpf.trim()) {
            newErrors.billingCpf = "CPF é obrigatório";
        } else if (!validateCPF(formData.billingCpf)) {
            newErrors.billingCpf = "CPF inválido";
        }

        // Validar campos de endereço
        if (!formData.cep.trim()) {
            newErrors.cep = "CEP é obrigatório";
        } else if (formData.cep.replace(/\D/g, '').length !== 8) {
            newErrors.cep = "CEP inválido";
        }

        if (!formData.street.trim()) {
            newErrors.street = "Rua é obrigatória";
        }

        if (!formData.number.trim()) {
            newErrors.number = "Número é obrigatório";
        }

        if (!formData.neighborhood.trim()) {
            newErrors.neighborhood = "Bairro é obrigatório";
        }

        if (!formData.city.trim()) {
            newErrors.city = "Cidade é obrigatória";
        }

        if (!formData.state) {
            newErrors.state = "Estado é obrigatório";
        }

        if (!formData.termsAccepted) {
            newErrors.termsAccepted = "Você precisa aceitar os termos";
        }

        // Verificar se os elementos do Stripe estão disponíveis
        if (!stripe || !elements) {
            newErrors.card = "Aguarde o carregamento do formulário de pagamento";
        }

        // Verificar se o elemento do cartão tem erros
        const cardElement = elements?.getElement(CardNumberElement);
        if (cardElement?._empty) {
            newErrors.card = "Preencha os dados do cartão";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, stripe, elements]);

    // Função para lidar com a visualização no mobile
    const handleMobileLayout = useCallback(() => {
        // Função vazia, apenas para demonstrar que aqui poderia ser implementada
        // uma lógica adicional para ajustar o layout no mobile se necessário
        return;
    }, []);

    // Renderização do componente de loading
    const renderLoadingScreen = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 4,
            textAlign: 'center'
        }}>
            {!webhookTimeout && !webhookSuccess && (
                <>
                    <CircularProgress size={60} sx={{ color: '#F9B934', mb: 4 }} />
                    <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                        Processando seu pagamento
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: 'grey.400' }}>
                        Estamos verificando a confirmação do seu pagamento.
                        Por favor, aguarde um momento...
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'grey.600' }}>
                        Tentativa {pollingCount} de 15
                    </Typography>
                </>
            )}

            {webhookTimeout && (
                <>
                    <Box sx={{ mb: 4, color: '#F9B934', fontSize: '3rem' }}>⚠️</Box>
                    <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                        Pagamento em processamento
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: 'grey.400' }}>
                        Seu pagamento está sendo processado, mas está demorando mais que o normal.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: 'grey.400' }}>
                        Você pode continuar agora para o aplicativo. Se houver algum problema,
                        entraremos em contato por e-mail.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/app')}
                        sx={{
                            backgroundColor: '#F9B934',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#E5A830',
                            },
                            mb: 2
                        }}
                    >
                        Continuar para o aplicativo
                    </Button>
                </>
            )}

            {webhookSuccess && (
                <>
                    <Box sx={{ mb: 4, color: '#4CAF50', fontSize: '3rem' }}>✓</Box>
                    <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'white', fontWeight: 'bold' }}>
                        Pagamento confirmado!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: 'grey.400' }}>
                        Sua assinatura foi ativada com sucesso. Redirecionando...
                    </Typography>
                </>
            )}
        </Box>
    );

    // Função principal de submissão do pagamento
    const handleSubmitPayment = useCallback(async (e) => {
        e.preventDefault();

        if (!validatePaymentInfo()) {
            return;
        }

        // Track AddPaymentInfo event for Facebook Pixel
        if (window.fbq) {
            window.fbq('track', 'AddPaymentInfo', {
                currency: 'BRL',
                content_category: 'subscription',
                content_ids: [plans[selectedPlan]?.priceId]
            });
            console.log('Facebook Pixel: AddPaymentInfo event tracked');
        }

        setIsProcessingPayment(true);
        setLoading(true);
        setError('');

        try {
            // Obter dados do usuário atual
            const currentUser = firebaseService.auth.currentUser;

            if (!currentUser) {
                throw new Error("Usuário não autenticado");
            }

            // 1) Atualizar informações do usuário no Firebase
            const userData = {
                address: {
                    cep: formData.cep,
                    street: formData.street,
                    number: formData.number,
                    complement: formData.complement || '',
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    country: 'BR'
                },
                cardHolderName: formData.cardholderName,
                cpf: formData.billingCpf,
                checkoutStarted: true,
                fullName: formData.fullName
            };

            await firebaseService.editUserData(currentUser.uid, userData);
            console.log("Dados do usuário atualizados no Firebase");

            // 2) Chamar a API para criar a subscription
            const response = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    uid: currentUser.uid,
                    email: currentUser.email || formData.email,
                    name: formData.fullName.trim(),
                    cpf: formData.billingCpf,
                    includeTrial: hasFreeTrialOffer
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar assinatura');
            }

            const data = await response.json();
            const { subscriptionId, clientSecret, status } = data;

            // Verificar se há clientSecret antes de confirmar pagamento
            if (clientSecret) {
                // 3) Confirmar o pagamento apenas se houver um clientSecret
                const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
                    clientSecret,
                    {
                        payment_method: {
                            card: elements.getElement(CardNumberElement),
                            billing_details: {
                                name: formData.cardholderName,
                                address: {
                                    line1: `${formData.street}, ${formData.number}`,
                                    line2: formData.complement,
                                    city: formData.city,
                                    state: formData.state,
                                    postal_code: formData.cep,
                                    country: 'BR'
                                },
                                email: currentUser.email || formData.email
                            }
                        }
                    }
                );

                if (paymentError) {
                    throw new Error(mapStripeError(paymentError));
                }
            } else {
                console.log("Assinatura criada sem necessidade de confirmação imediata de pagamento");
            }

            // 4) Atualizar dados adicionais no Firestore após confirmação do pagamento
            await firebaseService.editUserData(currentUser.uid, {
                assinouPlano: false, // Mantenha como false até confirmação do webhook
                planType: selectedPlan,
                subscriptionId,
                checkoutCompleted: true
            });

            setSuccess('Pagamento processado com sucesso! Aguardando confirmação...');

            // Iniciar o polling para verificar o status da assinatura
            pollUserSubscriptionStatus(currentUser.uid);

        } catch (error) {
            console.error('Erro no checkout:', error);
            setError(error.message || 'Ocorreu um erro durante o processamento do pagamento');
            setIsProcessingPayment(false);
            setLoading(false);
        }
    }, [validatePaymentInfo, selectedPlan, formData, stripe, elements, hasFreeTrialOffer, router, mapStripeError, pollUserSubscriptionStatus, plans]);

    // Complete return statement for the CheckoutForm component
    return (
        <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Lado Esquerdo - Estático (esconde em mobile) */}
            <Box sx={{
                width: { xs: '0%', md: '60%' },
                bgcolor: '#151B3B', // Dark blue background
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                p: 5,
                pt: 8,
                pl: 5, // Increased left padding/margin
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Logo - slightly larger size */}
                <Box sx={{ width: 132, height: 132, mb: 5 }}> {/* Aumentado em 10% */}
                    <Image
                        src="/ico.svg"
                        alt="Logo"
                        layout="responsive"
                        width={132}
                        height={132}
                        style={{ objectFit: 'contain' }}
                    />
                </Box>

                {/* Headline with key icon */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ color: '#F9B934', mr: 2, fontSize: '1.8rem' }}>
                        🔑
                    </Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
                        ACESSO COMPLETO A
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
                    {/* List of benefits with checkmarks - reduced vertical spacing and bolder font */}
                    {[
                        'Agenda completa com sistema de consultas',
                        'Exames com análise de IA avançada',
                        'Geração de receitas e anamnese',
                        'Controle financeiro e métricas detalhadas',
                        'Suporte 24/7 e atualizações frequentes'
                    ].map((item, index) => (
                        <Box key={index} sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            mb: 1.5, // Reduced vertical spacing
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'translateX(5px)'
                            }
                        }}>
                            <Box component="span" sx={{
                                display: 'inline-flex',
                                color: '#F9B934',
                                mr: 2,
                                fontSize: '1.5rem', // Larger checkmark
                                fontWeight: 'bold'
                            }}>
                                ✓
                            </Box>
                            <Typography variant="subtitle1" sx={{
                                fontSize: '0.95rem', // Slightly smaller font
                                fontWeight: 600, // Bolder text for more professional look
                                letterSpacing: '0.02em' // Slight letter spacing for readability
                            }}>
                                {item}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* "Learn to make money" text - now placed right after features */}
                <Box sx={{ mt: 3, mb: 4, textAlign: 'left' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Transforme sua prática médica.
                    </Typography>
                    <Typography variant="subtitle1">
                        Sua jornada para uma medicina mais eficiente começa aqui.
                    </Typography>
                </Box>
            </Box>

            {/* Lado Direito - Formulário de Checkout em coluna única ou tela de carregamento */}
            <Box sx={{
                width: { xs: '100%', md: '80%' }, // Aumentado de 50% para 60%
                bgcolor: '#0F0F0F',
                color: 'white',
                overflow: 'auto',
                p: { xs: 2, sm: 2, md: 2 }, // Reduzido para ter menos espaço nas margens
                pl: { xs: 2, sm: 2, md: 4 }, // Padding left específico de cerca de 20px
                display: 'flex',
                flexDirection: 'column'
            }}>
                {isProcessingWebhook ? (
                    // Tela de carregamento durante processamento do webhook
                    renderLoadingScreen()
                ) : (
                    // Formulário de Checkout normal quando não está processando webhook
                    <>
                        {/* Logo em telas pequenas - MODIFICADO PARA CENTRALIZAR */}
                        <Box sx={{
                            display: { xs: 'flex', md: 'none' },
                            flexDirection: 'column',
                            alignItems: 'center', // Alterado de flex-start para center
                            mb: 3
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center', // Alterado de flex-start para center
                                alignItems: 'center',
                                width: '100%',
                                mb: 2,
                                position: 'relative' // Adicionado para posicionar o botão de login relativamente a este container
                            }}>
                                <Image
                                    src="/ico.svg"
                                    alt="Logo"
                                    width={80}
                                    height={80}
                                />

                                {/* Botão de login para mobile */}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => router.push('/')}
                                    sx={{
                                        color: '#F9B934',
                                        borderColor: '#F9B934',
                                        '&:hover': {
                                            borderColor: '#E5A830',
                                            backgroundColor: 'rgba(249, 185, 52, 0.08)'
                                        },
                                        position: 'absolute',
                                        right: 16,
                                        top: 0
                                    }}
                                >
                                    Entrar
                                </Button>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}> {/* Adicionado textAlign: 'center' */}
                                Potencialize sua prática médica
                            </Typography>
                        </Box>

                        {/* Container principal para o conteúdo do formulário - COLUNA ÚNICA */}
                        <Box sx={{
                            maxWidth: 850, // Aumentado para acomodar melhor os cards de plano
                            margin: '0', // Alterado de '0 auto' para '0' para alinhar à esquerda
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            px: { xs: 0, sm: 0.5, md: 1 }, // Reduzido para ter conteúdo mais próximo das margens
                            fontSize: '1.1em', // Aumentando a escala do conteúdo em 10%
                        }}>
                            {/* Cabeçalho da página desktop */}
                            <Box sx={{
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                mb: 4,
                                mt: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: 40, height: 40, mr: 2 }}>
                                        <Image
                                            src="/ico.svg"
                                            alt="Logo"
                                            width={40}
                                            height={40}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                                            MEDICONOBOLSO
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                            A solução completa para médicos
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Botão de login */}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => { logout(); }}
                                    sx={{
                                        color: '#F9B934',
                                        borderColor: '#F9B934',
                                        '&:hover': {
                                            borderColor: '#E5A830',
                                            backgroundColor: 'rgba(249, 185, 52, 0.08)'
                                        },
                                        ml: 2
                                    }}
                                >
                                    Já tem conta? Entrar
                                </Button>
                            </Box>

                            {/* Seção 1: INFORMAÇÕES PESSOAIS */}
                            <Box sx={{ mb: 5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}> {/* Adicionado pl: 0 */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: '#F9B934',
                                        color: 'black',
                                        mr: 2
                                    }}>
                                        <PersonIcon />
                                    </Box>
                                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                                        INFORMAÇÕES PESSOAIS
                                    </Typography>
                                </Box>

                                {/* Formulário de informações pessoais - Indentação adicionada */}
                                <Box sx={{ mb: 4, pl: 3 }}> {/* Adicionado pl: 3 para indent o conteúdo */}
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Endereço de e-mail
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={formData.email}
                                        name="email"
                                        onChange={handleInputChange}
                                        placeholder="exemplo@gmail.com"
                                        variant="outlined"
                                        error={Boolean(errors.email)}
                                        helperText={errors.email || ""}
                                        disabled={authLoading}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#1F1F1F',
                                                color: 'white',
                                                '& fieldset': {
                                                    borderColor: '#3F3F3F',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#5F5F5F',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#7F7F7F',
                                                },
                                            },
                                            '& .MuiFormHelperText-root': {
                                                color: '#FF4747',
                                            }
                                        }}
                                    />

                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Nome Completo
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={formData.fullName}
                                        name="fullName"
                                        onChange={handleInputChange}
                                        placeholder="Nome Completo"
                                        variant="outlined"
                                        error={Boolean(errors.fullName)}
                                        helperText={errors.fullName || ""}
                                        disabled={authLoading}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#1F1F1F',
                                                color: 'white',
                                                '& fieldset': {
                                                    borderColor: '#3F3F3F',
                                                }
                                            }
                                        }}
                                    />

                                    {/* Campos de senha apenas se o usuário não estiver logado */}
                                    {!user && (
                                        <>
                                            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '1.1rem' }}>
                                                Senha
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                name="password"
                                                onChange={handleInputChange}
                                                placeholder="Senha"
                                                variant="outlined"
                                                error={Boolean(errors.password)}
                                                helperText={errors.password || ""}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label="toggle password visibility"
                                                                onClick={handleTogglePasswordVisibility}
                                                                edge="end"
                                                                sx={{ color: 'grey.500' }}
                                                            >
                                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{
                                                    mb: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        backgroundColor: '#1F1F1F',
                                                        color: 'white',
                                                        '& fieldset': {
                                                            borderColor: '#3F3F3F',
                                                        }
                                                    }
                                                }}
                                            />
                                        </>
                                    )}
                                </Box>

                                {authError && (
                                    <Alert severity="error" sx={{ mt: 2, mb: 2, bgcolor: '#381111', color: 'white', ml: 3 }}>
                                        {authError}
                                    </Alert>
                                )}
                            </Box>

                            {/* Seção 2: SELEÇÃO DE PLANO - MODIFICADO PARA RESPONSIVIDADE */}
                            <Box sx={{ mb: 5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}> {/* Adicionado pl: 0 */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: selectedPlan ? '#4CAF50' : '#F9B934',
                                        color: 'black',
                                        mr: 2
                                    }}>
                                        {selectedPlan ? <CheckIcon /> : <LocalOfferIcon />}
                                    </Box>
                                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                                        SELECIONE O PLANO
                                    </Typography>
                                </Box>

                                {/* GRID MODIFICADO - Em mobile, cada cartão ocupa 100% da largura */}
                                {hasFreeTrialOffer && (
                                    <Box sx={{
                                        pl: 3,
                                        mb: 3,
                                        p: 2,
                                        bgcolor: 'rgba(249, 185, 52, 0.08)',
                                        border: '1px solid rgba(249, 185, 52, 0.3)',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}>
                                        <LockIcon sx={{ color: '#F9B934', mr: 1.5, flexShrink: 0 }} />
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: 'white',
                                                fontWeight: 'medium',
                                                letterSpacing: '-0.01em',
                                                whiteSpace: { sm: 'nowrap', xs: 'normal' },
                                                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                                            }}
                                        >
                                            Você receberá 24 horas de teste gratuito! A cobrança começará apenas após esse período.
                                        </Typography>
                                    </Box>
                                )}

                                <Grid container spacing={2} sx={{ pl: 3, width: '100%' }}> {/* Adicionado width: 100% */}
                                    {Object.keys(plans).map((planKey) => (
                                        <Grid item xs={12} sm={6} md={4} key={planKey} sx={{ display: 'flex', width: '100%' }}>
                                            <Box sx={{ width: '100%' }}>
                                                <PlanCard
                                                    plan={plans[planKey]}
                                                    isSelected={selectedPlan === planKey}
                                                    onSelect={() => handlePlanSelect(planKey)}
                                                />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Feedback de conta criada com sucesso */}
                                {success && !isProcessingPayment && (
                                    <Alert
                                        severity="success"
                                        sx={{ mt: 3, mb: 2, bgcolor: '#113828', color: 'white', ml: 3 }}
                                    >
                                        {success}
                                    </Alert>
                                )}
                            </Box>

                            {/* Divider entre planos e formulário de pagamento */}
                            {showPaymentForm && (
                                <Divider sx={{ my: 3, borderColor: '#3F3F3F' }} />
                            )}

                            {/* Seção 3: FORMULÁRIO DE PAGAMENTO (visível apenas quando um plano for selecionado) */}
                            {showPaymentForm && (
                                <Box component="form" onSubmit={handleSubmitPayment} sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}> {/* Adicionado pl: 0 */}
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            bgcolor: '#F9B934',
                                            color: 'black',
                                            mr: 2
                                        }}>
                                            <PaymentIcon />
                                        </Box>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                                            INFORMAÇÕES DO CARTÃO
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 4, pl: 3 }}> {/* Adicionado pl: 3 */}
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            Número do cartão
                                        </Typography>
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: '#1F1F1F',
                                                borderRadius: 1,
                                                border: `1px solid ${errors.card ? '#FF4747' : '#3F3F3F'}`,
                                                mb: 2
                                            }}
                                        >
                                            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                                        </Box>
                                        {errors.card && (
                                            <Typography variant="caption" color="#FF4747" sx={{ display: 'block', mb: 2 }}>
                                                {errors.card}
                                            </Typography>
                                        )}

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Data de validade
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: '#1F1F1F',
                                                        borderRadius: 1,
                                                        border: `1px solid #3F3F3F`,
                                                        mb: 2
                                                    }}
                                                >
                                                    <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                                                </Box>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Código de segurança
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: '#1F1F1F',
                                                        borderRadius: 1,
                                                        border: `1px solid #3F3F3F`,
                                                        mb: 2
                                                    }}
                                                >
                                                    <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            Nome no cartão
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={formData.cardholderName}
                                            name="cardholderName"
                                            onChange={handleInputChange}
                                            placeholder="Nome como aparece no cartão"
                                            variant="outlined"
                                            error={Boolean(errors.cardholderName)}
                                            helperText={errors.cardholderName || ""}
                                            sx={{
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#1F1F1F',
                                                    color: 'white',
                                                    '& fieldset': {
                                                        borderColor: '#3F3F3F',
                                                    }
                                                }
                                            }}
                                        />

                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            CPF do titular
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={formData.billingCpf}
                                            name="billingCpf"
                                            onChange={handleInputChange}
                                            placeholder="000.000.000-00"
                                            variant="outlined"
                                            error={Boolean(errors.billingCpf)}
                                            helperText={errors.billingCpf || ""}
                                            inputProps={{ maxLength: 14 }}
                                            sx={{
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#1F1F1F',
                                                    color: 'white',
                                                    '& fieldset': {
                                                        borderColor: '#3F3F3F',
                                                    }
                                                }
                                            }}
                                        />

                                        {/* Novo formato de campos de endereço */}
                                        <Typography variant="h6" sx={{ mb: 2, mt: 3, fontSize: '1.3rem' }}>
                                            Endereço
                                        </Typography>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    CEP
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={formData.cep}
                                                    name="cep"
                                                    onChange={handleInputChange}
                                                    placeholder="00000-000"
                                                    variant="outlined"
                                                    error={Boolean(errors.cep)}
                                                    helperText={errors.cep || ""}
                                                    inputProps={{ maxLength: 9 }}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: '#3F3F3F',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Bairro
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={formData.neighborhood}
                                                    name="neighborhood"
                                                    onChange={handleInputChange}
                                                    placeholder="Bairro"
                                                    variant="outlined"
                                                    error={Boolean(errors.neighborhood)}
                                                    helperText={errors.neighborhood || ""}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: '#3F3F3F',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={8}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Rua
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={formData.street}
                                                    name="street"
                                                    onChange={handleInputChange}
                                                    placeholder="Rua, Avenida, etc."
                                                    variant="outlined"
                                                    error={Boolean(errors.street)}
                                                    helperText={errors.street || ""}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: '#3F3F3F',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Número
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={formData.number}
                                                    name="number"
                                                    onChange={handleInputChange}
                                                    placeholder="Nº"
                                                    variant="outlined"
                                                    error={Boolean(errors.number)}
                                                    helperText={errors.number || ""}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: '#3F3F3F',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            Complemento
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={formData.complement}
                                            name="complement"
                                            onChange={handleInputChange}
                                            placeholder="Apto, Bloco, etc. (opcional)"
                                            variant="outlined"
                                            sx={{
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#1F1F1F',
                                                    color: 'white',
                                                    '& fieldset': {
                                                        borderColor: '#3F3F3F',
                                                    }
                                                }
                                            }}
                                        />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Cidade
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={formData.city}
                                                    name="city"
                                                    onChange={handleInputChange}
                                                    placeholder="Cidade"
                                                    variant="outlined"
                                                    error={Boolean(errors.city)}
                                                    helperText={errors.city || ""}
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& fieldset': {
                                                                borderColor: '#3F3F3F',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    Estado
                                                </Typography>
                                                <FormControl fullWidth variant="outlined" error={Boolean(errors.state)}>
                                                    <Select
                                                        value={formData.state}
                                                        name="state"
                                                        onChange={handleInputChange}
                                                        displayEmpty
                                                        sx={{
                                                            mb: 2,
                                                            backgroundColor: '#1F1F1F',
                                                            color: 'white',
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#3F3F3F',
                                                            },
                                                            '& .MuiSvgIcon-root': {
                                                                color: 'white',
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            <em>Selecione um estado</em>
                                                        </MenuItem>
                                                        {brazilianStates.map((state) => (
                                                            <MenuItem key={state.value} value={state.value}>
                                                                {state.value} - {state.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.state && (
                                                        <Typography variant="caption" color="#FF4747">
                                                            {errors.state}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            </Grid>
                                        </Grid>

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
                                                {selectedPlan && plans[selectedPlan]?.price}
                                                <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>
                                                    {selectedPlan && plans[selectedPlan]?.period}
                                                </Typography>
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                                {selectedPlan === 'monthly' ? '~127 BRL' :
                                                    selectedPlan === 'quarterly' ? '~345 BRL' :
                                                        selectedPlan === 'annual' ? '~1143 BRL' : ''}
                                            </Typography>
                                        </Paper>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.termsAccepted}
                                                    name="termsAccepted"
                                                    onChange={handleCheckboxChange}
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
                                                    Aceito os <span style={{ color: 'white', textDecoration: 'underline' }}>Termos e Condições</span> e <span style={{ color: 'white', textDecoration: 'underline' }}>Política de Privacidade</span>, e concordo em pagar {selectedPlan && plans[selectedPlan]?.price} a cada {selectedPlan === 'monthly' ? 'mês' : selectedPlan === 'quarterly' ? '3 meses' : 'ano'} até que eu cancele.
                                                </Typography>
                                            }
                                        />
                                        {errors.termsAccepted && (
                                            <Typography variant="caption" color="#FF4747" sx={{ display: 'block', mb: 2 }}>
                                                {errors.termsAccepted}
                                            </Typography>
                                        )}
                                    </Box>

                                    {error && (
                                        <Alert
                                            severity="error"
                                            sx={{ mt: 2, mb: 2, bgcolor: '#381111', color: 'white', ml: 3 }}
                                        >
                                            {error}
                                        </Alert>
                                    )}

                                    {isProcessingPayment && success && (
                                        <Alert
                                            severity="success"
                                            sx={{ mt: 2, mb: 2, bgcolor: '#113828', color: 'white', ml: 3 }}
                                        >
                                            {success}
                                        </Alert>
                                    )}

                                    {hasFreeTrialOffer && (
                                        <Alert
                                            severity="info"
                                            sx={{
                                                mt: 2,
                                                mb: 2,
                                                bgcolor: '#1E3A5B',
                                                color: 'white',
                                                ml: 3,
                                                border: '1px solid #F9B934',
                                                fontWeight: 'medium'
                                            }}
                                            icon={<LockIcon sx={{ color: '#F9B934' }} />}
                                        >
                                            Você receberá 24 horas de teste gratuito! A cobrança começará apenas após esse período.
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={!stripe || loading || !formData.termsAccepted || isProcessingPayment || !selectedPlan}
                                        sx={{
                                            backgroundColor: '#F9B934',
                                            color: 'black',
                                            p: 2,
                                            fontSize: '18px', // Aumentado em aprox. 10%
                                            fontWeight: 'bold',
                                            mt: 2,
                                            ml: 3, // Adicionado para alinhar com o conteúdo indentado
                                            width: 'calc(100% - 24px)', // Ajustado para compensar o ml
                                            '&:hover': {
                                                backgroundColor: '#E5A830',
                                            },
                                            '&.Mui-disabled': {
                                                backgroundColor: '#7F7F7F',
                                                color: '#E0E0E0'
                                            }
                                        }}
                                        startIcon={isProcessingPayment ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {isProcessingPayment ? 'PROCESSANDO...' : (hasFreeTrialOffer ? 'INICIAR TESTE' : 'FINALIZAR PAGAMENTO')}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Copyright/Footer - CENTRALIZADO PARA MOBILE */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: { xs: 'center', md: 'flex-start' }, // Centralizado no mobile, alinhado à esquerda no desktop
                            mt: 'auto',
                            pt: 3,
                            opacity: 0.7
                        }}>
                            <Typography variant="caption" sx={{ color: 'grey.500' }}>
                                Copyright © 2025 MedicoNoBolso
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}

// Componente wrapper com o provider do Stripe
export default function CustomCheckout({ hasFreeTrialOffer }) {
    useEffect(() => {
        // Facebook Pixel Code - Meta tag (only add if it doesn't exist)
        if (typeof window !== 'undefined' && !document.getElementById('facebook-pixel-script')) {
            const script = document.createElement('script');
            script.id = 'facebook-pixel-script';
            script.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1033180232110037');
                fbq('track', 'PageView');
            `;
            document.head.appendChild(script);

            // Add noscript pixel
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = 'none';
            img.src = 'https://www.facebook.com/tr?id=1033180232110037&ev=PageView&noscript=1';
            noscript.appendChild(img);
            document.head.appendChild(noscript);
        }
    }, []);

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm hasFreeTrialOffer={hasFreeTrialOffer} />
        </Elements>
    );
}