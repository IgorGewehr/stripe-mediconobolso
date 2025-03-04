"use client";

import React, { useState } from "react";
import { Box, Typography, Button, Switch, Fade } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";

const PlanCard = () => {
    const [selectedPlan, setSelectedPlan] = useState("annual");
    const router = useRouter();
    const monthlyPrice = 127;
    const annualTotalPrice = 1143;
    const annualMonthlyPrice = (annualTotalPrice / 12).toFixed(2);

    const handleChange = (event) => {
        setSelectedPlan(event.target.checked ? "annual" : "monthly");
    };

    const handleAssinar = () => {
        // Navega para a rota de checkout com o plano escolhido
        router.push(`/checkout?plan=${selectedPlan}`);
    };

    return (
        <Box
            sx={{
                width: 400,
                p: 4,
                borderRadius: 2,
                boxShadow: 4,
                backgroundColor: "background.paper",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
            }}
        >
            {/* Título principal */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Escolha seu Plano
            </Typography>
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "primary.main",
                }}
            >
                {selectedPlan === "monthly"
                    ? "Plano Mensal"
                    : "Plano Anual / 25% de desconto"}
            </Typography>

            {/* Exibição dinâmica do preço */}
            <Fade in timeout={300}>
                <Box
                    sx={{
                        width: "100%",
                        p: 2,
                        borderRadius: 2,
                        textAlign: "center",
                        backgroundColor: "white",
                        transition: "all 0.3s ease",
                    }}
                >
                    {selectedPlan === "monthly" ? (
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            R$ {monthlyPrice}/mês
                        </Typography>
                    ) : (
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            R$ {annualMonthlyPrice}/mês
                        </Typography>
                    )}
                </Box>
            </Fade>

            {/* Botão de Assinatura */}
            <Button
                variant="contained"
                color="primary"
                sx={{
                    width: "100%",
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                }}
                onClick={handleAssinar}
            >
                Assinar Agora
            </Button>

            {/* Seção de funcionalidades */}
            <Box sx={{ mt: 2, width: "100%" }}>
                <Typography variant="body1" sx={{ fontWeight: 400, mb: 0 }}>
                    Acesso completo a todas as funcionalidades premium
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">
                            Controle completo de pacientes
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">
                            Controle de agenda prático e intuitivo
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">
                            Acompanhamento de Exames e Receitas
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">
                            Anamnese completa de seus pacientes
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">Suporte prioritário</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Seletor de planos */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 2,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: selectedPlan === "monthly" ? "primary.main" : "text.secondary",
                    }}
                >
                    Mensal
                </Typography>
                <Switch
                    checked={selectedPlan === "annual"}
                    onChange={handleChange}
                    color="primary"
                    sx={{
                        "& .MuiSwitch-thumb": {
                            boxShadow: 0,
                        },
                    }}
                />
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: selectedPlan === "annual" ? "primary.main" : "text.secondary",
                    }}
                >
                    Anual
                </Typography>
            </Box>
        </Box>
    );
};

export default PlanCard;
