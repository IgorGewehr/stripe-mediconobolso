/**
 * Clinical Notes Service - Gerenciamento de Notas Clínicas Avançadas (Tiptap)
 *
 * Notas com conteúdo estruturado em JSON (formato Tiptap/Notion-like)
 */

import apiService from './apiService';

const ENDPOINT = '/clinical/clinical-notes';
const FOLDERS_ENDPOINT = '/clinical/folders';

/**
 * Serviço de Notas Clínicas Avançadas
 */
const clinicalNotesService = {
  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * Listar todas as notas clínicas
   * @param {Object} params - Parâmetros de filtro
   * @param {string} [params.patientId] - ID do paciente
   * @param {string} [params.authorId] - ID do autor
   * @param {string} [params.folderId] - ID da pasta
   * @param {boolean} [params.isPinned] - Filtrar por fixadas
   * @param {boolean} [params.isArchived] - Filtrar por arquivadas
   * @param {string} [params.search] - Busca por título
   * @param {number} [params.limit] - Limite de resultados
   * @param {number} [params.offset] - Offset para paginação
   */
  async list(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.patientId) queryParams.append('patient_id', params.patientId);
    if (params.authorId) queryParams.append('author_id', params.authorId);
    if (params.folderId) queryParams.append('folder_id', params.folderId);
    if (params.isPinned !== undefined) queryParams.append('is_pinned', params.isPinned);
    if (params.isArchived !== undefined) queryParams.append('is_archived', params.isArchived);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const query = queryParams.toString();
    const url = query ? `${ENDPOINT}?${query}` : ENDPOINT;

    const response = await apiService.get(url);
    const items = response?.items || response || [];
    return Array.isArray(items) ? items.map(normalizeNote) : [];
  },

  /**
   * Listar notas de um paciente
   * @param {string} patientId - ID do paciente
   */
  async listByPatient(patientId) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}`);
    return response.items.map(normalizeNote);
  },

  /**
   * Listar notas fixadas de um paciente
   * @param {string} patientId - ID do paciente
   */
  async listPinnedByPatient(patientId) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}/pinned`);
    return response.items.map(normalizeNote);
  },

  /**
   * Contar notas de um paciente
   * @param {string} patientId - ID do paciente
   */
  async countByPatient(patientId) {
    const response = await apiService.get(`${ENDPOINT}/patient/${patientId}/count`);
    return response.count;
  },

  /**
   * Buscar nota por ID
   * @param {string} noteId - ID da nota
   */
  async getById(noteId) {
    const response = await apiService.get(`${ENDPOINT}/${noteId}`);
    return normalizeNote(response);
  },

  /**
   * Criar nova nota clínica
   * @param {Object} data - Dados da nota
   * @param {string} [data.patientId] - ID do paciente (opcional)
   * @param {string} [data.title] - Título da nota
   * @param {Object} [data.content] - Conteúdo em formato Tiptap JSON
   * @param {string[]} [data.tags] - Tags para categorização
   * @param {string} [data.folderId] - ID da pasta
   * @param {string} [data.coverUrl] - URL da imagem de capa
   */
  async create(data) {
    const payload = {
      title: data.title || '',
      content: data.content || { type: 'doc', content: [] },
      tags: data.tags || [],
    };

    // Apenas inclui patient_id se fornecido (notas podem ser independentes)
    if (data.patientId) {
      payload.patient_id = data.patientId;
    }
    if (data.folderId) {
      payload.folder_id = data.folderId;
    }
    if (data.coverUrl) {
      payload.cover_url = data.coverUrl;
    }

    const response = await apiService.post(ENDPOINT, payload);
    return normalizeNote(response);
  },

  /**
   * Atualizar nota clínica
   * @param {string} noteId - ID da nota
   * @param {Object} data - Dados a atualizar
   * @param {string} [data.title] - Novo título
   * @param {Object} [data.content] - Novo conteúdo em formato Tiptap JSON
   * @param {boolean} [data.isPinned] - Fixar/desafixar nota
   * @param {boolean} [data.isArchived] - Arquivar/desarquivar nota
   * @param {string[]} [data.tags] - Novas tags
   * @param {string} [data.folderId] - ID da pasta
   * @param {string} [data.coverUrl] - URL da imagem de capa
   * @param {string} [data.coverPosition] - Posicao da imagem de capa
   * @param {string} [data.expectedUpdatedAt] - Versao esperada para optimistic locking
   */
  async update(noteId, data) {
    const payload = {};

    if (data.title !== undefined) payload.title = data.title;
    if (data.content !== undefined) payload.content = data.content;
    if (data.isPinned !== undefined) payload.is_pinned = data.isPinned;
    if (data.isArchived !== undefined) payload.is_archived = data.isArchived;
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.folderId !== undefined) payload.folder_id = data.folderId;
    if (data.coverUrl !== undefined) payload.cover_url = data.coverUrl;
    if (data.coverPosition !== undefined) payload.cover_position = data.coverPosition;
    if (data.expectedUpdatedAt) payload.expected_updated_at = data.expectedUpdatedAt;

    const response = await apiService.put(`${ENDPOINT}/${noteId}`, payload);
    return normalizeNote(response);
  },

  /**
   * Excluir nota (soft delete)
   * @param {string} noteId - ID da nota
   */
  async delete(noteId) {
    await apiService.delete(`${ENDPOINT}/${noteId}`);
    return { success: true };
  },

  /**
   * Restaurar nota excluída
   * @param {string} noteId - ID da nota
   */
  async restore(noteId) {
    const response = await apiService.post(`${ENDPOINT}/${noteId}/restore`);
    return normalizeNote(response);
  },

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Fixar/desafixar nota
   * @param {string} noteId - ID da nota
   * @param {boolean} isPinned - Novo estado
   */
  async togglePin(noteId, isPinned) {
    return this.update(noteId, { isPinned });
  },

  /**
   * Arquivar/desarquivar nota
   * @param {string} noteId - ID da nota
   * @param {boolean} isArchived - Novo estado
   */
  async toggleArchive(noteId, isArchived) {
    return this.update(noteId, { isArchived });
  },

  /**
   * Atualizar apenas o conteúdo (para auto-save)
   * @param {string} noteId - ID da nota
   * @param {Object} content - Conteúdo Tiptap JSON
   * @param {string} [title] - Título opcional
   */
  async saveContent(noteId, content, title) {
    const data = { content };
    if (title !== undefined) data.title = title;
    return this.update(noteId, data);
  },

  /**
   * Adicionar tag à nota
   * @param {string} noteId - ID da nota
   * @param {string} tag - Tag a adicionar
   * @param {string[]} currentTags - Tags atuais
   */
  async addTag(noteId, tag, currentTags = []) {
    if (currentTags.includes(tag)) return;
    return this.update(noteId, { tags: [...currentTags, tag] });
  },

  /**
   * Remover tag da nota
   * @param {string} noteId - ID da nota
   * @param {string} tag - Tag a remover
   * @param {string[]} currentTags - Tags atuais
   */
  async removeTag(noteId, tag, currentTags = []) {
    return this.update(noteId, { tags: currentTags.filter(t => t !== tag) });
  },

  /**
   * Mover nota para pasta
   * @param {string} noteId - ID da nota
   * @param {string|null} folderId - ID da pasta (null para remover)
   */
  async moveToFolder(noteId, folderId) {
    return this.update(noteId, { folderId });
  },

  /**
   * Atualizar capa da nota
   * @param {string} noteId - ID da nota
   * @param {string|null} coverUrl - URL da capa (null para remover)
   * @param {string} [coverPosition] - Posicao (ex: 'center')
   */
  async updateCover(noteId, coverUrl, coverPosition = 'center') {
    return this.update(noteId, { coverUrl, coverPosition });
  },

  // =========================================================================
  // Assinatura e Anexos
  // =========================================================================

  /**
   * Assinar e bloquear nota para edicao
   * @param {string} noteId - ID da nota
   */
  async sign(noteId) {
    const response = await apiService.post(`${ENDPOINT}/${noteId}/sign`);
    return normalizeNote(response);
  },

  /**
   * Adicionar anexo a nota
   * @param {string} noteId - ID da nota
   * @param {string} fileId - ID do arquivo (uploaded via storage service)
   */
  async addAttachment(noteId, fileId) {
    const response = await apiService.post(`${ENDPOINT}/${noteId}/attachments`, {
      file_id: fileId,
    });
    return normalizeNote(response);
  },

  /**
   * Remover anexo da nota
   * @param {string} noteId - ID da nota
   * @param {string} fileId - ID do arquivo
   */
  async removeAttachment(noteId, fileId) {
    const response = await apiService.delete(`${ENDPOINT}/${noteId}/attachments/${fileId}`);
    return normalizeNote(response);
  },

  // =========================================================================
  // Folders Operations
  // =========================================================================

  /**
   * Listar todas as pastas
   */
  async listFolders() {
    const response = await apiService.get(FOLDERS_ENDPOINT);
    const items = response?.items || response || [];
    return Array.isArray(items) ? items.map(normalizeFolder) : [];
  },

  /**
   * Buscar pasta por ID
   * @param {string} folderId - ID da pasta
   */
  async getFolderById(folderId) {
    const response = await apiService.get(`${FOLDERS_ENDPOINT}/${folderId}`);
    return normalizeFolder(response);
  },

  /**
   * Criar nova pasta
   * @param {Object} data - Dados da pasta
   * @param {string} data.name - Nome da pasta
   * @param {string} [data.color] - Cor da pasta (hex)
   * @param {string} [data.icon] - Icone da pasta
   * @param {string} [data.parentId] - ID da pasta pai
   */
  async createFolder(data) {
    const payload = {
      name: data.name,
    };
    if (data.color) payload.color = data.color;
    if (data.icon) payload.icon = data.icon;
    if (data.parentId) payload.parent_id = data.parentId;

    const response = await apiService.post(FOLDERS_ENDPOINT, payload);
    return normalizeFolder(response);
  },

  /**
   * Atualizar pasta
   * @param {string} folderId - ID da pasta
   * @param {Object} data - Dados a atualizar
   */
  async updateFolder(folderId, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.color !== undefined) payload.color = data.color;
    if (data.icon !== undefined) payload.icon = data.icon;
    if (data.parentId !== undefined) payload.parent_id = data.parentId;
    if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;

    const response = await apiService.put(`${FOLDERS_ENDPOINT}/${folderId}`, payload);
    return normalizeFolder(response);
  },

  /**
   * Excluir pasta
   * @param {string} folderId - ID da pasta
   */
  async deleteFolder(folderId) {
    await apiService.delete(`${FOLDERS_ENDPOINT}/${folderId}`);
    return { success: true };
  },
};

/**
 * Normaliza dados da nota do backend para o frontend
 * @param {Object} note - Nota do backend
 * @returns {Object} Nota normalizada
 */
function normalizeNote(note) {
  if (!note) return null;

  return {
    id: note.id,
    patientId: note.patient_id || null, // Pode ser null para notas independentes
    authorId: note.author_id,
    title: note.title || '',
    content: note.content || { type: 'doc', content: [] },
    isPinned: note.is_pinned || false,
    isArchived: note.is_archived || false,
    tags: note.tags || [],
    folderId: note.folder_id || null,
    coverUrl: note.cover_url || null,
    coverPosition: note.cover_position || 'center',
    // Anexos
    attachments: note.attachments || [],
    // Assinatura digital
    isLocked: note.is_locked || false,
    signedAt: note.signed_at || null,
    signedBy: note.signed_by || null,
    // Timestamps
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

/**
 * Normaliza dados da pasta do backend para o frontend
 * @param {Object} folder - Pasta do backend
 * @returns {Object} Pasta normalizada
 */
function normalizeFolder(folder) {
  if (!folder) return null;

  return {
    id: folder.id,
    name: folder.name,
    color: folder.color || '#6366f1',
    icon: folder.icon || 'folder',
    parentId: folder.parent_id || null,
    sortOrder: folder.sort_order || 0,
    notesCount: folder.notes_count || 0,
    createdAt: folder.created_at,
    updatedAt: folder.updated_at,
  };
}

export default clinicalNotesService;
