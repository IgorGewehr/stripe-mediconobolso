"use client";

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    alpha,
    Tooltip,
    IconButton,
    Collapse
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    People as PeopleIcon,
    CalendarMonth as CalendarIcon,
    Medication as MedicationIcon,
    Science as ScienceIcon,
    Description as DescriptionIcon,
    AttachMoney as MoneyIcon,
    Assessment as ReportsIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Add as AddIcon,
    VisibilityOff as SensitiveIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

// Configuração dos módulos com categorias
const MODULE_CONFIG = {
    // Essenciais
    patients: {
        name: 'Pacientes',
        icon: PeopleIcon,
        color: '#3B82F6',
        category: 'essential',
        categoryName: 'Essenciais',
        description: 'Gerenciamento de pacientes',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver lista de pacientes' },
            create: { label: 'Criar', icon: AddIcon, description: 'Cadastrar novos pacientes' },
            write: { label: 'Editar', icon: EditIcon, description: 'Modificar dados de pacientes' },
            viewDetails: { label: 'Dados Sensíveis', icon: SensitiveIcon, description: 'Ver histórico médico completo', sensitive: true }
        }
    },
    appointments: {
        name: 'Agenda',
        icon: CalendarIcon,
        color: '#10B981',
        category: 'essential',
        categoryName: 'Essenciais',
        description: 'Agendamento de consultas',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver agenda e consultas' },
            write: { label: 'Gerenciar', icon: EditIcon, description: 'Agendar e editar consultas' }
        }
    },
    // Clínicos
    prescriptions: {
        name: 'Receitas',
        icon: MedicationIcon,
        color: '#F59E0B',
        category: 'clinical',
        categoryName: 'Clínicos',
        description: 'Receitas médicas',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver receitas emitidas' },
            write: { label: 'Gerenciar', icon: EditIcon, description: 'Criar e editar receitas', sensitive: true }
        }
    },
    exams: {
        name: 'Exames',
        icon: ScienceIcon,
        color: '#8B5CF6',
        category: 'clinical',
        categoryName: 'Clínicos',
        description: 'Exames e resultados',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver exames e resultados' },
            write: { label: 'Gerenciar', icon: EditIcon, description: 'Cadastrar e editar exames' }
        }
    },
    notes: {
        name: 'Notas',
        icon: DescriptionIcon,
        color: '#06B6D4',
        category: 'clinical',
        categoryName: 'Clínicos',
        description: 'Anotações médicas',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver anotações' },
            write: { label: 'Gerenciar', icon: EditIcon, description: 'Criar e editar notas' }
        }
    },
    // Administrativos
    financial: {
        name: 'Financeiro',
        icon: MoneyIcon,
        color: '#EF4444',
        category: 'admin',
        categoryName: 'Administrativos',
        description: 'Dados financeiros',
        sensitive: true,
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver relatórios financeiros', sensitive: true },
            write: { label: 'Gerenciar', icon: EditIcon, description: 'Modificar dados financeiros', sensitive: true }
        }
    },
    reports: {
        name: 'Relatórios',
        icon: ReportsIcon,
        color: '#7C3AED',
        category: 'admin',
        categoryName: 'Administrativos',
        description: 'Relatórios e estatísticas',
        actions: {
            read: { label: 'Visualizar', icon: ViewIcon, description: 'Ver relatórios gerados' },
            write: { label: 'Gerar', icon: AddIcon, description: 'Criar novos relatórios' }
        }
    }
};

const CATEGORIES = {
    essential: { name: 'Essenciais', color: '#3B82F6', description: 'Funções básicas do consultório' },
    clinical: { name: 'Clínicos', color: '#10B981', description: 'Documentos e registros médicos' },
    admin: { name: 'Administrativos', color: '#EF4444', description: 'Gestão e finanças' }
};

const ActionSwitch = ({ module, action, actionConfig, checked, onChange, disabled }) => {
    const ActionIcon = actionConfig.icon;

    return (
        <Tooltip title={actionConfig.description} arrow placement="top">
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: '10px',
                    backgroundColor: checked ? alpha(MODULE_CONFIG[module].color, 0.05) : '#F8F9FA',
                    border: '1px solid',
                    borderColor: checked ? alpha(MODULE_CONFIG[module].color, 0.2) : '#EAECEF',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActionIcon
                        sx={{
                            fontSize: 18,
                            color: checked ? MODULE_CONFIG[module].color : '#94A3B8'
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            color: checked ? '#111E5A' : '#64748B',
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '13px'
                        }}
                    >
                        {actionConfig.label}
                    </Typography>
                    {actionConfig.sensitive && (
                        <Chip
                            icon={<WarningIcon sx={{ fontSize: '12px !important' }} />}
                            label="Sensível"
                            size="small"
                            sx={{
                                height: 18,
                                fontSize: '10px',
                                backgroundColor: alpha('#EF4444', 0.1),
                                color: '#EF4444',
                                '& .MuiChip-icon': { color: '#EF4444' },
                                '& .MuiChip-label': { px: 0.5 }
                            }}
                        />
                    )}
                </Box>
                <Switch
                    checked={checked}
                    onChange={(e) => onChange(module, action, e.target.checked)}
                    disabled={disabled}
                    size="small"
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: MODULE_CONFIG[module].color
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: MODULE_CONFIG[module].color
                        }
                    }}
                />
            </Box>
        </Tooltip>
    );
};

const ModuleRow = ({ moduleKey, moduleConfig, permissions, onChange, disabled, expanded, onToggleExpand }) => {
    const IconComponent = moduleConfig.icon;
    const modulePermissions = permissions[moduleKey] || {};
    const activeCount = Object.values(modulePermissions).filter(Boolean).length;
    const totalCount = Object.keys(moduleConfig.actions).length;
    const allActive = activeCount === totalCount;

    const handleToggleAll = () => {
        const newValue = !allActive;
        Object.keys(moduleConfig.actions).forEach(action => {
            onChange(moduleKey, action, newValue);
        });
    };

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: expanded ? alpha(moduleConfig.color, 0.3) : '#EAECEF',
                borderRadius: '12px',
                overflow: 'hidden',
                mb: 1.5,
                transition: 'all 0.2s ease',
                backgroundColor: expanded ? alpha(moduleConfig.color, 0.02) : '#FFFFFF'
            }}
        >
            <Box
                onClick={() => onToggleExpand(moduleKey)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: alpha(moduleConfig.color, 0.04)
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            backgroundColor: alpha(moduleConfig.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <IconComponent sx={{ color: moduleConfig.color, fontSize: 22 }} />
                    </Box>

                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 600,
                                    color: '#111E5A',
                                    fontFamily: 'Gellix, sans-serif'
                                }}
                            >
                                {moduleConfig.name}
                            </Typography>
                            {moduleConfig.sensitive && (
                                <Chip
                                    icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                                    label="Restrito"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '10px',
                                        backgroundColor: alpha('#EF4444', 0.1),
                                        color: '#EF4444',
                                        '& .MuiChip-icon': { color: '#EF4444' }
                                    }}
                                />
                            )}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{ color: '#64748B', fontFamily: 'Gellix, sans-serif' }}
                        >
                            {moduleConfig.description}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={`${activeCount}/${totalCount}`}
                        size="small"
                        sx={{
                            height: 24,
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: activeCount > 0 ? alpha(moduleConfig.color, 0.1) : '#F1F5F9',
                            color: activeCount > 0 ? moduleConfig.color : '#94A3B8'
                        }}
                    />

                    <Tooltip title={allActive ? 'Desativar todos' : 'Ativar todos'}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAll();
                            }}
                            disabled={disabled}
                            sx={{
                                color: allActive ? moduleConfig.color : '#94A3B8',
                                backgroundColor: allActive ? alpha(moduleConfig.color, 0.1) : 'transparent'
                            }}
                        >
                            {allActive ? <UnlockIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <ExpandMoreIcon
                        sx={{
                            color: '#94A3B8',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }}
                    />
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ p: 2, pt: 0, borderTop: '1px solid', borderColor: '#EAECEF' }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                            gap: 1,
                            mt: 2
                        }}
                    >
                        {Object.entries(moduleConfig.actions).map(([action, actionConfig]) => (
                            <ActionSwitch
                                key={action}
                                module={moduleKey}
                                action={action}
                                actionConfig={actionConfig}
                                checked={modulePermissions[action] || false}
                                onChange={onChange}
                                disabled={disabled}
                            />
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

const PermissionMatrix = ({
    permissions,
    onChange,
    disabled = false,
    compact = false
}) => {
    const [expandedModules, setExpandedModules] = useState(compact ? [] : ['patients', 'appointments']);

    const handleToggleExpand = (moduleKey) => {
        setExpandedModules(prev =>
            prev.includes(moduleKey)
                ? prev.filter(m => m !== moduleKey)
                : [...prev, moduleKey]
        );
    };

    const modulesByCategory = useMemo(() => {
        return Object.entries(MODULE_CONFIG).reduce((acc, [key, config]) => {
            if (!acc[config.category]) {
                acc[config.category] = [];
            }
            acc[config.category].push({ key, ...config });
            return acc;
        }, {});
    }, []);

    const stats = useMemo(() => {
        let total = 0;
        let active = 0;
        Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
            Object.keys(config.actions).forEach(action => {
                total++;
                if (permissions[moduleKey]?.[action]) active++;
            });
        });
        return { total, active, percentage: Math.round((active / total) * 100) };
    }, [permissions]);

    return (
        <Box>
            {/* Header com estatísticas */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    p: 2,
                    backgroundColor: '#F8F9FA',
                    borderRadius: '12px'
                }}
            >
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            color: '#111E5A',
                            fontFamily: 'Gellix, sans-serif',
                            mb: 0.5
                        }}
                    >
                        Configuração de Permissões
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ color: '#64748B', fontFamily: 'Gellix, sans-serif' }}
                    >
                        Defina o que a secretária poderá acessar
                    </Typography>
                </Box>

                <Chip
                    label={`${stats.active}/${stats.total} ativas (${stats.percentage}%)`}
                    sx={{
                        backgroundColor: stats.percentage > 50 ? alpha('#10B981', 0.1) : alpha('#F59E0B', 0.1),
                        color: stats.percentage > 50 ? '#10B981' : '#F59E0B',
                        fontWeight: 600,
                        fontSize: '12px'
                    }}
                />
            </Box>

            {/* Módulos agrupados por categoria */}
            {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
                <Box key={categoryKey} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box
                            sx={{
                                width: 4,
                                height: 16,
                                borderRadius: '2px',
                                backgroundColor: category.color
                            }}
                        />
                        <Typography
                            variant="overline"
                            sx={{
                                fontWeight: 600,
                                color: '#64748B',
                                fontFamily: 'Gellix, sans-serif',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {category.name}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: '#94A3B8', fontFamily: 'Gellix, sans-serif' }}
                        >
                            — {category.description}
                        </Typography>
                    </Box>

                    {modulesByCategory[categoryKey]?.map(module => (
                        <ModuleRow
                            key={module.key}
                            moduleKey={module.key}
                            moduleConfig={module}
                            permissions={permissions}
                            onChange={onChange}
                            disabled={disabled}
                            expanded={expandedModules.includes(module.key)}
                            onToggleExpand={handleToggleExpand}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

export { MODULE_CONFIG, CATEGORIES };
export default PermissionMatrix;
