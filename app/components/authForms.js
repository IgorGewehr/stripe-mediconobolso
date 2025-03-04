"use client";

import { Box, Button, Link, Stack, TextField, Typography, InputAdornment } from "@mui/material";
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
            position="relative"
            sx={{ width: "100%", maxWidth: 400, mx: "auto" }}
        >
            <Box display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                <Typography variant="h4" component="h1">
                    {isLogin ? "Entrar" : "Registre-se"}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Tudo que um médico precisa num só lugar!
                </Typography>
            </Box>

            <Stack spacing={2} width="100%">
                {!isLogin && (
                    <>
                        <TextField label="Nome Completo" variant="outlined" fullWidth />
                        <TextField
                            label="Telefone"
                            variant="outlined"
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                            }}
                        />
                    </>
                )}

                <TextField label="E-mail" variant="outlined" fullWidth />
                <TextField label="Senha" type="password" variant="outlined" fullWidth />
                {!isLogin && (
                    <TextField label="Confirme sua senha" type="password" variant="outlined" fullWidth />
                )}

                <Button variant="contained" color="primary" fullWidth onClick={handleToggleForm}>
                    {isLogin ? "Entrar" : "Registrar"}
                </Button>
            </Stack>

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
