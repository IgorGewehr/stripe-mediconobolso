"use client";

import React, { useState, useEffect } from 'react';
import {
    useTheme,
    useMediaQuery
} from '@mui/material';
import PatientsListCard from "../features/patients/PatientsList.jsx";
import { useAuth } from "../providers";
import { usePatients } from "../hooks";
import { appointmentsService } from '@/lib/services/api';
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

    // Usar hook de pacientes
    const {
        patients: hookPatients,
        loading: loadingPatients,
        pagination: patientsPagination,
    } = usePatients({ autoLoad: true });

    // Estado para controle de loading de appointments
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    // Carregar TODOS os appointments (não apenas do dia atual)
    useEffect(() => {
        const loadAllAppointments = async () => {
            if (!user?.uid) return;

            setLoadingAppointments(true);
            try {
                // Usar listAllConsultations para pegar TODAS as consultas
                const allAppointments = await appointmentsService.listAllConsultations();

                // Converter para o formato esperado
                const convertedConsultations = allAppointments.map(apt => ({
                    ...apt,
                    consultationDate: apt.startTime || apt.consultationDate,
                    consultationTime: apt.startTime ? format(new Date(apt.startTime), 'HH:mm') : apt.consultationTime,
                    patientName: apt.patientName || 'Paciente',
                }));

                setConsultations(convertedConsultations);

                // Calcular métricas
                if (hookPatients) {
                    calculateMetrics(convertedConsultations, hookPatients);
                }
            } catch (error) {
                console.error('[Dashboard] Error loading appointments:', error);
            } finally {
                setLoadingAppointments(false);
            }
        };

        loadAllAppointments();
    }, [user?.uid]);

    // Sincronizar pacientes do hook com estado local
    useEffect(() => {
        if (!user?.uid) return;

        if (hookPatients && hookPatients.length > 0) {
            const convertedPatients = hookPatients.map(p => ({
                ...p,
                patientName: p.patientName || p.name,
                patientEmail: p.patientEmail || p.email,
                patientPhone: p.patientPhone || p.phone,
                patientGender: p.patientGender || p.gender || p.sexo,
                birthDate: p.birthDate || p.dataNascimento,
            }));
            setPatients(convertedPatients);

            // Recalcular métricas quando pacientes carregarem
            if (consultations.length > 0) {
                calculateMetrics(consultations, convertedPatients);
            }
        }

        setLoading(loadingPatients || loadingAppointments);
    }, [user, hookPatients, loadingPatients, loadingAppointments, consultations]);

    // Helper para parsear datas de consulta de forma segura
    const safeParseDateFromConsultation = (c) => {
        const dateSource = c.consultationDate || c.startTime || c.date;
        if (!dateSource) return null;

        let consultDate;
        if (dateSource instanceof Date) {
            consultDate = new Date(dateSource);
            // REMOVED LEGACY FIRESTORE SUPPORT
            // } else if (typeof dateSource.toDate === 'function') {
            //     consultDate = dateSource.toDate();
        } else if (typeof dateSource === 'string') {
            consultDate = new Date(dateSource);
        } else {
            return null;
        }

        return isNaN(consultDate.getTime()) ? null : consultDate;
    };

    const calculateMetrics = (consultationsData, patientsData) => {
        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Contar consultas por período
        const dailyAppointments = consultationsData.filter(c => {
            const consultDate = safeParseDateFromConsultation(c);
            if (!consultDate) return false;
            return startOfDay(consultDate).getTime() === today.getTime();
        }).length;

        const monthlyAppointments = consultationsData.filter(c => {
            const consultDate = safeParseDateFromConsultation(c);
            if (!consultDate) return false;
            return isAfter(consultDate, oneMonthAgo) || startOfDay(consultDate).getTime() === oneMonthAgo.getTime();
        }).length;

        // Contar próximas consultas (futuras, a partir de amanhã)
        const upcomingAppointments = consultationsData.filter(c => {
            const consultDate = safeParseDateFromConsultation(c);
            if (!consultDate) return false;
            return isAfter(consultDate, tomorrow);
        }).length;

        // Número visualmente chamativo (quantidade total de pacientes)
        // Usar pagination.total para o total real, não apenas o tamanho da página atual
        const visuallyCalledNumber = patientsPagination?.total || patientsData?.length || 0;

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
                // Ignorar canceladas
                const status = consultation.status?.toLowerCase();
                if (status === 'cancelada' || status === 'cancelado') return false;

                let consultDate = safeParseDateFromConsultation(consultation);
                if (!consultDate) return false;

                // Aplicar horário se disponível
                if (consultation.consultationTime) {
                    const timeParts = consultation.consultationTime.split(':');
                    const hour = parseInt(timeParts[0]) || 0;
                    const minute = parseInt(timeParts[1]) || 0;
                    consultDate.setHours(hour, minute, 0, 0);
                }

                return consultDate >= now;
            })
            .sort((a, b) => {
                const dateA = safeParseDateFromConsultation(a);
                const dateB = safeParseDateFromConsultation(b);
                if (!dateA) return 1;
                if (!dateB) return -1;
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
                            borderClass="border-l-blue-500"
                            bgClass="bg-blue-50"
                            iconClass="text-blue-600"
                            ringClass="ring-blue-300"
                            onClick={() => setViewOption(VIEW_OPTIONS.ALL)}
                            active={viewOption === VIEW_OPTIONS.ALL}
                        />
                        <StatsCard
                            title="Consultas Hoje"
                            value={metrics.dailyAppointments}
                            icon={CalendarIcon}
                            borderClass="border-l-rose-500"
                            bgClass="bg-rose-50"
                            iconClass="text-rose-600"
                            ringClass="ring-rose-300"
                            onClick={() => setViewOption(VIEW_OPTIONS.TODAY)}
                            active={viewOption === VIEW_OPTIONS.TODAY}
                        />
                        <StatsCard
                            title="Próximos"
                            value={metrics.upcomingAppointments}
                            icon={CalendarCheck}
                            borderClass="border-l-emerald-500"
                            bgClass="bg-emerald-50"
                            iconClass="text-emerald-600"
                            ringClass="ring-emerald-300"
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
