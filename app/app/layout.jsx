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
import PatientsListPage from "../components/patientsListTemplate";
import PrescriptionsPage from "../components/receitasTemplate";
import {useResponsiveScale} from "../components/useScale";
import CentralAjudaTemplate from "../components/centralAjudaTemplate";
import UserProfileTemplate from "../components/userProfileTemplate";
import HelpCenter from "../components/helpCenter";
import UserDataTemplate from "../components/userDataTemplate";
import {HelpCenter as HelpCenterIcon } from "@mui/icons-material";
import Script from "next/script";

// ✨ IMPORTAR O NOVO COMPONENTE DOCTOR AI
import DoctorAITemplate from "../components/doctorAITemplate";

export default function AppLayout({ children }) {
    // Obter dados de autenticação
    const auth = useAuth();
    const user = auth?.user;
    const loading = auth?.loading || false;
    const logout = auth?.logout;
    const router = useRouter();

    // Verificar se o usuário é administrador
    const isAdmin = user && user.administrador === true;

    const handleMenuSelect = (page, consultationId = null) => {
        setActivePage(page);
        if (page.toLowerCase() === "agenda" && consultationId) {
            setAgendaConsultationId(consultationId);
        } else if (page.toLowerCase() !== "patientprofile") {
            setSelectedPatientId(null);
            setAgendaConsultationId(null);
        }
    };

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
    const [agendaConsultationId, setAgendaConsultationId] = useState(null);

    // Estilo de escala para o conteúdo
    const contentScaleStyle = {
        transform: 'scale(0.95)',
        transformOrigin: 'top left',
        width: '105.26%', // Corrigido o valor (100% / 0.95 ≈ 105.26%)
        height: '105.26%',
    };

    const { scaleStyle } = useResponsiveScale();

    // Handler para quando um paciente é clicado na tabela
    const handlePatientClick = (patientId) => {
        setSelectedPatientId(patientId);
        setActivePage("PatientProfile");
    };

    const handleReportClick = () => {
        setActivePage("Reportar");
    }

    const handleCentralClick = () => {
        setActivePage("Central de AJuda");
    }

    // Handler para voltar da visualização do paciente para a tabela de pacientes
    const handleBackToPatients = () => {
        setSelectedPatientId(null);
        setActivePage("dashboard");
    };

    // Handler global para o botão Back - sempre leva ao Dashboard
    const handleBackToDashboard = () => {
        setSelectedPatientId(null);
        setActivePage("Dashboard");
    };

    // Handler para o botão de agendamento
    const handleAgendamentoClick = () => {
        setActivePage("Agenda");
    };

    const handleReceitaClick = () => {
        setActivePage("Receitas");
    };

    // Expor o handler globalmente para que os componentes possam acessá-lo
    useEffect(() => {
        // Expor handlers para uso global em componentes aninhados
        window.handlePatientClick = handlePatientClick;
        window.handleMenuSelect = handleMenuSelect;
        window.handleBackToDashboard = handleBackToDashboard;
        window.handleReceitaClick = handleReceitaClick;

        // Limpeza ao desmontar o componente
        return () => {
            delete window.handlePatientClick;
            delete window.handleMenuSelect;
            delete window.handleBackToDashboard;
            delete window.handleReceitaClick;
        };
    }, []);

    useEffect(() => {
        window.handleMenuSelect = handleMenuSelect;
        return () => {
            delete window.handleMenuSelect;
        };
    }, [handleMenuSelect]);

    const renderContent = () => {
        // Converte para lowercase para facilitar a comparação
        switch (activePage.toLowerCase()) {
            case "dashboard":
                return <Dashboard onClickPatients={handlePatientClick}/>;
            case "pacientes":
                return <PatientsListPage onPatientClick={handlePatientClick} />;
            case "receitas":
                return <PrescriptionsPage />;
            case "agenda":
                return <AgendaMedica initialConsultationId={agendaConsultationId} />;
            case "patientprofile":
                return <PacienteTemplate pacienteId={selectedPatientId} onBack={handleBackToDashboard} />;
            case "criar novo paciente":
                return <PacienteCadastroTemplate/>;
            // ✨ NOVA ROTA PARA DOCTOR AI
            case "doctor ai":
                return <DoctorAITemplate />;
            case "central de ajuda":
                return <HelpCenter initialTab={0}/>;
            case "reportar":
                return <HelpCenter initialTab={1}/>;
            case "meu perfil":
                return <UserProfileTemplate onLogout={logout}/>;
            case "dados":
                return isAdmin ? <UserDataTemplate /> : <Dashboard onClickPatients={handlePatientClick}/>;
            default:
                return <DashboardTemplate onClickPatients={handlePatientClick} />;
        }
    };

    const handleProfileClick = () => {
        setActivePage("Meu Perfil");
    };

    // Callback para o botão "Paciente" da TopAppBar
    const handlePacienteTopAppBarClick = () => {
        setActivePage("Criar novo paciente");
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

    // Configurar título dinâmico com base na página ativa
    const getPageTitle = () => {
        switch (activePage.toLowerCase()) {
            case "patientprofile":
                return "Perfil do Paciente";
            case "meu perfil":
                return "Meu Perfil";
            case "dados":
                return "Administração de Dados";
            // ✨ NOVO TÍTULO PARA DOCTOR AI
            case "doctor ai":
                return (
                    <>
                        <span style={{color: "#667eea"}}>
                            Doctor AI
                        </span>
                        {" - Seu assistente médico inteligente"}
                    </>
                );
            case "dashboard":
                return (
                    <>
                        Bem vindo,{" "}
                        <span style={{color: "#1852FE"}}>
                        Dr. {user?.fullName}
                    </span>
                    </>
                );
            case "agenda":
                return (
                    <>
                    <span style={{color: "#1852FE"}}>
                        Dr. {user?.fullName}
                    </span>
                        {", confira sua agenda"}
                    </>
                );
            case "pacientes":
                return (
                    <>
                        <span style={{color: "#1852FE"}}>
                            Dr. {user?.fullName}
                        </span>
                        {", gerencie seus pacientes"}
                    </>
                );
            default:
                return activePage;
        }
    };

    return (
        <>
            <Box display="flex" height="100vh" overflow="hidden" sx={{backgroundColor: "#F4F9FF", }}>
                <Sidebar
                    initialSelected={activePage}
                    onMenuSelect={handleMenuSelect}
                    onLogout={logout}
                    onProfileClick={handleProfileClick}
                    userName={user?.fullName?.split(' ')[0] || "Médico"}
                    userRole={user?.especialidade || ""}
                />
                <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
                    <Box sx={{ flexShrink: 0 }}>
                        <TopAppBar
                            title={getPageTitle()}
                            onPacienteClick={handlePacienteTopAppBarClick}
                            onAgendamentoClick={handleAgendamentoClick}
                            onBackClick={handleBackToDashboard}
                            onReceitaClick={handleReceitaClick}
                            onProfileClick={handleProfileClick}
                        />
                    </Box>
                    <Box flex={1} sx={{ position: 'relative', overflow: 'auto' }}>
                        <Box sx={{ height: 'auto', padding: '10px', boxSizing: 'border-box', ...scaleStyle }}>
                            {renderContent()}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
}