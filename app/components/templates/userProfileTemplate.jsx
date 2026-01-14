"use client";

import React, { useReducer, useMemo, useCallback, useRef, useEffect, useState } from "react";
import {
    Box,
    Typography,
    Avatar,
    Button,
    TextField,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    InputAdornment,
    alpha,
    Chip,
    Tabs,
    Tab,
    Fade,
    Tooltip
} from "@mui/material";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    AddAPhoto as AddPhotoIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    Person as PersonIcon,
    LocationOn as LocationOnIcon,
    Home as HomeIcon,
    LocationCity as LocationCityIcon,
    PinDrop as PinDropIcon,
    Apartment as ApartmentIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Logout as LogoutIcon,
    CreditCard as CreditCardIcon,
    ChevronRight as ChevronRightIcon,
    Check as CheckIcon
} from "@mui/icons-material";
import { debounce } from 'lodash';
import { authService, storageService } from '@/lib/services/firebase';
import { secretaryService } from '@/lib/services/api';
import { useAuth } from "../providers/authProvider";
import SubscriptionManagerDialog from '../features/dialogs/SubscriptionManagerDialog';
import SecretaryManagerDialog from '../features/dialogs/SecretaryManagerDialog';
import globalCache from '../utils/globalCache';

// Configuração de cores
const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    primaryDark: "#0A3AA8",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.08)",
};

// Configuração dos planos
const plansDisplay = {
    free: { name: 'Gratuito', color: '#6B7280', icon: '🆓', bg: '#F3F4F6' },
    monthly: { name: 'Essencial', color: '#3B82F6', icon: '⚡', bg: '#EFF6FF' },
    quarterly: { name: 'Profissional', color: '#8B5CF6', icon: '🚀', bg: '#F5F3FF' },
    annual: { name: 'Premium', color: '#F59E0B', icon: '👑', bg: '#FFFBEB' }
};

// Ações do reducer
const PROFILE_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_USER_DATA: 'SET_USER_DATA',
    SET_EDITING: 'SET_EDITING',
    UPDATE_FORM_FIELD: 'UPDATE_FORM_FIELD',
    UPDATE_NESTED_FIELD: 'UPDATE_NESTED_FIELD',
    SET_ERRORS: 'SET_ERRORS',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_PHOTO_PREVIEW: 'SET_PHOTO_PREVIEW',
    SET_ALERT: 'SET_ALERT',
    CLEAR_ALERT: 'CLEAR_ALERT',
    RESET_FORM: 'RESET_FORM',
    SET_SAVING: 'SET_SAVING',
    SET_SECRETARY_INFO: 'SET_SECRETARY_INFO',
    SET_SHOW_SECRETARY_MANAGER: 'SET_SHOW_SECRETARY_MANAGER',
    SET_SHOW_SUBSCRIPTION_MANAGER: 'SET_SHOW_SUBSCRIPTION_MANAGER'
};

// Estado inicial
const initialProfileState = {
    loading: true,
    saving: false,
    isEditing: false,
    userData: {},
    formData: {},
    errors: {},
    photoFile: null,
    photoPreview: null,
    alert: { open: false, message: '', severity: 'success' },
    secretaryInfo: null,
    showSubscriptionManager: false,
    showSecretaryManager: false
};

// Reducer
const profileReducer = (state, action) => {
    switch (action.type) {
        case PROFILE_ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };
        case PROFILE_ACTIONS.SET_SAVING:
            return { ...state, saving: action.payload };
        case PROFILE_ACTIONS.SET_USER_DATA:
            return { ...state, userData: action.payload, formData: action.payload, loading: false };
        case PROFILE_ACTIONS.SET_EDITING:
            return { ...state, isEditing: action.payload };
        case PROFILE_ACTIONS.UPDATE_FORM_FIELD:
            return { ...state, formData: { ...state.formData, [action.field]: action.value } };
        case PROFILE_ACTIONS.UPDATE_NESTED_FIELD:
            const [parent, child] = action.field.split('.');
            return {
                ...state,
                formData: {
                    ...state.formData,
                    [parent]: { ...state.formData[parent], [child]: action.value }
                }
            };
        case PROFILE_ACTIONS.SET_ERRORS:
            return { ...state, errors: action.payload };
        case PROFILE_ACTIONS.CLEAR_ERROR:
            const newErrors = { ...state.errors };
            delete newErrors[action.field];
            return { ...state, errors: newErrors };
        case PROFILE_ACTIONS.SET_PHOTO_PREVIEW:
            return { ...state, photoFile: action.file, photoPreview: action.preview };
        case PROFILE_ACTIONS.SET_ALERT:
            return { ...state, alert: { open: true, message: action.message, severity: action.severity } };
        case PROFILE_ACTIONS.CLEAR_ALERT:
            return { ...state, alert: { ...state.alert, open: false } };
        case PROFILE_ACTIONS.RESET_FORM:
            return { ...state, formData: state.userData, errors: {}, photoFile: null, photoPreview: null, isEditing: false };
        case PROFILE_ACTIONS.SET_SECRETARY_INFO:
            return { ...state, secretaryInfo: action.payload };
        case PROFILE_ACTIONS.SET_SHOW_SECRETARY_MANAGER:
            return { ...state, showSecretaryManager: action.payload };
        case PROFILE_ACTIONS.SET_SHOW_SUBSCRIPTION_MANAGER:
            return { ...state, showSubscriptionManager: action.payload };
        default:
            return state;
    }
};

// Máscaras
const applyPhoneMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const applyCepMask = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
};

const applyCpfMask = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const applyFieldMask = (field, value) => {
    switch (field) {
        case 'phone': return applyPhoneMask(value);
        case 'address.cep': return applyCepMask(value);
        case 'cpf': return applyCpfMask(value);
        default: return value;
    }
};

// Validações
const isValidCpf = (cpf) => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2;
};

const validateFormData = (formData) => {
    const errors = {};
    if (!formData.fullName?.trim()) errors.fullName = 'Nome é obrigatório';
    if (!formData.email?.trim()) errors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'E-mail inválido';
    if (!formData.phone?.trim()) errors.phone = 'Telefone é obrigatório';
    if (formData.cpf && !isValidCpf(formData.cpf)) errors.cpf = 'CPF inválido';
    return errors;
};

// Hook de estado
const useProfileState = () => {
    const [state, dispatch] = useReducer(profileReducer, initialProfileState);

    const actions = useMemo(() => ({
        setLoading: (loading) => dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: loading }),
        setSaving: (saving) => dispatch({ type: PROFILE_ACTIONS.SET_SAVING, payload: saving }),
        setUserData: (userData) => dispatch({ type: PROFILE_ACTIONS.SET_USER_DATA, payload: userData }),
        setEditing: (editing) => dispatch({ type: PROFILE_ACTIONS.SET_EDITING, payload: editing }),
        setErrors: (errors) => dispatch({ type: PROFILE_ACTIONS.SET_ERRORS, payload: errors }),
        clearError: (field) => dispatch({ type: PROFILE_ACTIONS.CLEAR_ERROR, field }),
        setPhotoPreview: (file, preview) => dispatch({ type: PROFILE_ACTIONS.SET_PHOTO_PREVIEW, file, preview }),
        setAlert: (message, severity = 'success') => dispatch({ type: PROFILE_ACTIONS.SET_ALERT, message, severity }),
        clearAlert: () => dispatch({ type: PROFILE_ACTIONS.CLEAR_ALERT }),
        resetForm: () => dispatch({ type: PROFILE_ACTIONS.RESET_FORM }),
        setSecretaryInfo: (info) => dispatch({ type: PROFILE_ACTIONS.SET_SECRETARY_INFO, payload: info }),
        setShowSecretaryManager: (show) => dispatch({ type: PROFILE_ACTIONS.SET_SHOW_SECRETARY_MANAGER, payload: show }),
        setShowSubscriptionManager: (show) => dispatch({ type: PROFILE_ACTIONS.SET_SHOW_SUBSCRIPTION_MANAGER, payload: show })
    }), []);

    const updateField = useCallback((field, value) => {
        const maskedValue = applyFieldMask(field, value);
        if (field.includes('.')) {
            dispatch({ type: PROFILE_ACTIONS.UPDATE_NESTED_FIELD, field, value: maskedValue });
        } else {
            dispatch({ type: PROFILE_ACTIONS.UPDATE_FORM_FIELD, field, value: maskedValue });
        }
        if (state.errors[field]) actions.clearError(field);
    }, [state.errors, actions]);

    const debouncedValidate = useCallback(
        debounce((formData) => actions.setErrors(validateFormData(formData)), 500),
        [actions]
    );

    useEffect(() => {
        if (state.isEditing && Object.keys(state.formData).length > 0) {
            debouncedValidate(state.formData);
        }
        return () => debouncedValidate.cancel();
    }, [state.formData, state.isEditing, debouncedValidate]);

    return { state, actions, updateField };
};

// Campo de input moderno
const ModernField = React.memo(({ label, value, onChange, error, icon: Icon, disabled, type = "text" }) => (
    <Box sx={{ mb: 2 }}>
        <Typography sx={{
            fontSize: '12px',
            fontWeight: 600,
            color: themeColors.textTertiary,
            mb: 0.75,
            fontFamily: 'Gellix, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }}>
            {label}
        </Typography>
        <TextField
            fullWidth
            value={value || ""}
            onChange={onChange}
            error={!!error}
            helperText={error}
            type={type}
            disabled={disabled}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: disabled ? alpha(themeColors.backgroundSecondary, 0.5) : '#FFFFFF',
                    transition: 'all 0.2s ease',
                    '& fieldset': { borderColor: error ? themeColors.error : themeColors.borderColor },
                    '&:hover fieldset': { borderColor: error ? themeColors.error : themeColors.primary },
                    '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(themeColors.primary, 0.1)}`,
                        '& fieldset': { borderColor: themeColors.primary, borderWidth: '1px' }
                    }
                },
                '& .MuiInputBase-input': {
                    fontFamily: 'Gellix, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: themeColors.textPrimary,
                    padding: '12px 14px',
                    paddingLeft: Icon ? '42px' : '14px'
                }
            }}
            InputProps={{
                startAdornment: Icon && (
                    <InputAdornment position="start" sx={{ position: 'absolute', left: 12 }}>
                        <Icon sx={{ fontSize: 18, color: error ? themeColors.error : themeColors.textTertiary }} />
                    </InputAdornment>
                )
            }}
        />
    </Box>
));

// Card de ação rápida
const QuickActionCard = React.memo(({ icon: Icon, title, subtitle, color, onClick, active }) => (
    <Box
        onClick={onClick}
        sx={{
            p: 2,
            borderRadius: '14px',
            backgroundColor: active ? alpha(color, 0.08) : '#FFFFFF',
            border: '1px solid',
            borderColor: active ? alpha(color, 0.3) : themeColors.borderColor,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:hover': {
                backgroundColor: alpha(color, 0.06),
                borderColor: alpha(color, 0.25),
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${alpha(color, 0.12)}`
            }
        }}
    >
        <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            backgroundColor: alpha(color, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'scale(1.05)' }
        }}>
            <Icon sx={{ fontSize: 20, color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
                fontSize: '13px',
                fontWeight: 600,
                color: themeColors.textPrimary,
                fontFamily: 'Gellix, sans-serif'
            }}>
                {title}
            </Typography>
            <Typography sx={{
                fontSize: '11px',
                color: active ? color : themeColors.textTertiary,
                fontFamily: 'Gellix, sans-serif',
                fontWeight: active ? 500 : 400
            }}>
                {subtitle}
            </Typography>
        </Box>
        <ChevronRightIcon sx={{ fontSize: 18, color: themeColors.textTertiary }} />
    </Box>
));

// Linha de informação
const InfoRow = React.memo(({ icon: Icon, label, value }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: alpha(themeColors.borderColor, 0.5),
        '&:last-child': { borderBottom: 'none' }
    }}>
        <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            backgroundColor: alpha(themeColors.primary, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon sx={{ fontSize: 16, color: themeColors.primary }} />
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '11px', color: themeColors.textTertiary, fontFamily: 'Gellix, sans-serif' }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: themeColors.textPrimary, fontFamily: 'Gellix, sans-serif' }}>
                {value || '—'}
            </Typography>
        </Box>
    </Box>
));

// Skeleton de carregamento
const ProfileSkeleton = () => (
    <Box sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${themeColors.backgroundSecondary} 0%, #FFFFFF 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <CircularProgress sx={{ color: themeColors.primary }} />
    </Box>
);

// Componente principal
const UserProfileTemplate = ({ onLogout }) => {
    const auth = useAuth();
    const { user, isSecretary, userContext, getDisplayUserData, reloadUserContext } = auth;
    const { state, actions, updateField } = useProfileState();
    const [activeTab, setActiveTab] = useState(0);
    const loadingRef = useRef(false);

    const displayData = getDisplayUserData();

    const getUserPlanInfo = useCallback(() => {
        if (isSecretary) return { name: 'Secretária', color: '#10B981', icon: '👩‍💼', bg: '#ECFDF5' };
        if (state.userData.administrador) return { name: 'Admin', color: '#DC2626', icon: '👨‍💼', bg: '#FEF2F2' };
        if (state.userData.assinouPlano) {
            const planType = state.userData.planType || 'monthly';
            return plansDisplay[planType] || plansDisplay.monthly;
        }
        return plansDisplay.free;
    }, [isSecretary, state.userData]);

    const canManageSecretaries = useCallback(() => !isSecretary, [isSecretary]);

    const getFirstName = useCallback((fullName) => fullName?.split(' ')[0] || '', []);

    // Carregar dados
    const loadUserData = useCallback(async () => {
        if (!user?.uid || loadingRef.current) return;
        try {
            loadingRef.current = true;
            actions.setLoading(true);
            const userData = await globalCache.getOrSet('profileData', user.uid, async () => {
                if (isSecretary && userContext) return userContext.userData;
                return await authService.getUserData(user.uid);
            }, 2 * 60 * 1000);
            actions.setUserData(userData);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            actions.setAlert('Erro ao carregar perfil.', 'error');
        } finally {
            loadingRef.current = false;
            actions.setLoading(false);
        }
    }, [user?.uid, isSecretary, userContext, actions]);

    const loadSecretaryInfo = useCallback(async () => {
        if (!user?.uid || !canManageSecretaries() || isSecretary) return;
        try {
            const info = await globalCache.getOrSet('secretaryInfo', user.uid, async () => {
                return await secretaryService.getDoctorSecretaryInfo(user.uid);
            }, 5 * 60 * 1000);
            actions.setSecretaryInfo(info);
        } catch (error) {
            console.warn('Erro ao carregar secretária:', error);
        }
    }, [user?.uid, canManageSecretaries, isSecretary, actions]);

    const handleChange = useCallback((field) => (e) => updateField(field, e.target.value), [updateField]);

    const handleLogout = useCallback(async () => {
        try {
            actions.setLoading(true);
            if (user?.uid) {
                globalCache.invalidate('profileData', user.uid);
                globalCache.invalidate('secretaryInfo', user.uid);
            }
            if (onLogout) await onLogout();
            else await auth.logout();
        } catch (error) {
            console.error("Erro ao sair:", error);
            actions.setAlert('Erro ao sair.', 'error');
            actions.setLoading(false);
        }
    }, [onLogout, auth, user?.uid, actions]);

    const handlePhotoChange = useCallback((e) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                actions.setAlert('Arquivo muito grande. Máximo 5MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => actions.setPhotoPreview(file, event.target.result);
            reader.readAsDataURL(file);
        }
    }, [actions]);

    const handleSave = useCallback(async () => {
        if (isSecretary) {
            actions.setAlert('Sem permissão para editar.', 'warning');
            return;
        }
        const errors = validateFormData(state.formData);
        if (Object.keys(errors).length > 0) {
            actions.setErrors(errors);
            actions.setAlert('Corrija os erros antes de salvar.', 'error');
            return;
        }
        try {
            actions.setSaving(true);
            let updatedData = { ...state.formData };
            if (state.photoFile) {
                const photoPath = `users/${user.uid}/profilePhoto/${Date.now()}_${state.photoFile.name}`;
                const photoURL = await storageService.uploadFile(state.photoFile, photoPath);
                if (state.userData.photoURL && state.userData.photoURL !== photoURL) {
                    try { await storageService.deleteFile(state.userData.photoURL); } catch {}
                }
                updatedData.photoURL = photoURL;
            }
            await authService.editUserData(user.uid, updatedData);
            actions.setUserData(updatedData);
            globalCache.set('profileData', user.uid, updatedData, 2 * 60 * 1000);
            actions.setAlert('Perfil atualizado!', 'success');
            actions.setEditing(false);
            if (reloadUserContext) await reloadUserContext();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            actions.setAlert(`Erro: ${error.message}`, 'error');
        } finally {
            actions.setSaving(false);
        }
    }, [isSecretary, state, user?.uid, actions, reloadUserContext]);

    useEffect(() => {
        if (user && !auth.loading) {
            loadUserData();
            loadSecretaryInfo();
        }
    }, [user, auth.loading, loadUserData, loadSecretaryInfo]);

    const planInfo = useMemo(() => getUserPlanInfo(), [getUserPlanInfo]);
    const firstName = useMemo(() => getFirstName(displayData?.name), [getFirstName, displayData?.name]);

    if (state.loading || auth.loading) return <ProfileSkeleton />;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: `linear-gradient(180deg, ${themeColors.backgroundSecondary} 0%, #FFFFFF 50%)`,
            pb: 4
        }}>
            {/* Header do Perfil */}
            <Box sx={{
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryDark} 100%)`,
                pt: { xs: 4, md: 5 },
                pb: { xs: 8, md: 10 },
                px: { xs: 2, md: 4 },
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Círculos decorativos */}
                <Box sx={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)'
                }} />
                <Box sx={{
                    position: 'absolute',
                    bottom: -40,
                    left: -40,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)'
                }} />

                <Box sx={{ maxWidth: 900, mx: 'auto', position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Avatar */}
                            <Box sx={{ position: 'relative' }}>
                                <input
                                    accept="image/*"
                                    id="profile-photo-upload"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                    disabled={!state.isEditing || isSecretary}
                                />
                                <label htmlFor={state.isEditing && !isSecretary ? "profile-photo-upload" : ""}>
                                    <Avatar
                                        src={state.photoPreview || state.userData.photoURL}
                                        sx={{
                                            width: { xs: 72, md: 88 },
                                            height: { xs: 72, md: 88 },
                                            border: '3px solid rgba(255,255,255,0.3)',
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            color: '#FFFFFF',
                                            fontSize: { xs: '1.75rem', md: '2rem' },
                                            fontWeight: 600,
                                            cursor: state.isEditing && !isSecretary ? 'pointer' : 'default',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: state.isEditing && !isSecretary ? 'scale(1.05)' : 'none',
                                                borderColor: state.isEditing && !isSecretary ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'
                                            }
                                        }}
                                    >
                                        {displayData?.name?.charAt(0) || <PersonIcon />}
                                    </Avatar>
                                </label>
                                {state.isEditing && !isSecretary && (
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        backgroundColor: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}>
                                        <AddPhotoIcon sx={{ fontSize: 14, color: themeColors.primary }} />
                                    </Box>
                                )}
                            </Box>

                            {/* Nome e info */}
                            <Box>
                                <Typography sx={{
                                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    fontFamily: 'Gellix, sans-serif',
                                    mb: 0.25
                                }}>
                                    {isSecretary ? displayData?.name : `Dr. ${firstName}`}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.75)',
                                    fontFamily: 'Gellix, sans-serif',
                                    mb: 1
                                }}>
                                    {isSecretary ? 'Secretária' : (state.userData.especialidade || 'Médico')}
                                </Typography>
                                <Chip
                                    size="small"
                                    icon={<span style={{ fontSize: '12px', marginLeft: 8 }}>{planInfo.icon}</span>}
                                    label={planInfo.name}
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#FFFFFF',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: 24,
                                        backdropFilter: 'blur(10px)',
                                        '& .MuiChip-icon': { marginRight: -0.5 }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Botões de ação */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {state.isEditing ? (
                                <>
                                    <Tooltip title="Cancelar">
                                        <IconButton
                                            onClick={() => actions.resetForm()}
                                            disabled={state.saving}
                                            sx={{
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                color: '#FFFFFF',
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                                            }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Salvar">
                                        <IconButton
                                            onClick={handleSave}
                                            disabled={state.saving}
                                            sx={{
                                                backgroundColor: '#FFFFFF',
                                                color: themeColors.primary,
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                            }}
                                        >
                                            {state.saving ? <CircularProgress size={18} /> : <SaveIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </>
                            ) : !isSecretary && (
                                <Tooltip title="Editar perfil">
                                    <IconButton
                                        onClick={() => actions.setEditing(true)}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            color: '#FFFFFF',
                                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Conteúdo Principal */}
            <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, mt: { xs: -6, md: -8 } }}>
                {/* Card Principal */}
                <Box sx={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 4px 24px rgba(17, 30, 90, 0.08)',
                    overflow: 'hidden'
                }}>
                    {/* Tabs */}
                    <Box sx={{ borderBottom: '1px solid', borderColor: themeColors.borderColor }}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            sx={{
                                px: { xs: 2, md: 3 },
                                '& .MuiTab-root': {
                                    fontFamily: 'Gellix, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    textTransform: 'none',
                                    color: themeColors.textTertiary,
                                    minHeight: 56,
                                    '&.Mui-selected': { color: themeColors.primary }
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: themeColors.primary,
                                    height: 3,
                                    borderRadius: '3px 3px 0 0'
                                }
                            }}
                        >
                            <Tab label="Dados Pessoais" icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                            <Tab label="Endereço" icon={<LocationOnIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                        </Tabs>
                    </Box>

                    {/* Conteúdo da Tab */}
                    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        {/* Tab Dados Pessoais */}
                        <Fade in={activeTab === 0} unmountOnExit>
                            <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                                {state.isEditing ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                        <ModernField label="Nome Completo" value={state.formData.fullName} onChange={handleChange('fullName')} error={state.errors.fullName} icon={PersonIcon} disabled={isSecretary} />
                                        <ModernField label="CPF" value={state.formData.cpf} onChange={handleChange('cpf')} error={state.errors.cpf} icon={BadgeIcon} disabled={isSecretary} />
                                        <ModernField label="E-mail" value={state.formData.email} onChange={handleChange('email')} error={state.errors.email} icon={EmailIcon} type="email" disabled={isSecretary} />
                                        <ModernField label="Telefone" value={state.formData.phone} onChange={handleChange('phone')} error={state.errors.phone} icon={PhoneIcon} disabled={isSecretary} />
                                    </Box>
                                ) : (
                                    <Box>
                                        <InfoRow icon={PersonIcon} label="Nome Completo" value={state.formData.fullName} />
                                        <InfoRow icon={BadgeIcon} label="CPF" value={state.formData.cpf} />
                                        <InfoRow icon={EmailIcon} label="E-mail" value={state.formData.email} />
                                        <InfoRow icon={PhoneIcon} label="Telefone" value={state.formData.phone} />
                                    </Box>
                                )}
                            </Box>
                        </Fade>

                        {/* Tab Endereço */}
                        <Fade in={activeTab === 1} unmountOnExit>
                            <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                                {state.isEditing ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                                        <Box sx={{ gridColumn: { md: 'span 2' }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 2 }}>
                                            <ModernField label="Rua" value={state.formData.address?.street} onChange={handleChange('address.street')} icon={HomeIcon} disabled={isSecretary} />
                                            <ModernField label="Número" value={state.formData.address?.number} onChange={handleChange('address.number')} disabled={isSecretary} />
                                        </Box>
                                        <ModernField label="Complemento" value={state.formData.address?.complement} onChange={handleChange('address.complement')} icon={ApartmentIcon} disabled={isSecretary} />
                                        <ModernField label="Bairro" value={state.formData.address?.neighborhood} onChange={handleChange('address.neighborhood')} disabled={isSecretary} />
                                        <ModernField label="Cidade" value={state.formData.address?.city} onChange={handleChange('address.city')} icon={LocationCityIcon} disabled={isSecretary} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                            <ModernField label="Estado" value={state.formData.address?.state} onChange={handleChange('address.state')} disabled={isSecretary} />
                                            <ModernField label="CEP" value={state.formData.address?.cep} onChange={handleChange('address.cep')} icon={PinDropIcon} disabled={isSecretary} />
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box>
                                        {state.formData.address?.street ? (
                                            <>
                                                <InfoRow icon={HomeIcon} label="Endereço" value={`${state.formData.address.street}, ${state.formData.address.number || 'S/N'}${state.formData.address.complement ? ` - ${state.formData.address.complement}` : ''}`} />
                                                <InfoRow icon={LocationOnIcon} label="Bairro" value={state.formData.address.neighborhood} />
                                                <InfoRow icon={LocationCityIcon} label="Cidade/Estado" value={
                                                    [state.formData.address.city, state.formData.address.state]
                                                        .filter(Boolean)
                                                        .join(' - ') || '—'
                                                } />
                                                <InfoRow icon={PinDropIcon} label="CEP" value={state.formData.address.cep} />
                                            </>
                                        ) : (
                                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                                <LocationOnIcon sx={{ fontSize: 48, color: alpha(themeColors.textTertiary, 0.3), mb: 1 }} />
                                                <Typography sx={{ color: themeColors.textTertiary, fontSize: '14px', fontFamily: 'Gellix, sans-serif' }}>
                                                    Endereço não cadastrado
                                                </Typography>
                                                {!isSecretary && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => { actions.setEditing(true); setActiveTab(1); }}
                                                        sx={{ mt: 1.5, textTransform: 'none', fontFamily: 'Gellix, sans-serif' }}
                                                    >
                                                        Adicionar endereço
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Box>
                </Box>

                {/* Ações Rápidas */}
                <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {!isSecretary && (
                        <>
                            <QuickActionCard
                                icon={CreditCardIcon}
                                title="Assinatura"
                                subtitle={planInfo.name}
                                color={planInfo.color}
                                onClick={() => actions.setShowSubscriptionManager(true)}
                                active={state.userData.assinouPlano}
                            />
                            {canManageSecretaries() && (
                                <QuickActionCard
                                    icon={PeopleIcon}
                                    title="Equipe"
                                    subtitle={state.secretaryInfo ? `${state.secretaryInfo.name}` : 'Adicionar secretária'}
                                    color={state.secretaryInfo ? themeColors.success : themeColors.primary}
                                    onClick={() => actions.setShowSecretaryManager(true)}
                                    active={!!state.secretaryInfo}
                                />
                            )}
                        </>
                    )}
                </Box>

                {/* Informações da Conta */}
                <Box sx={{
                    mt: 3,
                    p: 2.5,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(17, 30, 90, 0.04)',
                    border: '1px solid',
                    borderColor: themeColors.borderColor
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: themeColors.textPrimary,
                            fontFamily: 'Gellix, sans-serif'
                        }}>
                            Conta
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: themeColors.success }} />
                            <Typography sx={{ fontSize: '11px', color: themeColors.success, fontWeight: 500, fontFamily: 'Gellix, sans-serif' }}>
                                Ativa
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <EmailIcon sx={{ fontSize: 16, color: themeColors.textTertiary }} />
                        <Typography sx={{ fontSize: '13px', color: themeColors.textSecondary, fontFamily: 'Gellix, sans-serif' }}>
                            {user?.email}
                        </Typography>
                    </Box>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        disabled={state.loading}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500,
                            color: themeColors.error,
                            borderColor: alpha(themeColors.error, 0.3),
                            py: 1.25,
                            '&:hover': {
                                backgroundColor: alpha(themeColors.error, 0.04),
                                borderColor: themeColors.error
                            }
                        }}
                    >
                        Sair da conta
                    </Button>
                </Box>

                {/* Info para secretária */}
                {isSecretary && userContext?.userData?.fullName && (
                    <Box sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: alpha(themeColors.warning, 0.08),
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: alpha(themeColors.warning, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}>
                        <PeopleIcon sx={{ fontSize: 18, color: themeColors.warning }} />
                        <Typography sx={{ fontSize: '12px', color: themeColors.textSecondary, fontFamily: 'Gellix, sans-serif' }}>
                            Trabalhando para <strong>Dr. {userContext.userData.fullName}</strong>
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Modais */}
            {!isSecretary && (
                <>
                    <SubscriptionManagerDialog
                        open={state.showSubscriptionManager}
                        onClose={() => actions.setShowSubscriptionManager(false)}
                    />
                    <SecretaryManagerDialog
                        open={state.showSecretaryManager}
                        onClose={() => actions.setShowSecretaryManager(false)}
                    />
                </>
            )}

            {/* Snackbar */}
            <Snackbar
                open={state.alert.open}
                autoHideDuration={4000}
                onClose={actions.clearAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={actions.clearAlert}
                    severity={state.alert.severity}
                    variant="filled"
                    sx={{ borderRadius: '10px', fontFamily: 'Gellix, sans-serif' }}
                >
                    {state.alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfileTemplate;
