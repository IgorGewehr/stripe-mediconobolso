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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Image from 'next/image';

// Carregando Stripe fora do componente para evitar múltiplas instâncias
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Estilo para os elementos do Stripe
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '18px',
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

// Dados dos planos - ATUALIZADO COM NOVAS FEATURES DO PLANO GRATUITO
const plansData = {
    free: {
        id: 'free',
        name: 'Gratuito',
        price: 'R$0',
        pricePerMonth: 'R$0/mês',
        period: '/sempre',
        free: true,
        features: [
            'Acesso a todas as funções exceto:',
            '- função financeira e cadastro de pacientes limitada',
            '- ferramentas de IA',
            '- treinamento com chamada de vídeo'
        ]
    },
    monthly: {
        id: 'monthly',
        name: 'Pro',
        price: 'R$127',
        pricePerMonth: 'R$127/mês',
        period: '/mês',
        features: [
            'Acesso a todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Atualizações gratuitas'
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
            'Acesso a todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Atualizações gratuitas',
            'Economia de 25% em relação ao plano mensal'
        ],
        priceId: 'price_1QyKwWI2qmEooUtqOJ9lCFBl'
    }
};

// Componente de Cartão de Plano
const PlanCard = React.memo(({ plan, isSelected, onSelect }) => {
    const isFree = plan.free;

    return (
        <Paper
            sx={{
                backgroundColor: isFree ? '#1B5E20' : '#1F1F1F',
                color: 'white',
                borderRadius: 2,
                overflow: 'hidden',
                border: isSelected ? `2px solid ${isFree ? '#4CAF50' : '#F9B934'}` : `1px solid ${isFree ? '#2E7D32' : '#3F3F3F'}`,
                position: 'relative',
                p: 0,
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? `0 8px 16px rgba(${isFree ? '76, 175, 80' : '249, 185, 52'}, 0.2)` : 'none',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: isFree ? '0 6px 12px rgba(76, 175, 80, 0.3)' : '0 6px 12px rgba(0,0,0,0.2)'
                },
                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                width: '100%',
                background: isFree ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)' : '#1F1F1F'
            }}
            onClick={onSelect}
            elevation={isSelected ? 8 : 1}
        >
            {/* Badge para plano gratuito */}
            {isFree && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        py: 0.5,
                        px: 1,
                        textAlign: 'center',
                        zIndex: 1
                    }}
                >
                    🎉 TOTALMENTE GRÁTIS
                </Box>
            )}

            {/* Badge para plano popular */}
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

            <Box sx={{ p: 2, flexGrow: 1, pt: (plan.popular || isFree) ? 4 : 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'baseline' }}>
                    {plan.price} <Typography variant="caption" sx={{ ml: 1, color: isFree ? '#A5D6A7' : 'grey.400' }}>{plan.period}</Typography>
                </Typography>
                <Typography variant="subtitle1" sx={{ my: 1 }}>
                    {plan.name}
                </Typography>

                {plan.pricePerMonth && !isFree && (
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

                {isFree && (
                    <Typography variant="body1" sx={{
                        color: '#81C784',
                        mb: 2,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        border: '1px dashed #81C784',
                        p: 1,
                        borderRadius: 1,
                        textAlign: 'center'
                    }}>
                        Sem custos ocultos!
                    </Typography>
                )}

                {plan.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        {feature.startsWith('Acesso a todas as funções exceto:') ? (
                            <Typography variant="body2" sx={{
                                color: isFree ? '#E8F5E8' : 'grey.400',
                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                fontWeight: 'bold'
                            }}>
                                {feature}
                            </Typography>
                        ) : feature.startsWith('-') ? (
                            <Typography variant="body2" sx={{
                                color: isFree ? '#E8F5E8' : 'grey.400',
                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                ml: 1
                            }}>
                                {feature}
                            </Typography>
                        ) : (
                            <>
                                <CheckIcon sx={{ fontSize: '0.9rem', color: isFree ? '#81C784' : '#F9B934', mr: 1, mt: 0.3 }} />
                                <Typography variant="body2" sx={{ color: isFree ? '#E8F5E8' : 'grey.400', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                                    {feature}
                                </Typography>
                            </>
                        )}
                    </Box>
                ))}
            </Box>

            <Button
                variant="contained"
                fullWidth
                sx={{
                    py: 1.5,
                    borderRadius: 0,
                    backgroundColor: isSelected ? (isFree ? '#66BB6A' : '#F9B934') : (isFree ? '#388E3C' : '#2F2F2F'),
                    color: isSelected ? 'white' : (isFree ? 'white' : 'white'),
                    fontWeight: 'bold',
                    '&:hover': {
                        backgroundColor: isSelected ? (isFree ? '#5CB660' : '#E5A830') : (isFree ? '#4CAF50' : '#3F3F3F'),
                    },
                    marginTop: 'auto'
                }}
            >
                {isSelected ? 'SELECIONADO' : (isFree ? 'COMEÇAR GRÁTIS' : 'ESCOLHA O PLANO')}
            </Button>
        </Paper>
    );
});

PlanCard.displayName = 'PlanCard';

// Componente principal de Checkout
function CheckoutForm() {
    // Hooks e contexto de autenticação
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const { user, loading: authLoading, logout, referralSource } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Memorizar os dados dos planos
    const plans = useMemo(() => plansData, []);

    // Estados para controlar visibilidade das seções
    const [showPersonalInfo, setShowPersonalInfo] = useState(false);
    const [personalInfoCompleted, setPersonalInfoCompleted] = useState(false);

    // Estado para rastrear se o usuário já foi criado no Firebase
    const [userCreated, setUserCreated] = useState(false);

    // Estado para mostrar formulário de pagamento
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Estados para formulário de cadastro e pagamento
    const [formData, setFormData] = useState({
        // Dados de cadastro
        fullName: "",
        phone: "",
        email: "",
        password: "",

        // Dados pessoais
        billingCpf: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",

        // Dados de pagamento
        cardholderName: "",
        termsAccepted: false
    });

    // Estados para senha
    const [showPassword, setShowPassword] = useState(false);

    // Estados para configuração e UI
    const [selectedPlan, setSelectedPlan] = useState('');

    const formatPhone = (value) => {
        value = value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
            value = value.replace(/(\d{5})(\d)/, '$1 $2');
        }
        return value;
    };

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
        if (!uid) return;

        setIsProcessingWebhook(true);
        let attempts = 0;
        let subscriptionActive = false;
        const startTime = Date.now();

        const checkStatus = async () => {
            attempts++;
            setPollingCount(attempts);

            try {
                const userData = await firebaseService.getUserData(uid);
                console.log(`Polling attempt ${attempts}: User subscription status:`, userData?.assinouPlano);

                if (userData && userData.assinouPlano === true) {
                    subscriptionActive = true;
                    setWebhookSuccess(true);
                    console.log("Subscription active! Will redirect after minimum loading time...");
                }

                const elapsedTime = Date.now() - startTime;

                if (elapsedTime >= minLoadingTime && subscriptionActive) {
                    console.log(`Minimum loading time (${minLoadingTime}ms) reached and subscription active, redirecting to app...`);
                    setTimeout(() => {
                        router.push('/app');
                    }, 500);
                    return true;
                }

                if (elapsedTime >= minLoadingTime && attempts >= maxAttempts) {
                    console.log("Maximum polling attempts reached and minimum time elapsed");
                    setWebhookTimeout(true);
                    return false;
                }

                setTimeout(checkStatus, interval);

            } catch (error) {
                console.error("Error polling user status:", error);
                const elapsedTime = Date.now() - startTime;

                if (elapsedTime < minLoadingTime && attempts < maxAttempts) {
                    setTimeout(checkStatus, interval);
                } else if (attempts >= maxAttempts || elapsedTime >= minLoadingTime) {
                    setWebhookTimeout(true);
                } else {
                    setTimeout(checkStatus, interval);
                }
            }
        };

        await checkStatus();
    }, [router]);

    // Handlers de input e navegação com useCallback para otimização
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const formattedValue = formatPhone(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        }
        else if (name === "billingCpf") {
            const formattedValue = formatCPF(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        }
        else if (name === "cep") {
            const formattedValue = formatCEP(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }

        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }
    }, [errors, authError]);

    const handleCheckboxChange = useCallback((e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));

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

            if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
            else if (formData.phone.replace(/\D/g, '').length < 10) newErrors.phone = "Telefone inválido";

            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email inválido";

            if (!formData.password.trim()) newErrors.password = "Senha é obrigatória";
            else if (formData.password.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres";
        } else {
            if (!formData.fullName.trim()) newErrors.fullName = "Nome completo é obrigatório";
            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
        }

        // Validações para campos pessoais (CPF e endereço)
        if (!formData.billingCpf.trim()) {
            newErrors.billingCpf = "CPF é obrigatório";
        } else if (!validateCPF(formData.billingCpf)) {
            newErrors.billingCpf = "CPF inválido";
        }

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

        // Para plano gratuito, validar termos
        if (selectedPlan === 'free' && !formData.termsAccepted) {
            newErrors.termsAccepted = "Você precisa aceitar os termos";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, user, selectedPlan]);

    // Função para selecionar o plano - ATUALIZADA
    const handlePlanSelect = useCallback(async (planId) => {
        setSelectedPlan(planId);
        setShowPersonalInfo(true); // Mostrar dados pessoais após selecionar plano

        // Para planos pagos, mostrar formulário de pagamento e criar conta se necessário
        if (planId !== 'free') {
            setShowPaymentForm(true);

            // Se o usuário não foi criado ainda, criar conta
            if (!userCreated && !user) {
                try {
                    // Validar apenas informações básicas (não os dados pessoais ainda)
                    const basicErrors = {};

                    if (!formData.fullName.trim()) basicErrors.fullName = "Nome completo é obrigatório";
                    if (!formData.phone.trim()) basicErrors.phone = "Telefone é obrigatório";
                    else if (formData.phone.replace(/\D/g, '').length < 10) basicErrors.phone = "Telefone inválido";
                    if (!formData.email.trim()) basicErrors.email = "Email é obrigatório";
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) basicErrors.email = "Email inválido";
                    if (!formData.password.trim()) basicErrors.password = "Senha é obrigatória";
                    else if (formData.password.length < 6) basicErrors.password = "A senha deve ter pelo menos 6 caracteres";

                    if (Object.keys(basicErrors).length > 0) {
                        setErrors(basicErrors);
                        return;
                    }

                    setIsCreatingAccount(true);
                    setError('');

                    const userData = {
                        fullName: formData.fullName.trim(),
                        email: formData.email,
                        phone: formData.phone,
                        assinouPlano: false,
                        createdAt: new Date(),
                        checkoutStarted: true
                    };

                    if (referralSource === 'enrico') {
                        userData.enrico = true;
                        console.log('Cliente marcado como vindo através do Enrico');
                    }

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
        }
        // Para plano gratuito, não criar conta ainda
    }, [formData, userCreated, user, mapFirebaseError, referralSource]);

    const sendWelcomeEmails = async (email, name, appLink) => {
        try {
            console.log(`📧 Enviando emails de boas-vindas para: ${email}`);

            const response = await fetch('/api/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    type: 'both', // Enviar ambos os emails
                    appLink: appLink
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Emails de boas-vindas enviados com sucesso!');
                return { success: true, data: result.data };
            } else {
                console.error('❌ Falha ao enviar emails:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Erro ao chamar API de email:', error);
            return { success: false, error: error.message };
        }
    };

    // Nova função para cadastro gratuito - ATUALIZADA
    const handleFreeSignup = useCallback(async () => {
        try {
            // Validar informações completas para plano gratuito
            if (!validatePersonalInfo()) {
                return;
            }

            setIsCreatingAccount(true);
            setError('');

            const userData = {
                fullName: formData.fullName.trim(),
                email: formData.email,
                phone: formData.phone,
                gratuito: true,
                assinouPlano: false,
                planType: 'free',
                createdAt: new Date(),
                checkoutCompleted: true,
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
                cpf: formData.billingCpf
            };

            if (referralSource === 'enrico') {
                userData.enrico = true;
                console.log('Cliente gratuito marcado como vindo através do Enrico');
            }

            let currentUser;

            if (!user) {
                const userCredential = await firebaseService.signUp(
                    formData.email,
                    formData.password,
                    userData
                );
                currentUser = userCredential.user;
            } else {
                await firebaseService.editUserData(user.uid, userData);
                currentUser = user;
            }

            // ✨ ENVIAR AMBOS OS EMAILS DE BOAS-VINDAS ✨
            const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;
            const welcomeName = formData.fullName.trim() || formData.email.split('@')[0];

            console.log('📧 Iniciando envio dos emails de boas-vindas...');

            // Enviar emails (não bloquear o fluxo se falhar)
            sendWelcomeEmails(formData.email, welcomeName, appLink)
                .then((emailResult) => {
                    if (emailResult.success) {
                        console.log('✅ Emails de boas-vindas enviados com sucesso!');
                    } else {
                        console.error('❌ Falha ao enviar emails de boas-vindas:', emailResult.error);
                        // Não interrompe o fluxo, apenas loga o erro
                    }
                })
                .catch((emailError) => {
                    console.error('❌ Erro ao enviar emails de boas-vindas:', emailError);
                    // Não interrompe o fluxo
                });

            setSuccess('Conta gratuita criada com sucesso! Redirecionando...');
            setUserCreated(true);

            setTimeout(() => {
                router.push('/app');
            }, 2000);

        } catch (error) {
            console.error("Erro no cadastro gratuito:", error);
            setAuthError(mapFirebaseError(error));
        } finally {
            setIsCreatingAccount(false);
        }
    }, [formData, user, mapFirebaseError, validatePersonalInfo, referralSource, router]);

    // Validação dos dados de pagamento
    const validatePaymentInfo = useCallback(() => {
        const newErrors = {};

        if (!formData.cardholderName.trim()) {
            newErrors.cardholderName = "Nome do titular é obrigatório";
        }

        if (!formData.termsAccepted) {
            newErrors.termsAccepted = "Você precisa aceitar os termos";
        }

        if (!stripe || !elements) {
            newErrors.card = "Aguarde o carregamento do formulário de pagamento";
        }

        const cardElement = elements?.getElement(CardNumberElement);
        if (cardElement?._empty) {
            newErrors.card = "Preencha os dados do cartão";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, stripe, elements]);

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

        if (!validatePersonalInfo() || !validatePaymentInfo()) {
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
                phone: formData.phone,
                checkoutStarted: true,
                fullName: formData.fullName
            };

            if (referralSource === 'enrico') {
                userData.enrico = true;
                console.log('Cliente marcado como vindo através do Enrico (dados iniciais)');
            }

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
                    includeTrial: false, // Removido teste gratuito
                    referralSource: referralSource
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar assinatura');
            }

            const data = await response.json();
            const { subscriptionId, clientSecret } = data;

            // Verificar se há clientSecret antes de confirmar pagamento
            if (clientSecret) {
                // 3) Confirmar o pagamento apenas se houver um clientSecret
                const { error: paymentError } = await stripe.confirmCardPayment(
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
            const updateData = {
                assinouPlano: false, // Mantenha como false até confirmação do webhook
                planType: selectedPlan,
                subscriptionId,
                checkoutCompleted: true,
                referralSource: referralSource
            };

            if (referralSource === 'enrico') {
                updateData.enrico = true;
                console.log('Cliente marcado como vindo através do Enrico (finalização do pagamento)');
            }

            await firebaseService.editUserData(currentUser.uid, updateData);

            setSuccess('Pagamento processado com sucesso! Aguardando confirmação...');

            // Iniciar o polling para verificar o status da assinatura
            pollUserSubscriptionStatus(currentUser.uid);

        } catch (error) {
            console.error('Erro no checkout:', error);
            setError(error.message || 'Ocorreu um erro durante o processamento do pagamento');
            setIsProcessingPayment(false);
            setLoading(false);
        }
    }, [validatePersonalInfo, validatePaymentInfo, selectedPlan, formData, stripe, elements, router, mapStripeError, pollUserSubscriptionStatus, plans, referralSource]);

    // Complete return statement for the CheckoutForm component
    return (
        <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Lado Esquerdo - Estático (esconde em mobile) */}
            <Box sx={{
                width: { xs: '0%', md: '60%' },
                bgcolor: '#151B3B',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                p: 5,
                pt: 8,
                pl: 5,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Logo */}
                <Box sx={{ width: 132, height: 132, mb: 5 }}>
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
                    {/* List of benefits with checkmarks */}
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
                            mb: 1.5,
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'translateX(5px)'
                            }
                        }}>
                            <Box component="span" sx={{
                                display: 'inline-flex',
                                color: '#F9B934',
                                mr: 2,
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                            }}>
                                ✓
                            </Box>
                            <Typography variant="subtitle1" sx={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                letterSpacing: '0.02em'
                            }}>
                                {item}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* "Learn to make money" text */}
                <Box sx={{ mt: 3, mb: 4, textAlign: 'left' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Transforme sua prática médica.
                    </Typography>
                    <Typography variant="subtitle1">
                        Sua jornada para uma medicina mais eficiente começa aqui.
                    </Typography>
                </Box>
            </Box>

            {/* Lado Direito - Formulário de Checkout */}
            <Box sx={{
                width: { xs: '100%', md: '80%' },
                bgcolor: '#0F0F0F',
                color: 'white',
                overflow: 'auto',
                p: { xs: 2, sm: 2, md: 2 },
                pl: { xs: 2, sm: 2, md: 4 },
                display: 'flex',
                flexDirection: 'column'
            }}>
                {isProcessingWebhook ? (
                    renderLoadingScreen()
                ) : (
                    <>
                        {/* Logo em telas pequenas */}
                        <Box sx={{
                            display: { xs: 'flex', md: 'none' },
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 3
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                mb: 2,
                                position: 'relative'
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
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                                Potencialize sua prática médica
                            </Typography>
                        </Box>

                        {/* Container principal para o conteúdo do formulário */}
                        <Box sx={{
                            maxWidth: 850,
                            margin: '0',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            px: { xs: 0, sm: 0.5, md: 1 },
                            fontSize: '1.1em',
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

                            {/* Seção 1: INFORMAÇÕES BÁSICAS (sempre visível) */}
                            <Box sx={{ mb: 5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}>
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
                                        INFORMAÇÕES BÁSICAS
                                    </Typography>
                                </Box>

                                {/* Formulário de informações básicas */}
                                <Box sx={{ mb: 4, pl: 3 }}>
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
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                Telefone
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                value={formData.phone}
                                                name="phone"
                                                onChange={handleInputChange}
                                                placeholder="telefone"
                                                variant="outlined"
                                                error={Boolean(errors.phone)}
                                                helperText={errors.phone || ""}
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

                            {/* Seção 2: SELEÇÃO DE PLANO */}
                            <Box sx={{ mb: 5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}>
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

                                <Grid container spacing={2} sx={{ pl: 3, width: '100%' }}>
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
                                {success && !isProcessingPayment && selectedPlan !== 'free' && (
                                    <Alert
                                        severity="success"
                                        sx={{ mt: 3, mb: 2, bgcolor: '#113828', color: 'white', ml: 3 }}
                                    >
                                        {success}
                                    </Alert>
                                )}

                                {/* Loading para criação de conta */}
                                {isCreatingAccount && selectedPlan !== 'free' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, ml: 3 }}>
                                        <CircularProgress size={20} sx={{ color: '#F9B934', mr: 2 }} />
                                        <Typography variant="body2" sx={{ color: 'white' }}>
                                            Criando conta...
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Seção 3: DADOS PESSOAIS E ENDEREÇO (só aparece após selecionar plano) */}
                            <Collapse in={showPersonalInfo}>
                                <Box sx={{ mb: 5 }}>
                                    <Divider sx={{ my: 3, borderColor: '#3F3F3F' }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}>
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
                                            <LocationOnIcon />
                                        </Box>
                                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                                            DADOS PESSOAIS E ENDEREÇO
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 4, pl: 3 }}>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            CPF
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

                                        {/* Checkbox de termos para plano gratuito */}
                                        {selectedPlan === 'free' && (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.termsAccepted}
                                                        name="termsAccepted"
                                                        onChange={handleCheckboxChange}
                                                        sx={{
                                                            color: 'grey.500',
                                                            '&.Mui-checked': {
                                                                color: '#4CAF50',
                                                            },
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                                        Aceito os <span style={{ color: 'white', textDecoration: 'underline' }}>Termos e Condições</span> e <span style={{ color: 'white', textDecoration: 'underline' }}>Política de Privacidade</span>
                                                    </Typography>
                                                }
                                                sx={{ mt: 2 }}
                                            />
                                        )}
                                        {errors.termsAccepted && selectedPlan === 'free' && (
                                            <Typography variant="caption" color="#FF4747" sx={{ display: 'block', mt: 1 }}>
                                                {errors.termsAccepted}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Loading para criação de conta gratuita */}
                                    {isCreatingAccount && selectedPlan === 'free' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, ml: 3 }}>
                                            <CircularProgress size={20} sx={{ color: '#4CAF50', mr: 2 }} />
                                            <Typography variant="body2" sx={{ color: 'white' }}>
                                                Criando sua conta gratuita...
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Feedback de sucesso para plano gratuito */}
                                    {success && selectedPlan === 'free' && (
                                        <Alert
                                            severity="success"
                                            sx={{ mt: 3, mb: 2, bgcolor: '#113828', color: 'white', ml: 3 }}
                                        >
                                            {success}
                                        </Alert>
                                    )}

                                    {/* BOTÃO ESTILIZADO PARA PLANO GRATUITO */}
                                    {selectedPlan === 'free' && !success && (
                                        <Box sx={{ mt: 4, pl: 3 }}>
                                            <Button
                                                onClick={handleFreeSignup}
                                                variant="contained"
                                                fullWidth
                                                disabled={isCreatingAccount}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%)',
                                                    color: 'white',
                                                    p: 2.5,
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    borderRadius: 2,
                                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #43A047 0%, #5CB85C 50%, #7CB342 100%)',
                                                        boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                                                        transform: 'translateY(-1px)',
                                                    },
                                                    '&:active': {
                                                        transform: 'translateY(0px)',
                                                    },
                                                    '&.Mui-disabled': {
                                                        background: '#616161',
                                                        color: '#E0E0E0'
                                                    },
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: '-100%',
                                                        width: '100%',
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                                        transition: 'left 0.5s',
                                                    },
                                                    '&:hover::before': {
                                                        left: '100%',
                                                    },
                                                    transition: 'all 0.3s ease'
                                                }}
                                                startIcon={isCreatingAccount ? <CircularProgress size={20} color="inherit" /> : null}
                                            >
                                                {isCreatingAccount ? 'CRIANDO CONTA...' : '🚀 COMECE AGORA GRÁTIS'}
                                            </Button>

                                            {/* Texto adicional para plano gratuito */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#81C784',
                                                    textAlign: 'center',
                                                    mt: 2,
                                                    fontWeight: 'medium',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ✨ Sem cartão de crédito necessário • Acesso imediato
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Collapse>

                            {/* Seção 4: FORMULÁRIO DE PAGAMENTO (apenas para planos pagos) */}
                            {showPaymentForm && selectedPlan !== 'free' && (
                                <Box component="form" onSubmit={handleSubmitPayment} sx={{ mb: 4 }}>
                                    <Divider sx={{ my: 3, borderColor: '#3F3F3F' }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 0 }}>
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

                                    <Box sx={{ mb: 4, pl: 3 }}>
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
                                                    Aceito os <span style={{ color: 'white', textDecoration: 'underline' }}>Termos e Condições</span> e <span style={{ color: 'white', textDecoration: 'underline' }}>Política de Privacidade</span>, e concordo em pagar {selectedPlan && plans[selectedPlan]?.price} a cada {selectedPlan === 'monthly' ? 'mês' : 'ano'} até que eu cancele.
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

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={!stripe || loading || !formData.termsAccepted || isProcessingPayment || !selectedPlan}
                                        sx={{
                                            backgroundColor: '#F9B934',
                                            color: 'black',
                                            p: 2,
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            mt: 2,
                                            ml: 3,
                                            width: 'calc(100% - 24px)',
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
                                        {isProcessingPayment ? 'PROCESSANDO...' : 'FINALIZAR PAGAMENTO'}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Copyright/Footer */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: { xs: 'center', md: 'flex-start' },
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
export default function CustomCheckout() {
    useEffect(() => {
        // Facebook Pixel Code
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
            fbq('track', 'InitiateCheckout');
        `;
            document.head.appendChild(script);

            // Add noscript pixel
            const noscript = document.createElement('noscript');
            const img = document.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = 'none';
            img.src = 'https://www.facebook.com/tr?id=1033180232110037&ev=InitiateCheckout&noscript=1';
            noscript.appendChild(img);
            document.head.appendChild(noscript);
        }
    }, []);

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    );
}