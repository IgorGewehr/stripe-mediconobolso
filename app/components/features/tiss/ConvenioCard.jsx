'use client';

import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard as CardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as ValidIcon,
} from '@mui/icons-material';

export default function ConvenioCard({
  convenio,
  onEdit,
  onDelete,
  showActions = true,
}) {
  const isExpired = convenio.validade_carteira
    ? new Date(convenio.validade_carteira) < new Date()
    : false;

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isExpired ? 'error.main' : 'divider',
        borderWidth: isExpired ? 2 : 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                bgcolor: 'primary.light',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CardIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {convenio.operadora_nome || 'Operadora não informada'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Código ANS: {convenio.operadora_codigo_ans || '-'}
              </Typography>
            </Box>
          </Box>

          {showActions && (
            <Box>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit?.(convenio)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remover">
                <IconButton size="small" onClick={() => onDelete?.(convenio)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Carteira:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {convenio.numero_carteira}
            </Typography>
          </Box>

          {convenio.nome_plano && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Plano:
              </Typography>
              <Typography variant="body2">
                {convenio.nome_plano}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Validade:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {formatDate(convenio.validade_carteira)}
              </Typography>
              {isExpired ? (
                <Chip
                  icon={<WarningIcon />}
                  label="Expirada"
                  color="error"
                  size="small"
                />
              ) : convenio.carteira_valida ? (
                <Chip
                  icon={<ValidIcon />}
                  label="Válida"
                  color="success"
                  size="small"
                />
              ) : null}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
