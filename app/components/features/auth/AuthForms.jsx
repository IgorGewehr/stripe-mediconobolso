"use client";

import {
    Alert,
    Box,
    Button,
    Link,
    Stack,
    Typography,
    Slide,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "../../../../lib/services/firebase";
import { authApiService } from "../../../../lib/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from '../../providers/authProvider';
import GoogleButton from './GoogleButton';
import { useFeedback, StyledInput, LoadingButton } from '../../ui/feedback';

export const AuthForms = () => {
    const [googleLoading, setGoogleLoading] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showExisting, setShowExisting] = useState(false);
    const searchParams = useSearchParams();

    const initialFormData = {
        email: "",
        password: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { setUserId, referralSource } = useAuth();
    const { success, error: showError } = useFeedback();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Verificar se veio do lead signup
    useEffect(() => {
        const email = searchParams.get('email');
        const welcome = searchParams.get('welcome');
        const existing = searchParams.get('existing');

        if (email) {
            setFormData(prev => ({ ...prev, email }));
        }
        if (welcome === 'true') {
            setShowWelcome(true);
            // Remover o param da URL sem recarregar
            const url = new URL(window.location.href);
            url.searchParams.delete('welcome');
            window.history.replaceState({}, '', url.toString());
        }
        if (existing === 'true') {
            setShowExisting(true);
            // Remover o param da URL sem recarregar
            const url = new URL(window.location.href);
            url.searchParams.delete('existing');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams]);

    // Handlers do formulário
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Limpar erros quando o usuário digita
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!formData.email.trim()) {
            setErrors((prev) => ({
                ...prev,
                email: "Informe seu e-mail para recuperar a senha",
            }));
            return;
        }
        try {
            await authService.sendPasswordResetEmail(formData.email);
            success("Email de recuperação enviado!", {
                description: "Verifique sua caixa de entrada e spam."
            });
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error);
            showError("Não foi possível enviar o email", {
                description: "Verifique se o email está correto e tente novamente."
            });
        }
    };

    const handleLogin = async () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
        if (!formData.password.trim()) newErrors.password = "Senha é obrigatória";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoginLoading(true);
        try {
            await authService.login(formData.email, formData.password);

            // Provisionamento agora é tratado automaticamente pelo AuthProvider
            // quando detecta um novo usuário sem cadastro no backend

            success("Login realizado com sucesso!", {
                description: "Aguarde..."
            });
            // A navegação agora é controlada pelo AuthProvider
        } catch (error) {
            console.error("Erro no login:", error);
            let errorMessage = "Erro na autenticação";
            let errorDescription = "Tente novamente.";

            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
                errorMessage = "Credenciais inválidas";
                errorDescription = "Email ou senha incorretos.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Email inválido";
                errorDescription = "Verifique o formato do email.";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Muitas tentativas";
                errorDescription = "Aguarde alguns minutos e tente novamente.";
            }

            showError(errorMessage, { description: errorDescription });
        } finally {
            setLoginLoading(false);
        }
    };

    // Handler para login/signup com Google
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);

        try {
            console.log('🔄 Iniciando login/signup com Google...');
            const { user, isNewUser } = await authService.loginWithGoogle();

            console.log(
                isNewUser
                    ? '🆕 Conta Google criada'
                    : '✅ Login com Google concluído – usuário existente'
            );

            // Provisionamento agora é tratado automaticamente pelo AuthProvider
            console.log('✅ Autenticação Google realizada, aguardando AuthProvider...');

            success("Login realizado com sucesso!", {
                description: "Aguarde..."
            });
            // A navegação agora é controlada pelo AuthProvider
        } catch (error) {
            console.error('❌ Erro no login/signup com Google:', error);
            let errorMessage = "Erro no login com Google";
            let errorDescription = "Tente novamente.";

            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Login cancelado";
                    errorDescription = "Você fechou o popup antes de concluir.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage = "Pop-up bloqueado";
                    errorDescription = "Permita pop-ups no navegador e tente novamente.";
                    break;
                default:
                    errorDescription = error.message || "Tente novamente.";
            }

            showError(errorMessage, { description: errorDescription });
        } finally {
            setGoogleLoading(false);
        }
    };


    const handleRegisterRedirect = () => {
        router.push("/free");
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 1.5, sm: 2 }}
            sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: 450, md: 400 },
                mx: "auto",
                p: { xs: 3, sm: 4, md: 0 },
                backgroundColor: "white",
                borderRadius: { xs: 3, sm: 2, md: 0 },
                boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', md: 0 },
                border: { xs: '1px solid #f0f0f0', md: "none" },
                py: { xs: 4, sm: 5, md: 4 },
                position: 'relative'
            }}
        >
            {/* Alerta de boas-vindas para novos leads */}
            {showWelcome && (
                <Alert
                    severity="success"
                    onClose={() => setShowWelcome(false)}
                    sx={{
                        width: '100%',
                        mb: 2,
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                            width: '100%',
                        }
                    }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Conta criada com sucesso!
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Sua senha foi enviada para o email informado. Verifique sua caixa de entrada.
                    </Typography>
                </Alert>
            )}

            {/* Alerta para usuarios existentes */}
            {showExisting && (
                <Alert
                    severity="info"
                    onClose={() => setShowExisting(false)}
                    sx={{
                        width: '100%',
                        mb: 2,
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                            width: '100%',
                        }
                    }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Voce ja tem uma conta!
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Use sua senha existente ou clique em "Esqueceu sua senha?" para recupera-la.
                    </Typography>
                </Alert>
            )}

            {/* Logo apenas no mobile */}
            {isMobile && (
                <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{
                        width: { xs: 50, sm: 60 },
                        height: 'auto',
                        mb: { xs: 2, sm: 3 },
                        cursor: 'pointer'
                    }}
                    onClick={() => window.open('https://mediconobolso.com', '_blank')}
                />
            )}

            <Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={500}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                    <Typography variant="h4" component="h1" sx={{
                        color: "primary.main",
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                        fontWeight: 600,
                        textAlign: 'center'
                    }}>
                        Entrar
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{
                            textAlign: 'center',
                            px: { xs: 1, sm: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                            lineHeight: 1.4,
                            mb: { xs: 1, sm: 0 }
                        }}
                    >
                        Tudo que um médico precisa num só lugar!
                    </Typography>
                </Box>
            </Slide>

            {/* Botão Google Auth Profissional */}
            <Box sx={{ width: '100%', mt: { xs: 1, md: 0 } }}>
                <GoogleButton
                    onClick={handleGoogleLogin}
                    loading={googleLoading}
                    type="signin"
                    size={isSmallMobile ? "medium" : "medium"}
                    fullWidth
                />
            </Box>

            {/* Divisor "ou" */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                my: { xs: 2, md: 2 },
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

            <Stack spacing={{ xs: 2, sm: 2.5, md: 2 }} width="100%">
                <StyledInput
                    label="E-mail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    placeholder="seu@email.com"
                    size={isSmallMobile ? "small" : "medium"}
                />

                <StyledInput
                    label="Senha"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    placeholder="Sua senha"
                    size={isSmallMobile ? "small" : "medium"}
                />

                <LoadingButton
                    variant="contained"
                    color="primary"
                    fullWidth
                    loading={loginLoading}
                    loadingText="Entrando..."
                    onClick={handleLogin}
                    sx={{
                        borderRadius: '12px',
                        py: { xs: 1.5, sm: 1.75 },
                        mt: { xs: 1, md: 0.5 },
                        fontSize: '15px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(24, 82, 254, 0.25)',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(24, 82, 254, 0.35)',
                        }
                    }}
                >
                    Entrar
                </LoadingButton>
            </Stack>

            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={{ xs: 1.5, md: 1 }}
                sx={{ mt: { xs: 2, md: 1 } }}
            >
                <Link
                    href="#"
                    color="secondary"
                    underline="hover"
                    onClick={handlePasswordReset}
                    sx={{
                        fontSize: { xs: '0.9rem', sm: '0.875rem', md: '1rem' },
                        fontWeight: { xs: 500, md: 'normal' }
                    }}
                >
                    Esqueceu sua senha?
                </Link>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="wrap"
                    justifyContent="center"
                    sx={{ px: { xs: 2, md: 0 } }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: { xs: '0.85rem', sm: '0.8rem', md: '0.875rem' },
                            textAlign: 'center'
                        }}
                    >
                        Não tem uma conta?
                    </Typography>
                    <Link
                        href="#"
                        color="primary"
                        underline="hover"
                        onClick={handleRegisterRedirect}
                        sx={{
                            fontSize: { xs: '0.85rem', sm: '0.8rem', md: '0.875rem' },
                            fontWeight: { xs: 600, md: 'normal' }
                        }}
                    >
                        Registre-se
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthForms;