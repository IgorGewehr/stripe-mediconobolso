import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Circle, Calendar, Clock, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

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
            <div
                onClick={() => onClick(dia)}
                className={`p-1 h-24 border-r border-b relative hover:bg-gray-50 transition-colors cursor-pointer
          ${isToday ? 'bg-blue-50' : ''} 
          ${isOutsideMonth ? 'opacity-50' : ''}`}
            >
                <div className={`text-right p-1 ${isToday ? 'font-bold text-blue-600' : ''}`}>
                    {dia.getDate()}
                </div>

                {/* Eventos do dia em visualização compacta */}
                <div className="mt-1">
                    {eventosDia.slice(0, 3).map((evento, idx) => {
                        const statusClass = getStatusColor(evento.status).dot;
                        return (
                            <div key={idx} className="text-xs truncate mb-1 pl-3 relative">
                                <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${statusClass}`}></span>
                                {evento.horaInicio} {evento.nome.substring(0, 12)}
                                {evento.nome.length > 12 ? '...' : ''}
                            </div>
                        );
                    })}

                    {eventosDia.length > 3 && (
                        <div className="text-xs text-blue-600 pl-2">
                            +{eventosDia.length - 3} mais
                        </div>
                    )}
                </div>

                {/* Indicador de hoje */}
                {isToday && <div className="absolute top-1 left-1 h-2 w-2 bg-blue-600 rounded-full"></div>}
            </div>
        );
    }

    // Visualização padrão para dia na semana
    return (
        <div
            onClick={() => onClick(dia)}
            className={`p-2 text-center relative transition-colors cursor-pointer hover:bg-gray-50
        ${isTerça ? 'bg-blue-50' : ''}
        ${isToday ? 'bg-blue-50' : ''}
        border-r`}
        >
            <div className="text-xs text-gray-500 font-medium">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana]}
            </div>
            <div className={`text-2xl font-semibold 
        ${isToday ? 'text-blue-600' : isTerça ? 'text-blue-600' : 'text-gray-800'}`}
            >
                {dia.getDate()}
            </div>

            {/* Indicador de número de eventos */}
            {eventosDia.length > 0 && (
                <div className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    {eventosDia.length}
                </div>
            )}

            {/* Marcador de dia atual */}
            {isToday && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-t-lg"></div>
            )}
        </div>
    );
});

// Componente otimizado para eventos
const EventoCard = memo(({ evento, onClick }) => {
    const { horaInicio, horaFim, nome, status } = evento;
    const statusClasses = getStatusColor(status);

    return (
        <div
            onClick={() => onClick(evento)}
            className={`absolute left-0 right-0 mx-0.5 rounded-md overflow-hidden shadow-sm
        ${statusClasses.container} ${statusClasses.border} transition-transform
        hover:shadow-md hover:scale-[1.01] cursor-pointer`}
            style={{ top: '2px', bottom: '2px', zIndex: 10 }}
        >
            <div className="p-2">
                <div className="text-xs text-gray-600 font-medium">
                    {horaInicio} - {horaFim}
                </div>
                <div className="font-medium text-sm truncate">
                    {nome}
                </div>
                {status && (
                    <div className="mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusClasses.badge}`}>
              {status}
            </span>
                    </div>
                )}
            </div>
        </div>
    );
});

// Função utilitária para obter cores com base no status
function getStatusColor(status) {
    if (!status) return {
        container: 'bg-gray-100',
        badge: 'bg-gray-500 text-white',
        border: 'border-l-4 border-gray-400',
        dot: 'bg-gray-500'
    };

    switch (status.toLowerCase()) {
        case 'confirmado':
            return {
                container: 'bg-green-100',
                badge: 'bg-green-500 text-white',
                border: 'border-l-4 border-green-500',
                dot: 'bg-green-500'
            };
        case 'a confirmar':
            return {
                container: 'bg-blue-100',
                badge: 'bg-blue-500 text-white',
                border: 'border-l-4 border-blue-500',
                dot: 'bg-blue-500'
            };
        case 'cancelado':
            return {
                container: 'bg-red-100',
                badge: 'bg-red-500 text-white',
                border: 'border-l-4 border-red-500',
                dot: 'bg-red-500'
            };
        default:
            return {
                container: 'bg-gray-100',
                badge: 'bg-gray-500 text-white',
                border: 'border-l-4 border-gray-400',
                dot: 'bg-gray-500'
            };
    }
}

// Componente principal de Agenda
const AgendaProfissional = ({ eventos = [] }) => {
    // Refs para detectar cliques fora dos dropdowns
    const miniCalendarRef = useRef(null);
    const periodoDropdownRef = useRef(null);

    // Estados para controle do calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState('week'); // 'day', 'week', 'month'
    const [visibleTimeSlots, setVisibleTimeSlots] = useState([]);
    const [showMiniCalendar, setShowMiniCalendar] = useState(false);
    const [showPeriodoDropdown, setShowPeriodoDropdown] = useState(false);
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

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

    // Efeito para detectar cliques fora dos dropdowns
    useEffect(() => {
        function handleClickOutside(event) {
            if (miniCalendarRef.current && !miniCalendarRef.current.contains(event.target)) {
                setShowMiniCalendar(false);
            }
            if (periodoDropdownRef.current && !periodoDropdownRef.current.contains(event.target)) {
                setShowPeriodoDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
    }, []);

    const selecionarDia = useCallback((dia) => {
        setSelectedDate(dia);
        if (activeView === 'month') {
            setActiveView('day');
        }
    }, [activeView]);

    const manipularClickEvento = useCallback((evento) => {
        console.log('Evento clicado:', evento);
        // Aqui você pode implementar lógica para editar o evento, etc.
    }, []);

    // Renderização condicional para diferentes visualizações
    const renderizarConteudo = () => {
        // Visualização diária
        if (activeView === 'day') {
            return (
                <div className="overflow-hidden border-b rounded-b-lg bg-white">
                    {/* Cabeçalho do dia */}
                    <div className="grid grid-cols-2 border-b">
                        <div className="p-4 text-center">
                            <div className="text-sm text-gray-500 font-medium">
                                {diasSemanaCompletos[selectedDate.getDay()]}
                            </div>
                            <div className="text-2xl font-semibold text-gray-800">
                                {selectedDate.getDate()}
                            </div>
                        </div>
                        <div className="p-4 text-right">
                            <div className="text-sm text-gray-500">
                                {`${selectedDate.getDate()} de ${meses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`}
                            </div>
                        </div>
                    </div>

                    {/* Slots de horas do dia */}
                    {visibleTimeSlots.map((hora) => {
                        const isHoraAtual = hora === horaAtual && new Date().toDateString() === selectedDate.toDateString();
                        const eventos = encontrarEventos(selectedDate, hora);

                        return (
                            <div
                                key={hora}
                                className={`grid grid-cols-1 ${isHoraAtual ? 'bg-blue-50/30' : ''} ${hora < visibleTimeSlots[visibleTimeSlots.length-1] ? 'border-b' : ''}`}
                            >
                                {/* Marcador de hora */}
                                <div className="p-2 border-r relative min-h-20">
                                    <div className="absolute top-2 left-4 text-sm font-medium text-gray-700">
                                        {formatarHora(hora)}
                                    </div>

                                    {/* Indicador de hora atual */}
                                    {isHoraAtual && (
                                        <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 top-1/2"></div>
                                    )}

                                    {/* Eventos */}
                                    <div className="pt-8 px-4 relative">
                                        {eventos.map((evento, i) => (
                                            <EventoCard
                                                key={i}
                                                evento={evento}
                                                onClick={manipularClickEvento}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Visualização semanal
        if (activeView === 'week') {
            return (
                <div className="overflow-hidden border-b rounded-b-lg bg-white">
                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-8 border-b">
                        {/* Célula vazia para o canto superior esquerdo */}
                        <div className="p-2 border-r text-center text-xs text-gray-400">
                            <div className="text-right pr-2 font-normal">
                                EST<br />GMT-3
                            </div>
                        </div>

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
                    </div>

                    {/* Slots de horas - apenas horários relevantes */}
                    {visibleTimeSlots.map((hora) => {
                        const isHoraAtual = hora === horaAtual;

                        return (
                            <div
                                key={hora}
                                className={`grid grid-cols-8 ${isHoraAtual ? 'bg-blue-50/30' : ''} ${hora < visibleTimeSlots[visibleTimeSlots.length-1] ? 'border-b' : ''}`}
                            >
                                {/* Marcador de hora */}
                                <div className="p-2 border-r relative min-h-16">
                                    <div className="absolute top-0 right-2 text-xs text-gray-500">
                                        {formatarHora(hora)}
                                    </div>

                                    {/* Indicador de hora atual */}
                                    {isHoraAtual && (
                                        <div className="absolute top-1 left-2">
                                            <Clock size={14} className="text-blue-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Células para cada dia da semana */}
                                {currentWeek.map((dia, index) => {
                                    const eventos = encontrarEventos(dia, hora);
                                    const isTerça = dia.getDay() === 2;
                                    const isToday = new Date().toDateString() === dia.toDateString();

                                    return (
                                        <div
                                            key={index}
                                            className={`p-0 relative min-h-16 transition-colors hover:bg-gray-50
                        ${isTerça ? 'bg-blue-50/50' : ''}
                        ${isToday && isHoraAtual ? 'bg-blue-50/50' : ''}
                        ${index < 6 ? 'border-r' : ''}`}
                                            onClick={() => selecionarDia(dia)}
                                        >
                                            {/* Linha vermelha para horário atual se for hoje */}
                                            {isToday && isHoraAtual && (
                                                <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"></div>
                                            )}

                                            {/* Renderizar eventos para este dia e hora */}
                                            {eventos.map((evento, i) => (
                                                <EventoCard
                                                    key={i}
                                                    evento={evento}
                                                    onClick={manipularClickEvento}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Visualização mensal
        if (activeView === 'month') {
            return (
                <div className="overflow-hidden border-b rounded-b-lg bg-white">
                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-7 border-b">
                        {diasSemana.map((dia, index) => (
                            <div key={index} className="p-2 text-center text-gray-500 font-medium">
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grade do mês */}
                    <div className="grid grid-cols-7">
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
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="w-full h-full bg-gray-50 font-sans rounded-lg shadow-sm">
            {/* Cabeçalho do Calendário */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-4">
                    <div className="relative" ref={miniCalendarRef}>
                        <button
                            onClick={() => setShowMiniCalendar(prev => !prev)}
                            className="px-4 py-2 rounded-lg shadow-sm bg-blue-600 text-white text-sm font-medium flex items-center hover:bg-blue-700 transition-colors"
                        >
                            <Calendar size={16} className="mr-2" />
                            Hoje
                        </button>

                        {/* Mini Calendário Popover */}
                        {showMiniCalendar && (
                            <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-72">
                                <div className="p-3 border-b border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <button
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newDate = new Date(miniCalendarDate);
                                                newDate.setMonth(newDate.getMonth() - 1);
                                                setMiniCalendarDate(newDate);
                                            }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        <div className="font-medium">
                                            {meses[miniCalendarDate.getMonth()]} {miniCalendarDate.getFullYear()}
                                        </div>

                                        <button
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newDate = new Date(miniCalendarDate);
                                                newDate.setMonth(newDate.getMonth() + 1);
                                                setMiniCalendarDate(newDate);
                                            }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Dias da semana */}
                                    <div className="grid grid-cols-7 mb-1">
                                        {diasSemana.map((d, i) => (
                                            <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">
                                                {d.charAt(0)}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grade do mini calendário */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {obterDiasDoMes(miniCalendarDate).map((dia, index) => {
                                            const isToday = new Date().toDateString() === dia.toDateString();
                                            const isSelected = selectedDate.toDateString() === dia.toDateString();
                                            const isOutsideMonth = dia.getMonth() !== miniCalendarDate.getMonth();

                                            return (
                                                <button
                                                    key={index}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm 
                            ${isToday ? 'bg-blue-100 text-blue-700' : ''}
                            ${isSelected ? 'bg-blue-600 text-white' : ''}
                            ${isOutsideMonth ? 'text-gray-400' : 'text-gray-700'}
                            ${!isOutsideMonth && !isToday && !isSelected ? 'hover:bg-gray-100' : ''}
                          `}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDate(dia);
                                                        setCurrentDate(dia);
                                                        setActiveView('day');
                                                        setShowMiniCalendar(false);
                                                    }}
                                                >
                                                    {dia.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-2 flex justify-between">
                                    <button
                                        className="w-full py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navegarParaHoje();
                                            setShowMiniCalendar(false);
                                        }}
                                    >
                                        Hoje
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex">
                        <button
                            onClick={navegarAnterior}
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={navegarProximo}
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <h1 className="text-2xl font-medium text-gray-800">
                        {activeView === 'day'
                            ? `${selectedDate.getDate()} de ${meses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`
                            : currentMonthName}
                    </h1>
                </div>

                <div className="flex items-center">
                    <div className="relative" ref={periodoDropdownRef}>
                        <button
                            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowPeriodoDropdown(prev => !prev)}
                        >
                            <span className="font-medium">Período</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${showPeriodoDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showPeriodoDropdown && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                                <div className="py-1">
                                    <button
                                        className={`w-full text-left px-4 py-2 text-sm ${activeView === 'day' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => {
                                            alterarVisualizacao('day');
                                            setShowPeriodoDropdown(false);
                                        }}
                                    >
                                        Dia
                                    </button>
                                    <button
                                        className={`w-full text-left px-4 py-2 text-sm ${activeView === 'week' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => {
                                            alterarVisualizacao('week');
                                            setShowPeriodoDropdown(false);
                                        }}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        className={`w-full text-left px-4 py-2 text-sm ${activeView === 'month' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => {
                                            alterarVisualizacao('month');
                                            setShowPeriodoDropdown(false);
                                        }}
                                    >
                                        Mês
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo do calendário */}
            {renderizarConteudo()}
        </div>
    );
};

// Componente principal com dados de exemplo
const AgendaApp = () => {
    // Dados de exemplo para eventos
    const eventosExemplo = [
        {
            id: 1,
            nome: 'Francisco Alberto',
            data: '2024-09-23',
            horaInicio: '09:00',
            horaFim: '10:00',
            status: 'Confirmado'
        },
        {
            id: 2,
            nome: 'Elisa Silva',
            data: '2024-09-23',
            horaInicio: '10:00',
            horaFim: '10:30',
            status: ''
        },
        {
            id: 3,
            nome: 'Roberto Domingo',
            data: '2024-09-23',
            horaInicio: '11:00',
            horaFim: '13:00',
            status: 'A Confirmar'
        },
        {
            id: 4,
            nome: 'Rodrigo Oliveira',
            data: '2024-09-25',
            horaInicio: '10:00',
            horaFim: '11:00',
            status: 'A Confirmar'
        },
        {
            id: 5,
            nome: 'Nivea Andrade',
            data: '2024-09-26',
            horaInicio: '10:00',
            horaFim: '11:00',
            status: 'Confirmado'
        },
        {
            id: 6,
            nome: 'Clara Santos',
            data: '2024-09-27',
            horaInicio: '11:00',
            horaFim: '12:00',
            status: 'Confirmado'
        }
    ];

    return (
        <div className="p-4">
            <AgendaProfissional eventos={eventosExemplo} />
        </div>
    );
};

export default AgendaApp;