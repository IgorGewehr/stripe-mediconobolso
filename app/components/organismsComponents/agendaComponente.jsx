"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Popover,
    Chip,
    Snackbar,
    Alert,
    CircularProgress,
    Avatar,
    Paper,
    Tooltip,
    useTheme,
    useMediaQuery,
    alpha,
    Drawer,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    CalendarToday,
    AccessTime,
    Add,
    Today,
    ViewDay,
    ViewWeek,
    ViewModule,
    Menu as MenuIcon,
    VideoCall,
    ArrowForward
} from '@mui/icons-material';
import FirebaseService from '../../../lib/firebaseService';
import { useAuth } from '../authProvider';
import EventoModal from './eventoModal';
import moment from 'moment-timezone';
import {
    format,
    isToday,
    isSameDay,
    parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PeriodSelector from "../basicComponents/periodSelector";
import ViewConsultationDialog from "./viewConsultationDialog";

// Main component
const AgendaMedica = ({initialConsultationId}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();

    // States
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState('week');
    const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEventoModal, setShowEventoModal] = useState(false);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
    // Sidebar começa fechado
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showConsultationDialog, setShowConsultationDialog] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState(null);


    // Constants
    const currentHour = new Date().getHours();
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const timeSlots = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => i); // 0h a 23h
    }, []);

    // Funções para manipulação de datas
    // Função simplificada para garantir formato de data consistente para o Firebase
    const formatDateForFirebase = (date) => {
        // Se já for string no formato "YYYY-MM-DD", retorne-a sem alteração
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (initialConsultationId && eventos.length > 0) {
            const consultation = eventos.find(ev => ev.id === initialConsultationId);
            if (consultation) {
                setSelectedConsultation(consultation);
                setShowConsultationDialog(true);
            }
        }
    }, [initialConsultationId, eventos]);

    // Função para converter qualquer valor de data para objeto Date
    const parseAnyDate = (dateValue) => {
        if (dateValue == null) return null;

        if (dateValue instanceof Date) return dateValue;
        if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
        }
        if (typeof dateValue === 'string') {
            const parts = dateValue.split('-');
            if (parts.length === 3) {
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    };

    const handleViewAgendaFromConsultation = (consultation) => {
        setSelectedConsultation(consultation);
        setShowConsultationDialog(true);
    };

    // Função para criar objeto de evento padronizado
    const createEventObject = (consultation, patientName) => {
        // Obter a data da consulta como objeto Date
        const consultationDate = parseAnyDate(consultation.consultationDate);

        // Usar a data consultationDate diretamente e preservar o dia
        const formattedDate = formatDateForFirebase(consultationDate);

// Processar horário e duração
        const startTime = consultation.consultationTime || "00:00";
        const [hour, minute] = startTime.split(':').map(Number);
        const duration = consultation.consultationDuration || 30;

// Criar um novo objeto Date para o início e fim
        const startDate = new Date(consultationDate);
        startDate.setHours(hour, minute, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + duration);

// Criar momentos consistentes usando as datas criadas
        const startMoment = moment(startDate);
        const endMoment = moment(endDate);

        // Formatar horas de início/fim
        const horaInicio = startMoment.format('HH:mm');
        const horaFim = endMoment.format('HH:mm');

        // Definir status
        let status = "A Confirmar";
        switch (consultation.status) {
            case "Confirmado":
            case "Concluída":
                status = "Confirmado";
                break;
            case "Cancelada":
                status = "Cancelado";
                break;
            case "Em Andamento":
                status = "Em Andamento";
                break;
        }

        return {
            id: consultation.id,
            nome: patientName,
            data: formattedDate,
            horaInicio,
            horaFim,
            status,
            patientId: consultation.patientId,
            doctorId: consultation.doctorId,
            consultationDuration: duration,
            consultationType: consultation.consultationType,
            reasonForVisit: consultation.reasonForVisit,
            consultationDate: consultationDate,
            startDateTime: startMoment.toDate(),
            endDateTime: endMoment.toDate()
        };
    };

    // Memoized month days
    const daysInMonth = useMemo(() => {
        return getMonthDays(currentDate);
    }, [currentDate]);

    // Formatted month name
    const currentMonthName = useMemo(() => {
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }, [currentDate]);

    // Load events from Firebase
    useEffect(() => {
        const loadConsultations = async () => {
            if (!user?.uid) return;

            setIsLoading(true);
            try {
                const doctorId = user.uid;
                const consultationsData = await FirebaseService.listAllConsultations(doctorId);

                // Get patient information
                const patientIds = [...new Set(consultationsData.map(c => c.patientId))];
                const patientsPromises = patientIds.map(pid =>
                    FirebaseService.getPatient(doctorId, pid)
                );
                const patientsResults = await Promise.all(patientsPromises);
                const patientsMap = {};
                patientsResults.forEach(patient => {
                    if (patient && patient.id) {
                        patientsMap[patient.id] = patient;
                    }
                });

                // Process consultations into events
                const processedEvents = consultationsData.map(consultation => {
                    const patient = patientsMap[consultation.patientId];
                    const patientName = patient ? (patient.patientName || patient.nome) : "Paciente";
                    return createEventObject(consultation, patientName);
                });

                setEventos(processedEvents);
            } catch (error) {
                console.error("Error loading consultations:", error);
                setNotification({
                    open: true,
                    message: "Erro ao carregar agenda. Tente novamente.",
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadConsultations();
    }, [user]);

    // Functions to manage consultations
    const createConsultation = async (consultationData) => {
        try {
            setIsLoading(true);

            if (!user?.uid) {
                setNotification({
                    open: true,
                    message: "Erro de autenticação. Faça login novamente.",
                    type: 'error'
                });
                return;
            }

            const doctorId = user.uid;
            const patientId = consultationData.patientId;

            // Garantir que a data está formatada corretamente antes de salvar
            const dataToSave = {
                ...consultationData,
                consultationDate: formatDateForFirebase(consultationData.consultationDate)
            };

            // Create consultation in Firebase
            const consultationId = await FirebaseService.createConsultation(
                doctorId,
                patientId,
                dataToSave
            );

            // Get patient name
            const patient = await FirebaseService.getPatient(doctorId, patientId);

            // Crie o objeto de evento usando nossa função
            const newEvent = createEventObject(
                { ...dataToSave, id: consultationId },
                patient ? (patient.patientName || patient.nome) : "Paciente"
            );

            // Atualize o estado
            setEventos(prev => {
                const updated = [...prev, newEvent];
                setTimeout(() => {
                    if (activeView !== 'month') {
                        setSelectedDate(newEvent.consultationDate);
                        setCurrentDate(newEvent.consultationDate);
                    }
                }, 0);
                return updated;
            });

            setNotification({
                open: true,
                message: "Consulta agendada com sucesso!",
                type: 'success'
            });
        } catch (error) {
            console.error("Error creating consultation:", error);
            setNotification({
                open: true,
                message: "Erro ao agendar consulta. Tente novamente.",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateConsultation = async (consultationData) => {
        try {
            setIsLoading(true);

            if (!user?.uid || !consultationData.id || !consultationData.patientId) {
                setNotification({
                    open: true,
                    message: "Dados incompletos para atualização.",
                    type: 'error'
                });
                return;
            }

            const doctorId = user.uid;
            const patientId = consultationData.patientId;
            const consultationId = consultationData.id;

            // Garantir que a data está formatada corretamente antes de salvar
            const dataToSave = {
                ...consultationData,
                consultationDate: formatDateForFirebase(consultationData.consultationDate)
            };

            // Update in Firebase
            await FirebaseService.updateConsultation(
                doctorId,
                patientId,
                consultationId,
                dataToSave
            );

            // Crie o objeto de evento atualizado
            const patient = await FirebaseService.getPatient(doctorId, patientId);
            const updatedEvent = createEventObject(
                dataToSave,
                patient ? (patient.patientName || patient.nome) : "Paciente"
            );


            // Atualize o estado
            setEventos(prev => {
                const updated = prev.map(ev =>
                    ev.id === consultationId ? updatedEvent : ev
                );

                setTimeout(() => {
                    if (activeView !== 'month') {
                        setSelectedDate(updatedEvent.consultationDate);
                        setCurrentDate(updatedEvent.consultationDate);
                    }
                }, 0);

                return updated;
            });

            setNotification({
                open: true,
                message: "Consulta atualizada com sucesso!",
                type: 'success'
            });
        } catch (error) {
            console.error("Error updating consultation:", error);
            setNotification({
                open: true,
                message: "Erro ao atualizar consulta. Tente novamente.",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Close notification
    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    // Date and calendar helper functions
    function getWeekDays(date) {
        const firstDay = new Date(date);
        const day = firstDay.getDay();
        firstDay.setDate(firstDay.getDate() - day);

        return Array(7).fill().map((_, i) => {
            const day = new Date(firstDay);
            day.setDate(firstDay.getDate() + i);
            return day;
        });
    }

    const handleChangeStatus = async (consultationId, newStatus) => {
        try {
            setIsLoading(true);

            if (!user?.uid || !consultationId) {
                setNotification({
                    open: true,
                    message: "Dados incompletos para atualização de status.",
                    type: 'error'
                });
                return;
            }

            const doctorId = user.uid;

            // Encontrar a consulta no estado atual
            const consultationToUpdate = eventos.find(e => e.id === consultationId);

            if (!consultationToUpdate) {
                setNotification({
                    open: true,
                    message: "Consulta não encontrada.",
                    type: 'error'
                });
                return;
            }

            const patientId = consultationToUpdate.patientId;

            // MODIFICAÇÃO AQUI: Preservar a data original formatada corretamente
            const updateData = {
                status: newStatus,
                // Incluir a data original da consulta para preservá-la
                consultationDate: formatDateForFirebase(consultationToUpdate.consultationDate || consultationToUpdate.data),
                // Garantir que o campo 'data' também seja preservado (usado em algumas partes do código)
                data: formatDateForFirebase(consultationToUpdate.consultationDate || consultationToUpdate.data)
            };

            // Atualizar no Firebase com a data preservada
            await FirebaseService.updateConsultation(
                doctorId,
                patientId,
                consultationId,
                updateData  // Enviar status E data
            );

            // Atualizar o estado local (sem modificação necessária aqui)
            setEventos(prev => {
                return prev.map(ev => {
                    if (ev.id === consultationId) {
                        return {
                            ...ev,
                            status: newStatus
                        };
                    }
                    return ev;
                });
            });

            // Fechar o diálogo de visualização
            setShowConsultationDialog(false);

            setNotification({
                open: true,
                message: `Status da consulta atualizado para "${newStatus}"`,
                type: 'success'
            });
        } catch (error) {
            console.error("Erro ao atualizar status da consulta:", error);
            setNotification({
                open: true,
                message: "Erro ao atualizar status. Tente novamente.",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    function getMonthDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // First day of month
        const firstDay = new Date(year, month, 1);
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);

        const daysBeforeMonth = firstDay.getDay();
        const daysAfterMonth = 6 - lastDay.getDay();

        // Days from previous month
        const result = [];
        for (let i = daysBeforeMonth - 1; i >= 0; i--) {
            const day = new Date(year, month, -i);
            result.push(day);
        }

        // Days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const day = new Date(year, month, i);
            result.push(day);
        }

        // Days of next month
        for (let i = 1; i <= daysAfterMonth; i++) {
            const day = new Date(year, month + 1, i);
            result.push(day);
        }

        return result;
    }

    function formatDate(date) {
        // Usar o mesmo método consistente em todo lugar
        return formatDateForFirebase(date);
    }

    // Calendar navigation
    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    }, []);

    const goToPrevious = useCallback(() => {
        const newDate = new Date(currentDate);

        if (activeView === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else if (activeView === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (activeView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        }

        setCurrentDate(newDate);
        setSelectedDate(newDate);
    }, [currentDate, activeView]);

    const goToNext = useCallback(() => {
        const newDate = new Date(currentDate);

        if (activeView === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (activeView === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (activeView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        }

        setCurrentDate(newDate);
        setSelectedDate(newDate);
    }, [currentDate, activeView]);

    // Find events for a specific date/hour - Improved for all views
    const findEvents = useCallback((day, hour = null) => {
        // Formatar data consistentemente
        const dayString = formatDateForFirebase(day);

        // Encontra eventos do dia comparando apenas as strings de data
        const dayEvents = eventos.filter(event => event.data === dayString);

        // Se não precisa filtrar por hora
        if (hour === null) {
            return dayEvents;
        }

        // Filtra por hora
        return dayEvents.filter(event => {
            const eventHour = parseInt(event.horaInicio.split(':')[0]);
            return eventHour === hour;
        });
    }, [eventos]);

    // Event handlers
    const changeView = useCallback((newView) => {
        setActiveView(newView);
    }, []);

    const selectDay = useCallback((day) => {
        setSelectedDate(day);
        if (activeView === 'month') {
            setActiveView('day');
        }
    }, [activeView]);

    const handleEventClick = useCallback((event) => {
        setSelectedConsultation(event);
        setShowConsultationDialog(true);
    }, []);

    const handleCreateEvent = useCallback(() => {
        setEventoSelecionado(null);
        setShowEventoModal(true);
    }, []);

    const handleSaveEvent = useCallback((event) => {
        // Clone o evento para evitar modificar o original
        const eventToSave = { ...event };

        if (event.id) {
            updateConsultation(eventToSave);
        } else {
            createConsultation(eventToSave);
        }
    }, []);

    const handleEditFromDialog = (consultation) => {
        setShowConsultationDialog(false);
        setEventoSelecionado(consultation);
        setShowEventoModal(true);
    };

    // Mini calendar
    const handleCalendarOpen = (event) => {
        setCalendarAnchorEl(event.currentTarget);
    };

    const handleDeleteFromDialog = (consultationId) => {
        // lógica de exclusão existente
        setShowConsultationDialog(false);
    };

    const handleCalendarClose = () => {
        setCalendarAnchorEl(null);
    };

    const isCalendarOpen = Boolean(calendarAnchorEl);

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    // Components

    // Status color utilities
    const getStatusColors = (status) => {
        switch(status?.toLowerCase()) {
            case 'confirmado':
            case 'concluída':
                return {
                    bg: '#E8F5E9',
                    color: '#388E3C',
                    border: '#4CAF50'
                };
            case 'cancelado':
            case 'cancelada':
                return {
                    bg: '#FFEBEE',
                    color: '#D32F2F',
                    border: '#F44336'
                };
            case 'em andamento':
                return {
                    bg: '#FFF8E1',
                    color: '#F57C00',
                    border: '#FFA000'
                };
            default:
                return {
                    bg: '#E3F2FD',
                    color: '#1976D2',
                    border: '#2196F3'
                };
        }
    };

    // Event Card - Melhorado design conforme exemplo
    const EventCard = ({ event, isCompact, onClick }) => {
        const { nome, horaInicio, horaFim, status, consultationType } = event;
        const colors = getStatusColors(status);

        return (
            <Box
                onClick={() => onClick(event)}
                sx={{
                    bgcolor: colors.bg,
                    borderLeft: `4px solid ${colors.border}`,
                    borderRadius: '8px',
                    p: isCompact ? 0.75 : 1.5,
                    mb: 1,
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 0.5, fontSize: '0.875rem' }} />
                        <Typography variant="caption" fontWeight={600}>
                            {horaInicio} - {horaFim}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {consultationType === 'Telemedicina' && (
                            <VideoCall fontSize="small" sx={{ color: colors.color }} />
                        )}
                        <Chip
                            label={status}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: colors.bg,
                                color: colors.color,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '10px'
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: `${colors.color}20`,
                            color: colors.color
                        }}
                    >
                        {nome.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500} noWrap>
                        {nome}
                    </Typography>
                </Box>
            </Box>
        );
    };

    // Day Cell for month view
    const DayCell = ({ day, events, viewType, isSelected, onClick }) => {
        const dayEvents = findEvents(day);
        const isTodayFlag = isToday(day);
        const isOutsideMonth = day.getMonth() !== currentDate.getMonth();
        const weekday = weekdays[day.getDay()];

        // Month view cell
        if (viewType === 'month') {
            return (
                <Paper
                    elevation={0}
                    sx={{
                        height: '100%',
                        borderRadius: '8px',
                        border: `1px solid ${isOutsideMonth ? 'transparent' : '#EAECEF'}`,
                        bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.05)
                            : isTodayFlag
                                ? alpha(theme.palette.primary.main, 0.02)
                                : 'white',
                        opacity: isOutsideMonth ? 0.5 : 1,
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                        },
                    }}
                    onClick={() => onClick(day)}
                >
                    <Box
                        sx={{
                            p: 0.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid',
                            borderColor: isTodayFlag ? theme.palette.primary.main : '#EAECEF',
                            bgcolor: isTodayFlag ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {weekday}
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={isTodayFlag ? 700 : 500}
                            color={isTodayFlag ? 'primary.main' : 'text.primary'}
                        >
                            {day.getDate()}
                        </Typography>
                    </Box>

                    <Box sx={{ p: 0.5, maxHeight: '100px', overflow: 'auto' }}>
                        {dayEvents.length > 0 ? (
                            dayEvents.slice(0, 3).map((event, idx) => {
                                const colors = getStatusColors(event.status);
                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 0.5,
                                            mb: 0.5,
                                            borderRadius: '4px',
                                            bgcolor: colors.bg,
                                            fontSize: '0.7rem',
                                            gap: 0.5,
                                            '&:hover': {
                                                bgcolor: `${colors.bg}CC`
                                            }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: colors.border,
                                                flexShrink: 0
                                            }}
                                        />
                                        <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                                            {event.horaInicio} {event.nome}
                                        </Typography>
                                    </Box>
                                );
                            })
                        ) : null}

                        {dayEvents.length > 3 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    color: 'primary.main',
                                    fontWeight: 500,
                                    fontSize: '0.7rem'
                                }}
                            >
                                +{dayEvents.length - 3} mais
                            </Typography>
                        )}
                    </Box>
                </Paper>
            );
        }

        // Week header cell
        return (
            <Box
                sx={{
                    textAlign: 'center',
                    p: 1,
                    borderRight: '1px solid #EAECEF',
                    borderBottom: `2px solid ${isTodayFlag ? theme.palette.primary.main : 'transparent'}`,
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={() => onClick(day)}
            >
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 500 }}
                >
                    {weekday}
                </Typography>
                <Typography
                    variant="h6"
                    fontWeight={isTodayFlag ? 700 : 500}
                    color={isTodayFlag ? 'primary.main' : 'text.primary'}
                >
                    {day.getDate()}
                </Typography>
            </Box>
        );
    };

    // Mini Calendar - Reposicionado com melhor design
    const MiniCalendar = () => {
        return (
            <Box sx={{ width: 300, p: 2 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    position: 'relative' // Para posicionamento absoluto dos botões
                }}>
                    <IconButton
                        size="small"
                        onClick={() => {
                            const newDate = new Date(miniCalendarDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setMiniCalendarDate(newDate);
                        }}
                        sx={{
                            zIndex: 2 // Para ficar acima do texto do mês
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>

                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            textAlign: 'center'
                        }}
                    >
                        {format(miniCalendarDate, "MMMM yyyy", { locale: ptBR })}
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={() => {
                            const newDate = new Date(miniCalendarDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setMiniCalendarDate(newDate);
                        }}
                        sx={{
                            zIndex: 2 // Para ficar acima do texto do mês
                        }}
                    >
                        <ChevronRight />
                    </IconButton>
                </Box>

                {/* Weekday headers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
                    {weekdays.map((day, idx) => (
                        <Box key={idx} sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {day.charAt(0)}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Calendar grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                    {getMonthDays(miniCalendarDate).map((day, idx) => {
                        const isTodayFlag = isToday(day);
                        const isSelectedFlag = isSameDay(selectedDate, day);
                        const isOutsideMonth = day.getMonth() !== miniCalendarDate.getMonth();
                        const hasEvents = findEvents(day).length > 0;

                        return (
                            <Box
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(day);
                                    setCurrentDate(day);
                                    handleCalendarClose();
                                }}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    bgcolor: isSelectedFlag
                                        ? 'primary.main'
                                        : isTodayFlag
                                            ? alpha(theme.palette.primary.main, 0.1)
                                            : 'transparent',
                                    color: isSelectedFlag
                                        ? 'white'
                                        : isOutsideMonth
                                            ? 'text.disabled'
                                            : isTodayFlag
                                                ? 'primary.main'
                                                : 'text.primary',
                                    fontWeight: isTodayFlag || isSelectedFlag ? 600 : 400,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: isSelectedFlag
                                            ? 'primary.dark'
                                            : alpha(theme.palette.primary.main, 0.2)
                                    }
                                }}
                            >
                                {day.getDate()}
                                {hasEvents && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 3,
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            bgcolor: isSelectedFlag ? 'white' : 'primary.main'
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            goToToday();
                            handleCalendarClose();
                        }}
                        sx={{
                            borderRadius: '50px',
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Ir para hoje
                    </Button>
                </Box>
            </Box>
        );
    };

    // Upcoming Events component
    const UpcomingEvents = () => {
        // Get today's and upcoming events
        const today = new Date();
        const todayString = formatDate(today);

        const upcomingEvents = eventos
            .filter(event => {
                return event.data >= todayString;
            })
            .sort((a, b) => {
                const dateA = new Date(a.data + 'T' + a.horaInicio);
                const dateB = new Date(b.data + 'T' + b.horaInicio);
                return dateA - dateB;
            })
            .slice(0, 5);

        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Próximas Consultas
                </Typography>

                {upcomingEvents.length === 0 ? (
                    <Box sx={{
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        color: 'text.secondary'
                    }}>
                        <CalendarToday sx={{ fontSize: 40, color: alpha('#000', 0.1) }} />
                        <Typography variant="body2">
                            Sem consultas agendadas
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<Add />}
                            onClick={handleCreateEvent}
                            sx={{ mt: 1, borderRadius: '50px', textTransform: 'none' }}
                        >
                            Nova Consulta
                        </Button>
                    </Box>
                ) : (
                    <>
                        {upcomingEvents.map((event) => {
                            const eventDate = new Date(event.data);
                            const isEventToday = isSameDay(eventDate, today);
                            const colors = getStatusColors(event.status);

                            return (
                                <Box
                                    key={event.id}
                                    sx={{
                                        mb: 2,
                                        p: 1.5,
                                        borderRadius: '10px',
                                        border: '1px solid #EAECEF',
                                        bgcolor: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                    onClick={() => handleEventClick(event)}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 38,
                                                    height: 38,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '8px',
                                                    bgcolor: isEventToday ? alpha(theme.palette.primary.main, 0.1) : '#F8F9FA',
                                                    border: isEventToday ? `1px solid ${theme.palette.primary.main}` : '1px solid #EAECEF'
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    color={isEventToday ? 'primary.main' : 'text.secondary'}
                                                    sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}
                                                >
                                                    {format(eventDate, 'MMM', { locale: ptBR })}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={isEventToday ? 'primary.main' : 'text.primary'}
                                                >
                                                    {eventDate.getDate()}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {event.nome}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTime sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {event.horaInicio} - {event.horaFim}
                                                    </Typography>
                                                    {event.consultationType === 'Telemedicina' && (
                                                        <VideoCall fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Chip
                                            label={event.status}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                bgcolor: colors.bg,
                                                color: colors.color,
                                                borderRadius: '12px'
                                            }}
                                        />
                                    </Box>
                                </Box>
                            );
                        })}

                        <Button
                            variant="text"
                            endIcon={<ArrowForward />}
                            onClick={() => changeView('month')}
                            sx={{
                                width: '100%',
                                justifyContent: 'flex-end',
                                textTransform: 'none',
                                color: 'primary.main',
                                fontWeight: 500
                            }}
                        >
                            Ver todas as consultas
                        </Button>
                    </>
                )}
            </Box>
        );
    };

    // Day view
    const renderDayView = () => {
        const dayEvents = findEvents(selectedDate);
        const isTodayFlag = isToday(selectedDate);

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Day header */}
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid #EAECEF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    bgcolor: 'white'
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                            {selectedDate.getFullYear() !== new Date().getFullYear() &&
                                ` de ${selectedDate.getFullYear()}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {format(selectedDate, "EEEE", { locale: ptBR })}
                        </Typography>
                    </Box>

                    {isTodayFlag && (
                        <Chip
                            label="Hoje"
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 24,
                                borderRadius: '12px',
                                fontWeight: 600
                            }}
                        />
                    )}
                </Box>

                {/* Events list */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#F8FAFF' }}>
                    {dayEvents.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary'
                        }}>
                            <CalendarToday sx={{ fontSize: 48, color: alpha('#000', 0.1), mb: 2 }} />
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Nenhuma consulta agendada para esta data
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={handleCreateEvent}
                                sx={{
                                    mt: 2,
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Agendar Consulta
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {timeSlots.map(hour => {
                                const eventsAtHour = dayEvents.filter(e =>
                                    parseInt(e.horaInicio.split(':')[0]) === hour
                                );

                                if (eventsAtHour.length === 0) return null;

                                // Ordena os eventos também pelos minutos
                                const sortedEvents = [...eventsAtHour].sort((a, b) => {
                                    const [aHour, aMin] = a.horaInicio.split(':').map(Number);
                                    const [bHour, bMin] = b.horaInicio.split(':').map(Number);
                                    return (aHour * 60 + aMin) - (bHour * 60 + bMin);
                                });

                                return (
                                    <Box key={hour} sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, pl: 1 }}>
                                            <AccessTime sx={{ fontSize: '1rem', color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                {hour}:00
                                            </Typography>
                                        </Box>

                                        {sortedEvents.map(event => (
                                            <EventCard key={event.id} event={event} onClick={handleEventClick} />
                                        ))}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    // Defina o currentWeek (lista dos dias da semana)
    const currentWeek = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const weekEvents = useMemo(() => {
        return currentWeek.map(day => {
            const dayStr = moment(day).format('YYYY-MM-DD');
            return eventos.filter(event => event.data === dayStr);
        });
    }, [currentWeek, eventos]);

    // Crie um array de filteredTimeSlots com somente as horas em que há pelo menos um evento em algum dia
    const filteredTimeSlots = useMemo(() => {
        return timeSlots.filter(hour =>
            currentWeek.some((day, dayIndex) => {
                const eventsAtHour = weekEvents[dayIndex]?.filter(event => {
                    const startHour = parseInt(event.horaInicio.split(':')[0]);
                    return startHour === hour;
                });
                return eventsAtHour && eventsAtHour.length > 0;
            })
        );
    }, [timeSlots, currentWeek, weekEvents]);

    // Week view - improved to properly show events
    const renderWeekView = () => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Week header */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '80px repeat(7, 1fr)',
                        bgcolor: 'white',
                        borderBottom: '1px solid #EAECEF'
                    }}
                >
                    {/* Empty top-left corner */}
                    <Box
                        sx={{
                            borderRight: '1px solid #EAECEF',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            HORÁRIO
                        </Typography>
                    </Box>

                    {/* Weekday headers */}
                    {currentWeek.map((day, index) => (
                        <DayCell
                            key={index}
                            day={day}
                            viewType="week"
                            isSelected={isSameDay(selectedDate, day)}
                            onClick={selectDay}
                        />
                    ))}
                </Box>

                {/* Time slots and events */}
                <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#F8FAFF' }}>
                    {filteredTimeSlots.length > 0 ? (
                        filteredTimeSlots.map(hour => {
                            const isCurrentHour = hour === currentHour;
                            return (
                                <Box
                                    key={hour}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '80px repeat(7, 1fr)',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Hour label */}
                                    <Box
                                        sx={{
                                            p: 1,
                                            borderRight: '1px solid #EAECEF',
                                            borderBottom: '1px solid #EAECEF',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'center',
                                            bgcolor: 'white',
                                            position: 'relative'
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                fontWeight: 500,
                                                position: 'absolute',
                                                top: 8,
                                                right: 10
                                            }}
                                        >
                                            {hour}:00
                                        </Typography>
                                    </Box>

                                    {/* Day columns with events */}
                                    {currentWeek.map((day, dayIndex) => {
                                        const dayEvents = weekEvents[dayIndex] || [];
                                        const eventsAtHour = dayEvents.filter(event => {
                                            const startHour = parseInt(event.horaInicio.split(':')[0]);
                                            return startHour === hour;
                                        });
                                        const isTodayFlag = isToday(day);
                                        return (
                                            <Box
                                                key={dayIndex}
                                                sx={{
                                                    p: 1,
                                                    borderRight: dayIndex < 6 ? '1px solid #EAECEF' : 'none',
                                                    borderBottom: '1px solid #EAECEF',
                                                    minHeight: '80px',
                                                    bgcolor: 'white',
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* Current time indicator */}
                                                {isTodayFlag && isCurrentHour && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: 0,
                                                            right: 0,
                                                            height: '2px',
                                                            bgcolor: theme.palette.error.main,
                                                            zIndex: 1
                                                        }}
                                                    />
                                                )}

                                                {/* Events at this hour */}
                                                {[...eventsAtHour]
                                                    .sort((a, b) => {
                                                        const [aHour, aMin] = a.horaInicio.split(':').map(Number);
                                                        const [bHour, bMin] = b.horaInicio.split(':').map(Number);
                                                        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
                                                    })
                                                    .map(event => (
                                                        <EventCard
                                                            key={event.id}
                                                            event={event}
                                                            onClick={handleEventClick}
                                                            isCompact={true}
                                                        />
                                                    ))
                                                }
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        })
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                            p: 4
                        }}>
                            <CalendarToday sx={{ fontSize: 48, color: alpha('#000', 0.1), mb: 2 }} />
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Nenhuma consulta agendada para esta semana
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={handleCreateEvent}
                                sx={{
                                    mt: 2,
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Agendar Consulta
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    // Month view
    const renderMonthView = () => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: '#F8FAFF' }}>
                {/* Weekday headers */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    bgcolor: 'white',
                    borderBottom: '1px solid #EAECEF'
                }}>
                    {weekdays.map((day, index) => (
                        <Box
                            key={index}
                            sx={{
                                p: 1.5,
                                textAlign: 'center',
                                borderRight: index < 6 ? '1px solid #EAECEF' : 'none'
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                {day}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Month grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridAutoRows: 'minmax(120px, 1fr)',
                    gap: 1,
                    p: 2,
                    flex: 1,
                    overflow: 'auto'
                }}>
                    {daysInMonth.map((day, index) => (
                        <DayCell
                            key={index}
                            day={day}
                            viewType="month"
                            isSelected={isSameDay(selectedDate, day)}
                            onClick={selectDay}
                        />
                    ))}
                </Box>
            </Box>
        );
    };

    // View selector buttons
    const ViewSelector = () => {
        return (
            <Box
                sx={{
                    display: 'flex',
                    bgcolor: '#F5F7FA',
                    borderRadius: '50px',
                    border: '1px solid #CED4DA',
                    p: 0.5
                }}
            >
                <Button
                    variant="text"
                    startIcon={<ViewDay />}
                    onClick={() => changeView('day')}
                    sx={{
                        borderRadius: '50px',
                        bgcolor: activeView === 'day' ? 'white' : 'transparent',
                        color: activeView === 'day' ? 'primary.main' : 'text.secondary',
                        boxShadow: activeView === 'day' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            bgcolor: activeView === 'day' ? 'white' : alpha(theme.palette.primary.main, 0.05)
                        }
                    }}
                >
                    Dia
                </Button>
                <Button
                    variant="text"
                    startIcon={<ViewWeek />}
                    onClick={() => changeView('week')}
                    sx={{
                        borderRadius: '50px',
                        bgcolor: activeView === 'week' ? 'white' : 'transparent',
                        color: activeView === 'week' ? 'primary.main' : 'text.secondary',
                        boxShadow: activeView === 'week' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            bgcolor: activeView === 'week' ? 'white' : alpha(theme.palette.primary.main, 0.05)
                        }
                    }}
                >
                    Semana
                </Button>
                <Button
                    variant="text"
                    startIcon={<ViewModule />}
                    onClick={() => changeView('month')}
                    sx={{
                        borderRadius: '50px',
                        bgcolor: activeView === 'month' ? 'white' : 'transparent',
                        color: activeView === 'month' ? 'primary.main' : 'text.secondary',
                        boxShadow: activeView === 'month' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            bgcolor: activeView === 'month' ? 'white' : alpha(theme.palette.primary.main, 0.05)
                        }
                    }}
                >
                    Mês
                </Button>
            </Box>
        );
    };

    // Render based on active view
    const renderActiveView = () => {
        if (isLoading) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    bgcolor: '#F8FAFF'
                }}>
                    <CircularProgress />
                </Box>
            );
        }

        switch (activeView) {
            case 'day':
                return renderDayView();
            case 'week':
                return renderWeekView();
            case 'month':
                return renderMonthView();
            default:
                return renderWeekView();
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Sidebar */}
            <Drawer
                variant={isMobile ? "temporary" : "persistent"}
                open={sidebarOpen}
                onClose={toggleSidebar}
                sx={{
                    width: sidebarOpen ? (sidebarCollapsed ? 60 : 280) : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: sidebarCollapsed ? 60 : 280,
                        boxSizing: 'border-box',
                        borderRight: '1px solid #EAECEF',
                        boxShadow: 'none',
                        transition: 'width 0.3s ease, transform 0.5s ease',
                        overflowX: 'hidden',
                        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
                    },
                }}
            >

                <Box
                    sx={{
                        p: sidebarCollapsed ? 1 : 3,
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid #EAECEF'
                    }}
                >
                    {!sidebarCollapsed && (
                        <Typography variant="h6" fontWeight={600} sx={{ ml: 2 }}>
                            Agenda Médica
                        </Typography>
                    )}

                    {/* Espaço flexível para empurrar o botão para a direita */}
                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton
                        onClick={toggleSidebar}
                        sx={{
                            p: 0.5,
                            borderRadius: '50%',
                            border: '1.522px solid rgba(0, 0, 0, 0.20)',
                            backgroundColor: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.05)'
                            }
                        }}
                    >
                        <Box
                            component="img"
                            src={sidebarOpen ? '/leftarrowblack.svg' : '/rightarrow.svg'}
                            alt="Toggle Calendar Sidebar"
                            sx={{ width: 20, height: 20 }}
                        />
                    </IconButton>
                </Box>

                {/* Toggle collapse button */}
                <Tooltip title={sidebarCollapsed ? "Expandir calendário" : "Minimizar calendário"} placement="right">
                    <Box
                        sx={{
                            position: 'absolute',
                            right: -13, // Movido ligeiramente para fora
                            top: 120,   // Movido para baixo para evitar sobreposição
                            zIndex: 1100, // Ajustado z-index
                            '& .MuiIconButton-root': {
                                width: 24,
                                height: 24,
                                padding: '4px'
                            }
                        }}
                    >
                    </Box>
                </Tooltip>

                {/* Mini calendar - show only when not collapsed */}
                {!sidebarCollapsed && (
                    <Box sx={{ p: 2, borderBottom: '1px solid #EAECEF' }}>
                        <MiniCalendar />
                    </Box>
                )}

                {/* Upcoming events - show only when not collapsed */}
                {!sidebarCollapsed ? (
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <UpcomingEvents />
                    </Box>
                ) : (
                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
                        {/* Compact icons for collapsed sidebar */}
                        <Tooltip title="Calendário" placement="right">
                            <IconButton
                                sx={{ color: 'primary.main' }}
                                onClick={handleCalendarOpen}
                            >
                                <CalendarToday />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Hoje" placement="right">
                            <IconButton
                                sx={{ color: 'primary.main' }}
                                onClick={goToToday}
                            >
                                <Today />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Drawer>

            {/* Main content */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* Calendar header */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #EAECEF',
                    bgcolor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isMobile && (
                            <IconButton onClick={toggleSidebar}>
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Button
                            variant="outlined"
                            startIcon={<Today />}
                            onClick={handleCalendarOpen}
                            sx={{
                                borderRadius: '50px',
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Hoje
                        </Button>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                                onClick={goToPrevious}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    border: '1px solid #CED4DA',
                                    borderRadius: '50%'
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>
                            <IconButton
                                onClick={goToNext}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    border: '1px solid #CED4DA',
                                    borderRadius: '50%'
                                }}
                            >
                                <ChevronRight />
                            </IconButton>
                        </Box>

                        <Typography variant="h6" fontWeight={600}>
                            {currentMonthName}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PeriodSelector changeView={changeView} />

                        {!isMobile && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={handleCreateEvent}
                                sx={{
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Nova Consulta
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Calendar body */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {renderActiveView()}
                </Box>
            </Box>

            {/* Mini calendar popover */}
            <Popover
                open={isCalendarOpen}
                anchorEl={calendarAnchorEl}
                onClose={handleCalendarClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <MiniCalendar />
            </Popover>

            {/* Modal for creating/editing consultations */}
            <EventoModal
                isOpen={showEventoModal}
                onClose={() => setShowEventoModal(false)}
                onSave={handleSaveEvent}
                evento={eventoSelecionado}
            />

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.type}
                    sx={{
                        width: '100%',
                        borderRadius: '50px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Mobile add button */}
            {isMobile && (
                <Box sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1200
                }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleCreateEvent}
                        sx={{
                            borderRadius: '50px',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                            py: 1.5
                        }}
                    >
                        Nova Consulta
                    </Button>
                </Box>
            )}

            <ViewConsultationDialog
                open={showConsultationDialog}
                onClose={() => setShowConsultationDialog(false)}
                consultationData={selectedConsultation}
                patientId={selectedConsultation?.patientId}
                doctorId={user?.uid}
                onEdit={handleEditFromDialog}
                onDelete={handleDeleteFromDialog}
                onChangeStatus={handleChangeStatus}
            />
        </Box>
    );
};

export default AgendaMedica;