"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import TopAppBar from "../components/TopAppBar";
import Sidebar from "../components/Sidebar";
import DashboardTemplate from "../components/DashboardTemplate";
import PacienteCadastroTemplate from "../components/pacienteCadastroTemplate";
import PacienteTemplate from "../components/pacienteTemplate";
import AgendaMedica from "../components/organismsComponents/agendaComponente";
import PrescriptionsPage from "../components/ReceitasTemplate";
import PatientsTable from "../components/organismsComponents/patientTable";

export default function AppLayout({ children }) {
    // Define o estado inicial para "Dashboard"
    const [activePage, setActivePage] = useState("Dashboard");

    // Estilo de escala para o conteúdo
    const contentScaleStyle = {
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%', // Compensar a redução (100% / 0.9 ≈ 111.11%)
        height: '111.11%',
    };

    const renderContent = () => {
        // Converte para lowercase para facilitar a comparação
        switch (activePage.toLowerCase()) {
            case "dashboard":
                return <PacienteTemplate />;
            case "pacientes":
                return <PacienteCadastroTemplate />;
            case "receitas":
                return <PatientsTable />;
            case "agenda":
                return <AgendaMedica />;
            default:
                return <DashboardTemplate />;
        }
    };

    // Callback chamado pela Sidebar ao clicar em um item
    const handleMenuSelect = (page) => {
        setActivePage(page);
    };

    // Callback para o botão "Paciente" da TopAppBar
    const handlePacienteTopAppBarClick = () => {
        setActivePage("Pacientes");
    };

    return (
        <Box display="flex" height="100vh" overflow="hidden">
            <Sidebar initialSelected={activePage} onMenuSelect={handleMenuSelect} />
            <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
                <Box sx={{ flexShrink: 0 }}>
                    <TopAppBar label={activePage} onPacienteClick={handlePacienteTopAppBarClick} />
                </Box>
                <Box flex={1} sx={{ position: 'relative', overflow: 'auto' }}>
                    {/* Aplica o contentScaleStyle para ajustar a escala do conteúdo */}
                    <Box sx={{ height: 'auto', padding: '10px', boxSizing: 'border-box', ...contentScaleStyle }}>
                        {renderContent()}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
