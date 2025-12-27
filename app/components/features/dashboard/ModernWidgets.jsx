import React from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    Calendar as CalendarIcon,
    Plus,
    MapPin,
    CloudSun
} from "lucide-react";
import { Avatar } from "@mui/material";

// --- Generic UI Components (Shadcn-like) ---
export const Card = ({ className, children }) => (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}>
        {children}
    </div>
);

export const CardHeader = ({ className, children }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
        {children}
    </div>
);

export const CardTitle = ({ className, children }) => (
    <h3 className={cn("font-semibold leading-none tracking-tight", className)}>
        {children}
    </h3>
);

export const CardContent = ({ className, children }) => (
    <div className={cn("p-6 pt-0", className)}>
        {children}
    </div>
);

export const Badge = ({ className, variant = "default", children }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
    };
    return (
        <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)}>
            {children}
        </div>
    );
};

// --- Specific Dashboard Widgets ---

export const WeatherWidget = () => (
    <Card className="h-full overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50/50">
        <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    São Paulo
                </div>
                <CloudSun className="w-8 h-8 text-orange-400" />
            </div>

            <div className="mt-4">
                <div className="text-4xl font-bold tracking-tighter text-slate-900">33°</div>
                <div className="text-sm text-slate-500 font-medium mt-1">Nublado</div>
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                    <span>H: 35°</span>
                    <span>L: 32°</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

export const NextAppointmentCard = ({ consultation, onDetailsClick }) => {
    if (!consultation) {
        // Fallback state or loading
        return (
            <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/25 relative overflow-hidden group h-full min-h-[220px]">
                <CardContent className="flex items-center justify-center h-full relative z-10">
                    <span className="text-white/80">Nenhuma consulta próxima</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full bg-primary text-primary-foreground border-none shadow-lg shadow-primary/25 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-white/15 transition-colors"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>

            <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium opacity-90">Próxima consulta</CardTitle>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                        {consultation.time || "Hoje, 14:30"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar src={consultation.patientAvatar} sx={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.2)" }} />
                    <div>
                        <div className="text-xl font-bold">{consultation.patientName || "Paciente"}</div>
                        <div className="text-blue-100 text-sm mt-0.5">{consultation.type || "Consulta de Rotina"}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {/* Avatars placeholder */}
                    </div>
                    <button
                        onClick={onDetailsClick}
                        className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm border-0 py-2 px-4 rounded-md text-sm transition-colors"
                    >
                        Ver Detalhes
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};

export const StatsCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, iconClass, onClick, active }) => (
    <Card
        className={cn(
            "border-l-4 shadow-sm transition-all duration-200",
            borderClass,
            onClick && "cursor-pointer",
            active
                ? "ring-2 ring-offset-2 scale-[1.02] shadow-md"
                : "hover:shadow-md hover:scale-[1.01]"
        )}
        onClick={onClick}
    >
        <CardContent className="p-5 flex items-center justify-between">
            <div>
                <p className={cn("text-sm font-medium", active ? "text-slate-700" : "text-slate-500")}>{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
            </div>
            <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-transform",
                bgClass,
                iconClass,
                active && "scale-110"
            )}>
                <Icon className="w-5 h-5" />
            </div>
        </CardContent>
    </Card>
);

