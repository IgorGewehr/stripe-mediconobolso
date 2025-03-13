"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";

// Componente para os botões da TopAppBar
const ActionButton = ({ label, icon, isPrimary = false }) => {
    return (
        <Button
            variant="contained"
            aria-label={label}
            sx={{
                height: "40px",
                textTransform: "none",
                borderRadius: "999px",
                px: 3,
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ml: -1.0,
                    mr: 1,
                    width: "28px", // Ajuste conforme necessário
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF", // Fundo branco circular
                    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)", // Pequena sombra para destaque
                }}
            >
                <img
                    src={`/${icon}.svg`}
                    alt={`${label} icon`}
                    width="20"
                    height="20"
                />
            </Box>

            <Typography
                sx={{
                    fontFamily: "Gellix, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                }}
            >
                {label}
            </Typography>
        </Button>
    );
};

// Botão de voltar
const BackButton = () => {
    return (
        <Button
            sx={{
                minWidth: "30px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                backgroundColor: "#1852FE", // Fundo azul
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
                width="14" // Ajuste conforme necessário
                height="14" // Deixa o ícone branco
            />
        </Button>
    );
};

const TopAppBar = ({
                       title = "Perfil do Paciente",
                       showBackButton = true,
                       variant = "standard" // standard, patient-profile, import
                   }) => {
    // Determina os botões a serem mostrados com base na variante
    const renderButtons = () => {
        switch (variant) {
            case "patient-profile":
                return (
                    <>
                        <ActionButton label="Receita" icon="newreceita" isPrimary={true} />
                        <ActionButton label="Paciente" icon="newpaciente" />
                        <ActionButton label="Agendamento" icon="newagendamento" />
                    </>
                );
            case "import":
                return (
                    <ActionButton label="Importar Ficha" icon="import" />
                );
            default:
                return (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <ActionButton label="Receita" icon="newreceita" isPrimary={true} />
                        <ActionButton label="Paciente" icon="newpaciente" isPrimary={false} />
                        <ActionButton label="Agendamento" icon="newagendamento" isPrimary={false} />
                    </Box>
                );
        }
    };

    return (
        <Box
            sx={{
                height: "80px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                boxSizing: "border-box",
                backgroundColor: "#FFF",
                borderBottom: "1px solid #F0F0F0",
            }}
        >
            {/* Título com botão de voltar opcional */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {showBackButton && <BackButton />}
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix, sans-serif",
                        fontSize: "30px",
                        fontWeight: 500,
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </Typography>
            </Box>

            {/* Grupo de botões à direita */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {renderButtons()}
            </Box>
        </Box>
    );
};

export default TopAppBar;