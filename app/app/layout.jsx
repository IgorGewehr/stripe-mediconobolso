// /app/layout.jsx
"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import TopAppBar from "../components/TopAppBar";
import Sidebar from "../components/Sidebar";
import PacienteTemplate from "../components/PacienteTemplate";

export default function AppLayout({ children }) {
    const [activePage, setActivePage] = useState("dashboard");

    const renderContent = () => {
        switch (activePage) {
            case "dashboard":
                return <PacienteTemplate />;
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

    return (
        <Box display="flex" height="100vh">
            <Sidebar initialSelected={activePage} onMenuSelect={handleMenuSelect} />
            <Box flex={1} display="flex" flexDirection="column">
                <TopAppBar label={activePage} />
                <Box flex={1} p={3}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
}
