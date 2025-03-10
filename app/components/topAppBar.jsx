"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";

// Componente unificado para botões da TopAppBar
const ActionButton = ({ label, icon, isPrimary = false }) => {
    return (
        <Button
            variant="contained"
            aria-label={label}
            sx={{
                minWidth: "160px",
                height: "46px",
                textTransform: "none",
                borderRadius: "999px",
                px: 2,
                backgroundColor: isPrimary ? "#2971FF" : "#4C515C",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.08)",
                "&:hover": {
                    backgroundColor: isPrimary ? "#1a5fd7" : "#3a3e47",
                }
            }}
        >
            <Box
                component="img"
                src={icon}
                alt={`Ícone de ${label}`}
                sx={{
                    width: "20px",
                    height: "20px",
                    mr: 1,
                }}
            />
            <Typography
                sx={{
                    fontFamily: "Gellix, sans-serif",
                    fontSize: "15px",
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
                minWidth: "36px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            }}
        >
            <Box
                component="img"
                src="/leftarrow.svg"
                alt="Voltar"
                sx={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#1852FE",
                }}
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
                        <ActionButton label="Receita" icon="/newreceita.svg" isPrimary={true} />
                        <ActionButton label="Paciente" icon="/newpaciente.svg" />
                        <ActionButton label="Agendamento" icon="/newagendamento.svg" />
                    </>
                );
            case "import":
                return (
                    <ActionButton label="Importar Ficha" icon="/import.svg" />
                );
            default:
                return (
                    <>
                        <ActionButton label="Receita" icon="/newreceita.svg" isPrimary={true} />
                        <ActionButton label="Paciente" icon="/newpaciente.svg" />
                        <ActionButton label="Agendamento" icon="/newagendamento.svg" />
                    </>
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
                padding: "0 24px",
                boxSizing: "border-box",
                backgroundColor: "#FFF",
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
                        fontSize: "24px",
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
                    gap: "12px",
                }}
            >
                {renderButtons()}
            </Box>
        </Box>
    );
};

export default TopAppBar;