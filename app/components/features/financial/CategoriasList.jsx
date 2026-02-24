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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useCategorias } from '../../hooks/useFinancial';

export default function CategoriasList({ onAdd }) {
  const { categorias, loading, error, loadCategorias, seedCategorias } = useCategorias({ autoLoad: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);

  const filteredCategorias = categorias.filter(cat =>
    cat.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeedCategorias = async () => {
    setSeeding(true);
    try {
      await seedCategorias();
    } catch (err) {
      console.error('Error seeding categorias:', err);
    } finally {
      setSeeding(false);
    }
  };

  const getTipoColor = (tipo) => {
    return tipo === 'receita' ? 'success' : 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Categorias Financeiras
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={loadCategorias} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {categorias.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleSeedCategorias}
              disabled={seeding}
              size="small"
            >
              {seeding ? 'Criando...' : 'Criar Categorias Padrao'}
            </Button>
          )}
          {onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
              size="small"
            >
              Nova Categoria
            </Button>
          )}
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por nome ou codigo..."
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

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codigo</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Descricao</TableCell>
              <TableCell align="center">Tipo</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredCategorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography color="text.secondary">
                      {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                    </Typography>
                    {!searchTerm && categorias.length === 0 && (
                      <Button
                        variant="outlined"
                        onClick={handleSeedCategorias}
                        disabled={seeding}
                      >
                        {seeding ? 'Criando...' : 'Criar Categorias Padrao'}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategorias.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell>
                    <Typography fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                      {cat.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat.cor && (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: cat.cor,
                          }}
                        />
                      )}
                      <Typography fontWeight={500}>{cat.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {cat.descricao || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      color={getTipoColor(cat.tipo)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={cat.ativo !== false ? 'Ativo' : 'Inativo'}
                      color={cat.ativo !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      {filteredCategorias.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredCategorias.filter(c => c.tipo === 'receita').length} categorias de receita
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCategorias.filter(c => c.tipo === 'despesa').length} categorias de despesa
          </Typography>
        </Box>
      )}
    </Box>
  );
}
