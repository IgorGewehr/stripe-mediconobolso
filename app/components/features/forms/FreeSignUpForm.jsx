'use client';

import React, {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/authProvider';
import { authService } from '../../../../lib/services/firebase';
import { authApiService } from '../../../../lib/services/api';
import {
    Box,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GoogleButton from '../auth/GoogleButton';
import {FacebookEvents} from "../../../../lib/facebookConversions";
import {
    useFeedback,
    StyledInput,
    PhoneInput,
    CPFInput,
    CEPInput,
    LoadingButton,
    CircleSpinner
} from '../../ui/feedback';

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
    const { success: showSuccess, error: showError } = useFeedback();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallScreen = useMediaQuery('(max-height: 700px)');

    // Estados do formulário
    const [step, setStep] = useState(1); // 1 = básico, 2 = endereço
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [successState, setSuccessState] = useState(false);

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

    // Handler para mudanças nos inputs
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro quando usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
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

        try {
            console.log('🆓 Iniciando cadastro gratuito com Google...');

            const result = await authService.signUpFreeWithGoogle();
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
            authService.sendGoogleWelcomeEmails(
                user.email,
                user.displayName || user.email.split('@')[0]
            ).catch(console.error);

            setSuccessState(true);
            showSuccess("Conta criada com sucesso!", {
                description: "Redirecionando para o aplicativo..."
            });

            try {
                await FacebookEvents.CompleteRegistration(
                    {
                        email: user.email,
                        fullName: user.displayName,
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

            let errorMessage = "Erro no cadastro com Google";
            let errorDescription = "Tente novamente.";

            if (error.message === 'Login cancelado pelo usuário') {
                errorMessage = "Cadastro cancelado";
                errorDescription = "Você fechou o popup antes de concluir.";
            } else if (error.message === 'Pop-up bloqueado pelo navegador') {
                errorMessage = "Pop-up bloqueado";
                errorDescription = "Permita pop-ups para este site e tente novamente.";
            }

            showError(errorMessage, { description: errorDescription });
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

            const userCredential = await authService.signUp(
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
            const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.doctorcare.io'}/app`;
            const welcomeName = formData.fullName.trim() || formData.email.split('@')[0];

            // Enviar emails de forma assíncrona
            sendWelcomeEmails(formData.email, welcomeName, appLink).catch(error => {
                console.error('❌ Erro não tratado no envio de emails:', error);
            });

            setSuccessState(true);
            showSuccess("Conta criada com sucesso!", {
                description: "Bem-vindo ao Médico no Bolso!"
            });

            // Aguardar antes de redirecionar
            setTimeout(() => {
                router.push('/app');
            }, 2000);

        } catch (error) {
            console.error("❌ Erro no cadastro gratuito:", error);
            showError("Erro no cadastro", {
                description: mapFirebaseError(error)
            });
        } finally {
            setLoading(false);
        }
    };

    // Tela de sucesso minimalista
    if (successState) {
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
                        borderRadius: '16px',
                        p: { xs: 4, sm: 5 },
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <Box sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: '#ECFDF5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3
                        }}>
                            <CheckCircleIcon
                                sx={{
                                    fontSize: 32,
                                    color: '#10B981',
                                }}
                            />
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                mb: 1,
                                color: '#111E5A'
                            }}
                        >
                            Conta criada com sucesso!
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#666',
                                mb: 4,
                                lineHeight: 1.5
                            }}
                        >
                            Redirecionando para o aplicativo...
                        </Typography>
                        <CircleSpinner
                            size={32}
                            color="#10B981"
                            secondaryColor="#ECFDF5"
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
                                    <StyledInput
                                        label="E-mail"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.email)}
                                        helperText={errors.email}
                                        placeholder="seu@email.com"
                                    />

                                    <StyledInput
                                        label="Nome Completo"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.fullName)}
                                        helperText={errors.fullName}
                                        placeholder="Dr. João Silva"
                                    />

                                    <PhoneInput
                                        label="Telefone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.phone)}
                                        helperText={errors.phone}
                                    />

                                    <StyledInput
                                        label="Senha"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.password)}
                                        helperText={errors.password}
                                        placeholder="Mínimo 6 caracteres"
                                    />

                                    <LoadingButton
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleContinue}
                                        sx={{
                                            borderRadius: '12px',
                                            py: { xs: 1.5, sm: 1.75 },
                                            mt: { xs: 1, sm: 2 },
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            boxShadow: '0 2px 8px rgba(24, 82, 254, 0.25)',
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(24, 82, 254, 0.35)',
                                            }
                                        }}
                                    >
                                        Continuar
                                    </LoadingButton>
                                </Stack>
                            </Collapse>
                        ) : (
                            // Step 2: Endereço e Finalização
                            <Collapse in={step === 2} timeout={500}>
                                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                                    <CPFInput
                                        label="CPF"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.cpf)}
                                        helperText={errors.cpf}
                                    />

                                    <CEPInput
                                        label="CEP"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.cep)}
                                        helperText={errors.cep}
                                    />

                                    <Box sx={{
                                        display: 'flex',
                                        gap: { xs: 1.5, sm: 2 },
                                        flexDirection: { xs: 'column', sm: 'row' }
                                    }}>
                                        <StyledInput
                                            label="Cidade"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            error={Boolean(errors.city)}
                                            helperText={errors.city}
                                            placeholder="Sao Paulo"
                                            sx={{ flex: 1 }}
                                        />
                                        <FormControl
                                            fullWidth
                                            size="medium"
                                            error={Boolean(errors.state)}
                                            sx={{
                                                flex: { xs: 1, sm: 0.5 },
                                                minWidth: { xs: '100%', sm: 120 },
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    backgroundColor: '#FFFFFF',
                                                    height: '56px',
                                                    '& fieldset': {
                                                        borderColor: errors.state ? '#d32f2f' : 'rgba(17, 30, 90, 0.15)',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: errors.state ? '#d32f2f' : 'rgba(17, 30, 90, 0.3)',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: errors.state ? '#d32f2f' : '#1852FE',
                                                        borderWidth: '2px',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: 'rgba(17, 30, 90, 0.6)',
                                                    '&.Mui-focused': {
                                                        color: errors.state ? '#d32f2f' : '#1852FE',
                                                    },
                                                },
                                            }}
                                        >
                                            <InputLabel>Estado</InputLabel>
                                            <Select
                                                value={formData.state}
                                                label="Estado"
                                                name="state"
                                                onChange={handleInputChange}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 250,
                                                            borderRadius: '12px',
                                                            mt: 0.5,
                                                        }
                                                    }
                                                }}
                                            >
                                                {brazilianStates.map((state) => (
                                                    <MenuItem key={state.value} value={state.value}>
                                                        {state.label} ({state.value})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.state && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
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
                                                sx={{
                                                    '&.Mui-checked': {
                                                        color: '#10B981',
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ color: '#4B5574' }}>
                                                Aceito os{' '}
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        textDecoration: 'underline',
                                                        color: '#1852FE',
                                                        cursor: 'pointer',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Termos e Condições
                                                </Typography>
                                                {' '}e{' '}
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        textDecoration: 'underline',
                                                        color: '#1852FE',
                                                        cursor: 'pointer',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Política de Privacidade
                                                </Typography>
                                            </Typography>
                                        }
                                        sx={{ alignItems: 'flex-start', mt: 1 }}
                                    />
                                    {errors.termsAccepted && (
                                        <Typography variant="caption" sx={{ color: '#EF4444', ml: 4, mt: -1 }}>
                                            {errors.termsAccepted}
                                        </Typography>
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
                                            sx={{
                                                borderRadius: '12px',
                                                flex: { xs: 1, sm: 0.35 },
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                py: 1.5,
                                                borderColor: 'rgba(17, 30, 90, 0.2)',
                                                color: '#4B5574',
                                                '&:hover': {
                                                    borderColor: 'rgba(17, 30, 90, 0.4)',
                                                    backgroundColor: 'rgba(17, 30, 90, 0.02)',
                                                }
                                            }}
                                        >
                                            Voltar
                                        </Button>
                                        <LoadingButton
                                            variant="contained"
                                            onClick={handleRegister}
                                            loading={loading}
                                            loadingText="Criando conta..."
                                            sx={{
                                                borderRadius: '12px',
                                                py: 1.5,
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                                },
                                            }}
                                        >
                                            Criar Conta Gratuita
                                        </LoadingButton>
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