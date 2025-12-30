'use client';

/**
 * @fileoverview DoctorsList Component
 * @description List of doctors in a multi-doctor clinic with management actions
 * @design Inspired by modern clinic management patterns
 */

import { useState, useMemo } from 'react';
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
    Paper,
    Divider,
    alpha,
} from '@mui/material';
import {
    PersonAdd,
    MoreHoriz,
    Security,
    Block,
    Restore,
    LocalHospital as StethoscopeIcon,
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useClinicDoctors } from '../../hooks/useClinicDoctors';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';
import DoctorInviteDialog from './DoctorInviteDialog';
import DoctorPermissionsDialog from './DoctorPermissionsDialog';
import clinicService from '@/lib/services/api/clinic.service';

// Theme colors
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    success: '#0CAF60',
    successLight: '#E6F7EF',
    error: '#FF4B55',
    warning: '#FFAB2B',
    warningLight: '#FFF8E6',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

/**
 * Get color based on association type
 */
function getAssociationColor(type) {
    switch (type) {
        case 'owner':
            return { bg: '#E9EFFF', text: '#1852FE' };
        case 'partner':
            return { bg: '#F3E8FF', text: '#8B5CF6' };
        case 'employee':
            return { bg: '#E0F2FE', text: '#0284C7' };
        case 'contractor':
            return { bg: '#FFF8E6', text: '#F59E0B' };
        case 'guest':
            return { bg: '#F1F5F9', text: '#64748B' };
        default:
            return { bg: '#F1F5F9', text: '#64748B' };
    }
}

/**
 * Get label for association type
 */
function getAssociationLabel(type) {
    switch (type) {
        case 'owner':
            return 'Proprietario';
        case 'partner':
            return 'Socio';
        case 'employee':
            return 'Funcionario';
        case 'contractor':
            return 'Prestador';
        case 'guest':
            return 'Convidado';
        default:
            return type;
    }
}

/**
 * DoctorRow - Modern doctor row component
 */
function DoctorRow({ doctor, onEditPermissions, onDeactivate, onReactivate, canManage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const association = doctor.association;
    const isActive = association?.active !== false;
    const associationType = association?.associationType || association?.association_type || 'employee';
    const assocColors = getAssociationColor(associationType);

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'D';
    };

    const statusColors = {
        active: { bg: '#E6F7EF', text: '#0CAF60' },
        inactive: { bg: '#F1F5F9', text: '#64748B' },
    };
    const statusColor = isActive ? statusColors.active : statusColors.inactive;

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
                    borderColor: alpha(themeColors.primary, 0.3),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(themeColors.primary, 0.1),
                        color: themeColors.primary,
                        fontWeight: 600,
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    {getInitials(doctor.name)}
                </Avatar>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            Dr(a). {doctor.name}
                        </Typography>
                        {!isActive && (
                            <Chip
                                size="small"
                                label="Inativo"
                                sx={{ height: 20, fontSize: 11, bgcolor: '#F1F5F9', color: '#64748B' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StethoscopeIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                CRM {doctor.crm}/{doctor.ufCrm || doctor.uf_crm}
                                {doctor.specialty && ` - ${doctor.specialty}`}
                            </Typography>
                        </Box>
                        {doctor.email && (
                            <>
                                <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EmailIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                                    <Typography variant="body2" color={themeColors.textSecondary}>
                                        {doctor.email}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip
                        size="small"
                        label={getAssociationLabel(associationType)}
                        sx={{
                            bgcolor: assocColors.bg,
                            color: assocColors.text,
                            fontWeight: 500,
                            border: 'none',
                            height: 24,
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {association?.additionalPermissions?.canManageFinancial && (
                            <Chip size="small" label="Financeiro" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        )}
                        {association?.additionalPermissions?.canViewAllPatients && (
                            <Chip size="small" label="Todos pacientes" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        )}
                    </Box>
                </Box>

                {canManage && (
                    <>
                        <IconButton
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                color: themeColors.textTertiary,
                                '&:hover': { color: themeColors.primary },
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
                                onEditPermissions?.(doctor);
                            }}>
                                <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                                <ListItemText>Permissoes</ListItemText>
                            </MenuItem>
                            <Divider />
                            {isActive ? (
                                <MenuItem
                                    onClick={() => {
                                        setAnchorEl(null);
                                        onDeactivate?.(doctor);
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
                                        onReactivate?.(doctor);
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
function EmptyState({ searchQuery, onInvite }) {
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
                <StethoscopeIcon sx={{ fontSize: 32, color: themeColors.textTertiary }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                {searchQuery ? 'Nenhum medico encontrado' : 'Nenhum medico cadastrado'}
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                {searchQuery
                    ? 'Nao encontramos medicos com esse nome. Tente buscar diferente.'
                    : 'Sua clinica ainda nao tem medicos. Convide profissionais para se juntarem a sua equipe.'}
            </Typography>
            {!searchQuery && onInvite && (
                <Button
                    variant="text"
                    color="primary"
                    onClick={onInvite}
                    sx={{ mt: 2, textTransform: 'none' }}
                >
                    Convidar Medico
                </Button>
            )}
        </Box>
    );
}

/**
 * DoctorsList - Main component
 */
export function DoctorsList({ searchQuery = '' }) {
    const { doctors, loading, error, refresh } = useClinicDoctors({ activeOnly: false });
    const { isClinicAdmin, isClinicOwner } = useClinicPermissions();

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const canManage = isClinicAdmin || isClinicOwner;

    // Filter doctors based on search query
    const filteredDoctors = useMemo(() => {
        if (!searchQuery) return doctors;
        const query = searchQuery.toLowerCase();
        return doctors.filter(d =>
            d.name?.toLowerCase().includes(query) ||
            d.email?.toLowerCase().includes(query) ||
            d.crm?.toLowerCase().includes(query) ||
            d.specialty?.toLowerCase().includes(query)
        );
    }, [doctors, searchQuery]);

    const handleEditPermissions = (doctor) => {
        setSelectedDoctor(doctor);
        setPermissionsDialogOpen(true);
    };

    const handleDeactivate = async (doctor) => {
        try {
            await clinicService.deactivateDoctor(doctor.id);
            refresh();
        } catch (err) {
            console.error('Error deactivating doctor:', err);
        }
    };

    const handleReactivate = async (doctor) => {
        try {
            await clinicService.reactivateDoctor(doctor.id);
            refresh();
        } catch (err) {
            console.error('Error reactivating doctor:', err);
        }
    };

    const handleInviteSent = () => {
        setInviteDialogOpen(false);
        refresh();
    };

    const handlePermissionsUpdated = () => {
        setPermissionsDialogOpen(false);
        setSelectedDoctor(null);
        refresh();
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
            {/* Doctors list */}
            {filteredDoctors.length === 0 ? (
                <EmptyState
                    searchQuery={searchQuery}
                    onInvite={canManage ? () => setInviteDialogOpen(true) : null}
                />
            ) : (
                <Box>
                    {filteredDoctors.map((doctor) => (
                        <DoctorRow
                            key={doctor.association?.id || doctor.id}
                            doctor={doctor}
                            canManage={canManage}
                            onEditPermissions={handleEditPermissions}
                            onDeactivate={handleDeactivate}
                            onReactivate={handleReactivate}
                        />
                    ))}
                </Box>
            )}

            {/* Dialogs */}
            <DoctorInviteDialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                onSuccess={handleInviteSent}
            />

            <DoctorPermissionsDialog
                open={permissionsDialogOpen}
                doctor={selectedDoctor}
                onClose={() => {
                    setPermissionsDialogOpen(false);
                    setSelectedDoctor(null);
                }}
                onSuccess={handlePermissionsUpdated}
            />
        </Box>
    );
}

export default DoctorsList;
