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
    FormControlLabel, FormControl, FormHelperText, CircularProgress
} from "@mui/material";
import React, { useState } from "react";
import firebaseService from "../../../lib/firebaseService";
import { useRouter } from "next/navigation";
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
        acceptedTerms: false,
        // Campos de endereço
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        // Indicador de carregamento
        isLoadingAddress: false,
    });
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



    const handleCEPBlur = async () => {
        const cep = formData.cep.replace(/\D/g, "");
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }
    };
    const fetchAddressByCEP = async (cep) => {
        try {
            // Mostrar indicador de carregamento (opcional)
            setFormData(prev => ({
                ...prev,
                isLoadingAddress: true // Você precisará adicionar este campo ao estado inicial
            }));

            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro || "",
                    neighborhood: data.bairro || "",
                    city: data.localidade || "",
                    state: data.uf || "",
                    isLoadingAddress: false
                }));

                // Adicionar um foco automático no campo de número após preencher o endereço
                const numberField = document.querySelector('input[name="number"]');
                if (numberField) {
                    numberField.focus();
                }
            } else {
                // CEP não encontrado
                setErrors(prev => ({
                    ...prev,
                    cep: "CEP não encontrado"
                }));
                setTimeout(() => setErrors(prev => ({ ...prev, cep: false })), 3000);
                setFormData(prev => ({ ...prev, isLoadingAddress: false }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setFormData(prev => ({ ...prev, isLoadingAddress: false }));
            setErrors(prev => ({
                ...prev,
                cep: "Erro ao buscar o CEP"
            }));
            setTimeout(() => setErrors(prev => ({ ...prev, cep: false })), 3000);
        }
    };

    const formatCEP = (cep) => {
        const digits = cep.replace(/\D/g, "");
        if (digits.length === 8) {
            return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
        }
        return cep;
    };
    const handleCEPInput = () => {
        const formatted = formatCEP(formData.cep);
        setFormData(prev => ({ ...prev, cep: formatted }));
        handleCEPBlur();
    };

    const validateCEP = (cep) => {
        const digits = cep.replace(/\D/g, "");
        return digits.length === 8;
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

        // Resetar erros de autenticação quando o usuário digita no email ou senha
        if ((name === "email" || name === "password") && authError) {
            setAuthError("");
        }

        // Verificar automaticamente o CEP quando ele tiver 8 dígitos
        if (name === "cep") {
            const digits = value.replace(/\D/g, "");

            // Formatar o CEP enquanto digita
            let formattedCep = value;
            if (digits.length <= 8) {
                formattedCep = digits;
                if (digits.length > 5) {
                    formattedCep = digits.replace(/(\d{5})(\d{0,3})/, "$1-$2");
                }

                setFormData(prev => ({ ...prev, cep: formattedCep }));
            }

            // Buscar o CEP quando tiver 8 dígitos
            if (digits.length === 8) {
                // Adicione um pequeno delay para garantir uma boa experiência ao usuário
                setTimeout(() => {
                    fetchAddressByCEP(digits);
                }, 500);
            }
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
            if (!formData.cep.trim() || !validateCEP(formData.cep)) {
                newErrors.cep = "CEP inválido";
            }
            if (!formData.street.trim()) newErrors.street = true;
            if (!formData.number.trim()) newErrors.number = true;
            if (!formData.neighborhood.trim()) newErrors.neighborhood = true;
            if (!formData.city.trim()) newErrors.city = true;
            if (!formData.state.trim()) newErrors.state = true;

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
                    cpf: formData.cpf,
                    address: {
                        cep: formData.cep,
                        street: formData.street,
                        number: formData.number,
                        complement: formData.complement,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state.toUpperCase(),
                    },
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
                boxShadow: 0, // Remove a sombra
                border: "none", // Garante que nenhuma borda seja aplicada
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
                        <TextField
                            label="CPF"
                            variant="outlined"
                            fullWidth
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            onBlur={handleCPFBlur}
                            error={Boolean(errors.cpf)}
                            helperText={errors.cpf || ""}
                            color={errors.cpf ? "error" : "primary"}
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                </Collapse>

                <Collapse in={!isLogin && formData.cpf && validateCPF(formData.cpf)} timeout={500}>
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 2,
                            mb: 2,
                            mt: 1.5
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            color="primary"
                            sx={{ mb: 1.5, fontWeight: 'medium' }}
                        >
                            Endereço
                        </Typography>

                        <Box sx={{ mb: 1.5 }}>
                            <TextField
                                label="CEP"
                                variant="outlined"
                                fullWidth
                                name="cep"
                                value={formData.cep}
                                onChange={handleInputChange}
                                error={Boolean(errors.cep)}
                                helperText={
                                    errors.cep
                                        ? errors.cep
                                        : (formData.street && formData.city)
                                            ? "Endereço encontrado!"
                                            : "Digite apenas números"
                                }
                                placeholder="00000-000"
                                inputProps={{ maxLength: 9 }}
                                size={isMobile ? "small" : "medium"}
                                sx={{ mb: 1.5 }}
                                InputProps={{
                                    endAdornment: formData.isLoadingAddress ? (
                                        <InputAdornment position="end">
                                            <CircularProgress size={20} />
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                <TextField
                                    label="Logradouro"
                                    variant="outlined"
                                    fullWidth
                                    name="street"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    error={Boolean(errors.street)}
                                    helperText={errors.street ? "Campo obrigatório" : ""}
                                    size={isMobile ? "small" : "medium"}
                                    sx={{ flexGrow: 3 }}
                                />
                                <TextField
                                    label="Nº"
                                    variant="outlined"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    error={Boolean(errors.number)}
                                    helperText={errors.number ? "Obrigatório" : ""}
                                    size={isMobile ? "small" : "medium"}
                                    sx={{ width: '80px' }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <TextField
                                    label="Bairro"
                                    variant="outlined"
                                    fullWidth
                                    name="neighborhood"
                                    value={formData.neighborhood}
                                    onChange={handleInputChange}
                                    error={Boolean(errors.neighborhood)}
                                    helperText={errors.neighborhood ? "Campo obrigatório" : ""}
                                    size={isMobile ? "small" : "medium"}
                                />
                                <TextField
                                    label="Complemento"
                                    variant="outlined"
                                    fullWidth
                                    name="complement"
                                    value={formData.complement}
                                    onChange={handleInputChange}
                                    size={isMobile ? "small" : "medium"}
                                    placeholder="Opcional"
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField
                                label="Cidade"
                                variant="outlined"
                                fullWidth
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                error={Boolean(errors.city)}
                                helperText={errors.city ? "Campo obrigatório" : ""}
                                size={isMobile ? "small" : "medium"}
                                sx={{ flexGrow: 3 }}
                            />
                            <TextField
                                label="UF"
                                variant="outlined"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                error={Boolean(errors.state)}
                                helperText={errors.state ? "Obrigatório" : ""}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                                sx={{ width: '70px' }}
                            />
                        </Box>
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
                    type="password"
                    variant="outlined"
                    fullWidth
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={Boolean(errors.password) || authError.includes("senha")}
                    helperText={errors.password ? "Campo obrigatório" : ""}
                    color={(Boolean(errors.password) || authError.includes("senha")) ? "error" : "primary"}
                    size={isMobile ? "small" : "medium"}
                />
                <Collapse in={!isLogin} timeout={500}>
                    <TextField
                        label="Confirme sua senha"
                        type="password"
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