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

export const AuthForms = () => {
    const [showPassword, setShowPassword] = useState(false);

    const initialFormData = {
        email: "",
        password: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState("");
    const [passwordResetSent, setPasswordResetSent] = useState(false);
    const router = useRouter();
    const { setUserId } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    const handleRegisterRedirect = () => {
        router.push("/free");
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: 400 },
                mx: "auto",
                p: { xs: 2, sm: 0 },
                backgroundColor: "white",
                borderRadius: { xs: 0, sm: 2 },
                boxShadow: 0,
                border: "none",
                py: { xs: 3, sm: 4 }
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

            <Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={500}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                    <Typography variant="h4" component="h1" sx={{
                        color: "primary.main",
                        fontSize: { xs: '1.75rem', sm: '2rem' }
                    }}>
                        Entrar
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{
                            textAlign: 'center',
                            px: 2,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        Tudo que um médico precisa num só lugar!
                    </Typography>
                </Box>
            </Slide>

            {authError && (
                <Alert severity="error" sx={{ width: "100%" }}>
                    {authError}
                </Alert>
            )}

            <Stack spacing={1.5} width="100%">
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
                    size={isMobile ? "small" : "medium"}
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
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleTogglePasswordVisibility}
                                    edge="end"
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
                        borderRadius: { xs: 4, sm: 8 },
                        py: { xs: 1, sm: 1.5 },
                        mt: 1
                    }}
                >
                    Entrar
                </Button>
            </Stack>

            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
                sx={{ mt: 1 }}
            >
                <Link
                    href="#"
                    color="secondary"
                    underline="hover"
                    onClick={handlePasswordReset}
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                    Esqueceu sua senha?
                </Link>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    flexWrap="wrap"
                    justifyContent="center"
                >
                    <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                        Não tem uma conta?
                    </Typography>
                    <Link
                        href="#"
                        color="primary"
                        underline="hover"
                        onClick={handleRegisterRedirect}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                        Registre-se
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthForms;