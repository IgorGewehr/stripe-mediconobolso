'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function ResumoCard({ title, value, subtitle, color = 'primary', loading, icon: Icon }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={120} height={36} />
            ) : (
              <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
                {formatCurrency(value)}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                bgcolor: `${color}.lighter`,
                borderRadius: 1,
                p: 1,
              }}
            >
              <Icon sx={{ color: `${color}.main` }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function FinanceiroResumo() {
  const { getResumoFinanceiro, getPrevisaoRecebimento, loading } = useTiss();
  const [resumo, setResumo] = useState(null);
  const [previsao, setPrevisao] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Get current month dates
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const dataInicio = inicioMes.toISOString().split('T')[0];
      const dataFim = fimMes.toISOString().split('T')[0];

      const [resumoData, previsaoData] = await Promise.all([
        getResumoFinanceiro(dataInicio, dataFim),
        getPrevisaoRecebimento(3),
      ]);

      setResumo(resumoData);
      setPrevisao(previsaoData);
    };

    fetchData();
  }, [getResumoFinanceiro, getPrevisaoRecebimento]);

  const calcularPercentualRecebido = () => {
    if (!resumo?.total_previsto || resumo.total_previsto === 0) return 0;
    return (resumo.total_recebido / resumo.total_previsto) * 100;
  };

  return (
    <Box>
      {/* Resumo Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ResumoCard
            title="Previsto no Período"
            value={resumo?.total_previsto}
            loading={loading}
            color="primary"
            icon={AccountIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResumoCard
            title="Recebido"
            value={resumo?.total_recebido}
            loading={loading}
            color="success"
            icon={TrendingUpIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResumoCard
            title="Glosado"
            value={resumo?.total_glosado}
            loading={loading}
            color="error"
            icon={TrendingDownIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResumoCard
            title="Pendente"
            value={resumo?.total_pendente}
            loading={loading}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Progresso de Recebimento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {calcularPercentualRecebido().toFixed(1)}% recebido
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calcularPercentualRecebido()}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(resumo?.total_recebido)} de {formatCurrency(resumo?.total_previsto)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Por Operadora */}
      {resumo?.por_operadora && resumo.por_operadora.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Por Operadora
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operadora</TableCell>
                    <TableCell align="right">Previsto</TableCell>
                    <TableCell align="right">Recebido</TableCell>
                    <TableCell align="right">Glosado</TableCell>
                    <TableCell align="right">Pendente</TableCell>
                    <TableCell align="center">Lotes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumo.por_operadora.map((op) => (
                    <TableRow key={op.operadora_id}>
                      <TableCell>{op.operadora_nome}</TableCell>
                      <TableCell align="right">{formatCurrency(op.valor_previsto)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {formatCurrency(op.valor_recebido)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatCurrency(op.valor_glosado)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'warning.main' }}>
                        {formatCurrency(op.valor_pendente)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={op.quantidade_lotes} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Previsão */}
      {previsao && previsao.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Previsão de Recebimento
            </Typography>
            <Grid container spacing={2}>
              {previsao.map((mes) => (
                <Grid item xs={12} md={4} key={mes.mes}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(mes.mes + '-01').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {formatCurrency(mes.valor_previsto)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mes.quantidade_lotes} lote(s)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
