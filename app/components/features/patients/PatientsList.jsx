"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Search, User, Calendar, Video } from "lucide-react";
import { Avatar, CircularProgress } from '@mui/material';
import { useAuth } from '../../providers/authProvider';
import { format, startOfDay, isAfter, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constantes de filtro
const VIEW_OPTIONS = {
    ALL: 'all',
    TODAY: 'today',
    UPCOMING: 'upcoming'
};

// Componente principal
const PatientsListCard = ({
    patients: initialPatients = [],
    consultations = [],
    loading = false,
    onPatientClick,
    viewOption: externalViewOption,
    hideHeader = false
}) => {
    const { user } = useAuth();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);

    // Usar viewOption externo se fornecido
    const viewOption = externalViewOption || VIEW_OPTIONS.ALL;

    // Sincronizar pacientes
    useEffect(() => {
        if (initialPatients && initialPatients.length > 0) {
            setPatients(initialPatients);
        }
    }, [initialPatients]);

    // Obter próxima consulta de um paciente
    const getNextAppointment = (patientId) => {
        const now = new Date();
        const patientConsultations = consultations
            .filter(c => c.patientId === patientId)
            .filter(c => {
                const consultDate = c.consultationDate instanceof Date
                    ? c.consultationDate
                    : c.consultationDate?.toDate?.() || new Date(c.consultationDate);
                return consultDate >= now;
            })
            .sort((a, b) => {
                const dateA = a.consultationDate instanceof Date ? a.consultationDate : new Date(a.consultationDate);
                const dateB = b.consultationDate instanceof Date ? b.consultationDate : new Date(b.consultationDate);
                return dateA - dateB;
            });

        return patientConsultations[0] || null;
    };

    // Verificar se paciente tem consulta hoje
    const hasAppointmentToday = (patientId) => {
        const today = startOfDay(new Date());
        return consultations.some(c => {
            if (c.patientId !== patientId) return false;
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate?.toDate?.() || new Date(c.consultationDate);
            return startOfDay(consultDate).getTime() === today.getTime();
        });
    };

    // Verificar se paciente tem consulta futura
    const hasUpcomingAppointment = (patientId) => {
        const tomorrow = addDays(startOfDay(new Date()), 1);
        return consultations.some(c => {
            if (c.patientId !== patientId) return false;
            const consultDate = c.consultationDate instanceof Date
                ? c.consultationDate
                : c.consultationDate?.toDate?.() || new Date(c.consultationDate);
            return isAfter(consultDate, tomorrow);
        });
    };

    // Filtrar pacientes
    const filteredPatients = useMemo(() => {
        let result = patients;

        // Filtro por viewOption
        if (viewOption === VIEW_OPTIONS.TODAY) {
            result = result.filter(p => hasAppointmentToday(p.id));
        } else if (viewOption === VIEW_OPTIONS.UPCOMING) {
            result = result.filter(p => hasUpcomingAppointment(p.id));
        }

        // Filtro por busca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                (p.patientName || p.name || '').toLowerCase().includes(term) ||
                (p.patientEmail || p.email || '').toLowerCase().includes(term) ||
                (p.patientPhone || p.phone || '').includes(term) ||
                (p.cpf || '').includes(term)
            );
        }

        return result;
    }, [patients, viewOption, searchTerm, consultations]);

    // Formatar data
    const formatDate = (date) => {
        if (!date) return '-';
        try {
            const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
            return format(d, "dd/MM/yyyy", { locale: ptBR });
        } catch {
            return '-';
        }
    };

    // Calcular idade
    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        try {
            const birth = birthDate instanceof Date ? birthDate : birthDate?.toDate?.() || new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return `${age} anos`;
        } catch {
            return '-';
        }
    };

    // Formatar gênero
    const formatGender = (gender) => {
        if (!gender) return '-';
        const g = gender.toLowerCase();
        if (g === 'm' || g === 'masculino' || g === 'male') return 'Masculino';
        if (g === 'f' || g === 'feminino' || g === 'female') return 'Feminino';
        return gender;
    };

    return (
        <div className="flex-1 flex flex-col rounded-xl border-none shadow-sm bg-white overflow-hidden">
            {/* Header com busca */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar pacientes por nome, e-mail ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <CircularProgress size={32} sx={{ color: '#6366F1' }} />
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <User className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-sm font-medium text-slate-700">Nenhum paciente encontrado</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {searchTerm ? 'Tente uma busca diferente' : 'Os pacientes aparecerão aqui'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Paciente</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">Gênero</th>
                                <th className="px-6 py-3 font-medium hidden lg:table-cell">Idade</th>
                                <th className="px-6 py-3 font-medium hidden xl:table-cell">Próxima Consulta</th>
                                <th className="px-6 py-3 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPatients.map((patient) => {
                                const nextAppt = getNextAppointment(patient.id);
                                const hasToday = hasAppointmentToday(patient.id);

                                return (
                                    <tr
                                        key={patient.id}
                                        onClick={() => onPatientClick?.(patient.id)}
                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        {/* Paciente */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={patient.photoURL || patient.avatar}
                                                    sx={{ width: 32, height: 32, bgcolor: '#E2E8F0' }}
                                                >
                                                    {(patient.patientName || patient.name)?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-800 truncate">
                                                        {patient.patientName || patient.name || 'Sem nome'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {patient.patientEmail || patient.email || patient.patientPhone || patient.phone || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Gênero */}
                                        <td className="px-6 py-3.5 hidden md:table-cell">
                                            <span className="text-slate-600">
                                                {formatGender(patient.gender || patient.sexo)}
                                            </span>
                                        </td>

                                        {/* Idade */}
                                        <td className="px-6 py-3.5 hidden lg:table-cell">
                                            <span className="text-slate-600">
                                                {calculateAge(patient.birthDate || patient.dataNascimento)}
                                            </span>
                                        </td>

                                        {/* Próxima Consulta */}
                                        <td className="px-6 py-3.5 hidden xl:table-cell">
                                            {nextAppt ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600">
                                                        {formatDate(nextAppt.consultationDate)}
                                                        {nextAppt.consultationTime && ` às ${nextAppt.consultationTime}`}
                                                    </span>
                                                    {nextAppt.isTelemedicine && (
                                                        <Video className="w-3.5 h-3.5 text-blue-500" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-3.5 text-right">
                                            {hasToday ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                                                    Hoje
                                                </span>
                                            ) : nextAppt ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                    Agendado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                                    Sem consulta
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PatientsListCard;
