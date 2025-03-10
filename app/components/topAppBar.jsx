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
                    mr: 1,
                    "& svg": {
                        width: "20px",
                        height: "20px",
                    }
                }}
            >
                {icon === "receita" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="20" height="20" rx="4" fill="white"/>
                    </svg>
                )}
                {icon === "paciente" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="white"/>
                        <path d="M10 12C5.58172 12 2 15.5817 2 20H18C18 15.5817 14.4183 12 10 12Z" fill="white"/>
                    </svg>
                )}
                {icon === "agendamento" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="20" height="20" rx="2" fill="white"/>
                    </svg>
                )}
            </Box>
            <Typography
                sx={{
                    fontFamily: "Gellix, sans-serif",
                    fontSize: "14px",
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
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                padding: 0,
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                    backgroundColor: "#F5F5F5",
                }
            }}
        >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.70711 1.29289C7.09763 1.68342 7.09763 2.31658 6.70711 2.70711L3.41421 6L6.70711 9.29289C7.09763 9.68342 7.09763 10.3166 6.70711 10.7071C6.31658 11.0976 5.68342 11.0976 5.29289 10.7071L1.29289 6.70711C0.902369 6.31658 0.902369 5.68342 1.29289 5.29289L5.29289 1.29289C5.68342 0.902369 6.31658 0.902369 6.70711 1.29289Z" fill="#1852FE"/>
            </svg>
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
                        <ActionButton label="Receita" icon="receita" isPrimary={true} />
                        <ActionButton label="Paciente" icon="paciente" />
                        <ActionButton label="Agendamento" icon="agendamento" />
                    </>
                );
            case "import":
                return (
                    <ActionButton label="Importar Ficha" icon="import" />
                );
            default:
                return (
                    <>
                        <ActionButton label="Receita" icon="receita" isPrimary={true} />
                        <ActionButton label="Paciente" icon="paciente" />
                        <ActionButton label="Agendamento" icon="agendamento" />
                    </>
                );
        }
    };

    return (
        <Box
            sx={{
                height: "64px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
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
                        fontSize: "20px",
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