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

export const AuthForms = () => {
    const [isLogin, setIsLogin] = useState(false);

    const handleToggleForm = () => {
        setIsLogin(!isLogin);
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
                {/* Campos exclusivos de registro com Collapse */}
                <Collapse in={!isLogin} timeout={500}>
                    <Box>
                        <TextField
                            label="Nome Completo"
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 8, mb: 2 }}
                        />
                        <TextField
                            label="Telefone"
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                            }}
                            sx={{ borderRadius: 8 }}
                        />
                    </Box>
                </Collapse>

                {/* Campos comuns */}
                <TextField label="E-mail" variant="outlined" fullWidth sx={{ borderRadius: 8 }} />
                <TextField label="Senha" type="password" variant="outlined" fullWidth sx={{ borderRadius: 8 }} />

                {/* Campo de confirmação de senha com Collapse */}
                <Collapse in={!isLogin} timeout={500}>
                    <TextField
                        label="Confirme sua senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        sx={{ borderRadius: 8 }}
                    />
                </Collapse>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleToggleForm}
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