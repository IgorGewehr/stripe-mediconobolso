"use client";

import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    alpha,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Shield as ShieldIcon,
    Verified as VerifiedIcon,
    AdminPanelSettings as AdminIcon,
    Tune as TuneIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';

// Configuração dos presets
const PERMISSION_PRESETS = {
    basic: {
        id: 'basic',
        name: 'Recepcionista',
        icon: ShieldIcon,
        color: '#3B82F6',
        description: 'Acesso essencial para recepção e agendamento',
        modules: ['Pacientes (ver)', 'Agenda (completo)'],
        permissions: {
            patients: { read: true, create: true, write: false, viewDetails: false },
            appointments: { read: true, write: true },
            prescriptions: { read: false, write: false },
            exams: { read: false, write: false },
            notes: { read: false, write: false },
            financial: { read: false, write: false },
            reports: { read: false, write: false }
        }
    },
    standard: {
        id: 'standard',
        name: 'Assistente',
        icon: VerifiedIcon,
        color: '#10B981',
        description: 'Acesso para operações do dia-a-dia',
        modules: ['Pacientes', 'Agenda', 'Receitas (ver)', 'Exames (ver)', 'Notas (ver)'],
        permissions: {
            patients: { read: true, create: true, write: false, viewDetails: false },
            appointments: { read: true, write: true },
            prescriptions: { read: true, write: false },
            exams: { read: true, write: false },
            notes: { read: true, write: false },
            financial: { read: false, write: false },
            reports: { read: true, write: false }
        }
    },
    advanced: {
        id: 'advanced',
        name: 'Secretária Sênior',
        icon: AdminIcon,
        color: '#8B5CF6',
        description: 'Acesso amplo com edição na maioria dos módulos',
        modules: ['Pacientes (completo)', 'Agenda', 'Receitas', 'Exames', 'Notas', 'Relatórios'],
        permissions: {
            patients: { read: true, create: true, write: true, viewDetails: true },
            appointments: { read: true, write: true },
            prescriptions: { read: true, write: true },
            exams: { read: true, write: true },
            notes: { read: true, write: true },
            financial: { read: false, write: false },
            reports: { read: true, write: true }
        }
    },
    custom: {
        id: 'custom',
        name: 'Personalizado',
        icon: TuneIcon,
        color: '#F59E0B',
        description: 'Configure cada permissão manualmente',
        modules: ['Você define'],
        permissions: null // Será definido pelo usuário
    }
};

const PresetCard = ({ preset, selected, onClick, disabled }) => {
    const IconComponent = preset.icon;
    const isSelected = selected === preset.id;

    return (
        <Card
            onClick={() => !disabled && onClick(preset.id)}
            sx={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: '2px solid',
                borderColor: isSelected ? preset.color : 'transparent',
                backgroundColor: isSelected ? alpha(preset.color, 0.04) : '#FFFFFF',
                borderRadius: '16px',
                transition: 'all 0.2s ease-in-out',
                opacity: disabled ? 0.6 : 1,
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: disabled ? 'none' : 'translateY(-2px)',
                    boxShadow: disabled ? 'none' : `0 8px 24px ${alpha(preset.color, 0.15)}`,
                    borderColor: disabled ? 'transparent' : alpha(preset.color, 0.5)
                }
            }}
        >
            {isSelected && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: preset.color,
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 2px 8px ${alpha(preset.color, 0.4)}`
                    }}
                >
                    <CheckIcon sx={{ color: '#FFF', fontSize: 16 }} />
                </Box>
            )}

            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            backgroundColor: alpha(preset.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <IconComponent sx={{ color: preset.color, fontSize: 24 }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                color: '#111E5A',
                                fontFamily: 'Gellix, sans-serif',
                                mb: 0.5
                            }}
                        >
                            {preset.name}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748B',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px',
                                lineHeight: 1.4,
                                mb: 1.5
                            }}
                        >
                            {preset.description}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {preset.modules.slice(0, 3).map((module, idx) => (
                                <Chip
                                    key={idx}
                                    label={module}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        backgroundColor: alpha(preset.color, 0.1),
                                        color: preset.color,
                                        '& .MuiChip-label': { px: 1 }
                                    }}
                                />
                            ))}
                            {preset.modules.length > 3 && (
                                <Tooltip title={preset.modules.slice(3).join(', ')}>
                                    <Chip
                                        label={`+${preset.modules.length - 3}`}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            backgroundColor: alpha(preset.color, 0.1),
                                            color: preset.color,
                                            '& .MuiChip-label': { px: 1 }
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const PermissionPresetSelector = ({
    selected,
    onChange,
    disabled = false,
    showCustom = true
}) => {
    const presets = showCustom
        ? Object.values(PERMISSION_PRESETS)
        : Object.values(PERMISSION_PRESETS).filter(p => p.id !== 'custom');

    const handleSelect = (presetId) => {
        const preset = PERMISSION_PRESETS[presetId];
        onChange(presetId, preset.permissions);
    };

    return (
        <Box>
            <Typography
                variant="subtitle2"
                sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: '#111E5A',
                    fontFamily: 'Gellix, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <ShieldIcon sx={{ fontSize: 20, color: '#1852FE' }} />
                Escolha um perfil de acesso
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(4, 1fr)'
                    },
                    gap: 2
                }}
            >
                {presets.map((preset) => (
                    <PresetCard
                        key={preset.id}
                        preset={preset}
                        selected={selected}
                        onClick={handleSelect}
                        disabled={disabled}
                    />
                ))}
            </Box>
        </Box>
    );
};

export { PERMISSION_PRESETS };
export default PermissionPresetSelector;
