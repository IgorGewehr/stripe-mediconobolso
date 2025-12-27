'use client';

/**
 * @fileoverview Clinic Management Template
 * @description Main page template for managing multi-doctor clinics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Switch,
    FormControlLabel,
    TextField,
    Snackbar,
    alpha,
    Skeleton,
} from '@mui/material';
import {
    Business as BusinessIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    MeetingRoom as RoomIcon,
    PersonAdd as PersonAddIcon,
    Assessment as AssessmentIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/authProvider';
import { useClinicPermissions } from '../hooks/useClinicPermissions';
import DoctorsList from '../features/clinic/DoctorsList';
import ClinicSecretaryList from '../features/clinic/ClinicSecretaryList';
import clinicService from '@/lib/services/api/clinic.service';

// Theme colors
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    primaryDark: '#0A3AA8',
    success: '#0CAF60',
    error: '#FF4B55',
    warning: '#FFAB2B',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F4F7FF',
    borderColor: 'rgba(17, 30, 90, 0.1)',
};

/**
 * TabPanel component
 */
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`clinic-tabpanel-${index}`}
            aria-labelledby={`clinic-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

/**
 * Summary Card component
 */
function SummaryCard({ title, value, icon: Icon, color = 'primary' }) {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                height: '100%',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(themeColors[color] || themeColors.primary, 0.1),
                        }}
                    >
                        <Icon sx={{ color: themeColors[color] || themeColors.primary }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color={themeColors.textPrimary}>
                            {value}
                        </Typography>
                        <Typography variant="body2" color={themeColors.textSecondary}>
                            {title}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Clinic Settings Tab
 */
function ClinicSettingsTab({ clinic, onUpdate }) {
    const [settings, setSettings] = useState({
        clinic_mode: 'solo',
        allow_patient_sharing: false,
        require_doctor_assignment: false,
        default_appointment_duration: 30,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clinic?.settings) {
            setSettings({
                clinic_mode: clinic.settings.clinic_mode || 'solo',
                allow_patient_sharing: clinic.settings.allow_patient_sharing || false,
                require_doctor_assignment: clinic.settings.require_doctor_assignment || false,
                default_appointment_duration: clinic.settings.default_appointment_duration || 30,
            });
        }
    }, [clinic]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await clinicService.updateSettings({
                clinicMode: settings.clinic_mode,
                allowPatientSharing: settings.allow_patient_sharing,
                requireDoctorAssignment: settings.require_doctor_assignment,
                defaultAppointmentDuration: settings.default_appointment_duration,
            });
            onUpdate?.();
        } catch (err) {
            console.error('Error updating settings:', err);
            setError(err.message || 'Erro ao atualizar configurações');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Configurações da Clínica
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Clinic Mode */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Modo de Operação
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip
                                label="Solo (1 médico)"
                                onClick={() => setSettings((s) => ({ ...s, clinic_mode: 'solo' }))}
                                color={settings.clinic_mode === 'solo' ? 'primary' : 'default'}
                                variant={settings.clinic_mode === 'solo' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label="Multi-Médico"
                                onClick={() => setSettings((s) => ({ ...s, clinic_mode: 'multi_doctor' }))}
                                color={settings.clinic_mode === 'multi_doctor' ? 'primary' : 'default'}
                                variant={settings.clinic_mode === 'multi_doctor' ? 'filled' : 'outlined'}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Patient Sharing */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.allow_patient_sharing}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        allow_patient_sharing: e.target.checked,
                                    }))
                                }
                                disabled={settings.clinic_mode === 'solo'}
                            />
                        }
                        label="Permitir compartilhamento de pacientes entre médicos"
                    />

                    {/* Require Doctor Assignment */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.require_doctor_assignment}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        require_doctor_assignment: e.target.checked,
                                    }))
                                }
                                disabled={settings.clinic_mode === 'solo'}
                            />
                        }
                        label="Exigir atribuição de médico responsável para pacientes"
                    />

                    <Divider />

                    {/* Default Appointment Duration */}
                    <TextField
                        label="Duração padrão de consulta (minutos)"
                        type="number"
                        value={settings.default_appointment_duration}
                        onChange={(e) =>
                            setSettings((s) => ({
                                ...s,
                                default_appointment_duration: parseInt(e.target.value) || 30,
                            }))
                        }
                        inputProps={{ min: 5, max: 180, step: 5 }}
                        size="small"
                        sx={{ maxWidth: 250 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            startIcon={saving && <CircularProgress size={20} />}
                        >
                            {saving ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Clinic Info Card
 */
function ClinicInfoCard({ clinic, loading }) {
    if (loading) {
        return (
            <Card
                elevation={0}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                    mb: 3,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={300} height={24} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width={250} height={24} sx={{ mt: 1 }} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                mb: 3,
                background: `linear-gradient(135deg, ${alpha(themeColors.primary, 0.05)} 0%, ${alpha(themeColors.primaryLight, 0.3)} 100%)`,
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: themeColors.primary,
                        }}
                    >
                        <BusinessIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color={themeColors.textPrimary}>
                            {clinic?.name || 'Minha Clínica'}
                        </Typography>
                        <Typography variant="body2" color={themeColors.textSecondary}>
                            CNPJ: {clinic?.cnpj || 'Não informado'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        size="small"
                        label={clinic?.settings?.clinic_mode === 'multi_doctor' ? 'Multi-Médico' : 'Solo'}
                        color={clinic?.settings?.clinic_mode === 'multi_doctor' ? 'primary' : 'default'}
                    />
                    <Chip
                        size="small"
                        label={clinic?.subscription_tier || 'Free'}
                        variant="outlined"
                    />
                    {clinic?.settings?.whatsapp_enabled && (
                        <Chip size="small" label="WhatsApp" color="success" variant="outlined" />
                    )}
                    {clinic?.settings?.ai_enabled && (
                        <Chip size="small" label="IA Ativa" color="secondary" variant="outlined" />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Main Clinic Management Template
 */
export function ClinicManagementTemplate() {
    const { isMultiDoctorClinic, isClinicAdmin, isClinicOwner } = useAuth();
    const { canManageDoctors, canManageSecretaries } = useClinicPermissions();

    const [tabValue, setTabValue] = useState(0);
    const [clinic, setClinic] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const canManage = isClinicAdmin || isClinicOwner || canManageDoctors;

    const loadClinicData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [clinicData, summaryData] = await Promise.all([
                clinicService.getCurrent(),
                clinicService.getSummary(),
            ]);

            setClinic(clinicData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Error loading clinic data:', err);
            setError(err.message || 'Erro ao carregar dados da clínica');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClinicData();
    }, [loadClinicData]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSettingsUpdated = () => {
        setSnackbar({
            open: true,
            message: 'Configurações atualizadas com sucesso!',
            severity: 'success',
        });
        loadClinicData();
    };

    if (error && !clinic) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Clinic Info */}
            <ClinicInfoCard clinic={clinic} loading={loading} />

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                    <SummaryCard
                        title="Médicos Ativos"
                        value={loading ? '-' : summary?.active_doctors || 0}
                        icon={PeopleIcon}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <SummaryCard
                        title="Secretárias"
                        value={loading ? '-' : summary?.active_secretaries || 0}
                        icon={PersonAddIcon}
                        color="success"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <SummaryCard
                        title="Convites Pendentes"
                        value={loading ? '-' : summary?.pending_invites || 0}
                        icon={AssessmentIcon}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <SummaryCard
                        title="Total Médicos"
                        value={loading ? '-' : summary?.total_doctors || 0}
                        icon={BusinessIcon}
                        color="textSecondary"
                    />
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="clinic management tabs"
                    >
                        <Tab
                            icon={<PeopleIcon />}
                            iconPosition="start"
                            label="Médicos"
                            id="clinic-tab-0"
                        />
                        {canManage && (
                            <Tab
                                icon={<BadgeIcon />}
                                iconPosition="start"
                                label="Secretárias"
                                id="clinic-tab-1"
                            />
                        )}
                        {canManage && (
                            <Tab
                                icon={<SettingsIcon />}
                                iconPosition="start"
                                label="Configurações"
                                id="clinic-tab-2"
                            />
                        )}
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Doctors Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <DoctorsList />
                    </TabPanel>

                    {/* Secretaries Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={1}>
                            <ClinicSecretaryList />
                        </TabPanel>
                    )}

                    {/* Settings Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={2}>
                            <ClinicSettingsTab clinic={clinic} onUpdate={handleSettingsUpdated} />
                        </TabPanel>
                    )}
                </Box>
            </Card>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ClinicManagementTemplate;
