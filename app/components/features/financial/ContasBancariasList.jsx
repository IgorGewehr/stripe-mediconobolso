'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  AccountBalance as BankIcon,
  SwapHoriz as TransferIcon,
  Receipt as ExtratoIcon,
  MoreVert as MoreIcon,
  TrendingUp as PositiveIcon,
  TrendingDown as NegativeIcon,
} from '@mui/icons-material';
import { useContasBancarias } from '../../hooks/useFinancial';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Bank Account Card Component
function ContaBancariaCard({ conta, onEdit, onTransfer, onExtrato }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const saldoPositivo = (conta.saldoAtual || 0) >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        borderTop: 4,
        borderColor: saldoPositivo ? 'success.main' : 'error.main',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {conta.descricao || `${conta.banco} - ${conta.tipoConta}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {conta.banco}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => { setAnchorEl(null); onEdit(conta); }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); onTransfer(conta); }}>
              <TransferIcon fontSize="small" sx={{ mr: 1 }} />
              Transferir
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); onExtrato(conta); }}>
              <ExtratoIcon fontSize="small" sx={{ mr: 1 }} />
              Ver Extrato
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Agencia: {conta.agencia} | Conta: {conta.conta}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saldoPositivo ? (
            <PositiveIcon color="success" fontSize="small" />
          ) : (
            <NegativeIcon color="error" fontSize="small" />
          )}
          <Typography
            variant="h5"
            fontWeight="bold"
            color={saldoPositivo ? 'success.main' : 'error.main'}
          >
            {formatCurrency(conta.saldoAtual)}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Saldo atual
        </Typography>

        {conta.tipoConta && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={conta.tipoConta === 'corrente' ? 'Conta Corrente' : 'Conta Poupanca'}
              size="small"
              variant="outlined"
            />
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
        <Skeleton width="80%" sx={{ mb: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
        <Skeleton width="40%" />
      </CardContent>
    </Card>
  );
}

// Main Component
export default function ContasBancariasList({
  onAdd,
  onEdit,
  onTransfer,
  onExtrato,
}) {
  const {
    contas,
    saldoTotal,
    loading,
    error,
  } = useContasBancarias();

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
            Contas Bancarias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie suas contas bancarias e saldos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => onTransfer?.(null)}
          >
            Transferir
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Nova Conta
          </Button>
        </Box>
      </Box>

      {/* Summary Card */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.lighter' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Saldo Total em Contas
            </Typography>
            {loading ? (
              <Skeleton width={200} height={40} />
            ) : (
              <Typography
                variant="h4"
                fontWeight="bold"
                color={saldoTotal >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(saldoTotal)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`${contas.length} conta(s)`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </Paper>

      {/* Accounts Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <CardSkeleton />
              </Grid>
            ))}
          </>
        ) : contas.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <BankIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                Nenhuma conta bancaria cadastrada
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{ mt: 2 }}
              >
                Cadastrar Primeira Conta
              </Button>
            </Paper>
          </Grid>
        ) : (
          contas.map((conta) => (
            <Grid item xs={12} sm={6} md={4} key={conta.id}>
              <ContaBancariaCard
                conta={conta}
                onEdit={onEdit}
                onTransfer={onTransfer}
                onExtrato={onExtrato}
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
