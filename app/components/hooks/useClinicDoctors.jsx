'use client';

/**
 * @fileoverview Hook for fetching and managing clinic doctors
 * @description Provides doctors data and loading state for multi-clinic mode
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/authProvider';
import clinicService from '@/lib/services/api/clinic.service';

/**
 * Hook for managing clinic doctors data
 * @param {Object} options
 * @param {boolean} [options.activeOnly=true] - Only fetch active doctors
 * @param {boolean} [options.autoFetch=true] - Automatically fetch on mount
 * @returns {Object} Doctors data and utilities
 */
export function useClinicDoctors({ activeOnly = true, autoFetch = true } = {}) {
    const { clinicMode, user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isMultiDoctorClinic = clinicMode === 'multi_doctor';

    /**
     * Fetch doctors from API
     */
    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await clinicService.listDoctors({ activeOnly });
            setDoctors(data || []);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError(err.message || 'Erro ao carregar médicos');
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    }, [activeOnly]);

    /**
     * Refresh doctors list
     */
    const refresh = useCallback(() => {
        return fetchDoctors();
    }, [fetchDoctors]);

    /**
     * Find doctor by ID
     */
    const getDoctorById = useCallback((doctorId) => {
        return doctors.find(d => d.association?.profissionalId === doctorId || d.id === doctorId);
    }, [doctors]);

    /**
     * Get doctor name by ID
     */
    const getDoctorName = useCallback((doctorId) => {
        const doctor = getDoctorById(doctorId);
        return doctor?.name || 'Médico';
    }, [getDoctorById]);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch && user) {
            fetchDoctors();
        }
    }, [autoFetch, user, fetchDoctors]);

    return {
        // Data
        doctors,
        loading,
        error,
        isMultiDoctorClinic,

        // Actions
        fetchDoctors,
        refresh,

        // Utilities
        getDoctorById,
        getDoctorName,

        // Computed
        count: doctors.length,
        hasMultipleDoctors: doctors.length > 1,
    };
}

export default useClinicDoctors;
