'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Gavel as RecursoIcon,
  AutoAwesome as AIIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useGlossas } from '../../hooks/useGlossas';

const STATUS_COLORS = {
  pendente: 'warning',
  em_recurso: 'info',
  recuperada: 'success',
  perdida: 'error',
  prazo_expirado: 'error',
  aceita: 'default',
};

const STATUS_LABELS = {
  pendente: 'Pendente',
  em_recurso: 'Em Recurso',
  recuperada: 'Recuperada',
  perdida: 'Perdida',
  prazo_expirado: 'Prazo Expirado',
  aceita: 'Aceita',
};

const TIPO_LABELS = {
  M01: 'Nao autorizado',
  M02: 'Fora da cobertura',
  M03: 'Sem documentacao',
  M04: 'Duplicado',
  M05: 'Erro de codificacao',
  M06: 'Sem justificativa',
  M07: 'Valor acima',
  M08: 'Data inconsistente',
  M09: 'Beneficiario invalido',
  M10: 'Prestador invalido',
  M11: 'Carencia',
  M12: 'CID incompativel',
  OUTROS: 'Outros',
};

// Format currency helper
const formatCurrencyValue = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

export default function GlossasList({ onSelectGlossa, onCreateRecurso, onCreate }) {
  const {
    loading,
    error,
    glossas,
    pagination,
    fetchGlossas,
    deleteGlossa,
    aceitarGlossa,
    perderGlossa,
    setPage,
    setPerPage,
    formatDate,
  } = useGlossas();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGlossa, setSelectedGlossa] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadGlossas = useCallback(() => {
    const filters = {
      status: statusFilter || undefined,
      tipoGlossa: tipoFilter || undefined,
    };
    fetchGlossas(filters);
  }, [fetchGlossas, statusFilter, tipoFilter]);

  useEffect(() => {
    loadGlossas();
  }, [loadGlossas]);

  const handleMenuClick = (event, glossa) => {
    setAnchorEl(event.currentTarget);
    setSelectedGlossa(glossa);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGlossa(null);
  };

  const handleView = () => {
    if (onSelectGlossa && selectedGlossa) {
      onSelectGlossa(selectedGlossa);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedGlossa) {
      try {
        await deleteGlossa(selectedGlossa.id);
        loadGlossas();
      } catch (err) {
        console.error('Erro ao deletar glossa:', err);
      }
    }
    handleMenuClose();
  };

  const handleAceitar = async () => {
    if (selectedGlossa) {
      try {
        await aceitarGlossa(selectedGlossa.id);
        loadGlossas();
      } catch (err) {
        console.error('Erro ao aceitar glossa:', err);
      }
    }
    handleMenuClose();
  };

  const handlePerder = async () => {
    if (selectedGlossa) {
      try {
        await perderGlossa(selectedGlossa.id);
        loadGlossas();
      } catch (err) {
        console.error('Erro ao marcar como perdida:', err);
      }
    }
    handleMenuClose();
  };

  const handleCriarRecurso = () => {
    if (onCreateRecurso && selectedGlossa) {
      onCreateRecurso(selectedGlossa);
    }
    handleMenuClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setPerPage(parseInt(event.target.value, 10));
  };

  const filteredGlossas = glossas.filter((glossa) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      glossa.codigoGlossa?.toLowerCase().includes(searchLower) ||
      glossa.descricaoGlossa?.toLowerCase().includes(searchLower) ||
      glossa.numeroLote?.toLowerCase().includes(searchLower)
    );
  });

  const activeFiltersCount = [statusFilter, tipoFilter].filter(Boolean).length;

  return (
    <Box>
      {/* Header with Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar por codigo, descricao ou lote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              color={activeFiltersCount > 0 ? 'primary' : 'inherit'}
            >
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            size="small"
          >
            Nova Glossa
          </Button>
        </Box>

        {/* Collapsible Filters */}
        {showFilters && (
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Tipo de Glosa</InputLabel>
                <Select
                  value={tipoFilter}
                  label="Tipo de Glosa"
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(TIPO_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {value} - {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {activeFiltersCount > 0 && (
                <Button
                  size="small"
                  onClick={() => {
                    setStatusFilter('');
                    setTipoFilter('');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </Box>
          </Card>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Codigo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descricao</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Valor Glosado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Recuperado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Prazo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Carregando glosas...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredGlossas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Nenhuma glossa encontrada
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={onCreate}
                      sx={{ mt: 2 }}
                      size="small"
                    >
                      Criar primeira glossa
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGlossas.map((glossa) => (
                  <TableRow
                    key={glossa.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {glossa.codigoGlossa}
                      </Typography>
                      {glossa.numeroLote && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lote: {glossa.numeroLote}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={TIPO_LABELS[glossa.tipoGlossa] || glossa.tipoGlossa}>
                        <Chip
                          size="small"
                          label={glossa.tipoGlossa}
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {glossa.descricaoGlossa || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="error.main">
                        {formatCurrencyValue(glossa.valorGlosado)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrencyValue(glossa.valorRecuperado)}
                      </Typography>
                      {glossa.percentualRecuperado > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          ({glossa.percentualRecuperado.toFixed(0)}%)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[glossa.status] || glossa.status}
                        color={STATUS_COLORS[glossa.status] || 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {glossa.dentroDoPrazo ? (
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatDate(glossa.prazoRecurso)}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${glossa.diasRestantes}d`}
                            color={glossa.diasRestantes <= 7 ? 'error' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20, mt: 0.5 }}
                          />
                        </Box>
                      ) : (
                        <Chip size="small" label="Expirado" color="error" sx={{ fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, glossa)}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.perPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Por pagina:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {selectedGlossa?.podeRecursar && (
          <MenuItem onClick={handleCriarRecurso}>
            <ListItemIcon>
              <RecursoIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Criar Recurso</ListItemText>
          </MenuItem>
        )}

        {selectedGlossa?.podeRecursar && (
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <AIIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText>Analisar com IA</ListItemText>
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        {selectedGlossa?.status === 'pendente' && (
          <MenuItem onClick={handleAceitar}>
            <ListItemIcon>
              <AcceptIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Aceitar Glossa</ListItemText>
          </MenuItem>
        )}

        {['pendente', 'em_recurso'].includes(selectedGlossa?.status) && (
          <MenuItem onClick={handlePerder}>
            <ListItemIcon>
              <RejectIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Marcar como Perdida</ListItemText>
          </MenuItem>
        )}

        {selectedGlossa?.status === 'pendente' && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
