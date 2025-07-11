"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress, Typography, Button, Alert, useTheme, useMediaQuery, Drawer, IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
import { useResponsiveScale } from "../components/useScale";
import CentralAjudaTemplate from "../components/centralAjudaTemplate";
import UserProfileTemplate from "../components/userProfileTemplate";
import HelpCenter from "../components/helpCenter";
import UserDataTemplate from "../components/userDataTemplate";
import DoctorAITemplate from "../components/doctorAITemplate";
import UnifiedUserManagement from "../components/organismsComponents/unifiedUserManagement";
import BottomNavigation from "../components/organismsComponents/BottomNavigation";
import SwipeableView from "../components/organismsComponents/SwipeableView";
import '../styles/mobile-fixes.css';

// ✅ COMPONENTE PARA PROTEGER ROTAS COM VERIFICAÇÃO DE PERMISSÕES
const ProtectedRoute = ({ children, requiredModule, requiredAction = 'read', fallbackMessage }) => {
    const { isSecretary, hasModulePermission, userContext, getDisplayUserData } = useAuth();

    // Médicos sempre têm acesso total
    if (!isSecretary) {
        return children;
    }

    // Verificar permissão da secretária
    const hasPermission = hasModulePermission(requiredModule, requiredAction);

    if (!hasPermission) {
        const displayData = getDisplayUserData();

        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                textAlign: 'center',
                p: 3,
                backgroundColor: '#f8f9fa',
                borderRadius: 2
            }}>
                <LockIcon sx={{ fontSize: 64, color: '#FF6B6B', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1, color: '#2d3748', fontWeight: 600 }}>
                    Acesso Restrito
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, color: '#4a5568', maxWidth: 400 }}>
                    {fallbackMessage || `Você não tem permissão para acessar ${requiredModule}.`}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: '#718096', maxWidth: 400 }}>
                    Entre em contato com <strong>Dr. {userContext?.userData?.fullName}</strong> para solicitar acesso a este módulo.
                </Typography>

                <Alert severity="info" sx={{ mb: 3, maxWidth: 400 }}>
                    <Typography variant="caption">
                        <strong>Secretária:</strong> {displayData?.secretaryName}<br />
                        <strong>Permissão necessária:</strong> {requiredModule} - {requiredAction}
                    </Typography>
                </Alert>

                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => window.handleBackToDashboard?.()}
                    sx={{
                        borderColor: '#4285F4',
                        color: '#4285F4',
                        '&:hover': {
                            backgroundColor: 'rgba(66, 133, 244, 0.08)',
                            borderColor: '#4285F4'
                        }
                    }}
                >
                    Voltar ao Dashboard
                </Button>
            </Box>
        );
    }

    return children;
};

// ✅ COMPONENTE PRINCIPAL DO APPLAYOUT
export default function AppLayout({ children }) {
    // Estados principais
    const auth = useAuth();
    const user = auth?.user;
    const loading = auth?.loading || false;
    const logout = auth?.logout;
    const isSecretary = auth?.isSecretary || false;
    const userContext = auth?.userContext;
    const hasModulePermission = auth?.hasModulePermission;
    const router = useRouter();
    
    // Responsive design
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    // Estados de navegação
    const [activePage, setActivePage] = useState("Dashboard");
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [agendaConsultationId, setAgendaConsultationId] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);
    
    // Mapping between pages and swipe indexes for mobile
    const mobilePages = ['dashboard', 'pacientes', 'receitas', 'agenda'];
    const pageToIndex = {
        'dashboard': 0,
        'pacientes': 1,
        'receitas': 2,
        'agenda': 3
    };

    // Verificar se o usuário é administrador
    const isAdmin = user && user.administrador === true;

    // Verificar autenticação quando o componente carrega
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [loading, user, router]);

    // Configuração de escala responsiva
    const { scaleStyle } = useResponsiveScale();

    // ✅ HANDLERS DE NAVEGAÇÃO OTIMIZADOS
    const handleMenuSelect = useCallback((page, consultationId = null) => {
        console.log(`📍 Navegando para: ${page}`);
        setActivePage(page);

        if (page.toLowerCase() === "agenda" && consultationId) {
            setAgendaConsultationId(consultationId);
        } else if (page.toLowerCase() !== "patientprofile") {
            setSelectedPatientId(null);
            setAgendaConsultationId(null);
        }

        // Limpar mensagem selecionada ao navegar
        if (page.toLowerCase() !== "central de ajuda") {
            setSelectedMessageId(null);
        }
        
        // Update swipe index for mobile
        if (isMobile) {
            const pageIndex = pageToIndex[page.toLowerCase()];
            if (pageIndex !== undefined) {
                setActiveSwipeIndex(pageIndex);
            }
        }
    }, [isMobile]);

    const handlePatientClick = useCallback((patientId) => {
        console.log(`👤 Selecionando paciente: ${patientId}`);
        setSelectedPatientId(patientId);
        setActivePage("PatientProfile");
    }, []);

    const handleBackToDashboard = useCallback(() => {
        console.log('🏠 Voltando ao Dashboard');
        setSelectedPatientId(null);
        setSelectedMessageId(null);
        setActivePage("Dashboard");
    }, []);

    const handleAgendamentoClick = useCallback(() => {
        setActivePage("Agenda");
    }, []);

    const handleReceitaClick = useCallback(() => {
        setActivePage("Receitas");
    }, []);

    const handlePacienteTopAppBarClick = useCallback(() => {
        setActivePage("Criar novo paciente");
    }, []);

    const handleProfileClick = useCallback(() => {
        setActivePage("Meu Perfil");
    }, []);

    const handleMobileMenuToggle = useCallback(() => {
        setMobileMenuOpen(!mobileMenuOpen);
    }, [mobileMenuOpen]);

    const handleMobileMenuClose = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);
    
    // Handler for swipe navigation
    const handleSwipeIndexChange = useCallback((newIndex) => {
        setActiveSwipeIndex(newIndex);
        const pages = ['Dashboard', 'Pacientes', 'Receitas', 'Agenda'];
        if (pages[newIndex]) {
            setActivePage(pages[newIndex]);
        }
    }, []);
    
    // Handler for bottom navigation
    const handleBottomNavigate = useCallback((value) => {
        const pageMap = {
            'dashboard': 'Dashboard',
            'pacientes': 'Pacientes',
            'receitas': 'Receitas',
            'agenda': 'Agenda'
        };
        const page = pageMap[value];
        if (page) {
            handleMenuSelect(page);
        }
    }, [handleMenuSelect]);
    
    // Handler for FAB actions
    const handleFabClick = useCallback((action) => {
        switch (action) {
            case 'patient':
                setActivePage('Criar novo paciente');
                break;
            case 'prescription':
                setActivePage('Receitas');
                break;
            case 'appointment':
                setActivePage('Agenda');
                break;
        }
    }, []);

    // ✅ HANDLER PARA NOTIFICAÇÕES MELHORADO
    const handleNotificationClick = useCallback((data) => {
        console.log('🔔 Notificação clicada:', data);

        if (data?.openCentralAjuda) {
            // Abrir central de ajuda geral
            setSelectedMessageId(null);
            setActivePage("Central de Ajuda");
        } else if (data?.id) {
            // Abrir mensagem específica
            setSelectedMessageId(data.id);
            setActivePage("Central de Ajuda");
        } else if (data?.reportar) {
            // Abrir página de reportar
            setSelectedMessageId(null);
            setActivePage("Reportar");
        }
    }, []);

    // ✅ CONFIGURAÇÃO DOS MÓDULOS COM PERMISSÕES
    const getModulePermissions = useCallback(() => {
        return {
            patients: { read: true, write: true, viewDetails: true },
            prescriptions: { read: true, write: true },
            appointments: { read: true, write: true },
            exams: { read: true, write: false },
            notes: { read: true, write: true },
            financial: { read: false, write: false },
            reports: { read: true, write: false }
        };
    }, []);

    // ✅ VERIFICAR SE USUÁRIO PODE ACESSAR PÁGINA
    const canAccessPage = useCallback((page) => {
        if (!isSecretary) return true; // Médicos têm acesso total

        const moduleMap = {
            'pacientes': 'patients',
            'receitas': 'prescriptions',
            'agenda': 'appointments',
            'patientprofile': 'patients'
        };

        const requiredModule = moduleMap[page.toLowerCase()];
        if (!requiredModule) return true; // Páginas sem módulo específico

        return hasModulePermission(requiredModule, 'read');
    }, [isSecretary, hasModulePermission]);

    // ✅ FUNÇÃO PARA RENDERIZAR CONTEÚDO COM PROTEÇÃO
    const renderContent = useCallback(() => {
        const page = activePage.toLowerCase();

        switch (page) {
            case "dashboard":
                return <Dashboard onClickPatients={handlePatientClick}/>;

            case "pacientes":
                return (
                    <ProtectedRoute
                        requiredModule="patients"
                        requiredAction="read"
                        fallbackMessage="Você precisa de permissão para visualizar a lista de pacientes."
                    >
                        <PatientsListPage onPatientClick={handlePatientClick} />
                    </ProtectedRoute>
                );

            case "receitas":
                return (
                    <ProtectedRoute
                        requiredModule="prescriptions"
                        requiredAction="read"
                        fallbackMessage="Você precisa de permissão para visualizar receitas médicas."
                    >
                        <PrescriptionsPage />
                    </ProtectedRoute>
                );

            case "agenda":
                return (
                    <ProtectedRoute
                        requiredModule="appointments"
                        requiredAction="read"
                        fallbackMessage="Você precisa de permissão para acessar a agenda médica."
                    >
                        <AgendaMedica initialConsultationId={agendaConsultationId} />
                    </ProtectedRoute>
                );

            case "patientprofile":
                return (
                    <ProtectedRoute
                        requiredModule="patients"
                        requiredAction="viewDetails"
                        fallbackMessage="Você precisa de permissão para visualizar detalhes dos pacientes."
                    >
                        <PacienteTemplate
                            pacienteId={selectedPatientId}
                            onBack={handleBackToDashboard}
                        />
                    </ProtectedRoute>
                );

            case "criar novo paciente":
                return (
                    <ProtectedRoute
                        requiredModule="patients"
                        requiredAction="write"
                        fallbackMessage="Você precisa de permissão para criar novos pacientes."
                    >
                        <PacienteCadastroTemplate/>
                    </ProtectedRoute>
                );

            case "doctor ai":
                // IA disponível para todos
                return <DoctorAITemplate />;

            case "central de ajuda":
                // Suporte disponível para todos
                return <HelpCenter initialTab={0}/>;

            case "reportar":
                // Reportar disponível para todos
                return <CentralAjudaTemplate selectedMessageId={selectedMessageId} />;

            case "meu perfil":
                // Perfil disponível para todos
                return <UserProfileTemplate onLogout={logout}/>;

            case "dados":
                // Admin apenas para administradores
                return isAdmin ? (
                    <UnifiedUserManagement />
                ) : (
                    <Dashboard onClickPatients={handlePatientClick}/>
                );

            default:
                return <DashboardTemplate onClickPatients={handlePatientClick} />;
        }
    }, [
        activePage,
        selectedPatientId,
        agendaConsultationId,
        selectedMessageId,
        handlePatientClick,
        handleBackToDashboard,
        logout,
        isAdmin
    ]);

    // ✅ CONFIGURAR TÍTULO DINÂMICO COM BASE NA PÁGINA ATIVA
    const getPageTitle = useCallback(() => {
        const page = activePage.toLowerCase();
        const firstName = user?.fullName?.split(' ')[0] || 'Médico';

        // ✅ TÍTULOS ESPECIAIS PARA SECRETÁRIAS
        if (isSecretary) {
            const secretaryName = userContext?.secretaryData?.name || 'Secretária';
            const doctorName = userContext?.userData?.fullName || 'Médico';

            switch (page) {
                case "dashboard":
                    return (
                        <>
                            Bem vinda,{" "}
                            <span style={{color: "#1852FE"}}>
                                {secretaryName}
                            </span>
                            {" "}(Dr. {doctorName})
                        </>
                    );
                case "patientprofile":
                    return "Perfil do Paciente";
                case "meu perfil":
                    return "Meu Perfil";
                case "doctor ai":
                    return (
                        <>
                            <span style={{color: "#667eea"}}>Doctor AI</span>
                            {" - Assistente médico inteligente"}
                        </>
                    );
                case "central de ajuda":
                    return "Central de Ajuda";
                case "agenda":
                    return `${secretaryName}, confira a agenda do Dr. ${doctorName}`;
                case "pacientes":
                    return `${secretaryName}, gerencie os pacientes`;
                default:
                    return activePage;
            }
        }

        // ✅ TÍTULOS PARA MÉDICOS
        switch (page) {
            case "patientprofile":
                return "Perfil do Paciente";
            case "meu perfil":
                return "Meu Perfil";
            case "dados":
                return "Administração de Dados";
            case "doctor ai":
                return (
                    <>
                        <span style={{color: "#667eea"}}>Doctor AI</span>
                        {" - Seu assistente médico inteligente"}
                    </>
                );
            case "central de ajuda":
                return "Central de Ajuda";
            case "dashboard":
                return (
                    <>
                        Bem vindo,{" "}
                        <span style={{color: "#1852FE"}}>
                            Dr. {firstName}
                        </span>
                    </>
                );
            case "agenda":
                return (
                    <>
                        <span style={{color: "#1852FE"}}>
                            Dr. {firstName}
                        </span>
                        {", confira sua agenda"}
                    </>
                );
            case "pacientes":
                return (
                    <>
                        <span style={{color: "#1852FE"}}>
                            Dr. {firstName}
                        </span>
                        {", gerencie seus pacientes"}
                    </>
                );
            default:
                return activePage;
        }
    }, [activePage, user, isSecretary, userContext]);

    // ✅ EXPOR HANDLERS GLOBALMENTE
    useEffect(() => {
        window.handlePatientClick = handlePatientClick;
        window.handleMenuSelect = handleMenuSelect;
        window.handleBackToDashboard = handleBackToDashboard;
        window.handleReceitaClick = handleReceitaClick;

        return () => {
            delete window.handlePatientClick;
            delete window.handleMenuSelect;
            delete window.handleBackToDashboard;
            delete window.handleReceitaClick;
        };
    }, [handlePatientClick, handleMenuSelect, handleBackToDashboard, handleReceitaClick]);

    // ✅ MOSTRAR LOADING DURANTE VERIFICAÇÃO DE AUTENTICAÇÃO
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#F4F9FF'
                }}
            >
                <CircularProgress
                    color="primary"
                    size={60}
                    sx={{ mb: 3 }}
                />
                <Typography
                    variant="h6"
                    sx={{
                        color: '#1852FE',
                        fontFamily: 'Gellix, sans-serif',
                        mb: 1
                    }}
                >
                    Carregando...
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#666',
                        fontFamily: 'Gellix, sans-serif'
                    }}
                >
                    Verificando suas credenciais
                </Typography>
            </Box>
        );
    }

    // ✅ SE NÃO ESTIVER AUTENTICADO, NÃO RENDERIZAR NADA
    if (!user) {
        return null;
    }

    // ✅ ALERTAR SE SECRETÁRIA ESTÁ TENTANDO ACESSAR PÁGINA SEM PERMISSÃO
    if (isSecretary && !canAccessPage(activePage)) {
        console.warn(`⚠️ Secretária tentando acessar página sem permissão: ${activePage}`);
    }

    return (
        <Box display="flex" height="100vh" overflow="hidden" sx={{backgroundColor: "#F4F9FF"}}>
            {/* ✅ SIDEBAR PARA DESKTOP */}
            {!isMobile && (
                <Sidebar
                    initialSelected={activePage}
                    onMenuSelect={handleMenuSelect}
                    onLogout={logout}
                    onProfileClick={handleProfileClick}
                    userName={user?.fullName?.split(' ')[0] || "Médico"}
                    userRole={user?.especialidade || ""}
                />
            )}

            {/* ✅ SIDEBAR MÓVEL (DRAWER) */}
            {isMobile && (
                <Drawer
                    anchor="left"
                    open={mobileMenuOpen}
                    onClose={handleMobileMenuClose}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: '280px',
                            backgroundColor: '#F4F9FF',
                        }
                    }}
                >
                    <Sidebar
                        initialSelected={activePage}
                        onMenuSelect={(page, consultationId) => {
                            handleMenuSelect(page, consultationId);
                            handleMobileMenuClose();
                        }}
                        onLogout={logout}
                        onProfileClick={() => {
                            handleProfileClick();
                            handleMobileMenuClose();
                        }}
                        userName={user?.fullName?.split(' ')[0] || "Médico"}
                        userRole={user?.especialidade || ""}
                        isMobile={true}
                    />
                </Drawer>
            )}

            {/* ✅ ÁREA PRINCIPAL */}
            <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
                {/* ✅ TOP APP BAR */}
                <Box sx={{ flexShrink: 0 }}>
                    <TopAppBar
                        title={getPageTitle()}
                        onPacienteClick={handlePacienteTopAppBarClick}
                        onAgendamentoClick={handleAgendamentoClick}
                        onBackClick={handleBackToDashboard}
                        onReceitaClick={handleReceitaClick}
                        onProfileClick={handleProfileClick}
                        onNotificationClick={handleNotificationClick}
                        onMenuToggle={isMobile ? handleMobileMenuToggle : undefined}
                        isMobile={isMobile}
                    />
                </Box>

                {/* ✅ CONTEÚDO PRINCIPAL COM PROTEÇÃO */}
                <Box flex={1} sx={{ 
                    position: 'relative', 
                    overflow: isMobile ? 'hidden' : 'auto',
                    pb: isMobile ? '56px' : 0 // Space for bottom navigation
                }}>
                    {isMobile && mobilePages.includes(activePage.toLowerCase()) ? (
                        <SwipeableView
                            activeIndex={activeSwipeIndex}
                            onIndexChange={handleSwipeIndexChange}
                        >
                            <Box sx={{ height: '100%', overflow: 'auto', padding: '8px' }}>
                                <Dashboard onClickPatients={handlePatientClick} />
                            </Box>
                            <Box sx={{ height: '100%', overflow: 'auto', padding: '8px' }}>
                                <ProtectedRoute
                                    requiredModule="patients"
                                    requiredAction="read"
                                    fallbackMessage="Você precisa de permissão para visualizar a lista de pacientes."
                                >
                                    <PatientsListPage onPatientClick={handlePatientClick} />
                                </ProtectedRoute>
                            </Box>
                            <Box sx={{ height: '100%', overflow: 'auto', padding: '8px' }}>
                                <ProtectedRoute
                                    requiredModule="prescriptions"
                                    requiredAction="read"
                                    fallbackMessage="Você precisa de permissão para visualizar receitas médicas."
                                >
                                    <PrescriptionsPage />
                                </ProtectedRoute>
                            </Box>
                            <Box sx={{ height: '100%', overflow: 'auto', padding: '8px' }}>
                                <ProtectedRoute
                                    requiredModule="appointments"
                                    requiredAction="read"
                                    fallbackMessage="Você precisa de permissão para acessar a agenda médica."
                                >
                                    <AgendaMedica initialConsultationId={agendaConsultationId} />
                                </ProtectedRoute>
                            </Box>
                        </SwipeableView>
                    ) : (
                        <Box sx={{
                            height: 'auto',
                            padding: isMobile ? '8px' : isTablet ? '8px' : '10px',
                            boxSizing: 'border-box',
                            ...scaleStyle
                        }}>
                            {renderContent()}
                        </Box>
                    )}
                </Box>
                
                {/* ✅ BOTTOM NAVIGATION FOR MOBILE */}
                {isMobile && (
                    <BottomNavigation
                        activePage={activePage.toLowerCase()}
                        onNavigate={handleBottomNavigate}
                        onFabClick={handleFabClick}
                    />
                )}
            </Box>
        </Box>
    );
}