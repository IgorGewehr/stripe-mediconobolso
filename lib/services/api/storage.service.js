/**
 * Storage Service - Gerenciamento de Arquivos
 *
 * Substitui o Firebase storage.service.js, comunicando com doctor-server.
 * Mantém compatibilidade total com a interface do Firebase StorageService.
 */

import apiService from './apiService';

const ENDPOINT = '/storage';

// Cache de arquivos por path para mapeamento path -> id
const pathToIdCache = new Map();

/**
 * Categorias de arquivo disponíveis
 */
export const FileCategories = {
  PROFILE_PHOTO: 'profile_photo',
  PATIENT_DOCUMENT: 'patient_document',
  EXAM_RESULT: 'exam_result',
  PRESCRIPTION: 'prescription',
  NOTE_ATTACHMENT: 'note_attachment',
  MEDICAL_CERTIFICATE: 'medical_certificate',
  CONSENT_FORM: 'consent_form',
  INSURANCE_DOCUMENT: 'insurance_document',
  BILLING_DOCUMENT: 'billing_document',
  OTHER: 'other',
};

/**
 * Serviço de Storage - Interface compatível com Firebase
 */
const storageService = {
  // =========================================================================
  // Métodos principais - Interface compatível com Firebase StorageService
  // =========================================================================

  /**
   * Upload a file to storage
   * Compatível com Firebase: uploadFile(file, path) -> URL
   *
   * @param {File|Blob} file - File to upload
   * @param {string|Object} pathOrOptions - Storage path (string) or options object
   * @returns {Promise<string>} Download URL
   */
  async uploadFile(file, pathOrOptions = {}) {
    try {
      // Se for string (path), converter para options
      const options = typeof pathOrOptions === 'string'
        ? { path: pathOrOptions, category: categoryFromPath(pathOrOptions) }
        : pathOrOptions;

      const { category = 'other', entityType, entityId, path } = options;

      // Monta query params
      const params = new URLSearchParams();
      params.append('category', category);
      if (entityType) params.append('entity_type', entityType);
      if (entityId) params.append('entity_id', entityId);

      const endpoint = `${ENDPOINT}/upload?${params.toString()}`;
      const response = await apiService.upload(endpoint, file);

      // Normaliza a resposta
      const normalized = normalizeFile(response);

      // Armazena no cache para lookup posterior
      if (path) {
        pathToIdCache.set(path, normalized.id);
      }
      if (normalized.storagePath) {
        pathToIdCache.set(normalized.storagePath, normalized.id);
      }

      console.log(`[StorageService] File uploaded: ${normalized.storagePath}`);

      // Retorna URL para compatibilidade com Firebase
      return normalized.publicUrl || normalized.storagePath;
    } catch (error) {
      console.error('[StorageService] Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Delete a file from storage
   * Compatível com Firebase: deleteFile(fileUrl) -> boolean
   *
   * @param {string} fileUrlOrId - File URL, storage path, or file ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileUrlOrId) {
    try {
      if (!fileUrlOrId) {
        console.warn('[StorageService] Invalid file URL/ID:', fileUrlOrId);
        return false;
      }

      // Extrai o ID do arquivo
      const fileId = await this._resolveFileId(fileUrlOrId);

      if (!fileId) {
        console.warn('[StorageService] Could not resolve file ID from:', fileUrlOrId);
        return false;
      }

      await apiService.delete(`${ENDPOINT}/files/${fileId}`);
      console.log(`[StorageService] File deleted: ${fileId}`);
      return true;
    } catch (error) {
      console.error('[StorageService] Error deleting file:', error);
      return false;
    }
  },

  /**
   * Get download URL for a storage path
   * Compatível com Firebase: getFileUrl(path) -> URL
   *
   * @param {string} pathOrId - Storage path or file ID
   * @returns {Promise<string>} Download URL
   */
  async getFileUrl(pathOrId) {
    try {
      const fileId = await this._resolveFileId(pathOrId);

      if (!fileId) {
        console.warn('[StorageService] Could not resolve file ID from:', pathOrId);
        throw new Error('File not found');
      }

      const response = await apiService.get(`${ENDPOINT}/files/${fileId}/url`);
      return response.url;
    } catch (error) {
      console.error('[StorageService] Error getting file URL:', error);
      throw error;
    }
  },

  /**
   * Get storage file URL (alias for getFileUrl)
   * @param {string} path - Storage path
   * @returns {Promise<string>} Download URL
   */
  async getStorageFileUrl(path) {
    return this.getFileUrl(path);
  },

  /**
   * Generate a unique file path
   * Compatível com Firebase
   *
   * @param {string} userId - User ID
   * @param {string} folder - Folder name
   * @param {string} fileName - Original file name
   * @returns {string} Unique file path
   */
  generateFilePath(userId, folder, fileName) {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/${folder}/${timestamp}_${sanitizedFileName}`;
  },

  // =========================================================================
  // Métodos adicionais da API
  // =========================================================================

  /**
   * Listar arquivos do usuário
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Object>} Lista de arquivos e total
   */
  async listFiles(options = {}) {
    const { category, limit = 50, offset = 0 } = options;

    const params = { limit, offset };
    if (category) params.category = category;

    const response = await apiService.get(`${ENDPOINT}/files`, params);

    const files = (response.files || []).map(normalizeFile);

    // Atualiza cache
    files.forEach((file) => {
      if (file.storagePath) {
        pathToIdCache.set(file.storagePath, file.id);
      }
    });

    return {
      files,
      total: response.total || 0,
    };
  },

  /**
   * Listar arquivos de uma entidade
   * @param {string} entityType - Tipo de entidade
   * @param {string} entityId - ID da entidade
   * @returns {Promise<Array>} Lista de arquivos
   */
  async listEntityFiles(entityType, entityId) {
    const response = await apiService.get(`${ENDPOINT}/files/entity`, {
      entity_type: entityType,
      entity_id: entityId,
    });

    const files = (response.files || []).map(normalizeFile);

    // Atualiza cache
    files.forEach((file) => {
      if (file.storagePath) {
        pathToIdCache.set(file.storagePath, file.id);
      }
    });

    return files;
  },

  /**
   * Obter informações de um arquivo
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Object>} Informações do arquivo
   */
  async getFile(fileId) {
    const response = await apiService.get(`${ENDPOINT}/files/${fileId}`);
    return normalizeFile(response);
  },

  /**
   * Download de arquivo
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Blob>} Conteúdo do arquivo
   */
  async downloadFile(fileId) {
    return apiService.download(`${ENDPOINT}/files/${fileId}/download`);
  },

  // =========================================================================
  // Métodos internos
  // =========================================================================

  /**
   * Resolve um path/URL/ID para um file ID
   * @private
   */
  async _resolveFileId(pathOrUrlOrId) {
    // Se for um UUID válido, retorna diretamente
    if (isUUID(pathOrUrlOrId)) {
      return pathOrUrlOrId;
    }

    // Verifica no cache
    if (pathToIdCache.has(pathOrUrlOrId)) {
      return pathToIdCache.get(pathOrUrlOrId);
    }

    // Tenta extrair ID de uma URL
    const uuidMatch = pathOrUrlOrId.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      return uuidMatch[1];
    }

    // Tenta buscar o arquivo pelo path
    try {
      const files = await this.listFiles({ limit: 100 });
      const file = files.files.find((f) =>
        f.storagePath === pathOrUrlOrId ||
        f.publicUrl === pathOrUrlOrId ||
        pathOrUrlOrId.includes(f.storagePath)
      );
      if (file) {
        pathToIdCache.set(pathOrUrlOrId, file.id);
        return file.id;
      }
    } catch (e) {
      console.warn('[StorageService] Error searching for file:', e);
    }

    return null;
  },

  /**
   * Determina categoria baseada no path
   * @param {string} path - Path do arquivo
   * @returns {string} Categoria
   */
  categoryFromPath(path) {
    return categoryFromPath(path);
  },
};

// =========================================================================
// Helpers
// =========================================================================

/**
 * Normaliza dados do arquivo do backend para o frontend
 */
function normalizeFile(file) {
  if (!file) return null;

  return {
    id: file.id,
    originalName: file.original_name,
    storedName: file.stored_name,
    storagePath: file.storage_path,
    publicUrl: file.public_url,
    fileType: file.file_type,
    category: file.category,
    contentType: file.content_type,
    sizeBytes: file.size_bytes,
    relatedEntityType: file.related_entity_type,
    relatedEntityId: file.related_entity_id,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
  };
}

/**
 * Determina categoria baseada no path
 */
function categoryFromPath(path) {
  if (!path) return FileCategories.OTHER;

  const pathLower = path.toLowerCase();

  if (pathLower.includes('profile') || pathLower.includes('avatar') || pathLower.includes('photo')) {
    return FileCategories.PROFILE_PHOTO;
  }
  if (pathLower.includes('exam') || pathLower.includes('exame')) {
    return FileCategories.EXAM_RESULT;
  }
  if (pathLower.includes('prescription') || pathLower.includes('receita')) {
    return FileCategories.PRESCRIPTION;
  }
  if (pathLower.includes('note') || pathLower.includes('evolucao') || pathLower.includes('evolução')) {
    return FileCategories.NOTE_ATTACHMENT;
  }
  if (pathLower.includes('patient') || pathLower.includes('paciente') || pathLower.includes('document')) {
    return FileCategories.PATIENT_DOCUMENT;
  }
  if (pathLower.includes('atestado') || pathLower.includes('certificate')) {
    return FileCategories.MEDICAL_CERTIFICATE;
  }
  if (pathLower.includes('consent') || pathLower.includes('termo')) {
    return FileCategories.CONSENT_FORM;
  }
  if (pathLower.includes('insurance') || pathLower.includes('convenio') || pathLower.includes('convênio')) {
    return FileCategories.INSURANCE_DOCUMENT;
  }
  if (pathLower.includes('billing') || pathLower.includes('fatura') || pathLower.includes('nfse')) {
    return FileCategories.BILLING_DOCUMENT;
  }

  return FileCategories.OTHER;
}

/**
 * Verifica se uma string é um UUID válido
 */
function isUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default storageService;
