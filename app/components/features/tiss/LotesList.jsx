'use client';

import { useState, useEffect } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';

const STATUS_COLORS = {
  aberto: 'default',
  fechado: 'info',
  enviado: 'primary',
  processando: 'warning',
  aceito: 'success',
  rejeitado: 'error',
  pago: 'success',
};

const STATUS_LABELS = {
  aberto: 'Aberto',
  fechado: 'Fechado',
  enviado: 'Enviado',
  processando: 'Processando',
  aceito: 'Aceito',
  rejeitado: 'Rejeitado',
  pago: 'Pago',
};

export default function LotesList({ onView, onCreate }) {
  const { lotes, loading, fetchLotes, fecharLote, downloadLoteXml, deleteLote, operadoras } =
    useTiss();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [operadoraFilter, setOperadoraFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLote, setSelectedLote] = useState(null);

  useEffect(() => {
    fetchLotes({
      page: page + 1,
      per_page: rowsPerPage,
      status: statusFilter || undefined,
      operadora_id: operadoraFilter || undefined,
    });
  }, [fetchLotes, page, rowsPerPage, statusFilter, operadoraFilter]);

  const handleMenuClick = (event, lote) => {
    setAnchorEl(event.currentTarget);
    setSelectedLote(lote);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLote(null);
  };

  const handleView = () => {
    if (onView && selectedLote) {
      onView(selectedLote);
    }
    handleMenuClose();
  };

  const handleFechar = async () => {
    if (selectedLote) {
      try {
        await fecharLote(selectedLote.id, true);
      } catch (err) {
        console.error('Erro ao fechar lote:', err);
      }
    }
    handleMenuClose();
  };

  const handleDownloadXml = async () => {
    if (selectedLote) {
      try {
        await downloadLoteXml(selectedLote.id);
      } catch (err) {
        console.error('Erro ao baixar XML:', err);
      }
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedLote) {
      try {
        await deleteLote(selectedLote.id);
      } catch (err) {
        console.error('Erro ao deletar lote:', err);
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

  const filteredLotes = lotes.filter((lote) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lote.numero_lote?.toLowerCase().includes(searchLower) ||
      lote.operadora_nome?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar lotes..."
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

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Operadora</InputLabel>
            <Select
              value={operadoraFilter}
              label="Operadora"
              onChange={(e) => setOperadoraFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {operadoras.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nome_fantasia}
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
          Novo Lote
        </Button>
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lote</TableCell>
                <TableCell>Operadora</TableCell>
                <TableCell>Competência</TableCell>
                <TableCell align="center">Guias</TableCell>
                <TableCell align="right">Valor Total</TableCell>
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
              ) : filteredLotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhum lote encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLotes.map((lote) => (
                  <TableRow key={lote.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {lote.numero_lote}
                      </Typography>
                      {lote.numero_protocolo && (
                        <Typography variant="caption" color="text.secondary">
                          Protocolo: {lote.numero_protocolo}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {lote.operadora_nome || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(lote.data_inicio_competencia)} a{' '}
                        {formatDate(lote.data_fim_competencia)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={lote.quantidade_guias || 0} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(lote.valor_total)}
                      </Typography>
                      {lote.valor_glosado > 0 && (
                        <Typography variant="caption" color="error">
                          Glosa: {formatCurrency(lote.valor_glosado)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[lote.status] || lote.status}
                        color={STATUS_COLORS[lote.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, lote)}
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

        {selectedLote?.status === 'aberto' && (
          <MenuItem onClick={handleFechar}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Fechar e Gerar XML</ListItemText>
          </MenuItem>
        )}

        {selectedLote?.xml_conteudo && (
          <MenuItem onClick={handleDownloadXml}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Baixar XML</ListItemText>
          </MenuItem>
        )}

        {selectedLote?.status === 'aberto' && (
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
