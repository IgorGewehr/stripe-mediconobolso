import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Paper,
    Popover,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Divider,
    Chip
} from '@mui/material';
import {
    KeyboardArrowLeft,
    KeyboardArrowRight,
    DateRange,
    AccessTime,
    KeyboardArrowDown,
    Add,
    Edit,
    Delete,
    Close,
    Check,
    FiberManualRecord
} from '@mui/icons-material';
import FirebaseService from '../../../lib/FirebaseService';
import { consultationModel } from '../../../lib/ModelObjects';

// Componente otimizado para células de dia no calendário
const DiaCell = memo(({ dia, eventos, isToday, onClick, activeView, isOutsideMonth }) => {
    const eventosDia = useMemo(() => {
        return eventos.filter(ev => {
            const dataEvento = new Date(ev.data);
            return dataEvento.toDateString() === dia.toDateString();
        });
    }, [dia, eventos]);

    const diaSemana = dia.getDay();
    const isTerça = diaSemana === 2;

    // Estilos específicos para dia no modo mês
    if (activeView === 'month') {
        return (
            <Box
                onClick={() => onClick(dia)}
                sx={{
                    p: 1,
                    height: 96,
                    borderRight: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    position: 'relative',
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    bgcolor: isToday ? 'primary.lighter' : 'background.paper',
                    opacity: isOutsideMonth ? 0.5 : 1
                }}
            >
                <Box sx={{
                    textAlign: 'right',
                    p: 1,
                    fontWeight: isToday ? 'bold' : 'regular',
                    color: isToday ? 'primary.main' : 'text.primary'
                }}>
                    {dia.getDate()}
                </Box>

                {/* Eventos do dia em visualização compacta */}
                <Box sx={{ mt: 1 }}>
                    {eventosDia.slice(0, 3).map((evento, idx) => {
                        const statusColor = getStatusColor(evento.status).muiColor;
                        return (
                            <Box key={idx} sx={{
                                fontSize: '0.75rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0.5,
                                pl: 3,
                                position: 'relative'
                            }}>
                                <FiberManualRecord sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 6,
                                    fontSize: 8,
                                    color: statusColor
                                }} />
                                {evento.horaInicio} {evento.nome.substring(0, 12)}
                                {evento.nome.length > 12 ? '...' : ''}
                            </Box>
                        );
                    })}

                    {eventosDia.length > 3 && (
                        <Typography variant="caption" sx={{ pl: 2, color: 'primary.main' }}>
                            +{eventosDia.length - 3} mais
                        </Typography>
                    )}
                </Box>

                {/* Indicador de hoje */}
                {isToday && (
                    <FiberManualRecord sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        fontSize: 8,
                        color: 'primary.main'
                    }} />
                )}
            </Box>
        );
    }

    // Visualização padrão para dia na semana
    return (
        <Box
            onClick={() => onClick(dia)}
            sx={{
                p: 2,
                textAlign: 'center',
                position: 'relative',
                transition: 'background-color 0.2s',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                bgcolor: isToday || isTerça ? 'primary.lighter' : 'background.paper',
                borderRight: 1,
                borderColor: 'divider'
            }}
        >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana]}
            </Typography>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 'medium',
                    color: isToday || isTerça ? 'primary.main' : 'text.primary'
                }}
            >
                {dia.getDate()}
            </Typography>

            {/* Indicador de número de eventos */}
            {eventosDia.length > 0 && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        bgcolor: 'error.main',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                    }}
                >
                    {eventosDia.length}
                </Box>
            )}

            {/* Marcador de dia atual */}
            {isToday && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 32,
                        height: 4,
                        bgcolor: 'primary.main',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4
                    }}
                />
            )}
        </Box>
    );
});

// Componente otimizado para eventos
const EventoCard = memo(({ evento, onClick, onStatusChange, onDelete }) => {
    const { horaInicio, horaFim, nome, status, id } = evento;
    const statusConfig = getStatusColor(status);

    const handleStatusChange = (e, newStatus) => {
        e.stopPropagation();
        onStatusChange(id, newStatus);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(id);
    };

    return (
        <Paper
            onClick={() => onClick(evento)}
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                mx: 0.5,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: 1,
                bgcolor: statusConfig.bgColor,
                borderLeft: 4,
                borderColor: statusConfig.muiColor,
                transition: 'transform 0.2s, box-shadow 0.2s',
                top: '2px',
                bottom: '2px',
                zIndex: 10,
                '&:hover': {
                    boxShadow: 3,
                    transform: 'scale(1.01)'
                }
            }}
        >
            <Box sx={{ p: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                    {horaInicio} - {horaFim}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nome}
                </Typography>
                <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                        label={status || 'Pendente'}
                        size="small"
                        sx={{
                            bgcolor: statusConfig.muiColor,
                            color: 'white',
                            fontSize: '0.65rem',
                            height: 20
                        }}
                    />

                    {/* Ações rápidas (visíveis no hover) */}
                    <Box
                        sx={{
                            display: 'none',
                            '.MuiPaper-root:hover &': { display: 'flex' },
                            alignItems: 'center',
                            gap: 0.5
                        }}
                    >
                        {status !== 'Confirmado' && (
                            <IconButton
                                size="small"
                                onClick={(e) => handleStatusChange(e, 'Confirmado')}
                                sx={{ p: 0.5, color: 'success.main', '&:hover': { bgcolor: 'success.lighter' } }}
                                title="Confirmar"
                            >
                                <Check fontSize="small" />
                            </IconButton>
                        )}
                        {status !== 'Cancelado' && (
                            <IconButton
                                size="small"
                                onClick={(e) => handleStatusChange(e, 'Cancelado')}
                                sx={{ p: 0.5, color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}
                                title="Cancelar"
                            >
                                <Close fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            onClick={handleDelete}
                            sx={{ p: 0.5, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
                            title="Remover"
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
});

// Modal para criar/editar eventos
const EventoModal = ({ isOpen, onClose, onSave, evento, pacientes, doctorId }) => {
    const [formData, setFormData] = useState({
        patientId: '',
        consultationDate: new Date(),
        consultationTime: '09:00',
        consultationDuration: 30,
        consultationType: 'Presencial',
        reasonForVisit: '',
        status: 'Agendada'
    });

    // Preencher formulário se for edição
    useEffect(() => {
        if (evento) {
            setFormData({
                patientId: evento.patientId || '',
                consultationDate: evento.consultationDate ? new Date(evento.consultationDate) : new Date(),
                consultationTime: evento.horaInicio || '09:00',
                consultationDuration: evento.consultationDuration || 30,
                consultationType: evento.consultationType || 'Presencial',
                reasonForVisit: evento.reasonForVisit || '',
                status: mapStatusToConsultation(evento.status) || 'Agendada'
            });
        }
    }, [evento]);

    const mapStatusToConsultation = (status) => {
        if (!status) return 'Agendada';

        switch (status.toLowerCase()) {
            case 'confirmado':
                return 'Concluída';
            case 'a confirmar':
                return 'Agendada';
            case 'cancelado':
                return 'Cancelada';
            default:
                return 'Agendada';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e) => {
        setFormData(prev => ({
            ...prev,
            consultationDate: new Date(e.target.value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Criar formato de consulta para salvar
        const consultationData = {
            ...consultationModel,
            patientId: formData.patientId,
            doctorId: doctorId,
            consultationDate: formData.consultationDate,
            consultationTime: formData.consultationTime,
            consultationDuration: parseInt(formData.consultationDuration),
            consultationType: formData.consultationType,
            status: formData.status,
            reasonForVisit: formData.reasonForVisit,
            id: evento?.id // Manter o ID se for edição
        };

        onSave(consultationData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {evento ? 'Editar Consulta' : 'Nova Consulta'}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <Divider />
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined" required>
                                <InputLabel id="paciente-select-label">Paciente</InputLabel>
                                <Select
                                    labelId="paciente-select-label"
                                    id="patientId"
                                    name="patientId"
                                    value={formData.patientId}
                                    onChange={handleChange}
                                    label="Paciente"
                                >
                                    <MenuItem value="">
                                        <em>Selecione um paciente</em>
                                    </MenuItem>
                                    {pacientes.map(paciente => (
                                        <MenuItem key={paciente.id} value={paciente.id}>
                                            {paciente.patientName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Data"
                                type="date"
                                value={formData.consultationDate instanceof Date
                                    ? formData.consultationDate.toISOString().split('T')[0]
                                    : ''}
                                onChange={handleDateChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Horário"
                                type="time"
                                name="consultationTime"
                                value={formData.consultationTime}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="duracao-select-label">Duração</InputLabel>
                                <Select
                                    labelId="duracao-select-label"
                                    id="consultationDuration"
                                    name="consultationDuration"
                                    value={formData.consultationDuration}
                                    onChange={handleChange}
                                    label="Duração"
                                >
                                    <MenuItem value={15}>15 minutos</MenuItem>
                                    <MenuItem value={30}>30 minutos</MenuItem>
                                    <MenuItem value={45}>45 minutos</MenuItem>
                                    <MenuItem value={60}>1 hora</MenuItem>
                                    <MenuItem value={90}>1h30</MenuItem>
                                    <MenuItem value={120}>2 horas</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="tipo-select-label">Tipo</InputLabel>
                                <Select
                                    labelId="tipo-select-label"
                                    id="consultationType"
                                    name="consultationType"
                                    value={formData.consultationType}
                                    onChange={handleChange}
                                    label="Tipo"
                                >
                                    <MenuItem value="Presencial">Presencial</MenuItem>
                                    <MenuItem value="Telemedicina">Telemedicina</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Motivo da Consulta"
                                name="reasonForVisit"
                                value={formData.reasonForVisit}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="status-select-label">Status</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value="Agendada">Agendada</MenuItem>
                                    <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                                    <MenuItem value="Concluída">Concluída</MenuItem>
                                    <MenuItem value="Cancelada">Cancelada</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        {evento ? 'Atualizar' : 'Agendar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

// Função utilitária para obter cores com base no status
function getStatusColor(status) {
    if (!status) return {
        bgColor: '#f5f5f5',
        muiColor: 'grey.500',
        borderColor: 'grey.400',
    };

    switch (status.toLowerCase()) {
        case 'confirmado':
        case 'concluída':
            return {
                bgColor: '#e8f5e9',
                muiColor: 'success.main',
                borderColor: 'success.main',
            };
        case 'a confirmar':
        case 'agendada':
            return {
                bgColor: '#e3f2fd',
                muiColor: 'primary.main',
                borderColor: 'primary.main',
            };
        case 'cancelado':
        case 'cancelada':
            return {
                bgColor: '#ffebee',
                muiColor: 'error.main',
                borderColor: 'error.main',
            };
        case 'em andamento':
            return {
                bgColor: '#fff8e1',
                muiColor: 'warning.main',
                borderColor: 'warning.main',
            };
        default:
            return {
                bgColor: '#f5f5f5',
                muiColor: 'grey.500',
                borderColor: 'grey.400',
            };
    }
}

// Componente principal de Agenda
const AgendaMedica = ({ doctorId, filterCallback }) => {
    // Refs para detectar cliques fora dos popvers
    const miniCalendarRef = useRef(null);
    const periodoRef = useRef(null);

    // Estados para controle do calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState('week'); // 'day', 'week', 'month'
    const [visibleTimeSlots, setVisibleTimeSlots] = useState([]);
    const [miniCalendarAnchor, setMiniCalendarAnchor] = useState(null);
    const [periodoAnchor, setPeriodoAnchor] = useState(null);
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

    // Estados para eventos e modal
    const [eventos, setEventos] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEventoModal, setShowEventoModal] = useState(false);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    // Constantes e utilitários
    const horaAtual = new Date().getHours();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diasSemanaCompletos = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Memoização das datas e períodos para evitar cálculos desnecessários
    const currentWeek = useMemo(() => {
        return obterSemana(currentDate);
    }, [currentDate]);

    const currentMonthName = useMemo(() => {
        return formatarDataMesAno(currentDate);
    }, [currentDate]);

    const diasDoMes = useMemo(() => {
        return obterDiasDoMes(currentDate);
    }, [currentDate]);

    // Efeito para carregar consultas e pacientes do Firebase
    useEffect(() => {
        const carregarDados = async () => {
            setIsLoading(true);
            try {
                // Verificar se doctorId é válido para evitar erros no Firestore
                if (!doctorId) {
                    console.warn("ID do médico não fornecido ou inválido");
                    setEventos([]);
                    setPacientes([]);
                    setIsLoading(false);
                    return;
                }

                // Carregar consultas do médico
                const consultasFirebase = await FirebaseService.listAllConsultations(doctorId);

                // Converter para o formato de eventos da agenda
                const eventosFormatados = await Promise.all(consultasFirebase.map(async (consulta) => {
                    // Para cada consulta, buscar informações do paciente
                    let nomePaciente = "Paciente";
                    try {
                        // Verificar se patientId é válido
                        if (consulta.patientId) {
                            const paciente = await FirebaseService.getPatient(consulta.patientId);
                            if (paciente) {
                                nomePaciente = paciente.patientName || "Paciente sem nome";
                            }
                        }
                    } catch (error) {
                        console.error("Erro ao buscar paciente:", error);
                    }

                    // Calcular hora de fim com base na duração
                    const horaInicio = consulta.consultationTime || "00:00";
                    let [hora, minuto] = horaInicio.split(':').map(Number);
                    const duracao = consulta.consultationDuration || 30;

                    // Adicionar a duração
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

                    // Retornar evento formatado
                    return {
                        id: consulta.id,
                        nome: nomePaciente,
                        data: consulta.consultationDate instanceof Date
                            ? consulta.consultationDate.toISOString().split('T')[0]
                            : new Date(consulta.consultationDate).toISOString().split('T')[0],
                        horaInicio,
                        horaFim,
                        status,
                        patientId: consulta.patientId,
                        doctorId: consulta.doctorId,
                        consultationDuration: consulta.consultationDuration,
                        consultationType: consulta.consultationType,
                        reasonForVisit: consulta.reasonForVisit
                    };
                }));

                // Aplicar filtro externo se fornecido
                if (typeof filterCallback === 'function') {
                    setEventos(filterCallback(eventosFormatados));
                } else {
                    setEventos(eventosFormatados);
                }

                // Carregar lista de pacientes
                if (doctorId) {
                    const pacientesFirebase = await FirebaseService.getPatientsByDoctor(doctorId);
                    setPacientes(pacientesFirebase);
                } else {
                    setPacientes([]);
                }

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };

        carregarDados();
    }, [doctorId, filterCallback]);

    // Funções para gerenciar consultas
    const criarConsulta = async (consultaData) => {
        try {
            setIsLoading(true);

            // Validar dados da consulta
            if (!consultaData.patientId) {
                console.error("ID do paciente não fornecido");
                alert("Por favor, selecione um paciente");
                setIsLoading(false);
                return;
            }

            // Garantir que doctorId esteja definido
            if (!doctorId) {
                console.error("ID do médico não fornecido");
                alert("ID do médico não disponível. Tente fazer login novamente.");
                setIsLoading(false);
                return;
            }

            // Garantir que doctorId esteja na consulta
            consultaData.doctorId = doctorId;

            const pacienteId = consultaData.patientId;

            // Criar consulta no Firebase
            const consultaId = await FirebaseService.createConsultation(pacienteId, consultaData);

            // Buscar paciente para o nome
            const paciente = await FirebaseService.getPatient(pacienteId);

            // Calcular hora fim
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

            // Adicionar evento à lista local
            const novoEvento = {
                id: consultaId,
                nome: paciente.patientName,
                data: consultaData.consultationDate instanceof Date
                    ? consultaData.consultationDate.toISOString().split('T')[0]
                    : new Date(consultaData.consultationDate).toISOString().split('T')[0],
                horaInicio,
                horaFim,
                status,
                patientId: pacienteId,
                doctorId: consultaData.doctorId,
                consultationDuration: consultaData.consultationDuration,
                consultationType: consultaData.consultationType,
                reasonForVisit: consultaData.reasonForVisit
            };

            setEventos(prev => [...prev, novoEvento]);

        } catch (error) {
            console.error("Erro ao criar consulta:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const atualizarConsulta = async (consultaData) => {
        try {
            setIsLoading(true);

            // Validar dados da consulta
            if (!consultaData.patientId) {
                console.error("ID do paciente não fornecido para atualização");
                alert("Erro: ID do paciente não encontrado");
                setIsLoading(false);
                return;
            }

            if (!consultaData.id) {
                console.error("ID da consulta não fornecido para atualização");
                alert("Erro: ID da consulta não encontrado");
                setIsLoading(false);
                return;
            }

            // Garantir que doctorId esteja definido
            if (!doctorId) {
                console.error("ID do médico não fornecido");
                alert("ID do médico não disponível. Tente fazer login novamente.");
                setIsLoading(false);
                return;
            }

            // Garantir que doctorId esteja na consulta
            consultaData.doctorId = doctorId;

            const pacienteId = consultaData.patientId;
            const consultaId = consultaData.id;

            // Atualizar consulta no Firebase
            await FirebaseService.updateConsultation(pacienteId, consultaId, consultaData);

            // Calcular hora fim
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

            // Atualizar evento na lista local
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
                        reasonForVisit: consultaData.reasonForVisit
                    }
                    : ev
            ));

        } catch (error) {
            console.error("Erro ao atualizar consulta:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const excluirConsulta = async (eventoId) => {
        try {
            // Encontrar o evento pelo ID
            const evento = eventos.find(ev => ev.id === eventoId);
            if (!evento) return;

            const pacienteId = evento.patientId;

            // Remover do Firebase
            await FirebaseService.deleteConsultation(pacienteId, eventoId);

            // Remover da lista local
            setEventos(prev => prev.filter(ev => ev.id !== eventoId));

        } catch (error) {
            console.error("Erro ao excluir consulta:", error);
        }
    };

    const alterarStatusConsulta = async (eventoId, novoStatus) => {
        try {
            // Encontrar o evento pelo ID
            const evento = eventos.find(ev => ev.id === eventoId);
            if (!evento) return;

            const pacienteId = evento.patientId;

            // Mapear status para o formato do Firebase
            let statusFirebase = "Agendada";
            switch (novoStatus) {
                case "Confirmado":
                    statusFirebase = "Concluída";
                    break;
                case "Cancelado":
                    statusFirebase = "Cancelada";
                    break;
                case "Em Andamento":
                    statusFirebase = "Em Andamento";
                    break;
                default:
                    statusFirebase = "Agendada";
            }

            // Buscar consulta atual
            const consulta = await FirebaseService.getConsultation(pacienteId, eventoId);

            // Atualizar status
            await FirebaseService.updateConsultation(pacienteId, eventoId, {
                ...consulta,
                status: statusFirebase
            });

            // Atualizar na lista local
            setEventos(prev => prev.map(ev =>
                ev.id === eventoId
                    ? {...ev, status: novoStatus}
                    : ev
            ));

        } catch (error) {
            console.error("Erro ao alterar status:", error);
        }
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

    // Determinar slots de tempo visíveis de forma inteligente
    const determinarSlotsVisiveis = useCallback(() => {
        let datas = [];

        // Selecionar as datas corretas com base na visualização ativa
        if (activeView === 'day') {
            datas = [selectedDate];
        } else if (activeView === 'week') {
            datas = currentWeek;
        } else if (activeView === 'month') {
            // Para o mês, usamos a semana atual para calcular horários
            datas = currentWeek;
        }

        // Todas as horas possíveis (0-23)
        const todasHoras = Array.from({ length: 24 }, (_, i) => i);

        // Obter horas com eventos para as datas selecionadas
        const horasComEventos = new Set();

        datas.forEach(dia => {
            const dataFormatada = formatarData(dia);

            eventos.forEach(evento => {
                const dataEvento = new Date(evento.data);
                const dataEventoFormatada = formatarData(dataEvento);

                if (dataEventoFormatada === dataFormatada) {
                    const horaInicio = parseInt(evento.horaInicio.split(':')[0]);
                    horasComEventos.add(horaInicio);
                }
            });
        });

        // Se tiver poucos eventos (≤ 6 horários diferentes)
        if (horasComEventos.size <= 6) {
            // Se não tiver nenhum evento, mostrar as próximas 6 horas a partir da hora atual
            if (horasComEventos.size === 0) {
                return Array.from({ length: 6 }, (_, i) => (horaAtual + i) % 24).sort((a, b) => a - b);
            }

            // Caso contrário, mostrar apenas os horários com eventos
            return [...horasComEventos].sort((a, b) => a - b);
        }

        // Se tiver muitos eventos, mostrar horas de 7 às 19
        return Array.from({ length: 13 }, (_, i) => i + 7);
    }, [eventos, currentWeek, selectedDate, activeView, horaAtual]);

    function formatarData(data) {
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    }

    // Efeito para atualizar slots de tempo quando necessário
    useEffect(() => {
        const slots = determinarSlotsVisiveis();
        setVisibleTimeSlots(slots);
    }, [determinarSlotsVisiveis]);

    // Navegação
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

    // Lógica para encontrar eventos
    const encontrarEventos = useCallback((dia, hora) => {
        const dataFormatada = formatarData(dia);

        return eventos.filter(evento => {
            const dataEvento = new Date(evento.data);
            const dataEventoFormatada = formatarData(dataEvento);

            const horaInicio = parseInt(evento.horaInicio.split(':')[0]);

            return dataEventoFormatada === dataFormatada && horaInicio === hora;
        });
    }, [eventos]);

    // Formatação para exibição
    const formatarHora = (hora) => {
        if (hora === 0) return '12 AM';
        if (hora === 12) return '12 PM';
        return hora < 12 ? `${hora} AM` : `${hora - 12} PM`;
    };

    // Manipuladores de eventos
    const alterarVisualizacao = useCallback((tipo) => {
        setActiveView(tipo);
        setPeriodoAnchor(null);
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

    const salvarEvento = useCallback((evento) => {
        if (evento.id) {
            atualizarConsulta(evento);
        } else {
            criarConsulta(evento);
        }
    }, []);

    // Manipuladores de popover
    const handleMiniCalendarOpen = (event) => {
        setMiniCalendarAnchor(event.currentTarget);
    };

    const handleMiniCalendarClose = () => {
        setMiniCalendarAnchor(null);
    };

    const handlePeriodoOpen = (event) => {
        setPeriodoAnchor(event.currentTarget);
    };

    const handlePeriodoClose = () => {
        setPeriodoAnchor(null);
    };

    // Controle de exibição de popovers
    const miniCalendarOpen = Boolean(miniCalendarAnchor);
    const periodoOpen = Boolean(periodoAnchor);

    // Renderização condicional para diferentes visualizações
    const renderizarConteudo = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, bgcolor: 'background.paper' }}>
                    <Typography variant="body1">Carregando...</Typography>
                </Box>
            );
        }

        // Visualização diária
        if (activeView === 'day') {
            return (
                <Paper sx={{ overflow: 'hidden', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    {/* Cabeçalho do dia */}
                    <Grid container sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Grid item xs={6} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                {diasSemanaCompletos[selectedDate.getDay()]}
                            </Typography>
                            <Typography variant="h4" fontWeight="medium" color="text.primary">
                                {selectedDate.getDate()}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ p: 2, textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                                {`${selectedDate.getDate()} de ${meses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Slots de horas do dia */}
                    {visibleTimeSlots.map((hora) => {
                        const isHoraAtual = hora === horaAtual && new Date().toDateString() === selectedDate.toDateString();
                        const eventos = encontrarEventos(selectedDate, hora);

                        return (
                            <Box
                                key={hora}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    bgcolor: isHoraAtual ? 'primary.lighter' : 'background.paper',
                                    borderBottom: hora < visibleTimeSlots[visibleTimeSlots.length-1] ? 1 : 0,
                                    borderColor: 'divider'
                                }}
                            >
                                {/* Marcador de hora */}
                                <Box sx={{ p: 1, borderRight: 1, borderColor: 'divider', position: 'relative', minHeight: 80 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ position: 'absolute', top: 8, left: 16, fontWeight: 'medium', color: 'text.secondary' }}
                                    >
                                        {formatarHora(hora)}
                                    </Typography>

                                    {/* Indicador de hora atual */}
                                    {isHoraAtual && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: 0,
                                                right: 0,
                                                height: 2,
                                                bgcolor: 'error.main',
                                                zIndex: 1,
                                                top: '50%'
                                            }}
                                        />
                                    )}

                                    {/* Eventos */}
                                    <Box sx={{ pt: 8, px: 2, position: 'relative' }}>
                                        {eventos.map((evento, i) => (
                                            <EventoCard
                                                key={i}
                                                evento={evento}
                                                onClick={manipularClickEvento}
                                                onStatusChange={alterarStatusConsulta}
                                                onDelete={excluirConsulta}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Paper>
            );
        }

        // Visualização semanal
        if (activeView === 'week') {
            return (
                <Paper sx={{ overflow: 'hidden', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    {/* Cabeçalho dos dias da semana */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
                        {/* Célula vazia para o canto superior esquerdo */}
                        <Box sx={{ p: 1, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right', display: 'block', pr: 1 }}>
                                EST<br />GMT-3
                            </Typography>
                        </Box>

                        {/* Dias da semana */}
                        {currentWeek.map((dia, index) => {
                            const isToday = new Date().toDateString() === dia.toDateString();
                            return (
                                <DiaCell
                                    key={index}
                                    dia={dia}
                                    eventos={eventos}
                                    isToday={isToday}
                                    onClick={selecionarDia}
                                    activeView={activeView}
                                />
                            );
                        })}
                    </Box>

                    {/* Slots de horas - apenas horários relevantes */}
                    {visibleTimeSlots.map((hora) => {
                        const isHoraAtual = hora === horaAtual;

                        return (
                            <Box
                                key={hora}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto repeat(7, 1fr)',
                                    bgcolor: isHoraAtual ? 'primary.lighter' : 'background.paper',
                                    borderBottom: hora < visibleTimeSlots[visibleTimeSlots.length-1] ? 1 : 0,
                                    borderColor: 'divider'
                                }}
                            >
                                {/* Marcador de hora */}
                                <Box sx={{ p: 1, borderRight: 1, borderColor: 'divider', position: 'relative', minHeight: 64 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{ position: 'absolute', top: 0, right: 8, color: 'text.secondary' }}
                                    >
                                        {formatarHora(hora)}
                                    </Typography>

                                    {/* Indicador de hora atual */}
                                    {isHoraAtual && (
                                        <Box sx={{ position: 'absolute', top: 4, left: 8 }}>
                                            <AccessTime sx={{ fontSize: 14, color: 'primary.main' }} />
                                        </Box>
                                    )}
                                </Box>

                                {/* Células para cada dia da semana */}
                                {currentWeek.map((dia, index) => {
                                    const eventos = encontrarEventos(dia, hora);
                                    const isTerça = dia.getDay() === 2;
                                    const isToday = new Date().toDateString() === dia.toDateString();

                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                p: 0,
                                                position: 'relative',
                                                minHeight: 64,
                                                transition: 'background-color 0.2s',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                bgcolor: (isTerça || (isToday && isHoraAtual)) ? 'primary.lighter' : 'background.paper',
                                                borderRight: index < 6 ? 1 : 0,
                                                borderColor: 'divider'
                                            }}
                                            onClick={() => selecionarDia(dia)}
                                        >
                                            {/* Linha vermelha para horário atual se for hoje */}
                                            {isToday && isHoraAtual && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        right: 0,
                                                        height: 2,
                                                        bgcolor: 'error.main',
                                                        zIndex: 1
                                                    }}
                                                />
                                            )}

                                            {/* Renderizar eventos para este dia e hora */}
                                            {eventos.map((evento, i) => (
                                                <EventoCard
                                                    key={i}
                                                    evento={evento}
                                                    onClick={manipularClickEvento}
                                                    onStatusChange={alterarStatusConsulta}
                                                    onDelete={excluirConsulta}
                                                />
                                            ))}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Paper>
            );
        }

        // Visualização mensal
        if (activeView === 'month') {
            return (
                <Paper sx={{ overflow: 'hidden', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    {/* Cabeçalho dos dias da semana */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
                        {diasSemana.map((dia, index) => (
                            <Box key={index} sx={{ p: 1, textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                                    {dia}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Grade do mês */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {diasDoMes.map((dia, index) => {
                            const isToday = new Date().toDateString() === dia.toDateString();
                            const isOutsideMonth = dia.getMonth() !== currentDate.getMonth();
                            return (
                                <DiaCell
                                    key={index}
                                    dia={dia}
                                    eventos={eventos}
                                    isToday={isToday}
                                    onClick={selecionarDia}
                                    activeView={activeView}
                                    isOutsideMonth={isOutsideMonth}
                                />
                            );
                        })}
                    </Box>
                </Paper>
            );
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%', bgcolor: 'background.default', borderRadius: 2, boxShadow: 1, fontFamily: 'sans-serif' }}>
            {/* Cabeçalho do Calendário */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }} ref={miniCalendarRef}>
                        <Button
                            variant="contained"
                            startIcon={<DateRange />}
                            onClick={handleMiniCalendarOpen}
                            size="small"
                        >
                            Hoje
                        </Button>

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
                        >
                            <Box sx={{ p: 2, width: 280 }}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newDate = new Date(miniCalendarDate);
                                                newDate.setMonth(newDate.getMonth() - 1);
                                                setMiniCalendarDate(newDate);
                                            }}
                                        >
                                            <KeyboardArrowLeft />
                                        </IconButton>

                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {meses[miniCalendarDate.getMonth()]} {miniCalendarDate.getFullYear()}
                                        </Typography>

                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newDate = new Date(miniCalendarDate);
                                                newDate.setMonth(newDate.getMonth() + 1);
                                                setMiniCalendarDate(newDate);
                                            }}
                                        >
                                            <KeyboardArrowRight />
                                        </IconButton>
                                    </Box>

                                    {/* Dias da semana */}
                                    <Grid container spacing={0.5} mb={0.5}>
                                        {diasSemana.map((d, i) => (
                                            <Grid item xs={12/7} key={i} textAlign="center">
                                                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                                    {d.charAt(0)}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Grade do mini calendário */}
                                    <Grid container spacing={0.5}>
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
                                                            bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.lighter' : 'transparent',
                                                            color: isSelected
                                                                ? 'white'
                                                                : isOutsideMonth
                                                                    ? 'text.disabled'
                                                                    : isToday
                                                                        ? 'primary.main'
                                                                        : 'text.primary',
                                                            '&:hover': {
                                                                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDate(dia);
                                                            setCurrentDate(dia);
                                                            setActiveView('day');
                                                            handleMiniCalendarClose();
                                                        }}
                                                    >
                                                        {dia.getDate()}
                                                    </Button>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>

                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navegarParaHoje();
                                            handleMiniCalendarClose();
                                        }}
                                    >
                                        Hoje
                                    </Button>
                                </Box>
                            </Box>
                        </Popover>
                    </Box>

                    <Box sx={{ display: 'flex' }}>
                        <IconButton onClick={navegarAnterior} size="small">
                            <KeyboardArrowLeft />
                        </IconButton>
                        <IconButton onClick={navegarProximo} size="small">
                            <KeyboardArrowRight />
                        </IconButton>
                    </Box>

                    <Typography variant="h5" fontWeight="medium" color="text.primary">
                        {activeView === 'day'
                            ? `${selectedDate.getDate()} de ${meses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`
                            : currentMonthName}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<Add />}
                        size="small"
                        onClick={manipularCliqueCriarEvento}
                    >
                        Nova Consulta
                    </Button>

                    <Box sx={{ position: 'relative' }} ref={periodoRef}>
                        <Button
                            variant="outlined"
                            endIcon={<KeyboardArrowDown />}
                            size="small"
                            onClick={handlePeriodoOpen}
                        >
                            Período
                        </Button>

                        <Popover
                            open={periodoOpen}
                            anchorEl={periodoAnchor}
                            onClose={handlePeriodoClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <Box sx={{ width: 160 }}>
                                <Button
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        px: 2,
                                        py: 1,
                                        textAlign: 'left',
                                        bgcolor: activeView === 'day' ? 'primary.lighter' : 'transparent',
                                        color: activeView === 'day' ? 'primary.main' : 'text.primary',
                                        fontWeight: activeView === 'day' ? 'medium' : 'regular'
                                    }}
                                    onClick={() => alterarVisualizacao('day')}
                                >
                                    Dia
                                </Button>
                                <Button
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        px: 2,
                                        py: 1,
                                        textAlign: 'left',
                                        bgcolor: activeView === 'week' ? 'primary.lighter' : 'transparent',
                                        color: activeView === 'week' ? 'primary.main' : 'text.primary',
                                        fontWeight: activeView === 'week' ? 'medium' : 'regular'
                                    }}
                                    onClick={() => alterarVisualizacao('week')}
                                >
                                    Semana
                                </Button>
                                <Button
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        px: 2,
                                        py: 1,
                                        textAlign: 'left',
                                        bgcolor: activeView === 'month' ? 'primary.lighter' : 'transparent',
                                        color: activeView === 'month' ? 'primary.main' : 'text.primary',
                                        fontWeight: activeView === 'month' ? 'medium' : 'regular'
                                    }}
                                    onClick={() => alterarVisualizacao('month')}
                                >
                                    Mês
                                </Button>
                            </Box>
                        </Popover>
                    </Box>
                </Box>
            </Box>

            {/* Conteúdo do calendário */}
            {renderizarConteudo()}

            {/* Modal para criar/editar eventos */}
            <EventoModal
                isOpen={showEventoModal}
                onClose={() => setShowEventoModal(false)}
                onSave={salvarEvento}
                evento={eventoSelecionado}
                pacientes={pacientes}
                doctorId={doctorId}
            />
        </Box>
    );
};

export default AgendaMedica;