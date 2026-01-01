'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
  Lightbulb as SuggestionIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSugestoesFinanceiras } from '../../hooks/useFinancial';

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

// Get tipo label and icon
const getTipoInfo = (tipo) => {
  switch (tipo) {
    case 'conta_receber':
      return { label: 'Conta a Receber', icon: ReceiptIcon, color: 'success' };
    case 'conta_pagar':
      return { label: 'Conta a Pagar', icon: PaymentIcon, color: 'error' };
    default:
      return { label: tipo, icon: SuggestionIcon, color: 'default' };
  }
};

// Get origem label
const getOrigemLabel = (origem) => {
  switch (origem) {
    case 'consulta':
      return 'Consulta';
    case 'agendamento':
      return 'Agendamento';
    case 'guia':
      return 'Guia TISS';
    case 'recorrencia':
      return 'Despesa Recorrente';
    default:
      return origem;
  }
};

// Suggestion Card Component
function SugestaoCard({ sugestao, onAccept, onReject, saving }) {
  const tipoInfo = getTipoInfo(sugestao.tipo);
  const TipoIcon = tipoInfo.icon;
  const dados = sugestao.dadosSugeridos || {};

  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: 4,
        borderColor: `${tipoInfo.color}.main`,
        opacity: saving ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TipoIcon color={tipoInfo.color} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {tipoInfo.label}
              </Typography>
              <Chip
                label={getOrigemLabel(sugestao.origem)}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            color={`${tipoInfo.color}.main`}
          >
            {formatCurrency(dados.valor || dados.valorBruto || 0)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {dados.descricao || 'Sem descricao'}
          </Typography>
          {dados.pacienteNome && (
            <Typography variant="caption" display="block">
              Paciente: {dados.pacienteNome}
            </Typography>
          )}
          {dados.fornecedorNome && (
            <Typography variant="caption" display="block">
              Fornecedor: {dados.fornecedorNome}
            </Typography>
          )}
          {dados.dataVencimento && (
            <Typography variant="caption" display="block">
              Vencimento: {formatDate(dados.dataVencimento)}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Tooltip title="Rejeitar">
            <IconButton
              size="small"
              color="error"
              onClick={() => onReject(sugestao)}
              disabled={saving}
            >
              <RejectIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<AcceptIcon />}
            onClick={() => onAccept(sugestao)}
            disabled={saving}
          >
            Aceitar
          </Button>
        </Box>

        {sugestao.expiraEm && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Expira em: {formatDate(sugestao.expiraEm)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function CardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </Box>
        </Box>
        <Skeleton width="100%" sx={{ mb: 1 }} />
        <Skeleton width="80%" sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton width={80} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
}

// Rejection Dialog
function RejectDialog({ open, onClose, onConfirm, saving }) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo('');
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rejeitar Sugestao</DialogTitle>
      <DialogContent>
        <TextField
          label="Motivo da rejeicao"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          fullWidth
          size="small"
          multiline
          rows={3}
          sx={{ mt: 2 }}
          placeholder="Informe o motivo da rejeicao (opcional)"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={saving}
        >
          Rejeitar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function SugestoesFinanceirasList() {
  const {
    sugestoes,
    countByType,
    loading,
    saving,
    error,
    aceitarSugestao,
    rejeitarSugestao,
    refresh,
  } = useSugestoesFinanceiras();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSugestao, setSelectedSugestao] = useState(null);

  const handleAccept = async (sugestao) => {
    try {
      await aceitarSugestao(sugestao.id);
    } catch (err) {
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleRejectClick = (sugestao) => {
    setSelectedSugestao(sugestao);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (motivo) => {
    if (!selectedSugestao) return;

    try {
      await rejeitarSugestao(selectedSugestao.id, motivo);
      setRejectDialogOpen(false);
      setSelectedSugestao(null);
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
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
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Sugestoes Financeiras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revise e aprove lancamentos financeiros sugeridos automaticamente
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {countByType.conta_receber > 0 && (
            <Chip
              icon={<ReceiptIcon />}
              label={`${countByType.conta_receber} a receber`}
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          {countByType.conta_pagar > 0 && (
            <Chip
              icon={<PaymentIcon />}
              label={`${countByType.conta_pagar} a pagar`}
              color="error"
              variant="outlined"
              size="small"
            />
          )}
          <Tooltip title="Atualizar">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Suggestions Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <CardSkeleton />
              </Grid>
            ))}
          </>
        ) : sugestoes.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SuggestionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma sugestao pendente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Novas sugestoes aparecerao aqui quando consultas ou despesas recorrentes forem identificadas
              </Typography>
            </Paper>
          </Grid>
        ) : (
          sugestoes.map((sugestao) => (
            <Grid item xs={12} sm={6} md={4} key={sugestao.id}>
              <SugestaoCard
                sugestao={sugestao}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                saving={saving}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setSelectedSugestao(null);
        }}
        onConfirm={handleRejectConfirm}
        saving={saving}
      />
    </Box>
  );
}
