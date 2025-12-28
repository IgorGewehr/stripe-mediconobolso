'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import {
  Receipt as NfseIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Code as XmlIcon,
} from '@mui/icons-material';
import { useNfse, useNfseXml } from '../../hooks/useNfse';

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
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Status chip color
const getStatusColor = (status) => {
  switch (status) {
    case 'emitida':
      return 'success';
    case 'processando':
      return 'info';
    case 'rascunho':
      return 'default';
    case 'cancelada':
      return 'error';
    case 'erro':
      return 'error';
    default:
      return 'default';
  }
};

// Status label
const getStatusLabel = (status) => {
  switch (status) {
    case 'emitida':
      return 'Emitida';
    case 'processando':
      return 'Processando';
    case 'rascunho':
      return 'Rascunho';
    case 'cancelada':
      return 'Cancelada';
    case 'erro':
      return 'Erro';
    default:
      return status;
  }
};

// Cancel Dialog
function CancelDialog({ open, onClose, onConfirm, isLoading }) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo);
      setMotivo('');
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar NFSe</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          O cancelamento de NFSe e uma operacao irreversivel e sera enviado para a prefeitura.
        </Alert>
        <TextField
          label="Motivo do Cancelamento"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          fullWidth
          multiline
          rows={3}
          required
          placeholder="Informe o motivo do cancelamento..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Voltar</Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={!motivo.trim() || isLoading}
        >
          {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// XML View Dialog
function XmlDialog({ open, onClose, nfseId }) {
  const { data, isLoading } = useNfseXml(open ? nfseId : null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>XML da NFSe</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400,
              fontSize: '0.75rem',
            }}
          >
            {data?.xml || 'XML nao disponivel'}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        {data?.xml && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const blob = new Blob([data.xml], { type: 'application/xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nfse-${nfseId}.xml`;
              a.click();
            }}
          >
            Download XML
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function NfseList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNfse, setSelectedNfse] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [xmlOpen, setXmlOpen] = useState(false);

  const {
    nfses,
    total,
    page,
    perPage,
    setPage,
    setPerPage,
    isLoading,
    error,
    refetch,
    cancelar,
    isCanceling,
  } = useNfse();

  const handleMenuOpen = (event, nfse) => {
    setAnchorEl(event.currentTarget);
    setSelectedNfse(nfse);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCancelClick = () => {
    handleMenuClose();
    setCancelOpen(true);
  };

  const handleCancelConfirm = async (motivo) => {
    try {
      await cancelar({ id: selectedNfse.id, motivo });
      setCancelOpen(false);
      setSelectedNfse(null);
    } catch (err) {
      console.error('Erro ao cancelar:', err);
    }
  };

  const handleXmlClick = () => {
    handleMenuClose();
    setXmlOpen(true);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (event) => {
    setPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const filteredNfses = nfses.filter((nfse) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      nfse.numero?.toString().includes(search) ||
      nfse.codigo_verificacao?.toLowerCase().includes(search) ||
      nfse.tomador_nome?.toLowerCase().includes(search)
    );
  });

  if (error) {
    return <Alert severity="error">Erro ao carregar NFSes: {error.message}</Alert>;
  }

  return (
    <Card>
      <CardHeader
        title="Notas Fiscais Emitidas"
        avatar={<NfseIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Atualizar">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        {isLoading ? (
          <LinearProgress />
        ) : filteredNfses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NfseIcon sx={{ fontSize: 64, color: 'grey.400' }} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              Nenhuma NFSe emitida
            </Typography>
            <Typography variant="body2" color="text.secondary">
              As notas fiscais emitidas aparecerao aqui
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Numero</TableCell>
                    <TableCell>Data Emissao</TableCell>
                    <TableCell>Tomador</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Cod. Verificacao</TableCell>
                    <TableCell align="center">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNfses.map((nfse) => (
                    <TableRow key={nfse.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{nfse.numero || '-'}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(nfse.data_emissao)}</TableCell>
                      <TableCell>{nfse.tomador_nome || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(nfse.valor_servicos)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getStatusLabel(nfse.status)}
                          color={getStatusColor(nfse.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {nfse.codigo_verificacao || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, nfse)}>
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page - 1}
              onPageChange={handlePageChange}
              rowsPerPage={perPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Por pagina:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </CardContent>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleXmlClick}>
          <XmlIcon sx={{ mr: 1 }} /> Ver XML
        </MenuItem>
        {selectedNfse?.status === 'emitida' && (
          <MenuItem onClick={handleCancelClick} sx={{ color: 'error.main' }}>
            <CancelIcon sx={{ mr: 1 }} /> Cancelar NFSe
          </MenuItem>
        )}
      </Menu>

      {/* Dialogs */}
      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCanceling}
      />
      <XmlDialog
        open={xmlOpen}
        onClose={() => {
          setXmlOpen(false);
          setSelectedNfse(null);
        }}
        nfseId={selectedNfse?.id}
      />
    </Card>
  );
}
