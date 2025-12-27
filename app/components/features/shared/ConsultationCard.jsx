"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Avatar,
    Button,
    Skeleton,
    IconButton,
    useTheme,
    useMediaQuery,
    Chip,
    Grid
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    VideoCall as VideoCallIcon,
    AccessTime as AccessTimeIcon,
    CalendarToday as CalendarTodayIcon,
    ArrowForward as ArrowForwardIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
import { format, addMonths, parseISO, isValid, isSameDay, isToday, getDay, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { patientsService } from '@/lib/services/api';
import WeatherContainer from "./WeatherContainer";

const ConsultationCard = ({ nextConsultation, consultations, loading, onViewAgenda, onSelectPatient }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [patientData, setPatientData] = useState(null);

    useEffect(() => {
        const loadPatientData = async () => {
            if (!nextConsultation || !nextConsultation.patientId || !nextConsultation.doctorId) return;
            try {
                const patient = await patientsService.getById(nextConsultation.patientId);
                setPatientData(patient);
            } catch (error) {
                console.error("Erro ao carregar dados do paciente:", error);
            }
        };
        loadPatientData();
    }, [nextConsultation]);

    const handlePrevMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleViewAgenda = () => onViewAgenda && onViewAgenda();

    const generateCalendarDays = () => {
        const startDate = startOfMonth(currentMonth);
        const endDate = endOfMonth(currentMonth);
        const startDay = getDay(startDate);
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.unshift({ date: subDays(startDate, i + 1), isCurrentMonth: false });
        }

        let currentDate = startDate;
        while (currentDate <= endDate) {
            days.push({ date: currentDate, isCurrentMonth: true });
            currentDate = addDays(currentDate, 1);
        }

        const daysNeeded = 42 - days.length;
        for (let i = 1; i <= daysNeeded; i++) {
            days.push({ date: addDays(endDate, i), isCurrentMonth: false });
        }
        return days;
    };

    const calendarDays = generateCalendarDays();
    const trimmedCalendarDays = calendarDays.slice(0, 35);

    const hasConsultationsOnDay = (day) => {
        if (!consultations || consultations.length === 0) return false;
        return consultations.some(consultation => {
            let consultDate;
            if (consultation.consultationDate instanceof Date) {
                consultDate = consultation.consultationDate;
            } else if (consultation.consultationDate != null && typeof consultation.consultationDate.toDate === 'function') {
                consultDate = consultation.consultationDate.toDate();
            } else if (consultation.data) {
                consultDate = parseISO(consultation.data);
            }
            return consultDate && isValid(consultDate) && isSameDay(consultDate, day);
        });
    };

    const getPatientHealthPlan = () => {
        if (!patientData) return null;
        if (patientData.healthPlans && patientData.healthPlans.length > 0) {
            const plan = patientData.healthPlans[0];
            return { name: plan.name || "Plano de Saude", type: plan.type || "", number: plan.number || "" };
        }
        if (patientData.healthPlan && patientData.healthPlan.name) {
            return { name: patientData.healthPlan.name, type: patientData.healthPlan.type || "", number: patientData.healthPlan.number || "" };
        }
        return null;
    };

    const getConsultationDate = () => {
        if (!nextConsultation) return new Date();
        if (nextConsultation.consultationDate instanceof Date) return nextConsultation.consultationDate;
        if (nextConsultation.consultationDate != null && typeof nextConsultation.consultationDate.toDate === 'function') {
            return nextConsultation.consultationDate.toDate();
        }
        if (nextConsultation.data) {
            const parsed = parseISO(nextConsultation.data);
            if (isValid(parsed)) return parsed;
        }
        return new Date();
    };

    const renderNoConsultation = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1.5 }} />
                <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 500, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                    Sem consultas agendadas
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleViewAgenda}
                    sx={{
                        borderRadius: '9999px',
                        backgroundColor: '#FFFFFF',
                        color: '#2563EB',
                        fontSize: '13px',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontFamily: "'Inter', sans-serif",
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    Ir para Agenda
                </Button>
            </Box>
        </Box>
    );

    const healthPlan = getPatientHealthPlan();
    const consultationDate = getConsultationDate();

    return (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Weather Widget */}
            {!isMobile && (
                <Box sx={{ width: '25%', height: 180 }}>
                    <WeatherContainer />
                </Box>
            )}

            {/* Card de Proxima Consulta - Design moderno com gradiente */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    height: isMobile ? 'auto' : 180,
                    minHeight: isMobile ? 160 : 180,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: isMobile ? '100%' : '75%',
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(37, 99, 235, 0.15)',
                }}
            >
                {/* Calendario - Lado Esquerdo */}
                {!isMobile && (
                    <Box sx={{
                        flex: '1 1 35%',
                        borderRight: '1px solid rgba(226, 232, 240, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: '#F8FAFC',
                        p: 2,
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{
                                fontWeight: 600,
                                fontSize: '14px',
                                color: '#0F172A',
                                fontFamily: "'Inter', sans-serif",
                                textTransform: 'capitalize'
                            }}>
                                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" onClick={handlePrevMonth} sx={{ p: 0.5, '&:hover': { bgcolor: '#E2E8F0' } }}>
                                    <ChevronLeftIcon sx={{ fontSize: 18, color: '#64748B' }} />
                                </IconButton>
                                <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5, '&:hover': { bgcolor: '#E2E8F0' } }}>
                                    <ChevronRightIcon sx={{ fontSize: 18, color: '#64748B' }} />
                                </IconButton>
                            </Box>
                        </Box>
                        <Grid container spacing={0.25} sx={{ mb: 0.5 }}>
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                                <Grid item key={index} xs={12/7}>
                                    <Typography sx={{
                                        textAlign: 'center',
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                        fontSize: '10px',
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        {day}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                        <Grid container spacing={0.25}>
                            {trimmedCalendarDays.map((dayInfo, index) => {
                                const isToday_ = isToday(dayInfo.date);
                                const hasEvents = hasConsultationsOnDay(dayInfo.date);
                                return (
                                    <Grid item key={index} xs={12/7}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            height: 20,
                                            width: 20,
                                            mx: 'auto',
                                            fontSize: '11px',
                                            fontWeight: isToday_ ? 700 : dayInfo.isCurrentMonth ? 500 : 400,
                                            color: !dayInfo.isCurrentMonth
                                                ? '#CBD5E1'
                                                : isToday_
                                                    ? '#FFFFFF'
                                                    : '#334155',
                                            borderRadius: '50%',
                                            backgroundColor: isToday_ ? '#2563EB' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontFamily: "'Inter', sans-serif",
                                            '&:hover': { backgroundColor: isToday_ ? '#2563EB' : '#E2E8F0' }
                                        }}>
                                            {dayInfo.date.getDate()}
                                            {hasEvents && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: 1,
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: '50%',
                                                    backgroundColor: isToday_ ? '#FFFFFF' : '#2563EB'
                                                }} />
                                            )}
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

                {/* Area da Proxima Consulta - Lado Direito com gradiente */}
                <Box sx={{
                    flex: isMobile ? '1' : '1 1 65%',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    p: isMobile ? 2.5 : 2.5,
                }}>
                    {/* Elementos decorativos de fundo */}
                    <Box sx={{
                        position: 'absolute',
                        top: -60,
                        right: -60,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        filter: 'blur(40px)',
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        bottom: -40,
                        left: -40,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.2)',
                        filter: 'blur(30px)',
                    }} />

                    {loading ? (
                        <Box sx={{ p: 2 }}>
                            <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                            <Skeleton variant="circular" width={48} height={48} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                            <Skeleton variant="text" width={160} height={20} sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                        </Box>
                    ) : !nextConsultation ? (
                        renderNoConsultation()
                    ) : (
                        <>
                            {/* Header com titulo e badge */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
                                <Typography sx={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    opacity: 0.9,
                                    fontFamily: "'Inter', sans-serif"
                                }}>
                                    Proxima consulta
                                </Typography>
                                <Chip
                                    label={isToday(consultationDate) ? `Hoje, ${nextConsultation?.consultationTime || '00:00'}` : format(consultationDate, 'dd/MM, HH:mm', { locale: ptBR })}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#FFFFFF',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        height: '28px',
                                        backdropFilter: 'blur(4px)',
                                        border: 'none',
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                />
                            </Box>

                            {/* Info do Paciente */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                                <Avatar
                                    src={patientData?.patientPhotoUrl}
                                    alt={patientData?.patientName || nextConsultation?.nome || "Paciente"}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        fontSize: '20px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {(patientData?.patientName || nextConsultation?.nome || "P").charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                    <Typography sx={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontFamily: "'Inter', sans-serif",
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {patientData?.patientName || nextConsultation?.nome || "Paciente"}
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '13px',
                                        opacity: 0.85,
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        {nextConsultation?.reasonForVisit || "Consulta de Rotina"}
                                        {nextConsultation?.consultationType === 'Telemedicina' && (
                                            <VideoCallIcon sx={{ ml: 1, fontSize: 16, verticalAlign: 'middle' }} />
                                        )}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Acoes */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', position: 'relative', zIndex: 1 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => onViewAgenda && onViewAgenda(nextConsultation)}
                                    sx={{
                                        borderRadius: '9999px',
                                        bgcolor: 'white',
                                        color: '#2563EB',
                                        fontSize: '13px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 2.5,
                                        py: 1,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        fontFamily: "'Inter', sans-serif",
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.95)',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                                            transform: 'translateY(-1px)'
                                        }
                                    }}
                                >
                                    Ver Detalhes
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Card>
        </Box>
    );
};

export default ConsultationCard;
