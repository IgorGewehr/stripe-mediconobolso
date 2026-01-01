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
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  MoreVert as MoreIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useFornecedores } from '../../hooks/useFinancial';

// Format CPF/CNPJ
const formatCpfCnpj = (value) => {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

// Table Row Component
function FornecedorRow({ fornecedor, onView, onEdit, onDeactivate }) {
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
    action(fornecedor);
  };

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="action" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {fornecedor.nomeFantasia || fornecedor.razaoSocial}
            </Typography>
            {fornecedor.nomeFantasia && (
              <Typography variant="caption" color="text.secondary" display="block">
                {fornecedor.razaoSocial}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatCpfCnpj(fornecedor.cpfCnpj)}
        </Typography>
      </TableCell>
      <TableCell>
        {fornecedor.categoria ? (
          <Chip label={fornecedor.categoria} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {fornecedor.telefone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">{fornecedor.telefone}</Typography>
            </Box>
          )}
          {fornecedor.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>
                {fornecedor.email}
              </Typography>
            </Box>
          )}
          {!fornecedor.telefone && !fornecedor.email && (
            <Typography variant="body2" color="text.secondary">-</Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        {fornecedor.cidade && fornecedor.uf ? (
          <Typography variant="body2">
            {fornecedor.cidade}/{fornecedor.uf}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={fornecedor.ativo ? 'Ativo' : 'Inativo'}
          size="small"
          color={fornecedor.ativo ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell align="right">
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
          {fornecedor.ativo && (
            <MenuItem
              onClick={() => handleAction(onDeactivate)}
              sx={{ color: 'error.main' }}
            >
              <DeactivateIcon fontSize="small" sx={{ mr: 1 }} />
              Desativar
            </MenuItem>
          )}
        </Menu>
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
          <TableCell><Skeleton width={120} /></TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton /></TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell><Skeleton width={40} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Main Component
export default function FornecedoresList({
  onAdd,
  onView,
  onEdit,
  onDeactivate,
}) {
  const {
    fornecedores,
    loading,
    error,
    searchTerm,
    setSearchTerm,
  } = useFornecedores();

  // Filter fornecedores locally by search term
  const filteredFornecedores = useMemo(() => {
    if (!searchTerm) return fornecedores;

    const term = searchTerm.toLowerCase();
    return fornecedores.filter((f) =>
      f.razaoSocial?.toLowerCase().includes(term) ||
      f.nomeFantasia?.toLowerCase().includes(term) ||
      f.cpfCnpj?.includes(term) ||
      f.email?.toLowerCase().includes(term)
    );
  }, [fornecedores, searchTerm]);

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
              Fornecedores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie seus fornecedores e prestadores de servico
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Novo Fornecedor
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Buscar por nome, CNPJ ou email..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 350 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CPF/CNPJ</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Cidade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : filteredFornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhum fornecedor encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFornecedores.map((fornecedor) => (
                  <FornecedorRow
                    key={fornecedor.id}
                    fornecedor={fornecedor}
                    onView={onView}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredFornecedores.length} fornecedor(es) encontrado(s)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
