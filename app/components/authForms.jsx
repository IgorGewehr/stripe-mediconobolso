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
} from "@mui/material";
import React, { useState } from "react";
import firebaseService from "../../lib/firebaseService";
import {useRouter} from "next/router";

export const AuthForms = () => {

    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});

    const handleToggleForm = () => {
        setIsLogin(!isLogin);
        setFormData({
            fullName: "",
            phone: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
        setErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatPhone = (phone) => {
        // Remove caracteres não numéricos
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 10) {
            // Formata como: XX XXXX-XXXX
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1 $2-$3");
        } else if (digits.length === 11) {
            // Formata como: XX XXXXX-XXXX
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "$1 $2-$3");
        }
        return phone;
    };

    const handlePhoneBlur = () => {
        const formatted = formatPhone(formData.phone);
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    const handleSubmit = async () => {
        // Validação dos campos obrigatórios


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
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 2000);
            return;
        }

        try {
            if (isLogin) {
                await firebaseService.login(formData.email, formData.password);
                console.log("Login efetuado com sucesso!");
            } else {
                const userData = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                };
                await firebaseService.signUp(formData.email, formData.password, userData);
                console.log("Cadastro efetuado com sucesso!");
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
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
            {/* Título com animação de entrada */}
            <Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={500}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                    <Typography variant="h4" component="h1">
                        {isLogin ? "Entrar" : "Registre-se"}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Tudo que um médico precisa num só lugar!
                    </Typography>
                </Box>
            </Slide>

            {/* Campos do formulário */}
            <Stack spacing={2} width="100%">
                {/* Campos exclusivos de registro */}
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
                        />
                        <TextField
                            label="Telefone"
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                            }}
                            sx={{ borderRadius: 8 }}
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handlePhoneBlur}
                            error={Boolean(errors.phone)}
                            helperText={errors.phone ? "Campo obrigatório" : ""}
                        />
                    </Box>
                </Collapse>

                {/* Campos comuns */}
                <TextField
                    label="E-mail"
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 8 }}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email ? "Campo obrigatório" : ""}
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
                    error={Boolean(errors.password)}
                    helperText={errors.password ? "Campo obrigatório" : ""}
                />

                {/* Campo de confirmação de senha */}
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

            {/* Links inferiores */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Link href="#" color="secondary" underline="hover">
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
