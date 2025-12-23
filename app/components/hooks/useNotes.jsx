"use client";

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';
import { notesService } from '@/lib/services/api';

/**
 * Hook for managing notes and anamnesis state and operations
 * Provides CRUD, importance marking, and attachment handling
 */
const useNotes = (options = {}) => {
  const { patientId = null } = options;
  const { user, isSecretary, workingDoctorId } = useAuth();

  const doctorId = isSecretary ? workingDoctorId : user?.uid;

  // Notes State
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [importantNotes, setImportantNotes] = useState([]);

  // Anamnesis State
  const [anamneses, setAnamneses] = useState([]);
  const [selectedAnamnese, setSelectedAnamnese] = useState(null);
  const [latestAnamnese, setLatestAnamnese] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingAnamneses, setLoadingAnamneses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    importantOnly: false,
  });

  // =========================================================================
  // Notes Operations
  // =========================================================================

  /**
   * Load notes for a patient
   */
  const loadNotesByPatient = useCallback(async (pId = patientId) => {
    if (!doctorId || !pId) return [];

    setLoading(true);
    setError(null);

    try {
      const data = await notesService.listNotesByPatient(pId);
      setNotes(data);
      return data;
    } catch (err) {
      console.error('[useNotes] Error loading notes:', err);
      setError('Erro ao carregar notas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [doctorId, patientId]);

  /**
   * Load important notes for a patient
   */
  const loadImportantNotes = useCallback(async (pId = patientId) => {
    if (!doctorId || !pId) return [];

    try {
      const data = await notesService.listImportantNotes(pId);
      setImportantNotes(data);
      return data;
    } catch (err) {
      console.error('[useNotes] Error loading important notes:', err);
      return [];
    }
  }, [doctorId, patientId]);

  /**
   * Get note by ID
   */
  const getNote = useCallback(async (noteId) => {
    if (!doctorId) return null;

    setLoading(true);

    try {
      const note = await notesService.getNoteById(noteId);
      setSelectedNote(note);
      return note;
    } catch (err) {
      console.error('[useNotes] Error getting note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  /**
   * Create new note
   */
  const createNote = useCallback(async (pId, noteData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newNote = await notesService.createNote(pId, noteData);
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('[useNotes] Error creating note:', err);
      setError('Erro ao criar nota');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update note
   */
  const updateNote = useCallback(async (noteId, noteData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await notesService.updateNote(noteId, noteData);

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updated : n))
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote(updated);
      }

      return updated;
    } catch (err) {
      console.error('[useNotes] Error updating note:', err);
      setError('Erro ao atualizar nota');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedNote?.id]);

  /**
   * Delete note
   */
  const deleteNote = useCallback(async (pId, noteId) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      await notesService.deleteNote(pId, noteId);

      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }

      return true;
    } catch (err) {
      console.error('[useNotes] Error deleting note:', err);
      setError('Erro ao excluir nota');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedNote?.id]);

  /**
   * Mark note as important
   */
  const markAsImportant = useCallback(async (noteId, isImportant) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const note = await notesService.markAsImportant(noteId, isImportant);

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? note : n))
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote(note);
      }

      // Update important notes list
      if (isImportant) {
        setImportantNotes((prev) => [note, ...prev.filter((n) => n.id !== noteId)]);
      } else {
        setImportantNotes((prev) => prev.filter((n) => n.id !== noteId));
      }

      return note;
    } catch (err) {
      console.error('[useNotes] Error marking as important:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedNote?.id]);

  /**
   * Upload attachment to note
   */
  const uploadNoteAttachment = useCallback(async (noteId, file) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      const response = await notesService.uploadNoteAttachment(noteId, file);

      // Refresh note to get updated attachments
      const note = await notesService.getNoteById(noteId);

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? note : n))
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote(note);
      }

      return response;
    } catch (err) {
      console.error('[useNotes] Error uploading attachment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedNote?.id]);

  /**
   * Remove attachment from note
   */
  const removeNoteAttachment = useCallback(async (noteId, attachmentId) => {
    if (!doctorId) return;

    setSaving(true);

    try {
      await notesService.removeNoteAttachment(noteId, attachmentId);

      // Update local state
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            return {
              ...n,
              attachments: n.attachments.filter((a) => a.id !== attachmentId),
            };
          }
          return n;
        })
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote((prev) =>
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
      console.error('[useNotes] Error removing attachment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedNote?.id]);

  // =========================================================================
  // Anamnesis Operations
  // =========================================================================

  /**
   * Load anamneses for a patient
   */
  const loadAnamneseByPatient = useCallback(async (pId = patientId) => {
    if (!doctorId || !pId) return [];

    setLoadingAnamneses(true);

    try {
      const data = await notesService.listAnamneseByPatient(pId);
      setAnamneses(data);
      return data;
    } catch (err) {
      console.error('[useNotes] Error loading anamneses:', err);
      return [];
    } finally {
      setLoadingAnamneses(false);
    }
  }, [doctorId, patientId]);

  /**
   * Get latest anamnese for a patient
   */
  const getLatestAnamnese = useCallback(async (pId = patientId) => {
    if (!doctorId || !pId) return null;

    try {
      const anamnese = await notesService.getLatestAnamnese(pId);
      setLatestAnamnese(anamnese);
      return anamnese;
    } catch (err) {
      console.error('[useNotes] Error getting latest anamnese:', err);
      return null;
    }
  }, [doctorId, patientId]);

  /**
   * Get anamnese by ID
   */
  const getAnamnese = useCallback(async (anamneseId) => {
    if (!doctorId) return null;

    setLoadingAnamneses(true);

    try {
      const anamnese = await notesService.getAnamneseById(anamneseId);
      setSelectedAnamnese(anamnese);
      return anamnese;
    } catch (err) {
      console.error('[useNotes] Error getting anamnese:', err);
      return null;
    } finally {
      setLoadingAnamneses(false);
    }
  }, [doctorId]);

  /**
   * Create new anamnese
   */
  const createAnamnese = useCallback(async (pId, anamneseData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const newAnamnese = await notesService.createAnamnese(pId, anamneseData);
      setAnamneses((prev) => [newAnamnese, ...prev]);
      setLatestAnamnese(newAnamnese);
      return newAnamnese;
    } catch (err) {
      console.error('[useNotes] Error creating anamnese:', err);
      setError('Erro ao criar anamnese');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId]);

  /**
   * Update anamnese
   */
  const updateAnamnese = useCallback(async (anamneseId, anamneseData) => {
    if (!doctorId) throw new Error('Usuário não autenticado');

    setSaving(true);
    setError(null);

    try {
      const updated = await notesService.updateAnamnese(anamneseId, anamneseData);

      setAnamneses((prev) =>
        prev.map((a) => (a.id === anamneseId ? updated : a))
      );

      if (selectedAnamnese?.id === anamneseId) {
        setSelectedAnamnese(updated);
      }

      if (latestAnamnese?.id === anamneseId) {
        setLatestAnamnese(updated);
      }

      return updated;
    } catch (err) {
      console.error('[useNotes] Error updating anamnese:', err);
      setError('Erro ao atualizar anamnese');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [doctorId, selectedAnamnese?.id, latestAnamnese?.id]);

  // =========================================================================
  // Selection and Utilities
  // =========================================================================

  /**
   * Select a note
   */
  const selectNote = useCallback((noteId) => {
    if (noteId) {
      const note = notes.find((n) => n.id === noteId);
      setSelectedNote(note || null);
    } else {
      setSelectedNote(null);
    }
  }, [notes]);

  /**
   * Select an anamnese
   */
  const selectAnamnese = useCallback((anamneseId) => {
    if (anamneseId) {
      const anamnese = anamneses.find((a) => a.id === anamneseId);
      setSelectedAnamnese(anamnese || null);
    } else {
      setSelectedAnamnese(null);
    }
  }, [anamneses]);

  /**
   * Refresh notes
   */
  const refreshNotes = useCallback(() => {
    if (patientId) {
      loadNotesByPatient(patientId);
    }
  }, [loadNotesByPatient, patientId]);

  /**
   * Refresh anamneses
   */
  const refreshAnamneses = useCallback(() => {
    if (patientId) {
      loadAnamneseByPatient(patientId);
    }
  }, [loadAnamneseByPatient, patientId]);

  // Filter notes client-side
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filters.importantOnly && !note.isImportant) return false;
      if (filters.type !== 'all' && note.noteType !== filters.type) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(searchLower);
        const contentMatch = note.content?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }
      return true;
    });
  }, [notes, filters]);

  // Calculate statistics
  const noteStats = useMemo(() => ({
    total: notes.length,
    important: notes.filter((n) => n.isImportant).length,
  }), [notes]);

  const anamneseStats = useMemo(() => ({
    total: anamneses.length,
    hasLatest: !!latestAnamnese,
  }), [anamneses, latestAnamnese]);

  return {
    // Notes State
    notes: filteredNotes,
    allNotes: notes,
    selectedNote,
    importantNotes,
    noteStats,

    // Anamnesis State
    anamneses,
    selectedAnamnese,
    latestAnamnese,
    anamneseStats,

    // Loading states
    loading,
    loadingAnamneses,
    saving,
    error,

    // Filters
    filters,
    setFilters,

    // Notes Actions
    loadNotesByPatient,
    loadImportantNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    markAsImportant,
    uploadNoteAttachment,
    removeNoteAttachment,
    selectNote,
    refreshNotes,

    // Anamnesis Actions
    loadAnamneseByPatient,
    getLatestAnamnese,
    getAnamnese,
    createAnamnese,
    updateAnamnese,
    selectAnamnese,
    refreshAnamneses,

    // Context
    doctorId,
    isSecretary,
  };
};

export default useNotes;
