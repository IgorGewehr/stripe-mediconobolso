"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Link } from "@mui/material"; // Keeping for compatibility if needed
import { useAuth } from "../providers/authProvider";
import SecretaryIndicator from "../features/shared/SecretaryIndicator";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    MessageSquare,
    BarChart3,
    DollarSign,
    Settings,
    HelpCircle,
    AlertCircle,
    Sparkles,
    ChevronRight,
    Shield,
    Building2
} from "lucide-react";
import { Avatar } from "@mui/material";

const Sidebar = ({
    initialSelected = "Dashboard",
    userName = "Dolittle",
    userRole = "Cirurgião",
    onMenuSelect,
    onLogout,
    onProfileClick,
    isMobile = false,
}) => {
    const [selected, setSelected] = useState(initialSelected);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef(null);
    const { user, isSecretary, userContext, clinicMode, doctorAssociation } = useAuth();
    const isAdmin = user?.administrador === true;
    const isClinicOwner = doctorAssociation?.associationType === 'owner';
    const canManageClinic = isAdmin || isClinicOwner || (clinicMode === 'solo' && !isSecretary);

    // Handle scroll - show scrollbar while scrolling, hide 1s after stop
    const handleScroll = useCallback(() => {
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    }, []);

    // Map existing menu logic to Lucide icons
    const menuItems = useMemo(() => ({
        principal: [
            { label: "Dashboard", icon: LayoutDashboard },
            { label: "Pacientes", icon: Users },
            { label: "Receitas", icon: FileText },
            { label: "Agenda", icon: Calendar },
            { label: "Conversas", icon: MessageSquare },
            { label: "CRM", icon: BarChart3 },
            { label: "Financeiro", icon: DollarSign }
        ],
        admin: [
            ...(canManageClinic ? [{ label: "Gestão da Clínica", icon: Building2 }] : []),
            ...(user && user.administrador === true ? [{ label: "Dados", icon: Shield }] : [])
        ],
        ia: [
            { label: "Doctor AI", icon: Sparkles, special: false }
        ],
        suporte: [
            { label: "Central de Ajuda", icon: HelpCircle },
            { label: "Reportar", icon: AlertCircle }
        ]
    }), [user, canManageClinic]);

    const visibleItems = useMemo(() => {
        const filterItems = (items) => items.map(item => ({
            ...item,
            hasAccess: !item.disabled,
            disabled: item.disabled || false
        }));

        return {
            principal: filterItems(menuItems.principal),
            admin: filterItems(menuItems.admin),
            ia: filterItems(menuItems.ia),
            suporte: filterItems(menuItems.suporte)
        };
    }, [menuItems]);

    const handleMenuClick = (label, disabled = false) => {
        if (disabled) return;
        setSelected(label);
        onMenuSelect?.(label);
    };

    const handleProfileClick = () => {
        if (onProfileClick) onProfileClick();
        else onMenuSelect?.("Meu Perfil");
    };

    const NavItem = ({ item }) => {
        const isActive = selected === item.label;
        const Icon = item.icon;

        if (item.special && item.label === "Doctor AI") {
            return (
                <div
                    onClick={() => handleMenuClick(item.label)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group mb-1",
                        isActive
                            ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                >
                    <Icon className={cn("w-4 h-4", isActive ? "text-indigo-100" : "text-indigo-600 group-hover:text-indigo-700")} />
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Beta
                    </span>
                </div>
            );
        }

        return (
            <div
                onClick={() => handleMenuClick(item.label, item.disabled)}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group mb-1",
                    item.disabled ? "opacity-60 cursor-not-allowed" : "",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                <span>{item.label}</span>
            </div>
        );
    };

    return (
        <div className={cn(
            "h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40 bg-white/80 backdrop-blur-xl transition-all duration-300",
            isMobile ? "w-full" : "w-64"
        )}>
            {/* Header / Logo */}
            <div className="p-6">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleMenuClick("Dashboard")}
                >
                    <img
                        src="/logo.png"
                        alt="Médico no Bolso"
                        className="w-8 h-8 object-contain"
                    />
                    <div className="flex flex-col">
                        <span className="text-base font-bold leading-none tracking-tight text-foreground">
                            Médico
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                            No Bolso
                        </span>
                    </div>
                </div>
            </div>

            {/* Secretary Indicator */}
            {isSecretary && (
                <div className="px-6 mb-4">
                    <SecretaryIndicator
                        isSecretary={isSecretary}
                        secretaryName={userContext?.secretaryData?.name}
                        doctorName={userContext?.userData?.fullName}
                    />
                </div>
            )}

            <div
                className={cn(
                    "flex-1 overflow-y-auto py-2 px-4 space-y-6",
                    isScrolling ? "sidebar-scroll-visible" : "sidebar-scroll-hidden"
                )}
                onScroll={handleScroll}
            >
                {/* Principal */}
                <div>
                    <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-2">
                        Principal
                    </div>
                    {visibleItems.principal.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </div>

                {/* Admin */}
                {visibleItems.admin.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-2">
                            Administração
                        </div>
                        {visibleItems.admin.map((item) => (
                            <NavItem key={item.label} item={item} />
                        ))}
                    </div>
                )}

                {/* IA */}
                <div>
                    <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-2">
                        Inteligência Artificial
                    </div>
                    {visibleItems.ia.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </div>

                {/* Suporte */}
                <div>
                    <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-2">
                        Suporte
                    </div>
                    {visibleItems.suporte.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </div>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-t border-sidebar-border mt-auto">
                <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-2">
                    Meu Perfil
                </div>
                <div
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                    <div className="relative h-9 w-9">
                        <img
                            src={user?.photoURL || "https://github.com/shadcn.png"}
                            alt={userName}
                            className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                            Dr. {user?.fullName?.split(" ")[0] || userName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.especialidade || userRole}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
