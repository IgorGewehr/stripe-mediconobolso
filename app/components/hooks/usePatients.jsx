"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { patientsService } from '@/lib/services/api';

/**
 * Hook for managing patients state and operations
 * Provides CRUD operations and search functionality
 */
const usePatients = (options = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    favorites: false,
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters,
  });

  /**
   * Load patients list
   */
  const loadPatients = useCallback(async (page = 1) => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await patientsService.list({
        page,
        perPage: pagination.perPage,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        favorites: filters.favorites || undefined,
        includeInactive: filters.status === 'inactive',
      });

      setPatients(response.items);
      setPagination((prev) => ({
        ...prev,
        page: response.page,
        total: response.total,
      }));
    } catch (err) {
      console.error('[usePatients] Error loading patients:', err);
      setError('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }, [doctorId, filters, pagination.perPage]);

  /**
   * Get patient by ID
   */
  const getPatient = useCallback(async (patientId) => {
    if (!doctorId) return null;

    setLoadingDetails(true);
    setError(null);

    try {
      const patient = await patientsService.getById(patientId);
      setSelectedPatient(patient);
      return patient;
    } catch (err) {
      console.error('[usePatients] Error getting patient:', err);
      setError('Erro ao carregar detalhes do paciente');
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }, [doctorId]);

  /**
   * Get patient by CPF
   */
  const getPatientByCpf = useCallback(async (cpf) => {
    if (!doctorId) return null;

    try {
      return await patientsService.getByCpf(cpf);
    } catch (err) {
      console.error('[usePatients] Error getting patient by CPF:', err);
      return null;
    }
  }, [doctorId]);

  /**
   * Create new patient
   */
  const createPatient = useCallback(async (patientData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newPatient = await patientsService.create(patientData);
      setPatients((prev) => [newPatient, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      return newPatient;
    } catch (err) {
      console.error('[usePatients] Error creating patient:', err);
      setError('Erro ao criar paciente');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update existing patient
   */
  const updatePatient = useCallback(async (patientId, patientData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updatedPatient = await patientsService.update(patientId, patientData);

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(updatedPatient);
      }

      return updatedPatient;
    } catch (err) {
      console.error('[usePatients] Error updating patient:', err);
      setError('Erro ao atualizar paciente');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPatient?.id]);

  /**
   * Delete patient (soft delete)
   */
  const deletePatient = useCallback(async (patientId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await patientsService.delete(patientId);

      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }

      return true;
    } catch (err) {
      console.error('[usePatients] Error deleting patient:', err);
      setError('Erro ao excluir paciente');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPatient?.id]);

  /**
   * Reactivate patient
   */
  const reactivatePatient = useCallback(async (patientId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const patient = await patientsService.reactivate(patientId);

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? patient : p))
      );

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(patient);
      }

      return patient;
    } catch (err) {
      console.error('[usePatients] Error reactivating patient:', err);
      setError('Erro ao reativar paciente');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPatient?.id]);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (patientId) => {
    if (!doctorId) return;

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;

    const newFavorite = !patient.isFavorite;

    try {
      await patientsService.updateFavorite(patientId, newFavorite);

      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId ? { ...p, isFavorite: newFavorite } : p
        )
      );

      if (selectedPatient?.id === patientId) {
        setSelectedPatient((prev) =>
          prev ? { ...prev, isFavorite: newFavorite } : null
        );
      }
    } catch (err) {
      console.error('[usePatients] Error toggling favorite:', err);
    }
  }, [doctorId, patients, selectedPatient?.id]);

  /**
   * Update patient status
   */
  const updateStatus = useCallback(async (patientId, status, notes) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const patient = await patientsService.updateStatus(patientId, status, notes);

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, status } : p))
      );

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(patient);
      }

      return patient;
    } catch (err) {
      console.error('[usePatients] Error updating status:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPatient?.id]);

  /**
   * Get status history
   */
  const getStatusHistory = useCallback(async (patientId) => {
    if (!doctorId) return [];

    try {
      return await patientsService.getStatusHistory(patientId);
    } catch (err) {
      console.error('[usePatients] Error getting status history:', err);
      return [];
    }
  }, [doctorId]);

  /**
   * Search patients (local filter)
   */
  const searchPatients = useCallback((term) => {
    setFilters((prev) => ({ ...prev, search: term }));
  }, []);

  /**
   * Select a patient
   */
  const selectPatient = useCallback(async (patientId) => {
    if (patientId) {
      await getPatient(patientId);
    } else {
      setSelectedPatient(null);
    }
  }, [getPatient]);

  /**
   * Refresh patients list
   */
  const refresh = useCallback(() => {
    loadPatients(pagination.page);
  }, [loadPatients, pagination.page]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    loadPatients(page);
  }, [loadPatients]);

  // Filter patients client-side for local search
  const filteredPatients = useMemo(() => {
    if (!filters.search) return patients;

    const searchLower = filters.search.toLowerCase();
    return patients.filter((patient) => {
      const nameMatch = patient.name?.toLowerCase().includes(searchLower);
      const cpfMatch = patient.cpf?.includes(filters.search);
      const phoneMatch = patient.phone?.includes(filters.search);
      const emailMatch = patient.email?.toLowerCase().includes(searchLower);
      return nameMatch || cpfMatch || phoneMatch || emailMatch;
    });
  }, [patients, filters.search]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: pagination.total,
    active: patients.filter((p) => p.status === 'active' || p.isActive).length,
    favorites: patients.filter((p) => p.isFavorite).length,
  }), [patients, pagination.total]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && doctorId) {
      loadPatients(1);
    }
  }, [autoLoad, doctorId]);

  // Reload when filters change (debounced)
  useEffect(() => {
    if (!autoLoad || !doctorId) return;

    const timer = setTimeout(() => {
      loadPatients(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.status, filters.favorites, filters.sortBy, filters.sortOrder]);

  return {
    // State
    patients: filteredPatients,
    allPatients: patients,
    selectedPatient,
    loading,
    loadingDetails,
    saving,
    error,
    pagination,
    stats,

    // Filters
    filters,
    setFilters,
    searchPatients,

    // Actions
    loadPatients,
    getPatient,
    getPatientByCpf,
    createPatient,
    updatePatient,
    deletePatient,
    reactivatePatient,
    toggleFavorite,
    updateStatus,
    getStatusHistory,
    selectPatient,
    refresh,
    goToPage,

    // Context
    doctorId,
    isSecretary,
  };
};

export default usePatients;
