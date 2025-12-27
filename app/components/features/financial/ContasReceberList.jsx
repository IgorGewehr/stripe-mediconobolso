'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  FormControlLabel,
  Switch,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useContasReceber } from '../../hooks/useFinancial';
import { StatusContaReceber, OrigemContaReceber } from '@/lib/services/api/financial.service';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

// Status chip color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'pago':
      return 'success';
    case 'pendente':
      return 'warning';
    case 'parcial':
      return 'info';
    case 'vencido':
      return 'error';
    case 'cancelado':
      return 'default';
    default:
      return 'default';
  }
};

// Status label mapping
const getStatusLabel = (status) => {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'pendente':
      return 'Pendente';
    case 'parcial':
      return 'Parcial';
    case 'vencido':
      return 'Vencido';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
};

// Origem label mapping
const getOrigemLabel = (origem) => {
  switch (origem) {
    case 'convenio':
      return 'Convênio';
    case 'particular':
      return 'Particular';
    case 'guia':
      return 'Guia TISS';
    case 'outros':
      return 'Outros';
    default:
      return origem;
  }
};

// Table Row Component
function ContaReceberRow({ conta, onView, onEdit, onDelete, onPayment }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    action(conta);
  };

  const isOverdue = conta.status === 'vencido';
  const canReceivePayment = ['pendente', 'parcial', 'vencido'].includes(conta.status);

  return (
    <TableRow
      hover
      sx={{
        bgcolor: isOverdue ? 'error.lighter' : 'inherit',
        '&:hover': {
          bgcolor: isOverdue ? 'error.light' : undefined,
        },
      }}
    >
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {conta.numeroDocumento || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {conta.descricao}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={getOrigemLabel(conta.origem)}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {formatCurrency(conta.valorLiquido)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography
          variant="body2"
          color={conta.valorPendente > 0 ? 'error.main' : 'success.main'}
          fontWeight="medium"
        >
          {formatCurrency(conta.valorPendente)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          color={isOverdue ? 'error.main' : 'text.primary'}
        >
          {formatDate(conta.dataVencimento)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={getStatusLabel(conta.status)}
          size="small"
          color={getStatusColor(conta.status)}
        />
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {canReceivePayment && (
            <Tooltip title="Registrar Recebimento">
              <IconButton
                size="small"
                color="success"
                onClick={() => onPayment(conta)}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleAction(onView)}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              Visualizar
            </MenuItem>
            <MenuItem onClick={() => handleAction(onEdit)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            {conta.status === 'pendente' && (
              <MenuItem
                onClick={() => handleAction(onDelete)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Excluir
              </MenuItem>
            )}
          </Menu>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// Loading Skeleton
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton /></TableCell>
          <TableCell><Skeleton /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Stats Summary
function StatsSummary({ stats, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton width={150} height={24} />
        <Skeleton width={150} height={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Chip
        icon={<ReceiptIcon />}
        label={`Pendente: ${formatCurrency(stats.totalPendente)}`}
        color="warning"
        variant="outlined"
      />
      <Chip
        label={`Vencido: ${formatCurrency(stats.totalVencido)}`}
        color="error"
        variant="outlined"
      />
      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
        {stats.qtdPendentes} pendente(s) | {stats.qtdVencidos} vencido(s)
      </Typography>
    </Box>
  );
}

// Main Component
export default function ContasReceberList({
  onAdd,
  onView,
  onEdit,
  onDelete,
  onPayment,
}) {
  const {
    contas,
    loading,
    error,
    pagination,
    stats,
    filters,
    setFilters,
    goToPage,
    refresh,
  } = useContasReceber();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle filter toggle
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    goToPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    // This would require updating the hook to support changing perPage
    console.log('Change rows per page:', event.target.value);
  };

  // Filter contas locally by search term
  const filteredContas = useMemo(() => {
    if (!searchTerm) return contas;

    const term = searchTerm.toLowerCase();
    return contas.filter((conta) =>
      conta.descricao?.toLowerCase().includes(term) ||
      conta.numeroDocumento?.toLowerCase().includes(term)
    );
  }, [contas, searchTerm]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Contas a Receber
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Nova Conta
          </Button>
        </Box>

        {/* Stats Summary */}
        <Box sx={{ mb: 3 }}>
          <StatsSummary stats={stats} loading={loading} />
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por descrição ou número..."
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={filters.apenasPendentes}
                onChange={(e) => setFilters({ ...filters, apenasPendentes: e.target.checked })}
                size="small"
              />
            }
            label="Apenas pendentes"
          />

          <FormControlLabel
            control={
              <Switch
                checked={filters.apenasVencidos}
                onChange={(e) => setFilters({ ...filters, apenasVencidos: e.target.checked })}
                size="small"
              />
            }
            label="Apenas vencidos"
          />

          <IconButton onClick={handleFilterClick}>
            <FilterIcon />
          </IconButton>

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem
              onClick={() => {
                setFilters({ ...filters, origem: null });
                handleFilterClose();
              }}
            >
              Todos
            </MenuItem>
            <MenuItem
              onClick={() => {
                setFilters({ ...filters, origem: 'convenio' });
                handleFilterClose();
              }}
            >
              Convênio
            </MenuItem>
            <MenuItem
              onClick={() => {
                setFilters({ ...filters, origem: 'particular' });
                handleFilterClose();
              }}
            >
              Particular
            </MenuItem>
            <MenuItem
              onClick={() => {
                setFilters({ ...filters, origem: 'guia' });
                handleFilterClose();
              }}
            >
              Guia TISS
            </MenuItem>
          </Menu>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">Pendente</TableCell>
                <TableCell>Vencimento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : filteredContas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhuma conta a receber encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContas.map((conta) => (
                  <ContaReceberRow
                    key={conta.id}
                    conta={conta}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPayment={onPayment}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.perPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </CardContent>
    </Card>
  );
}
