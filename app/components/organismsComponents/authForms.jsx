"use client";

import {
    Box,
    Button,
    Link,
    Stack,
    TextField,
    Typography,
    Slide,
    Alert,
    Snackbar,
    useMediaQuery,
    useTheme,
    InputAdornment,
    IconButton
} from "@mui/material";
import React, { useState } from "react";
import firebaseService from "../../../lib/firebaseService";
import { useRouter } from "next/navigation";
import { useAuth } from "../authProvider";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleButton from './googleButton';

export const AuthForms = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const initialFormData = {
        email: "",
        password: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState("");
    const [passwordResetSent, setPasswordResetSent] = useState(false);
    const router = useRouter();
    const { setUserId, referralSource } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Handlers do formulário
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Resetar erros de autenticação quando o usuário digita no email ou senha
        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!formData.email.trim()) {
            setErrors((prev) => ({
                ...prev,
                email: "Informe seu e-mail para recuperar a senha",
            }));
            setTimeout(() => setErrors((prev) => ({ ...prev, email: false })), 3000);
            return;
        }
        try {
            await firebaseService.sendPasswordResetEmail(formData.email);
            setPasswordResetSent(true);
            setTimeout(() => setPasswordResetSent(false), 6000);
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error);
            setAuthError("Não foi possível enviar o email de recuperação. Verifique se o email está correto.");
        }
    };

    const handleLogin = async () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = true;
        if (!formData.password.trim()) newErrors.password = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 2000);
            return;
        }

        try {
            await firebaseService.login(formData.email, formData.password);
            // O redirecionamento é tratado pelo AuthProvider
        } catch (error) {
            console.error("Erro no login:", error);
            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
                setAuthError("Email ou senha incorretos.");
            } else if (error.code === "auth/invalid-email") {
                setAuthError("Email inválido.");
            } else if (error.code === "auth/too-many-requests") {
                setAuthError("Muitas tentativas. Tente novamente mais tarde.");
            } else {
                setAuthError("Erro na autenticação. Tente novamente.");
            }
        }
    };

    // Handler para login/signup com Google CORRIGIDO
    // components/AuthForms.jsx (só a função interna)
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setAuthError("");

        try {
            console.log('🔄 Iniciando login/signup com Google...');
            const { user, isNewUser } = await firebaseService.loginWithGoogle();

            console.log(
                isNewUser
                    ? '🆕 Conta Google criada e Firestore inicializado'
                    : '✅ Login com Google concluído – usuário existente'
            );
            // o AuthProvider observa a mudança e faz redirect automaticamente
        } catch (error) {
            console.error('❌ Erro no login/signup com Google:', error);
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    setAuthError("Você fechou o popup antes de concluir. Tente novamente.");
                    break;
                case 'auth/popup-blocked':
                    setAuthError("Pop-up bloqueado. Permita pop-ups e tente de novo.");
                    break;
                default:
                    setAuthError(error.message || "Erro no login com Google. Tente novamente.");
            }
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
            <Snackbar
                open={passwordResetSent}
                autoHideDuration={6000}
                onClose={() => setPasswordResetSent(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity="success" sx={{ width: "100%" }}>
                    Email de recuperação enviado com sucesso!
                </Alert>
            </Snackbar>

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
                        fontWeight: { xs: 600, md: 'normal' },
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

            {authError && (
                <Alert severity="error" sx={{
                    width: "100%",
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    borderRadius: { xs: 2, md: 1 }
                }}>
                    {authError}
                </Alert>
            )}

            <Stack spacing={{ xs: 2, sm: 2.5, md: 1.5 }} width="100%">
                <TextField
                    label="E-mail"
                    variant="outlined"
                    fullWidth
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={Boolean(errors.email) || authError.includes("Email")}
                    helperText={errors.email ? (typeof errors.email === "string" ? errors.email : "Campo obrigatório") : ""}
                    color={(Boolean(errors.email) || authError.includes("Email")) ? "error" : "primary"}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: { xs: 2, md: 1 },
                            fontSize: { xs: '1rem', md: 'inherit' }
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: { xs: '1rem', md: 'inherit' }
                        }
                    }}
                />
                <TextField
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    fullWidth
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={Boolean(errors.password) || authError.includes("senha")}
                    helperText={errors.password ? "Campo obrigatório" : ""}
                    color={(Boolean(errors.password) || authError.includes("senha")) ? "error" : "primary"}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: { xs: 2, md: 1 },
                            fontSize: { xs: '1rem', md: 'inherit' }
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: { xs: '1rem', md: 'inherit' }
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleTogglePasswordVisibility}
                                    edge="end"
                                    size={isSmallMobile ? "small" : "medium"}
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleLogin}
                    sx={{
                        borderRadius: { xs: 2, sm: 8, md: 8 },
                        py: { xs: 1.2, sm: 1.5, md: 1.5 },
                        mt: { xs: 2, md: 1 },
                        fontSize: { xs: '1rem', md: 'inherit' },
                        fontWeight: { xs: 600, md: 'normal' },
                        textTransform: { xs: 'none', md: 'uppercase' }
                    }}
                >
                    Entrar
                </Button>
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