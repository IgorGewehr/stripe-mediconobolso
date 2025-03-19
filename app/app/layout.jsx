"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import TopAppBar from "../components/topAppBar";
import Sidebar from "../components/sidebar";
import DashboardTemplate from "../components/dashboardTemplate";
import PacienteCadastroTemplate from "../components/pacienteCadastroTemplate";
import PacienteTemplate from "../components/pacienteTemplate";
import AgendaMedica from "../components/organismsComponents/agendaComponente";
import { useAuth } from "../components/authProvider";
import { useRouter } from "next/navigation";
import Dashboard from "../components/dashboardTemplate";



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

    // Novo estado para armazenar o paciente selecionado
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    // Estilo de escala para o conteúdo
    const contentScaleStyle = {
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%', // Compensar a redução (100% / 0.9 ≈ 111.11%)
        height: '111.11%',
    };

    // Handler para quando um paciente é clicado na tabela
    const handlePatientClick = (patientId) => {
        setSelectedPatientId(patientId);
        setActivePage("PatientProfile"); // Definir uma nova página ativa para o perfil do paciente
    };

    // Handler para voltar da visualização do paciente para a tabela de pacientes
    const handleBackToPatients = () => {
        setSelectedPatientId(null);
        setActivePage("Dashboard");
    };

    // Expor o handler globalmente para que os componentes possam acessá-lo
    // Útil quando componentes aninhados precisam navegar
    useEffect(() => {
        // Expor handlers para uso global em componentes aninhados
        window.handlePatientClick = handlePatientClick;
        window.handleMenuSelect = handleMenuSelect;

        // Limpeza ao desmontar o componente
        return () => {
            delete window.handlePatientClick;
            delete window.handleMenuSelect;
        };
    }, []);

    const renderContent = () => {
        // Converte para lowercase para facilitar a comparação
        switch (activePage.toLowerCase()) {
            case "dashboard":
                return <Dashboard onClickPatients={handlePatientClick}/>;
            case "pacientes":
                return <PacienteCadastroTemplate />;
            case "receitas":
                // Recebendo o handler de clique no paciente diretamente
                return <Dashboard onClickPatients={handlePatientClick} />;
            case "agenda":
                return <AgendaMedica />;
            case "patientprofile":
                return <PacienteTemplate pacienteId={selectedPatientId} onBack={handleBackToPatients} />;
            default:
                return <DashboardTemplate onClickPatients={handlePatientClick} />;
        }
    };

    // Callback chamado pela Sidebar ao clicar em um item
    const handleMenuSelect = (page) => {
        setActivePage(page);
        // Se estamos navegando para uma página diferente, resetamos o paciente selecionado
        if (page.toLowerCase() !== "patientprofile") {
            setSelectedPatientId(null);
        }
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
                    <TopAppBar
                        title={
                            activePage === "PatientProfile"
                                ? "Perfil do Paciente"
                                : activePage === "Dashboard"
                                    ? (
                                        <>
                                            Bem vindo,{" "}
                                            <span style={{color: "#1852FE"}}>
                    Dr. {user?.fullName}
                  </span>
                                        </>
                                    )
                                    : activePage
                        }
                        onPacienteClick={handlePacienteTopAppBarClick}
                        showBackButton={activePage === "PatientProfile"}
                        onBackClick={handleBackToPatients}
                    />
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
