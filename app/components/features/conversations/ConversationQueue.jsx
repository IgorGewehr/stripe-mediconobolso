'use client';

/**
 * ConversationQueue - Sistema de Fila de Atendimento Multi-Atendentes
 *
 * Funcionalidades:
 * - Fila de conversas pendentes (aguardando atendimento)
 * - Lista de conversas em atendimento (por atendente)
 * - Seletor de setor/departamento
 * - Tags visuais com cores personalizadas
 * - Botão de assumir/finalizar conversa
 * - Transferência entre atendentes
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Badge,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  alpha,
  useTheme,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  PlayArrow as AssignIcon,
  Stop as StopIcon,
  SwapHoriz as TransferIcon,
  Label as TagIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  PriorityHigh as UrgentIcon,
  LocalHospital as MedicalIcon,
  AttachMoney as FinancialIcon,
  Headset as SupportIcon,
  AdminPanelSettings as AdminIcon,
  MeetingRoom as ReceptionIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon,
  Done as DoneIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de setores para ícones e cores
const SECTOR_CONFIG = {
  reception: { icon: ReceptionIcon, color: '#4CAF50', label: 'Recepção' },
  financial: { icon: FinancialIcon, color: '#FF9800', label: 'Financeiro' },
  medical: { icon: MedicalIcon, color: '#2196F3', label: 'Médico' },
  administrative: { icon: AdminIcon, color: '#9C27B0', label: 'Administrativo' },
  support: { icon: SupportIcon, color: '#00BCD4', label: 'Suporte' },
  custom: { icon: TagIcon, color: '#607D8B', label: 'Personalizado' },
};

// Mapeamento de prioridade
const PRIORITY_CONFIG = {
  low: { color: '#8BC34A', label: 'Baixa' },
  normal: { color: '#2196F3', label: 'Normal' },
  high: { color: '#FF9800', label: 'Alta' },
  urgent: { color: '#F44336', label: 'Urgente' },
};

// Mapeamento de status
const STATUS_CONFIG = {
  new: { color: '#9C27B0', label: 'Novo' },
  open: { color: '#4CAF50', label: 'Aberto' },
  pending: { color: '#FF9800', label: 'Pendente' },
  resolved: { color: '#2196F3', label: 'Resolvido' },
  closed: { color: '#607D8B', label: 'Fechado' },
  spam: { color: '#F44336', label: 'Spam' },
};

// Formatar tempo
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
};

// Componente de Tag Visual
const TagChip = memo(({ tag, small = false }) => {
  const theme = useTheme();

  return (
    <Chip
      size="small"
      label={tag.name}
      sx={{
        height: small ? 18 : 22,
        fontSize: small ? '0.65rem' : '0.7rem',
        fontWeight: 500,
        bgcolor: alpha(tag.color || theme.palette.primary.main, 0.1),
        color: tag.color || theme.palette.primary.main,
        borderLeft: `3px solid ${tag.color || theme.palette.primary.main}`,
        borderRadius: '4px',
        '& .MuiChip-label': {
          px: 0.75,
        },
      }}
    />
  );
});
TagChip.displayName = 'TagChip';

// Componente de Item da Fila
const QueueItem = memo(({
  conversation,
  currentUserId,
  onAssign,
  onFinish,
  onTransfer,
  onAddTag,
  onSelect,
  isSelected,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const isAssignedToMe = conversation.assignedTo === currentUserId;
  const isAssigned = !!conversation.assignedTo;
  const priorityConfig = PRIORITY_CONFIG[conversation.priority] || PRIORITY_CONFIG.normal;
  const statusConfig = STATUS_CONFIG[conversation.status] || STATUS_CONFIG.open;

  // Cor da borda baseada na primeira tag ou setor
  const borderColor = useMemo(() => {
    if (conversation.tags?.length > 0) {
      return conversation.tags[0].color || theme.palette.primary.main;
    }
    if (conversation.sector) {
      return SECTOR_CONFIG[conversation.sector]?.color || theme.palette.grey[400];
    }
    return theme.palette.grey[300];
  }, [conversation.tags, conversation.sector, theme]);

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect?.(conversation)}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: 'pointer',
        borderRadius: 2,
        border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
        borderLeft: `4px solid ${borderColor}`,
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.04)
          : 'background.paper',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          boxShadow: theme.shadows[1],
        },
      }}
    >
      <Box display="flex" gap={1.5} alignItems="flex-start">
        {/* Avatar */}
        <Badge
          badgeContent={conversation.unreadCount}
          max={99}
          color="error"
          invisible={!conversation.unreadCount}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha(borderColor, 0.1),
              color: borderColor,
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {(conversation.clientName || conversation.clientPhone)?.[0]?.toUpperCase() || <PersonIcon />}
          </Avatar>
        </Badge>

        {/* Conteúdo Principal */}
        <Box flex={1} minWidth={0}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography
              variant="body2"
              noWrap
              fontWeight={600}
              color="text.primary"
              sx={{ flex: 1, mr: 1 }}
            >
              {conversation.clientName || conversation.clientPhone}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              {/* Indicador de Prioridade */}
              {conversation.priority === 'urgent' && (
                <Tooltip title="Urgente">
                  <UrgentIcon sx={{ fontSize: 16, color: 'error.main' }} />
                </Tooltip>
              )}

              {/* Tempo de espera */}
              <Tooltip title="Tempo de espera">
                <Box display="flex" alignItems="center" gap={0.25}>
                  <TimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(conversation.createdAt)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>

          {/* Última mensagem */}
          <Typography
            variant="body2"
            noWrap
            color="text.secondary"
            sx={{ fontSize: '0.8rem', mb: 0.75 }}
          >
            {conversation.lastMessage || 'Sem mensagens'}
          </Typography>

          {/* Tags */}
          {conversation.tags?.length > 0 && (
            <Box display="flex" gap={0.5} flexWrap="wrap" mb={0.75}>
              {conversation.tags.slice(0, 3).map((tag, idx) => (
                <TagChip key={tag.id || idx} tag={tag} small />
              ))}
              {conversation.tags.length > 3 && (
                <Chip
                  size="small"
                  label={`+${conversation.tags.length - 3}`}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          )}

          {/* Footer - Status e Ações */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" gap={0.5} alignItems="center">
              {/* Status */}
              <Chip
                size="small"
                label={statusConfig.label}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: alpha(statusConfig.color, 0.1),
                  color: statusConfig.color,
                }}
              />

              {/* Atendente atual */}
              {isAssigned && (
                <Chip
                  size="small"
                  avatar={<Avatar sx={{ width: 16, height: 16 }}><PersonIcon sx={{ fontSize: 12 }} /></Avatar>}
                  label={isAssignedToMe ? 'Você' : conversation.assignedToName || 'Atendente'}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: isAssignedToMe
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.grey[500], 0.1),
                    color: isAssignedToMe ? 'success.main' : 'text.secondary',
                  }}
                />
              )}
            </Box>

            {/* Ações */}
            <Box display="flex" gap={0.5}>
              {!isAssigned ? (
                <Tooltip title="Assumir atendimento">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign?.(conversation.id);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <AssignIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : isAssignedToMe ? (
                <Tooltip title="Finalizar atendimento">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinish?.(conversation.id);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <DoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}

              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ p: 0.5 }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {!isAssigned && (
          <MenuItem onClick={() => { onAssign?.(conversation.id); handleMenuClose(); }}>
            <ListItemIcon><AssignIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Assumir atendimento</ListItemText>
          </MenuItem>
        )}
        {isAssignedToMe && (
          <MenuItem onClick={() => { onFinish?.(conversation.id); handleMenuClose(); }}>
            <ListItemIcon><DoneIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Finalizar atendimento</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { onTransfer?.(conversation.id); handleMenuClose(); }}>
          <ListItemIcon><TransferIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Transferir</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onAddTag?.(conversation.id); handleMenuClose(); }}>
          <ListItemIcon><TagIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Adicionar tag</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
});
QueueItem.displayName = 'QueueItem';

// Dialog de Transferência
const TransferDialog = memo(({ open, onClose, onConfirm, users = [], sectors = [] }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm?.({ userId: selectedUser, sectorId: selectedSector, note });
    setSelectedUser('');
    setSelectedSector('');
    setNote('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transferir Conversa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Transferir para Setor</InputLabel>
            <Select
              value={selectedSector}
              label="Transferir para Setor"
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              {Object.entries(SECTOR_CONFIG).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <config.icon sx={{ fontSize: 18, color: config.color }} />
                    {config.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Ou para Atendente</InputLabel>
            <Select
              value={selectedUser}
              label="Ou para Atendente"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {user.name?.[0]}
                    </Avatar>
                    {user.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Nota (opcional)"
            multiline
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicione informações para o próximo atendente..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedUser && !selectedSector}
          startIcon={<SendIcon />}
        >
          Transferir
        </Button>
      </DialogActions>
    </Dialog>
  );
});
TransferDialog.displayName = 'TransferDialog';

// Dialog de Adicionar Tag
const AddTagDialog = memo(({ open, onClose, onConfirm, existingTags = [] }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2196F3');

  const predefinedColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  ];

  const handleConfirm = () => {
    const tags = [...selectedTags];
    if (newTagName.trim()) {
      tags.push({ name: newTagName.trim(), color: newTagColor, isNew: true });
    }
    onConfirm?.(tags);
    setSelectedTags([]);
    setNewTagName('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Tags</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Tags existentes */}
          {existingTags.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Tags existentes
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                {existingTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    onClick={() => {
                      if (selectedTags.includes(tag.id)) {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      } else {
                        setSelectedTags([...selectedTags, tag.id]);
                      }
                    }}
                    sx={{
                      bgcolor: selectedTags.includes(tag.id)
                        ? alpha(tag.color, 0.2)
                        : alpha(tag.color, 0.1),
                      color: tag.color,
                      border: selectedTags.includes(tag.id)
                        ? `2px solid ${tag.color}`
                        : 'none',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          {/* Criar nova tag */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Criar nova tag
            </Typography>
            <Box display="flex" gap={1} mt={0.5}>
              <TextField
                size="small"
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
              {predefinedColors.map((color) => (
                <Box
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: newTagColor === color ? '3px solid #000' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedTags.length === 0 && !newTagName.trim()}
          startIcon={<TagIcon />}
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
});
AddTagDialog.displayName = 'AddTagDialog';

// Componente Principal
export default function ConversationQueue({
  conversations = [],
  currentUserId,
  currentUserName,
  availableUsers = [],
  availableTags = [],
  loading = false,
  onAssignConversation,
  onFinishConversation,
  onTransferConversation,
  onAddTagToConversation,
  onSelectConversation,
  onRefresh,
  selectedConversationId,
}) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('all');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [selectedConversationForAction, setSelectedConversationForAction] = useState(null);

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Filtrar por setor
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(c => c.sector === sectorFilter);
    }

    // Separar por aba
    if (activeTab === 0) {
      // Pendentes (não atribuídos)
      filtered = filtered.filter(c => !c.assignedTo && c.status !== 'closed');
    } else if (activeTab === 1) {
      // Em atendimento (atribuídos a mim)
      filtered = filtered.filter(c => c.assignedTo === currentUserId && c.status !== 'closed');
    } else {
      // Todos em andamento
      filtered = filtered.filter(c => c.assignedTo && c.status !== 'closed');
    }

    // Ordenar por prioridade e tempo
    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] ?? 2;
      const bPriority = priorityOrder[b.priority] ?? 2;

      if (aPriority !== bPriority) return aPriority - bPriority;

      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }, [conversations, activeTab, sectorFilter, currentUserId]);

  // Contadores
  const counts = useMemo(() => ({
    pending: conversations.filter(c => !c.assignedTo && c.status !== 'closed').length,
    mine: conversations.filter(c => c.assignedTo === currentUserId && c.status !== 'closed').length,
    all: conversations.filter(c => c.assignedTo && c.status !== 'closed').length,
  }), [conversations, currentUserId]);

  // Handlers
  const handleTransfer = useCallback((conversationId) => {
    setSelectedConversationForAction(conversationId);
    setTransferDialogOpen(true);
  }, []);

  const handleAddTag = useCallback((conversationId) => {
    setSelectedConversationForAction(conversationId);
    setAddTagDialogOpen(true);
  }, []);

  const handleConfirmTransfer = useCallback((data) => {
    if (selectedConversationForAction) {
      onTransferConversation?.(selectedConversationForAction, data);
    }
    setSelectedConversationForAction(null);
  }, [selectedConversationForAction, onTransferConversation]);

  const handleConfirmAddTag = useCallback((tags) => {
    if (selectedConversationForAction) {
      onAddTagToConversation?.(selectedConversationForAction, tags);
    }
    setSelectedConversationForAction(null);
  }, [selectedConversationForAction, onAddTagToConversation]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight={600}>
            Fila de Atendimento
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Atualizar">
              <IconButton size="small" onClick={onRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, py: 0.5 },
          }}
        >
          <Tab
            label={
              <Badge badgeContent={counts.pending} color="error" max={99}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <InboxIcon sx={{ fontSize: 18 }} />
                  <span>Pendentes</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={counts.mine} color="primary" max={99}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                  <span>Meus</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={counts.all} color="default" max={99}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CheckIcon sx={{ fontSize: 18 }} />
                  <span>Todos</span>
                </Box>
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Filtro de Setor */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={0.5} flexWrap="wrap">
          <Chip
            size="small"
            label="Todos"
            onClick={() => setSectorFilter('all')}
            sx={{
              bgcolor: sectorFilter === 'all' ? 'primary.main' : 'transparent',
              color: sectorFilter === 'all' ? 'white' : 'text.primary',
            }}
          />
          {Object.entries(SECTOR_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Chip
                key={key}
                size="small"
                icon={<Icon sx={{ fontSize: 14 }} />}
                label={config.label}
                onClick={() => setSectorFilter(key)}
                sx={{
                  bgcolor: sectorFilter === key ? alpha(config.color, 0.2) : 'transparent',
                  color: sectorFilter === key ? config.color : 'text.primary',
                  borderColor: config.color,
                  '& .MuiChip-icon': {
                    color: config.color,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Lista de Conversas */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 1 }} />
            ))}
          </>
        ) : filteredConversations.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {activeTab === 0
              ? 'Nenhuma conversa pendente no momento.'
              : activeTab === 1
              ? 'Você não está atendendo nenhuma conversa no momento.'
              : 'Nenhuma conversa em andamento.'}
          </Alert>
        ) : (
          filteredConversations.map((conversation) => (
            <QueueItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isSelected={selectedConversationId === conversation.id}
              onSelect={onSelectConversation}
              onAssign={onAssignConversation}
              onFinish={onFinishConversation}
              onTransfer={handleTransfer}
              onAddTag={handleAddTag}
            />
          ))
        )}
      </Box>

      {/* Dialogs */}
      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        onConfirm={handleConfirmTransfer}
        users={availableUsers}
        sectors={Object.entries(SECTOR_CONFIG).map(([k, v]) => ({ id: k, ...v }))}
      />

      <AddTagDialog
        open={addTagDialogOpen}
        onClose={() => setAddTagDialogOpen(false)}
        onConfirm={handleConfirmAddTag}
        existingTags={availableTags}
      />
    </Box>
  );
}
