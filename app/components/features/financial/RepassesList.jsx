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
  Button,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Lock as CloseIcon,
  Check as ApproveIcon,
  Payment as PayIcon,
  MoreVert as MoreIcon,
  AccountBalance as RepasseIcon,
} from '@mui/icons-material';
import { useRepasses } from '../../hooks/useFinancial';

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
    case 'aberto':
      return 'info';
    case 'fechado':
      return 'warning';
    case 'aprovado':
      return 'primary';
    case 'pago':
      return 'success';
    case 'cancelado':
      return 'error';
    default:
      return 'default';
  }
};

// Status label mapping
const getStatusLabel = (status) => {
  switch (status) {
    case 'aberto':
      return 'Aberto';
    case 'fechado':
      return 'Fechado';
    case 'aprovado':
      return 'Aprovado';
    case 'pago':
      return 'Pago';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
};

// Table Row Component
function RepasseRow({ repasse, onView, onClose, onApprove, onPay }) {
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
    action(repasse);
  };

  const canClose = repasse.status === 'aberto';
  const canApprove = repasse.status === 'fechado';
  const canPay = repasse.status === 'aprovado';

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {repasse.profissionalNome || 'Medico'}
        </Typography>
        {repasse.profissionalCrm && (
          <Typography variant="caption" color="text.secondary">
            CRM: {repasse.profissionalCrm}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatDate(repasse.periodoInicio)} - {formatDate(repasse.periodoFim)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {formatCurrency(repasse.valorBruto)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {repasse.percentual}%
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatCurrency(repasse.valorRepasse)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={getStatusLabel(repasse.status)}
          size="small"
          color={getStatusColor(repasse.status)}
        />
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {canClose && (
            <Tooltip title="Fechar Repasse">
              <IconButton size="small" color="warning" onClick={() => onClose(repasse)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canApprove && (
            <Tooltip title="Aprovar Repasse">
              <IconButton size="small" color="primary" onClick={() => onApprove(repasse)}>
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canPay && (
            <Tooltip title="Pagar Repasse">
              <IconButton size="small" color="success" onClick={() => onPay(repasse)}>
                <PayIcon fontSize="small" />
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
              Ver Detalhes
            </MenuItem>
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
          <TableCell><Skeleton width={150} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={40} /></TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Stats Summary
function StatsSummary({ repasses, loading }) {
  const stats = useMemo(() => {
    const pendentes = repasses.filter((r) => ['aberto', 'fechado', 'aprovado'].includes(r.status));
    const pagos = repasses.filter((r) => r.status === 'pago');

    return {
      totalPendente: pendentes.reduce((sum, r) => sum + (r.valorRepasse || 0), 0),
      totalPago: pagos.reduce((sum, r) => sum + (r.valorRepasse || 0), 0),
      qtdPendentes: pendentes.length,
      qtdPagos: pagos.length,
    };
  }, [repasses]);

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
        icon={<RepasseIcon />}
        label={`Pendente: ${formatCurrency(stats.totalPendente)}`}
        color="warning"
        variant="outlined"
      />
      <Chip
        label={`Pago: ${formatCurrency(stats.totalPago)}`}
        color="success"
        variant="outlined"
      />
      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
        {stats.qtdPendentes} pendente(s) | {stats.qtdPagos} pago(s)
      </Typography>
    </Box>
  );
}

// Main Component
export default function RepassesList({
  onAdd,
  onView,
  onClose,
  onApprove,
  onPay,
}) {
  const {
    repasses,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    goToPage,
    fecharRepasse,
    aprovarRepasse,
  } = useRepasses();

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    goToPage(newPage + 1);
  };

  // Handle close action
  const handleClose = async (repasse) => {
    try {
      await fecharRepasse(repasse.id);
    } catch (err) {
      console.error('Error closing repasse:', err);
    }
  };

  // Handle approve action
  const handleApprove = async (repasse) => {
    try {
      await aprovarRepasse(repasse.id);
    } catch (err) {
      console.error('Error approving repasse:', err);
    }
  };

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
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Repasses Medicos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie os repasses de valores para profissionais
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Novo Repasse
          </Button>
        </Box>

        {/* Stats Summary */}
        <Box sx={{ mb: 3 }}>
          <StatsSummary repasses={repasses} loading={loading} />
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
              label="Status"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="aberto">Aberto</MenuItem>
              <MenuItem value="fechado">Fechado</MenuItem>
              <MenuItem value="aprovado">Aprovado</MenuItem>
              <MenuItem value="pago">Pago</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Profissional</TableCell>
                <TableCell>Periodo</TableCell>
                <TableCell align="right">Valor Bruto</TableCell>
                <TableCell align="right">%</TableCell>
                <TableCell align="right">Valor Repasse</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : repasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhum repasse encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                repasses.map((repasse) => (
                  <RepasseRow
                    key={repasse.id}
                    repasse={repasse}
                    onView={onView}
                    onClose={handleClose}
                    onApprove={handleApprove}
                    onPay={onPay}
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
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Linhas por pagina:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </CardContent>
    </Card>
  );
}
