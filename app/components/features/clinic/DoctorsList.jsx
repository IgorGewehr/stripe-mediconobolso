'use client';

/**
 * @fileoverview DoctorsList Component
 * @description List of doctors in a multi-doctor clinic with management actions
 */

import { useState } from 'react';
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
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    PersonAdd,
    MoreVert,
    Edit,
    Block,
    Restore,
    Security,
    Email,
} from '@mui/icons-material';
import { useClinicDoctors } from '../../hooks/useClinicDoctors';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';
import DoctorInviteDialog from './DoctorInviteDialog';
import DoctorPermissionsDialog from './DoctorPermissionsDialog';
import clinicService from '@/lib/services/api/clinic.service';

/**
 * Get color based on association type
 */
function getAssociationColor(type) {
    switch (type) {
        case 'owner':
            return 'primary';
        case 'partner':
            return 'secondary';
        case 'employee':
            return 'info';
        case 'contractor':
            return 'warning';
        case 'guest':
            return 'default';
        default:
            return 'default';
    }
}

/**
 * Get label for association type
 */
function getAssociationLabel(type) {
    switch (type) {
        case 'owner':
            return 'Proprietário';
        case 'partner':
            return 'Sócio';
        case 'employee':
            return 'Funcionário';
        case 'contractor':
            return 'Prestador';
        case 'guest':
            return 'Convidado';
        default:
            return type;
    }
}

/**
 * DoctorCard - Individual doctor card
 */
function DoctorCard({ doctor, onEditPermissions, onDeactivate, onReactivate, canManage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const association = doctor.association;
    const isActive = association?.active !== false;

    return (
        <Card
            sx={{
                opacity: isActive ? 1 : 0.6,
                borderLeft: 4,
                borderColor: isActive ? 'primary.main' : 'grey.400',
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                        {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                Dr(a). {doctor.name}
                            </Typography>
                            {!isActive && (
                                <Chip size="small" label="Inativo" color="default" />
                            )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            CRM {doctor.crm}/{doctor.ufCrm}
                            {doctor.specialty && ` - ${doctor.specialty}`}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                label={getAssociationLabel(association?.associationType)}
                                color={getAssociationColor(association?.associationType)}
                            />
                            {association?.additionalPermissions?.canManageFinancial && (
                                <Chip size="small" label="Financeiro" variant="outlined" />
                            )}
                            {association?.additionalPermissions?.canViewAllPatients && (
                                <Chip size="small" label="Todos pacientes" variant="outlined" />
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
                                    onEditPermissions?.(doctor);
                                }}>
                                    <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                                    <ListItemText>Permissões</ListItemText>
                                </MenuItem>
                                {isActive ? (
                                    <MenuItem onClick={() => {
                                        handleMenuClose();
                                        onDeactivate?.(doctor);
                                    }}>
                                        <ListItemIcon><Block fontSize="small" /></ListItemIcon>
                                        <ListItemText>Desativar</ListItemText>
                                    </MenuItem>
                                ) : (
                                    <MenuItem onClick={() => {
                                        handleMenuClose();
                                        onReactivate?.(doctor);
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
 * DoctorsList - Main component
 */
export function DoctorsList() {
    const { doctors, loading, error, refresh } = useClinicDoctors({ activeOnly: false });
    const { isClinicAdmin, isClinicOwner } = useClinicPermissions();

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const canManage = isClinicAdmin || isClinicOwner;

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
                    Médicos ({doctors.length})
                </Typography>
                {canManage && (
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => setInviteDialogOpen(true)}
                    >
                        Convidar Médico
                    </Button>
                )}
            </Box>

            {/* Doctors list */}
            {doctors.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    Nenhum médico cadastrado na clínica.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {doctors.map((doctor) => (
                        <DoctorCard
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
