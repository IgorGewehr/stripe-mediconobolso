"use client";

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Paper,
    Popover,
    TextField,
    Grid,
    Divider,
    Chip,
    Snackbar,
    Alert,
    CircularProgress,
    Badge,
    alpha,
    styled
} from '@mui/material';
import {
    KeyboardArrowLeft,
    KeyboardArrowRight,
    DateRange,
    AccessTime,
    KeyboardArrowDown,
    Add,
    FiberManualRecord
} from '@mui/icons-material';
import FirebaseService from '../../../lib/FirebaseService';
import { useAuth } from '../authProvider';
import EventoModal from './eventoModal'; // Importando o componente otimizado

// Estilos personalizados para componentes da agenda
const CalendarContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFF',
    borderRadius: '24px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
    fontFamily: 'Gellix, sans-serif',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #EAECEF',
    backgroundColor: '#FFFFFF'
}));

const CalendarBody = styled(Box)(({ theme }) => ({
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
}));

const HeaderButton = styled(Button)(({ theme }) => ({
    borderRadius: '50px',
    textTransform: 'none',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CED4DA',
    boxShadow: 'none',
    color: theme.palette.text.primary,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        borderColor: theme.palette.primary.main
    }
}));

const NavButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: '#FFFFFF',
    border: '1px solid #CED4DA',
    borderRadius: '50%',
    padding: '8px',
    color: theme.palette.text.primary,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        borderColor: theme.palette.primary.main
    }
}));

const AddButton = styled(Button)(({ theme }) => ({
    borderRadius: '50px',
    textTransform: 'none',
    padding: '8px 16px',
    backgroundColor: theme.palette.success.main,
    color: '#FFFFFF',
    fontWeight: 500,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    '&:hover': {
        backgroundColor: theme.palette.success.dark,
        boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)'
    }
}));

const ViewToggleButton = styled(Button)(({ theme, active }) => ({
    borderRadius: '50px',
    textTransform: 'none',
    minWidth: 'auto',
    padding: '8px 16px',
    backgroundColor: active ? theme.palette.primary.main : '#FFFFFF',
    color: active ? '#FFFFFF' : theme.palette.text.primary,
    border: `1px solid ${active ? theme.palette.primary.main : '#CED4DA'}`,
    fontWeight: 500,
    '&:hover': {
        backgroundColor: active ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.04),
        borderColor: theme.palette.primary.main
    }
}));

const StyledDateCell = styled(Box)(({ theme, istoday, active, isoutside }) => ({
    padding: '12px',
    textAlign: 'center',
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: istoday === 'true'
        ? alpha(theme.palette.primary.main, 0.1)
        : active === 'true'
            ? alpha(theme.palette.primary.main, 0.05)
            : 'transparent',
    borderRadius: '8px',
    border: istoday === 'true' ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
    transition: 'all 0.2s ease-in-out',
    opacity: isoutside === 'true' ? 0.5 : 1,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        transform: 'translateY(-2px)',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.05)'
    }
}));

const DateNumber = styled(Typography)(({ theme, istoday }) => ({
    fontSize: '1.25rem',
    fontWeight: istoday === 'true' ? 600 : 500,
    color: istoday === 'true' ? theme.palette.primary.main : theme.palette.text.primary
}));

const EventIndicator = styled(Box)(({ theme, status }) => {
    let color;
    switch (status?.toLowerCase()) {
        case 'confirmado':
        case 'concluída':
            color = theme.palette.success.main;
            break;
        case 'cancelado':
        case 'cancelada':
            color = theme.palette.error.main;
            break;
        case 'em andamento':
            color = theme.palette.warning.main;
            break;
        default:
            color = theme.palette.primary.main;
    }

    return {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        marginRight: '4px'
    };
});

const EventItem = styled(Box)(({ theme, status }) => {
    let bgColor;
    let borderColor;

    switch (status?.toLowerCase()) {
        case 'confirmado':
        case 'concluída':
            bgColor = alpha(theme.palette.success.main, 0.1);
            borderColor = theme.palette.success.main;
            break;
        case 'cancelado':
        case 'cancelada':
            bgColor = alpha(theme.palette.error.main, 0.1);
            borderColor = theme.palette.error.main;
            break;
        case 'em andamento':
            bgColor = alpha(theme.palette.warning.main, 0.1);
            borderColor = theme.palette.warning.main;
            break;
        default:
            bgColor = alpha(theme.palette.primary.main, 0.1);
            borderColor = theme.palette.primary.main;
    }

    return {
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
        }
    };
});

const TimeSlot = styled(Box)(({ theme, ishour, iscurrent }) => ({
    padding: '8px 12px',
    borderBottom: '1px solid #EAECEF',
    position: 'relative',
    backgroundColor: iscurrent === 'true' ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
    '&::after': iscurrent === 'true' ? {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: theme.palette.error.main,
        zIndex: 1
    } : {}
}));

const TimeLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    position: 'absolute',
    top: '8px',
    left: '12px'
}));

// Componente para exibir células de dia no calendário
const DiaCell = memo(({ dia, eventos, isToday, onClick, activeView, isOutsideMonth, isSelected }) => {
    const eventosDia = useMemo(() => {
        return eventos.filter(ev => {
            const dataEvento = new Date(ev.data);
            return dataEvento.toDateString() === dia.toDateString();
        });
    }, [dia, eventos]);

    const diaSemana = dia.getDay();
    const diaSemanaTexto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana];

    if (activeView === 'month') {
        return (
            <StyledDateCell
                onClick={() => onClick(dia)}
                istoday={isToday ? 'true' : 'false'}
                active={isSelected ? 'true' : 'false'}
                isoutside={isOutsideMonth ? 'true' : 'false'}
            >
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {diaSemanaTexto}
                    </Typography>
                    <DateNumber istoday={isToday ? 'true' : 'false'}>
                        {dia.getDate()}
                    </DateNumber>
                </Box>

                {/* Indicadores de eventos */}
                {eventosDia.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        {eventosDia.length <= 3 ? (
                            eventosDia.map((_, idx) => (
                                <EventIndicator
                                    key={idx}
                                    status={eventosDia[idx].status}
                                    sx={{ mx: 0.5 }}
                                />
                            ))
                        ) : (
                            <Badge
                                badgeContent={eventosDia.length}
                                color="primary"
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: '18px', minWidth: '18px' } }}
                            >
                                <EventIndicator status="default" />
                            </Badge>
                        )}
                    </Box>
                )}
            </StyledDateCell>
        );
    }

    // Visualização padrão para dia na semana
    return (
        <StyledDateCell
            onClick={() => onClick(dia)}
            istoday={isToday ? 'true' : 'false'}
            active={isSelected ? 'true' : 'false'}
            sx={{
                height: '70px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Typography variant="caption" color="text.secondary">
                {diaSemanaTexto}
            </Typography>
            <DateNumber istoday={isToday ? 'true' : 'false'}>
                {dia.getDate()}
            </DateNumber>

            {eventosDia.length > 0 && (
                <Badge
                    badgeContent={eventosDia.length}
                    color="primary"
                    sx={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            height: '18px',
                            minWidth: '18px'
                        }
                    }}
                />
            )}
        </StyledDateCell>
    );
});

// Componente para exibir eventos
const EventoCard = memo(({ evento, onClick }) => {
    const { horaInicio, horaFim, nome, status } = evento;

    return (
        <EventItem
            status={status}
            onClick={() => onClick(evento)}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {horaInicio} - {horaFim}
                </Typography>
                <Chip
                    label={status || 'Agendada'}
                    size="small"
                    sx={{
                        height: '20px',
                        fontSize: '0.65rem',
                        backgroundColor: alpha(
                            status?.toLowerCase() === 'confirmado' || status?.toLowerCase() === 'concluída'
                                ? '#4caf50'
                                : status?.toLowerCase() === 'cancelado' || status?.toLowerCase() === 'cancelada'
                                    ? '#f44336'
                                    : status?.toLowerCase() === 'em andamento'
                                        ? '#ff9800'
                                        : '#2196f3',
                            0.1
                        ),
                        color: status?.toLowerCase() === 'confirmado' || status?.toLowerCase() === 'concluída'
                            ? '#4caf50'
                            : status?.toLowerCase() === 'cancelado' || status?.toLowerCase() === 'cancelada'
                                ? '#f44336'
                                : status?.toLowerCase() === 'em andamento'
                                    ? '#ff9800'
                                    : '#2196f3',
                        borderRadius: '50px'
                    }}
                />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {nome}
            </Typography>
        </EventItem>
    );
});

// Componente principal da Agenda Médica
const AgendaMedica = () => {
    const { user } = useAuth();

    // Refs para calendários e popups
    const miniCalendarRef = useRef(null);

    // Estados para controle do calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState('week'); // 'day', 'week', 'month'
    const [miniCalendarAnchor, setMiniCalendarAnchor] = useState(null);
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

    // Estados para eventos e modal
    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEventoModal, setShowEventoModal] = useState(false);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    // Estado para notificações
    const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });

    // Constantes
    const horaAtual = new Date().getHours();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Memoização das datas e períodos
    const currentWeek = useMemo(() => {
        return obterSemana(currentDate);
    }, [currentDate]);

    const currentMonthName = useMemo(() => {
        return formatarDataMesAno(currentDate);
    }, [currentDate]);

    const diasDoMes = useMemo(() => {
        return obterDiasDoMes(currentDate);
    }, [currentDate]);

    // Slots de tempo para visualizações de dia e semana
    const timeSlots = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00
    }, []);

    // Efeito para carregar consultas do Firebase
    useEffect(() => {
        const loadConsultations = async () => {
            if (!user?.uid) return;

            setIsLoading(true);
            try {
                const doctorId = user.uid;
                const consultationsData = await FirebaseService.listAllConsultations(doctorId);

                // Buscar informações de pacientes para exibir nomes
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

                // Processar consultas em formato de eventos
                const eventosProcessados = consultationsData.map(consulta => {
                    // Obter informações do paciente
                    const paciente = patientsMap[consulta.patientId];
                    const nomePaciente = paciente ? paciente.patientName : "Paciente";

                    // Calcular hora de término
                    const horaInicio = consulta.consultationTime || "00:00";
                    let [hora, minuto] = horaInicio.split(':').map(Number);
                    const duracao = consulta.consultationDuration || 30;

                    minuto += duracao;
                    while (minuto >= 60) {
                        hora += 1;
                        minuto -= 60;
                    }
                    hora = hora % 24;

                    const horaFim = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

                    // Mapear status
                    let status = "A Confirmar";
                    switch (consulta.status) {
                        case "Concluída":
                            status = "Confirmado";
                            break;
                        case "Cancelada":
                            status = "Cancelado";
                            break;
                        case "Em Andamento":
                            status = "Em Andamento";
                            break;
                        default:
                            status = "A Confirmar";
                    }

                    // Formatar data para consistência
                    let dataFormatada;
                    if (consulta.consultationDate instanceof Date) {
                        dataFormatada = consulta.consultationDate.toISOString().split('T')[0];
                    } else if (typeof consulta.consultationDate === 'string') {
                        if (consulta.consultationDate.includes('T')) {
                            dataFormatada = consulta.consultationDate.split('T')[0];
                        } else {
                            dataFormatada = consulta.consultationDate;
                        }
                    } else {
                        dataFormatada = new Date(consulta.consultationDate).toISOString().split('T')[0];
                    }

                    return {
                        id: consulta.id,
                        nome: nomePaciente,
                        data: dataFormatada,
                        horaInicio,
                        horaFim,
                        status,
                        patientId: consulta.patientId,
                        doctorId: consulta.doctorId,
                        consultationDuration: consulta.consultationDuration,
                        consultationType: consulta.consultationType,
                        reasonForVisit: consulta.reasonForVisit,
                        consultationDate: new Date(dataFormatada)
                    };
                });

                setEventos(eventosProcessados);
            } catch (error) {
                console.error("Erro ao carregar consultas:", error);
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

    // Funções para gerenciar consultas
    const criarConsulta = async (consultaData) => {
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
            const pacienteId = consultaData.patientId;

            // Criar consulta no Firebase
            const consultaId = await FirebaseService.createConsultation(doctorId, pacienteId, consultaData);

            // Buscar nome do paciente
            const paciente = await FirebaseService.getPatient(doctorId, pacienteId);

            // Calcular hora de término
            const horaInicio = consultaData.consultationTime;
            let [hora, minuto] = horaInicio.split(':').map(Number);
            const duracao = consultaData.consultationDuration;

            minuto += duracao;
            while (minuto >= 60) {
                hora += 1;
                minuto -= 60;
            }
            hora = hora % 24;

            const horaFim = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

            // Mapear status
            let status = "A Confirmar";
            switch (consultaData.status) {
                case "Concluída":
                    status = "Confirmado";
                    break;
                case "Cancelada":
                    status = "Cancelado";
                    break;
                case "Em Andamento":
                    status = "Em Andamento";
                    break;
                default:
                    status = "A Confirmar";
            }

            // Adicionar à lista local de eventos
            const novoEvento = {
                id: consultaId,
                nome: paciente ? paciente.patientName : "Paciente",
                data: consultaData.consultationDate instanceof Date
                    ? consultaData.consultationDate.toISOString().split('T')[0]
                    : new Date(consultaData.consultationDate).toISOString().split('T')[0],
                horaInicio,
                horaFim,
                status,
                patientId: pacienteId,
                doctorId,
                consultationDuration: consultaData.consultationDuration,
                consultationType: consultaData.consultationType,
                reasonForVisit: consultaData.reasonForVisit,
                consultationDate: consultaData.consultationDate instanceof Date
                    ? consultaData.consultationDate
                    : new Date(consultaData.consultationDate)
            };

            setEventos(prev => [...prev, novoEvento]);

            setNotification({
                open: true,
                message: "Consulta agendada com sucesso!",
                type: 'success'
            });
        } catch (error) {
            console.error("Erro ao criar consulta:", error);
            setNotification({
                open: true,
                message: "Erro ao agendar consulta. Tente novamente.",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const atualizarConsulta = async (consultaData) => {
        try {
            setIsLoading(true);

            if (!user?.uid || !consultaData.id || !consultaData.patientId) {
                setNotification({
                    open: true,
                    message: "Dados incompletos para atualização.",
                    type: 'error'
                });
                return;
            }

            const doctorId = user.uid;
            const pacienteId = consultaData.patientId;
            const consultaId = consultaData.id;

            // Atualizar no Firebase
            await FirebaseService.updateConsultation(doctorId, pacienteId, consultaId, consultaData);

            // Calcular hora de término
            const horaInicio = consultaData.consultationTime;
            let [hora, minuto] = horaInicio.split(':').map(Number);
            const duracao = consultaData.consultationDuration;

            minuto += duracao;
            while (minuto >= 60) {
                hora += 1;
                minuto -= 60;
            }
            hora = hora % 24;

            const horaFim = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

            // Mapear status
            let status = "A Confirmar";
            switch (consultaData.status) {
                case "Concluída":
                    status = "Confirmado";
                    break;
                case "Cancelada":
                    status = "Cancelado";
                    break;
                case "Em Andamento":
                    status = "Em Andamento";
                    break;
                default:
                    status = "A Confirmar";
            }

            // Atualizar na lista local
            setEventos(prev => prev.map(ev =>
                ev.id === consultaId
                    ? {
                        ...ev,
                        data: consultaData.consultationDate instanceof Date
                            ? consultaData.consultationDate.toISOString().split('T')[0]
                            : new Date(consultaData.consultationDate).toISOString().split('T')[0],
                        horaInicio,
                        horaFim,
                        status,
                        consultationDuration: consultaData.consultationDuration,
                        consultationType: consultaData.consultationType,
                        reasonForVisit: consultaData.reasonForVisit,
                        consultationDate: consultaData.consultationDate instanceof Date
                            ? consultaData.consultationDate
                            : new Date(consultaData.consultationDate)
                    }
                    : ev
            ));

            setNotification({
                open: true,
                message: "Consulta atualizada com sucesso!",
                type: 'success'
            });
        } catch (error) {
            console.error("Erro ao atualizar consulta:", error);
            setNotification({
                open: true,
                message: "Erro ao atualizar consulta. Tente novamente.",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fechar notificação
    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    // Funções de formatação e cálculo de datas
    function formatarDataMesAno(data) {
        return `${meses[data.getMonth()]} de ${data.getFullYear()}`;
    }

    function obterSemana(data) {
        const primeiroDia = new Date(data);
        const diaSemana = primeiroDia.getDay();
        primeiroDia.setDate(primeiroDia.getDate() - diaSemana);

        return Array(7).fill().map((_, i) => {
            const dia = new Date(primeiroDia);
            dia.setDate(primeiroDia.getDate() + i);
            return dia;
        });
    }

    function obterDiasDoMes(data) {
        const ano = data.getFullYear();
        const mes = data.getMonth();

        // Primeiro dia do mês
        const primeiroDia = new Date(ano, mes, 1);
        // Último dia do mês
        const ultimoDia = new Date(ano, mes + 1, 0);

        const diasAntes = primeiroDia.getDay();
        const diasDepois = 6 - ultimoDia.getDay();

        // Adicionar dias do mês anterior
        const resultado = [];
        for (let i = diasAntes - 1; i >= 0; i--) {
            const dia = new Date(ano, mes, -i);
            resultado.push(dia);
        }

        // Adicionar dias do mês atual
        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            const dia = new Date(ano, mes, i);
            resultado.push(dia);
        }

        // Adicionar dias do próximo mês
        for (let i = 1; i <= diasDepois; i++) {
            const dia = new Date(ano, mes + 1, i);
            resultado.push(dia);
        }

        return resultado;
    }

    function formatarData(data) {
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    }

    function formatarHora(hora) {
        return `${hora}:00`;
    }

    // Navegação no calendário
    const navegarParaHoje = useCallback(() => {
        const hoje = new Date();
        setCurrentDate(hoje);
        setSelectedDate(hoje);
    }, []);

    const navegarAnterior = useCallback(() => {
        const novaData = new Date(currentDate);

        if (activeView === 'day') {
            novaData.setDate(novaData.getDate() - 1);
        } else if (activeView === 'week') {
            novaData.setDate(novaData.getDate() - 7);
        } else if (activeView === 'month') {
            novaData.setMonth(novaData.getMonth() - 1);
        }

        setCurrentDate(novaData);
        setSelectedDate(novaData);
    }, [currentDate, activeView]);

    const navegarProximo = useCallback(() => {
        const novaData = new Date(currentDate);

        if (activeView === 'day') {
            novaData.setDate(novaData.getDate() + 1);
        } else if (activeView === 'week') {
            novaData.setDate(novaData.getDate() + 7);
        } else if (activeView === 'month') {
            novaData.setMonth(novaData.getMonth() + 1);
        }

        setCurrentDate(novaData);
        setSelectedDate(novaData);
    }, [currentDate, activeView]);

    // Lógica para encontrar eventos em uma data/hora
    const encontrarEventos = useCallback((dia, hora = null) => {
        const dataFormatada = formatarData(dia);

        return eventos.filter(evento => {
            const dataEvento = new Date(evento.data);
            const dataEventoFormatada = formatarData(dataEvento);

            if (dataEventoFormatada !== dataFormatada) return false;

            if (hora !== null) {
                const horaInicio = parseInt(evento.horaInicio.split(':')[0]);
                return horaInicio === hora;
            }

            return true;
        });
    }, [eventos]);

    // Manipuladores de eventos
    const alterarVisualizacao = useCallback((novaView) => {
        setActiveView(novaView);
    }, []);

    const selecionarDia = useCallback((dia) => {
        setSelectedDate(dia);
        if (activeView === 'month') {
            setActiveView('day');
        }
    }, [activeView]);

    const manipularClickEvento = useCallback((evento) => {
        setEventoSelecionado(evento);
        setShowEventoModal(true);
    }, []);

    const manipularCliqueCriarEvento = useCallback(() => {
        setEventoSelecionado(null);
        setShowEventoModal(true);
    }, []);

    const handleSaveEvent = useCallback((event) => {
        if (event.id) {
            atualizarConsulta(event);
        } else {
            criarConsulta(event);
        }
    }, []);

    // Mini-calendário
    const handleMiniCalendarOpen = (event) => {
        setMiniCalendarAnchor(event.currentTarget);
    };

    const handleMiniCalendarClose = () => {
        setMiniCalendarAnchor(null);
    };

    const miniCalendarOpen = Boolean(miniCalendarAnchor);

    // Renderização de visualizações
    const renderDayView = () => {
        const eventosHoje = encontrarEventos(selectedDate);
        const hoje = new Date();
        const isToday = selectedDate.toDateString() === hoje.toDateString();

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Cabeçalho do dia */}
                <Box sx={{ p: 2, borderBottom: '1px solid #EAECEF', display: 'flex', justifyContent: 'space-between', bgcolor: 'white' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            {selectedDate.getDate()} de {meses[selectedDate.getMonth()]}
                            {selectedDate.getFullYear() !== new Date().getFullYear() && ` de ${selectedDate.getFullYear()}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {diasSemana[selectedDate.getDay()]}-feira
                        </Typography>
                    </Box>

                    {isToday && (
                        <Chip
                            label="Hoje"
                            color="primary"
                            size="small"
                            sx={{
                                height: '24px',
                                borderRadius: '50px',
                                bgcolor: alpha('#2196f3', 0.1),
                                color: '#2196f3',
                                fontWeight: 500
                            }}
                        />
                    )}
                </Box>

                {/* Lista de eventos */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {eventosHoje.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary'
                        }}>
                            <DateRange sx={{ fontSize: 48, color: alpha('#000', 0.1), mb: 2 }} />
                            <Typography variant="body1">
                                Nenhuma consulta agendada para esta data
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={manipularCliqueCriarEvento}
                                sx={{
                                    mt: 2,
                                    borderRadius: '50px',
                                    textTransform: 'none'
                                }}
                            >
                                Agendar Consulta
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {timeSlots.map(hora => {
                                const eventosHora = eventosHoje.filter(e =>
                                    parseInt(e.horaInicio.split(':')[0]) === hora
                                );

                                if (eventosHora.length === 0) return null;

                                return (
                                    <Box key={hora} sx={{ mb: 3 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                mb: 1,
                                                color: 'text.secondary',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <AccessTime sx={{ fontSize: 16, mr: 1 }} />
                                            {formatarHora(hora)}
                                        </Typography>

                                        {eventosHora.map(evento => (
                                            <EventoCard
                                                key={evento.id}
                                                evento={evento}
                                                onClick={manipularClickEvento}
                                            />
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

    const renderWeekView = () => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Cabeçalho da semana */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto repeat(7, 1fr)',
                    borderBottom: '1px solid #EAECEF',
                    bgcolor: 'white'
                }}>
                    {/* Célula vazia para o canto superior esquerdo */}
                    <Box sx={{
                        p: 2,
                        borderRight: '1px solid #EAECEF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Typography variant="caption" color="text.secondary">
                            Horário
                        </Typography>
                    </Box>

                    {/* Dias da semana */}
                    {currentWeek.map((dia, index) => {
                        const isToday = new Date().toDateString() === dia.toDateString();
                        const isSelected = selectedDate.toDateString() === dia.toDateString();

                        return (
                            <DiaCell
                                key={index}
                                dia={dia}
                                eventos={eventos}
                                isToday={isToday}
                                isSelected={isSelected}
                                onClick={selecionarDia}
                                activeView={activeView}
                            />
                        );
                    })}
                </Box>

                {/* Grade de horários e eventos */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {timeSlots.map(hora => {
                        const isCurrentHour = hora === horaAtual;

                        return (
                            <Box
                                key={hora}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto repeat(7, 1fr)',
                                }}
                            >
                                {/* Marcador de hora */}
                                <TimeSlot
                                    ishour="true"
                                    iscurrent={isCurrentHour ? 'true' : 'false'}
                                    sx={{
                                        width: '80px',
                                        borderRight: '1px solid #EAECEF',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <TimeLabel>
                                        {formatarHora(hora)}
                                    </TimeLabel>
                                </TimeSlot>

                                {/* Células para cada dia */}
                                {currentWeek.map((dia, index) => {
                                    const eventos = encontrarEventos(dia, hora);
                                    const isToday = new Date().toDateString() === dia.toDateString();

                                    return (
                                        <TimeSlot
                                            key={index}
                                            iscurrent={isToday && isCurrentHour ? 'true' : 'false'}
                                            sx={{
                                                minHeight: '80px',
                                                borderRight: index < 6 ? '1px solid #EAECEF' : 'none',
                                                p: 1
                                            }}
                                        >
                                            {eventos.map(evento => (
                                                <EventoCard
                                                    key={evento.id}
                                                    evento={evento}
                                                    onClick={manipularClickEvento}
                                                />
                                            ))}
                                        </TimeSlot>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const renderMonthView = () => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Cabeçalho dos dias da semana */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    p: 1,
                    borderBottom: '1px solid #EAECEF',
                    bgcolor: 'white'
                }}>
                    {diasSemana.map((dia, index) => (
                        <Box key={index} sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {dia}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Grade do mês */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: 'repeat(6, 1fr)',
                    gap: 1,
                    p: 2,
                    flex: 1,
                    overflow: 'auto'
                }}>
                    {diasDoMes.map((dia, index) => {
                        const isToday = new Date().toDateString() === dia.toDateString();
                        const isSelected = selectedDate.toDateString() === dia.toDateString();
                        const isOutsideMonth = dia.getMonth() !== currentDate.getMonth();

                        return (
                            <DiaCell
                                key={index}
                                dia={dia}
                                eventos={eventos}
                                isToday={isToday}
                                isSelected={isSelected}
                                onClick={selecionarDia}
                                activeView={activeView}
                                isOutsideMonth={isOutsideMonth}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    };

    // Renderização condicional com base na visualização ativa
    const renderActiveView = () => {
        if (isLoading) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
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
        <CalendarContainer>
            {/* Cabeçalho do Calendário */}
            <CalendarHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HeaderButton
                        startIcon={<DateRange />}
                        onClick={handleMiniCalendarOpen}
                        ref={miniCalendarRef}
                    >
                        Hoje
                    </HeaderButton>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <NavButton onClick={navegarAnterior}>
                            <KeyboardArrowLeft />
                        </NavButton>
                        <NavButton onClick={navegarProximo}>
                            <KeyboardArrowRight />
                        </NavButton>
                    </Box>

                    <Typography variant="h6" fontWeight={600}>
                        {activeView === 'day'
                            ? `${selectedDate.getDate()} de ${meses[selectedDate.getMonth()]}`
                            : currentMonthName}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', bgcolor: '#F5F7FA', p: 0.5, borderRadius: '50px', border: '1px solid #CED4DA' }}>
                        <ViewToggleButton
                            active={activeView === 'day' ? 'true' : 'false'}
                            onClick={() => alterarVisualizacao('day')}
                        >
                            Dia
                        </ViewToggleButton>
                        <ViewToggleButton
                            active={activeView === 'week' ? 'true' : 'false'}
                            onClick={() => alterarVisualizacao('week')}
                        >
                            Semana
                        </ViewToggleButton>
                        <ViewToggleButton
                            active={activeView === 'month' ? 'true' : 'false'}
                            onClick={() => alterarVisualizacao('month')}
                        >
                            Mês
                        </ViewToggleButton>
                    </Box>

                    <AddButton
                        startIcon={<Add />}
                        onClick={manipularCliqueCriarEvento}
                        disabled={isLoading}
                    >
                        Nova Consulta
                    </AddButton>
                </Box>
            </CalendarHeader>

            {/* Conteúdo do Calendário */}
            <CalendarBody>
                {renderActiveView()}
            </CalendarBody>

            {/* Mini Calendário Popover */}
            <Popover
                open={miniCalendarOpen}
                anchorEl={miniCalendarAnchor}
                onClose={handleMiniCalendarClose}
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
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                        p: 2
                    }
                }}
            >
                <Box sx={{ width: 320 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                const newDate = new Date(miniCalendarDate);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setMiniCalendarDate(newDate);
                            }}
                        >
                            <KeyboardArrowLeft />
                        </IconButton>

                        <Typography variant="subtitle1" fontWeight={600}>
                            {meses[miniCalendarDate.getMonth()]} {miniCalendarDate.getFullYear()}
                        </Typography>

                        <IconButton
                            size="small"
                            onClick={() => {
                                const newDate = new Date(miniCalendarDate);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setMiniCalendarDate(newDate);
                            }}
                        >
                            <KeyboardArrowRight />
                        </IconButton>
                    </Box>

                    {/* Dias da semana */}
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        {diasSemana.map((dia, i) => (
                            <Grid item xs={12/7} key={i} textAlign="center">
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    {dia.charAt(0)}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Grade do mini calendário */}
                    <Grid container spacing={1}>
                        {obterDiasDoMes(miniCalendarDate).map((dia, index) => {
                            const isToday = new Date().toDateString() === dia.toDateString();
                            const isSelected = selectedDate.toDateString() === dia.toDateString();
                            const isOutsideMonth = dia.getMonth() !== miniCalendarDate.getMonth();

                            return (
                                <Grid item xs={12/7} key={index}>
                                    <Button
                                        fullWidth
                                        variant={isSelected ? 'contained' : 'text'}
                                        color={isToday && !isSelected ? 'primary' : 'inherit'}
                                        sx={{
                                            minWidth: 32,
                                            height: 32,
                                            p: 0,
                                            borderRadius: '8px',
                                            backgroundColor: isSelected
                                                ? 'primary.main'
                                                : isToday
                                                    ? alpha('#2196f3', 0.1)
                                                    : 'transparent',
                                            color: isSelected
                                                ? 'white'
                                                : isOutsideMonth
                                                    ? alpha('#000', 0.3)
                                                    : isToday
                                                        ? 'primary.main'
                                                        : 'text.primary',
                                            '&:hover': {
                                                backgroundColor: isSelected
                                                    ? 'primary.dark'
                                                    : alpha('#2196f3', 0.1)
                                            }
                                        }}
                                        onClick={() => {
                                            setSelectedDate(dia);
                                            setCurrentDate(dia);
                                            handleMiniCalendarClose();
                                        }}
                                    >
                                        {dia.getDate()}
                                    </Button>
                                </Grid>
                            );
                        })}
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                                navegarParaHoje();
                                handleMiniCalendarClose();
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
            </Popover>

            {/* Modal para criar/editar consultas */}
            <EventoModal
                isOpen={showEventoModal}
                onClose={() => setShowEventoModal(false)}
                onSave={handleSaveEvent}
                evento={eventoSelecionado}
            />

            {/* Notificações */}
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
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </CalendarContainer>
    );
};

export default AgendaMedica;