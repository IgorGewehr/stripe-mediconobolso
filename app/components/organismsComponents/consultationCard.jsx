"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Button,
    Skeleton,
    IconButton,
    useTheme,
    Chip,
    Grid,
    alpha,
    Tooltip
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
import FirebaseService from '../../../lib/firebaseService';

const ConsultationCard = ({ nextConsultation, consultations, loading, onViewAgenda, onSelectPatient }) => {
    const theme = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [patientData, setPatientData] = useState(null);

    useEffect(() => {
        const loadPatientData = async () => {
            if (!nextConsultation || !nextConsultation.patientId || !nextConsultation.doctorId) return;

            try {
                const patient = await FirebaseService.getPatient(
                    nextConsultation.doctorId,
                    nextConsultation.patientId
                );

                setPatientData(patient);
            } catch (error) {
                console.error("Erro ao carregar dados do paciente:", error);
            }
        };

        loadPatientData();
    }, [nextConsultation]);

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    const handleViewAgenda = () => {
        if (onViewAgenda) {
            onViewAgenda();
        }
    };

    const handleSelectPatient = (patientId) => {
        if (onSelectPatient && patientId) {
            onSelectPatient(patientId);
        }
    };

    // Gerar array do calendário
    const generateCalendarDays = () => {
        const startDate = startOfMonth(currentMonth);
        const endDate = endOfMonth(currentMonth);
        const startDay = getDay(startDate);
        const days = [];

        // Adicionar dias do mês anterior
        for (let i = 0; i < startDay; i++) {
            days.unshift({
                date: subDays(startDate, i + 1),
                isCurrentMonth: false
            });
        }

        // Adicionar dias do mês atual
        let currentDate = startDate;
        while (currentDate <= endDate) {
            days.push({
                date: currentDate,
                isCurrentMonth: true
            });
            currentDate = addDays(currentDate, 1);
        }

        // Adicionar dias do próximo mês
        const daysNeeded = 42 - days.length;
        for (let i = 1; i <= daysNeeded; i++) {
            days.push({
                date: addDays(endDate, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    // Verificar se um dia tem consultas
    const hasConsultationsOnDay = (day) => {
        if (!consultations || consultations.length === 0) return false;

        return consultations.some(consultation => {
            let consultDate;
            if (consultation.consultationDate instanceof Date) {
                consultDate = consultation.consultationDate;
            } else if (consultation.consultationDate && typeof consultation.consultationDate.toDate === 'function') {
                consultDate = consultation.consultationDate.toDate();
            } else if (consultation.data) {
                consultDate = parseISO(consultation.data);
            }

            return consultDate && isValid(consultDate) && isSameDay(consultDate, day);
        });
    };

    // Renderizar quando não há próxima consulta
    const renderNoConsultation = () => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3
            }}
        >
            <Box sx={{ textAlign: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    Sem consultas agendadas
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewAgenda}
                    sx={{ borderRadius: '50px', bgcolor: '#1852FE' }}
                >
                    Ir para Agenda
                </Button>
            </Box>
        </Box>
    );

    // Skeleton para carregamento
    const renderLoadingSkeleton = () => (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Skeleton variant="text" width={150} height={32} />
                <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 20 }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width={180} height={28} />
                    <Skeleton variant="text" width={240} height={20} />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 18 }} />
                <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: 18 }} />
            </Box>
        </Box>
    );

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '20px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                height: 180,
                display: 'flex'
            }}
        >
            {/* Mini calendário - APENAS CALENDÁRIO */}
            <Box sx={{
                flex: '1 1 40%',
                borderRight: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f8f9fa',
                p: 2
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={handlePrevMonth}>
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleNextMonth}>
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Dias da semana */}
                <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                        <Grid item key={index} xs={12/7}>
                            <Typography
                                variant="caption"
                                align="center"
                                sx={{
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    fontSize: '0.6rem'
                                }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                {/* Dias do mês */}
                <Grid container spacing={0.5}>
                    {calendarDays.map((dayInfo, index) => {
                        const isToday_ = isToday(dayInfo.date);
                        const hasEvents = hasConsultationsOnDay(dayInfo.date);

                        return (
                            <Grid item key={index} xs={12/7}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        height: 20,
                                        width: 20,
                                        mx: 'auto',
                                        fontSize: '0.65rem',
                                        fontWeight: isToday_ ? 700 : dayInfo.isCurrentMonth ? 500 : 400,
                                        color: !dayInfo.isCurrentMonth
                                            ? alpha(theme.palette.text.primary, 0.3)
                                            : isToday_
                                                ? '#1852FE'
                                                : theme.palette.text.primary,
                                        borderRadius: '50%',
                                        backgroundColor: isToday_ ? alpha('#1852FE', 0.1) : 'transparent',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: alpha('#1852FE', 0.1)
                                        }
                                    }}
                                >
                                    {dayInfo.date.getDate()}
                                    {hasEvents && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 1,
                                                width: 3,
                                                height: 3,
                                                borderRadius: '50%',
                                                backgroundColor: '#1852FE'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* Seção principal da próxima consulta - MAIS COMPACTA */}
            <Box sx={{
                flex: '1 1 60%',
                bgcolor: '#1852FE',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Elementos decorativos */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        backgroundColor: alpha('#fff', 0.1)
                    }}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        backgroundColor: alpha('#fff', 0.05)
                    }}
                />

                {loading ? (
                    renderLoadingSkeleton()
                ) : !nextConsultation ? (
                    renderNoConsultation()
                ) : (
                    <Box sx={{ p: 2, position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Cabeçalho */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Sua próxima consulta
                            </Typography>

                            <Chip
                                label={nextConsultation.horaInicio ? `Hoje ${nextConsultation.horaInicio}` : nextConsultation.consultationTime ? `Hoje ${nextConsultation.consultationTime}` : "Hoje"}
                                sx={{
                                    borderRadius: '50px',
                                    backgroundColor: alpha('#fff', 0.2),
                                    color: 'white',
                                    height: 24,
                                    '& .MuiChip-label': {
                                        px: 1.5,
                                        py: 0,
                                        fontWeight: 500,
                                        fontSize: '0.7rem'
                                    }
                                }}
                            />
                        </Box>

                        {/* Detalhes do paciente */}
                        <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar
                                    src={patientData?.photoURL}
                                    alt={patientData?.patientName || nextConsultation.nome || "Paciente"}
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        bgcolor: alpha('#fff', 0.2),
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        mr: 1.5
                                    }}
                                >
                                    {(patientData?.patientName || nextConsultation.nome || "P").charAt(0)}
                                </Avatar>

                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {patientData?.patientName || nextConsultation.nome || "Paciente"}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.8 }} />
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                {isToday(new Date(nextConsultation.consultationDate instanceof Date ?
                                                    nextConsultation.consultationDate :
                                                    nextConsultation.consultationDate.toDate ?
                                                        nextConsultation.consultationDate.toDate() :
                                                        new Date())) ?
                                                    'Hoje' :
                                                    format(new Date(nextConsultation.consultationDate instanceof Date ?
                                                        nextConsultation.consultationDate :
                                                        nextConsultation.consultationDate.toDate ?
                                                            nextConsultation.consultationDate.toDate() :
                                                            new Date()), 'dd/MM', { locale: ptBR })}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, opacity: 0.8 }} />
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                {nextConsultation.consultationTime || nextConsultation.horaInicio || '00:00'}
                                            </Typography>
                                        </Box>

                                        {nextConsultation.consultationType === 'Telemedicina' && (
                                            <VideoCallIcon sx={{ fontSize: 16 }} />
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Motivo da consulta */}
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
                                <b>Motivo:</b> {nextConsultation.reasonForVisit || patientData?.reasonForVisit || "Consulta de rotina"}
                            </Typography>

                            {/* Telefone */}
                            {(patientData?.patientPhone || patientData?.phone) && (
                                <Typography variant="caption" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center' }}>
                                    <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                    {patientData?.patientPhone || patientData?.phone}
                                </Typography>
                            )}
                        </Box>

                        {/* Botão de Ver Perfil */}
                        <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                borderRadius: '50px',
                                bgcolor: 'white',
                                color: '#1852FE',
                                ml: 'auto',
                                mt: 'auto',
                                '&:hover': {
                                    bgcolor: alpha('#fff', 0.9)
                                }
                            }}
                            onClick={() => handleSelectPatient(nextConsultation.patientId)}
                        >
                            Ver Perfil
                        </Button>
                    </Box>
                )}
            </Box>
        </Card>
    );
};

export default ConsultationCard;
