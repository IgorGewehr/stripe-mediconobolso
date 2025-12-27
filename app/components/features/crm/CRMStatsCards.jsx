'use client';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as ReturnIcon,
  Send as SentIcon,
  QuestionAnswer as ResponseIcon,
  PersonOff as InactiveIcon,
} from '@mui/icons-material';

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', loading }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} />
            ) : (
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                sx={{ color: `${color}.main` }}
              >
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CRMStatsCards({ stats, loading }) {
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Taxa de Retorno"
          value={formatPercentage(stats?.return_rate)}
          subtitle="Pacientes que retornaram"
          icon={ReturnIcon}
          color="primary"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Follow-ups Enviados"
          value={stats?.total_follow_ups_sent || 0}
          subtitle="No período selecionado"
          icon={SentIcon}
          color="success"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Taxa de Resposta"
          value={formatPercentage(stats?.response_rate)}
          subtitle="Mensagens respondidas"
          icon={ResponseIcon}
          color="info"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pacientes Inativos"
          value={stats?.total_inactive_patients || 0}
          subtitle="Sem consulta há 90+ dias"
          icon={InactiveIcon}
          color="warning"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}
