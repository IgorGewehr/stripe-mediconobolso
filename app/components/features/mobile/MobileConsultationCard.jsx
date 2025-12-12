'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Avatar,
    Button,
    Skeleton,
    useTheme,
    Chip,
    Divider,
    LinearProgress,
    IconButton,
    Fade,
    Slide,
} from '@mui/material';
import {
    VideoCallRounded,
    AccessTimeRounded,
    CalendarTodayRounded,
    PhoneRounded,
    LocationOnRounded,
    MoreVertRounded,
    EventAvailableRounded,
    PersonRounded,
    MedicalServicesRounded,
} from '@mui/icons-material';
import { format, isToday, addDays, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import FirebaseService from '../../../../lib/firebaseService';

const MobileConsultationCard = ({ 
    nextConsultation, 
    consultations, 
    loading, 
    onViewAgenda, 
    onSelectPatient 
}) => {
    const theme = useTheme();
    const [patientData, setPatientData] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [timeUntilConsultation, setTimeUntilConsultation] = useState(null);

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

    // Update time until consultation every minute
    useEffect(() => {
        if (!nextConsultation) return;

        const updateTime = () => {
            const consultationDate = getConsultationDate();
            const now = new Date();
            const minutesUntil = differenceInMinutes(consultationDate, now);
            setTimeUntilConsultation(minutesUntil);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [nextConsultation]);

    const getConsultationDate = () => {
        if (!nextConsultation) return new Date();

        if (nextConsultation.consultationDate instanceof Date) {
            return nextConsultation.consultationDate;
        }

        if (nextConsultation.consultationDate?.toDate) {
            return nextConsultation.consultationDate.toDate();
        }

        return new Date();
    };

    const getTimeUntilText = () => {
        if (!timeUntilConsultation) return '';
        
        if (timeUntilConsultation <= 0) {
            return 'Consulta em andamento';
        } else if (timeUntilConsultation < 60) {
            return `Em ${timeUntilConsultation}min`;
        } else if (timeUntilConsultation < 1440) {
            const hours = Math.floor(timeUntilConsultation / 60);
            return `Em ${hours}h`;
        } else {
            const days = Math.floor(timeUntilConsultation / 1440);
            return `Em ${days}d`;
        }
    };

    const getStatusColor = () => {
        if (!timeUntilConsultation) return theme.palette.info.main;
        
        if (timeUntilConsultation <= 0) {
            return theme.palette.success.main;
        } else if (timeUntilConsultation <= 30) {
            return theme.palette.warning.main;
        } else if (timeUntilConsultation <= 60) {
            return theme.palette.info.main;
        } else {
            return theme.palette.text.secondary;
        }
    };

    const renderLoadingSkeleton = () => (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            }}
        >
            <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="80%" height={24} />
                        <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                </Box>
                <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 2 }} />
            </Box>
        </Card>
    );

    const renderNoConsultation = () => (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            }}
        >
            <Box sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                    }}
                >
                    <CalendarTodayRounded sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Nenhuma consulta agendada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Você não tem consultas marcadas para hoje
                </Typography>
                <Button
                    variant="contained"
                    onClick={onViewAgenda}
                    startIcon={<EventAvailableRounded />}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                    }}
                >
                    Ver Agenda
                </Button>
            </Box>
        </Card>
    );

    if (loading) return renderLoadingSkeleton();
    if (!nextConsultation) return renderNoConsultation();

    const consultationDate = getConsultationDate();
    const isConsultationToday = isToday(consultationDate);
    const timeUntilText = getTimeUntilText();
    const statusColor = getStatusColor();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1852FE 0%, #4285F4 100%)',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Background pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100%',
                        height: '100%',
                        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.3,
                    }}
                />

                <Box sx={{ p: 2, position: 'relative' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                                Próxima consulta
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                {isConsultationToday ? 'Hoje' : format(consultationDate, 'dd/MM/yyyy', { locale: ptBR })}
                            </Typography>
                        </Box>
                        
                        {timeUntilText && (
                            <Chip
                                label={timeUntilText}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                }}
                            />
                        )}
                    </Box>

                    {/* Progress bar for today's consultation */}
                    {isConsultationToday && timeUntilConsultation > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.max(0, Math.min(100, (1440 - timeUntilConsultation) / 1440 * 100))}
                                sx={{
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Patient info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            src={patientData?.patientPhotoUrl}
                            alt={patientData?.patientName || nextConsultation?.nome}
                            sx={{
                                width: 48,
                                height: 48,
                                border: '3px solid rgba(255, 255, 255, 0.3)',
                                mr: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            {(patientData?.patientName || nextConsultation?.nome || "P").charAt(0)}
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    fontWeight: 700, 
                                    fontSize: '1rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {patientData?.patientName || nextConsultation?.nome || "Paciente"}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeRounded sx={{ fontSize: 14, opacity: 0.8 }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                        {nextConsultation?.consultationTime || nextConsultation?.horaInicio || '00:00'}
                                    </Typography>
                                </Box>
                                
                                {nextConsultation?.consultationType === 'Telemedicina' && (
                                    <VideoCallRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                                )}
                            </Box>
                        </Box>

                        <IconButton
                            onClick={() => setShowDetails(!showDetails)}
                            sx={{ color: 'white', opacity: 0.8 }}
                        >
                            <MoreVertRounded />
                        </IconButton>
                    </Box>

                    {/* Quick actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={() => onViewAgenda && onViewAgenda(nextConsultation)}
                            sx={{
                                flex: 1,
                                borderRadius: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                textTransform: 'none',
                                fontWeight: 600,
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                },
                            }}
                        >
                            Ver Consulta
                        </Button>
                        
                        <Button
                            variant="contained"
                            onClick={() => onSelectPatient && onSelectPatient(nextConsultation.patientId)}
                            sx={{
                                flex: 1,
                                borderRadius: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: theme.palette.primary.main,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    backgroundColor: 'white',
                                },
                            }}
                        >
                            Ver Paciente
                        </Button>
                    </Box>

                    {/* Additional details */}
                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MedicalServicesRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            <strong>Motivo:</strong> {nextConsultation?.reasonForVisit || "Consulta de rotina"}
                                        </Typography>
                                    </Box>
                                    
                                    {(patientData?.patientPhone || patientData?.phone) && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                {patientData?.patientPhone || patientData?.phone}
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {nextConsultation?.consultationType !== 'Telemedicina' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOnRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                Consulta presencial
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </Card>
        </motion.div>
    );
};

export default MobileConsultationCard;