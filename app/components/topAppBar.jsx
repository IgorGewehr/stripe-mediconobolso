"use client";
import React from "react";
import { Box, Typography, Button, IconButton, useTheme, useMediaQuery } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import NotificationComponent from "./features/shared/NotificationComponent";
import { useAuth } from "./authProvider";

// Atualiza o ActionButton para aceitar onClick
const ActionButton = ({ label, icon, isPrimary = false, onClick, isMobile = false }) => {
    return (
        <Button
            onClick={onClick}
            variant="contained"
            aria-label={label}
            sx={{
                height: isMobile ? "36px" : "40px",
                textTransform: "none",
                borderRadius: "999px",
                px: isMobile ? 2 : 3,
                minWidth: isMobile && label === "+" ? "36px" : "auto",
                backgroundColor: isPrimary ? "#1852FE" : "#4C515C",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                "&:hover": {
                    backgroundColor: isPrimary ? "#1a5fd7" : "#3a3e47",
                    boxShadow: "none",
                }
            }}
        >
            <Box
                component="span"
                sx={{
                    display: label === "+" && isMobile ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ml: -1.0,
                    mr: 1,
                    width: isMobile ? "24px" : "28px",
                    height: isMobile ? "24px" : "28px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF",
                    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                }}
            >
                <img
                    src={`/${icon}.svg`}
                    alt={`${label} icon`}
                    width={isMobile ? "16" : "20"}
                    height={isMobile ? "16" : "20"}
                />
            </Box>

            <Typography
                sx={{
                    fontFamily: "Gellix, sans-serif",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: 500,
                    display: isMobile && label !== "+" ? "none" : "block",
                }}
            >
                {label}
            </Typography>
        </Button>
    );
};

// Modificado para sempre receber onClick
const BackButton = ({ onClick }) => {
    return (
        <Button
            onClick={onClick}
            sx={{
                minWidth: "30px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                backgroundColor: "#1852FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                padding: 0,
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                    backgroundColor: "#154AC3",
                }
            }}
        >
            <img
                src="/leftarrow.svg"
                alt="Voltar"
                width="14"
                height="14"
            />
        </Button>
    );
};

const TopAppBar = ({
                       title = "Perfil do Paciente",
                       variant = "standard",
                       onPacienteClick,
                       onBackClick,
                       onAgendamentoClick,
                       onReceitaClick,
                       onNotificationClick,
                       onMenuToggle,
                       isMobile = false
                   }) => {
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const { isSecretary, hasModulePermission } = useAuth();
    const handlePacienteClick = () => {
        if (onPacienteClick) {
            onPacienteClick();
        }
    };

    const handleAgendamentoClick = () => {
        if (onAgendamentoClick) {
            onAgendamentoClick();
        }
    };

    const handleReceitaClick = () => {
        if (onReceitaClick) {
            onReceitaClick();
        }
    };

    const handleNotificationClick = (data) => {
        if (onNotificationClick) {
            onNotificationClick(data);
        }
    };

    const renderButtons = () => {
        switch (variant) {
            case "patient-profile":
                return (
                    <>
                        <ActionButton label="Receita" icon="newreceita" isPrimary={true} onClick={handleReceitaClick} isMobile={isMobile} />
                        {(!isSecretary || hasModulePermission('patients', 'create')) && (
                            <ActionButton label="Paciente" icon="newpaciente" onClick={handlePacienteClick} isMobile={isMobile} />
                        )}
                        <ActionButton label="Agendamento" icon="newagendamento" onClick={handleAgendamentoClick} isMobile={isMobile} />
                    </>
                );
            case "import":
                return (
                    <ActionButton label="Importar Ficha" icon="import" isMobile={isMobile} />
                );
            default:
                return (
                    <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                        <ActionButton label="Receita" icon="newreceita" isPrimary={true} onClick={handleReceitaClick} isMobile={isMobile} />
                        {(!isSecretary || hasModulePermission('patients', 'create')) && (
                            <ActionButton label="Paciente" icon="newpaciente" onClick={handlePacienteClick} isMobile={isMobile} />
                        )}
                        <ActionButton label="Agendamento" icon="newagendamento" onClick={handleAgendamentoClick} isMobile={isMobile} />
                    </Box>
                );
        }
    };

    return (
        <Box
            sx={{
                height: isMobile ? "60px" : "80px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isMobile ? "0 16px" : isTablet ? "0 24px" : "0 40px",
                boxSizing: "border-box",
                backgroundColor: "#FFF",
                borderBottom: "1px solid #F0F0F0",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* Menu button for mobile */}
                {isMobile && onMenuToggle && (
                    <IconButton
                        onClick={onMenuToggle}
                        sx={{
                            mr: 1,
                            p: 1,
                            color: '#111E5A'
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}
                
                {/* BackButton - hidden on mobile if there's a menu button */}
                {!isMobile && (
                    <BackButton onClick={onBackClick} />
                )}
                
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix, sans-serif",
                        fontSize: isMobile ? "18px" : isTablet ? "24px" : "30px",
                        fontWeight: 500,
                        lineHeight: 1.2,
                        ml: isMobile ? 0 : 2,
                    }}
                >
                    {title}
                </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
                {/* Componente de notificação */}
                <NotificationComponent onMessageClick={handleNotificationClick} />

                {/* Botões de ação - ocultos no mobile ou simplificados */}
                {!isMobile && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {renderButtons()}
                    </Box>
                )}
                
                {/* Versão mobile - apenas o botão mais importante */}
                {isMobile && (
                    <ActionButton label="+" icon="newpaciente" isPrimary={true} onClick={handlePacienteClick} isMobile={isMobile} />
                )}
            </Box>
        </Box>
    );
};

export default TopAppBar;