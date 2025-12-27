"use client";

import React, { useState, useEffect } from 'react';
import {
    useTheme,
    useMediaQuery
} from '@mui/material';
import PatientsListCard from "../features/patients/PatientsList.jsx";
import { useAuth } from "../providers";
import { usePatients, useAppointments } from "../hooks";
import { format, addDays, subDays, startOfDay, isAfter } from 'date-fns';
import MiniChatCard from "../features/shared/MiniChatCard";
import {
    WeatherWidget,
    NextAppointmentCard,
    StatsCard
} from "../features/dashboard/ModernWidgets";
import {
    Users,
    Calendar as CalendarIcon,
    CalendarCheck
} from "lucide-react";

// Constantes de filtro
const VIEW_OPTIONS = {
    ALL: 'all',
    TODAY: 'today',
    UPCOMING: 'upcoming'
};

const Dashboard = ({ onClickPatients }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [viewOption, setViewOption] = useState(VIEW_OPTIONS.ALL);
    const [metrics, setMetrics] = useState({
        dailyAppointments: 0,
        weeklyAppointments: 0,
        monthlyAppointments: 0,
        yearlyAppointments: 0,
        recurringRate: 0,
        visuallyCalledNumber: 0,
        upcomingAppointments: 0
    });

    // Usar os novos hooks
    const {
        patients: hookPatients,
        loading: loadingPatients,
    } = usePatients({ autoLoad: true });

    const {
        appointments: hookAppointments,
        loading: loadingAppointments,
    } = useAppointments({ autoLoad: true });

    // Sincronizar dados dos hooks com o estado local
    useEffect(() => {
        if (!user?.uid) return;

        // Converter pacientes do hook para o formato esperado
        if (hookPatients && hookPatients.length > 0) {
            const convertedPatients = hookPatients.map(p => ({
                ...p,
                patientName: p.name || p.patientName,
                patientEmail: p.email || p.patientEmail,
                patientPhone: p.phone || p.patientPhone,
            }));
            setPatients(convertedPatients);
        }

        // Converter appointments do hook para consultations
        if (hookAppointments && hookAppointments.length > 0) {
            const convertedConsultations = hookAppointments.map(apt => ({
                ...apt,
                consultationDate: apt.startTime || apt.consultationDate,
                consultationTime: apt.startTime ? format(new Date(apt.startTime), 'HH:mm') : apt.consultationTime,
            }));
            setConsultations(convertedConsultations);
        }

        // Calcular métricas quando ambos estiverem disponíveis
        if (hookPatients && hookAppointments) {
            calculateMetrics(
                hookAppointments.map(apt => ({
                    ...apt,
                    consultationDate: apt.startTime || apt.consultationDate,
                })),
                hookPatients
            );
        }

        setLoading(loadingPatients || loadingAppointments);
    }, [user, hookPatients, hookAppointments, loadingPatients, loadingAppointments]);

    const calculateMetrics = (consultationsData, patientsData) => {
        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);

        const oneWeekAgo = subDays(today, 7);
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Contar consultas por período
        const dailyAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return startOfDay(consultDate).getTime() === today.getTime();
        }).length;

        const monthlyAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return isAfter(consultDate, oneMonthAgo) || startOfDay(consultDate).getTime() === oneMonthAgo.getTime();
        }).length;

        // Contar próximas consultas (futuras, excluindo hoje)
        const upcomingAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return isAfter(consultDate, tomorrow);
        }).length;

        // Número visualmente chamativo (quantidade total de pacientes)
        const visuallyCalledNumber = patientsData.length;

        setMetrics({
            dailyAppointments,
            monthlyAppointments,
            visuallyCalledNumber,
            upcomingAppointments
        });
    };

    // Encontrar a próxima consulta
    const getNextConsultation = () => {
        const now = new Date();
        const futureConsultations = consultations
            .filter(consultation => {
                if (consultation.status && consultation.status.toLowerCase() === 'cancelada') return false;

                const consultDate = consultation.consultationDate instanceof Date
                    ? consultation.consultationDate
                    : consultation.consultationDate && typeof consultation.consultationDate.toDate === 'function'
                        ? consultation.consultationDate.toDate()
                        : new Date();

                if (consultation.consultationTime) {
                    const [hour, minute] = consultation.consultationTime.split(':').map(Number);
                    consultDate.setHours(hour, minute, 0, 0);
                }
                return consultDate >= now;
            })
            .sort((a, b) => {
                const dateA = a.consultationDate instanceof Date ? a.consultationDate : new Date(a.consultationDate); // Simplification
                const dateB = b.consultationDate instanceof Date ? b.consultationDate : new Date(b.consultationDate);
                return dateA - dateB;
            });

        return futureConsultations.length > 0 ? futureConsultations[0] : null;
    };


    const handlePatientClick = (patientId) => {
        if (onClickPatients) onClickPatients(patientId);
    };

    const nextConsultation = getNextConsultation();

    return (
        <div className="w-full max-w-[100vw] overflow-x-hidden p-4 md:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 bg-fixed">
            <div className="grid grid-cols-12 gap-6 h-full">
                {/* Left Column - Main Dashboard Content */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Top Widgets Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Weather Widget */}
                        <div className="col-span-1 md:col-span-4">
                            <WeatherWidget />
                        </div>

                        {/* Next Appointment Card */}
                        <div className="col-span-1 md:col-span-8">
                            <NextAppointmentCard
                                consultation={{
                                    patientName: nextConsultation?.patientName || "Sem consultas próximas",
                                    type: "Consulta Regular",
                                    time: nextConsultation ? `${format(new Date(nextConsultation.consultationDate), 'dd/MM')} às ${nextConsultation.consultationTime}` : "",
                                    patientAvatar: nextConsultation?.patientAvatar
                                }}
                                onDetailsClick={() => nextConsultation && handlePatientClick(nextConsultation.patientId)}
                            />
                        </div>
                    </div>

                    {/* Stats Row - Cards clicáveis que filtram a lista de pacientes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatsCard
                            title="Total Pacientes"
                            value={metrics.visuallyCalledNumber}
                            icon={Users}
                            borderClass={viewOption === VIEW_OPTIONS.ALL ? "border-l-blue-600 ring-2 ring-blue-200" : "border-l-blue-500"}
                            bgClass="bg-blue-50"
                            iconClass="text-blue-600"
                            onClick={() => setViewOption(VIEW_OPTIONS.ALL)}
                            active={viewOption === VIEW_OPTIONS.ALL}
                        />
                        <StatsCard
                            title="Consultas Hoje"
                            value={metrics.dailyAppointments}
                            icon={CalendarIcon}
                            borderClass={viewOption === VIEW_OPTIONS.TODAY ? "border-l-rose-600 ring-2 ring-rose-200" : "border-l-rose-500"}
                            bgClass="bg-rose-50"
                            iconClass="text-rose-600"
                            onClick={() => setViewOption(VIEW_OPTIONS.TODAY)}
                            active={viewOption === VIEW_OPTIONS.TODAY}
                        />
                        <StatsCard
                            title="Próximos"
                            value={metrics.upcomingAppointments}
                            icon={CalendarCheck}
                            borderClass={viewOption === VIEW_OPTIONS.UPCOMING ? "border-l-emerald-600 ring-2 ring-emerald-200" : "border-l-emerald-500"}
                            bgClass="bg-emerald-50"
                            iconClass="text-emerald-600"
                            onClick={() => setViewOption(VIEW_OPTIONS.UPCOMING)}
                            active={viewOption === VIEW_OPTIONS.UPCOMING}
                        />
                    </div>

                    {/* Patient List Section */}
                    <div className="flex-1">
                        <PatientsListCard
                            patients={patients}
                            consultations={consultations}
                            loading={loading}
                            onPatientClick={handlePatientClick}
                            viewOption={viewOption}
                            hideHeader={true}
                        />
                    </div>
                </div>

                {/* Right Column - Doctor AI Chat */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 min-h-[400px]">
                        <MiniChatCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
