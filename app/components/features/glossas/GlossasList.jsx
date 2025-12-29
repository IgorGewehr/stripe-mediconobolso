'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
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
    formatCurrency,
    formatDate,
  } = useGlossas();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGlossa, setSelectedGlossa] = useState(null);

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

  return (
    <Box>
      {/* Header with Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar glosas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

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

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={tipoFilter}
              label="Tipo"
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
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
        >
          Nova Glossa
        </Button>
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Codigo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descricao</TableCell>
                <TableCell align="right">Valor Glosado</TableCell>
                <TableCell align="right">Recuperado</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell align="center">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredGlossas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhuma glossa encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGlossas.map((glossa) => (
                  <TableRow key={glossa.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {glossa.codigoGlossa}
                      </Typography>
                      {glossa.numeroLote && (
                        <Typography variant="caption" color="text.secondary">
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
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {glossa.descricaoGlossa || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="error.main">
                        {formatCurrency(glossa.valorGlosado)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(glossa.valorRecuperado)}
                      </Typography>
                      {glossa.percentualRecuperado > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          ({glossa.percentualRecuperado.toFixed(0)}%)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[glossa.status] || glossa.status}
                        color={STATUS_COLORS[glossa.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {glossa.dentroDoPrazo ? (
                        <Box>
                          <Typography variant="body2">
                            {formatDate(glossa.prazoRecurso)}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${glossa.diasRestantes} dias`}
                            color={glossa.diasRestantes <= 7 ? 'error' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      ) : (
                        <Chip size="small" label="Expirado" color="error" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, glossa)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.perPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Linhas por pagina:"
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
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

        {selectedGlossa?.podeRecursar && (
          <MenuItem onClick={handleCriarRecurso}>
            <ListItemIcon>
              <RecursoIcon fontSize="small" />
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

        {selectedGlossa?.status === 'pendente' && (
          <MenuItem onClick={handleAceitar}>
            <ListItemIcon>
              <AcceptIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Aceitar Glossa</ListItemText>
          </MenuItem>
        )}

        {['pendente', 'em_recurso'].includes(selectedGlossa?.status) && (
          <MenuItem onClick={handlePerder} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <RejectIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Marcar como Perdida</ListItemText>
          </MenuItem>
        )}

        {selectedGlossa?.status === 'pendente' && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
