'use client';

/**
 * @fileoverview Hook for clinic permission checks
 * @description Provides permission verification functions for multi-clinic mode
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../providers/authProvider';

/**
 * Hook for checking clinic permissions in multi-doctor mode
 * @returns {Object} Permission check functions and states
 */
export function useClinicPermissions() {
    const {
        user,
        isSecretary,
        workingDoctorId,
        permissions,
        clinicMode,
        doctorAssociation,
        accessibleDoctors,
        canAccessDoctorData,
    } = useAuth();

    /**
     * Check if user is in multi-doctor clinic mode
     */
    const isMultiDoctorClinic = useMemo(() => {
        return clinicMode === 'multi_doctor';
    }, [clinicMode]);

    /**
     * Check if user is a solo doctor (clinic mode = solo and not secretary)
     */
    const isSoloDoctor = useMemo(() => {
        return clinicMode === 'solo' && !isSecretary;
    }, [clinicMode, isSecretary]);

    /**
     * Check if user is clinic admin
     */
    const isClinicAdmin = useMemo(() => {
        return user?.role === 'tenant_admin' || user?.administrador;
    }, [user]);

    /**
     * Check if user is clinic owner (doctor with owner association)
     */
    const isClinicOwner = useMemo(() => {
        return doctorAssociation?.associationType === 'owner';
    }, [doctorAssociation]);

    /**
     * Check if can view financial data
     */
    const canViewFinancial = useMemo(() => {
        // Admin always can
        if (isClinicAdmin) return true;
        // Doctor with permission
        if (doctorAssociation?.additionalPermissions?.canViewFinancial) return true;
        // Solo doctor can
        if (isSoloDoctor) return true;
        // Secretary with permission
        if (isSecretary && permissions?.financial?.read) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor, isSecretary, permissions]);

    /**
     * Check if can manage financial data
     */
    const canManageFinancial = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canManageFinancial) return true;
        if (isSoloDoctor) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor]);

    /**
     * Check if can issue NFSe
     */
    const canIssueNfse = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canIssueNfse) return true;
        if (isSoloDoctor) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor]);

    /**
     * Check if can manage TISS/Glosas
     */
    const canManageTiss = useMemo(() => {
        return canViewFinancial;
    }, [canViewFinancial]);

    /**
     * Check if can manage WhatsApp
     */
    const canManageWhatsapp = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canManageWhatsapp) return true;
        if (isSoloDoctor) return true;
        if (isSecretary && permissions?.conversations?.write) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor, isSecretary, permissions]);

    /**
     * Check if can manage Facebook
     */
    const canManageFacebook = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canManageFacebook) return true;
        if (isSoloDoctor) return true;
        if (isSecretary && permissions?.conversations?.write) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor, isSecretary, permissions]);

    /**
     * Check if can create patients
     */
    const canCreatePatients = useMemo(() => {
        if (isClinicAdmin) return true;
        if (!isSecretary) return true; // Doctors can create
        if (permissions?.canCreatePatients !== undefined) {
            return permissions.canCreatePatients;
        }
        return permissions?.patients?.write === true;
    }, [isClinicAdmin, isSecretary, permissions]);

    /**
     * Check if can schedule for any doctor
     */
    const canScheduleForAnyDoctor = useMemo(() => {
        if (isClinicAdmin) return true;
        if (!isMultiDoctorClinic) return false; // Solo mode
        if (isSecretary && permissions?.canAssignToAnyDoctor) return true;
        return false;
    }, [isClinicAdmin, isMultiDoctorClinic, isSecretary, permissions]);

    /**
     * Check if can view all schedules
     */
    const canViewAllSchedules = useMemo(() => {
        if (isClinicAdmin) return true;
        if (!isMultiDoctorClinic) return true; // Solo mode
        if (isSecretary && permissions?.canViewAllSchedules) return true;
        if (doctorAssociation?.additionalPermissions?.canViewAllPatients) return true;
        return false;
    }, [isClinicAdmin, isMultiDoctorClinic, isSecretary, permissions, doctorAssociation]);

    /**
     * Check if can view all patients
     */
    const canViewAllPatients = useMemo(() => {
        if (isClinicAdmin) return true;
        if (!isMultiDoctorClinic) return true; // Solo mode
        if (doctorAssociation?.additionalPermissions?.canViewAllPatients) return true;
        // Clinic secretaries with all_doctors scope
        if (isSecretary && permissions?.canAssignToAnyDoctor) return true;
        return false;
    }, [isClinicAdmin, isMultiDoctorClinic, doctorAssociation, isSecretary, permissions]);

    /**
     * Check if can manage secretaries
     */
    const canManageSecretaries = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canManageSecretaries) return true;
        if (isSoloDoctor) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor]);

    /**
     * Check if can manage doctors (invite, deactivate, change permissions)
     */
    const canManageDoctors = useMemo(() => {
        if (isClinicAdmin) return true;
        if (isClinicOwner) return true;
        return false;
    }, [isClinicAdmin, isClinicOwner]);

    /**
     * Check if can view analytics
     */
    const canViewAnalytics = useMemo(() => {
        if (isClinicAdmin) return true;
        if (doctorAssociation?.additionalPermissions?.canViewAnalytics) return true;
        if (isSoloDoctor) return true;
        if (isSecretary && permissions?.analytics?.read) return true;
        return false;
    }, [isClinicAdmin, doctorAssociation, isSoloDoctor, isSecretary, permissions]);

    /**
     * Check if can manage waiting room
     */
    const canManageWaitingRoom = useMemo(() => {
        if (isClinicAdmin) return true;
        if (!isSecretary) return true; // Doctors can
        return permissions?.canManageWaitingRoom === true;
    }, [isClinicAdmin, isSecretary, permissions]);

    /**
     * Get doctors that can be seen in the schedule
     */
    const getScheduleableDoctors = useCallback(() => {
        if (!isMultiDoctorClinic || !accessibleDoctors?.length) {
            return workingDoctorId ? [{ id: workingDoctorId, name: user?.fullName }] : [];
        }
        if (canViewAllSchedules) {
            return accessibleDoctors;
        }
        return accessibleDoctors.filter(d => canAccessDoctorData?.(d.id));
    }, [isMultiDoctorClinic, accessibleDoctors, workingDoctorId, user, canViewAllSchedules, canAccessDoctorData]);

    /**
     * Get doctors that can be assigned appointments
     */
    const getAssignableDoctors = useCallback(() => {
        if (!isMultiDoctorClinic || !accessibleDoctors?.length) {
            return workingDoctorId ? [{ id: workingDoctorId, name: user?.fullName }] : [];
        }
        if (canScheduleForAnyDoctor) {
            return accessibleDoctors;
        }
        if (!isSecretary) {
            // Doctor can schedule for themselves
            return [{ id: workingDoctorId, name: user?.fullName }];
        }
        return accessibleDoctors.filter(d => canAccessDoctorData?.(d.id));
    }, [isMultiDoctorClinic, accessibleDoctors, workingDoctorId, user, canScheduleForAnyDoctor, isSecretary, canAccessDoctorData]);

    /**
     * Get doctors for patient list filtering
     */
    const getPatientFilterDoctors = useCallback(() => {
        if (!isMultiDoctorClinic || !accessibleDoctors?.length) {
            return [];
        }
        if (canViewAllPatients) {
            return accessibleDoctors;
        }
        return accessibleDoctors.filter(d => canAccessDoctorData?.(d.id));
    }, [isMultiDoctorClinic, accessibleDoctors, canViewAllPatients, canAccessDoctorData]);

    /**
     * Check if a specific doctor can be accessed
     */
    const canAccessDoctor = useCallback((doctorId) => {
        if (isClinicAdmin) return true;
        if (!isMultiDoctorClinic) return true;
        return canAccessDoctorData?.(doctorId) ?? false;
    }, [isClinicAdmin, isMultiDoctorClinic, canAccessDoctorData]);

    return {
        // Mode checks
        isMultiDoctorClinic,
        isSoloDoctor,
        isClinicAdmin,
        isClinicOwner,

        // Financial permissions
        canViewFinancial,
        canManageFinancial,
        canIssueNfse,
        canManageTiss,

        // Communication permissions
        canManageWhatsapp,
        canManageFacebook,

        // Patient/scheduling permissions
        canCreatePatients,
        canScheduleForAnyDoctor,
        canViewAllSchedules,
        canViewAllPatients,

        // Admin permissions
        canManageDoctors,
        canManageSecretaries,
        canViewAnalytics,
        canManageWaitingRoom,

        // Helper functions
        getScheduleableDoctors,
        getAssignableDoctors,
        getPatientFilterDoctors,
        canAccessDoctor,
    };
}

export default useClinicPermissions;
