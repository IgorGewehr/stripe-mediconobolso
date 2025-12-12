/**
 * Secretary Service
 *
 * Handles secretary account management and permissions.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit as limitFn
} from 'firebase/firestore';
import { BaseService } from './base.service';

class SecretaryService extends BaseService {
  /**
   * Create a secretary account
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} secretaryData - Secretary data (name, email, password, permissions)
   * @returns {Promise<Object>} Creation result
   */
  async createSecretaryAccount(doctorId, secretaryData) {
    let tempApp = null;

    try {
      this.log('Creating secretary without affecting doctor session...');

      // Step 1: Validate creation
      const validation = await this.validateSecretaryCreation(doctorId, secretaryData);
      const { doctorData, secretaryCount } = validation;

      // Step 2: Verify doctor is logged in
      const currentUser = this.auth.currentUser;
      if (!currentUser || currentUser.uid !== doctorId) {
        throw new Error('Doctor must be logged in');
      }

      this.log(`Doctor authenticated: ${currentUser.email}`);

      // Step 3: Check if email already exists
      const emailCheck = await this.checkEmailExistsInSystem(secretaryData.email);
      if (emailCheck.exists) {
        throw new Error(`Email already registered as ${emailCheck.type}`);
      }

      // Step 4: Create temporary Auth instance
      this.log('Creating temporary Auth instance...');

      const { initializeApp, deleteApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');

      const tempAppName = `temp-secretary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      tempApp = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB3VIRZ-rCbRVC4eybhJNG-dMdw1LVMF9I",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "projeto-med-19a8b.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "projeto-med-19a8b",
      }, tempAppName);

      const tempAuth = getAuth(tempApp);

      // Step 5: Create user in temporary instance
      this.log('Creating secretary account in temporary instance...');

      const secretaryCredential = await createUserWithEmailAndPassword(
        tempAuth,
        secretaryData.email,
        secretaryData.password
      );

      const secretaryId = secretaryCredential.user.uid;

      // Step 6: Logout from temporary instance
      await signOut(tempAuth);

      // Step 7: Create secretary document in Firestore
      const secretaryDocData = {
        doctorId: doctorId,
        email: secretaryData.email,
        name: secretaryData.name.trim(),
        active: true,
        permissions: secretaryData.permissions || this.getDefaultPermissions(),
        createdAt: new Date(),
        createdBy: doctorId,
        authUid: secretaryId,
        lastLogin: null,
        loginCount: 0,
        version: "3.0",
        createdWithMultiAuth: true
      };

      const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
      await setDoc(secretaryRef, secretaryDocData);

      // Step 8: Update doctor configuration
      await this.updateDoctorConfiguration(doctorId, secretaryId, secretaryData, secretaryCount);

      // Step 9: Delete temporary instance
      await deleteApp(tempApp);
      tempApp = null;

      // Verify doctor is still logged in
      const stillLoggedIn = this.auth.currentUser && this.auth.currentUser.uid === doctorId;
      if (!stillLoggedIn) {
        throw new Error('Error: Doctor session was lost during the process');
      }

      this.log('Secretary created successfully! Doctor remains logged in!');

      return {
        success: true,
        secretaryId: secretaryId,
        needsDoctorRelogin: false,
        data: {
          name: secretaryData.name,
          email: secretaryData.email,
          permissions: secretaryData.permissions,
          doctorName: doctorData.fullName,
          currentCount: secretaryCount + 1
        }
      };

    } catch (error) {
      console.error("[SecretaryService] Error creating secretary:", error);

      // Cleanup temporary instance on error
      if (tempApp) {
        try {
          const { deleteApp } = await import('firebase/app');
          await deleteApp(tempApp);
        } catch (cleanupError) {
          console.error('[SecretaryService] Cleanup error:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Get default permissions for new secretary
   * @returns {Object} Default permissions object
   */
  getDefaultPermissions() {
    return {
      patients: { read: true, write: false, viewDetails: false },
      appointments: { read: true, write: true },
      prescriptions: { read: true, write: false },
      exams: { read: true, write: false },
      notes: { read: true, write: false },
      financial: { read: false, write: false },
      reports: { read: true, write: false }
    };
  }

  /**
   * Validate secretary creation
   * @param {string} doctorId - Doctor's user ID
   * @param {Object} secretaryData - Secretary data
   * @returns {Promise<Object>} Validation result
   */
  async validateSecretaryCreation(doctorId, secretaryData) {
    try {
      this.log('Validating secretary creation...');

      if (!secretaryData.name?.trim()) {
        throw new Error('Secretary name is required');
      }

      if (!secretaryData.email?.trim()) {
        throw new Error('Secretary email is required');
      }

      if (!secretaryData.password || secretaryData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check if doctor exists
      const doctorDoc = await getDoc(doc(this.firestore, "users", doctorId));
      if (!doctorDoc.exists()) {
        throw new Error('Doctor not found');
      }
      const doctorData = doctorDoc.data();

      // Count existing secretaries
      const secretaryCount = await this.countDoctorSecretaries(doctorId);

      // Check plan limits
      let maxSecretaries = 1;
      if (doctorData.administrador) {
        maxSecretaries = 10;
      } else if (doctorData.assinouPlano) {
        maxSecretaries = 5;
      }

      if (secretaryCount >= maxSecretaries) {
        throw new Error(`Secretary limit of ${maxSecretaries} reached for your plan`);
      }

      this.log('Validation completed successfully');
      return { doctorData, secretaryCount };

    } catch (error) {
      this.handleError(error, 'validateSecretaryCreation');
    }
  }

  /**
   * Count active secretaries for a doctor
   * @param {string} doctorId - Doctor's user ID
   * @returns {Promise<number>} Count of active secretaries
   */
  async countDoctorSecretaries(doctorId) {
    try {
      const secretariesRef = collection(this.firestore, "secretaries");
      const q = query(
        secretariesRef,
        where("doctorId", "==", doctorId),
        where("active", "==", true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;

    } catch (error) {
      console.error('[SecretaryService] Error counting secretaries:', error);
      return 0;
    }
  }

  /**
   * Check if email exists in system
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Check result
   */
  async checkEmailExistsInSystem(email) {
    try {
      this.log(`Checking if email exists: ${email}`);

      // Check in users (doctors)
      try {
        const usersRef = collection(this.firestore, "users");
        const userQuery = query(usersRef, where("email", "==", email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          return { exists: true, type: 'doctor' };
        }
      } catch (userError) {
        this.warn('Error checking users:', userError);
      }

      // Check in secretaries
      try {
        const secretariesRef = collection(this.firestore, "secretaries");
        const secretaryQuery = query(
          secretariesRef,
          where("email", "==", email),
          where("active", "==", true)
        );
        const secretarySnapshot = await getDocs(secretaryQuery);

        if (!secretarySnapshot.empty) {
          return { exists: true, type: 'secretary' };
        }
      } catch (secretaryError) {
        this.warn('Error checking secretaries:', secretaryError);
      }

      return { exists: false };

    } catch (error) {
      console.error("[SecretaryService] Error checking email:", error);
      return { exists: false };
    }
  }

  /**
   * Update doctor configuration after creating secretary
   * @param {string} doctorId - Doctor's user ID
   * @param {string} secretaryId - Secretary ID
   * @param {Object} secretaryData - Secretary data
   * @param {number} currentCount - Current secretary count
   * @returns {Promise<void>}
   */
  async updateDoctorConfiguration(doctorId, secretaryId, secretaryData, currentCount) {
    try {
      this.log('Updating doctor configuration...');

      const doctorRef = doc(this.firestore, "users", doctorId);

      const updateData = {
        hasSecretary: true,
        secretaryCount: currentCount + 1,
        lastSecretaryCreated: new Date(),
        updatedAt: new Date()
      };

      await updateDoc(doctorRef, updateData);
      this.log('Doctor configuration updated');

    } catch (error) {
      this.handleError(error, 'updateDoctorConfiguration');
    }
  }

  /**
   * Get doctor's secretary info
   * @param {string} doctorId - Doctor's user ID
   * @returns {Promise<Object|null>} Secretary info or null
   */
  async getDoctorSecretaryInfo(doctorId) {
    try {
      if (!doctorId || typeof doctorId !== 'string') {
        this.warn('getDoctorSecretaryInfo: Invalid doctorId');
        return null;
      }

      this.log(`Fetching secretary for doctor: ${doctorId}`);

      const secretariesRef = collection(this.firestore, "secretaries");
      const q = query(
        secretariesRef,
        where("doctorId", "==", doctorId),
        where("active", "==", true),
        limitFn(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const secretaryDoc = querySnapshot.docs[0];
        const secretaryData = secretaryDoc.data();

        return {
          id: secretaryDoc.id,
          name: secretaryData.name,
          email: secretaryData.email,
          active: secretaryData.active,
          permissions: secretaryData.permissions,
          createdAt: secretaryData.createdAt,
          lastLogin: secretaryData.lastLogin,
          loginCount: secretaryData.loginCount || 0,
          needsActivation: secretaryData.needsActivation || false
        };
      }

      this.log('No active secretary found');
      return null;

    } catch (error) {
      console.error("[SecretaryService] Error fetching secretary info:", error);
      return null;
    }
  }

  /**
   * List all secretaries for a doctor
   * @param {string} doctorId - Doctor's user ID
   * @param {boolean} includeInactive - Include inactive secretaries
   * @returns {Promise<Array>} List of secretaries
   */
  async listDoctorSecretaries(doctorId, includeInactive = false) {
    try {
      this.log(`Listing secretaries for doctor: ${doctorId}`);

      const secretariesRef = collection(this.firestore, "secretaries");

      let q;
      if (includeInactive) {
        q = query(secretariesRef, where("doctorId", "==", doctorId));
      } else {
        q = query(
          secretariesRef,
          where("doctorId", "==", doctorId),
          where("active", "==", true)
        );
      }

      const querySnapshot = await getDocs(q);
      const secretaries = [];

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        secretaries.push({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          active: data.active,
          permissions: data.permissions,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          loginCount: data.loginCount || 0
        });
      });

      // Sort on client to avoid index issues
      secretaries.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;

        const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

        return dateB - dateA;
      });

      this.log(`${secretaries.length} secretary(ies) found`);
      return secretaries;

    } catch (error) {
      console.error("[SecretaryService] Error listing secretaries:", error);
      return [];
    }
  }

  /**
   * Update secretary permissions
   * @param {string} doctorId - Doctor's user ID
   * @param {string} secretaryId - Secretary ID
   * @param {Object} newPermissions - New permissions object
   * @returns {Promise<Object>} Update result
   */
  async updateSecretaryPermissions(doctorId, secretaryId, newPermissions) {
    try {
      this.log(`Updating permissions for secretary ${secretaryId}...`);

      // Security validation
      const currentUser = this.auth.currentUser;
      if (!currentUser || currentUser.uid !== doctorId) {
        throw new Error('SECURITY: Only the responsible doctor can change permissions');
      }

      // Verify secretary belongs to doctor
      const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
      const secretaryDoc = await getDoc(secretaryRef);

      if (!secretaryDoc.exists()) {
        throw new Error('Secretary not found');
      }

      const secretaryData = secretaryDoc.data();
      if (secretaryData.doctorId !== doctorId) {
        throw new Error('SECURITY: Secretary does not belong to this doctor');
      }

      // Validate permissions structure
      const validModules = ['patients', 'appointments', 'prescriptions', 'exams', 'notes', 'financial', 'reports'];
      const validActions = ['read', 'create', 'write', 'viewDetails'];

      if (typeof newPermissions !== 'object' || newPermissions === null) {
        throw new Error('SECURITY: Invalid permissions format');
      }

      for (const [module, actions] of Object.entries(newPermissions)) {
        if (!validModules.includes(module)) {
          throw new Error(`SECURITY: Invalid module: ${module}`);
        }

        if (typeof actions !== 'object' || actions === null) {
          throw new Error(`SECURITY: Invalid actions for module: ${module}`);
        }

        for (const [action, value] of Object.entries(actions)) {
          if (!validActions.includes(action)) {
            throw new Error(`SECURITY: Invalid action: ${action} for module: ${module}`);
          }

          if (typeof value !== 'boolean') {
            throw new Error(`SECURITY: Permission value must be boolean for ${module}.${action}`);
          }
        }
      }

      // Update permissions
      await updateDoc(secretaryRef, {
        permissions: newPermissions,
        updatedAt: new Date(),
        lastUpdatedBy: doctorId
      });

      this.log('Permissions updated successfully');
      return { success: true };

    } catch (error) {
      this.handleError(error, 'updateSecretaryPermissions');
    }
  }

  /**
   * Deactivate secretary account
   * @param {string} doctorId - Doctor's user ID
   * @param {string} secretaryId - Secretary ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateSecretaryAccount(doctorId, secretaryId) {
    try {
      this.log(`Deactivating secretary ${secretaryId}...`);

      // Verify secretary belongs to doctor
      const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
      const secretaryDoc = await getDoc(secretaryRef);

      if (!secretaryDoc.exists()) {
        throw new Error('Secretary not found');
      }

      const secretaryData = secretaryDoc.data();
      if (secretaryData.doctorId !== doctorId) {
        throw new Error('Secretary does not belong to this doctor');
      }

      // Deactivate secretary
      await updateDoc(secretaryRef, {
        active: false,
        deactivatedAt: new Date(),
        deactivatedBy: doctorId
      });

      // Update doctor counter
      const doctorRef = doc(this.firestore, "users", doctorId);
      const activeCount = await this.countDoctorSecretaries(doctorId);

      await updateDoc(doctorRef, {
        secretaryCount: activeCount,
        hasSecretary: activeCount > 0,
        updatedAt: new Date()
      });

      this.log('Secretary deactivated successfully');
      return { success: true };

    } catch (error) {
      this.handleError(error, 'deactivateSecretaryAccount');
    }
  }

  /**
   * Reactivate secretary account
   * @param {string} doctorId - Doctor's user ID
   * @param {string} secretaryId - Secretary ID
   * @returns {Promise<Object>} Reactivation result
   */
  async reactivateSecretaryAccount(doctorId, secretaryId) {
    try {
      this.log(`Reactivating secretary ${secretaryId}...`);

      // Check limits before reactivating
      const activeCount = await this.countDoctorSecretaries(doctorId);
      const doctorDoc = await getDoc(doc(this.firestore, "users", doctorId));
      const doctorData = doctorDoc.data();

      let maxSecretaries = 1;
      if (doctorData?.administrador) {
        maxSecretaries = 10;
      } else if (doctorData?.assinouPlano) {
        maxSecretaries = 5;
      }

      if (activeCount >= maxSecretaries) {
        throw new Error(`Active secretary limit of ${maxSecretaries} reached`);
      }

      // Verify secretary belongs to doctor
      const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
      const secretaryDoc = await getDoc(secretaryRef);

      if (!secretaryDoc.exists()) {
        throw new Error('Secretary not found');
      }

      const secretaryData = secretaryDoc.data();
      if (secretaryData.doctorId !== doctorId) {
        throw new Error('Secretary does not belong to this doctor');
      }

      // Reactivate secretary
      await updateDoc(secretaryRef, {
        active: true,
        reactivatedAt: new Date(),
        reactivatedBy: doctorId
      });

      // Update doctor counter
      const doctorRef = doc(this.firestore, "users", doctorId);
      const newActiveCount = await this.countDoctorSecretaries(doctorId);

      await updateDoc(doctorRef, {
        secretaryCount: newActiveCount,
        hasSecretary: newActiveCount > 0,
        updatedAt: new Date()
      });

      this.log('Secretary reactivated successfully');
      return { success: true };

    } catch (error) {
      this.handleError(error, 'reactivateSecretaryAccount');
    }
  }

  /**
   * Get secretary details
   * @param {string} secretaryId - Secretary ID
   * @param {string} [doctorId] - Optional doctor ID for verification
   * @returns {Promise<Object>} Secretary details
   */
  async getSecretaryDetails(secretaryId, doctorId = null) {
    try {
      this.log(`Fetching secretary details: ${secretaryId}`);

      const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
      const secretaryDoc = await getDoc(secretaryRef);

      if (!secretaryDoc.exists()) {
        throw new Error('Secretary not found');
      }

      const secretaryData = secretaryDoc.data();

      // If doctorId was provided, verify ownership
      if (doctorId && secretaryData.doctorId !== doctorId) {
        throw new Error('Secretary does not belong to this doctor');
      }

      // Fetch responsible doctor data
      const doctorDoc = await getDoc(doc(this.firestore, "users", secretaryData.doctorId));
      const doctorDocData = doctorDoc.exists() ? doctorDoc.data() : null;

      return {
        id: secretaryId,
        name: secretaryData.name,
        email: secretaryData.email,
        active: secretaryData.active,
        permissions: secretaryData.permissions,
        createdAt: secretaryData.createdAt,
        lastLogin: secretaryData.lastLogin,
        loginCount: secretaryData.loginCount || 0,
        doctorId: secretaryData.doctorId,
        doctorName: doctorDocData?.fullName || 'Doctor not found',
        version: secretaryData.version || '1.0'
      };

    } catch (error) {
      this.handleError(error, 'getSecretaryDetails');
    }
  }

  /**
   * Check if user is a valid secretary
   * @param {string} userId - User ID to check
   * @returns {Promise<Object>} Check result
   */
  async checkIfUserIsSecretary(userId) {
    try {
      const secretaryRef = doc(this.firestore, "secretaries", userId);
      const secretaryDoc = await getDoc(secretaryRef);

      if (!secretaryDoc.exists()) {
        return { isSecretary: false };
      }

      const secretaryData = secretaryDoc.data();

      if (!secretaryData.active) {
        return {
          isSecretary: true,
          isActive: false,
          reason: 'Account deactivated'
        };
      }

      // Verify doctor still exists
      const doctorDoc = await getDoc(doc(this.firestore, "users", secretaryData.doctorId));
      if (!doctorDoc.exists()) {
        return {
          isSecretary: true,
          isActive: false,
          reason: 'Responsible doctor not found'
        };
      }

      return {
        isSecretary: true,
        isActive: true,
        secretaryData,
        doctorData: doctorDoc.data(),
        permissions: secretaryData.permissions
      };

    } catch (error) {
      console.error("[SecretaryService] Error checking if is secretary:", error);
      return { isSecretary: false, error: error.message };
    }
  }

  /**
   * Validate if operation can be executed by secretary
   * @param {string} userId - User ID
   * @param {string} requiredModule - Required module
   * @param {string} requiredAction - Required action
   * @returns {Promise<Object>} Validation result
   */
  async validateSecretaryOperation(userId, requiredModule, requiredAction = 'read') {
    try {
      // Verify current user matches
      const currentUser = this.auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('SECURITY: User not authenticated or invalid token');
      }

      // Check if is secretary
      const secretaryCheck = await this.checkIfUserIsSecretary(userId);

      if (!secretaryCheck.isSecretary) {
        return { allowed: true, type: 'doctor' };
      }

      if (!secretaryCheck.isActive) {
        throw new Error(`SECURITY: Secretary account inactive - ${secretaryCheck.reason}`);
      }

      // Check specific permissions
      const permissions = secretaryCheck.permissions || {};
      const modulePermissions = permissions[requiredModule];

      if (!modulePermissions) {
        return {
          allowed: false,
          reason: `Access denied to module: ${requiredModule}`,
          type: 'secretary'
        };
      }

      const hasPermission = modulePermissions[requiredAction] === true;

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Permission denied for action: ${requiredAction} on module: ${requiredModule}`,
          type: 'secretary'
        };
      }

      return {
        allowed: true,
        type: 'secretary',
        doctorId: secretaryCheck.secretaryData.doctorId,
        permissions: permissions
      };

    } catch (error) {
      this.handleError(error, 'validateSecretaryOperation');
    }
  }

  /**
   * Generate secretary report for a doctor
   * @param {string} doctorId - Doctor's user ID
   * @returns {Promise<Object>} Secretary report
   */
  async generateSecretaryReport(doctorId) {
    try {
      this.log(`Generating secretary report for doctor: ${doctorId}`);

      const secretaries = await this.listDoctorSecretaries(doctorId, true);
      const doctorDoc = await getDoc(doc(this.firestore, "users", doctorId));
      const doctorData = doctorDoc.exists() ? doctorDoc.data() : null;

      const report = {
        doctorId,
        doctorName: doctorData?.fullName || 'Doctor not found',
        totalSecretaries: secretaries.length,
        activeSecretaries: secretaries.filter(s => s.active).length,
        inactiveSecretaries: secretaries.filter(s => !s.active).length,
        secretaries,
        generatedAt: new Date(),
        planType: doctorData?.planType || 'unknown',
        maxAllowed: doctorData?.administrador ? 10 : (doctorData?.assinouPlano ? 5 : 1)
      };

      this.log(`Report generated: ${report.activeSecretaries}/${report.maxAllowed} active secretaries`);
      return report;

    } catch (error) {
      this.handleError(error, 'generateSecretaryReport');
    }
  }
}

export const secretaryService = new SecretaryService();
export default secretaryService;
