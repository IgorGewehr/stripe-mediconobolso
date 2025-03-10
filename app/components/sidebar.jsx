"use client";

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

const Sidebar = ({ initialSelected = "Dashboard", userName = "Dolittle", userRole = "Cirurgião", onMenuSelect }) => {
    const [selected, setSelected] = useState(initialSelected);

    const principalItems = [
        { label: "Dashboard", icon: "/dashboardico.svg" },
        { label: "Pacientes", icon: "/pacientes.svg" },
        { label: "Receitas", icon: "/receitas.svg" },
        { label: "Agenda", icon: "/agenda.svg" },
    ];

    const suporteItems = [
        { label: "Central de Ajuda", icon: "/centralajuda.svg" },
        { label: "Reportar", icon: "/reportar.svg" },
    ];

    const handleMenuClick = (label) => {
        setSelected(label);
        if (onMenuSelect) onMenuSelect(label);
    };

    const buttonStyles = (isSelected) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Gellix, sans-serif",
        fontSize: "14px", // Reduzido o tamanho da fonte
        fontWeight: 500,
        textTransform: "none",
        width: "100%",
        height: "36px", // Reduzido a altura do botão
        px: 2,
        py: 1,
        my: 0.5,
        borderRadius: "18px", // Ajustado para metade da altura para manter a proporção
        transition: "background-color 0.2s ease, color 0.2s ease",
        color: isSelected ? "#FFF" : "#111E5A",
        backgroundColor: isSelected ? "#4285F4" : "transparent",
        opacity: isSelected ? 0.77 : 1, // Adicionada a opacidade conforme solicitado
        "&:hover": {
            backgroundColor: isSelected ? "#4285F4" : "rgba(66, 133, 244, 0.08)",
        },
    });

    const iconStyles = {
        width: "18px", // Reduzido o tamanho do ícone
        height: "18px",
        mr: 1.2,
    };

    const categoryLabelStyle = {
        color: "#8A94A6",
        fontFamily: "Gellix, sans-serif",
        fontSize: "12px", // Reduzido o tamanho da fonte
        fontWeight: 500,
        mb: 0.8,
        mt: 2.5,
        ml: 1.5,
    };

    return (
        <Box
            sx={{
                backgroundColor: "#F8FAFF",
                height: "100vh",
                width: "240px",
                position: "relative",
                pl: "30px", // Padding-left de 30px conforme solicitado
                pr: "16px",
                pt: "30px", // Padding-top de 30px conforme solicitado
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Logo e Títulos */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4, ml: 0 }}>
                <Box
                    component="img"
                    src="/ico.svg"
                    alt="Logo"
                    sx={{ width: "47px", height: "44px", flexShrink: 0, ml: "4px" }} // Aumentado o tamanho da logo
                />
                <Box sx={{ ml: "10px" }}>
                    <Typography
                        sx={{
                            color: "#4285F4",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "18px", // Reduzido proporcionalmente em relação à logo
                            fontWeight: 500,
                            lineHeight: 1.2,
                        }}
                    >
                        Médico
                    </Typography>
                    <Typography
                        sx={{
                            color: "#8A94A6",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "9px", // Reduzido tamanho
                            letterSpacing: "2px",
                            fontWeight: 500,
                            lineHeight: 1.2,
                            opacity: 0.9, // Adicionado opacity conforme solicitado
                        }}
                    >
                        NO BOLSO
                    </Typography>
                </Box>
            </Box>

            {/* Seção de Menu */}
            <Box sx={{ flex: 1 }}>
                {/* Categoria Principal */}
                <Typography sx={categoryLabelStyle}>
                    Principal
                </Typography>
                <Box>
                    {principalItems.map((item) => {
                        const isSelected = selected === item.label;
                        return (
                            <Button
                                key={item.label}
                                onClick={() => handleMenuClick(item.label)}
                                variant="text"
                                sx={buttonStyles(isSelected)}
                                startIcon={
                                    <Box component="img" src={item.icon} alt={item.label} sx={iconStyles} />
                                }
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Box>

                {/* Categoria Suporte */}
                <Typography sx={categoryLabelStyle}>
                    Suporte
                </Typography>
                <Box>
                    {suporteItems.map((item) => {
                        const isSelected = selected === item.label;
                        return (
                            <Button
                                key={item.label}
                                onClick={() => handleMenuClick(item.label)}
                                variant="text"
                                sx={buttonStyles(isSelected)}
                                startIcon={
                                    <Box component="img" src={item.icon} alt={item.label} sx={iconStyles} />
                                }
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Box>
            </Box>

            {/* Área do Médico */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 1.8,
                    px: 1.5,
                    mt: 2,
                    mb: 2,
                    borderRadius: "12px",
                    border: "1px solid rgba(66, 133, 244, 0.15)",
                    backgroundColor: "rgba(248, 250, 255, 0.8)",
                }}
            >
                <Box
                    component="img"
                    src="/doctorimage.png"
                    alt="Doctor"
                    sx={{
                        width: "32px", // Reduzido
                        height: "32px",
                        borderRadius: "50%",
                        border: "2px solid #4285F4",
                        flexShrink: 0,
                    }}
                />
                <Box sx={{ ml: 1.2, flex: 1 }}>
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "13px", // Reduzido
                            fontWeight: 600,
                            lineHeight: 1.2,
                        }}
                    >
                        Dr. {userName}
                    </Typography>
                    <Typography
                        sx={{
                            color: "#8A94A6",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "11px", // Reduzido
                            fontWeight: 400,
                            lineHeight: 1.2,
                        }}
                    >
                        {userRole}
                    </Typography>
                </Box>
                <Box
                    component="img"
                    src="/chevron-down.svg"
                    alt="Expand"
                    sx={{
                        width: "14px", // Reduzido
                        height: "14px",
                    }}
                />
            </Box>
        </Box>
    );
};

export default Sidebar;