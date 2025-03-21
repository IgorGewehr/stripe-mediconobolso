"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Divider,
    Paper
} from "@mui/material";
import { useResponsiveScale } from "./useScale";

const CentralAjudaTemplate = ({ isReporte = false }) => {
    const [feedback, setFeedback] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const { scaleStyle } = useResponsiveScale();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Em uma aplicação real, isso enviaria os dados para um servidor
        console.log({ name, email, feedback });
        // Mostrar mensagem de sucesso
        setShowSuccess(true);
        // Resetar formulário
        setFeedback("");
        setEmail("");
        setName("");
    };

    const handleClose = () => {
        setShowSuccess(false);
    };

    const title = isReporte ? "Reportar Problema" : "Central de Ajuda";
    const subtitle = isReporte
        ? "Envie-nos detalhes sobre problemas encontrados no sistema"
        : "Como podemos ajudar?";

    return (
        <Box sx={{ maxWidth: "1000px", mx: "auto", p: 3, ...scaleStyle }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: '18px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        color: "#1852FE",
                        mb: 2,
                        fontWeight: 600,
                        fontFamily: "Gellix, sans-serif",
                        fontSize: { xs: '24px', md: '28px' }
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#111E5A",
                        mb: 4,
                        fontFamily: "Gellix, sans-serif"
                    }}
                >
                    {subtitle}
                </Typography>

                <Card sx={{ mb: 4, borderRadius: "12px", boxShadow: 'none', border: '1px solid rgba(66, 133, 244, 0.2)' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            sx={{
                                color: "#1852FE",
                                mb: 2,
                                fontFamily: "Gellix, sans-serif",
                                fontWeight: 500
                            }}
                        >
                            Contato Direto
                        </Typography>

                        <Typography
                            sx={{
                                color: "#111E5A",
                                mb: 1,
                                fontFamily: "Gellix, sans-serif"
                            }}
                        >
                            Para entrar em contato diretamente com nossa equipe:
                        </Typography>

                        <Typography
                            sx={{
                                color: "#1852FE",
                                fontWeight: 600,
                                mb: 0,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: '16px',
                                letterSpacing: '0.2px'
                            }}
                        >
                            mediconobolso@gmail.com
                        </Typography>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 4, opacity: 0.6 }} />

                <Typography
                    variant="h6"
                    sx={{
                        color: "#1852FE",
                        mb: 3,
                        fontFamily: "Gellix, sans-serif",
                        fontWeight: 500
                    }}
                >
                    {isReporte ? "Enviar Problema" : "Enviar Feedback"}
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        margin="normal"
                        required
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1852FE',
                                },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#1852FE',
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1852FE',
                                },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#1852FE',
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label={isReporte ? "Descreva o problema" : "Sua mensagem"}
                        multiline
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        margin="normal"
                        required
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1852FE',
                                },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#1852FE',
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        sx={{
                            bgcolor: "#1852FE",
                            color: "white",
                            fontFamily: "Gellix, sans-serif",
                            textTransform: "none",
                            fontWeight: 500,
                            px: 4,
                            py: 1.2,
                            borderRadius: "8px",
                            '&:hover': {
                                bgcolor: "#0039CB",
                            },
                        }}
                    >
                        Enviar
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClose}
                    severity="success"
                    sx={{
                        width: '100%',
                        borderRadius: '8px',
                        '& .MuiAlert-icon': {
                            color: '#1852FE'
                        }
                    }}
                >
                    Mensagem enviada com sucesso! Entraremos em contato em breve.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CentralAjudaTemplate;