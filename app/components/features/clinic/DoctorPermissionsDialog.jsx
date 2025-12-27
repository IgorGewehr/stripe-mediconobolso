'use client';

/**
 * @fileoverview DoctorPermissionsDialog Component
 * @description Dialog for editing a doctor's permissions in the clinic
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Divider,
    Avatar,
    Chip,
} from '@mui/material';
import clinicService from '@/lib/services/api/clinic.service';

/**
 * Dialog for editing doctor permissions
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Object} props.doctor - Doctor data
 * @param {() => void} props.onClose - Close handler
 * @param {() => void} props.onSuccess - Success handler
 */
export function DoctorPermissionsDialog({ open, doctor, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [permissions, setPermissions] = useState({
        canViewFinancial: false,
        canManageFinancial: false,
        canViewAllPatients: false,
        canIssueNfse: false,
        canManageSecretaries: false,
        canViewAnalytics: true,
        canManageWhatsapp: false,
        canManageFacebook: false,
    });
    const [defaultRepassePercent, setDefaultRepassePercent] = useState('');

    // Load doctor permissions when dialog opens
    useEffect(() => {
        if (open && doctor) {
            const doctorPerms = doctor.association?.additionalPermissions || {};
            setPermissions({
                canViewFinancial: doctorPerms.canViewFinancial || false,
                canManageFinancial: doctorPerms.canManageFinancial || false,
                canViewAllPatients: doctorPerms.canViewAllPatients || false,
                canIssueNfse: doctorPerms.canIssueNfse || false,
                canManageSecretaries: doctorPerms.canManageSecretaries || false,
                canViewAnalytics: doctorPerms.canViewAnalytics ?? true,
                canManageWhatsapp: doctorPerms.canManageWhatsapp || false,
                canManageFacebook: doctorPerms.canManageFacebook || false,
            });
            setDefaultRepassePercent(
                doctor.association?.defaultRepassePercent?.toString() || ''
            );
        }
    }, [open, doctor]);

    const handlePermissionChange = (field) => (event) => {
        setPermissions((prev) => ({ ...prev, [field]: event.target.checked }));
    };

    const handleSubmit = async () => {
        if (!doctor?.association?.profissionalId) return;

        setLoading(true);
        setError(null);

        try {
            await clinicService.updateDoctorPermissions(
                doctor.association.profissionalId,
                {
                    additionalPermissions: permissions,
                    defaultRepassePercent: defaultRepassePercent
                        ? parseFloat(defaultRepassePercent)
                        : undefined,
                }
            );
            onSuccess?.();
        } catch (err) {
            console.error('Error updating permissions:', err);
            setError(err.message || 'Erro ao atualizar permissões');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            onClose?.();
        }
    };

    if (!doctor) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Permissões do Médico</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Doctor info header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                        {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Dr(a). {doctor.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            CRM {doctor.crm}/{doctor.ufCrm}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Financial permissions */}
                <Typography variant="subtitle2" gutterBottom>
                    Financeiro
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canViewFinancial}
                                onChange={handlePermissionChange('canViewFinancial')}
                            />
                        }
                        label="Ver dados financeiros da clínica"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canManageFinancial}
                                onChange={handlePermissionChange('canManageFinancial')}
                            />
                        }
                        label="Gerenciar financeiro (editar, criar guias)"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canIssueNfse}
                                onChange={handlePermissionChange('canIssueNfse')}
                            />
                        }
                        label="Emitir NFSe"
                    />
                </Box>

                <TextField
                    label="Percentual de repasse padrão (%)"
                    type="number"
                    value={defaultRepassePercent}
                    onChange={(e) => setDefaultRepassePercent(e.target.value)}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    size="small"
                    fullWidth
                    sx={{ mb: 3 }}
                />

                <Divider sx={{ mb: 2 }} />

                {/* Patient access */}
                <Typography variant="subtitle2" gutterBottom>
                    Pacientes
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canViewAllPatients}
                                onChange={handlePermissionChange('canViewAllPatients')}
                            />
                        }
                        label="Ver pacientes de outros médicos"
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Admin permissions */}
                <Typography variant="subtitle2" gutterBottom>
                    Administração
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canManageSecretaries}
                                onChange={handlePermissionChange('canManageSecretaries')}
                            />
                        }
                        label="Gerenciar secretárias da clínica"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canViewAnalytics}
                                onChange={handlePermissionChange('canViewAnalytics')}
                            />
                        }
                        label="Ver relatórios e analytics"
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Communication */}
                <Typography variant="subtitle2" gutterBottom>
                    Comunicação
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canManageWhatsapp}
                                onChange={handlePermissionChange('canManageWhatsapp')}
                            />
                        }
                        label="Gerenciar WhatsApp da clínica"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={permissions.canManageFacebook}
                                onChange={handlePermissionChange('canManageFacebook')}
                            />
                        }
                        label="Gerenciar Facebook da clínica"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DoctorPermissionsDialog;
