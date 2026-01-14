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
    Check as CheckIcon,
    Business as BusinessIcon,
    Receipt as ReceiptIcon,
    LocalHospital as LocalHospitalIcon,
    Numbers as NumbersIcon
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

const applyCnpjMask = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length <= 8) return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5);
    if (digits.length <= 12) return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8);
    return digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8, 12) + "-" + digits.slice(12);
};

const applyFieldMask = (field, value) => {
    switch (field) {
        case 'phone': return applyPhoneMask(value);
        case 'telefone_comercial': return applyPhoneMask(value);
        case 'address.cep': return applyCepMask(value);
        case 'endereco_cep': return applyCepMask(value);
        case 'cpf': return applyCpfMask(value);
        case 'cnpj': return applyCnpjMask(value);
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

// Navegação por Pills
const NavPill = React.memo(({ icon: Icon, label, active, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: active ? alpha(themeColors.primary, 0.08) : 'transparent',
            color: active ? themeColors.primary : themeColors.textTertiary,
            '&:hover': {
                backgroundColor: active ? alpha(themeColors.primary, 0.12) : alpha(themeColors.textTertiary, 0.06)
            }
        }}
    >
        <Icon sx={{ fontSize: 18 }} />
        <Typography sx={{
            fontSize: '13px',
            fontWeight: active ? 600 : 500,
            fontFamily: 'Gellix, sans-serif',
            whiteSpace: 'nowrap'
        }}>
            {label}
        </Typography>
    </Box>
));

// Componente principal
const UserProfileTemplate = ({ onLogout }) => {
    const authContext = useAuth();
    const { user, isSecretary, userContext, getDisplayUserData, reloadUserContext } = authContext;
    const { state, actions, updateField } = useProfileState();
    const [activeTab, setActiveTab] = useState(0);
    const loadingRef = useRef(false);
    const fileInputRef = useRef(null);

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
            else await authContext.logout();
        } catch (error) {
            console.error("Erro ao sair:", error);
            actions.setAlert('Erro ao sair.', 'error');
            actions.setLoading(false);
        }
    }, [onLogout, authContext, user?.uid, actions]);

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

    const handleAvatarClick = useCallback(() => {
        if (state.isEditing && !isSecretary && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [state.isEditing, isSecretary]);

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
        if (user && !authContext.loading) {
            loadUserData();
            loadSecretaryInfo();
        }
    }, [user, authContext.loading, loadUserData, loadSecretaryInfo]);

    const planInfo = useMemo(() => getUserPlanInfo(), [getUserPlanInfo]);
    const firstName = useMemo(() => getFirstName(displayData?.name), [getFirstName, displayData?.name]);

    // Configuração das tabs
    const navItems = useMemo(() => [
        { icon: PersonIcon, label: 'Pessoal' },
        { icon: LocationOnIcon, label: 'Endereço' },
        { icon: BusinessIcon, label: 'Fiscal' },
        { icon: LocalHospitalIcon, label: 'Profissional' }
    ], []);

    if (state.loading || authContext.loading) return <ProfileSkeleton />;

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: '#FAFBFC',
            pb: 4
        }}>
            {/* Container Principal */}
            <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
                {/* Card do Perfil - Header Compacto */}
                <Box sx={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                    overflow: 'hidden',
                    mb: 2
                }}>
                    {/* Seção do Avatar e Info */}
                    <Box sx={{
                        p: { xs: 2.5, md: 3 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            {/* Avatar */}
                            <Box sx={{ position: 'relative' }}>
                                <input
                                    ref={fileInputRef}
                                    accept="image/*"
                                    id="profile-photo-upload"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                    disabled={!state.isEditing || isSecretary}
                                />
                                <Avatar
                                    onClick={handleAvatarClick}
                                    src={state.photoPreview || state.userData.photoURL}
                                    sx={{
                                        width: { xs: 64, md: 72 },
                                        height: { xs: 64, md: 72 },
                                        border: '2px solid',
                                        borderColor: alpha(themeColors.primary, 0.15),
                                        backgroundColor: alpha(themeColors.primary, 0.08),
                                        color: themeColors.primary,
                                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                                        fontWeight: 600,
                                        cursor: state.isEditing && !isSecretary ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: state.isEditing && !isSecretary ? themeColors.primary : alpha(themeColors.primary, 0.15),
                                            transform: state.isEditing && !isSecretary ? 'scale(1.02)' : 'none'
                                        }
                                    }}
                                >
                                    {displayData?.name?.charAt(0) || <PersonIcon />}
                                </Avatar>
                                {state.isEditing && !isSecretary && (
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '6px',
                                        backgroundColor: themeColors.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #FFFFFF',
                                        cursor: 'pointer'
                                    }}>
                                        <AddPhotoIcon sx={{ fontSize: 12, color: '#FFFFFF' }} />
                                    </Box>
                                )}
                            </Box>

                            {/* Nome e info */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                    <Typography sx={{
                                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                                        fontWeight: 700,
                                        color: themeColors.textPrimary,
                                        fontFamily: 'Gellix, sans-serif'
                                    }}>
                                        {isSecretary ? displayData?.name : `Dr. ${firstName}`}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={planInfo.name}
                                        sx={{
                                            backgroundColor: planInfo.bg,
                                            color: planInfo.color,
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            height: 22,
                                            '& .MuiChip-label': { px: 1 }
                                        }}
                                    />
                                </Box>
                                <Typography sx={{
                                    fontSize: '13px',
                                    color: themeColors.textTertiary,
                                    fontFamily: 'Gellix, sans-serif'
                                }}>
                                    {isSecretary ? 'Secretária' : (state.userData.especialidade || 'Médico')} • {user?.email}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Botões de ação */}
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {state.isEditing ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => actions.resetForm()}
                                        disabled={state.saving}
                                        startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                                        sx={{
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            fontSize: '13px',
                                            px: 2,
                                            borderColor: themeColors.borderColor,
                                            color: themeColors.textSecondary,
                                            '&:hover': {
                                                borderColor: themeColors.textTertiary,
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleSave}
                                        disabled={state.saving}
                                        startIcon={state.saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                        sx={{
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            px: 2,
                                            backgroundColor: themeColors.primary,
                                            boxShadow: 'none',
                                            '&:hover': {
                                                backgroundColor: themeColors.primaryDark,
                                                boxShadow: 'none'
                                            }
                                        }}
                                    >
                                        Salvar
                                    </Button>
                                </>
                            ) : !isSecretary && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => actions.setEditing(true)}
                                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        px: 2,
                                        borderColor: themeColors.borderColor,
                                        color: themeColors.textSecondary,
                                        '&:hover': {
                                            borderColor: themeColors.primary,
                                            backgroundColor: alpha(themeColors.primary, 0.04),
                                            color: themeColors.primary
                                        }
                                    }}
                                >
                                    Editar
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Navegação por Pills */}
                    <Box sx={{
                        px: { xs: 2, md: 3 },
                        pb: 2,
                        display: 'flex',
                        gap: 0.5,
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none'
                    }}>
                        {navItems.map((item, index) => (
                            <NavPill
                                key={index}
                                icon={item.icon}
                                label={item.label}
                                active={activeTab === index}
                                onClick={() => setActiveTab(index)}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Card de Conteúdo */}
                <Box sx={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                    overflow: 'hidden'
                }}>

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

                        {/* Tab Dados Fiscais */}
                        <Fade in={activeTab === 2} unmountOnExit>
                            <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                                {state.isEditing ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                        <ModernField label="CNPJ" value={state.formData.cnpj} onChange={handleChange('cnpj')} error={state.errors.cnpj} icon={BusinessIcon} disabled={isSecretary} />
                                        <ModernField label="Razão Social" value={state.formData.razao_social} onChange={handleChange('razao_social')} icon={BusinessIcon} disabled={isSecretary} />
                                        <ModernField label="Nome Fantasia" value={state.formData.nome_fantasia} onChange={handleChange('nome_fantasia')} icon={BusinessIcon} disabled={isSecretary} />
                                        <ModernField label="Inscrição Municipal" value={state.formData.inscricao_municipal} onChange={handleChange('inscricao_municipal')} icon={NumbersIcon} disabled={isSecretary} />
                                        <ModernField label="Inscrição Estadual" value={state.formData.inscricao_estadual} onChange={handleChange('inscricao_estadual')} icon={NumbersIcon} disabled={isSecretary} />
                                        <ModernField label="Código IBGE Município" value={state.formData.codigo_municipio_ibge} onChange={handleChange('codigo_municipio_ibge')} icon={NumbersIcon} disabled={isSecretary} />
                                        <ModernField label="Telefone Comercial" value={state.formData.telefone_comercial} onChange={handleChange('telefone_comercial')} icon={PhoneIcon} disabled={isSecretary} />
                                        <ModernField label="Email Fiscal" value={state.formData.email_fiscal} onChange={handleChange('email_fiscal')} icon={EmailIcon} type="email" disabled={isSecretary} />
                                    </Box>
                                ) : (
                                    <Box>
                                        <InfoRow icon={BusinessIcon} label="CNPJ" value={state.formData.cnpj} />
                                        <InfoRow icon={BusinessIcon} label="Razão Social" value={state.formData.razao_social} />
                                        <InfoRow icon={BusinessIcon} label="Nome Fantasia" value={state.formData.nome_fantasia} />
                                        <InfoRow icon={NumbersIcon} label="Inscrição Municipal" value={state.formData.inscricao_municipal} />
                                        <InfoRow icon={NumbersIcon} label="Inscrição Estadual" value={state.formData.inscricao_estadual} />
                                        <InfoRow icon={NumbersIcon} label="Código IBGE" value={state.formData.codigo_municipio_ibge} />
                                        <InfoRow icon={PhoneIcon} label="Telefone Comercial" value={state.formData.telefone_comercial} />
                                        <InfoRow icon={EmailIcon} label="Email Fiscal" value={state.formData.email_fiscal} />
                                    </Box>
                                )}
                            </Box>
                        </Fade>

                        {/* Tab Profissional */}
                        <Fade in={activeTab === 3} unmountOnExit>
                            <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
                                {state.isEditing ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                        <ModernField label="CRM" value={state.formData.crm} onChange={handleChange('crm')} icon={LocalHospitalIcon} disabled={isSecretary} />
                                        <ModernField label="UF do CRM" value={state.formData.crm_uf} onChange={handleChange('crm_uf')} icon={LocationOnIcon} disabled={isSecretary} />
                                        <Box sx={{ gridColumn: { md: 'span 2' } }}>
                                            <ModernField label="Especialidade" value={state.formData.especialidade} onChange={handleChange('especialidade')} icon={LocalHospitalIcon} disabled={isSecretary} />
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box>
                                        {state.formData.crm ? (
                                            <>
                                                <InfoRow icon={LocalHospitalIcon} label="CRM" value={state.formData.crm} />
                                                <InfoRow icon={LocationOnIcon} label="UF do CRM" value={state.formData.crm_uf} />
                                                <InfoRow icon={LocalHospitalIcon} label="Especialidade" value={state.formData.especialidade || state.userData.especialidade} />
                                            </>
                                        ) : (
                                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                                <LocalHospitalIcon sx={{ fontSize: 48, color: alpha(themeColors.textTertiary, 0.3), mb: 1 }} />
                                                <Typography sx={{ color: themeColors.textTertiary, fontSize: '14px', fontFamily: 'Gellix, sans-serif' }}>
                                                    Dados profissionais não cadastrados
                                                </Typography>
                                                {!isSecretary && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => { actions.setEditing(true); setActiveTab(3); }}
                                                        sx={{ mt: 1.5, textTransform: 'none', fontFamily: 'Gellix, sans-serif' }}
                                                    >
                                                        Adicionar dados profissionais
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

                {/* Configurações e Ações */}
                {!isSecretary && (
                    <Box sx={{
                        mt: 2,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: themeColors.borderColor,
                        overflow: 'hidden'
                    }}>
                        {/* Assinatura */}
                        <Box
                            onClick={() => actions.setShowSubscriptionManager(true)}
                            sx={{
                                p: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                borderBottom: canManageSecretaries() ? '1px solid' : 'none',
                                borderColor: themeColors.borderColor,
                                transition: 'background-color 0.15s ease',
                                '&:hover': { backgroundColor: '#FAFBFC' }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    backgroundColor: alpha(planInfo.color, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CreditCardIcon sx={{ fontSize: 18, color: planInfo.color }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: themeColors.textPrimary, fontFamily: 'Gellix, sans-serif' }}>
                                        Assinatura
                                    </Typography>
                                    <Typography sx={{ fontSize: '12px', color: themeColors.textTertiary, fontFamily: 'Gellix, sans-serif' }}>
                                        Plano {planInfo.name}
                                    </Typography>
                                </Box>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 20, color: themeColors.textTertiary }} />
                        </Box>

                        {/* Equipe */}
                        {canManageSecretaries() && (
                            <Box
                                onClick={() => actions.setShowSecretaryManager(true)}
                                sx={{
                                    p: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease',
                                    '&:hover': { backgroundColor: '#FAFBFC' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '10px',
                                        backgroundColor: state.secretaryInfo ? alpha(themeColors.success, 0.1) : alpha(themeColors.primary, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <PeopleIcon sx={{ fontSize: 18, color: state.secretaryInfo ? themeColors.success : themeColors.primary }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: themeColors.textPrimary, fontFamily: 'Gellix, sans-serif' }}>
                                            Equipe
                                        </Typography>
                                        <Typography sx={{ fontSize: '12px', color: themeColors.textTertiary, fontFamily: 'Gellix, sans-serif' }}>
                                            {state.secretaryInfo ? state.secretaryInfo.name : 'Adicionar secretária'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <ChevronRightIcon sx={{ fontSize: 20, color: themeColors.textTertiary }} />
                            </Box>
                        )}
                    </Box>
                )}

                {/* Info para secretária */}
                {isSecretary && userContext?.userData?.fullName && (
                    <Box sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: alpha(themeColors.warning, 0.06),
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: alpha(themeColors.warning, 0.15),
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

                {/* Sair da Conta */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="text"
                        size="small"
                        startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                        onClick={handleLogout}
                        disabled={state.loading}
                        sx={{
                            textTransform: 'none',
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500,
                            fontSize: '13px',
                            color: themeColors.textTertiary,
                            px: 2,
                            '&:hover': {
                                backgroundColor: alpha(themeColors.error, 0.04),
                                color: themeColors.error
                            }
                        }}
                    >
                        Sair da conta
                    </Button>
                </Box>
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
