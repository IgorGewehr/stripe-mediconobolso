"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { appointmentsService } from '@/lib/services/api';

/**
 * Hook for managing appointments state and operations
 * Provides scheduling, status updates, and calendar functionality
 */
const useAppointments = (options = {}) => {
  const { autoLoad = true, initialDate = new Date() } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dayStats, setDayStats] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    professionalId: null,
  });

  /**
   * Format date for API
   */
  const formatDateForApi = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  /**
   * Load appointments for a specific date
   */
  const loadAppointmentsByDate = useCallback(async (date = selectedDate) => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const dateStr = formatDateForApi(date);
      const data = await appointmentsService.getByDate(dateStr, filters.professionalId);
      setAppointments(data);

      // Also load day stats
      const stats = await appointmentsService.getDayStats(dateStr, filters.professionalId);
      setDayStats(stats);
    } catch (err) {
      console.error('[useAppointments] Error loading appointments:', err);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedDate, filters.professionalId]);

  /**
   * Load appointments for a patient
   */
  const loadAppointmentsByPatient = useCallback(async (patientId) => {
    if (!doctorId) return [];

    setLoading(true);

    try {
      const data = await appointmentsService.getByPatient(patientId);
      return data;
    } catch (err) {
      console.error('[useAppointments] Error loading patient appointments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Get upcoming appointments for a patient
   */
  const getUpcomingByPatient = useCallback(async (patientId, limit = 5) => {
    if (!doctorId) return [];

    try {
      return await appointmentsService.getUpcomingByPatient(patientId, limit);
    } catch (err) {
      console.error('[useAppointments] Error getting upcoming appointments:', err);
      return [];
    }
  }, [doctorId]);

  /**
   * Get appointment by ID
   */
  const getAppointment = useCallback(async (appointmentId) => {
    if (!doctorId) return null;

    try {
      const appointment = await appointmentsService.getById(appointmentId);
      setSelectedAppointment(appointment);
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error getting appointment:', err);
      return null;
    }
  }, [doctorId]);

  /**
   * Create new appointment
   */
  const createAppointment = useCallback(async (appointmentData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newAppointment = await appointmentsService.create(appointmentData);

      // Add to list if same date
      const appointmentDate = formatDateForApi(newAppointment.startTime);
      const currentDate = formatDateForApi(selectedDate);

      if (appointmentDate === currentDate) {
        setAppointments((prev) => [...prev, newAppointment].sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        ));
      }

      return newAppointment;
    } catch (err) {
      console.error('[useAppointments] Error creating appointment:', err);
      setError('Erro ao criar agendamento');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedDate]);

  /**
   * Update appointment
   */
  const updateAppointment = useCallback(async (appointmentId, appointmentData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updatedAppointment = await appointmentsService.update(appointmentId, appointmentData);

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? updatedAppointment : a))
      );

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(updatedAppointment);
      }

      return updatedAppointment;
    } catch (err) {
      console.error('[useAppointments] Error updating appointment:', err);
      setError('Erro ao atualizar agendamento');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedAppointment?.id]);

  /**
   * Delete appointment
   */
  const deleteAppointment = useCallback(async (appointmentId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await appointmentsService.delete(appointmentId);

      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(null);
      }

      return true;
    } catch (err) {
      console.error('[useAppointments] Error deleting appointment:', err);
      setError('Erro ao excluir agendamento');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedAppointment?.id]);

  /**
   * Confirm appointment
   */
  const confirmAppointment = useCallback(async (appointmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.confirm(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error confirming appointment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Cancel appointment
   */
  const cancelAppointment = useCallback(async (appointmentId, reason) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.cancel(appointmentId, reason);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error cancelling appointment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Check-in (patient arrived)
   */
  const checkIn = useCallback(async (appointmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.checkIn(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error checking in:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Start appointment
   */
  const startAppointment = useCallback(async (appointmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.start(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error starting appointment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Complete appointment
   */
  const completeAppointment = useCallback(async (appointmentId, notes) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.complete(appointmentId, notes);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error completing appointment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Mark as no-show
   */
  const markNoShow = useCallback(async (appointmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const appointment = await appointmentsService.noShow(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? appointment : a))
      );
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Error marking no-show:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Check for time conflicts
   */
  const checkConflict = useCallback(async (startTime, endTime, excludeId) => {
    if (!doctorId) return false;

    try {
      return await appointmentsService.checkConflict(
        filters.professionalId || doctorId,
        startTime,
        endTime,
        excludeId
      );
    } catch (err) {
      console.error('[useAppointments] Error checking conflict:', err);
      return false;
    }
  }, [doctorId, filters.professionalId]);

  /**
   * Change selected date
   */
  const changeDate = useCallback((newDate) => {
    setSelectedDate(newDate);
  }, []);

  /**
   * Select an appointment
   */
  const selectAppointment = useCallback((appointmentId) => {
    if (appointmentId) {
      const appointment = appointments.find((a) => a.id === appointmentId);
      setSelectedAppointment(appointment || null);
    } else {
      setSelectedAppointment(null);
    }
  }, [appointments]);

  /**
   * Refresh appointments
   */
  const refresh = useCallback(() => {
    loadAppointmentsByDate(selectedDate);
  }, [loadAppointmentsByDate, selectedDate]);

  // Filter appointments client-side
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filters.status !== 'all' && apt.status !== filters.status) return false;
      if (filters.type !== 'all' && apt.type !== filters.type) return false;
      return true;
    });
  }, [appointments, filters]);

  // Group appointments by time slot
  const groupedByHour = useMemo(() => {
    const groups = {};
    filteredAppointments.forEach((apt) => {
      const hour = new Date(apt.startTime).getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    return groups;
  }, [filteredAppointments]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === 'Agendado').length,
    confirmed: appointments.filter((a) => a.status === 'Confirmado').length,
    checkedIn: appointments.filter((a) => a.status === 'Chegou').length,
    inProgress: appointments.filter((a) => a.status === 'Em Atendimento').length,
    completed: appointments.filter((a) => a.status === 'Finalizado').length,
    cancelled: appointments.filter((a) => a.status === 'Cancelado').length,
    noShow: appointments.filter((a) => a.status === 'Faltou').length,
    ...dayStats,
  }), [appointments, dayStats]);

  // Auto-load on mount and date change
  useEffect(() => {
    if (autoLoad && doctorId) {
      loadAppointmentsByDate(selectedDate);
    }
  }, [autoLoad, doctorId, selectedDate]);

  return {
    // State
    appointments: filteredAppointments,
    allAppointments: appointments,
    selectedAppointment,
    loading,
    saving,
    error,
    selectedDate,
    stats,
    groupedByHour,

    // Filters
    filters,
    setFilters,

    // Actions
    loadAppointmentsByDate,
    loadAppointmentsByPatient,
    getUpcomingByPatient,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    confirmAppointment,
    cancelAppointment,
    checkIn,
    startAppointment,
    completeAppointment,
    markNoShow,
    checkConflict,
    changeDate,
    selectAppointment,
    refresh,

    // Context
    doctorId,
    isSecretary,
  };
};

export default useAppointments;
