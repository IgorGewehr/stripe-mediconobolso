"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    useTheme,
    useMediaQuery
} from '@mui/material';
import MetricsCard from "./organismsComponents/metricsCard";
import ConsultationCard from "./organismsComponents/consultationCard";
import PatientsListCard from "./organismsComponents/patientsList";
import { useAuth } from "./authProvider";
import FirebaseService from "../../lib/firebaseService";
import { format, addDays, subDays, startOfDay, isAfter } from 'date-fns';

const Dashboard = ({ onClickPatients }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();

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
                const consultationsData = await FirebaseService.listAllConsultations(user.uid);
                setConsultations(consultationsData);

                // Carregar pacientes
                const patientsData = await FirebaseService.getPatientsByDoctor(user.uid);
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

        // Filtra as consultas futuras e as ordena por data
        const futureConsultations = consultations
            .filter(consultation => {
                const consultDate = consultation.consultationDate instanceof Date
                    ? consultation.consultationDate
                    : consultation.consultationDate && typeof consultation.consultationDate.toDate === 'function'
                        ? consultation.consultationDate.toDate()
                        : new Date();

                // Considerar a hora da consulta também
                if (consultation.consultationTime) {
                    const [hour, minute] = consultation.consultationTime.split(':').map(Number);
                    consultDate.setHours(hour, minute, 0, 0);
                }

                return consultDate >= now;
            })
            .sort((a, b) => {
                const dateA = a.consultationDate instanceof Date
                    ? a.consultationDate
                    : a.consultationDate && typeof a.consultationDate.toDate === 'function'
                        ? a.consultationDate.toDate()
                        : new Date();

                const dateB = b.consultationDate instanceof Date
                    ? b.consultationDate
                    : b.consultationDate && typeof b.consultationDate.toDate === 'function'
                        ? b.consultationDate.toDate()
                        : new Date();

                // Considerar a hora da consulta também
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

    const handleViewAgenda = () => {
        // Chamamos o handler do menu de navegação do componente pai
        if (window.handleMenuSelect) {
            window.handleMenuSelect("Agenda");
        }
    };

    return (
        <Box sx={{ width: '100%', pt: 2, pb: 4 }}>
            <Grid container spacing={3}>
                {/* Lado esquerdo - Layout em coluna com Consulta (acima) e Lista de Pacientes (abaixo) */}
                <Grid item xs={12} md={8}>
                    <Grid container direction="column" spacing={3}>
                        {/* Próxima consulta */}
                        <Grid item xs={12}>
                            <ConsultationCard
                                nextConsultation={getNextConsultation()}
                                consultations={consultations}
                                loading={loading}
                                onViewAgenda={handleViewAgenda}
                                onSelectPatient={handlePatientClick}
                            />
                        </Grid>

                        {/* Lista de pacientes */}
                        <Grid item xs={12}>
                            <PatientsListCard
                                patients={patients}
                                loading={loading}
                                onPatientClick={handlePatientClick}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Lado direito - Métricas */}
                <Grid item xs={12} md={4}>
                    <MetricsCard
                        metrics={metrics}
                        loading={loading}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
