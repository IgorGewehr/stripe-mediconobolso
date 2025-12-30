'use client';

/**
 * @fileoverview Clinic Management Template
 * @description Main page template for managing multi-doctor clinics
 * @design Inspired by modern clinic management dashboard patterns
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    InputAdornment,
    Badge,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Paper,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Business as BusinessIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    PersonAdd as PersonAddIcon,
    Assessment as AssessmentIcon,
    Badge as BadgeIcon,
    Schedule as ScheduleIcon,
    AttachMoney as MoneyIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    MoreHoriz as MoreHorizIcon,
    LocalHospital as StethoscopeIcon,
    EventNote as CalendarIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Security as ShieldIcon,
    Dashboard as DashboardIcon,
    Group as GroupIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../providers/authProvider';
import { useClinicPermissions } from '../hooks/useClinicPermissions';
import DoctorsList from '../features/clinic/DoctorsList';
import ClinicSecretaryList from '../features/clinic/ClinicSecretaryList';
import ReminderConfigCard from '../features/crm/ReminderConfigCard';
import ConfiguracaoFinanceiro from '../features/financial/ConfiguracaoFinanceiro';
import DoctorInviteDialog from '../features/clinic/DoctorInviteDialog';
import ClinicSecretaryDialog from '../features/clinic/ClinicSecretaryDialog';
import clinicService from '@/lib/services/api/clinic.service';
import crmService from '@/lib/services/api/crm.service';

// Theme colors
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    primaryDark: '#0A3AA8',
    success: '#0CAF60',
    successLight: '#E6F7EF',
    error: '#FF4B55',
    errorLight: '#FFEBEC',
    warning: '#FFAB2B',
    warningLight: '#FFF8E6',
    purple: '#8B5CF6',
    purpleLight: '#F3E8FF',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

/**
 * StatCard - Modern statistics card with trend
 */
function StatCard({ title, value, icon: Icon, trend, colorClass, loading }) {
    const colorMap = {
        blue: { bg: themeColors.primaryLight, icon: themeColors.primary },
        purple: { bg: themeColors.purpleLight, icon: themeColors.purple },
        amber: { bg: themeColors.warningLight, icon: themeColors.warning },
        green: { bg: themeColors.successLight, icon: themeColors.success },
    };

    const colors = colorMap[colorClass] || colorMap.blue;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
                    <Typography variant="body2" color={themeColors.textSecondary} fontWeight={500}>
                        {title}
                    </Typography>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.bg,
                        }}
                    >
                        <Icon sx={{ color: colors.icon, fontSize: 20 }} />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                    {loading ? (
                        <Skeleton variant="text" width={60} height={40} />
                    ) : (
                        <Typography variant="h4" fontWeight="bold" color={themeColors.textPrimary}>
                            {value}
                        </Typography>
                    )}
                    {trend && (
                        <Typography variant="caption" color={themeColors.textTertiary} sx={{ mt: 0.5 }}>
                            {trend}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * StaffMemberRow - Row component for staff members (doctors or secretaries)
 */
function StaffMemberRow({ member, onManagePermissions, onDeactivate, canManage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const isDoctor = member.staff_type === 'doctor';
    const isActive = member.active;

    const statusColors = {
        active: { bg: '#E6F7EF', text: '#0CAF60' },
        pending: { bg: '#FFF8E6', text: '#FFAB2B' },
        inactive: { bg: '#F1F5F9', text: '#64748B' },
    };

    const status = isActive ? 'active' : 'inactive';
    const statusColor = statusColors[status];

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
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
                        bgcolor: isDoctor ? alpha(themeColors.primary, 0.1) : alpha(themeColors.purple, 0.1),
                        color: isDoctor ? themeColors.primary : themeColors.purple,
                        fontWeight: 600,
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    {getInitials(member.name)}
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                        {member.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isDoctor ? (
                                <StethoscopeIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            ) : (
                                <CalendarIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            )}
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {isDoctor ? (member.specialty || 'Medicina') : 'Secretaria'}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {member.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Chip
                        size="small"
                        label={isActive ? 'Ativo' : 'Inativo'}
                        sx={{
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            fontWeight: 500,
                            border: 'none',
                            px: 1,
                        }}
                    />
                    {member.last_login_at && (
                        <Typography variant="caption" color={themeColors.textTertiary} sx={{ mt: 0.5 }}>
                            Último acesso: {new Date(member.last_login_at).toLocaleDateString('pt-BR')}
                        </Typography>
                    )}
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
                            <MoreHorizIcon />
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
                                onManagePermissions?.(member);
                            }}>
                                <ListItemIcon><ShieldIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Gerenciar Permissões</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                onClick={() => {
                                    setAnchorEl(null);
                                    onDeactivate?.(member);
                                }}
                                sx={{ color: isActive ? themeColors.error : themeColors.success }}
                            >
                                <ListItemIcon>
                                    {isActive ? (
                                        <CancelIcon fontSize="small" sx={{ color: themeColors.error }} />
                                    ) : (
                                        <CheckCircleIcon fontSize="small" sx={{ color: themeColors.success }} />
                                    )}
                                </ListItemIcon>
                                <ListItemText>{isActive ? 'Desativar' : 'Reativar'}</ListItemText>
                            </MenuItem>
                        </Menu>
                    </>
                )}
            </Box>
        </Paper>
    );
}

/**
 * StaffListTab - Unified staff list tab
 */
function StaffListTab({ searchQuery, canManage }) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStaff = useCallback(async () => {
        setLoading(true);
        try {
            const data = await clinicService.listStaff({ activeOnly: false });
            setStaff(data);
        } catch (err) {
            console.error('Error loading staff:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    const filteredStaff = useMemo(() => {
        if (!searchQuery) return staff;
        const query = searchQuery.toLowerCase();
        return staff.filter(m =>
            m.name?.toLowerCase().includes(query) ||
            m.email?.toLowerCase().includes(query)
        );
    }, [staff, searchQuery]);

    const handleManagePermissions = (member) => {
        // TODO: Open permissions dialog
        console.log('Manage permissions for:', member);
    };

    const handleDeactivate = async (member) => {
        try {
            if (member.staff_type === 'doctor') {
                if (member.active) {
                    await clinicService.deactivateDoctor(member.id);
                } else {
                    await clinicService.reactivateDoctor(member.id);
                }
            } else {
                if (member.active) {
                    await clinicService.deactivateClinicSecretary(member.id);
                } else {
                    await clinicService.reactivateClinicSecretary(member.id);
                }
            }
            loadStaff();
        } catch (err) {
            console.error('Error toggling member status:', err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (filteredStaff.length === 0) {
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
                    <GroupIcon sx={{ fontSize: 32, color: themeColors.textTertiary }} />
                </Box>
                <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                    Nenhum membro encontrado
                </Typography>
                <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                    {searchQuery
                        ? 'Não encontramos membros com esse nome ou email. Tente outra busca.'
                        : 'Sua equipe ainda não tem membros. Convide médicos ou adicione secretárias.'}
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {filteredStaff.map((member) => (
                <StaffMemberRow
                    key={`${member.staff_type}-${member.id}`}
                    member={member}
                    canManage={canManage}
                    onManagePermissions={handleManagePermissions}
                    onDeactivate={handleDeactivate}
                />
            ))}
        </Box>
    );
}

/**
 * GlobalPermissionsTab - Configure permissions by role
 */
function GlobalPermissionsTab() {
    return (
        <Box sx={{ py: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(themeColors.success, 0.1),
                    }}
                >
                    <ShieldIcon sx={{ fontSize: 24, color: themeColors.success }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                        Permissoes por Funcao
                    </Typography>
                    <Typography variant="body2" color={themeColors.textSecondary}>
                        Defina o que cada funcao pode acessar dentro da clinica
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: themeColors.borderColor,
                            borderRadius: '16px',
                            height: '100%',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: alpha(themeColors.primary, 0.3),
                                boxShadow: `0 4px 20px ${alpha(themeColors.primary, 0.08)}`,
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(themeColors.primary, 0.1),
                                    }}
                                >
                                    <StethoscopeIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                                    Medicos
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: themeColors.borderColor,
                                    color: themeColors.textSecondary,
                                    '&:hover': {
                                        borderColor: themeColors.primary,
                                        color: themeColors.primary,
                                        bgcolor: alpha(themeColors.primary, 0.05),
                                    },
                                }}
                            >
                                Editar
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Acesso total a agenda propria', enabled: true },
                                { label: 'Visualizar prontuarios', enabled: true },
                                { label: 'Prescrever medicamentos', enabled: true },
                                { label: 'Emitir atestados', enabled: true },
                            ].map((perm, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: perm.enabled ? alpha(themeColors.success, 0.1) : alpha(themeColors.textTertiary, 0.1),
                                        }}
                                    >
                                        {perm.enabled ? (
                                            <CheckCircleIcon sx={{ fontSize: 16, color: themeColors.success }} />
                                        ) : (
                                            <CancelIcon sx={{ fontSize: 16, color: themeColors.textTertiary }} />
                                        )}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color={perm.enabled ? themeColors.textSecondary : themeColors.textTertiary}
                                    >
                                        {perm.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: themeColors.borderColor,
                            borderRadius: '16px',
                            height: '100%',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: alpha(themeColors.purple, 0.3),
                                boxShadow: `0 4px 20px ${alpha(themeColors.purple, 0.08)}`,
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(themeColors.purple, 0.1),
                                    }}
                                >
                                    <PeopleIcon sx={{ color: themeColors.purple, fontSize: 20 }} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                                    Secretarias
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: themeColors.borderColor,
                                    color: themeColors.textSecondary,
                                    '&:hover': {
                                        borderColor: themeColors.purple,
                                        color: themeColors.purple,
                                        bgcolor: alpha(themeColors.purple, 0.05),
                                    },
                                }}
                            >
                                Editar
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Gerenciar agenda da clinica', enabled: true },
                                { label: 'Cadastrar pacientes', enabled: true },
                                { label: 'Visualizar conversas', enabled: true },
                                { label: 'Acesso financeiro', enabled: false },
                            ].map((perm, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: perm.enabled ? alpha(themeColors.success, 0.1) : alpha(themeColors.textTertiary, 0.1),
                                        }}
                                    >
                                        {perm.enabled ? (
                                            <CheckCircleIcon sx={{ fontSize: 16, color: themeColors.success }} />
                                        ) : (
                                            <CancelIcon sx={{ fontSize: 16, color: themeColors.textTertiary }} />
                                        )}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color={perm.enabled ? themeColors.textSecondary : themeColors.textTertiary}
                                    >
                                        {perm.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

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
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

/**
 * Modern Settings Card
 */
function SettingsCard({ icon: Icon, title, description, value, onClick, color = themeColors.primary, badge }) {
    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                height: '100%',
                '&:hover': onClick ? {
                    borderColor: alpha(color, 0.3),
                    boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
                    transform: 'translateY(-2px)',
                } : {},
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(color, 0.1),
                        }}
                    >
                        <Icon sx={{ color, fontSize: 24 }} />
                    </Box>
                    {badge && (
                        <Chip
                            size="small"
                            label={badge}
                            sx={{
                                bgcolor: alpha(color, 0.1),
                                color,
                                fontWeight: 600,
                                fontSize: 11,
                            }}
                        />
                    )}
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary} gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color={themeColors.textSecondary} sx={{ mb: 1.5 }}>
                    {description}
                </Typography>
                {value && (
                    <Typography variant="body2" fontWeight={500} color={color}>
                        {value}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Modern Toggle Setting
 */
function ToggleSetting({ icon: Icon, title, description, checked, onChange, disabled, color = themeColors.primary }) {
    return (
        <Box
            onClick={() => !disabled && onChange?.(!checked)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2.5,
                borderRadius: '14px',
                border: '1px solid',
                borderColor: checked ? alpha(color, 0.3) : themeColors.borderColor,
                bgcolor: checked ? alpha(color, 0.03) : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                '&:hover': !disabled ? {
                    borderColor: alpha(color, 0.4),
                    bgcolor: alpha(color, 0.05),
                } : {},
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: checked ? alpha(color, 0.1) : themeColors.backgroundSecondary,
                    }}
                >
                    <Icon sx={{ color: checked ? color : themeColors.textTertiary, fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography variant="body1" fontWeight={500} color={themeColors.textPrimary}>
                        {title}
                    </Typography>
                    <Typography variant="body2" color={themeColors.textTertiary}>
                        {description}
                    </Typography>
                </Box>
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: color },
                }}
            />
        </Box>
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
    const [successMessage, setSuccessMessage] = useState('');

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
            setSuccessMessage('Configuracoes salvas com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
            onUpdate?.();
        } catch (err) {
            console.error('Error updating settings:', err);
            setError(err.message || 'Erro ao atualizar configuracoes');
        } finally {
            setSaving(false);
        }
    };

    const isMultiDoctor = settings.clinic_mode === 'multi_doctor';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {error && (
                <Alert severity="error" sx={{ borderRadius: '12px' }}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ borderRadius: '12px' }}>
                    {successMessage}
                </Alert>
            )}

            {/* Modo de Operacao */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(themeColors.primary, 0.1),
                        }}
                    >
                        <BusinessIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            Modo de Operacao
                        </Typography>
                        <Typography variant="body2" color={themeColors.textTertiary}>
                            Escolha como sua clinica opera
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box
                            onClick={() => setSettings((s) => ({ ...s, clinic_mode: 'solo' }))}
                            sx={{
                                p: 3,
                                borderRadius: '16px',
                                border: '2px solid',
                                borderColor: settings.clinic_mode === 'solo' ? themeColors.primary : themeColors.borderColor,
                                bgcolor: settings.clinic_mode === 'solo' ? alpha(themeColors.primary, 0.03) : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: themeColors.primary,
                                    bgcolor: alpha(themeColors.primary, 0.05),
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(themeColors.primary, 0.1),
                                    }}
                                >
                                    <StethoscopeIcon sx={{ color: themeColors.primary, fontSize: 24 }} />
                                </Box>
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: settings.clinic_mode === 'solo' ? themeColors.primary : themeColors.borderColor,
                                        bgcolor: settings.clinic_mode === 'solo' ? themeColors.primary : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {settings.clinic_mode === 'solo' && (
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'white' }} />
                                    )}
                                </Box>
                            </Box>
                            <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                                Medico Solo
                            </Typography>
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                Consultorio individual com um unico profissional
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box
                            onClick={() => setSettings((s) => ({ ...s, clinic_mode: 'multi_doctor' }))}
                            sx={{
                                p: 3,
                                borderRadius: '16px',
                                border: '2px solid',
                                borderColor: settings.clinic_mode === 'multi_doctor' ? themeColors.purple : themeColors.borderColor,
                                bgcolor: settings.clinic_mode === 'multi_doctor' ? alpha(themeColors.purple, 0.03) : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: themeColors.purple,
                                    bgcolor: alpha(themeColors.purple, 0.05),
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(themeColors.purple, 0.1),
                                    }}
                                >
                                    <GroupIcon sx={{ color: themeColors.purple, fontSize: 24 }} />
                                </Box>
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: settings.clinic_mode === 'multi_doctor' ? themeColors.purple : themeColors.borderColor,
                                        bgcolor: settings.clinic_mode === 'multi_doctor' ? themeColors.purple : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {settings.clinic_mode === 'multi_doctor' && (
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'white' }} />
                                    )}
                                </Box>
                            </Box>
                            <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                                Multi-Medico
                            </Typography>
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                Clinica com multiplos profissionais e equipe compartilhada
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Configuracoes de Compartilhamento */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(themeColors.success, 0.1),
                        }}
                    >
                        <PeopleIcon sx={{ color: themeColors.success, fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            Configuracoes de Equipe
                        </Typography>
                        <Typography variant="body2" color={themeColors.textTertiary}>
                            {isMultiDoctor ? 'Configure como a equipe compartilha informacoes' : 'Disponivel apenas no modo multi-medico'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ToggleSetting
                        icon={PeopleIcon}
                        title="Compartilhar pacientes"
                        description="Medicos podem ver pacientes de outros colegas"
                        checked={settings.allow_patient_sharing}
                        onChange={(v) => setSettings((s) => ({ ...s, allow_patient_sharing: v }))}
                        disabled={!isMultiDoctor}
                        color={themeColors.success}
                    />
                    <ToggleSetting
                        icon={BadgeIcon}
                        title="Exigir medico responsavel"
                        description="Pacientes devem ter um medico atribuido"
                        checked={settings.require_doctor_assignment}
                        onChange={(v) => setSettings((s) => ({ ...s, require_doctor_assignment: v }))}
                        disabled={!isMultiDoctor}
                        color={themeColors.warning}
                    />
                </Box>
            </Box>

            {/* Duracao Padrao */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(themeColors.warning, 0.1),
                        }}
                    >
                        <ScheduleIcon sx={{ color: themeColors.warning, fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            Duracao de Consulta
                        </Typography>
                        <Typography variant="body2" color={themeColors.textTertiary}>
                            Tempo padrao para agendamentos
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {[15, 20, 30, 45, 60].map((duration) => (
                        <Chip
                            key={duration}
                            label={`${duration} min`}
                            onClick={() => setSettings((s) => ({ ...s, default_appointment_duration: duration }))}
                            sx={{
                                borderRadius: '10px',
                                fontWeight: 600,
                                px: 2,
                                py: 2.5,
                                fontSize: '0.875rem',
                                bgcolor: settings.default_appointment_duration === duration ? themeColors.warning : 'transparent',
                                color: settings.default_appointment_duration === duration ? 'white' : themeColors.textSecondary,
                                border: '1px solid',
                                borderColor: settings.default_appointment_duration === duration ? themeColors.warning : themeColors.borderColor,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: settings.default_appointment_duration === duration ? themeColors.warning : alpha(themeColors.warning, 0.1),
                                    borderColor: themeColors.warning,
                                },
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Botao Salvar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                        boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.25)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            boxShadow: `0 6px 20px ${alpha(themeColors.primary, 0.35)}`,
                            transform: 'translateY(-1px)',
                        },
                        '&:disabled': {
                            background: themeColors.borderColor,
                        },
                    }}
                >
                    {saving ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                            Salvando...
                        </>
                    ) : (
                        'Salvar Configuracoes'
                    )}
                </Button>
            </Box>
        </Box>
    );
}

/**
 * Agenda Settings Tab (Reminder Config)
 */
function AgendaSettingsTab() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await crmService.getReminderConfig();
            setConfig(data);
        } catch (err) {
            console.error('Error loading reminder config:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        setSaving(true);
        setError(null);
        try {
            await crmService.updateReminderConfig(formData);
            await loadConfig();
        } catch (err) {
            console.error('Error saving reminder config:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ReminderConfigCard
            config={config}
            loading={loading}
            saving={saving}
            error={error}
            onSave={handleSave}
        />
    );
}

/**
 * Main Clinic Management Template
 */
export function ClinicManagementTemplate() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { isMultiDoctorClinic, isClinicAdmin, isClinicOwner } = useAuth();
    const { canManageDoctors, canManageSecretaries } = useClinicPermissions();

    const [tabValue, setTabValue] = useState(0);
    const [clinic, setClinic] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [secretaryDialogOpen, setSecretaryDialogOpen] = useState(false);
    const [inviteType, setInviteType] = useState('doctor');

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
            setError(err.message || 'Erro ao carregar dados da clinica');
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
            message: 'Configuracoes atualizadas com sucesso!',
            severity: 'success',
        });
        loadClinicData();
    };

    const handleInviteProfessional = () => {
        setInviteDialogOpen(true);
    };

    if (error && !clinic) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: themeColors.backgroundSecondary, p: { xs: 2, md: 3 } }}>
            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 5 }}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Medicos Ativos"
                        value={summary?.active_doctors || 0}
                        icon={StethoscopeIcon}
                        trend="+1 este mes"
                        colorClass="blue"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Secretarias"
                        value={summary?.active_secretaries || 0}
                        icon={PeopleIcon}
                        colorClass="purple"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Convites Pendentes"
                        value={summary?.pending_invites || 0}
                        icon={EmailIcon}
                        trend="Aguardando resposta"
                        colorClass="amber"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Total da Equipe"
                        value={(summary?.total_doctors || 0) + (summary?.total_secretaries || 0)}
                        icon={GroupIcon}
                        colorClass="green"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Main Content Card */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                    bgcolor: alpha('#FFFFFF', 0.7),
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2,
                        mb: 2,
                    }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="clinic management tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    minHeight: 48,
                                    borderRadius: '8px',
                                    mr: 1,
                                },
                                '& .Mui-selected': {
                                    color: themeColors.primary,
                                },
                            }}
                        >
                            <Tab
                                icon={<StethoscopeIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Medicos
                                        <Chip
                                            size="small"
                                            label={summary?.total_doctors || 0}
                                            sx={{
                                                height: 20,
                                                fontSize: 12,
                                                bgcolor: tabValue === 0 ? alpha(themeColors.primary, 0.1) : themeColors.backgroundSecondary,
                                                color: tabValue === 0 ? themeColors.primary : themeColors.textSecondary,
                                            }}
                                        />
                                    </Box>
                                }
                            />
                            <Tab
                                icon={<PeopleIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Secretarias
                                        <Chip
                                            size="small"
                                            label={summary?.total_secretaries || 0}
                                            sx={{
                                                height: 20,
                                                fontSize: 12,
                                                bgcolor: tabValue === 1 ? alpha(themeColors.primary, 0.1) : themeColors.backgroundSecondary,
                                                color: tabValue === 1 ? themeColors.primary : themeColors.textSecondary,
                                            }}
                                        />
                                    </Box>
                                }
                            />
                            {canManage && (
                                <Tab
                                    icon={<ShieldIcon sx={{ fontSize: 20 }} />}
                                    iconPosition="start"
                                    label="Permissoes Globais"
                                />
                            )}
                            {canManage && (
                                <Tab
                                    icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
                                    iconPosition="start"
                                    label="Agenda"
                                />
                            )}
                            {canManage && (
                                <Tab
                                    icon={<MoneyIcon sx={{ fontSize: 20 }} />}
                                    iconPosition="start"
                                    label="Financeiro"
                                />
                            )}
                            {canManage && (
                                <Tab
                                    icon={<SettingsIcon sx={{ fontSize: 20 }} />}
                                    iconPosition="start"
                                    label="Geral"
                                />
                            )}
                        </Tabs>

                        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                            <TextField
                                placeholder="Buscar por nome ou email..."
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    width: { xs: '100%', md: 280 },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: 'white',
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: themeColors.textTertiary }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <IconButton
                                sx={{
                                    border: '1px solid',
                                    borderColor: themeColors.borderColor,
                                    borderRadius: '10px',
                                    bgcolor: 'white',
                                }}
                            >
                                <FilterIcon sx={{ color: themeColors.textTertiary }} />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 }, minHeight: 400 }}>
                    {/* Doctors Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <DoctorsList searchQuery={searchQuery} />
                    </TabPanel>

                    {/* Secretaries Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <ClinicSecretaryList searchQuery={searchQuery} />
                    </TabPanel>

                    {/* Global Permissions Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={2}>
                            <GlobalPermissionsTab />
                        </TabPanel>
                    )}

                    {/* Agenda Settings Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={3}>
                            <AgendaSettingsTab />
                        </TabPanel>
                    )}

                    {/* Financial Settings Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={4}>
                            <ConfiguracaoFinanceiro />
                        </TabPanel>
                    )}

                    {/* General Settings Tab */}
                    {canManage && (
                        <TabPanel value={tabValue} index={5}>
                            <ClinicSettingsTab clinic={clinic} onUpdate={handleSettingsUpdated} />
                        </TabPanel>
                    )}
                </Box>
            </Card>

            {/* Invite Dialog */}
            <DoctorInviteDialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                onSuccess={() => {
                    setInviteDialogOpen(false);
                    loadClinicData();
                    setSnackbar({
                        open: true,
                        message: 'Convite enviado com sucesso!',
                        severity: 'success',
                    });
                }}
            />

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
                    sx={{ borderRadius: '12px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ClinicManagementTemplate;
