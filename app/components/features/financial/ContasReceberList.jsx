'use client';

/**
 * @fileoverview Contas a Receber List - Redesign Minimalista
 * @description Lista limpa e funcional de contas a receber
 */

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
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useContasReceber } from '../../hooks/useFinancial';

// Theme
const theme = {
  primary: '#1852FE',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
  },
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Status config
const statusConfig = {
  pago: { label: 'Pago', color: theme.success, bg: `${theme.success}15` },
  pendente: { label: 'Pendente', color: theme.warning, bg: `${theme.warning}15` },
  parcial: { label: 'Parcial', color: theme.primary, bg: `${theme.primary}15` },
  vencido: { label: 'Vencido', color: theme.error, bg: `${theme.error}15` },
  cancelado: { label: 'Cancelado', color: theme.text.secondary, bg: 'rgba(0,0,0,0.05)' },
};

/**
 * Quick Stats - Resumo rapido no topo
 */
function QuickStats({ stats, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton width={120} height={32} sx={{ borderRadius: 2 }} />
        <Skeleton width={120} height={32} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <Chip
        label={`Pendente: ${formatCurrency(stats.totalPendente)}`}
        size="small"
        sx={{
          bgcolor: `${theme.warning}15`,
          color: theme.warning,
          fontWeight: 600,
          border: 'none',
        }}
      />
      {stats.totalVencido > 0 && (
        <Chip
          label={`Vencido: ${formatCurrency(stats.totalVencido)}`}
          size="small"
          sx={{
            bgcolor: `${theme.error}15`,
            color: theme.error,
            fontWeight: 600,
            border: 'none',
          }}
        />
      )}
      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
        {stats.qtdPendentes} pendente(s)
      </Typography>
    </Box>
  );
}

/**
 * Table Row - Linha da tabela simplificada
 */
function ContaRow({ conta, onEdit, onPayment }) {
  const status = statusConfig[conta.status] || statusConfig.pendente;
  const isOverdue = conta.status === 'vencido';
  const canPay = ['pendente', 'parcial', 'vencido'].includes(conta.status);

  return (
    <TableRow
      hover
      sx={{
        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        bgcolor: isOverdue ? `${theme.error}05` : 'transparent',
      }}
    >
      <TableCell sx={{ py: 1.5 }}>
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
            {conta.descricao}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {conta.numeroDocumento || 'Sem numero'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {formatCurrency(conta.valorLiquido)}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: isOverdue ? theme.error : theme.text.primary,
            fontWeight: isOverdue ? 600 : 400,
          }}
        >
          {formatDate(conta.dataVencimento)}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Chip
          label={status.label}
          size="small"
          sx={{
            bgcolor: status.bg,
            color: status.color,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
          }}
        />
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          {canPay && (
            <Tooltip title="Receber">
              <IconButton
                size="small"
                onClick={() => onPayment(conta)}
                sx={{ color: theme.success }}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => onEdit(conta)}
              sx={{ color: theme.text.secondary }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

/**
 * Loading Skeleton
 */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton width="80%" /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell><Skeleton width={70} height={24} sx={{ borderRadius: 1 }} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Filter Chips - Filtros como chips clicaveis
 */
function FilterChips({ filters, setFilters }) {
  const filterOptions = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'vencidos', label: 'Vencidos' },
  ];

  const activeFilter = filters.apenasVencidos ? 'vencidos' : filters.apenasPendentes ? 'pendentes' : 'todos';

  const handleFilter = (key) => {
    if (key === 'todos') {
      setFilters({ ...filters, apenasPendentes: false, apenasVencidos: false });
    } else if (key === 'pendentes') {
      setFilters({ ...filters, apenasPendentes: true, apenasVencidos: false });
    } else if (key === 'vencidos') {
      setFilters({ ...filters, apenasPendentes: false, apenasVencidos: true });
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {filterOptions.map((opt) => (
        <Chip
          key={opt.key}
          label={opt.label}
          size="small"
          variant={activeFilter === opt.key ? 'filled' : 'outlined'}
          onClick={() => handleFilter(opt.key)}
          sx={{
            cursor: 'pointer',
            borderColor: activeFilter === opt.key ? theme.primary : 'rgba(0,0,0,0.12)',
            bgcolor: activeFilter === opt.key ? theme.primary : 'transparent',
            color: activeFilter === opt.key ? '#fff' : theme.text.secondary,
            '&:hover': {
              bgcolor: activeFilter === opt.key ? theme.primary : 'rgba(0,0,0,0.04)',
            },
          }}
        />
      ))}
    </Box>
  );
}

/**
 * Main Component
 */
export default function ContasReceberList({ onAdd, onView, onEdit, onDelete, onPayment }) {
  const {
    contas,
    loading,
    error,
    pagination,
    stats,
    filters,
    setFilters,
    goToPage,
  } = useContasReceber();

  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar localmente por busca
  const filteredContas = useMemo(() => {
    if (!searchTerm) return contas;
    const term = searchTerm.toLowerCase();
    return contas.filter((conta) =>
      conta.descricao?.toLowerCase().includes(term) ||
      conta.numeroDocumento?.toLowerCase().includes(term)
    );
  }, [contas, searchTerm]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Receitas
          </Typography>
          <QuickStats stats={stats} loading={loading} />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            bgcolor: theme.primary,
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            px: 2.5,
            '&:hover': { bgcolor: '#1040D0' },
          }}
        >
          Nova Receita
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.02)',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
              '&.Mui-focused fieldset': { borderColor: theme.primary },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.text.secondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <FilterChips filters={filters} setFilters={setFilters} />
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600, color: theme.text.secondary, fontSize: '0.75rem' }}>
                  DESCRICAO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.text.secondary, fontSize: '0.75rem' }}>
                  VALOR
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.text.secondary, fontSize: '0.75rem' }}>
                  VENCIMENTO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.text.secondary, fontSize: '0.75rem' }}>
                  STATUS
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: theme.text.secondary, fontSize: '0.75rem' }}>
                  ACOES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : filteredContas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Nenhuma conta encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContas.map((conta) => (
                  <ContaRow
                    key={conta.id}
                    conta={conta}
                    onEdit={onEdit}
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
          onPageChange={(e, newPage) => goToPage(newPage + 1)}
          rowsPerPage={pagination.perPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage=""
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTablePagination-selectLabel': { display: 'none' },
            '& .MuiTablePagination-select': { display: 'none' },
          }}
        />
      </Card>
    </Box>
  );
}
