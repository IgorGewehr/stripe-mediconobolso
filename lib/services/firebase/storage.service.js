/**
 * Storage Service
 *
 * Handles file upload, download, and deletion operations.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { BaseService } from './base.service';

class StorageService extends BaseService {
  /**
   * Upload a file to Firebase Storage
   * @param {File} file - File to upload
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  async uploadFile(file, path) {
    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      this.log(`File uploaded: ${path}`);
      return downloadURL;
    } catch (error) {
      this.handleError(error, 'uploadFile');
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param {string} fileUrl - Firebase Storage URL
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileUrl) {
    try {
      if (!fileUrl || !fileUrl.includes('firebase')) {
        this.warn('Invalid file URL:', fileUrl);
        return false;
      }

      const decodedUrl = decodeURIComponent(fileUrl);
      const pathStartIndex = decodedUrl.indexOf('/o/') + 3;
      const pathEndIndex = decodedUrl.indexOf('?', pathStartIndex);

      if (pathStartIndex === 2 || pathEndIndex === -1) {
        this.warn('Invalid file URL format:', fileUrl);
        return false;
      }

      const filePath = decodedUrl.substring(pathStartIndex, pathEndIndex);
      const fileRef = ref(this.storage, filePath);
      await deleteObject(fileRef);

      this.log(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error('[StorageService] Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get download URL for a storage path
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  async getFileUrl(path) {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      this.handleError(error, 'getFileUrl');
    }
  }

  /**
   * Generate a unique file path
   * @param {string} userId - User ID
   * @param {string} folder - Folder name
   * @param {string} fileName - Original file name
   * @returns {string} Unique file path
   */
  generateFilePath(userId, folder, fileName) {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/${folder}/${timestamp}_${sanitizedFileName}`;
  }
}

export const storageService = new StorageService();
export default storageService;
