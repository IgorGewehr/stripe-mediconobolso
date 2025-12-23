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
  IconButton,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ValidateIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';

const STATUS_COLORS = {
  rascunho: 'default',
  validado: 'info',
  enviado: 'primary',
  aceito: 'success',
  glosado: 'error',
  pago: 'success',
};

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  validado: 'Validado',
  enviado: 'Enviado',
  aceito: 'Aceito',
  glosado: 'Glosado',
  pago: 'Pago',
};

const TIPO_GUIA_LABELS = {
  consulta: 'Consulta',
  sadt: 'SP/SADT',
  internacao: 'Internação',
  honorarios: 'Honorários',
  anexo_clinico: 'Anexo Clínico',
};

export default function GuiasList({ onEdit, onView, onAdd }) {
  const { guias, loading, fetchGuias, deleteGuia, validarGuia, operadoras } = useTiss();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGuia, setSelectedGuia] = useState(null);

  useEffect(() => {
    fetchGuias({
      page: page + 1,
      per_page: rowsPerPage,
      status: statusFilter || undefined,
      tipo_guia: tipoFilter || undefined,
    });
  }, [fetchGuias, page, rowsPerPage, statusFilter, tipoFilter]);

  const handleMenuClick = (event, guia) => {
    setAnchorEl(event.currentTarget);
    setSelectedGuia(guia);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGuia(null);
  };

  const handleView = () => {
    if (onView && selectedGuia) {
      onView(selectedGuia);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (onEdit && selectedGuia) {
      onEdit(selectedGuia);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedGuia) {
      try {
        await deleteGuia(selectedGuia.id);
      } catch (err) {
        console.error('Erro ao deletar guia:', err);
      }
    }
    handleMenuClose();
  };

  const handleValidate = async () => {
    if (selectedGuia) {
      try {
        const result = await validarGuia(selectedGuia.id);
        console.log('Validação:', result);
        // TODO: Show validation results in a dialog
      } catch (err) {
        console.error('Erro ao validar guia:', err);
      }
    }
    handleMenuClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredGuias = guias.filter((guia) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      guia.numero_guia_prestador?.toLowerCase().includes(searchLower) ||
      guia.beneficiario_nome?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar guias..."
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

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={tipoFilter}
            label="Tipo"
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(TIPO_GUIA_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Guia</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Beneficiário</TableCell>
                <TableCell>Data Atendimento</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredGuias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhuma guia encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuias.map((guia) => (
                  <TableRow key={guia.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {guia.numero_guia_prestador}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TIPO_GUIA_LABELS[guia.tipo_guia] || guia.tipo_guia}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {guia.beneficiario_nome || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(guia.data_atendimento)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(guia.valor_total)}
                      </Typography>
                      {guia.tem_glosa && (
                        <Typography variant="caption" color="error">
                          Glosa: {formatCurrency(guia.valor_glosado)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[guia.status] || guia.status}
                        color={STATUS_COLORS[guia.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, guia)}
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
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
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
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleValidate}>
          <ListItemIcon>
            <ValidateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Validar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
