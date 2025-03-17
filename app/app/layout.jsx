"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import TopAppBar from "../components/TopAppBar";
import Sidebar from "../components/Sidebar";
import DashboardTemplate from "../components/DashboardTemplate";
import PacienteCadastroTemplate from "../components/pacienteCadastroTemplate";
import PacienteTemplate from "../components/pacienteTemplate";
import AgendaMedica from "../components/organismsComponents/agendaComponente";
import PatientsTable from "../components/organismsComponents/patientTable";
import { useAuth } from "../components/authProvider";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }) {
    // Obter dados de autenticação
    const auth = useAuth();
    const user = auth?.user;
    const loading = auth?.loading || false;
    const logout = auth?.logout;
    const router = useRouter();

    // Verificar autenticação quando o componente carrega
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [loading, user, router]);

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

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // Se não estiver autenticado, não renderizar nada (redirecionamento ocorre pelo useEffect)
    if (!user) {
        return null;
    }

    return (
        <Box display="flex" height="100vh" overflow="hidden">
            <Sidebar
                initialSelected={activePage}
                onMenuSelect={handleMenuSelect}
                onLogout={logout}
                userName={user?.fullName?.split(' ')[0] || "Médico"}
                userRole={user?.especialidade || "Cirurgião"}
            />
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