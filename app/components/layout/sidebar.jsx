"use client";

import React, { useState, useMemo } from "react";
import { Box, Button, Typography, Avatar, Tooltip } from "@mui/material";
import { useResponsiveScale } from "../hooks/useScale";
import { useAuth } from "../providers/authProvider";
import LockIcon from "@mui/icons-material/Lock";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
// IMPORTAR ÍCONE PARA O DOCTOR AI
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SecretaryIndicator from "../features/shared/SecretaryIndicator";

const Sidebar = ({
                     initialSelected = "Dashboard",
                     userName = "Dolittle",
                     userRole = "Cirurgião",
                     onMenuSelect,
                     onLogout,
                     onProfileClick,
                     isMobile = false,
                 }) => {
    const [selected, setSelected] = useState(initialSelected);
    const { user } = useAuth();
    // Simplificar verificação de acesso - todos têm acesso básico
    const hasAccess = () => true;
    const isAdmin = user?.administrador === true;
    const { scaleStyle } = useResponsiveScale();
    const { isSecretary, userContext } = useAuth();

    // Definir itens do menu simplificado
    const menuItems = useMemo(() => ({
        principal: [
            {
                label: "Dashboard",
                icon: "/dashboardico.svg"
            },
            {
                label: "Pacientes",
                icon: "/pacientes.svg"
            },
            {
                label: "Receitas",
                icon: "/receitas.svg"
            },
            {
                label: "Agenda",
                icon: "/agenda.svg"
            },
            {
                label: "Métricas",
                icon: "/metricas.svg",
                disabled: true
            },
            {
                label: "Financeiro",
                icon: "/financeiro.svg",
                disabled: true
            }
        ],
        admin: [
            ...(user && user.administrador === true ? [{
                label: "Dados",
                iconComponent: AdminPanelSettingsIcon
            }] : [])
        ],
        ia: [
            {
                label: "Doctor AI",
                iconComponent: PsychologyIcon,
                special: true
            }
        ],
        suporte: [
            {
                label: "Central de Ajuda",
                icon: "/centralajuda.svg"
            },
            {
                label: "Reportar",
                icon: "/reportar.svg"
            }
        ]
    }), [user]);

    // Filtrar itens baseado no acesso simplificado
    const visibleItems = useMemo(() => {
        const filterItems = (items) => items.map(item => ({
            ...item,
            hasAccess: !item.disabled,
            disabled: item.disabled || false
        }));

        return {
            principal: filterItems(menuItems.principal),
            admin: filterItems(menuItems.admin),
            ia: filterItems(menuItems.ia),
            suporte: filterItems(menuItems.suporte)
        };
    }, [menuItems]);

    const handleMenuClick = (label, isLogout = false, disabled = false) => {
        if (disabled) {
            if (label === "Métricas" || label === "Financeiro") {
                return;
            }
            return;
        }

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

    const handleUpgrade = (moduleId) => {
        window.location.href = '/checkout';
    };

    const buttonStyles = (isSelected, label, isLogout, disabled) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Gellix, sans-serif",
        fontSize: isMobile ? "14px" : "12px",
        fontWeight: 500,
        textTransform: "none",
        width: isMobile ? "100%" : label === "Central de Ajuda" ? "180px" : "150px",
        height: isMobile ? "36px" : "28px",
        px: isMobile ? 2.5 : 2,
        py: isMobile ? 1.5 : 1,
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
        backgroundColor: isSelected && !disabled ? "#4285F4" : "transparent",
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

    // ✨ ESTILOS ESPECÍFICOS PARA O BOTÃO DO DOCTOR AI
    const doctorAIButtonStyles = (isSelected) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Gellix, sans-serif",
        fontSize: isMobile ? "14px" : "12px",
        fontWeight: 600,
        textTransform: "none",
        width: isMobile ? "100%" : "180px",
        height: isMobile ? "52px" : "44px",
        px: isMobile ? 3 : 2.5,
        py: 1.5,
        borderRadius: "16px",
        transition: "all 0.2s ease",
        color: isSelected ? "#FFFFFF" : "#2D3748",
        backgroundColor: isSelected
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "#FFFFFF",
        border: `2px solid ${isSelected ? "transparent" : "#E2E8F0"}`,
        boxShadow: isSelected
            ? "0 4px 16px rgba(102, 126, 234, 0.25)"
            : "0 2px 8px rgba(0, 0, 0, 0.06)",
        "&:hover": {
            backgroundColor: isSelected
                ? "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)"
                : "#F7FAFC",
            borderColor: isSelected ? "transparent" : "#667eea",
            boxShadow: isSelected
                ? "0 6px 20px rgba(102, 126, 234, 0.35)"
                : "0 4px 12px rgba(102, 126, 234, 0.15)",
            transform: "translateY(-1px)",
        },
        "&:active": {
            transform: "translateY(0)",
        },
    });

    const iconStyles = { width: isMobile ? "20px" : "18px", height: isMobile ? "20px" : "18px", mr: 1.2 };
    const lockIconStyles = { width: "14px", height: "14px", ml: 0.8, color: "#8A94A6" };
    const categoryLabelStyle = {
        color: "#8A94A6",
        fontFamily: "Gellix, sans-serif",
        fontSize: isMobile ? "14px" : "12px",
        fontWeight: 500,
        mb: 0.8,
        mt: isMobile ? 2 : 2.5,
        ml: 1.5,
    };

    // Renderizar item do menu com lógica híbrida
    const renderMenuItem = (item) => {
        const isSelected = selected === item.label;

        // ✨ TRATAMENTO ESPECIAL PARA O DOCTOR AI
        if (item.special && item.label === "Doctor AI") {
            return (
                <Tooltip
                    key={item.label}
                    title="Assistente Médico com IA"
                    placement="right"
                >
                    <Button
                        onClick={() => handleMenuClick(item.label, false, false)}
                        variant="contained"
                        sx={doctorAIButtonStyles(isSelected)}
                        startIcon={
                            <AutoAwesomeIcon
                                sx={{
                                    width: "20px",
                                    height: "20px",
                                    mr: 1,
                                    color: isSelected ? "#FFFFFF" : "#667eea"
                                }}
                            />
                        }
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <Typography
                                sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    color: "inherit"
                                }}
                            >
                                Doctor AI
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "10px",
                                    fontWeight: 400,
                                    lineHeight: 1.2,
                                    color: isSelected ? "rgba(255,255,255,0.9)" : "#64748B",
                                    mt: 0.2
                                }}
                            >
                                Assistente Médico
                            </Typography>
                        </Box>
                    </Button>
                </Tooltip>
            );
        }

        if (item.hasOwnProperty('disabled') && item.disabled) {
            return (
                <Button
                    key={item.label}
                    onClick={() => handleMenuClick(item.label, false, true)}
                    variant="text"
                    sx={buttonStyles(false, item.label, false, true)}
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
                    disableRipple
                >
                    {item.label}
                    <LockIcon sx={lockIconStyles} />
                </Button>
            );
        }

        if (!item.moduleId) {
            return (
                <Button
                    key={item.label}
                    onClick={() => handleMenuClick(item.label, false, false)}
                    variant="text"
                    sx={buttonStyles(isSelected, item.label, false, false)}
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
                >
                    {item.label}
                </Button>
            );
        }

        if (item.disabled && item.moduleId) {
            return (
                <ModuleProtection
                    key={item.label}
                    moduleId={item.moduleId}
                    showTooltip={true}
                    showDialog={true}
                    onUpgrade={handleUpgrade}
                >
                    <Button
                        variant="text"
                        sx={buttonStyles(false, item.label, false, true)}
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
                        disableRipple
                    >
                        {item.label}
                        <LockIcon sx={lockIconStyles} />
                    </Button>
                </ModuleProtection>
            );
        }

        return (
            <Button
                key={item.label}
                onClick={() => handleMenuClick(item.label, false, item.disabled, item.moduleId)}
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
            </Button>
        );
    };

    return (
        <Box
            sx={{
                backgroundColor: "#F8FAFF",
                height: isMobile ? "100%" : "100vh",
                width: isMobile ? "100%" : "240px",
                position: "relative",
                pl: isMobile ? "20px" : "30px",
                pr: isMobile ? "20px" : "16px",
                pt: isMobile ? "20px" : "30px",
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
                    sx={{ display: "flex", alignItems: "center", mb: 4, flexShrink: 0, cursor: "pointer" }}
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

                {isSecretary && (
                    <Box sx={{ mb: 2, mx: 1 }}>
                        <SecretaryIndicator
                            isSecretary={isSecretary}
                            secretaryName={userContext?.secretaryData?.name}
                            doctorName={userContext?.userData?.fullName}
                        />
                    </Box>
                )}

                {/* Itens principais */}
                <Box sx={{ flex: 1, overflowY: "auto" }}>
                    <Typography sx={categoryLabelStyle}>Principal</Typography>
                    <Box>
                        {visibleItems.principal.map(renderMenuItem)}
                    </Box>

                    {/* Seção Admin (só aparece se tiver itens) */}
                    {visibleItems.admin.length > 0 && (
                        <>
                            <Typography sx={categoryLabelStyle}>Administração</Typography>
                            <Box>
                                {visibleItems.admin.map(renderMenuItem)}
                            </Box>
                        </>
                    )}

                    {/* ✨ NOVA SEÇÃO: ASSISTENTE IA */}
                    <Typography sx={{...categoryLabelStyle, color: "#667eea", fontWeight: 600}}>
                        Inteligência Artificial
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        {visibleItems.ia.map(renderMenuItem)}
                    </Box>

                    <Typography sx={categoryLabelStyle}>Suporte</Typography>
                    <Box>
                        {visibleItems.suporte.map(renderMenuItem)}
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