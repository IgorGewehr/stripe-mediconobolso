/**
 * @fileoverview Clinic API Service
 * @description Service for clinic management API calls (multi-doctor support)
 */

import apiService from './apiService';

const API_BASE = '/clinics';

// ============================================================================
// CLINIC INFO
// ============================================================================

/**
 * Get current clinic info
 * @returns {Promise<import('../../types/clinic.types').Clinic>}
 */
export async function getCurrent() {
    return apiService.get(`${API_BASE}/current`);
}

/**
 * Update clinic settings
 * @param {import('../../types/clinic.types').UpdateClinicSettingsDto} settings
 * @returns {Promise<import('../../types/clinic.types').Clinic>}
 */
export async function updateSettings(settings) {
    return apiService.put(`${API_BASE}/current/settings`, settings);
}

/**
 * Get clinic summary (for dashboard)
 * @returns {Promise<import('../../types/clinic.types').ClinicSummary>}
 */
export async function getSummary() {
    return apiService.get(`${API_BASE}/summary`);
}

// ============================================================================
// DOCTOR MANAGEMENT
// ============================================================================

/**
 * List doctors in the clinic
 * @param {Object} options
 * @param {boolean} [options.activeOnly=true] - Only active doctors
 * @returns {Promise<import('../../types/clinic.types').DoctorWithAssociation[]>}
 */
export async function listDoctors({ activeOnly = true } = {}) {
    return apiService.get(`${API_BASE}/doctors`, { active_only: activeOnly });
}

/**
 * Get a specific doctor's association
 * @param {string} doctorId - Doctor/professional ID
 * @returns {Promise<import('../../types/clinic.types').DoctorWithAssociation>}
 */
export async function getDoctor(doctorId) {
    return apiService.get(`${API_BASE}/doctors/${doctorId}`);
}

/**
 * Get current user's doctor association
 * @returns {Promise<import('../../types/clinic.types').DoctorClinicAssociation>}
 */
export async function getMyAssociation() {
    return apiService.get(`${API_BASE}/doctors/me/association`);
}

/**
 * Update doctor permissions
 * @param {string} doctorId - Doctor/professional ID
 * @param {import('../../types/clinic.types').UpdateDoctorPermissionsDto} permissions
 * @returns {Promise<import('../../types/clinic.types').DoctorClinicAssociation>}
 */
export async function updateDoctorPermissions(doctorId, permissions) {
    return apiService.put(`${API_BASE}/doctors/${doctorId}/permissions`, permissions);
}

/**
 * Deactivate a doctor
 * @param {string} doctorId - Doctor/professional ID
 * @returns {Promise<void>}
 */
export async function deactivateDoctor(doctorId) {
    return apiService.post(`${API_BASE}/doctors/${doctorId}/deactivate`);
}

/**
 * Reactivate a doctor
 * @param {string} doctorId - Doctor/professional ID
 * @returns {Promise<void>}
 */
export async function reactivateDoctor(doctorId) {
    return apiService.post(`${API_BASE}/doctors/${doctorId}/reactivate`);
}

// ============================================================================
// DOCTOR INVITES
// ============================================================================

/**
 * Invite a doctor to the clinic
 * @param {import('../../types/clinic.types').InviteDoctorDto} invite
 * @returns {Promise<import('../../types/clinic.types').DoctorInvite>}
 */
export async function inviteDoctor(invite) {
    return apiService.post(`${API_BASE}/doctors/invite`, invite);
}

/**
 * List pending invites
 * @returns {Promise<import('../../types/clinic.types').DoctorInvite[]>}
 */
export async function listPendingInvites() {
    return apiService.get(`${API_BASE}/invites`);
}

/**
 * Cancel an invite
 * @param {string} inviteId - Invite ID
 * @returns {Promise<void>}
 */
export async function cancelInvite(inviteId) {
    return apiService.post(`${API_BASE}/invites/${inviteId}/cancel`);
}

/**
 * Accept an invite (for the invited doctor)
 * @param {import('../../types/clinic.types').AcceptInviteDto} data
 * @returns {Promise<import('../../types/clinic.types').DoctorClinicAssociation>}
 */
export async function acceptInvite(data) {
    return apiService.post(`${API_BASE}/invites/accept`, data);
}

/**
 * Resend invite email
 * @param {string} inviteId - Invite ID
 * @returns {Promise<void>}
 */
export async function resendInvite(inviteId) {
    return apiService.post(`${API_BASE}/invites/${inviteId}/resend`);
}

// ============================================================================
// CLINIC SECRETARIES
// ============================================================================

/**
 * List clinic secretaries
 * @param {Object} options
 * @param {boolean} [options.activeOnly=true] - Only active secretaries
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary[]>}
 */
export async function listClinicSecretaries({ activeOnly = true } = {}) {
    return apiService.get(`${API_BASE}/secretaries`, { active_only: activeOnly });
}

/**
 * Get a specific clinic secretary
 * @param {string} secretaryId - Secretary ID
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary>}
 */
export async function getClinicSecretary(secretaryId) {
    return apiService.get(`${API_BASE}/secretaries/${secretaryId}`);
}

/**
 * Create a clinic secretary
 * @param {import('../../types/clinic.types').CreateClinicSecretaryDto} data
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary>}
 */
export async function createClinicSecretary(data) {
    return apiService.post(`${API_BASE}/secretaries`, data);
}

/**
 * Update a clinic secretary
 * @param {string} secretaryId - Secretary ID
 * @param {Partial<import('../../types/clinic.types').ClinicSecretary>} data
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary>}
 */
export async function updateClinicSecretary(secretaryId, data) {
    return apiService.put(`${API_BASE}/secretaries/${secretaryId}`, data);
}

/**
 * Update secretary scope
 * @param {string} secretaryId - Secretary ID
 * @param {Object} scope
 * @param {import('../../types/clinic.types').SecretaryScopeType} scope.scopeType
 * @param {string[]} [scope.scopeDoctors]
 * @param {string} [scope.singleDoctorId]
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary>}
 */
export async function updateSecretaryScope(secretaryId, scope) {
    return apiService.put(`${API_BASE}/secretaries/${secretaryId}/scope`, scope);
}

/**
 * Update secretary permissions
 * @param {string} secretaryId - Secretary ID
 * @param {import('../../types/clinic.types').ClinicSecretaryPermissions} permissions
 * @returns {Promise<import('../../types/clinic.types').ClinicSecretary>}
 */
export async function updateSecretaryPermissions(secretaryId, permissions) {
    return apiService.put(`${API_BASE}/secretaries/${secretaryId}/permissions`, permissions);
}

/**
 * Deactivate a clinic secretary
 * @param {string} secretaryId - Secretary ID
 * @returns {Promise<void>}
 */
export async function deactivateClinicSecretary(secretaryId) {
    return apiService.post(`${API_BASE}/secretaries/${secretaryId}/deactivate`);
}

/**
 * Reactivate a clinic secretary
 * @param {string} secretaryId - Secretary ID
 * @returns {Promise<void>}
 */
export async function reactivateClinicSecretary(secretaryId) {
    return apiService.post(`${API_BASE}/secretaries/${secretaryId}/reactivate`);
}

// ============================================================================
// ROOMS
// ============================================================================

/**
 * List rooms
 * @param {Object} options
 * @param {boolean} [options.activeOnly=true] - Only active rooms
 * @returns {Promise<import('../../types/clinic.types').Room[]>}
 */
export async function listRooms({ activeOnly = true } = {}) {
    return apiService.get(`${API_BASE}/rooms`, { active_only: activeOnly });
}

/**
 * Create a room
 * @param {import('../../types/clinic.types').CreateRoomDto} data
 * @returns {Promise<import('../../types/clinic.types').Room>}
 */
export async function createRoom(data) {
    return apiService.post(`${API_BASE}/rooms`, data);
}

/**
 * Update a room
 * @param {string} roomId - Room ID
 * @param {Partial<import('../../types/clinic.types').Room>} data
 * @returns {Promise<import('../../types/clinic.types').Room>}
 */
export async function updateRoom(roomId, data) {
    return apiService.put(`${API_BASE}/rooms/${roomId}`, data);
}

/**
 * Deactivate a room
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export async function deactivateRoom(roomId) {
    return apiService.post(`${API_BASE}/rooms/${roomId}/deactivate`);
}

// ============================================================================
// PATIENT SHARING
// ============================================================================

/**
 * Share a patient with doctors
 * @param {string} patientId - Patient ID
 * @param {string[]} doctorIds - Doctor IDs to share with
 * @returns {Promise<void>}
 */
export async function sharePatient(patientId, doctorIds) {
    return apiService.post(`/patients/${patientId}/share`, { doctorIds });
}

/**
 * Unshare a patient from doctors
 * @param {string} patientId - Patient ID
 * @param {string[]} doctorIds - Doctor IDs to remove
 * @returns {Promise<void>}
 */
export async function unsharePatient(patientId, doctorIds) {
    return apiService.post(`/patients/${patientId}/unshare`, { doctorIds });
}

/**
 * Set patient as shared with all doctors
 * @param {string} patientId - Patient ID
 * @param {boolean} shared - Whether to share with all
 * @returns {Promise<void>}
 */
export async function setPatientSharedWithAll(patientId, shared) {
    return apiService.put(`/patients/${patientId}/shared`, { shared });
}

/**
 * Get patient sharing info
 * @param {string} patientId - Patient ID
 * @returns {Promise<import('../../types/clinic.types').PatientSharingData>}
 */
export async function getPatientSharingInfo(patientId) {
    return apiService.get(`/patients/${patientId}/sharing`);
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

const clinicService = {
    // Clinic info
    getCurrent,
    updateSettings,
    getSummary,
    // Doctors
    listDoctors,
    getDoctor,
    getMyAssociation,
    updateDoctorPermissions,
    deactivateDoctor,
    reactivateDoctor,
    // Invites
    inviteDoctor,
    listPendingInvites,
    cancelInvite,
    acceptInvite,
    resendInvite,
    // Secretaries
    listClinicSecretaries,
    getClinicSecretary,
    createClinicSecretary,
    updateClinicSecretary,
    updateSecretaryScope,
    updateSecretaryPermissions,
    deactivateClinicSecretary,
    reactivateClinicSecretary,
    // Rooms
    listRooms,
    createRoom,
    updateRoom,
    deactivateRoom,
    // Patient sharing
    sharePatient,
    unsharePatient,
    setPatientSharedWithAll,
    getPatientSharingInfo,
};

export default clinicService;
