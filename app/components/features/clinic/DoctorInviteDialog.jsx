'use client';

/**
 * @fileoverview DoctorInviteDialog Component
 * @description Dialog for inviting a new doctor to the clinic
 */

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import clinicService from '@/lib/services/api/clinic.service';

const ASSOCIATION_TYPES = [
    { value: 'employee', label: 'Funcionário', description: 'CLT ou contrato' },
    { value: 'contractor', label: 'Prestador de Serviço', description: 'Autônomo/PJ' },
    { value: 'partner', label: 'Sócio', description: 'Participação na clínica' },
    { value: 'guest', label: 'Convidado', description: 'Acesso temporário' },
];

const UF_OPTIONS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Dialog for inviting a doctor
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {() => void} props.onClose - Close handler
 * @param {() => void} props.onSuccess - Success handler
 */
export function DoctorInviteDialog({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        crm: '',
        ufCrm: '',
        specialty: '',
        associationType: 'employee',
        defaultRepassePercent: '',
        // Permissions
        canViewFinancial: false,
        canManageFinancial: false,
        canViewAllPatients: false,
        canIssueNfse: false,
        canManageSecretaries: false,
        canViewAnalytics: true,
        canManageWhatsapp: false,
        canManageFacebook: false,
    });

    const handleChange = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                email: formData.email,
                name: formData.name,
                crm: formData.crm,
                ufCrm: formData.ufCrm,
                specialty: formData.specialty || undefined,
                associationType: formData.associationType,
                defaultRepassePercent: formData.defaultRepassePercent
                    ? parseFloat(formData.defaultRepassePercent)
                    : undefined,
                additionalPermissions: {
                    canViewFinancial: formData.canViewFinancial,
                    canManageFinancial: formData.canManageFinancial,
                    canViewAllPatients: formData.canViewAllPatients,
                    canIssueNfse: formData.canIssueNfse,
                    canManageSecretaries: formData.canManageSecretaries,
                    canViewAnalytics: formData.canViewAnalytics,
                    canManageWhatsapp: formData.canManageWhatsapp,
                    canManageFacebook: formData.canManageFacebook,
                },
            };

            await clinicService.inviteDoctor(payload);
            onSuccess?.();
            resetForm();
        } catch (err) {
            console.error('Error inviting doctor:', err);
            setError(err.message || 'Erro ao enviar convite');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            name: '',
            crm: '',
            ufCrm: '',
            specialty: '',
            associationType: 'employee',
            defaultRepassePercent: '',
            canViewFinancial: false,
            canManageFinancial: false,
            canViewAllPatients: false,
            canIssueNfse: false,
            canManageSecretaries: false,
            canViewAnalytics: true,
            canManageWhatsapp: false,
            canManageFacebook: false,
        });
        setError(null);
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose?.();
        }
    };

    const isValid = formData.email && formData.name && formData.crm && formData.ufCrm;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Convidar Médico</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Basic info */}
                    <TextField
                        label="Nome completo"
                        value={formData.name}
                        onChange={handleChange('name')}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        required
                        fullWidth
                        helperText="O convite será enviado para este email"
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="CRM"
                            value={formData.crm}
                            onChange={handleChange('crm')}
                            required
                            sx={{ flex: 1 }}
                        />
                        <FormControl sx={{ minWidth: 100 }} required>
                            <InputLabel>UF</InputLabel>
                            <Select
                                value={formData.ufCrm}
                                onChange={handleChange('ufCrm')}
                                label="UF"
                            >
                                {UF_OPTIONS.map((uf) => (
                                    <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <TextField
                        label="Especialidade"
                        value={formData.specialty}
                        onChange={handleChange('specialty')}
                        fullWidth
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Association type */}
                    <FormControl fullWidth>
                        <InputLabel>Tipo de vínculo</InputLabel>
                        <Select
                            value={formData.associationType}
                            onChange={handleChange('associationType')}
                            label="Tipo de vínculo"
                        >
                            {ASSOCIATION_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box>
                                        <Typography>{type.label}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {type.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Percentual de repasse (%)"
                        type="number"
                        value={formData.defaultRepassePercent}
                        onChange={handleChange('defaultRepassePercent')}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        helperText="Opcional - percentual padrão para repasses"
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Permissions */}
                    <Typography variant="subtitle2" color="text.secondary">
                        Permissões adicionais
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.canViewFinancial}
                                    onChange={handleChange('canViewFinancial')}
                                />
                            }
                            label="Ver dados financeiros"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.canManageFinancial}
                                    onChange={handleChange('canManageFinancial')}
                                />
                            }
                            label="Gerenciar financeiro"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.canViewAllPatients}
                                    onChange={handleChange('canViewAllPatients')}
                                />
                            }
                            label="Ver pacientes de outros médicos"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.canIssueNfse}
                                    onChange={handleChange('canIssueNfse')}
                                />
                            }
                            label="Emitir NFSe"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.canManageSecretaries}
                                    onChange={handleChange('canManageSecretaries')}
                                />
                            }
                            label="Gerenciar secretárias"
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !isValid}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    Enviar Convite
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DoctorInviteDialog;
