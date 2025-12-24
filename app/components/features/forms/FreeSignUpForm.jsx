'use client';

import React, {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/authProvider';
import firebaseService from '../../../../lib/firebaseService';
import { authApiService } from '../../../../lib/services/api';
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    IconButton,
    Collapse,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Slide,
    Stack,
    useTheme,
    useMediaQuery,
    Container
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GoogleButton from '../auth/GoogleButton';
import {FacebookEvents} from "../../../../lib/facebookConversions";

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

const FreeSignupForm = () => {
    const router = useRouter();
    const { referralSource } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallScreen = useMediaQuery('(max-height: 700px)');

    // Estados do formulário
    const [step, setStep] = useState(1); // 1 = básico, 2 = endereço
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Estados dos dados
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        cep: '',
        city: '',
        state: '',
        cpf: '',
        phone: '',
        termsAccepted: false
    });

    useEffect(() => {
        // Enviar evento Lead quando página carrega
        const sendLeadEvent = async () => {
            try {
                await FacebookEvents.Lead(
                    {
                        // Dados iniciais (pode estar vazio)
                    },
                    {
                        source: 'free_signup_page'
                    }
                );
            } catch (error) {
                console.error('Erro ao enviar evento Lead:', error);
            }
        };

        sendLeadEvent();
    }, []);

    // Estados de erro
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    // Função para formatar CEP
    const formatCEP = (value) => {
        value = value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    };

    // Função para formatar CPF
    const formatCPF = (value) => {
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    };

    // Função para formatar telefone
    const formatPhone = (value) => {
        value = value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return value;
    };

    // Handler para mudanças nos inputs
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'cep') {
            const formattedValue = formatCEP(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else if (name === 'cpf') {
            const formattedValue = formatCPF(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else if (name === 'phone') {
            const formattedValue = formatPhone(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro quando usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }

        if (globalError) {
            setGlobalError('');
        }
    };

    // Validar step 1
    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido";
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Nome completo é obrigatório";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Senha é obrigatória";
        } else if (formData.password.length < 6) {
            newErrors.password = "A senha deve ter pelo menos 6 caracteres";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Telefone é obrigatório";
        } else if (formData.phone.replace(/\D/g, '').length < 10) {
            newErrors.phone = "Telefone inválido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validar step 2
    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.cpf.trim()) {
            newErrors.cpf = "CPF é obrigatório";
        } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
            newErrors.cpf = "CPF inválido";
        }

        if (!formData.cep.trim()) {
            newErrors.cep = "CEP é obrigatório";
        } else if (formData.cep.replace(/\D/g, '').length !== 8) {
            newErrors.cep = "CEP inválido";
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Prosseguir para próximo step
    const handleContinue = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    // Voltar para step anterior
    const handleBack = () => {
        setStep(1);
        setErrors({});
    };

    // Função para enviar emails de boas-vindas
    const sendWelcomeEmails = async (email, name, appLink) => {
        try {
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    type: 'both',
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

    // Função para mapear erros do Firebase
    const mapFirebaseError = (error) => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return "Este email já está em uso.";
            case 'auth/weak-password':
                return "A senha é muito fraca. Use pelo menos 6 caracteres.";
            case 'auth/invalid-email':
                return "Email inválido.";
            default:
                return `Erro no cadastro: ${error.message}`;
        }
    };

    // Handler para cadastro com Google
    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        setGlobalError('');

        try {
            console.log('🆓 Iniciando cadastro gratuito com Google...');

            const result = await firebaseService.signUpFreeWithGoogle();
            const { user, userData } = result;

            console.log('✅ Cadastro gratuito com Google concluído');

            // Provisionar usuário no backend Rust
            await authApiService.provision({
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                phone: user.phoneNumber || null,
                plan_type: 'free'
            });

            // Enviar emails de boas-vindas
            firebaseService.sendGoogleWelcomeEmails(
                user.email,
                user.displayName || user.email.split('@')[0]
            ).catch(console.error);

            setSuccess(true);

            try {
                await FacebookEvents.CompleteRegistration(
                    {
                        email: user.email,
                        fullName: user.displayName,
                        // Google pode não fornecer todos os dados
                    },
                    {
                        method: 'google',
                        planType: 'free'
                    }
                );
                console.log('✅ Evento CompleteRegistration (Google) enviado para Facebook');
            } catch (fbError) {
                console.error('❌ Erro ao enviar evento CompleteRegistration Google:', fbError);
            }

            // Aguardar antes de redirecionar
            setTimeout(() => {
                router.push('/app');
            }, 2000);

        } catch (error) {
            console.error("❌ Erro no cadastro gratuito com Google:", error);

            if (error.message === 'Login cancelado pelo usuário') {
                setGlobalError("Cadastro cancelado.");
            } else if (error.message === 'Pop-up bloqueado pelo navegador') {
                setGlobalError("Pop-up bloqueado. Permita pop-ups para este site e tente novamente.");
            } else {
                setGlobalError("Erro no cadastro com Google. Tente novamente.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // Registrar usuário gratuito
    const handleRegister = async () => {
        if (!validateStep2()) {
            return;
        }

        setLoading(true);
        setGlobalError('');

        try {
            console.log('🆓 Starting free signup process...');

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
                    city: formData.city,
                    state: formData.state,
                    country: 'BR'
                },
                cpf: formData.cpf
            };

            // Verificar referralSource
            const currentReferralSource = referralSource || localStorage.getItem('referralSource');

            if (currentReferralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Cliente GRATUITO marcado como vindo através do Enrico');
            } else if (currentReferralSource) {
                userData.referralSource = currentReferralSource;
            }

            const userCredential = await firebaseService.signUp(
                formData.email,
                formData.password,
                userData
            );

            // Provisionar usuário no backend Rust
            await authApiService.provision({
                name: formData.fullName.trim(),
                email: formData.email,
                cpf: formData.cpf,
                phone: formData.phone,
                address: {
                    cep: formData.cep,
                    city: formData.city,
                    state: formData.state,
                    country: 'BR'
                },
                plan_type: 'free'
            });

            // Enviar emails de boas-vindas
            const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;
            const welcomeName = formData.fullName.trim() || formData.email.split('@')[0];

            // Enviar emails de forma assíncrona
            sendWelcomeEmails(formData.email, welcomeName, appLink).catch(error => {
                console.error('❌ Erro não tratado no envio de emails:', error);
            });

            setSuccess(true);

            // Aguardar antes de redirecionar
            setTimeout(() => {
                router.push('/app');
            }, 2000);

        } catch (error) {
            console.error("❌ Erro no cadastro gratuito:", error);
            setGlobalError(mapFirebaseError(error));
        } finally {
            setLoading(false);
        }
    };

    // Toggle visibilidade da senha
    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // Tela de sucesso minimalista
    if (success) {
        return (
            <Box sx={{
                minHeight: '100vh',
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}>
                <Container maxWidth="xs">
                    <Box sx={{
                        backgroundColor: 'white',
                        borderRadius: 3,
                        p: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid #f0f0f0'
                    }}>
                        <CheckCircleIcon
                            sx={{
                                fontSize: 48,
                                color: '#4CAF50',
                                mb: 2
                            }}
                        />
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                mb: 1,
                                color: '#333'
                            }}
                        >
                            Conta criada com sucesso
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#666',
                                mb: 3,
                                lineHeight: 1.5
                            }}
                        >
                            Redirecionando para o aplicativo...
                        </Typography>
                        <CircularProgress
                            size={24}
                            sx={{ color: '#4CAF50' }}
                        />
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
        }}>
            {/* Header responsivo */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: { xs: 2, sm: 3 },
                backgroundColor: 'white',
                borderBottom: '1px solid #f0f0f0',
                // 🔧 CORREÇÃO: Header fixo apenas em telas grandes
                position: { xs: 'static', md: 'sticky' },
                top: 0,
                zIndex: 10
            }}>
                <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{
                        width: { xs: 32, sm: 40 },
                        height: 'auto'
                    }}
                />
                <Button
                    variant="outlined"
                    onClick={() => router.push('/')}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                >
                    Entrar
                </Button>
            </Box>

            {/* Main Content */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                p: { xs: 2, sm: 3 },
                flexDirection: 'column',
            }}>
                <Container maxWidth="sm">
                    <Box sx={{
                        backgroundColor: 'white',
                        borderRadius: 3,
                        p: { xs: 3, sm: 4 },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid #f0f0f0',
                        // 🔧 CORREÇÃO: Largura máxima em telas pequenas
                        width: '100%',
                        maxWidth: { xs: '100%', sm: '500px' },
                        mx: 'auto',
                        // 🔧 CORREÇÃO: Margem inferior em telas pequenas
                        mb: { xs: 2, md: 0 }
                    }}>
                        <Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={500}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: { xs: 2, sm: 3, md: 4 }
                            }}>
                                <Typography
                                    variant={isMobile ? "h5" : "h4"}
                                    component="h1"
                                    sx={{
                                        color: "primary.main",
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                    }}
                                >
                                    Conta Gratuita
                                </Typography>
                                <Typography
                                    variant={isMobile ? "body2" : "subtitle1"}
                                    color="text.secondary"
                                    sx={{
                                        textAlign: 'center',
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                    }}
                                >
                                    Acesso completo sem custo algum!
                                </Typography>
                            </Box>
                        </Slide>

                        {/* Botão Google Auth Profissional */}
                        <Box sx={{ width: '100%', mb: 3 }}>
                            <GoogleButton
                                onClick={handleGoogleSignup}
                                loading={googleLoading}
                                type="signup"
                                size={isMobile ? "medium" : "medium"}
                                fullWidth
                            />
                        </Box>

                        {/* Divisor "ou" */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            my: { xs: 2, md: 3 },
                            gap: 2
                        }}>
                            <Box sx={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#e0e0e0'
                            }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    px: 1,
                                    fontFamily: 'Roboto, Arial, sans-serif'
                                }}
                            >
                                ou
                            </Typography>
                            <Box sx={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#e0e0e0'
                            }} />
                        </Box>

                        {step === 1 ? (
                            // Step 1: Informações Básicas
                            <Collapse in={step === 1} timeout={500}>
                                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                                    <TextField
                                        label="E-mail"
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.email)}
                                        helperText={errors.email || ""}
                                    />

                                    <TextField
                                        label="Nome Completo"
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.fullName)}
                                        helperText={errors.fullName || ""}
                                    />

                                    <TextField
                                        label="Telefone"
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.phone)}
                                        helperText={errors.phone || ""}
                                    />

                                    <TextField
                                        label="Senha"
                                        type={showPassword ? "text" : "password"}
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.password)}
                                        helperText={errors.password || ""}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleTogglePasswordVisibility}
                                                        edge="end"
                                                        size={isMobile ? "small" : "medium"}
                                                    >
                                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {globalError && (
                                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                                            {globalError}
                                        </Alert>
                                    )}

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleContinue}
                                        size={isMobile ? "medium" : "large"}
                                        sx={{
                                            borderRadius: 2,
                                            py: { xs: 1.2, sm: 1.5 },
                                            mt: { xs: 2, sm: 3 },
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        Continuar
                                    </Button>
                                </Stack>
                            </Collapse>
                        ) : (
                            // Step 2: Endereço e Finalização
                            <Collapse in={step === 2} timeout={500}>
                                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                                    <TextField
                                        label="CPF"
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.cpf)}
                                        helperText={errors.cpf || ""}
                                        inputProps={{ maxLength: 14 }}
                                    />

                                    <TextField
                                        label="CEP"
                                        variant="outlined"
                                        fullWidth
                                        size={isMobile ? "medium" : "medium"}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.cep)}
                                        helperText={errors.cep || ""}
                                        inputProps={{ maxLength: 9 }}
                                    />

                                    <Box sx={{
                                        display: 'flex',
                                        gap: { xs: 1.5, sm: 2 },
                                        flexDirection: { xs: 'column', sm: 'row' }
                                    }}>
                                        <TextField
                                            label="Cidade"
                                            variant="outlined"
                                            sx={{
                                                flex: 1,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2
                                                }
                                            }}
                                            size={isMobile ? "medium" : "medium"}
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            error={Boolean(errors.city)}
                                            helperText={errors.city || ""}
                                        />
                                        <FormControl
                                            sx={{
                                                flex: { xs: 1, sm: 1 },
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2
                                                }
                                            }}
                                            error={Boolean(errors.state)}
                                            size={isMobile ? "medium" : "medium"}
                                        >
                                            <InputLabel>Estado</InputLabel>
                                            <Select
                                                value={formData.state}
                                                label="Estado"
                                                name="state"
                                                onChange={handleInputChange}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {brazilianStates.map((state) => (
                                                    <MenuItem key={state.value} value={state.value}>
                                                        {state.value}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.state && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                    {errors.state}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Box>

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={formData.termsAccepted}
                                                name="termsAccepted"
                                                onChange={handleInputChange}
                                                color="primary"
                                                size={isMobile ? "medium" : "medium"}
                                            />
                                        }
                                        label={
                                            <Typography variant={isMobile ? "body2" : "body2"}>
                                                Aceito os{' '}
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        textDecoration: 'underline',
                                                        color: 'primary.main',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Termos e Condições
                                                </Typography>
                                                {' '}e{' '}
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        textDecoration: 'underline',
                                                        color: 'primary.main',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Política de Privacidade
                                                </Typography>
                                            </Typography>
                                        }
                                        sx={{ alignItems: 'flex-start' }}
                                    />
                                    {errors.termsAccepted && (
                                        <Typography variant="caption" color="error">
                                            {errors.termsAccepted}
                                        </Typography>
                                    )}

                                    {globalError && (
                                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                                            {globalError}
                                        </Alert>
                                    )}

                                    <Box sx={{
                                        display: 'flex',
                                        gap: { xs: 1.5, sm: 2 },
                                        mt: { xs: 2, sm: 3 },
                                        flexDirection: { xs: 'column-reverse', sm: 'row' }
                                    }}>
                                        <Button
                                            variant="outlined"
                                            onClick={handleBack}
                                            disabled={loading}
                                            size={isMobile ? "medium" : "large"}
                                            sx={{
                                                borderRadius: 2,
                                                flex: { xs: 1, sm: 0.3 },
                                                textTransform: 'none'
                                            }}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleRegister}
                                            disabled={loading}
                                            size={isMobile ? "medium" : "large"}
                                            sx={{
                                                borderRadius: 2,
                                                py: { xs: 1.2, sm: 1.5 },
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #43A047 0%, #5CB85C 100%)',
                                                },
                                                '&:disabled': {
                                                    background: '#ccc'
                                                }
                                            }}
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                                        >
                                            {loading ? 'Criando conta...' : 'Criar Conta Gratuita'}
                                        </Button>
                                    </Box>
                                </Stack>
                            </Collapse>
                        )}

                        {/* Texto informativo */}
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                mt: { xs: 2, sm: 3 },
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                        >
                            ✨ Sem cartão de crédito • Acesso imediato
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default FreeSignupForm;