'use client';

/**
 * @fileoverview ClinicSecretaryList Component
 * @description List of clinic secretaries with management actions
 * @design Inspired by modern clinic management patterns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Alert,
    Tooltip,
    Paper,
    Divider,
    alpha,
} from '@mui/material';
import {
    PersonAdd,
    MoreHoriz,
    Edit,
    Block,
    Restore,
    Security,
    People,
    Person,
    Email as EmailIcon,
    EventNote as CalendarIcon,
} from '@mui/icons-material';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';
import ClinicSecretaryDialog from './ClinicSecretaryDialog';
import clinicService from '@/lib/services/api/clinic.service';

// Theme colors
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    purple: '#8B5CF6',
    purpleLight: '#F3E8FF',
    success: '#0CAF60',
    successLight: '#E6F7EF',
    error: '#FF4B55',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

/**
 * Get scope label
 */
function getScopeLabel(scopeType, doctorCount = 0) {
    switch (scopeType) {
        case 'all_doctors':
            return 'Todos os medicos';
        case 'specific_doctors':
            return `${doctorCount} medico${doctorCount !== 1 ? 's' : ''}`;
        case 'single_doctor':
            return 'Medico unico';
        default:
            return scopeType;
    }
}

/**
 * Get scope color
 */
function getScopeColor(scopeType) {
    switch (scopeType) {
        case 'all_doctors':
            return { bg: '#E9EFFF', text: '#1852FE' };
        case 'specific_doctors':
            return { bg: '#F3E8FF', text: '#8B5CF6' };
        case 'single_doctor':
            return { bg: '#E0F2FE', text: '#0284C7' };
        default:
            return { bg: '#F1F5F9', text: '#64748B' };
    }
}

/**
 * SecretaryRow - Modern secretary row component
 */
function SecretaryRow({ secretary, onEdit, onDeactivate, onReactivate, canManage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const isActive = secretary.active !== false;
    const scopeDoctorCount = secretary.scopeDoctors?.length || secretary.scope_doctors?.length || 0;
    const scopeType = secretary.scopeType || secretary.scope_type || 'all_doctors';
    const permissions = secretary.permissions || {};
    const scopeColors = getScopeColor(scopeType);

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
    };

    // Count active permissions
    const getPermissionSummary = () => {
        const modules = [];
        if (permissions.patients?.read) modules.push('Pacientes');
        if (permissions.appointments?.write) modules.push('Agenda');
        if (permissions.conversations?.write) modules.push('Conversas');
        if (permissions.financial?.read) modules.push('Financeiro');
        return modules.slice(0, 3);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                mb: 1.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                opacity: isActive ? 1 : 0.7,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: alpha(themeColors.purple, 0.3),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(themeColors.purple, 0.1),
                        color: themeColors.purple,
                        fontWeight: 600,
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    {getInitials(secretary.name)}
                </Avatar>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            {secretary.name}
                        </Typography>
                        {!isActive && (
                            <Chip
                                size="small"
                                label="Inativa"
                                sx={{ height: 20, fontSize: 11, bgcolor: '#F1F5F9', color: '#64748B' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                Secretaria
                            </Typography>
                        </Box>
                        <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {secretary.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Tooltip title={`Escopo de acesso: ${getScopeLabel(scopeType, scopeDoctorCount)}`}>
                        <Chip
                            size="small"
                            icon={scopeType === 'single_doctor' ? <Person sx={{ fontSize: 16 }} /> : <People sx={{ fontSize: 16 }} />}
                            label={getScopeLabel(scopeType, scopeDoctorCount)}
                            sx={{
                                bgcolor: scopeColors.bg,
                                color: scopeColors.text,
                                fontWeight: 500,
                                border: 'none',
                                height: 24,
                                '& .MuiChip-icon': { color: scopeColors.text },
                            }}
                        />
                    </Tooltip>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {getPermissionSummary().map((perm) => (
                            <Chip
                                key={perm}
                                size="small"
                                label={perm}
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
                            />
                        ))}
                    </Box>
                </Box>

                {canManage && (
                    <>
                        <IconButton
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                color: themeColors.textTertiary,
                                '&:hover': { color: themeColors.purple },
                            }}
                        >
                            <MoreHoriz />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={() => setAnchorEl(null)}
                            PaperProps={{
                                sx: { borderRadius: '12px', minWidth: 180 },
                            }}
                        >
                            <MenuItem onClick={() => {
                                setAnchorEl(null);
                                onEdit?.(secretary);
                            }}>
                                <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                                <ListItemText>Editar</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => {
                                setAnchorEl(null);
                                onEdit?.(secretary);
                            }}>
                                <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                                <ListItemText>Permissoes</ListItemText>
                            </MenuItem>
                            <Divider />
                            {isActive ? (
                                <MenuItem
                                    onClick={() => {
                                        setAnchorEl(null);
                                        onDeactivate?.(secretary);
                                    }}
                                    sx={{ color: themeColors.error }}
                                >
                                    <ListItemIcon><Block fontSize="small" sx={{ color: themeColors.error }} /></ListItemIcon>
                                    <ListItemText>Desativar</ListItemText>
                                </MenuItem>
                            ) : (
                                <MenuItem
                                    onClick={() => {
                                        setAnchorEl(null);
                                        onReactivate?.(secretary);
                                    }}
                                    sx={{ color: themeColors.success }}
                                >
                                    <ListItemIcon><Restore fontSize="small" sx={{ color: themeColors.success }} /></ListItemIcon>
                                    <ListItemText>Reativar</ListItemText>
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                )}
            </Box>
        </Paper>
    );
}

/**
 * Empty State component
 */
function EmptyState({ searchQuery, onAdd, canManage }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: themeColors.backgroundSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                }}
            >
                <People sx={{ fontSize: 32, color: themeColors.textTertiary }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                {searchQuery ? 'Nenhuma secretaria encontrada' : 'Nenhuma secretaria cadastrada'}
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                {searchQuery
                    ? 'Nao encontramos secretarias com esse nome. Tente buscar diferente.'
                    : 'Sua clinica ainda nao tem secretarias. Adicione membros a sua equipe de suporte.'}
            </Typography>
            {!searchQuery && canManage && onAdd && (
                <Button
                    variant="text"
                    color="primary"
                    onClick={onAdd}
                    sx={{ mt: 2, textTransform: 'none' }}
                >
                    Adicionar Secretaria
                </Button>
            )}
        </Box>
    );
}

/**
 * ClinicSecretaryList - Main component
 */
export function ClinicSecretaryList({ searchQuery = '' }) {
    const { isClinicAdmin, isClinicOwner, canManageSecretaries } = useClinicPermissions();

    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSecretary, setSelectedSecretary] = useState(null);

    const canManage = isClinicAdmin || isClinicOwner || canManageSecretaries;

    const fetchSecretaries = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await clinicService.listClinicSecretaries({ activeOnly: false });
            setSecretaries(data || []);
        } catch (err) {
            console.error('Error fetching secretaries:', err);
            setError(err.message || 'Erro ao carregar secretarias');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecretaries();
    }, [fetchSecretaries]);

    // Filter secretaries based on search query
    const filteredSecretaries = useMemo(() => {
        if (!searchQuery) return secretaries;
        const query = searchQuery.toLowerCase();
        return secretaries.filter(s =>
            s.name?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query)
        );
    }, [secretaries, searchQuery]);

    const handleEdit = (secretary) => {
        setSelectedSecretary(secretary);
        setDialogOpen(true);
    };

    const handleDeactivate = async (secretary) => {
        try {
            await clinicService.deactivateClinicSecretary(secretary.id);
            fetchSecretaries();
        } catch (err) {
            console.error('Error deactivating secretary:', err);
        }
    };

    const handleReactivate = async (secretary) => {
        try {
            await clinicService.reactivateClinicSecretary(secretary.id);
            fetchSecretaries();
        } catch (err) {
            console.error('Error reactivating secretary:', err);
        }
    };

    const handleDialogSuccess = () => {
        setDialogOpen(false);
        setSelectedSecretary(null);
        fetchSecretaries();
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedSecretary(null);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            {/* List */}
            {filteredSecretaries.length === 0 ? (
                <EmptyState
                    searchQuery={searchQuery}
                    canManage={canManage}
                    onAdd={() => {
                        setSelectedSecretary(null);
                        setDialogOpen(true);
                    }}
                />
            ) : (
                <Box>
                    {filteredSecretaries.map((secretary) => (
                        <SecretaryRow
                            key={secretary.id}
                            secretary={secretary}
                            canManage={canManage}
                            onEdit={handleEdit}
                            onDeactivate={handleDeactivate}
                            onReactivate={handleReactivate}
                        />
                    ))}
                </Box>
            )}

            {/* Dialog */}
            <ClinicSecretaryDialog
                open={dialogOpen}
                secretary={selectedSecretary}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />
        </Box>
    );
}

export default ClinicSecretaryList;
