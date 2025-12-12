/**
 * Base Service Class
 *
 * Provides shared functionality for all Firebase domain services.
 * All services should extend this class.
 */

import { auth, firestore, storage, database } from '../../config/firebase.config';
import {
  formatDateTimeToString,
  parseStringToDate,
  processConsultationDates,
  formatFileSize
} from '../../utils/firebase.utils';

export class BaseService {
  // Firebase instances
  auth = auth;
  firestore = firestore;
  storage = storage;
  database = database;

  // Date utilities
  formatDate = formatDateTimeToString;
  parseDate = parseStringToDate;
  processConsultationDates = processConsultationDates;
  formatFileSize = formatFileSize;

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
   * Get Firestore timestamp for current time
   * @returns {Date} Current date
   */
  now() {
    return new Date();
  }
}

export default BaseService;
