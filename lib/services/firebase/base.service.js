/**
 * Base Service Class
 *
 * Provides shared functionality for all Firebase domain services.
 * All services should extend this class.
 * Uses firebaseHelpers for common operations to avoid code duplication.
 */

import { auth, firestore, storage, database } from '../../config/firebase.config';
import {
  formatDateTimeToString,
  parseStringToDate,
  processConsultationDates,
  formatFileSize
} from '../../utils/firebase.utils';
import {
  parseAnyDate,
  calculateAge,
  matchesAgeRange,
  getTimeDiff
} from '../../utils/date.utils';
import {
  mapSnapshotToDocs as helperMapSnapshotToDocs,
  getServerTimestamp,
  createTimestamps as helperCreateTimestamps,
  updateTimestamp as helperUpdateTimestamp,
  validateRequired as helperValidateRequired,
  userCollectionPath as helperUserCollectionPath,
  handleListError as helperHandleListError,
  handleGetError as helperHandleGetError,
} from '../../utils/firebaseHelpers';

export class BaseService {
  // Firebase instances
  auth = auth;
  firestore = firestore;
  storage = storage;
  database = database;

  // Legacy date utilities (for backward compatibility)
  formatDate = formatDateTimeToString;
  parseDate = parseStringToDate;
  processConsultationDates = processConsultationDates;
  formatFileSize = formatFileSize;

  // Enhanced date utilities
  parseAnyDate = parseAnyDate;
  calculateAge = calculateAge;
  matchesAgeRange = matchesAgeRange;
  getTimeDiff = getTimeDiff;

  /**
   * Handle errors with consistent logging
   * @param {Error} error - The error to handle
   * @param {string} context - Context description for the error
   * @throws {Error} Re-throws the error after logging
   */
  handleError(error, context) {
    console.error(`[${this.constructor.name}] ${context}:`, error);
    throw error;
  }

  /**
   * Handle errors for list operations (returns empty array)
   * @param {Error} error - The error to handle
   * @param {string} context - Context description
   * @returns {Array} Empty array
   */
  handleListError(error, context) {
    return helperHandleListError(error, `[${this.constructor.name}] ${context}`);
  }

  /**
   * Handle errors for get operations (returns null)
   * @param {Error} error - The error to handle
   * @param {string} context - Context description
   * @returns {null}
   */
  handleGetError(error, context) {
    return helperHandleGetError(error, `[${this.constructor.name}] ${context}`);
  }

  /**
   * Log messages with service name prefix
   * @param {string} message - Message to log
   * @param {any} [data] - Optional data to include
   */
  log(message, data = null) {
    if (data) {
      console.log(`[${this.constructor.name}] ${message}`, data);
    } else {
      console.log(`[${this.constructor.name}] ${message}`);
    }
  }

  /**
   * Log warnings with service name prefix
   * @param {string} message - Warning message
   * @param {any} [data] - Optional data to include
   */
  warn(message, data = null) {
    if (data) {
      console.warn(`[${this.constructor.name}] ${message}`, data);
    } else {
      console.warn(`[${this.constructor.name}] ${message}`);
    }
  }

  /**
   * Get Firestore server timestamp
   * @returns {FieldValue} Firestore server timestamp
   */
  getTimestamp() {
    return getServerTimestamp();
  }

  /**
   * Get current date (legacy, prefer getTimestamp for Firestore)
   * @returns {Date} Current date
   */
  now() {
    return new Date();
  }

  /**
   * Create timestamps for new documents
   * @returns {{createdAt: FieldValue, updatedAt: FieldValue}}
   */
  createTimestamps() {
    return helperCreateTimestamps();
  }

  /**
   * Create update timestamp
   * @returns {{updatedAt: FieldValue}}
   */
  updateTimestamp() {
    return helperUpdateTimestamp();
  }

  /**
   * Map a Firestore query snapshot to an array of documents
   * @param {QuerySnapshot} snapshot - Firestore query snapshot
   * @param {Function} [transformer] - Optional transformer function
   * @returns {Array} Array of documents with id included
   */
  mapSnapshotToDocs(snapshot, transformer = null) {
    return helperMapSnapshotToDocs(snapshot, transformer);
  }

  /**
   * Validate required parameters
   * @param {Object} params - Object with parameter names as keys
   * @throws {Error} If any required parameter is missing
   */
  validateRequired(params) {
    return helperValidateRequired(params);
  }

  /**
   * Build a user collection path
   * @param {string} userId - User ID
   * @param {string} collectionName - Collection name
   * @returns {string} Collection path
   */
  userCollectionPath(userId, collectionName) {
    return helperUserCollectionPath(userId, collectionName);
  }
}

export default BaseService;
