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
} from "@mui/material";
import React, { useState } from "react";
import firebaseService from "../../../lib/firebaseService";
import { useRouter } from "next/navigation";
// Importe o hook de autenticação criado
import { useAuth } from "../authProvider";

export const AuthForms = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        cpf: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState("");
    const [passwordResetSent, setPasswordResetSent] = useState(false);
    const router = useRouter();
    const { setUserId } = useAuth();

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

    const formatCPF = (cpf) => {
        const digits = cpf.replace(/\D/g, "");
        if (digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        }
        return cpf;
    };

    const validateCPF = (cpf) => {
        const digits = cpf.replace(/\D/g, "");
        if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
            return false;
        }
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(digits.charAt(i)) * (10 - i);
        }
        let firstCheck = (sum * 10) % 11;
        if (firstCheck === 10 || firstCheck === 11) {
            firstCheck = 0;
        }
        if (firstCheck !== parseInt(digits.charAt(9))) {
            return false;
        }
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(digits.charAt(i)) * (11 - i);
        }
        let secondCheck = (sum * 10) % 11;
        if (secondCheck === 10 || secondCheck === 11) {
            secondCheck = 0;
        }
        return secondCheck === parseInt(digits.charAt(10));
    };

    const formatAndValidateCPF = async (cpf) => {
        const formattedCPF = formatCPF(cpf);
        const isValid = validateCPF(formattedCPF);
        if (!isValid) {
            return { formattedCPF, isValid, existsInDB: false };
        }
        const existsInDB = await firebaseService.checkUserByCPF(formattedCPF);
        return { formattedCPF, isValid, existsInDB };
    };

    // Handlers do formulário
    const handleToggleForm = () => {
        setIsLogin(!isLogin);
        setFormData({
            fullName: "",
            phone: "",
            email: "",
            cpf: "",
            password: "",
            confirmPassword: "",
        });
        setErrors({});
        setAuthError("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }
    };

    const handlePhoneBlur = () => {
        const formatted = formatPhone(formData.phone);
        setFormData((prev) => ({ ...prev, phone: formatted }));
    };

    const handleCPFBlur = async () => {
        if (formData.cpf.trim()) {
            const { formattedCPF } = await formatAndValidateCPF(formData.cpf);
            setFormData((prev) => ({ ...prev, cpf: formattedCPF }));
        }
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
            const { formattedCPF, isValid, existsInDB } = await formatAndValidateCPF(formData.cpf);
            if (!formData.cpf.trim() || !isValid) {
                newErrors.cpf = "CPF inválido";
            } else if (existsInDB) {
                newErrors.cpf = "CPF já cadastrado";
            } else {
                setFormData((prev) => ({ ...prev, cpf: formattedCPF }));
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
                // O redirecionamento agora é gerenciado pelo AuthProvider em vez de aqui
            } else {
                const userData = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    cpf: formData.cpf,
                    assinouPlano: false,
                };
                await firebaseService.signUp(formData.email, formData.password, userData);
                // O redirecionamento agora é gerenciado pelo AuthProvider
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
            gap={3}
            sx={{ width: "100%", maxWidth: 400, mx: "auto" }}
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
                    <Typography variant="h4" component="h1" sx={{ color: "primary.main" }}>
                        {isLogin ? "Entrar" : "Registre-se"}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Tudo que um médico precisa num só lugar!
                    </Typography>
                </Box>
            </Slide>

            {authError && (
                <Alert severity="error" sx={{ width: "100%" }}>
                    {authError}
                </Alert>
            )}

            <Stack spacing={2} width="100%">
                <Collapse in={!isLogin} timeout={500}>
                    <Box>
                        <TextField
                            label="Nome Completo"
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 8, mb: 2 }}
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            error={Boolean(errors.fullName)}
                            helperText={errors.fullName ? "Campo obrigatório" : ""}
                            color={errors.fullName ? "error" : "primary"}
                        />
                        <TextField
                            label="Telefone"
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                            }}
                            sx={{ borderRadius: 8, mb: 2 }}
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handlePhoneBlur}
                            error={Boolean(errors.phone)}
                            helperText={errors.phone ? "Campo obrigatório" : ""}
                            color={errors.phone ? "error" : "primary"}
                        />
                        <TextField
                            label="CPF"
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 8 }}
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            onBlur={handleCPFBlur}
                            error={Boolean(errors.cpf)}
                            helperText={errors.cpf || ""}
                            color={errors.cpf ? "error" : "primary"}
                        />
                    </Box>
                </Collapse>

                <TextField
                    label="E-mail"
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 8 }}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={Boolean(errors.email) || authError.includes("Email")}
                    helperText={errors.email ? (typeof errors.email === "string" ? errors.email : "Campo obrigatório") : ""}
                    color={(Boolean(errors.email) || authError.includes("Email")) ? "error" : "primary"}
                />
                <TextField
                    label="Senha"
                    type="password"
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 8 }}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={Boolean(errors.password) || authError.includes("senha")}
                    helperText={errors.password ? "Campo obrigatório" : ""}
                    color={(Boolean(errors.password) || authError.includes("senha")) ? "error" : "primary"}
                />
                <Collapse in={!isLogin} timeout={500}>
                    <TextField
                        label="Confirme sua senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        sx={{ borderRadius: 8 }}
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
                    />
                </Collapse>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSubmit}
                    sx={{ borderRadius: 8, py: 1.5 }}
                >
                    {isLogin ? "Entrar" : "Registrar"}
                </Button>
            </Stack>

            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Link href="#" color="secondary" underline="hover" onClick={handlePasswordReset}>
                    Esqueceu sua senha?
                </Link>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2">
                        {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                    </Typography>
                    <Link href="#" color="primary" underline="hover" onClick={handleToggleForm}>
                        {isLogin ? "Registre-se" : "Entre aqui"}
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthForms;
