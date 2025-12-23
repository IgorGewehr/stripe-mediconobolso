"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { prescriptionsService } from '@/lib/services/api';

/**
 * Hook for managing prescriptions state and operations
 * Provides CRUD, signing, and PDF generation functionality
 */
const usePrescriptions = (options = {}) => {
  const { autoLoad = false, patientId = null } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMedications, setLoadingMedications] = useState(false);
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
    startDate: null,
    endDate: null,
  });

  /**
   * Load prescriptions list
   */
  const loadPrescriptions = useCallback(async (page = 1) => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await prescriptionsService.list({
        page,
        perPage: pagination.perPage,
        patientId: patientId || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      setPrescriptions(response.items);
      setPagination((prev) => ({
        ...prev,
        page: response.page,
        total: response.total,
      }));
    } catch (err) {
      console.error('[usePrescriptions] Error loading prescriptions:', err);
      setError('Erro ao carregar prescrições');
    } finally {
      setLoading(false);
    }
  }, [doctorId, patientId, filters, pagination.perPage]);

  /**
   * Load prescriptions for a specific patient
   */
  const loadByPatient = useCallback(async (pId) => {
    if (!doctorId) return [];

    setLoading(true);

    try {
      const data = await prescriptionsService.getByPatient(pId);
      return data;
    } catch (err) {
      console.error('[usePrescriptions] Error loading patient prescriptions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Get prescription by ID
   */
  const getPrescription = useCallback(async (prescriptionId) => {
    if (!doctorId) return null;

    setLoading(true);

    try {
      const prescription = await prescriptionsService.getById(prescriptionId);
      setSelectedPrescription(prescription);
      return prescription;
    } catch (err) {
      console.error('[usePrescriptions] Error getting prescription:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Create new prescription
   */
  const createPrescription = useCallback(async (pId, prescriptionData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newPrescription = await prescriptionsService.create(pId, prescriptionData);
      setPrescriptions((prev) => [newPrescription, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      return newPrescription;
    } catch (err) {
      console.error('[usePrescriptions] Error creating prescription:', err);
      setError('Erro ao criar prescrição');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update prescription
   */
  const updatePrescription = useCallback(async (prescriptionId, prescriptionData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await prescriptionsService.update(prescriptionId, prescriptionData);

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === prescriptionId ? updated : p))
      );

      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(updated);
      }

      return updated;
    } catch (err) {
      console.error('[usePrescriptions] Error updating prescription:', err);
      setError('Erro ao atualizar prescrição');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPrescription?.id]);

  /**
   * Delete prescription
   */
  const deletePrescription = useCallback(async (pId, prescriptionId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await prescriptionsService.delete(pId, prescriptionId);

      setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(null);
      }

      return true;
    } catch (err) {
      console.error('[usePrescriptions] Error deleting prescription:', err);
      setError('Erro ao excluir prescrição');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPrescription?.id]);

  /**
   * Cancel prescription
   */
  const cancelPrescription = useCallback(async (prescriptionId, reason) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const prescription = await prescriptionsService.cancel(prescriptionId, reason);

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === prescriptionId ? prescription : p))
      );

      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(prescription);
      }

      return prescription;
    } catch (err) {
      console.error('[usePrescriptions] Error cancelling prescription:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPrescription?.id]);

  /**
   * Sign prescription digitally
   */
  const signPrescription = useCallback(async (prescriptionId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const prescription = await prescriptionsService.sign(prescriptionId);

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === prescriptionId ? prescription : p))
      );

      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(prescription);
      }

      return prescription;
    } catch (err) {
      console.error('[usePrescriptions] Error signing prescription:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedPrescription?.id]);

  /**
   * Download prescription PDF
   */
  const downloadPdf = useCallback(async (prescriptionId) => {
    if (!doctorId) return;

    try {
      const blob = await prescriptionsService.downloadPdf(prescriptionId);
      return blob;
    } catch (err) {
      console.error('[usePrescriptions] Error downloading PDF:', err);
      throw err;
    }
  }, [doctorId]);

  /**
   * Load available medications
   */
  const loadMedications = useCallback(async () => {
    if (!doctorId) return;

    setLoadingMedications(true);

    try {
      const data = await prescriptionsService.listMedications();
      setMedications(data);
    } catch (err) {
      console.error('[usePrescriptions] Error loading medications:', err);
    } finally {
      setLoadingMedications(false);
    }
  }, [doctorId]);

  /**
   * Search medications
   */
  const searchMedications = useCallback(async (term) => {
    if (!doctorId || !term) return [];

    try {
      return await prescriptionsService.searchMedications(term);
    } catch (err) {
      console.error('[usePrescriptions] Error searching medications:', err);
      return [];
    }
  }, [doctorId]);

  /**
   * Create custom medication
   */
  const createMedication = useCallback(async (medicationData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    try {
      const medication = await prescriptionsService.createMedication(medicationData);
      setMedications((prev) => [...prev, medication]);
      return medication;
    } catch (err) {
      console.error('[usePrescriptions] Error creating medication:', err);
      throw err;
    }
  }, [doctorId]);

  /**
   * Select a prescription
   */
  const selectPrescription = useCallback((prescriptionId) => {
    if (prescriptionId) {
      const prescription = prescriptions.find((p) => p.id === prescriptionId);
      setSelectedPrescription(prescription || null);
    } else {
      setSelectedPrescription(null);
    }
  }, [prescriptions]);

  /**
   * Refresh prescriptions list
   */
  const refresh = useCallback(() => {
    loadPrescriptions(pagination.page);
  }, [loadPrescriptions, pagination.page]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    loadPrescriptions(page);
  }, [loadPrescriptions]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: pagination.total,
    signed: prescriptions.filter((p) => p.isSigned).length,
    pending: prescriptions.filter((p) => !p.isSigned && p.status !== 'cancelled').length,
    cancelled: prescriptions.filter((p) => p.status === 'cancelled').length,
  }), [prescriptions, pagination.total]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && doctorId) {
      loadPrescriptions(1);
    }
  }, [autoLoad, doctorId]);

  // Load medications on mount
  useEffect(() => {
    if (doctorId) {
      loadMedications();
    }
  }, [doctorId, loadMedications]);

  return {
    // State
    prescriptions,
    selectedPrescription,
    medications,
    loading,
    loadingMedications,
    saving,
    error,
    pagination,
    stats,

    // Filters
    filters,
    setFilters,

    // Actions
    loadPrescriptions,
    loadByPatient,
    getPrescription,
    createPrescription,
    updatePrescription,
    deletePrescription,
    cancelPrescription,
    signPrescription,
    downloadPdf,
    loadMedications,
    searchMedications,
    createMedication,
    selectPrescription,
    refresh,
    goToPage,

    // Context
    doctorId,
    isSecretary,
  };
};

export default usePrescriptions;
