/**
 * Auth Service
 *
 * Handles user authentication and account management.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { BaseService } from './base.service';

// Google Auth Provider configuration
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
});

class AuthService extends BaseService {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth result
   */
  async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await this.registerDetailedLogin(result.user.uid, 'email');
      return result;
    } catch (error) {
      this.handleError(error, 'login');
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} Auth credential
   */
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(this.firestore, 'users', uid), userData);
      return userCredential;
    } catch (error) {
      this.handleError(error, 'signUp');
    }
  }

  /**
   * Login with Google
   * @returns {Promise<{ user: Object, isNewUser: boolean }>}
   */
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, googleProvider);
      await this.registerDetailedLogin(result.user.uid, 'google');
      return { user: result.user, isNewUser: false };
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Account exists with different credentials');
      }
      throw error;
    }
  }

  /**
   * Sign up free account with Google
   * @param {Object} [additionalData] - Additional user data
   * @returns {Promise<{ user: Object, userData: Object }>}
   */
  async signUpFreeWithGoogle(additionalData = {}) {
    try {
      this.log('Starting free Google sign up...');
      const result = await signInWithPopup(this.auth, googleProvider);
      const user = result.user;

      const [firstName, ...lastNameArray] = (user.displayName || '').split(' ');
      const lastName = lastNameArray.join(' ');

      const userData = {
        fullName: user.displayName || '',
        firstName: firstName || '',
        lastName: lastName || '',
        email: user.email,
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        gratuito: true,
        assinouPlano: false,
        planType: 'free',
        authProvider: 'google',
        createdAt: new Date(),
        checkoutCompleted: true,
        googleProfile: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        ...additionalData
      };

      // Check for referral source
      if (typeof localStorage !== 'undefined') {
        const referralSource = localStorage.getItem('referralSource');
        if (referralSource === 'enrico') {
          userData.enrico = true;
          this.log('Google free user marked as Enrico referral');
        } else if (referralSource) {
          userData.referralSource = referralSource;
        }
      }

      await setDoc(doc(this.firestore, 'users', user.uid), userData);
      this.log('Free Google sign up completed');
      return { user, userData };
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
   * Complete Google profile
   * @param {string} uid - User ID
   * @param {Object} profileData - Profile data to save
   * @returns {Promise<boolean>}
   */
  async completeGoogleProfile(uid, profileData) {
    try {
      this.log('Completing Google user profile...');
      const updateData = {
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date()
      };
      await this.editUserData(uid, updateData);
      this.log('Google profile updated successfully');
      return true;
    } catch (error) {
      this.handleError(error, 'completeGoogleProfile');
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
   * Register detailed login information
   * @param {string} uid - User ID
   * @param {string} [loginMethod='email'] - Login method
   * @returns {Promise<boolean>}
   */
  async registerDetailedLogin(uid, loginMethod = 'email') {
    try {
      const now = new Date();
      const loginData = {
        lastLogin: now,
        lastLoginTimestamp: serverTimestamp(),
        lastLoginMethod: loginMethod,
        lastUserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        lastPlatform: typeof navigator !== 'undefined' ? navigator.platform : '',
        isCurrentlyOnline: true,
        lastLoginDay: now.getDate(),
        lastLoginMonth: now.getMonth() + 1,
        lastLoginYear: now.getFullYear(),
        lastLoginHour: now.getHours(),
        lastLoginMinute: now.getMinutes(),
        lastLoginFormatted: now.toLocaleString('pt-BR'),
        updatedAt: now
      };

      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, loginData);
      this.log(`Login registered for user ${uid}`);
      return true;
    } catch (error) {
      console.error('[AuthService] Error registering login:', error);
      return false;
    }
  }

  /**
   * Get user data
   * @param {string} uid - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserData(uid) {
    try {
      const docRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      this.handleError(error, 'getUserData');
    }
  }

  /**
   * Edit user data
   * @param {string} uid - User ID
   * @param {Object} newData - Data to update
   * @returns {Promise<boolean>}
   */
  async editUserData(uid, newData) {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      try {
        await updateDoc(userRef, newData);
        return true;
      } catch (error) {
        if (error.code === 'not-found') {
          this.log(`Document not found for ${uid}, creating new...`);
          await setDoc(userRef, {
            ...newData,
            createdAt: new Date()
          });
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.handleError(error, 'editUserData');
    }
  }

  /**
   * Send welcome emails for Google sign up
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  async sendGoogleWelcomeEmails(email, name) {
    try {
      const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          type: 'both',
          appLink,
          authMethod: 'google'
        })
      });

      const result = await response.json();
      if (result.success) {
        this.log('Google welcome emails sent!');
        return { success: true, data: result.data };
      } else {
        console.error('[AuthService] Failed to send Google emails:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[AuthService] Error sending Google emails:', error);
      return { success: false, error: error.message };
    }
  }
}

export const authService = new AuthService();
export default authService;
