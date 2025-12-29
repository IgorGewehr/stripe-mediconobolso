/**
 * Firebase Services - Aggregator
 *
 * This file exports Firebase authentication services.
 * All data services (patients, appointments, etc.) now use the doctor-server API.
 *
 * Note: Storage service uses doctor-server API instead of Firebase Storage.
 */

// Auth service - Firebase Authentication
export { authService } from './auth.service';

// Storage service - uses doctor-server API
import apiStorageService from '@/lib/services/api/storage.service';
export const storageService = apiStorageService;

// Default export for backward compatibility
export default {
  authService: require('./auth.service').authService,
  storageService: apiStorageService,
};
