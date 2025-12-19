"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    useTheme,
    useMediaQuery
} from '@mui/material';
import MetricsCard from "../features/shared/MetricsCard";
import ConsultationCard from "../features/shared/ConsultationCard";
import PatientsListCard from "../features/patients/PatientsList.jsx";
import MobileConsultationCard from "../features/mobile/MobileConsultationCard";
import MobilePatientsListCard from "../features/mobile/MobilePatientsListCard";
import { useAuth } from "../providers";
import FirebaseService from "../../../lib/firebaseService";
import { format, addDays, subDays, startOfDay, isAfter } from 'date-fns';
import MiniChatCard from "../features/shared/MiniChatCard";

const Dashboard = ({ onClickPatients }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMedium = useMediaQuery(theme.breakpoints.down('md'));
    const { user, getEffectiveUserId } = useAuth();

    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [metrics, setMetrics] = useState({
        dailyAppointments: 0,
        weeklyAppointments: 0,
        monthlyAppointments: 0,
        yearlyAppointments: 0,
        recurringRate: 0,
        visuallyCalledNumber: 0
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user?.uid) return;

            setLoading(true);
            try {
                // Carregar consultas
                const consultationsData = await FirebaseService.listAllConsultations(getEffectiveUserId());
                setConsultations(consultationsData);

                // Carregar pacientes
                const patientsData = await FirebaseService.getPatientsByDoctor(getEffectiveUserId());
                setPatients(patientsData);

                // Calcular métricas
                calculateMetrics(consultationsData, patientsData);
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const calculateMetrics = (consultationsData, patientsData) => {
        const today = startOfDay(new Date());

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

        const weeklyAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return isAfter(consultDate, oneWeekAgo) || startOfDay(consultDate).getTime() === oneWeekAgo.getTime();
        }).length;

        const monthlyAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return isAfter(consultDate, oneMonthAgo) || startOfDay(consultDate).getTime() === oneMonthAgo.getTime();
        }).length;

        const yearlyAppointments = consultationsData.filter(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            return isAfter(consultDate, oneYearAgo) || startOfDay(consultDate).getTime() === oneYearAgo.getTime();
        }).length;

        // Calcular taxa de recorrência (pacientes com mais de uma consulta nos últimos 3 meses)
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Agrupar consultas por paciente
        const patientConsultationCount = {};
        consultationsData.forEach(c => {
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate && typeof c.consultationDate.toDate === 'function'
                    ? c.consultationDate.toDate()
                    : new Date();

            if (isAfter(consultDate, threeMonthsAgo) || startOfDay(consultDate).getTime() === threeMonthsAgo.getTime()) {
                patientConsultationCount[c.patientId] = (patientConsultationCount[c.patientId] || 0) + 1;
            }
        });

        // Contar pacientes com mais de uma consulta
        const recurringPatients = Object.values(patientConsultationCount).filter(count => count > 1).length;
        const totalPatientsWithConsults = Object.keys(patientConsultationCount).length;

        const recurringRate = totalPatientsWithConsults > 0
            ? Math.round((recurringPatients / totalPatientsWithConsults) * 100)
            : 0;

        // Número visualmente chamativo (quantidade total de pacientes)
        const visuallyCalledNumber = patientsData.length;

        setMetrics({
            dailyAppointments,
            weeklyAppointments,
            monthlyAppointments,
            yearlyAppointments,
            recurringRate,
            visuallyCalledNumber
        });
    };

    // Encontrar a próxima consulta
    const getNextConsultation = () => {
        const now = new Date();

        // Filtra as consultas futuras, ignorando as canceladas, e as ordena por data
        const futureConsultations = consultations
            .filter(consultation => {
                // Ignorar se a consulta estiver cancelada
                if (
                    consultation.status &&
                    consultation.status.toLowerCase() === 'cancelada'
                ) {
                    return false;
                }

                // Obter a data da consulta de forma segura
                const consultDate =
                    consultation.consultationDate instanceof Date
                        ? consultation.consultationDate
                        : consultation.consultationDate &&
                        typeof consultation.consultationDate.toDate === 'function'
                            ? consultation.consultationDate.toDate()
                            : new Date();

                // Se houver horário, ajusta a data com a hora da consulta
                if (consultation.consultationTime) {
                    const [hour, minute] = consultation.consultationTime.split(':').map(Number);
                    consultDate.setHours(hour, minute, 0, 0);
                }

                return consultDate >= now;
            })
            .sort((a, b) => {
                const dateA =
                    a.consultationDate instanceof Date
                        ? a.consultationDate
                        : a.consultationDate &&
                        typeof a.consultationDate.toDate === 'function'
                            ? a.consultationDate.toDate()
                            : new Date();
                const dateB =
                    b.consultationDate instanceof Date
                        ? b.consultationDate
                        : b.consultationDate &&
                        typeof b.consultationDate.toDate === 'function'
                            ? b.consultationDate.toDate()
                            : new Date();

                if (a.consultationTime) {
                    const [hourA, minuteA] = a.consultationTime.split(':').map(Number);
                    dateA.setHours(hourA, minuteA, 0, 0);
                }

                if (b.consultationTime) {
                    const [hourB, minuteB] = b.consultationTime.split(':').map(Number);
                    dateB.setHours(hourB, minuteB, 0, 0);
                }

                return dateA - dateB;
            });

        return futureConsultations.length > 0 ? futureConsultations[0] : null;
    };


    // Handlers para a SPA
    const handlePatientClick = (patientId) => {
        // Passamos o patientId para a função de callback recebida como prop
        if (onClickPatients) {
            onClickPatients(patientId);
        }
    };

    const handleViewAgenda = (consultation) => {
        if (window.handleMenuSelect) {
            // Passa o ID da consulta para o menu, que por sua vez salvará no estado do AppLayout
            window.handleMenuSelect("Agenda", consultation.id);
        }
    };

    return (
        <Box sx={{ 
            width: '100%',
            maxWidth: '100vw',
            overflow: 'hidden',
            pt: isMobile ? 1 : isTablet ? 1.5 : 2, 
            pb: isMobile ? 8 : isTablet ? 3 : 4, // Extra bottom padding for mobile to account for bottom navigation
            px: isMobile ? 2 : isTablet ? 2 : 0
        }}>
            <Grid container spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
                {/* Ordem alterada para mobile - MiniChat primeiro em mobile */}
                {isMobile && (
                    <Grid item xs={12} sx={{ px: 0 }}>
                        <Box sx={{ mx: -1 }}>
                            <MiniChatCard />
                        </Box>
                    </Grid>
                )}
                
                {/* Lado esquerdo - Layout em coluna com Consulta (acima) e Lista de Pacientes (abaixo) */}
                <Grid item xs={12} sm={12} md={8} lg={8}>
                    <Grid container direction="column" spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
                        {/* Próxima consulta */}
                        <Grid item xs={12} sx={{ px: 0 }}>
                            <Box sx={{ mx: isMobile ? -1 : 0 }}>
                                {isMobile ? (
                                    <MobileConsultationCard
                                        nextConsultation={getNextConsultation()}
                                        consultations={consultations}
                                        loading={loading}
                                        onViewAgenda={handleViewAgenda}
                                        onSelectPatient={handlePatientClick}
                                    />
                                ) : (
                                    <ConsultationCard
                                        nextConsultation={getNextConsultation()}
                                        consultations={consultations}
                                        loading={loading}
                                        onViewAgenda={handleViewAgenda}
                                        onSelectPatient={handlePatientClick}
                                    />
                                )}
                            </Box>
                        </Grid>

                        {/* Lista de pacientes */}
                        <Grid item xs={12} sx={{ px: 0 }}>
                            <Box sx={{ mx: isMobile ? -1 : 0 }}>
                                {isMobile ? (
                                    <MobilePatientsListCard
                                        patients={patients}
                                        loading={loading}
                                        onPatientClick={handlePatientClick}
                                        onAddPatient={() => {
                                            if (window.handleMenuSelect) {
                                                window.handleMenuSelect('Criar novo paciente');
                                            }
                                        }}
                                    />
                                ) : (
                                    <PatientsListCard
                                        patients={patients}
                                        loading={loading}
                                        onPatientClick={handlePatientClick}
                                    />
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Lado direito - MiniChat (desktop e tablet) */}
                {!isMobile && (
                    <Grid item xs={12} sm={12} md={4} lg={4}>
                        <Box sx={{ 
                            position: isTablet ? 'relative' : 'sticky', 
                            top: isTablet ? 0 : 20 
                        }}>
                            <MiniChatCard />
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default Dashboard;
