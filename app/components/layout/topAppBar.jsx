"use client";
import React from "react";
import { useTheme, useMediaQuery } from "@mui/material"; // Keeping for breakpoints hook if simpler, or replace with CSS media queries. I will keep it for logic consistency.
import {
    Menu,
    Bell,
    Plus,
    User,
    Calendar as CalendarIcon,
    FileText
} from "lucide-react";
import NotificationComponent from "../features/shared/NotificationComponent";
import { WhatsAppStatusButton } from "../features/conversations";
import { useAuth } from "../providers/authProvider";
import { cn } from "@/lib/utils";

// Botao de acao moderno e elegante - Matching Designer Code
const ActionButton = ({ label, icon: Icon, isPrimary = false, onClick, isMobile = false, variant = "default" }) => {
    const isWhatsApp = variant === "whatsapp";
    const isDestructive = variant === "destructive"; // if needed

    // Base classes based on variant - mais achatados e compactos
    let classes = "flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 active:scale-95 border";

    if (isMobile) {
        classes += " h-8 w-8 p-0 rounded-full"; // Mobile: icon only
    } else {
        classes += " h-8 px-3 text-xs"; // Mais baixo e compacto
    }

    if (isPrimary) {
        classes += " bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-transparent hover:bg-primary/90";
    } else if (isWhatsApp) {
        classes += " border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-300";
    } else {
        // Outline / Default
        classes += " border-muted-foreground/20 bg-transparent text-foreground hover:bg-muted/50 hover:text-primary";
    }

    return (
        <button onClick={onClick} className={cn(classes)}>
            {Icon && <Icon className={cn(isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />}
            {!isMobile && <span>{label}</span>}
        </button>
    );
};

const TopAppBar = ({
    title = "Dashboard",
    subtitle = "",
    userName = "",
    variant = "standard",
    onPacienteClick,
    onBackClick,
    onAgendamentoClick,
    onReceitaClick,
    onNotificationClick,
    onMenuToggle,
    isMobile = false
}) => {
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const { isSecretary, hasModulePermission, user } = useAuth();

    const handlePacienteClick = () => {
        if (onPacienteClick) onPacienteClick();
    };

    const handleAgendamentoClick = () => {
        if (onAgendamentoClick) onAgendamentoClick();
    };

    const handleReceitaClick = () => {
        if (onReceitaClick) onReceitaClick();
    };

    const handleNotificationClick = (data) => {
        if (onNotificationClick) onNotificationClick(data);
    };

    // Obter saudacao baseada na hora do dia
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    // Obter primeiro nome do usuario
    const getFirstName = () => {
        const fullName = user?.fullName || userName || "Doutor";
        return fullName.split(" ")[0];
    };

    const renderButtons = () => {
        return (
            <div className="flex items-center gap-2 mt-1">
                {/* Notificacoes - Using Wrapper to style external component */}
                <div className="relative">
                    {/* The NotificationComponent likely renders its own IconButton. 
                         To match the design completely we might need to pass custom styling props or refactor it.
                         For now, we place it here.
                         Design: Variant="outline" className="rounded-full relative border-muted-foreground/20 hover:bg-muted/50..."
                     */}
                    <NotificationComponent onMessageClick={handleNotificationClick} />
                </div>

                {/* WhatsApp Status Button */}
                <WhatsAppStatusButton variant={isMobile ? "chip" : "button"} />

                {/* Botoes de acao - apenas no desktop */}
                {!isMobile && (
                    <>
                        <ActionButton
                            label="Nova Receita"
                            icon={Plus}
                            isPrimary={true}
                            onClick={handleReceitaClick}
                        />

                        {(!isSecretary || hasModulePermission('patients', 'create')) && (
                            <ActionButton
                                label="Paciente"
                                icon={User}
                                onClick={handlePacienteClick}
                            />
                        )}

                        <ActionButton
                            label="Agendamento"
                            icon={CalendarIcon}
                            onClick={handleAgendamentoClick}
                        />
                    </>
                )}

                {/* Versao mobile - apenas botao de adicionar */}
                {isMobile && (
                    <button
                        onClick={handleReceitaClick}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <header className={cn(
            "w-full flex items-center justify-between px-4 lg:px-8 bg-transparent transition-all duration-300",
            isMobile ? "h-16" : "h-20"
        )}>
            {/* Lado esquerdo - Titulo e saudacao */}
            <div className="flex items-center gap-4">
                {/* Menu button para mobile */}
                {isMobile && onMenuToggle && (
                    <button
                        onClick={onMenuToggle}
                        className="p-2 -ml-2 rounded-lg text-foreground/80 hover:bg-muted/50 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}

                <div>
                    {/* Titulo principal com saudacao */}
                    <div className="flex flex-col">
                        {title === "Dashboard" ? (
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {getGreeting()}, <span className="text-primary">Dr. {getFirstName()}</span>
                            </h1>
                        ) : (
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {title}
                            </h1>
                        )}

                        {/* Subtitulo */}
                        {(subtitle || title === "Dashboard") && (
                            <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                                {subtitle || "Aqui está o resumo da sua agenda hoje."}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Lado direito - Acoes */}
            {renderButtons()}
        </header>
    );
};

export default TopAppBar;
