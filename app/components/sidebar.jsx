"use client";

import React, { useState, useMemo } from "react";
import { Box, Button, Typography, Avatar, Tooltip } from "@mui/material";
import { useResponsiveScale } from "./useScale";
import { useAuth } from "./authProvider";
import useModuleAccess from "./useModuleAccess";
import ModuleProtection from "./ModuleProtection";
import LockIcon from "@mui/icons-material/Lock";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
// ✨ IMPORTAR ÍCONE PARA O DOCTOR AI
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { MODULES } from "../../lib/moduleConfig";

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
    const { hasAccess, isAdmin, getUnavailableModules, isLegacyUser } = useModuleAccess();
    const { scaleStyle } = useResponsiveScale();

    // Definir itens do menu com lógica híbrida
    const menuItems = useMemo(() => ({
        principal: [
            {
                label: "Dashboard",
                icon: "/dashboardico.svg",
                moduleId: MODULES.DASHBOARD
            },
            {
                label: "Pacientes",
                icon: "/pacientes.svg",
                moduleId: MODULES.PATIENTS
            },
            {
                label: "Receitas",
                icon: "/receitas.svg",
                moduleId: MODULES.PRESCRIPTIONS
            },
            {
                label: "Agenda",
                icon: "/agenda.svg",
                moduleId: MODULES.APPOINTMENTS
            },
            {
                label: "Métricas",
                icon: "/metricas.svg",
                disabled: true,
                moduleId: null
            },
            {
                label: "Financeiro",
                icon: "/financeiro.svg",
                disabled: true,
                moduleId: null
            }
        ],
        admin: [
            ...(user && user.administrador === true ? [{
                label: "Dados",
                iconComponent: AdminPanelSettingsIcon,
                moduleId: null
            }] : [])
        ],
        ia: [
            {
                label: "Doctor AI",
                iconComponent: PsychologyIcon,
                moduleId: null,
                special: true
            }
        ],
        suporte: [
            {
                label: "Central de Ajuda",
                icon: "/centralajuda.svg",
                moduleId: null
            },
            {
                label: "Reportar",
                icon: "/reportar.svg",
                moduleId: null
            }
        ]
    }), [user]);

    // Filtrar itens baseado no acesso (híbrido)
    const visibleItems = useMemo(() => {
        const filterItems = (items) => items.map(item => {
            if (item.hasOwnProperty('disabled')) {
                return {
                    ...item,
                    hasAccess: !item.disabled,
                    disabled: item.disabled
                };
            }

            if (!item.moduleId) {
                return {
                    ...item,
                    hasAccess: true,
                    disabled: false
                };
            }

            return {
                ...item,
                hasAccess: hasAccess(item.moduleId),
                disabled: !hasAccess(item.moduleId)
            };
        });

        return {
            principal: filterItems(menuItems.principal),
            admin: filterItems(menuItems.admin),
            ia: filterItems(menuItems.ia),
            suporte: filterItems(menuItems.suporte)
        };
    }, [menuItems, hasAccess]);

    const unavailableModules = isLegacyUser ? [] : getUnavailableModules();

    const handleMenuClick = (label, isLogout = false, disabled = false, moduleId = null) => {
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
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "none",
        width: "180px",
        height: "44px",
        px: 2.5,
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