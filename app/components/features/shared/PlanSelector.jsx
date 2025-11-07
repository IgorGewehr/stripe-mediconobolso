"use client";

import React from "react";
import { Box, Typography, Switch, Fade } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const PlanCard = ({ selectedPlan = "annual", onPlanChange, showButton = false }) => {
    const monthlyPrice = 127;
    const annualTotalPrice = 1143;
    const annualMonthlyPrice = (annualTotalPrice / 12).toFixed(2);

    const handleToggle = (event) => {
        const newPlan = event.target.checked ? "annual" : "monthly";
        if (onPlanChange) {
            onPlanChange(newPlan);
        }
    };

    // Funcionalidades comuns a todos os planos
    const commonFeatures = [
        "Controle completo de pacientes",
        "Controle de agenda prático e intuitivo",
        "Acompanhamento de Exames e Receitas",
        "Anamnese completa de seus pacientes",
        "Suporte prioritário",
    ];

    // Funcionalidades exclusivas para o plano anual
    const annualFeatures = [
        "Novas funções constantemente",
        "Atualizações frequentes",
        "Suporte 24hs",
    ];

    // Define a lista final de funcionalidades
    const features =
        selectedPlan === "annual"
            ? [...commonFeatures, ...annualFeatures]
            : commonFeatures;

    return (
        <Box
            sx={{
                width: 400,
                p: 4,
                borderRadius: 3,
                boxShadow: 4,
                backgroundColor: "background.paper",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: 6,
                },
            }}
        >
            {/* Banner de Teste Gratuito */}
            <Box
                sx={{
                    width: "100%",
                    py: 1,
                    backgroundColor: "primary.main",
                    borderRadius: 1,
                    textAlign: "center",
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 600, color: "white" }}>
                    Assine agora mesmo e adquira todas as vantagens!
                </Typography>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                Plano Selecionado
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                {selectedPlan === "monthly"
                    ? "Plano Mensal"
                    : "Plano Anual / 25% de desconto"}
            </Typography>

            <Fade in timeout={300}>
                <Box
                    sx={{
                        width: "100%",
                        p: 3,
                        borderRadius: 2,
                        textAlign: "center",
                        backgroundColor: "grey.50",
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

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 2,
                }}
            >
                <Typography variant="subtitle2" sx={{ color: selectedPlan === "monthly" ? "primary.main" : "text.secondary" }}>
                    Mensal
                </Typography>
                <Switch
                    checked={selectedPlan === "annual"}
                    onChange={handleToggle}
                    color="primary"
                    sx={{ "& .MuiSwitch-thumb": { boxShadow: 0 } }}
                />
                <Typography variant="subtitle2" sx={{ color: selectedPlan === "annual" ? "primary.main" : "text.secondary" }}>
                    Anual
                </Typography>
            </Box>

            {/* Seção de Funcionalidades */}
            <Box sx={{ mt: 2, width: "100%" }}>
                <Typography variant="body1" sx={{ fontWeight: 400, mb: 1 }}>
                    Acesso completo a todas as funcionalidades premium:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {features.map((feature, index) => (
                        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />
                            <Typography variant="body2">{feature}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default PlanCard;
