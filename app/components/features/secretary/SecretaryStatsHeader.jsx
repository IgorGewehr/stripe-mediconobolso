"use client";

import React from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Chip,
    alpha,
    Tooltip
} from '@mui/material';
import {
    People as PeopleIcon,
    CheckCircle as ActiveIcon,
    Block as InactiveIcon,
    Login as LoginIcon,
    TrendingUp as TrendingIcon,
    Star as StarIcon
} from '@mui/icons-material';

const StatBox = ({ icon: Icon, label, value, color, tooltip }) => (
    <Tooltip title={tooltip || ''} arrow>
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: alpha(color, 0.05),
                border: '1px solid',
                borderColor: alpha(color, 0.1),
                minWidth: 120,
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: alpha(color, 0.08),
                    transform: 'translateY(-1px)'
                }
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: alpha(color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Icon sx={{ fontSize: 18, color: color }} />
            </Box>
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: '#111E5A',
                        fontFamily: 'Gellix, sans-serif',
                        fontSize: '18px',
                        lineHeight: 1
                    }}
                >
                    {value}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#64748B',
                        fontFamily: 'Gellix, sans-serif',
                        fontSize: '11px'
                    }}
                >
                    {label}
                </Typography>
            </Box>
        </Box>
    </Tooltip>
);

const SecretaryStatsHeader = ({
    stats,
    planLimits,
    loading = false
}) => {
    const usagePercentage = planLimits?.max > 0
        ? Math.round((planLimits.current / planLimits.max) * 100)
        : 0;

    const getUsageColor = () => {
        if (usagePercentage >= 100) return '#EF4444';
        if (usagePercentage >= 80) return '#F59E0B';
        return '#10B981';
    };

    const getPlanIcon = () => {
        switch (planLimits?.planName) {
            case 'Administrador': return '👨‍💼';
            case 'Pago': return '⭐';
            default: return '🆓';
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    p: 3,
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAECEF'
                }}
            >
                <LinearProgress sx={{ borderRadius: '4px' }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 3,
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAECEF',
                mb: 3
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1852FE 0%, #3B82F6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(24, 82, 254, 0.25)'
                        }}
                    >
                        <PeopleIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: '#111E5A',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '16px'
                            }}
                        >
                            Equipe de Secretárias
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748B',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px'
                            }}
                        >
                            Gerencie sua equipe de apoio
                        </Typography>
                    </Box>
                </Box>

                <Chip
                    icon={<span style={{ fontSize: '14px' }}>{getPlanIcon()}</span>}
                    label={`Plano ${planLimits?.planName || 'Gratuito'}`}
                    sx={{
                        backgroundColor: alpha('#1852FE', 0.1),
                        color: '#1852FE',
                        fontWeight: 600,
                        fontSize: '12px',
                        height: 28,
                        '& .MuiChip-label': { px: 1 }
                    }}
                />
            </Box>

            {/* Stats Grid */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 3
                }}
            >
                <StatBox
                    icon={PeopleIcon}
                    label="Total"
                    value={stats?.total || 0}
                    color="#3B82F6"
                    tooltip="Total de secretárias cadastradas"
                />
                <StatBox
                    icon={ActiveIcon}
                    label="Ativas"
                    value={stats?.active || 0}
                    color="#10B981"
                    tooltip="Secretárias com acesso ativo"
                />
                <StatBox
                    icon={InactiveIcon}
                    label="Inativas"
                    value={stats?.inactive || 0}
                    color="#64748B"
                    tooltip="Secretárias com acesso desativado"
                />
                <StatBox
                    icon={LoginIcon}
                    label="Logins"
                    value={stats?.totalLogins || 0}
                    color="#8B5CF6"
                    tooltip="Total de acessos de todas as secretárias"
                />
            </Box>

            {/* Usage Bar */}
            <Box
                sx={{
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #EAECEF'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            color: '#64748B',
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '13px'
                        }}
                    >
                        Uso do limite de secretárias
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: getUsageColor(),
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '13px'
                        }}
                    >
                        {planLimits?.current || 0} / {planLimits?.max || 1}
                    </Typography>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={Math.min(usagePercentage, 100)}
                    sx={{
                        height: 8,
                        borderRadius: '4px',
                        backgroundColor: alpha(getUsageColor(), 0.15),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: '4px',
                            backgroundColor: getUsageColor()
                        }
                    }}
                />

                {usagePercentage >= 100 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: '8px',
                            backgroundColor: alpha('#F59E0B', 0.1)
                        }}
                    >
                        <TrendingIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#92400E',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '12px'
                            }}
                        >
                            Limite atingido! Faça upgrade para adicionar mais secretárias.
                        </Typography>
                    </Box>
                )}

                {planLimits?.remaining > 0 && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mt: 1,
                            color: '#64748B',
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '11px'
                        }}
                    >
                        Você ainda pode adicionar {planLimits.remaining} secretária{planLimits.remaining > 1 ? 's' : ''}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default SecretaryStatsHeader;
