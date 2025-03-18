"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    useTheme,
    alpha,
    Skeleton,
    Card,
    CardContent,
    Stack,
    Divider,
    Grid
} from '@mui/material';
import { TrendingUp, Timeline, PeopleAlt } from '@mui/icons-material';

const MetricsCard = ({ metrics, loading }) => {
    const theme = useTheme();
    const [timeFrame, setTimeFrame] = useState('hoje');

    const handleTimeFrameChange = (period) => {
        setTimeFrame(period);
    };

    // Obter o valor de atendimentos com base no período selecionado
    const getAppointmentValue = () => {
        let value;
        switch (timeFrame) {
            case 'hoje':
                value = metrics.dailyAppointments;
                break;
            case 'semana':
                value = metrics.weeklyAppointments;
                break;
            case 'mes':
                value = metrics.monthlyAppointments;
                break;
            case 'ano':
                value = metrics.yearlyAppointments;
                break;
            default:
                value = 0;
        }
        // Adiciona zero à esquerda para números menores que 10
        return value < 10 ? `0${value}` : `${value}`;
    };

    // Função para formatar a taxa de recorrência
    const getFormattedRecurringRate = () => {
        const rate = metrics.recurringRate || 0;
        return rate < 10 ? `0${rate}` : `${rate}`;
    };

    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: '#F5F9FF',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                    gutterBottom
                    sx={{ mb: 2 }}
                >
                    Veja suas métricas
                    <Typography component="span" color="primary" fontWeight={500}>
                        {' '}em tempo real
                    </Typography>
                </Typography>

                {/* Seleção de período */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        backgroundColor: '#fff',
                        borderRadius: '30px',
                        mb: 3,
                        p: 0.5,
                        border: '1px solid',
                        borderColor: theme.palette.divider
                    }}
                >
                    {['hoje', 'semana', 'mes', 'ano'].map((period) => (
                        <Box
                            key={period}
                            onClick={() => handleTimeFrameChange(period)}
                            sx={{
                                py: 0.5,
                                px: 2,
                                flex: 1,
                                textAlign: 'center',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                backgroundColor: timeFrame === period ? '#1852FE' : 'transparent',
                                color: timeFrame === period ? '#fff' : 'text.secondary',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: timeFrame === period ? '#1852FE' : alpha('#1852FE', 0.05)
                                }
                            }}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </Box>
                    ))}
                </Box>

                {/* Card de atendimentos - Design moderno e destacado */}
                <Card
                    elevation={0}
                    sx={{
                        mb: 3,
                        p: 0,
                        borderRadius: '20px',
                        backgroundColor: '#1852FE',
                        color: 'white',
                        overflow: 'hidden',
                        border: 'none',
                        position: 'relative'
                    }}
                >
                    <CardContent sx={{ p: 2.5 }}>
                        {/* Elementos decorativos */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 150,
                                height: 150,
                                borderRadius: '50%',
                                backgroundColor: alpha('#fff', 0.1)
                            }}
                        />

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    Seus Atendimentos
                                </Typography>
                                <Timeline fontSize="small" />
                            </Box>

                            {loading ? (
                                <Skeleton variant="text" width="50%" height={60} sx={{ bgcolor: alpha('#fff', 0.2) }} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography
                                        variant="h2"
                                        component="span"
                                        fontWeight={700}
                                        sx={{ letterSpacing: '-1px', lineHeight: 1 }}
                                    >
                                        {getAppointmentValue()}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        component="span"
                                        sx={{ ml: 1, mt: 1, opacity: 0.8 }}
                                    >
                                        no {timeFrame}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* Card de taxa de recorrência - Design complementar */}
                <Card
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: '20px',
                        backgroundColor: '#E3F2FD',
                        border: 'none',
                        overflow: 'hidden',
                        position: 'relative',
                        flex: 1
                    }}
                >
                    <CardContent sx={{ p: 2.5 }}>
                        {/* Elementos decorativos */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -20,
                                right: -20,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                backgroundColor: alpha('#1852FE', 0.05)
                            }}
                        />

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500} color="text.primary">
                                    Taxa de Recorrência
                                </Typography>
                                <TrendingUp fontSize="small" color="primary" />
                            </Box>

                            {loading ? (
                                <Skeleton variant="text" width="50%" height={60} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography
                                        variant="h2"
                                        component="span"
                                        fontWeight={700}
                                        color="#1852FE"
                                        sx={{ letterSpacing: '-1px', lineHeight: 1 }}
                                    >
                                        {getFormattedRecurringRate()}
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        component="span"
                                        color="#1852FE"
                                        fontWeight={700}
                                        sx={{ ml: 0.5 }}
                                    >
                                        %
                                    </Typography>
                                </Box>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                dos pacientes retornam em 3 meses
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Card de indicação */}
                <Card
                    elevation={0}
                    sx={{
                        backgroundColor: '#1852FE',
                        color: 'white',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative',
                        mt: 'auto'
                    }}
                >
                    <CardContent sx={{ p: 2.5 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs="auto">
                                <PeopleAlt fontSize="large" />
                            </Grid>
                            <Grid item xs>
                                <Typography variant="body1" fontWeight={600}>
                                    Traga 3 amigos para o Médico no Bolso e ganhe 1 mês grátis!
                                </Typography>

                                <Box
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '50px',
                                        py: 0.5,
                                        px: 2,
                                        mt: 1,
                                        display: 'inline-block',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                        }
                                    }}
                                >
                                    Copiar Link ID
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>

                    {/* Indicadores de slide */}
                    <Box sx={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                    </Box>
                </Card>
            </CardContent>
        </Card>
    );
};

export default MetricsCard;