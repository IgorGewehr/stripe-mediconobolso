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
            }
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
                    <CheckIcon sx={{ fontSize: '0.8rem', color: '#F9B934', mr: 1, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
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
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,

        // Dados de pagamento
        cardholderName: "",
        billingCpf: "",
        // Novo formato de endereço
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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Verificar se o usuário está logado e preencher os dados
    useEffect(() => {
        if (user) {
            setPersonalInfoCompleted(true);
            setUserCreated(true);
            setFormData(prev => ({
                ...prev,
                firstName: user.fullName ? user.fullName.split(' ')[0] : "",
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : "",
                email: user.email || ""
            }));
        }
    }, [user]);

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

    const handleToggleConfirmPasswordVisibility = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
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
                    fullName: `${formData.firstName} ${formData.lastName}`.trim(),
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
    }, [formData, userCreated, user, mapFirebaseError]);

    // Validação das informações pessoais
    const validatePersonalInfo = useCallback(() => {
        const newErrors = {};

        // Validações diferentes para usuários logados vs não logados
        if (!user) {
            if (!formData.firstName.trim()) newErrors.firstName = "Nome é obrigatório";
            if (!formData.lastName.trim()) newErrors.lastName = "Sobrenome é obrigatório";

            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email inválido";

            if (!formData.password.trim()) newErrors.password = "Senha é obrigatória";
            else if (formData.password.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres";

            if (!formData.confirmPassword.trim()) newErrors.confirmPassword = "Confirme sua senha";
            else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "As senhas não conferem";

            if (!formData.acceptedTerms) newErrors.acceptedTerms = "Você precisa aceitar os termos";
        } else {
            // Usuário já está logado, apenas verificações básicas
            if (!formData.firstName.trim()) newErrors.firstName = "Nome é obrigatório";
            if (!formData.lastName.trim()) newErrors.lastName = "Sobrenome é obrigatório";
            if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, user]);

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

    // Função principal de submissão do pagamento
    const handleSubmitPayment = useCallback(async (e) => {
        e.preventDefault();

        if (!validatePaymentInfo()) {
            return;
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
                firstName: formData.firstName,
                lastName: formData.lastName
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
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    cpf: formData.billingCpf,
                    includeTrial: hasFreeTrialOffer
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar assinatura');
            }

            const data = await response.json();
            const { clientSecret, subscriptionId } = data;

            // 3) Confirmar o pagamento
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

            // 4) Atualizar dados adicionais no Firestore após confirmação do pagamento
            await firebaseService.editUserData(currentUser.uid, {
                assinouPlano: true,
                planType: selectedPlan,
                subscriptionId,
                checkoutCompleted: true
            });

            setSuccess('Pagamento processado com sucesso! Redirecionando...');

            // Aguardar feedback visual antes de redirecionar
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error) {
            console.error('Erro no checkout:', error);
            setError(error.message || 'Ocorreu um erro durante o processamento do pagamento');
        } finally {
            setIsProcessingPayment(false);
            setLoading(false);
        }
    }, [validatePaymentInfo, selectedPlan, formData, stripe, elements, hasFreeTrialOffer, router, mapStripeError]);

    // Renderização do componente
    return (
        <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Lado Esquerdo - Estático (esconde em mobile) */}
            <Box sx={{
                width: { xs: '0%', md: '40%' },
                bgcolor: '#151B3B', // Dark blue background
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                p: 5,
                pt: 8,
                pl: 10, // Increased left padding/margin
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Logo - slightly larger size */}
                <Box sx={{ width: 120, height: 120, mb: 5 }}>
                    <Image
                        src="/ico.svg"
                        alt="Logo"
                        layout="responsive"
                        width={120}
                        height={120}
                        style={{ objectFit: 'contain' }}
                    />
                </Box>

                {/* Headline with key icon */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ color: '#F9B934', mr: 2, fontSize: '1.8rem' }}>
                        🔑
                    </Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
                        UNLOCK ACCESS TO
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
                    {/* List of benefits with checkmarks - reduced vertical spacing and bolder font */}
                    {[
                        'Live calls and AMAs with Experts',
                        '24/7 Support and on-demand guidance',
                        'Over 18 Modern Wealth Creation Methods',
                        '7+ Distinct Campuses',
                        '1000+ Professionally made Video lessons'
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
                        Learn to make money.
                    </Typography>
                    <Typography variant="subtitle1">
                        Your journey has just begun.
                    </Typography>
                </Box>
            </Box>

            {/* Lado Direito - Formulário de Checkout em coluna única */}
            <Box sx={{
                width: { xs: '100%', md: '60%' }, // Aumentado de 50% para 60%
                bgcolor: '#0F0F0F',
                color: 'white',
                overflow: 'auto',
                p: { xs: 2, md: 4 },
                display: 'flex',
                flexDirection: 'column'
            }}>
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
                        mb: 2
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
                                ml: 2,
                                position: 'absolute',
                                right: 16,
                                top: 16
                            }}
                        >
                            Entrar
                        </Button>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Potencialize sua prática médica
                    </Typography>
                </Box>

                {/* Container principal para o conteúdo do formulário - COLUNA ÚNICA */}
                <Box sx={{
                    maxWidth: 800, // Aumentado para acomodar melhor os cards de plano
                    margin: '0 auto',
                    width: '100%',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column'
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
                                    MEDICONOBOLSO.COM
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                                INFORMAÇÕES PESSOAIS
                            </Typography>
                        </Box>

                        {/* Formulário de informações pessoais */}
                        <Box sx={{ mb: 4 }}>
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
                                Nome
                            </Typography>
                            <TextField
                                fullWidth
                                value={formData.firstName}
                                name="firstName"
                                onChange={handleInputChange}
                                placeholder="Nome"
                                variant="outlined"
                                error={Boolean(errors.firstName)}
                                helperText={errors.firstName || ""}
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

                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                Sobrenome
                            </Typography>
                            <TextField
                                fullWidth
                                value={formData.lastName}
                                name="lastName"
                                onChange={handleInputChange}
                                placeholder="Sobrenome"
                                variant="outlined"
                                error={Boolean(errors.lastName)}
                                helperText={errors.lastName || ""}
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
                                        Confirme a Senha
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        name="confirmPassword"
                                        onChange={handleInputChange}
                                        placeholder="Confirme a Senha"
                                        variant="outlined"
                                        error={Boolean(errors.confirmPassword)}
                                        helperText={errors.confirmPassword || ""}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle confirm password visibility"
                                                        onClick={handleToggleConfirmPasswordVisibility}
                                                        edge="end"
                                                        sx={{ color: 'grey.500' }}
                                                    >
                                                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.acceptedTerms}
                                                name="acceptedTerms"
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
                                                Aceito os <span style={{ color: 'white', textDecoration: 'underline' }}>Termos e Condições</span>
                                            </Typography>
                                        }
                                    />
                                    {errors.acceptedTerms && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2 }}>
                                            {errors.acceptedTerms}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>

                        {authError && (
                            <Alert severity="error" sx={{ mt: 2, mb: 2, bgcolor: '#381111', color: 'white' }}>
                                {authError}
                            </Alert>
                        )}

                        {/* Botão de Continuar foi removido */}
                    </Box>

                    {/* Seção 2: SELEÇÃO DE PLANO */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                                SELECIONE O PLANO
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            {Object.keys(plans).map((planKey) => (
                                <Grid item xs={12} md={4} key={planKey} sx={{ display: 'flex' }}>
                                    <PlanCard
                                        plan={plans[planKey]}
                                        isSelected={selectedPlan === planKey}
                                        onSelect={() => handlePlanSelect(planKey)}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Feedback de conta criada com sucesso */}
                        {success && !isProcessingPayment && (
                            <Alert
                                severity="success"
                                sx={{ mt: 3, mb: 2, bgcolor: '#113828', color: 'white' }}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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

                            <Box sx={{ mb: 4 }}>
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
                                <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
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
                                    sx={{ mt: 2, mb: 2, bgcolor: '#381111', color: 'white' }}
                                >
                                    {error}
                                </Alert>
                            )}

                            {isProcessingPayment && success && (
                                <Alert
                                    severity="success"
                                    sx={{ mt: 2, mb: 2, bgcolor: '#113828', color: 'white' }}
                                >
                                    {success}
                                </Alert>
                            )}

                            {hasFreeTrialOffer && (
                                <Alert
                                    severity="info"
                                    sx={{ mt: 2, mb: 2, bgcolor: '#1E3A5B', color: 'white' }}
                                    icon={<LockIcon sx={{ color: '#F9B934' }} />}
                                >
                                    Você receberá 24 horas de teste gratuito! A cobrança começará após esse período.
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
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    mt: 2,
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

                    {/* Copyright/Footer */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 'auto',
                        pt: 3,
                        opacity: 0.7
                    }}>
                        <Typography variant="caption" sx={{ color: 'grey.500' }}>
                            Copyright © 2025 MedicoNoBolso
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// Componente wrapper com o provider do Stripe
export default function CustomCheckout({ hasFreeTrialOffer }) {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm hasFreeTrialOffer={hasFreeTrialOffer} />
        </Elements>
    );
}