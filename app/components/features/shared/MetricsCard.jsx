"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    alpha,
    Skeleton,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

// Card de estatistica individual com borda colorida
const StatCard = ({ title, value, color, icon: IconComponent, trend, trendType, loading, onClick }) => {
    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: "16px",
                border: "none",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                transition: "all 0.3s ease",
                cursor: onClick ? "pointer" : "default",
                height: "100%",
                minHeight: "100px",
                display: "flex",
                overflow: "hidden",
                "&:hover": onClick ? {
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-2px)",
                } : {},
            }}
        >
            {/* Borda colorida na esquerda */}
            <Box sx={{ width: "4px", backgroundColor: color, flexShrink: 0 }} />

            <CardContent sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 2,
                "&:last-child": { pb: 2 },
            }}>
                {/* Header com icone */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        backgroundColor: alpha(color, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <IconComponent sx={{ width: 18, height: 18, color: color }} />
                    </Box>

                    {/* Indicador de mudanca */}
                    {trend !== null && trend !== undefined && !loading && (
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.25,
                            px: 1,
                            py: 0.25,
                            borderRadius: "6px",
                            backgroundColor: trendType === "up" ? "#ECFDF5" : "#FEF2F2",
                        }}>
                            {trendType === "up" ? (
                                <TrendingUpIcon sx={{ width: 12, height: 12, color: "#059669" }} />
                            ) : (
                                <TrendingDownIcon sx={{ width: 12, height: 12, color: "#DC2626" }} />
                            )}
                            <Typography sx={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: trendType === "up" ? "#059669" : "#DC2626",
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                {trend}%
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Conteudo principal */}
                <Box sx={{ mt: 1.5 }}>
                    {loading ? (
                        <>
                            <Skeleton variant="text" width={50} height={32} sx={{ bgcolor: "rgba(0,0,0,0.06)" }} />
                            <Skeleton variant="text" width={80} height={14} sx={{ bgcolor: "rgba(0,0,0,0.06)" }} />
                        </>
                    ) : (
                        <>
                            <Typography sx={{
                                fontSize: "24px",
                                fontWeight: 700,
                                color: "#0F172A",
                                lineHeight: 1.2,
                                letterSpacing: "-0.02em",
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                {value}
                            </Typography>
                            <Typography sx={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "#64748B",
                                mt: 0.25,
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                {title}
                            </Typography>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const MetricsCard = ({ metrics, loading }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [timeFrame, setTimeFrame] = useState('hoje');

    const handleTimeFrameChange = (period) => {
        setTimeFrame(period);
    };

    // Obter o valor de atendimentos com base no periodo selecionado
    const getAppointmentValue = () => {
        switch (timeFrame) {
            case 'hoje':
                return metrics?.dailyAppointments || 0;
            case 'semana':
                return metrics?.weeklyAppointments || 0;
            case 'mes':
                return metrics?.monthlyAppointments || 0;
            case 'ano':
                return metrics?.yearlyAppointments || 0;
            default:
                return 0;
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                {/* Header com titulo */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: '#0F172A',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Metricas
                    </Typography>

                    {/* Seletor de periodo modernizado */}
                    <Box sx={{
                        display: 'flex',
                        backgroundColor: '#F1F5F9',
                        borderRadius: '9999px',
                        p: 0.5,
                    }}>
                        {['hoje', 'semana', 'mes'].map((period) => (
                            <Box
                                key={period}
                                onClick={() => handleTimeFrameChange(period)}
                                sx={{
                                    py: 0.5,
                                    px: 1.5,
                                    borderRadius: '9999px',
                                    cursor: 'pointer',
                                    backgroundColor: timeFrame === period ? '#FFFFFF' : 'transparent',
                                    boxShadow: timeFrame === period ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    color: timeFrame === period ? '#0F172A' : '#64748B',
                                    fontWeight: timeFrame === period ? 600 : 500,
                                    fontSize: '12px',
                                    transition: 'all 0.2s',
                                    fontFamily: "'Inter', sans-serif",
                                    '&:hover': {
                                        backgroundColor: timeFrame === period ? '#FFFFFF' : '#E2E8F0'
                                    }
                                }}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Grid de cards de estatisticas */}
                <Grid container spacing={1.5}>
                    {/* Atendimentos */}
                    <Grid item xs={6}>
                        <StatCard
                            title={`Atendimentos ${timeFrame}`}
                            value={getAppointmentValue()}
                            color="#2563EB"
                            icon={EventNoteOutlinedIcon}
                            loading={loading}
                        />
                    </Grid>

                    {/* Total de Pacientes */}
                    <Grid item xs={6}>
                        <StatCard
                            title="Total Pacientes"
                            value={metrics?.totalPatients || 0}
                            color="#059669"
                            icon={PersonOutlineIcon}
                            trend={metrics?.patientsGrowth}
                            trendType="up"
                            loading={loading}
                        />
                    </Grid>

                    {/* Receitas do Mes */}
                    <Grid item xs={6}>
                        <StatCard
                            title="Receitas do Mes"
                            value={metrics?.monthlyPrescriptions || 0}
                            color="#D97706"
                            icon={DescriptionOutlinedIcon}
                            loading={loading}
                        />
                    </Grid>

                    {/* Taxa de Recorrencia */}
                    <Grid item xs={6}>
                        <StatCard
                            title="Taxa Recorrencia"
                            value={`${metrics?.recurringRate || 0}%`}
                            color="#7C3AED"
                            icon={PeopleOutlineIcon}
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                {/* Card de Programa de Indicacao */}
                <Card
                    elevation={0}
                    sx={{
                        mt: 2,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: 'white',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Elementos decorativos */}
                    <Box sx={{
                        position: 'absolute',
                        top: -25,
                        right: -25,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        backgroundColor: alpha('#fff', 0.1)
                    }} />

                    <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <PeopleOutlineIcon sx={{ width: 18, height: 18, color: '#FFFFFF' }} />
                            </Box>
                            <Box>
                                <Typography sx={{
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    Programa de Indicacao
                                </Typography>
                                <Typography sx={{
                                    fontWeight: 400,
                                    fontSize: '11px',
                                    opacity: 0.9,
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    3 indicacoes = 1 mes gratis!
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
