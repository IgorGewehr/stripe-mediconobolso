'use client';

import { useState, useCallback, useRef } from 'react';
import {
  IconButton,
  Button,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Paperclip,
  Upload,
  X,
  File,
  FileText,
  Image,
  Download,
  Trash2,
} from 'lucide-react';
import storageService from '@/lib/services/api/storage.service';

/**
 * Componente de upload e gerenciamento de anexos para notas clinicas
 */
export default function AttachmentUploader({
  noteId,
  attachments = [],
  isLocked = false,
  onAttachmentAdded,
  onAttachmentRemoved,
  disabled = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachmentDetails, setAttachmentDetails] = useState([]);
  const fileInputRef = useRef(null);

  // Detecta icone baseado no tipo de arquivo
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image')) return Image;
    if (fileType === 'pdf' || fileType?.includes('pdf')) return FileText;
    return File;
  };

  // Formata tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Abre seletor de arquivo
  const handleSelectFile = useCallback(() => {
    if (isLocked || disabled) return;
    fileInputRef.current?.click();
  }, [isLocked, disabled]);

  // Upload de arquivo
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !noteId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload via storage service
      const uploadResult = await storageService.uploadFile(file, {
        category: 'note_attachment',
        entityType: 'ClinicalNote',
        entityId: noteId,
        onProgress: (progress) => setUploadProgress(progress),
      });

      console.log('[AttachmentUploader] Upload concluido:', uploadResult);

      // Notifica o componente pai
      if (onAttachmentAdded && uploadResult?.id) {
        await onAttachmentAdded(uploadResult.id);
      }
    } catch (error) {
      console.error('[AttachmentUploader] Erro no upload:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [noteId, onAttachmentAdded]);

  // Remove anexo
  const handleRemoveAttachment = useCallback(async (fileId) => {
    if (isLocked || disabled) return;

    try {
      if (onAttachmentRemoved) {
        await onAttachmentRemoved(fileId);
      }
    } catch (error) {
      console.error('[AttachmentUploader] Erro ao remover anexo:', error);
    }
  }, [isLocked, disabled, onAttachmentRemoved]);

  // Download/visualizar arquivo
  const handleDownload = useCallback(async (fileId) => {
    try {
      const url = await storageService.getFileUrl(fileId);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('[AttachmentUploader] Erro ao obter URL:', error);
    }
  }, []);

  // Carrega detalhes dos anexos quando abre o dialog
  const handleOpenDialog = useCallback(async () => {
    setDialogOpen(true);

    // Carrega detalhes de cada anexo
    if (attachments.length > 0) {
      try {
        const details = await Promise.all(
          attachments.map(async (fileId) => {
            try {
              const file = await storageService.getFile(fileId);
              return file;
            } catch {
              return { id: fileId, originalName: 'Arquivo', fileType: 'unknown' };
            }
          })
        );
        setAttachmentDetails(details.filter(Boolean));
      } catch (error) {
        console.error('[AttachmentUploader] Erro ao carregar detalhes:', error);
      }
    }
  }, [attachments]);

  const hasAttachments = attachments.length > 0;

  return (
    <>
      {/* Input hidden para upload */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

      {/* Botao de anexo */}
      <div className="flex items-center gap-2">
        <Tooltip title={isLocked ? 'Nota assinada - anexos bloqueados' : 'Gerenciar anexos'}>
          <span>
            <IconButton
              onClick={handleOpenDialog}
              disabled={disabled}
              size="small"
              className={hasAttachments ? 'text-blue-500' : 'text-gray-400'}
            >
              {isUploading ? (
                <CircularProgress size={20} />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </IconButton>
          </span>
        </Tooltip>

        {hasAttachments && (
          <span className="text-xs text-gray-500">
            {attachments.length} anexo{attachments.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Dialog de gerenciamento de anexos */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <span>Anexos da Nota</span>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Botao de upload */}
          {!isLocked && (
            <div className="mb-4">
              <Button
                variant="outlined"
                startIcon={isUploading ? <CircularProgress size={16} /> : <Upload className="w-4 h-4" />}
                onClick={handleSelectFile}
                disabled={isUploading || disabled}
                fullWidth
              >
                {isUploading ? `Enviando... ${uploadProgress}%` : 'Adicionar arquivo'}
              </Button>
            </div>
          )}

          {/* Lista de anexos */}
          {attachmentDetails.length > 0 ? (
            <List dense>
              {attachmentDetails.map((file) => {
                const FileIcon = getFileIcon(file.fileType);
                return (
                  <ListItem key={file.id} className="rounded-lg hover:bg-gray-50">
                    <ListItemIcon>
                      <FileIcon className="w-5 h-5 text-gray-500" />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.originalName || 'Arquivo'}
                      secondary={formatFileSize(file.sizeBytes)}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Baixar/Visualizar">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDownload(file.id)}
                          className="mr-1"
                        >
                          <Download className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                      {!isLocked && (
                        <Tooltip title="Remover">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveAttachment(file.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum anexo</p>
              {!isLocked && (
                <p className="text-sm">Clique em "Adicionar arquivo" para anexar documentos</p>
              )}
            </div>
          )}

          {isLocked && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              Esta nota esta assinada. Nao e possivel adicionar ou remover anexos.
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
