"use client";

import {
    Box,
    Button,
    Link,
    Stack,
    TextField,
    Typography,
    InputAdornment,
    Slide,
    Collapse,
    Alert,
    Snackbar,
    useMediaQuery,
    useTheme,
    Checkbox,
    FormControlLabel,
    FormControl,
    FormHelperText,
    IconButton
} from "@mui/material";
import React, { useState } from "react";
import firebaseService from "../../../lib/firebaseService";
import { useRouter } from "next/navigation";
import { useAuth } from "../authProvider";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const AuthForms = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const initialFormData = {
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
    };

    const [formData, setFormData] = useState(initialFormData);

    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState("");
    const [passwordResetSent, setPasswordResetSent] = useState(false);
    const router = useRouter();
    const { setUserId } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Funções auxiliares para formatação e validação
    const formatPhone = (phone) => {
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1 $2-$3");
        } else if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "$1 $2-$3");
        }
        return phone;
    };

    // Handlers do formulário
    const handleToggleForm = () => {
        setIsLogin(!isLogin);
        setFormData(initialFormData);
        setErrors({});
        setAuthError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Resetar erros de autenticação quando o usuário digita no email ou senha
        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }
    };

    const handlePhoneBlur = () => {
        const formatted = formatPhone(formData.phone);
        setFormData((prev) => ({ ...prev, phone: formatted }));
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

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = true;
        if (!formData.password.trim()) newErrors.password = true;
        if (!isLogin) {
            if (!formData.fullName.trim()) newErrors.fullName = true;
            if (!formData.phone.trim()) newErrors.phone = true;
            if (!formData.confirmPassword.trim()) newErrors.confirmPassword = true;
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = true;
            }

            // Verifica se os termos foram aceitos
            if (!formData.acceptedTerms) {
                newErrors.acceptedTerms = true;
            }
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 2000);
            return;
        }
        try {
            if (isLogin) {
                await firebaseService.login(formData.email, formData.password);
            } else {
                const userData = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    assinouPlano: false,
                };
                await firebaseService.signUp(formData.email, formData.password, userData);
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
                setAuthError("Email ou senha incorretos.");
            } else if (error.code === "auth/email-already-in-use") {
                setAuthError("Este email já está em uso.");
            } else if (error.code === "auth/weak-password") {
                setAuthError("A senha é muito fraca. Use pelo menos 6 caracteres.");
            } else if (error.code === "auth/invalid-email") {
                setAuthError("Email inválido.");
            } else if (error.code === "auth/too-many-requests") {
                setAuthError("Muitas tentativas. Tente novamente mais tarde.");
            } else {
                setAuthError("Erro na autenticação. Tente novamente.");
            }
        }
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
                        {isLogin ? "Entrar" : "Registre-se"}
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
                <Collapse in={!isLogin} timeout={500}>
                    <Box>
                        <TextField
                            label="Nome Completo"
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 1.5 }}
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            error={Boolean(errors.fullName)}
                            helperText={errors.fullName ? "Campo obrigatório" : ""}
                            color={errors.fullName ? "error" : "primary"}
                            size={isMobile ? "small" : "medium"}
                        />
                        <TextField
                            label="Telefone"
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                            }}
                            sx={{ mb: 1.5 }}
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handlePhoneBlur}
                            error={Boolean(errors.phone)}
                            helperText={errors.phone ? "Campo obrigatório" : ""}
                            color={errors.phone ? "error" : "primary"}
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                </Collapse>

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
                <Collapse in={!isLogin} timeout={500}>
                    <TextField
                        label="Confirme sua senha"
                        type={showConfirmPassword ? "text" : "password"}
                        variant="outlined"
                        fullWidth
                        sx={{ borderRadius: { xs: 1, sm: 2 } }}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        error={Boolean(errors.confirmPassword)}
                        helperText={
                            errors.confirmPassword
                                ? formData.password !== formData.confirmPassword
                                    ? "As senhas não conferem"
                                    : "Campo obrigatório"
                                : ""
                        }
                        color={errors.confirmPassword ? "error" : "primary"}
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleToggleConfirmPasswordVisibility}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
                {!isLogin && (
                    <Box sx={{ mt: 2 }}>
                        <FormControl error={Boolean(errors.acceptedTerms)} component="fieldset" variant="standard">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.acceptedTerms}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, acceptedTerms: e.target.checked }))
                                        }
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Li e aceito o <strong>Termo de Condições de uso</strong>
                                    </Typography>
                                }
                            />
                            {errors.acceptedTerms && (
                                <FormHelperText>
                                    Você precisa aceitar os Termos de Condições de uso.
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Box>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSubmit}
                    sx={{
                        borderRadius: { xs: 4, sm: 8 },
                        py: { xs: 1, sm: 1.5 },
                        mt: 1
                    }}
                >
                    {isLogin ? "Entrar" : "Registrar"}
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
                        {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                    </Typography>
                    <Link
                        href="#"
                        color="primary"
                        underline="hover"
                        onClick={handleToggleForm}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                        {isLogin ? "Registre-se" : "Entre aqui"}
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthForms;