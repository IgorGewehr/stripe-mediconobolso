'use client';

/**
 * @fileoverview Stock Management Template
 * @description Interface para gerenciamento de estoque da clinica
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SaidaIcon,
  History as HistoryIcon,
  Inventory2 as InventoryIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import useStock from '../hooks/useStock';

const CATEGORIES = [
  'Material',
  'Medicamento',
  'Insumo',
  'Equipamento',
  'Descartavel',
  'Outro',
];

const theme = {
  primary: '#1852FE',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  text: { primary: '#1A1A2E', secondary: '#6B7280' },
};

export default function StockTemplate() {
  const {
    items,
    loading,
    saving,
    error,
    pagination,
    filters,
    setFilters,
    loadStock,
    createItem,
    updateItem,
    deleteItem,
    registerMovement,
  } = useStock();

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementItem, setMovementItem] = useState(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    currentQuantity: 0,
    minimumQuantity: 0,
    unit: 'un',
    notes: '',
  });

  // Movement state
  const [movementData, setMovementData] = useState({
    type: 'entrada',
    quantity: 1,
    notes: '',
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ---- Form Handlers ----
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ itemName: '', category: '', currentQuantity: 0, minimumQuantity: 0, unit: 'un', notes: '' });
    setFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName || '',
      category: item.category || '',
      currentQuantity: item.currentQuantity || 0,
      minimumQuantity: item.minimumQuantity || 0,
      unit: item.unit || 'un',
      notes: item.notes || '',
    });
    setFormOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.itemName.trim()) {
      showSnackbar('Nome do item e obrigatorio', 'error');
      return;
    }
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
        showSnackbar('Item atualizado com sucesso');
      } else {
        await createItem(formData);
        showSnackbar('Item criado com sucesso');
      }
      setFormOpen(false);
    } catch (err) {
      showSnackbar(err.userMessage || 'Erro ao salvar item', 'error');
    }
  };

  // ---- Delete Handlers ----
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem(deletingItem.id);
      showSnackbar('Item removido com sucesso');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (err) {
      showSnackbar(err.userMessage || 'Erro ao remover item', 'error');
    }
  };

  // ---- Movement Handlers ----
  const handleOpenMovement = (item) => {
    setMovementItem(item);
    setMovementData({ type: 'entrada', quantity: 1, notes: '' });
    setMovementDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    if (!movementItem || movementData.quantity <= 0) return;
    try {
      await registerMovement(movementItem.id, movementData.type, movementData.quantity, movementData.notes);
      showSnackbar(`Movimentacao de ${movementData.type === 'entrada' ? 'entrada' : 'saida'} registrada`);
      setMovementDialogOpen(false);
    } catch (err) {
      showSnackbar(err.userMessage || 'Erro ao registrar movimentacao', 'error');
    }
  };

  // ---- History Handler ----
  const handleOpenHistory = useCallback(async (item) => {
    setHistoryItem(item);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const { stockService } = await import('@/lib/services/api');
      const response = await stockService.getMovementHistory(item.id);
      setHistoryData(response.items || []);
    } catch (err) {
      showSnackbar('Erro ao carregar historico', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Search handler
  const handleSearchChange = useCallback((e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  }, [setFilters]);

  const handleCategoryFilter = useCallback((e) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  }, [setFilters]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon sx={{ fontSize: 28, color: theme.primary }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.text.primary }}>
            Estoque
          </Typography>
          <Chip
            label={`${pagination.total || items.length} itens`}
            size="small"
            sx={{ ml: 1, bgcolor: `${theme.primary}10`, color: theme.primary, fontWeight: 600 }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: theme.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: '#1040DD' },
          }}
        >
          Novo Item
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar item..."
          size="small"
          value={filters.search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.text.secondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260, bgcolor: theme.surface, borderRadius: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={filters.category === 'all' ? '' : (filters.category || '')}
            onChange={handleCategoryFilter}
            label="Categoria"
            sx={{ bgcolor: theme.surface }}
          >
            <MenuItem value="">Todas</MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${theme.border}`, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Categoria</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Qtd. Atual</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Qtd. Minima</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Unidade</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: theme.text.secondary, fontSize: 13 }}>Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><Skeleton variant="text" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <InventoryIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
                  <Typography sx={{ color: theme.text.secondary }}>
                    Nenhum item no estoque
                  </Typography>
                  <Button size="small" onClick={handleOpenCreate} sx={{ mt: 1, textTransform: 'none' }}>
                    Adicionar primeiro item
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isLowStock = item.minimumQuantity > 0 && item.currentQuantity <= item.minimumQuantity;
                return (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 14, color: theme.text.primary }}>
                        {item.itemName}
                      </Typography>
                      {item.notes && (
                        <Typography sx={{ fontSize: 12, color: theme.text.secondary, mt: 0.5 }}>
                          {item.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Chip label={item.category} size="small" variant="outlined" sx={{ fontSize: 12 }} />
                      ) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 700, fontSize: 16, color: isLowStock ? '#EF4444' : theme.text.primary }}>
                        {item.currentQuantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14, color: theme.text.secondary }}>
                        {item.minimumQuantity || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 13, color: theme.text.secondary }}>
                        {item.unit || 'un'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {isLowStock ? (
                        <Chip icon={<WarningIcon sx={{ fontSize: 14 }} />} label="Baixo" size="small" color="error" variant="outlined" />
                      ) : (
                        <Chip label="OK" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Entrada/Saida">
                          <IconButton size="small" onClick={() => handleOpenMovement(item)} sx={{ color: theme.primary }}>
                            <EntradaIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Historico">
                          <IconButton size="small" onClick={() => handleOpenHistory(item)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
                            sx={{ color: '#EF4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---- Create/Edit Dialog ---- */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingItem ? 'Editar Item' : 'Novo Item de Estoque'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do Item"
            value={formData.itemName}
            onChange={(e) => setFormData((p) => ({ ...p, itemName: e.target.value }))}
            required
            fullWidth
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
              label="Categoria"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!editingItem && (
              <TextField
                label="Quantidade Inicial"
                type="number"
                value={formData.currentQuantity}
                onChange={(e) => setFormData((p) => ({ ...p, currentQuantity: parseInt(e.target.value) || 0 }))}
                fullWidth
                inputProps={{ min: 0 }}
              />
            )}
            <TextField
              label="Quantidade Minima"
              type="number"
              value={formData.minimumQuantity}
              onChange={(e) => setFormData((p) => ({ ...p, minimumQuantity: parseInt(e.target.value) || 0 }))}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Box>
          <TextField
            label="Unidade"
            value={formData.unit}
            onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))}
            placeholder="un, cx, ml, mg..."
            fullWidth
          />
          <TextField
            label="Observacoes"
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={saving}
            sx={{ bgcolor: theme.primary, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1040DD' } }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : (editingItem ? 'Salvar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Exclusao</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja realmente excluir o item <strong>{deletingItem?.itemName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Movement Dialog ---- */}
      <Dialog open={movementDialogOpen} onClose={() => setMovementDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Movimentacao - {movementItem?.itemName}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography sx={{ fontSize: 14, color: theme.text.secondary }}>
            Quantidade atual: <strong>{movementItem?.currentQuantity}</strong> {movementItem?.unit || 'un'}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={movementData.type}
              onChange={(e) => setMovementData((p) => ({ ...p, type: e.target.value }))}
              label="Tipo"
            >
              <MenuItem value="entrada">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EntradaIcon sx={{ color: '#22C55E', fontSize: 20 }} /> Entrada
                </Box>
              </MenuItem>
              <MenuItem value="saida">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SaidaIcon sx={{ color: '#EF4444', fontSize: 20 }} /> Saida
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Quantidade"
            type="number"
            value={movementData.quantity}
            onChange={(e) => setMovementData((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
            fullWidth
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Observacoes"
            value={movementData.notes}
            onChange={(e) => setMovementData((p) => ({ ...p, notes: e.target.value }))}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setMovementDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveMovement}
            disabled={saving || movementData.quantity <= 0}
            sx={{
              bgcolor: movementData.type === 'entrada' ? '#22C55E' : '#EF4444',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: movementData.type === 'entrada' ? '#16A34A' : '#DC2626' },
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : `Registrar ${movementData.type === 'entrada' ? 'Entrada' : 'Saida'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- History Dialog ---- */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Historico - {historyItem?.itemName}
          <IconButton onClick={() => setHistoryDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyData.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: theme.text.secondary }}>
              Nenhuma movimentacao registrada
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Quantidade</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Observacoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell sx={{ fontSize: 13 }}>
                      {new Date(mov.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={mov.tipo === 'entrada' ? <EntradaIcon sx={{ fontSize: 14 }} /> : <SaidaIcon sx={{ fontSize: 14 }} />}
                        label={mov.tipo === 'entrada' ? 'Entrada' : 'Saida'}
                        size="small"
                        color={mov.tipo === 'entrada' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: theme.text.secondary }}>
                      {mov.observacoes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
