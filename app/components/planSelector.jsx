"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

const PlanSelector = () => {
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    const handleSelect = (plan) => {
        setSelectedPlan(plan);
    };

    // Define a posição do indicador com base no plano selecionado
    const indicatorLeft = selectedPlan === "monthly" ? "0%" : "50%";

    return (
        <Box
            sx={{
                width: { xs: "100%", sm: 300 },
                height: 120,
                position: "relative",
                border: "1px solid #ccc",
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: 2,
            }}
        >
            {/* Indicador animado */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: indicatorLeft,
                    width: "50%",
                    height: "100%",
                    backgroundColor: "primary.main",
                    opacity: 0.2,
                    transition: "left 0.3s ease",
                    zIndex: 1,
                }}
            />

            {/* Conteúdo dos planos */}
            <Box display="flex" height="100%" zIndex={2}>
                <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => handleSelect("monthly")}
                    sx={{
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.02)" },
                    }}
                >
                    <Typography
                        variant="h6"
                        color={selectedPlan === "monthly" ? "primary" : "text.primary"}
                    >
                        Mensal
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color={selectedPlan === "monthly" ? "primary" : "text.secondary"}
                    >
                        R$ 127
                    </Typography>
                </Box>
                <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => handleSelect("annual")}
                    sx={{
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.02)" },
                    }}
                >
                    <Typography
                        variant="h6"
                        color={selectedPlan === "annual" ? "primary" : "text.primary"}
                    >
                        Anual
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color={selectedPlan === "annual" ? "primary" : "text.secondary"}
                    >
                        R$ 1.143
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PlanSelector;
