'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useConvenios } from '../../hooks/useConvenios';

export default function ConveniosList({ onAdd, onEdit, onDelete }) {
  const { convenios, loading, refresh } = useConvenios({ autoLoad: true });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConvenios = convenios.filter(conv =>
    conv.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.codigoAns?.includes(searchTerm) ||
    conv.cnpj?.includes(searchTerm)
  );

  const formatCnpj = (cnpj) => {
    if (!cnpj) return '-';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Convenios
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={refresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            size="small"
          >
            Novo Convenio
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por nome, ANS ou CNPJ..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Codigo ANS</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell align="center">Prazo (dias)</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredConvenios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'Nenhum convenio encontrado' : 'Nenhum convenio cadastrado'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredConvenios.map((conv) => (
                <TableRow key={conv.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{conv.nome}</Typography>
                    {conv.email && (
                      <Typography variant="caption" color="text.secondary">
                        {conv.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{conv.codigoAns || conv.codigo_ans}</TableCell>
                  <TableCell>{formatCnpj(conv.cnpj)}</TableCell>
                  <TableCell align="center">
                    {conv.prazoPagamentoDias || conv.prazo_pagamento_dias || 30}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={conv.ativo !== false ? 'Ativo' : 'Inativo'}
                      color={conv.ativo !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit?.(conv)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" onClick={() => onDelete?.(conv)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
