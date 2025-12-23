"use client";

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { examsService } from '@/lib/services/api';

/**
 * Hook for managing exams state and operations
 * Provides CRUD, status updates, and attachment handling
 */
const useExams = (options = {}) => {
  const { patientId = null } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // State
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [pendingExams, setPendingExams] = useState([]);
  const [abnormalExams, setAbnormalExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
  });

  /**
   * Load exams for a patient
   */
  const loadExamsByPatient = useCallback(async (pId = patientId) => {
    if (!doctorId || !pId) return [];

    setLoading(true);
    setError(null);

    try {
      const data = await examsService.listByPatient(pId);
      setExams(data);
      return data;
    } catch (err) {
      console.error('[useExams] Error loading exams:', err);
      setError('Erro ao carregar exames');
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId, patientId]);

  /**
   * Load pending exams
   */
  const loadPendingExams = useCallback(async () => {
    if (!doctorId) return [];

    setLoading(true);

    try {
      const data = await examsService.listPending();
      setPendingExams(data);
      return data;
    } catch (err) {
      console.error('[useExams] Error loading pending exams:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Load abnormal exams
   */
  const loadAbnormalExams = useCallback(async () => {
    if (!doctorId) return [];

    setLoading(true);

    try {
      const data = await examsService.listAbnormal();
      setAbnormalExams(data);
      return data;
    } catch (err) {
      console.error('[useExams] Error loading abnormal exams:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Get exam by ID
   */
  const getExam = useCallback(async (examId) => {
    if (!doctorId) return null;

    setLoading(true);

    try {
      const exam = await examsService.getById(examId);
      setSelectedExam(exam);
      return exam;
    } catch (err) {
      console.error('[useExams] Error getting exam:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Create new exam
   */
  const createExam = useCallback(async (pId, examData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newExam = await examsService.create(pId, examData);
      setExams((prev) => [newExam, ...prev]);
      return newExam;
    } catch (err) {
      console.error('[useExams] Error creating exam:', err);
      setError('Erro ao criar exame');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update exam
   */
  const updateExam = useCallback(async (examId, examData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await examsService.update(examId, examData);

      setExams((prev) =>
        prev.map((e) => (e.id === examId ? updated : e))
      );

      if (selectedExam?.id === examId) {
        setSelectedExam(updated);
      }

      return updated;
    } catch (err) {
      console.error('[useExams] Error updating exam:', err);
      setError('Erro ao atualizar exame');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Delete exam
   */
  const deleteExam = useCallback(async (pId, examId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await examsService.delete(pId, examId);

      setExams((prev) => prev.filter((e) => e.id !== examId));

      if (selectedExam?.id === examId) {
        setSelectedExam(null);
      }

      return true;
    } catch (err) {
      console.error('[useExams] Error deleting exam:', err);
      setError('Erro ao excluir exame');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Update exam status
   */
  const updateStatus = useCallback(async (examId, status) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const exam = await examsService.updateStatus(examId, status);

      setExams((prev) =>
        prev.map((e) => (e.id === examId ? exam : e))
      );

      if (selectedExam?.id === examId) {
        setSelectedExam(exam);
      }

      return exam;
    } catch (err) {
      console.error('[useExams] Error updating status:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Add result to exam
   */
  const addResult = useCallback(async (examId, resultData) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const exam = await examsService.addResult(examId, resultData);

      setExams((prev) =>
        prev.map((e) => (e.id === examId ? exam : e))
      );

      if (selectedExam?.id === examId) {
        setSelectedExam(exam);
      }

      return exam;
    } catch (err) {
      console.error('[useExams] Error adding result:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Upload attachment
   */
  const uploadAttachment = useCallback(async (examId, file) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const response = await examsService.uploadAttachment(examId, file);

      // Refresh exam to get updated attachments
      const exam = await examsService.getById(examId);

      setExams((prev) =>
        prev.map((e) => (e.id === examId ? exam : e))
      );

      if (selectedExam?.id === examId) {
        setSelectedExam(exam);
      }

      return response;
    } catch (err) {
      console.error('[useExams] Error uploading attachment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Remove attachment
   */
  const removeAttachment = useCallback(async (examId, attachmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      await examsService.removeAttachment(examId, attachmentId);

      // Update local state
      setExams((prev) =>
        prev.map((e) => {
          if (e.id === examId) {
            return {
              ...e,
              attachments: e.attachments.filter((a) => a.id !== attachmentId),
            };
          }
          return e;
        })
      );

      if (selectedExam?.id === examId) {
        setSelectedExam((prev) =>
          prev
            ? {
                ...prev,
                attachments: prev.attachments.filter((a) => a.id !== attachmentId),
              }
            : null
        );
      }

      return true;
    } catch (err) {
      console.error('[useExams] Error removing attachment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedExam?.id]);

  /**
   * Select an exam
   */
  const selectExam = useCallback((examId) => {
    if (examId) {
      const exam = exams.find((e) => e.id === examId);
      setSelectedExam(exam || null);
    } else {
      setSelectedExam(null);
    }
  }, [exams]);

  /**
   * Refresh exams list
   */
  const refresh = useCallback(() => {
    if (patientId) {
      loadExamsByPatient(patientId);
    }
  }, [loadExamsByPatient, patientId]);

  // Filter exams client-side
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (filters.status !== 'all' && exam.status !== filters.status) return false;
      if (filters.type !== 'all' && exam.examType !== filters.type) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = exam.examName?.toLowerCase().includes(searchLower);
        const typeMatch = exam.examType?.toLowerCase().includes(searchLower);
        if (!nameMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [exams, filters]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: exams.length,
    pending: exams.filter((e) => e.status === 'Pendente').length,
    completed: exams.filter((e) => e.status === 'Concluído').length,
    reviewed: exams.filter((e) => e.status === 'Revisado').length,
    abnormal: exams.filter((e) => e.isAbnormal).length,
  }), [exams]);

  return {
    // State
    exams: filteredExams,
    allExams: exams,
    selectedExam,
    pendingExams,
    abnormalExams,
    loading,
    saving,
    error,
    stats,

    // Filters
    filters,
    setFilters,

    // Actions
    loadExamsByPatient,
    loadPendingExams,
    loadAbnormalExams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    updateStatus,
    addResult,
    uploadAttachment,
    removeAttachment,
    selectExam,
    refresh,

    // Context
    doctorId,
    isSecretary,
  };
};

export default useExams;
