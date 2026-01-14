import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    Calendar as CalendarIcon,
    Plus,
    MapPin,
    CloudSun,
    Cloud,
    CloudRain,
    Sun,
    CloudSnow,
    Check,
    Loader2
} from "lucide-react";
import { Avatar, Skeleton } from "@mui/material";

// --- Generic UI Components (Shadcn-like) ---
export const Card = ({ className, children, onClick }) => (
    <div
        className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
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

// Weather icon mapper
const getWeatherIcon = (condition) => {
    const iconMap = {
        'Clear': Sun,
        'Clouds': Cloud,
        'Rain': CloudRain,
        'Drizzle': CloudRain,
        'Thunderstorm': CloudRain,
        'Snow': CloudSnow,
        'Mist': Cloud,
        'Fog': Cloud,
        'Haze': CloudSun,
    };
    return iconMap[condition] || CloudSun;
};

// Weather description mapper
const getWeatherDescription = (condition) => {
    const descMap = {
        'Clear': 'Ensolarado',
        'Clouds': 'Nublado',
        'Rain': 'Chuvoso',
        'Drizzle': 'Garoa',
        'Thunderstorm': 'Tempestade',
        'Snow': 'Neve',
        'Mist': 'Nevoa',
        'Fog': 'Neblina',
        'Haze': 'Nevoa seca',
    };
    return descMap[condition] || condition;
};

export const WeatherWidget = ({ city = "São Paulo,BR" }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
                if (!response.ok) throw new Error('Falha ao carregar clima');
                const data = await response.json();
                setWeather(data);
                setError(null);
            } catch (err) {
                console.error('[WeatherWidget] Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Refresh weather every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [city]);

    const WeatherIcon = weather ? getWeatherIcon(weather.currentWeather) : CloudSun;

    if (loading) {
        return (
            <Card className="h-full overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-blue-50/50">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <Skeleton variant="text" width={80} height={20} />
                        <Skeleton variant="circular" width={32} height={32} />
                    </div>
                    <div className="mt-4">
                        <Skeleton variant="text" width={60} height={48} />
                        <Skeleton variant="text" width={70} height={20} sx={{ mt: 1 }} />
                        <Skeleton variant="text" width={100} height={16} sx={{ mt: 1 }} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50/50">
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {weather?.cityName || weather?.originalCityName || city.split(',')[0]}
                    </div>
                    <WeatherIcon className={cn(
                        "w-8 h-8",
                        weather?.currentWeather === 'Clear' ? "text-yellow-500" :
                        weather?.currentWeather === 'Rain' ? "text-blue-500" :
                        "text-orange-400"
                    )} />
                </div>

                <div className="mt-4">
                    <div className="text-4xl font-bold tracking-tighter text-slate-900">
                        {weather?.currentTemp ?? '--'}°
                    </div>
                    <div className="text-sm text-slate-500 font-medium mt-1">
                        {weather?.currentWeather ? getWeatherDescription(weather.currentWeather) : '--'}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        <span>H: {weather?.highTemp ?? '--'}°</span>
                        <span>L: {weather?.lowTemp ?? '--'}°</span>
                    </div>
                </div>

                {weather?.isSimulated && (
                    <div className="text-xs text-slate-400 mt-2 italic">
                        Dados estimados
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

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

export const StatsCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, iconClass, ringClass, onClick, active }) => (
    <Card
        className={cn(
            "border-l-4 shadow-sm transition-all duration-300 ease-out relative overflow-hidden group",
            borderClass,
            onClick && "cursor-pointer select-none",
            active
                ? cn("shadow-xl border-l-[6px] bg-white", borderClass)
                : "hover:shadow-md hover:translate-y-[-2px] bg-white/80"
        )}
        onClick={onClick}
    >
        {/* Gradient background when active */}
        <div className={cn(
            "absolute inset-0 transition-all duration-500 ease-out",
            active
                ? cn("opacity-100", bgClass?.replace("bg-", "bg-gradient-to-br from-") + "/20 to-white")
                : "opacity-0"
        )} />

        {/* Bottom accent line that expands when active */}
        <div className={cn(
            "absolute bottom-0 left-0 h-[3px] transition-all duration-500 ease-out",
            iconClass?.replace("text-", "bg-"),
            active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-50"
        )} />

        <CardContent className="p-5 flex items-center justify-between relative z-10">
            <div className="flex-1">
                <p className={cn(
                    "text-sm font-medium transition-all duration-300",
                    active ? iconClass : "text-slate-500 group-hover:text-slate-700"
                )}>
                    {title}
                </p>
                <h3 className={cn(
                    "text-3xl font-bold mt-1 transition-all duration-300 tracking-tight",
                    active ? "text-slate-900" : "text-slate-800"
                )}>
                    {value}
                </h3>
            </div>

            {/* Icon container with elegant active state */}
            <div className={cn(
                "relative flex items-center justify-center transition-all duration-300",
                active ? "w-14 h-14" : "w-12 h-12 group-hover:w-13 group-hover:h-13"
            )}>
                {/* Background circle */}
                <div className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    bgClass,
                    active ? "opacity-100 scale-100" : "opacity-60 scale-95 group-hover:opacity-80 group-hover:scale-100"
                )} />

                {/* Icon */}
                <Icon className={cn(
                    "relative z-10 transition-all duration-300",
                    iconClass,
                    active ? "w-7 h-7" : "w-5 h-5 group-hover:w-6 group-hover:h-6"
                )} />

                {/* Selection indicator badge */}
                <div className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                    iconClass?.replace("text-", "bg-"),
                    active ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )}>
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                </div>
            </div>
        </CardContent>
    </Card>
);

