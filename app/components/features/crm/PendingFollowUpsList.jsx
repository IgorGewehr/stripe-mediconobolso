'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  FollowUpStatusLabels,
  FollowUpRuleTypeLabels,
} from '@/lib/services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    sent: 'info',
    responded: 'success',
    completed: 'success',
    cancelled: 'default',
    failed: 'error',
  };
  return colors[status] || 'default';
};

function FollowUpRow({ followUp, onCancel, saving }) {
  const canCancel = followUp.status === 'pending';

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {followUp.patient_name || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {followUp.patient_phone || ''}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={FollowUpRuleTypeLabels[followUp.rule_type] || followUp.rule_type}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>{formatDate(followUp.scheduled_at)}</TableCell>
      <TableCell>
        <Chip
          label={FollowUpStatusLabels[followUp.status] || followUp.status}
          size="small"
          color={getStatusColor(followUp.status)}
        />
      </TableCell>
      <TableCell>{formatDate(followUp.sent_at)}</TableCell>
      <TableCell align="right">
        {canCancel && (
          <Tooltip title="Cancelar follow-up">
            <IconButton
              size="small"
              onClick={() => onCancel(followUp.id)}
              disabled={saving}
              color="error"
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function PendingFollowUpsList({
  followUps,
  loading,
  saving,
  error,
  pagination,
  filters,
  onCancel,
  onRefresh,
  onPageChange,
  onFilterChange,
}) {
  const handleStatusFilter = (event) => {
    onFilterChange({ ...filters, status: event.target.value || null });
  };

  if (loading && (!followUps || followUps.length === 0)) {
    return (
      <Card>
        <CardHeader title="Follow-ups Pendentes" />
        <Divider />
        <CardContent>
          <Skeleton height={50} sx={{ mb: 1 }} />
          <Skeleton height={50} sx={{ mb: 1 }} />
          <Skeleton height={50} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Follow-ups Pendentes"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="sent">Enviado</MenuItem>
                <MenuItem value="responded">Respondido</MenuItem>
                <MenuItem value="completed">Concluído</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
                <MenuItem value="failed">Falhou</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Atualizar">
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {(!followUps || followUps.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Nenhum follow-up encontrado
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Agendado Para</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Enviado Em</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {followUps.map((fu) => (
                    <FollowUpRow
                      key={fu.id}
                      followUp={fu}
                      onCancel={onCancel}
                      saving={saving}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={(_, newPage) => onPageChange(newPage + 1)}
              rowsPerPage={pagination.perPage}
              rowsPerPageOptions={[pagination.perPage]}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
