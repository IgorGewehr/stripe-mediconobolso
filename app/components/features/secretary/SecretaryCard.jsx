"use client";

import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    alpha,
    Button
} from '@mui/material';
import {
    CheckCircle as ActiveIcon,
    Block as InactiveIcon,
    Edit as EditIcon,
    PowerSettingsNew as PowerIcon,
    Login as LoginIcon,
    AccessTime as TimeIcon,
    People as PeopleIcon,
    CalendarMonth as CalendarIcon,
    Medication as MedicationIcon,
    Science as ScienceIcon,
    Description as DescriptionIcon,
    AttachMoney as MoneyIcon,
    Assessment as ReportsIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';

// Mapeamento de módulos para ícones
const MODULE_ICONS = {
    patients: { icon: PeopleIcon, color: '#3B82F6' },
    appointments: { icon: CalendarIcon, color: '#10B981' },
    prescriptions: { icon: MedicationIcon, color: '#F59E0B' },
    exams: { icon: ScienceIcon, color: '#8B5CF6' },
    notes: { icon: DescriptionIcon, color: '#06B6D4' },
    financial: { icon: MoneyIcon, color: '#EF4444' },
    reports: { icon: ReportsIcon, color: '#7C3AED' }
};

// Gera cor baseada no nome
const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899'];
    return colors[Math.abs(hash) % colors.length];
};

// Formata data relativa
const formatRelativeDate = (date) => {
    if (!date) return 'Nunca';

    const now = new Date();
    const targetDate = date.toDate ? date.toDate() : new Date(date);
    const diffMs = now - targetDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Conta permissões ativas
const countActivePermissions = (permissions) => {
    if (!permissions) return { active: 0, modules: [] };

    const activeModules = [];
    Object.entries(permissions).forEach(([module, actions]) => {
        const hasAnyPermission = Object.values(actions).some(Boolean);
        if (hasAnyPermission) activeModules.push(module);
    });

    return { active: activeModules.length, modules: activeModules };
};

const PermissionBadge = ({ module }) => {
    const config = MODULE_ICONS[module];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
        <Tooltip title={module.charAt(0).toUpperCase() + module.slice(1)}>
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    backgroundColor: alpha(config.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                        transform: 'scale(1.1)'
                    }
                }}
            >
                <IconComponent sx={{ fontSize: 16, color: config.color }} />
            </Box>
        </Tooltip>
    );
};

const SecretaryCard = ({
    secretary,
    onEditPermissions,
    onToggleStatus,
    compact = false
}) => {
    const avatarColor = useMemo(() => stringToColor(secretary.name || ''), [secretary.name]);
    const permissionStats = useMemo(() => countActivePermissions(secretary.permissions), [secretary.permissions]);
    const lastLoginFormatted = useMemo(() => formatRelativeDate(secretary.lastLogin), [secretary.lastLogin]);

    if (compact) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid',
                    borderColor: secretary.active ? alpha('#10B981', 0.3) : '#EAECEF',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: avatarColor,
                            fontSize: '16px',
                            fontWeight: 600
                        }}
                    >
                        {secretary.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: '#111E5A', fontFamily: 'Gellix, sans-serif' }}
                        >
                            {secretary.name}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: '#64748B', fontFamily: 'Gellix, sans-serif' }}
                        >
                            {secretary.email}
                        </Typography>
                    </Box>
                </Box>

                <Chip
                    icon={secretary.active ? <ActiveIcon sx={{ fontSize: '14px !important' }} /> : <InactiveIcon sx={{ fontSize: '14px !important' }} />}
                    label={secretary.active ? 'Ativa' : 'Inativa'}
                    size="small"
                    sx={{
                        backgroundColor: secretary.active ? alpha('#10B981', 0.1) : alpha('#64748B', 0.1),
                        color: secretary.active ? '#10B981' : '#64748B',
                        fontWeight: 600,
                        fontSize: '12px',
                        '& .MuiChip-icon': {
                            color: secretary.active ? '#10B981' : '#64748B'
                        }
                    }}
                />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid',
                borderColor: secretary.active ? alpha('#10B981', 0.2) : '#EAECEF',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            {/* Header com gradiente sutil */}
            <Box
                sx={{
                    p: 2.5,
                    background: secretary.active
                        ? `linear-gradient(135deg, ${alpha('#10B981', 0.05)} 0%, ${alpha('#10B981', 0.02)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#64748B', 0.05)} 0%, ${alpha('#64748B', 0.02)} 100%)`,
                    borderBottom: '1px solid',
                    borderColor: '#EAECEF'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                width: 52,
                                height: 52,
                                backgroundColor: avatarColor,
                                fontSize: '20px',
                                fontWeight: 600,
                                boxShadow: `0 4px 12px ${alpha(avatarColor, 0.3)}`
                            }}
                        >
                            {secretary.name?.charAt(0)?.toUpperCase()}
                        </Avatar>

                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#111E5A',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '16px'
                                    }}
                                >
                                    {secretary.name}
                                </Typography>
                                <Chip
                                    icon={secretary.active
                                        ? <ActiveIcon sx={{ fontSize: '12px !important' }} />
                                        : <InactiveIcon sx={{ fontSize: '12px !important' }} />
                                    }
                                    label={secretary.active ? 'Ativa' : 'Inativa'}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        backgroundColor: secretary.active ? alpha('#10B981', 0.1) : alpha('#64748B', 0.1),
                                        color: secretary.active ? '#10B981' : '#64748B',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        '& .MuiChip-icon': {
                                            color: secretary.active ? '#10B981' : '#64748B'
                                        }
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#64748B',
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '13px'
                                }}
                            >
                                {secretary.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Estatísticas */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    p: 2,
                    backgroundColor: '#FAFBFC'
                }}
            >
                <Tooltip title="Total de acessos">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LoginIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748B',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px'
                            }}
                        >
                            <strong style={{ color: '#111E5A' }}>{secretary.loginCount || 0}</strong> logins
                        </Typography>
                    </Box>
                </Tooltip>

                <Tooltip title="Último acesso">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <TimeIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748B',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px'
                            }}
                        >
                            {lastLoginFormatted}
                        </Typography>
                    </Box>
                </Tooltip>
            </Box>

            {/* Permissões */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: '#EAECEF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#64748B',
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '11px'
                        }}
                    >
                        Permissões ({permissionStats.active}/7 módulos)
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {permissionStats.modules.length > 0 ? (
                        permissionStats.modules.map(module => (
                            <PermissionBadge key={module} module={module} />
                        ))
                    ) : (
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#94A3B8',
                                fontStyle: 'italic',
                                fontFamily: 'Gellix, sans-serif'
                            }}
                        >
                            Nenhuma permissão ativa
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Ações */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    p: 2,
                    pt: 0
                }}
            >
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    onClick={() => onEditPermissions(secretary)}
                    sx={{
                        flex: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontFamily: 'Gellix, sans-serif',
                        fontWeight: 500,
                        fontSize: '13px',
                        borderColor: '#EAECEF',
                        color: '#64748B',
                        '&:hover': {
                            borderColor: '#1852FE',
                            color: '#1852FE',
                            backgroundColor: alpha('#1852FE', 0.04)
                        }
                    }}
                >
                    Permissões
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PowerIcon sx={{ fontSize: 16 }} />}
                    onClick={() => onToggleStatus(secretary)}
                    sx={{
                        flex: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontFamily: 'Gellix, sans-serif',
                        fontWeight: 500,
                        fontSize: '13px',
                        borderColor: secretary.active ? alpha('#EF4444', 0.3) : alpha('#10B981', 0.3),
                        color: secretary.active ? '#EF4444' : '#10B981',
                        '&:hover': {
                            borderColor: secretary.active ? '#EF4444' : '#10B981',
                            backgroundColor: secretary.active ? alpha('#EF4444', 0.04) : alpha('#10B981', 0.04)
                        }
                    }}
                >
                    {secretary.active ? 'Desativar' : 'Reativar'}
                </Button>
            </Box>
        </Box>
    );
};

export default SecretaryCard;
