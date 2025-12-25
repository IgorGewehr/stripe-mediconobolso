/**
 * Firebase Helpers
 *
 * Shared helper functions for Firestore operations.
 * Reduces code duplication across services.
 */

import { serverTimestamp } from 'firebase/firestore';

/**
 * Map a Firestore query snapshot to an array of documents with IDs
 * @param {QuerySnapshot} snapshot - Firestore query snapshot
 * @param {Function} [transformer] - Optional transformer function for each doc
 * @returns {Array} Array of documents with id included
 */
export function mapSnapshotToDocs(snapshot, transformer = null) {
  const docs = [];
  snapshot.forEach(docSnap => {
    const doc = { id: docSnap.id, ...docSnap.data() };
    docs.push(transformer ? transformer(doc) : doc);
  });
  return docs;
}

/**
 * Get server timestamp for Firestore
 * @returns {FieldValue} Firestore server timestamp
 */
export function getServerTimestamp() {
  return serverTimestamp();
}

/**
 * Create standard timestamps for new documents
 * @returns {{createdAt: FieldValue, updatedAt: FieldValue}}
 */
export function createTimestamps() {
  const timestamp = serverTimestamp();
  return {
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

/**
 * Create update timestamp
 * @returns {{updatedAt: FieldValue}}
 */
export function updateTimestamp() {
  return {
    updatedAt: serverTimestamp()
  };
}

/**
 * Validate required parameters
 * @param {Object} params - Object with parameter names as keys
 * @throws {Error} If any required parameter is missing
 */
export function validateRequired(params) {
  const missing = Object.entries(params)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Safe document path builder
 * @param {...string} segments - Path segments
 * @returns {string} Joined path
 */
export function buildPath(...segments) {
  return segments.filter(Boolean).join('/');
}

/**
 * Extract common user collection path
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @returns {string} Collection path
 */
export function userCollectionPath(userId, collectionName) {
  validateRequired({ userId, collectionName });
  return `users/${userId}/${collectionName}`;
}

/**
 * Standard error handler result for list operations
 * @param {Error} error - The error
 * @param {string} context - Context description
 * @returns {Array} Empty array
 */
export function handleListError(error, context) {
  const prefix = context.startsWith('[') ? '' : '[FirebaseHelpers] ';
  console.error(`${prefix}${context}:`, error);
  return [];
}

/**
 * Standard error handler result for get operations
 * @param {Error} error - The error
 * @param {string} context - Context description
 * @returns {null}
 */
export function handleGetError(error, context) {
  const prefix = context.startsWith('[') ? '' : '[FirebaseHelpers] ';
  console.error(`${prefix}${context}:`, error);
  return null;
}
