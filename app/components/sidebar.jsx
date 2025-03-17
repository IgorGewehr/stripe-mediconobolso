"use client";

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

const Sidebar = ({ initialSelected = "Dashboard", userName = "Dolittle", userRole = "Cirurgião", onMenuSelect, onLogout }) => {
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
        { label: "Logout", icon: "/logout.svg", isLogout: true }, // Novo item de logout
    ];

    const handleMenuClick = (label, isLogout) => {
        if (isLogout && onLogout) {
            onLogout();
            return;
        }

        setSelected(label);
        if (onMenuSelect) onMenuSelect(label);
    };

    const buttonStyles = (isSelected, label, isLogout) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Gellix, sans-serif",
        fontSize: "12px",
        fontWeight: 500,
        textTransform: "none",
        width: label === "Central de Ajuda" ? "180px" : "150px",
        height: "28px",
        px: 2,
        py: 1,
        my: 0.5,
        borderRadius: "18px",
        transition: "background-color 0.2s ease, color 0.2s ease",
        color: isSelected ? "#FFF" : (isLogout ? "#DB4437" : "#111E5A"),
        backgroundColor: isSelected ? "#4285F4" : "transparent",
        opacity: isSelected ? 0.77 : 1,
        "&:hover": {
            backgroundColor: isSelected
                ? "#4285F4"
                : (isLogout ? "rgba(219, 68, 55, 0.08)" : "rgba(66, 133, 244, 0.08)"),
        },
    });

    const iconStyles = {
        width: "18px",
        height: "18px",
        mr: 1.2,
    };

    const categoryLabelStyle = {
        color: "#8A94A6",
        fontFamily: "Gellix, sans-serif",
        fontSize: "12px",
        fontWeight: 500,
        mb: 0.8,
        mt: 2.5,
        ml: 1.5,
    };

    return (
        <Box
            sx={{
                backgroundColor: "#F8FAFF",
                height: "100%", // Mudado para 100% ao invés de 100vh
                width: "100%", // Mudado para 100% para respeitar o container pai
                position: "relative",
                pl: "30px",
                pr: "16px",
                pt: "30px",
                pb: "16px", // Adicionado padding-bottom para evitar cortes no final
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden", // Evitar rolagem horizontal
            }}
        >
            {/* Logo e título */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 4,
                    ml: 0,
                    flexShrink: 0, // Impede que esta seção encolha
                }}
            >
                <Box
                    component="img"
                    src="/ico.svg"
                    alt="Logo"
                    sx={{
                        width: "47px",
                        height: "44px",
                        flexShrink: 0,
                        ml: "4px",
                        objectFit: "contain", // Garante que a imagem seja exibida completamente
                    }}
                />
                <Box sx={{ ml: "10px" }}>
                    <Typography
                        sx={{
                            color: "#4285F4",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "18px",
                            fontWeight: 500,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap", // Impede quebra de linha no título
                        }}
                    >
                        Médico
                    </Typography>
                    <Typography
                        sx={{
                            color: "#8A94A6",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "9px",
                            letterSpacing: "2px",
                            fontWeight: 500,
                            lineHeight: 1.2,
                            opacity: 0.9,
                            whiteSpace: "nowrap", // Impede quebra de linha no subtítulo
                        }}
                    >
                        NO BOLSO
                    </Typography>
                </Box>
            </Box>

            {/* Menus - com overflow auto para permitir rolagem quando necessário */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
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
                                sx={buttonStyles(isSelected, item.label)}
                                startIcon={
                                    <Box component="img" src={item.icon} alt={item.label} sx={iconStyles} />
                                }
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Box>

                <Typography sx={categoryLabelStyle}>
                    Suporte
                </Typography>
                <Box>
                    {suporteItems.map((item) => {
                        const isSelected = selected === item.label;
                        return (
                            <Button
                                key={item.label}
                                onClick={() => handleMenuClick(item.label, item.isLogout)}
                                variant="text"
                                sx={buttonStyles(isSelected, item.label, item.isLogout)}
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

            {/* Perfil do usuário */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 1.8,
                    px: 1.5,
                    mt: 2,
                    mb: 0, // Ajustado para 0, já que temos padding no container principal
                    borderRadius: "12px",
                    border: "1px solid rgba(66, 133, 244, 0.15)",
                    backgroundColor: "rgba(248, 250, 255, 0.8)",
                    flexShrink: 0, // Impede que esta seção encolha
                }}
            >
                <Box
                    component="img"
                    src="/doctorimage.png"
                    alt="Doctor"
                    sx={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "2px solid #4285F4",
                        flexShrink: 0,
                    }}
                />
                <Box sx={{ ml: 1.2, flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Dr. {userName}
                    </Typography>
                    <Typography
                        sx={{
                            color: "#8A94A6",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "11px",
                            fontWeight: 400,
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
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
                        width: "14px",
                        height: "14px",
                        flexShrink: 0,
                    }}
                />
            </Box>
        </Box>
    );
};

export default Sidebar;