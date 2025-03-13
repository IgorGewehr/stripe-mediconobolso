"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import TopAppBar from "../components/TopAppBar";
import Sidebar from "../components/Sidebar";
import PacienteTemplate from "../components/pacienteTemplate";
import PacienteCadastroTemplate from "../components/pacienteCadastroTemplae";

export default function AppLayout({ children }) {
    const [activePage, setActivePage] = useState("dashboard");

    const renderContent = () => {
        switch (activePage) {
            case "dashboard":
                return <PacienteCadastroTemplate  />;
            case "pacientes":
                return <PacienteTemplate />;
            // Outros cases para novas páginas
            default:
                return <PacienteTemplate />;
        }
    };

    // Função de callback que a Sidebar chamará ao clicar em uma opção
    const handleMenuSelect = (page) => {
        setActivePage(page);
    };

    // Estilo para aplicar escala somente no conteúdo
    const contentScaleStyle = {
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%', // Compensar a redução (100% / 0.9 = ~111.11%)
        height: '111.11%',
    };

    const contentContainerStyle = {
        position: 'relative',
        // Adiciona overflow auto apenas quando o componente é o cadastro de paciente
        ...(activePage === "dashboard" && {
            overflowY: 'visible',
            maxHeight: 'calc(100vh - 64px)' // Ajuste conforme a altura do seu TopAppBar
        })
    };

    return (
        <Box
            display="flex"
            height="100vh"
            overflow="hidden" // Importante para prevenir scroll duplo
        >
            <Sidebar initialSelected={activePage} onMenuSelect={handleMenuSelect} />
            <Box
                flex={1}
                display="flex"
                flexDirection="column"
                overflow="hidden" // Controla o overflow aqui
            >
                <Box
                    sx={{
                        flexShrink: 0 // Impede que a TopAppBar seja comprimida
                    }}
                >
                    <TopAppBar label={activePage} />
                </Box>
                <Box
                    flex={1}
                    sx={contentContainerStyle}
                >
                    <Box sx={contentScaleStyle}>
                        {renderContent()}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}