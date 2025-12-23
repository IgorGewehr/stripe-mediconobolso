'use client';

import {
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const NIVEL_CONFIG = {
  erro: {
    severity: 'error',
    icon: ErrorIcon,
    color: 'error',
    label: 'Erro',
  },
  aviso: {
    severity: 'warning',
    icon: WarningIcon,
    color: 'warning',
    label: 'Aviso',
  },
  info: {
    severity: 'info',
    icon: InfoIcon,
    color: 'info',
    label: 'Info',
  },
};

export default function ValidationAlert({ validacoes = [], title = 'Resultado da Validação' }) {
  const [expanded, setExpanded] = useState(true);

  if (!validacoes || validacoes.length === 0) {
    return (
      <Alert severity="success" icon={<CheckIcon />}>
        <AlertTitle>Validação Concluída</AlertTitle>
        Nenhum problema encontrado. A guia/lote está pronto para envio.
      </Alert>
    );
  }

  const erros = validacoes.filter((v) => v.nivel === 'erro');
  const avisos = validacoes.filter((v) => v.nivel === 'aviso');
  const infos = validacoes.filter((v) => v.nivel === 'info');

  const temErros = erros.length > 0;

  return (
    <Box>
      <Alert
        severity={temErros ? 'error' : 'warning'}
        action={
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      >
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {title}
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {erros.length > 0 && (
              <Chip
                label={`${erros.length} erro(s)`}
                color="error"
                size="small"
              />
            )}
            {avisos.length > 0 && (
              <Chip
                label={`${avisos.length} aviso(s)`}
                color="warning"
                size="small"
              />
            )}
            {infos.length > 0 && (
              <Chip
                label={`${infos.length} info(s)`}
                color="info"
                size="small"
              />
            )}
          </Box>
        </AlertTitle>
        {temErros
          ? 'Existem erros que impedem o envio. Corrija-os antes de continuar.'
          : 'Existem avisos que podem afetar o processamento.'}
      </Alert>

      <Collapse in={expanded}>
        <List dense sx={{ mt: 1 }}>
          {validacoes.map((validacao, index) => {
            const config = NIVEL_CONFIG[validacao.nivel] || NIVEL_CONFIG.info;
            const Icon = config.icon;

            return (
              <ListItem
                key={`${validacao.codigo}-${index}`}
                sx={{
                  bgcolor: `${config.color}.lighter`,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon color={config.color} fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {validacao.mensagem}
                      </Typography>
                      {validacao.codigo && (
                        <Chip
                          label={validacao.codigo}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    validacao.campo && (
                      <Typography variant="caption" color="text.secondary">
                        Campo: {validacao.campo}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}
