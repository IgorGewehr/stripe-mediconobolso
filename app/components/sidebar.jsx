"use client";

import React, { useState } from "react";
import { Box, Button, Typography, Avatar } from "@mui/material";
import { useResponsiveScale } from "./useScale";
import { useAuth } from "./authProvider";
import LockIcon from "@mui/icons-material/Lock";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const Sidebar = ({
                     initialSelected = "Dashboard",
                     userName = "Dolittle",
                     userRole = "Cirurgião",
                     onMenuSelect,
                     onLogout,
                     onProfileClick,
                 }) => {
    const [selected, setSelected] = useState(initialSelected);
    const { user } = useAuth();
    const { scaleStyle } = useResponsiveScale();

    const isAdmin = user && user.administrador === true;

    const principalItems = [
        { label: "Dashboard", icon: "/dashboardico.svg" },
        { label: "Pacientes", icon: "/pacientes.svg" },
        { label: "Receitas", icon: "/receitas.svg" },
        { label: "Agenda", icon: "/agenda.svg" },
        { label: "Métricas", icon: "/metricas.svg", disabled: true },
        { label: "Financeiro", icon: "/financeiro.svg", disabled: true },
        // Só adiciona se for admin
        ...(isAdmin
            ? [{ label: "Dados", iconComponent: AdminPanelSettingsIcon }]
            : []),
    ];

    const suporteItems = [
        { label: "Central de Ajuda", icon: "/centralajuda.svg" },
        { label: "Reportar", icon: "/reportar.svg" },
    ];

    const handleMenuClick = (label, isLogout = false, disabled = false) => {
        if (disabled) return;
        if (isLogout && onLogout) {
            onLogout();
            return;
        }
        setSelected(label);
        onMenuSelect?.(label);
    };

    const handleProfileClick = () => {
        if (onProfileClick) onProfileClick();
        else onMenuSelect?.("Meu Perfil");
    };

    const buttonStyles = (isSelected, label, isLogout, disabled) => ({
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
        color: disabled
            ? "#8A94A6"
            : isSelected
                ? "#FFF"
                : isLogout
                    ? "#DB4437"
                    : "#111E5A",
        backgroundColor: isSelected ? "#4285F4" : "transparent",
        opacity: disabled ? 0.6 : isSelected ? 0.77 : 1,
        cursor: disabled ? "default" : "pointer",
        "&:hover": {
            backgroundColor: disabled
                ? "transparent"
                : isSelected
                    ? "#4285F4"
                    : isLogout
                        ? "rgba(219, 68, 55, 0.08)"
                        : "rgba(66, 133, 244, 0.08)",
        },
    });

    const iconStyles = { width: "18px", height: "18px", mr: 1.2 };
    const lockIconStyles = { width: "14px", height: "14px", ml: 0.8, color: "#8A94A6" };
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
                height: "100vh",
                width: "240px",
                position: "relative",
                pl: "30px",
                pr: "16px",
                pt: "30px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    ...scaleStyle,
                }}
            >
                {/* Logo */}
                <Box
                    onClick={() => handleMenuClick("Dashboard")}
                    sx={{ display: "flex", alignItems: "center", mb: 4, flexShrink: 0 }}
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
                            objectFit: "contain",
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
                                whiteSpace: "nowrap",
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
                                whiteSpace: "nowrap",
                            }}
                        >
                            NO BOLSO
                        </Typography>
                    </Box>
                </Box>

                {/* Itens principais */}
                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    <Typography sx={categoryLabelStyle}>Principal</Typography>
                    <Box>
                        {principalItems.map((item) => {
                            const isSelected = selected === item.label && !item.disabled;
                            return (
                                <Button
                                    key={item.label}
                                    onClick={() =>
                                        handleMenuClick(item.label, false, item.disabled)
                                    }
                                    variant="text"
                                    sx={buttonStyles(isSelected, item.label, false, item.disabled)}
                                    startIcon={
                                        item.iconComponent ? (
                                            <item.iconComponent sx={iconStyles} />
                                        ) : (
                                            <Box
                                                component="img"
                                                src={item.icon}
                                                alt={item.label}
                                                sx={iconStyles}
                                            />
                                        )
                                    }
                                    disableRipple={item.disabled}
                                >
                                    {item.label}
                                    {item.disabled && <LockIcon sx={lockIconStyles} />}
                                </Button>
                            );
                        })}
                    </Box>

                    <Typography sx={categoryLabelStyle}>Suporte</Typography>
                    <Box>
                        {suporteItems.map((item) => {
                            const isSelected = selected === item.label;
                            return (
                                <Button
                                    key={item.label}
                                    onClick={() => handleMenuClick(item.label)}
                                    variant="text"
                                    sx={buttonStyles(isSelected, item.label)}
                                    startIcon={
                                        <Box
                                            component="img"
                                            src={item.icon}
                                            alt={item.label}
                                            sx={iconStyles}
                                        />
                                    }
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>

                {/* Meu Perfil */}
                <Box sx={{ mt: "auto", mb: 3, position: "relative", width: "100%" }}>
                    <Typography
                        sx={{
                            color: "#8A94A6",
                            fontFamily: "Gellix, sans-serif",
                            fontSize: "12px",
                            fontWeight: 500,
                            mb: 1,
                            ml: 1.5,
                        }}
                    >
                        Meu Perfil
                    </Typography>
                    <Box
                        onClick={handleProfileClick}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 2,
                            px: 2,
                            borderRadius: "12px",
                            border: "1px solid rgba(66, 133, 244, 0.2)",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 2px 8px rgba(17, 30, 90, 0.05)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                backgroundColor: "rgba(66, 133, 244, 0.04)",
                                borderColor: "rgba(66, 133, 244, 0.5)",
                                boxShadow: "0 4px 12px rgba(17, 30, 90, 0.08)",
                                transform: "translateY(-2px)",
                            },
                            "&:active": {
                                transform: "translateY(0)",
                            },
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                            {user?.photoURL ? (
                                <Avatar
                                    src={user.photoURL}
                                    alt={userName}
                                    sx={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        border: "2px solid #4285F4",
                                        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.8)",
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <Box
                                    component="img"
                                    src="/doctorimage.png"
                                    alt="Doctor"
                                    sx={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        border: "2px solid #4285F4",
                                        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.8)",
                                        flexShrink: 0,
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                            <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        color: "#111E5A",
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        lineHeight: 1.3,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Dr. {user?.fullName?.split(" ")[0] || userName}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "#4285F4",
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        lineHeight: 1.3,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {user?.especialidade || userRole}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: 0,
                                p: 0.5,
                                borderRadius: "8px",
                                borderColor: "rgba(66, 133, 244, 0.3)",
                                color: "#4285F4",
                                "&:hover": {
                                    backgroundColor: "rgba(66, 133, 244, 0.08)",
                                    borderColor: "#4285F4",
                                },
                            }}
                        >
                            <Box
                                component="img"
                                src="/chevron-down.svg"
                                alt="Configurações de perfil"
                                sx={{ width: "16px", height: "16px" }}
                            />
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;
