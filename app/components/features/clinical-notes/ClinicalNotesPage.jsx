"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import MedicalEditor from './MedicalEditor';
import { NOTE_TEMPLATES } from './templates';
import clinicalNotesService from '@/lib/services/api/clinical-notes.service';
import {
  Plus,
  Search,
  Pin,
  Archive,
  Trash2,
  MoreVertical,
  FileText,
  Clock,
  PinOff,
  ArchiveRestore,
  NotebookPen,
  Tag,
  Image,
  X,
  FolderPlus,
  Folder,
  ClipboardList,
  CheckSquare,
  Users,
  Calendar,
  BookOpen,
  Edit2,
  Trash,
  Home,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import debounce from 'lodash/debounce';

// =============================================================================
// TEMPLATE ICON MAPPING
// =============================================================================

const TEMPLATE_ICONS = {
  FileText,
  ClipboardList,
  CheckSquare,
  Users,
  Calendar,
  BookOpen,
};

// =============================================================================
// COVER IMAGE PICKER
// =============================================================================

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop',
];

const CoverPicker = ({ currentCover, onSelect, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {currentCover ? (
        <div className="relative h-40 overflow-hidden group">
          <img
            src={currentCover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
            <Button
              size="small"
              variant="contained"
              onClick={() => setIsOpen(true)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                color: 'text.primary',
                '&:hover': { bgcolor: 'white' },
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Trocar capa
            </Button>
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'white' },
              }}
            >
              <X className="w-4 h-4 text-red-500" />
            </IconButton>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-14 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-500 hover:from-slate-100 hover:to-slate-150 transition-all group"
        >
          <Image className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Adicionar capa</span>
        </button>
      )}

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Escolher imagem de capa</DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {COVER_IMAGES.map((url, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(url);
                  setIsOpen(false);
                }}
                className="h-24 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all transform hover:scale-[1.02]"
              >
                <img src={url} alt={`Cover ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// =============================================================================
// TEMPLATE SELECTOR DIALOG
// =============================================================================

const TemplateSelector = ({ open, onClose, onSelect }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Sparkles className="w-5 h-5 text-primary" />
        Criar nova nota
      </DialogTitle>
      <DialogContent>
        <p className="text-sm text-slate-500 mb-4">
          Escolha um modelo para comecar ou crie uma nota em branco
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {NOTE_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICONS[template.icon] || FileText;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="p-5 border border-slate-200 rounded-xl hover:border-primary hover:shadow-md transition-all text-left group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${template.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: template.color }} />
                </div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {template.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// NOTE CARD COMPONENT
// =============================================================================

const NoteCard = ({ note, isSelected, onClick, onPin, onArchive, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias`;
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getPreviewText = (content) => {
    if (!content?.content) return 'Nota vazia...';
    const text = content.content
      .map(node => {
        if (node.type === 'paragraph' && node.content) {
          return node.content.map(c => c.text || '').join('');
        }
        if (node.type === 'heading' && node.content) {
          return node.content.map(c => c.text || '').join('');
        }
        return '';
      })
      .join(' ')
      .slice(0, 80);
    return text || 'Nota vazia...';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-slate-50 border-l-2 border-l-transparent"
      )}
    >
      {/* Mini cover */}
      {note.coverUrl && (
        <div className="h-16 -mx-4 -mt-4 mb-3 overflow-hidden">
          <img src={note.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
            <h4 className={cn(
              "font-medium truncate text-sm",
              isSelected ? "text-primary" : "text-slate-800"
            )}>
              {note.title || 'Sem titulo'}
            </h4>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">
            {getPreviewText(note.content)}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
              <Clock className="w-2.5 h-2.5" />
              {formatDate(note.updatedAt)}
            </span>
            {note.tags?.length > 0 && (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {note.tags.length} tag{note.tags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <IconButton
          size="small"
          onClick={handleMenuClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          sx={{ width: 28, height: 28 }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </IconButton>
      </div>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 160 }
        }}
      >
        <MenuItem onClick={() => { onPin(note); handleMenuClose(); }} sx={{ fontSize: 14 }}>
          {note.isPinned ? (
            <><PinOff className="w-4 h-4 mr-2" /> Desafixar</>
          ) : (
            <><Pin className="w-4 h-4 mr-2" /> Fixar</>
          )}
        </MenuItem>
        <MenuItem onClick={() => { onArchive(note); handleMenuClose(); }} sx={{ fontSize: 14 }}>
          {note.isArchived ? (
            <><ArchiveRestore className="w-4 h-4 mr-2" /> Restaurar</>
          ) : (
            <><Archive className="w-4 h-4 mr-2" /> Arquivar</>
          )}
        </MenuItem>
        <MenuItem onClick={() => { onDelete(note); handleMenuClose(); }} sx={{ fontSize: 14, color: 'error.main' }}>
          <Trash2 className="w-4 h-4 mr-2" /> Excluir
        </MenuItem>
      </Menu>
    </div>
  );
};

// =============================================================================
// TAG EDITOR COMPONENT
// =============================================================================

const TagEditor = ({ tags = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag className="w-3.5 h-3.5 text-slate-400" />
      {tags.map(tag => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          onDelete={() => handleRemoveTag(tag)}
          sx={{
            height: 24,
            fontSize: 12,
            '& .MuiChip-deleteIcon': { fontSize: 14 }
          }}
        />
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAddTag}
        placeholder="Adicionar tag..."
        className="text-xs border-none outline-none bg-transparent text-slate-600 placeholder-slate-400 w-20"
      />
    </div>
  );
};

// =============================================================================
// FOLDER COLORS
// =============================================================================

const FOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#64748b',
];

// =============================================================================
// FOLDER CREATE/EDIT DIALOG
// =============================================================================

const FolderDialog = ({ open, onClose, folder = null, onSave }) => {
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || FOLDER_COLORS[0]);

  React.useEffect(() => {
    if (open) {
      setName(folder?.name || '');
      setColor(folder?.color || FOLDER_COLORS[0]);
    }
  }, [open, folder]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{folder ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nome da pasta"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          sx={{ mb: 2 }}
        />
        <div>
          <p className="text-sm text-slate-500 mb-2">Cor</p>
          <div className="flex gap-2 flex-wrap">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all hover:scale-110",
                  color === c && "ring-2 ring-offset-2"
                )}
                style={{ backgroundColor: c, ringColor: c }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          {folder ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// COLLAPSIBLE FOLDER SIDEBAR
// =============================================================================

const FolderSidebar = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  isCollapsed,
  onToggleCollapse
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);

  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFolder(folder);
    setMenuAnchor(e.currentTarget);
  };

  return (
    <div className={cn(
      "bg-slate-50/80 backdrop-blur-sm border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-14" : "w-52"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-14 border-b border-slate-200/80 px-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pastas
          </span>
        )}
        <div className="flex items-center gap-1">
          {!isCollapsed && (
            <Tooltip title="Nova Pasta" arrow>
              <IconButton onClick={onCreateFolder} size="small">
                <FolderPlus className="w-4 h-4 text-slate-500" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isCollapsed ? "Expandir" : "Recolher"} arrow>
            <IconButton onClick={onToggleCollapse} size="small">
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-slate-500" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* All Notes */}
        <Tooltip title={isCollapsed ? "Todas as Notas" : ""} placement="right" arrow>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectFolder(null)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectFolder(null)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all mb-1",
              !selectedFolder
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:bg-white/60"
            )}
          >
            <Home className={cn("w-4 h-4 flex-shrink-0", !selectedFolder && "text-primary")} />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">Todas</span>
            )}
          </div>
        </Tooltip>

        {/* Divider */}
        {!isCollapsed && folders.length > 0 && (
          <div className="h-px bg-slate-200/80 my-2 mx-2" />
        )}

        {/* Folder Items */}
        {folders.map((folder) => (
          <Tooltip
            key={folder.id}
            title={isCollapsed ? folder.name : ""}
            placement="right"
            arrow
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectFolder(folder)}
              onContextMenu={(e) => handleContextMenu(e, folder)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectFolder(folder)}
              className={cn(
                "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all mb-1",
                selectedFolder?.id === folder.id
                  ? "bg-white shadow-sm"
                  : "hover:bg-white/60"
              )}
            >
              <Folder
                className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ color: folder.color }}
              />
              {!isCollapsed && (
                <>
                  <span className={cn(
                    "text-sm truncate flex-1",
                    selectedFolder?.id === folder.id ? "font-medium text-slate-900" : "text-slate-600"
                  )}>
                    {folder.name}
                  </span>
                  <IconButton
                    size="small"
                    onClick={(e) => handleContextMenu(e, folder)}
                    className="opacity-0 group-hover:opacity-100"
                    sx={{ width: 24, height: 24, p: 0 }}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  </IconButton>
                </>
              )}
            </div>
          </Tooltip>
        ))}

        {!isCollapsed && folders.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6 px-2">
            Organize suas notas criando pastas
          </p>
        )}
      </div>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}
      >
        <MenuItem onClick={() => { onEditFolder(activeFolder); setMenuAnchor(null); }} sx={{ fontSize: 14 }}>
          <Edit2 className="w-4 h-4 mr-2" /> Editar
        </MenuItem>
        <MenuItem onClick={() => { onDeleteFolder(activeFolder); setMenuAnchor(null); }} sx={{ fontSize: 14, color: 'error.main' }}>
          <Trash className="w-4 h-4 mr-2" /> Excluir
        </MenuItem>
      </Menu>
    </div>
  );
};

// =============================================================================
// COLLAPSIBLE NOTES LIST
// =============================================================================

const NotesList = ({
  notes,
  selectedNote,
  selectedFolder,
  isLoading,
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
  onSelectNote,
  onCreateNote,
  onPin,
  onArchive,
  onDelete,
  isCollapsed,
  onToggleCollapse,
  isCreating,
}) => {
  // Sort notes (pinned first, then by date)
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes]);

  if (isCollapsed) {
    return (
      <div className="w-14 bg-white border-r border-slate-200/80 flex flex-col items-center py-3">
        <Tooltip title="Expandir lista" placement="right" arrow>
          <IconButton onClick={onToggleCollapse} size="small" sx={{ mb: 2 }}>
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Nova nota" placement="right" arrow>
          <IconButton
            onClick={onCreateNote}
            size="small"
            disabled={isCreating}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              mb: 2,
            }}
          >
            <Plus className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto py-2">
          {sortedNotes.slice(0, 8).map((note) => (
            <Tooltip key={note.id} title={note.title || 'Sem titulo'} placement="right" arrow>
              <div
                onClick={() => onSelectNote(note)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                  selectedNote?.id === note.id
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <FileText className="w-4 h-4" />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-slate-200/80 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {selectedFolder ? (
              <Folder className="w-5 h-5" style={{ color: selectedFolder.color }} />
            ) : (
              <NotebookPen className="w-5 h-5 text-primary" />
            )}
            <h2 className="font-semibold text-slate-900 truncate">
              {selectedFolder?.name || 'Todas as Notas'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="Nova Nota" arrow>
              <IconButton
                onClick={onCreateNote}
                size="small"
                disabled={isCreating}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 32,
                  height: 32,
                }}
              >
                <Plus className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recolher" arrow>
              <IconButton onClick={onToggleCollapse} size="small">
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar notas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="w-4 h-4 text-slate-400" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, fontSize: 14 }
          }}
        />

        {/* Filter chips */}
        <div className="flex items-center gap-2 mt-3">
          <Chip
            label="Ativas"
            size="small"
            onClick={() => setShowArchived(false)}
            variant={!showArchived ? "filled" : "outlined"}
            color={!showArchived ? "primary" : "default"}
            sx={{ height: 26, fontSize: 12 }}
          />
          <Chip
            label="Arquivadas"
            size="small"
            onClick={() => setShowArchived(true)}
            variant={showArchived ? "filled" : "outlined"}
            color={showArchived ? "primary" : "default"}
            icon={<Archive className="w-3 h-3" />}
            sx={{ height: 26, fontSize: 12 }}
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <CircularProgress size={24} />
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
            </p>
            {!searchQuery && (
              <Button
                variant="outlined"
                size="small"
                onClick={onCreateNote}
                startIcon={<Plus className="w-4 h-4" />}
                sx={{ textTransform: 'none' }}
              >
                Criar primeira nota
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNote?.id === note.id}
                onClick={() => onSelectNote(note)}
                onPin={onPin}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

const ClinicalNotesPage = () => {
  const queryClient = useQueryClient();

  // UI State
  const [folderSidebarCollapsed, setFolderSidebarCollapsed] = useState(false);
  const [notesListCollapsed, setNotesListCollapsed] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState([]);
  const [editedCover, setEditedCover] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Snackbar helpers
  const showSuccess = (message) => setSnackbar({ open: true, message, severity: 'success' });
  const showError = (message) => setSnackbar({ open: true, message, severity: 'error' });
  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Fetch folders
  const { data: foldersData = [] } = useQuery({
    queryKey: ['clinical-note-folders'],
    queryFn: () => clinicalNotesService.listFolders(),
  });

  // Folder mutations
  const createFolderMutation = useMutation({
    mutationFn: (data) => clinicalNotesService.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-note-folders']);
      showSuccess('Pasta criada');
    },
    onError: () => showError('Erro ao criar pasta'),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, data }) => clinicalNotesService.updateFolder(folderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-note-folders']);
      showSuccess('Pasta atualizada');
    },
    onError: () => showError('Erro ao atualizar pasta'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId) => clinicalNotesService.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-note-folders']);
      queryClient.invalidateQueries(['clinical-notes']);
      if (selectedFolder?.id === folderToDelete?.id) setSelectedFolder(null);
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
      showSuccess('Pasta excluida');
    },
    onError: () => showError('Erro ao excluir pasta'),
  });

  // Fetch notes
  const { data: notesData, isLoading: loadingNotes } = useQuery({
    queryKey: ['clinical-notes', showArchived, searchQuery, selectedFolder?.id],
    queryFn: () => clinicalNotesService.list({
      isArchived: showArchived || undefined,
      search: searchQuery || undefined,
      folderId: selectedFolder?.id,
    }),
  });
  const notes = notesData || [];

  // Note mutations
  const createMutation = useMutation({
    mutationFn: (data) => clinicalNotesService.create(data),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries(['clinical-notes']);
      setSelectedNote(newNote);
      setEditedContent(newNote.content);
      setEditedTitle(newNote.title);
      setEditedTags(newNote.tags || []);
      setEditedCover(newNote.coverUrl || null);
      showSuccess('Nota criada');
    },
    onError: () => showError('Erro ao criar nota'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, data }) => clinicalNotesService.update(noteId, data),
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries(['clinical-notes']);
      setSelectedNote(updatedNote);
    },
    onError: () => showError('Erro ao salvar nota'),
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => clinicalNotesService.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-notes']);
      setSelectedNote(null);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      showSuccess('Nota excluida');
    },
    onError: () => showError('Erro ao excluir nota'),
  });

  // Debounced auto-save
  const debouncedSave = useMemo(
    () => debounce((noteId, content, title, tags, coverUrl) => {
      if (!noteId) return;
      setIsSaving(true);
      clinicalNotesService.update(noteId, { content, title, tags, coverUrl })
        .then(() => queryClient.invalidateQueries(['clinical-notes']))
        .finally(() => setIsSaving(false));
    }, 2000),
    [queryClient]
  );

  // Handlers
  const handleContentUpdate = useCallback((content) => {
    setEditedContent(content);
    if (selectedNote?.id) {
      debouncedSave(selectedNote.id, content, editedTitle, editedTags, editedCover);
    }
  }, [selectedNote?.id, editedTitle, editedTags, editedCover, debouncedSave]);

  const handleTitleChange = useCallback((e) => {
    const title = e.target.value;
    setEditedTitle(title);
    if (selectedNote?.id) {
      debouncedSave(selectedNote.id, editedContent, title, editedTags, editedCover);
    }
  }, [selectedNote?.id, editedContent, editedTags, editedCover, debouncedSave]);

  const handleTagsChange = useCallback((tags) => {
    setEditedTags(tags);
    if (selectedNote?.id) {
      debouncedSave(selectedNote.id, editedContent, editedTitle, tags, editedCover);
    }
  }, [selectedNote?.id, editedContent, editedTitle, editedCover, debouncedSave]);

  const handleCoverChange = useCallback((coverUrl) => {
    setEditedCover(coverUrl);
    if (selectedNote?.id) {
      updateMutation.mutate({ noteId: selectedNote.id, data: { coverUrl } });
    }
  }, [selectedNote?.id, updateMutation]);

  const handleCreateFromTemplate = useCallback((template) => {
    setTemplateDialogOpen(false);
    createMutation.mutate({
      title: template.name !== 'Nota em Branco' ? template.name : 'Nova Nota',
      content: template.content,
      tags: [],
      folderId: selectedFolder?.id,
    });
  }, [createMutation, selectedFolder?.id]);

  const handleSelectNote = useCallback((note) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setEditedTitle(note.title);
    setEditedTags(note.tags || []);
    setEditedCover(note.coverUrl || null);
  }, []);

  const handleTogglePin = useCallback((note) => {
    updateMutation.mutate({ noteId: note.id, data: { isPinned: !note.isPinned } });
  }, [updateMutation]);

  const handleToggleArchive = useCallback((note) => {
    updateMutation.mutate({ noteId: note.id, data: { isArchived: !note.isArchived } });
  }, [updateMutation]);

  const handleDeleteNote = useCallback((note) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (noteToDelete) deleteMutation.mutate(noteToDelete.id);
  }, [noteToDelete, deleteMutation]);

  const handleSaveFolder = useCallback((data) => {
    if (folderToEdit) {
      updateFolderMutation.mutate({ folderId: folderToEdit.id, data });
    } else {
      createFolderMutation.mutate(data);
    }
    setFolderToEdit(null);
  }, [folderToEdit, updateFolderMutation, createFolderMutation]);

  const confirmDeleteFolder = useCallback(() => {
    if (folderToDelete) deleteFolderMutation.mutate(folderToDelete.id);
  }, [folderToDelete, deleteFolderMutation]);

  return (
    <div className="h-full flex bg-slate-100/50">
      {/* Folder Sidebar */}
      <FolderSidebar
        folders={foldersData}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={() => { setFolderToEdit(null); setFolderDialogOpen(true); }}
        onEditFolder={(folder) => { setFolderToEdit(folder); setFolderDialogOpen(true); }}
        onDeleteFolder={(folder) => { setFolderToDelete(folder); setDeleteFolderDialogOpen(true); }}
        isCollapsed={folderSidebarCollapsed}
        onToggleCollapse={() => setFolderSidebarCollapsed(!folderSidebarCollapsed)}
      />

      {/* Notes List */}
      <NotesList
        notes={notes}
        selectedNote={selectedNote}
        selectedFolder={selectedFolder}
        isLoading={loadingNotes}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        onSelectNote={handleSelectNote}
        onCreateNote={() => setTemplateDialogOpen(true)}
        onPin={handleTogglePin}
        onArchive={handleToggleArchive}
        onDelete={handleDeleteNote}
        isCollapsed={notesListCollapsed}
        onToggleCollapse={() => setNotesListCollapsed(!notesListCollapsed)}
        isCreating={createMutation.isPending}
      />

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedNote ? (
          <>
            {/* Cover */}
            <CoverPicker
              currentCover={editedCover}
              onSelect={handleCoverChange}
              onRemove={() => handleCoverChange(null)}
            />

            {/* Editor Header */}
            <div className="px-8 py-5 border-b border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={handleTitleChange}
                  placeholder="Titulo da nota..."
                  className="text-2xl font-semibold text-slate-900 bg-transparent border-none outline-none flex-1 placeholder-slate-300"
                />
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full">
                      <CircularProgress size={10} />
                      Salvando...
                    </span>
                  )}
                  <Tooltip title={selectedNote.isPinned ? "Desafixar" : "Fixar"} arrow>
                    <IconButton size="small" onClick={() => handleTogglePin(selectedNote)}>
                      <Pin className={cn("w-4 h-4", selectedNote.isPinned && "text-amber-500 fill-amber-500")} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={selectedNote.isArchived ? "Restaurar" : "Arquivar"} arrow>
                    <IconButton size="small" onClick={() => handleToggleArchive(selectedNote)}>
                      <Archive className={cn("w-4 h-4", selectedNote.isArchived && "text-blue-500")} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir" arrow>
                    <IconButton size="small" onClick={() => handleDeleteNote(selectedNote)}>
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
              <TagEditor tags={editedTags} onChange={handleTagsChange} />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <MedicalEditor
                content={editedContent}
                onUpdate={handleContentUpdate}
                placeholder="Comece a escrever ou digite '/' para ver comandos..."
                autoFocus
                className="min-h-[500px] border-0 shadow-none"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6">
                <NotebookPen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Suas anotacoes pessoais
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Organize ideias, lembretes, protocolos medicos ou qualquer informacao importante.
                Tudo sincronizado e seguro.
              </p>
              <Button
                variant="contained"
                onClick={() => setTemplateDialogOpen(true)}
                startIcon={<Plus className="w-4 h-4" />}
                disabled={createMutation.isPending}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.25,
                  borderRadius: 2,
                }}
              >
                Criar nova nota
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TemplateSelector
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onSelect={handleCreateFromTemplate}
      />

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => { setFolderDialogOpen(false); setFolderToEdit(null); }}
        folder={folderToEdit}
        onSave={handleSaveFolder}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Excluir Nota</DialogTitle>
        <DialogContent>
          <p>
            Tem certeza que deseja excluir a nota "{noteToDelete?.title || 'Sem titulo'}"?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteFolderDialogOpen} onClose={() => setDeleteFolderDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Excluir Pasta</DialogTitle>
        <DialogContent>
          <p>
            Tem certeza que deseja excluir a pasta "{folderToDelete?.name}"?
            As notas serao movidas para "Todas as Notas".
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteFolder} color="error" variant="contained" disabled={deleteFolderMutation.isPending}>
            {deleteFolderMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ClinicalNotesPage;
