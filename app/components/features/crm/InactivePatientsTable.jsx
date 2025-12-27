'use client';

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
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { crmService } from '@/lib/services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

const formatDaysInactive = crmService.formatDaysLabel;

const DAYS_OPTIONS = [
  { value: 30, label: '30 dias' },
  { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
  { value: 180, label: '6 meses' },
  { value: 365, label: '1 ano' },
];

function PatientRow({ patient }) {
  const handleWhatsApp = () => {
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (patient.email) {
      window.open(`mailto:${patient.email}`, '_blank');
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {patient.name || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {patient.phone || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {patient.email || '-'}
        </Typography>
      </TableCell>
      <TableCell>{formatDate(patient.last_consultation_date)}</TableCell>
      <TableCell>
        <Chip
          label={formatDaysInactive(patient.days_inactive)}
          size="small"
          color={patient.days_inactive > 180 ? 'error' : 'warning'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {patient.phone && (
            <Tooltip title="Enviar WhatsApp">
              <IconButton size="small" color="success" onClick={handleWhatsApp}>
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {patient.email && (
            <Tooltip title="Enviar Email">
              <IconButton size="small" color="primary" onClick={handleEmail}>
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default function InactivePatientsTable({
  patients,
  loading,
  error,
  pagination,
  days,
  onDaysChange,
  onRefresh,
  onPageChange,
}) {
  if (loading && (!patients || patients.length === 0)) {
    return (
      <Card>
        <CardHeader title="Pacientes Inativos" />
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
        title="Pacientes Inativos"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheader={`Pacientes sem consulta há mais de ${formatDaysInactive(days)}`}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={days}
                label="Período"
                onChange={(e) => onDaysChange(e.target.value)}
              >
                {DAYS_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
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

        {(!patients || patients.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Nenhum paciente inativo encontrado
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Isso é uma boa notícia! Seus pacientes estão retornando regularmente.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Telefone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Última Consulta</TableCell>
                    <TableCell>Dias Inativo</TableCell>
                    <TableCell align="right">Contato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <PatientRow key={patient.id} patient={patient} />
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
