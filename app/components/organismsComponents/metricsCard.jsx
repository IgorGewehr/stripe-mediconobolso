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
    Button
} from '@mui/material';
import { TrendingUp, Timeline, People } from '@mui/icons-material';

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
                value = metrics?.dailyAppointments || 0;
                break;
            case 'semana':
                value = metrics?.weeklyAppointments || 0;
                break;
            case 'mes':
                value = metrics?.monthlyAppointments || 0;
                break;
            case 'ano':
                value = metrics?.yearlyAppointments || 0;
                break;
            default:
                value = 0;
        }
        // Adiciona zero à esquerda para números menores que 10
        return value < 10 ? `0${value}` : `${value}`;
    };

    // Função para formatar a taxa de recorrência
    const getFormattedRecurringRate = () => {
        const rate = metrics?.recurringRate || 0;
        return rate < 10 ? `0${rate}` : `${rate}`;
    };

    // Estilo comum para ambos os cards principais
    const mainCardStyle = {
        height: '140px', // Altura fixa para todos os cards
        mb: 1,
        borderRadius: '20px',
        border: 'none',
        overflow: 'hidden',
        position: 'relative'
    };

    // Sem função de copiar link

    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: 'white', // Fundo branco conforme solicitado
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: 3 }}>
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
                        ...mainCardStyle,
                        backgroundColor: '#1852FE',
                        color: 'white',
                    }}
                >
                    <CardContent sx={{ p: 2.5, height: '100%', position: 'relative' }}>
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

                        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    Seus Atendimentos
                                </Typography>
                                <Timeline fontSize="small" />
                            </Box>

                            {loading ? (
                                <Skeleton variant="text" width="50%" height={60} sx={{ bgcolor: alpha('#fff', 0.2) }} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
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

                {/* Card de taxa de recorrência - Com mesma altura do card anterior */}
                <Card
                    elevation={0}
                    sx={{
                        ...mainCardStyle,
                        backgroundColor: '#E3F2FD',
                    }}
                >
                    <CardContent sx={{ p: 2.5, height: '100%', position: 'relative' }}>
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

                        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500} color="text.primary">
                                    Taxa de Recorrência
                                </Typography>
                                <TrendingUp fontSize="small" color="primary" />
                            </Box>

                            {loading ? (
                                <Skeleton variant="text" width="50%" height={60} />
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 'auto' }}>
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

                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        dos pacientes retornam em 3 meses
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* Novo card de indicação - Substituindo a imagem */}
                <Card
                    elevation={0}
                    sx={{
                        ...mainCardStyle,
                        background: 'linear-gradient(135deg, #7B40F2 0%, #4A3AFF 100%)',
                        mt: 1,
                        color: 'white'
                    }}
                >
                    <CardContent sx={{ p: 2.5, height: '100%', position: 'relative' }}>
                        {/* Elementos decorativos */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -25,
                                right: -25,
                                width: 140,
                                height: 140,
                                borderRadius: '50%',
                                backgroundColor: alpha('#fff', 0.1)
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -15,
                                left: -15,
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: alpha('#fff', 0.08)
                            }}
                        />

                        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    Programa de Indicação
                                </Typography>
                                <People fontSize="small" />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        mt: -1
                                    }}
                                >
                                    Com 3 indicações você ganha 1 mês grátis!
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
};

export default MetricsCard;