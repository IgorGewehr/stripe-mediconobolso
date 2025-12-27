'use client';

/**
 * @fileoverview ClinicSecretaryList Component
 * @description List of clinic secretaries with management actions
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
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
} from '@mui/material';
import {
    PersonAdd,
    MoreVert,
    Edit,
    Block,
    Restore,
    Security,
    People,
    Person,
} from '@mui/icons-material';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';
import ClinicSecretaryDialog from './ClinicSecretaryDialog';
import clinicService from '@/lib/services/api/clinic.service';

/**
 * Get scope label
 */
function getScopeLabel(scopeType, doctorCount = 0) {
    switch (scopeType) {
        case 'all_doctors':
            return 'Todos os médicos';
        case 'specific_doctors':
            return `${doctorCount} médico${doctorCount !== 1 ? 's' : ''}`;
        case 'single_doctor':
            return 'Médico único';
        default:
            return scopeType;
    }
}

/**
 * Get scope icon
 */
function getScopeIcon(scopeType) {
    switch (scopeType) {
        case 'all_doctors':
            return <People fontSize="small" />;
        case 'specific_doctors':
            return <People fontSize="small" />;
        case 'single_doctor':
            return <Person fontSize="small" />;
        default:
            return <Person fontSize="small" />;
    }
}

/**
 * SecretaryCard - Individual secretary card
 */
function SecretaryCard({ secretary, onEdit, onDeactivate, onReactivate, canManage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const isActive = secretary.active !== false;
    const scopeDoctorCount = secretary.scopeDoctors?.length || 0;
    const permissions = secretary.permissions || {};

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
        <Card
            sx={{
                opacity: isActive ? 1 : 0.6,
                borderLeft: 4,
                borderColor: isActive ? 'success.main' : 'grey.400',
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.light', width: 48, height: 48 }}>
                        {secretary.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                {secretary.name}
                            </Typography>
                            {!isActive && (
                                <Chip size="small" label="Inativa" color="default" />
                            )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {secretary.email}
                            {secretary.phone && ` | ${secretary.phone}`}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Scope chip */}
                            <Tooltip title={`Escopo de acesso: ${getScopeLabel(secretary.scopeType, scopeDoctorCount)}`}>
                                <Chip
                                    size="small"
                                    icon={getScopeIcon(secretary.scopeType)}
                                    label={getScopeLabel(secretary.scopeType, scopeDoctorCount)}
                                    color={secretary.scopeType === 'all_doctors' ? 'primary' : 'default'}
                                    variant="outlined"
                                />
                            </Tooltip>

                            {/* Permission summary */}
                            {getPermissionSummary().map((perm) => (
                                <Chip
                                    key={perm}
                                    size="small"
                                    label={perm}
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                />
                            ))}

                            {/* Login info */}
                            {secretary.lastLoginAt && (
                                <Typography variant="caption" color="text.secondary">
                                    Último login: {new Date(secretary.lastLoginAt).toLocaleDateString('pt-BR')}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {canManage && (
                        <>
                            <IconButton onClick={handleMenuClick}>
                                <MoreVert />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={() => {
                                    handleMenuClose();
                                    onEdit?.(secretary);
                                }}>
                                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                                    <ListItemText>Editar</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    handleMenuClose();
                                    onEdit?.(secretary);
                                }}>
                                    <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                                    <ListItemText>Permissões</ListItemText>
                                </MenuItem>
                                {isActive ? (
                                    <MenuItem onClick={() => {
                                        handleMenuClose();
                                        onDeactivate?.(secretary);
                                    }}>
                                        <ListItemIcon><Block fontSize="small" /></ListItemIcon>
                                        <ListItemText>Desativar</ListItemText>
                                    </MenuItem>
                                ) : (
                                    <MenuItem onClick={() => {
                                        handleMenuClose();
                                        onReactivate?.(secretary);
                                    }}>
                                        <ListItemIcon><Restore fontSize="small" /></ListItemIcon>
                                        <ListItemText>Reativar</ListItemText>
                                    </MenuItem>
                                )}
                            </Menu>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * ClinicSecretaryList - Main component
 */
export function ClinicSecretaryList() {
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
            const data = await clinicService.listClinicSecretaries();
            setSecretaries(data || []);
        } catch (err) {
            console.error('Error fetching secretaries:', err);
            setError(err.message || 'Erro ao carregar secretárias');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecretaries();
    }, [fetchSecretaries]);

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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Secretárias da Clínica ({secretaries.length})
                </Typography>
                {canManage && (
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => {
                            setSelectedSecretary(null);
                            setDialogOpen(true);
                        }}
                    >
                        Nova Secretária
                    </Button>
                )}
            </Box>

            {/* List */}
            {secretaries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Nenhuma secretária cadastrada na clínica.
                    </Typography>
                    {canManage && (
                        <Button
                            variant="outlined"
                            startIcon={<PersonAdd />}
                            onClick={() => {
                                setSelectedSecretary(null);
                                setDialogOpen(true);
                            }}
                        >
                            Cadastrar Primeira Secretária
                        </Button>
                    )}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {secretaries.map((secretary) => (
                        <SecretaryCard
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
