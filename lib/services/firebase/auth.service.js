/**
 * Auth Service
 *
 * Handles user authentication using Firebase Auth.
 * User profile data is now managed by the doctor-server API.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import apiService from '../api/apiService';

/**
 * Converte dados do usuário de camelCase (frontend) para snake_case (backend)
 * @param {Object} userData - Dados do usuário do frontend
 * @returns {Object} Dados formatados para o backend
 */
function denormalizeUserData(userData) {
  if (!userData) return {};

  const payload = {};

  // Helper para converter string vazia em null
  const emptyToNull = (val) => (val === '' || val === undefined ? null : val);

  // Mapeamento de campos camelCase -> snake_case
  if (userData.fullName !== undefined) payload.full_name = emptyToNull(userData.fullName);
  if (userData.firstName !== undefined) payload.first_name = emptyToNull(userData.firstName);
  if (userData.lastName !== undefined) payload.last_name = emptyToNull(userData.lastName);
  if (userData.email !== undefined) payload.email = emptyToNull(userData.email);
  if (userData.phone !== undefined) payload.phone = emptyToNull(userData.phone);
  if (userData.cpf !== undefined) payload.cpf = emptyToNull(userData.cpf);
  if (userData.photoURL !== undefined) payload.photo_url = emptyToNull(userData.photoURL);

  // Dados profissionais
  if (userData.crm !== undefined) payload.crm = emptyToNull(userData.crm);
  if (userData.especialidade !== undefined) payload.specialty = emptyToNull(userData.especialidade);
  if (userData.clinicName !== undefined) payload.clinic_name = emptyToNull(userData.clinicName);

  // Endereço
  if (userData.address) {
    payload.address = {
      street: emptyToNull(userData.address.street),
      number: emptyToNull(userData.address.number || userData.address.numero),
      complement: emptyToNull(userData.address.complement || userData.address.complemento),
      neighborhood: emptyToNull(userData.address.neighborhood || userData.address.bairro),
      city: emptyToNull(userData.address.city || userData.address.cidade),
      state: emptyToNull(userData.address.state || userData.address.uf),
      zip_code: emptyToNull(userData.address.cep || userData.address.zipCode),
    };
  }

  // Limpar campos com valor null do payload (opcional)
  Object.keys(payload).forEach(key => {
    if (payload[key] === null) delete payload[key];
  });

  return payload;
}

// Google Auth Provider configuration
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
});

class AuthService {
  auth = auth;

  /**
   * Handle errors with consistent logging
   */
  handleError(error, context) {
    console.error(`[AuthService] ${context}:`, error);
    throw error;
  }

  /**
   * Log messages with service name prefix
   */
  log(message, data = null) {
    if (data) {
      console.log(`[AuthService] ${message}`, data);
    } else {
      console.log(`[AuthService] ${message}`);
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth result
   */
  async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result;
    } catch (error) {
      this.handleError(error, 'login');
    }
  }

  /**
   * Sign up with email and password
   * Note: User profile data should be created via the API after signup
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth credential
   */
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      this.handleError(error, 'signUp');
    }
  }

  /**
   * Login with Google
   * Note: User profile should be provisioned via the API after login
   * @returns {Promise<{ user: Object, isNewUser: boolean }>}
   */
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, googleProvider);

      // Check if this is a new user based on metadata
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

      return { user: result.user, isNewUser };
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Account exists with different credentials');
      }
      throw error;
    }
  }

  /**
   * Sign up free account with Google
   * Note: User profile data should be created via the API after signup
   * @returns {Promise<{ user: Object, isNewUser: boolean }>}
   */
  async signUpFreeWithGoogle() {
    try {
      this.log('Starting free Google sign up...');
      const result = await signInWithPopup(this.auth, googleProvider);
      const user = result.user;

      // Check if this is a new user
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

      this.log('Google sign up completed', { isNewUser });
      return { user, isNewUser };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelled by user');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked by browser');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Account exists with different login method');
      }
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  async sendPasswordResetEmail(email) {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
      return true;
    } catch (error) {
      this.handleError(error, 'sendPasswordResetEmail');
    }
  }

  /**
   * Get user data from the API
   * @param {string} uid - Firebase UID (not used, we get current user from token)
   * @returns {Promise<Object>} User data
   */
  async getUserData(uid) {
    try {
      this.log('Getting user data from API...');
      const response = await apiService.get('/account/me');
      this.log('User data retrieved successfully');
      return response;
    } catch (error) {
      this.log('Error getting user data:', error.message);
      throw error;
    }
  }

  /**
   * Update user data via the API
   * @param {string} uid - Firebase UID (not used directly)
   * @param {Object} userData - Data to update (camelCase)
   * @returns {Promise<Object>} Updated user data
   */
  async editUserData(uid, userData) {
    try {
      this.log('Updating user data via API...');

      // First get the current user to get their backend ID
      const currentUser = await apiService.get('/account/me');

      if (!currentUser || !currentUser.id) {
        throw new Error('Could not get current user ID');
      }

      // Converte dados de camelCase para snake_case antes de enviar
      const payload = denormalizeUserData(userData);
      this.log('Payload normalizado:', payload);

      // Update user via the users endpoint
      const response = await apiService.put(`/users/${currentUser.id}`, payload);
      this.log('User data updated successfully');
      return response;
    } catch (error) {
      this.log('Error updating user data:', error.message);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
