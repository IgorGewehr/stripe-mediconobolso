"use client";

import React, { useReducer, useMemo, useCallback, useRef, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    TextField,
    Grid,
    Divider,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    InputAdornment,
    alpha,
    useTheme,
    Chip,
    Skeleton,
    LinearProgress
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
    Margin as MarginIcon,
    Apartment as ApartmentIcon,
    Settings as SettingsIcon,
    People as PeopleIcon
} from "@mui/icons-material";
import { debounce } from 'lodash';
import FirebaseService from "../../../lib/firebaseService";
import { useAuth } from "../providers/authProvider";
import SubscriptionManagerDialog from '../features/dialogs/SubscriptionManagerDialog';
import SecretaryManagerDialog from '../features/dialogs/SecretaryManagerDialog';
import globalCache from '../utils/globalCache';
import LogoutIcon from '@mui/icons-material/Logout';

// ✅ CONFIGURAÇÃO DE CORES OTIMIZADA
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
    lightBg: "#F1F3FA",
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.1)",
    shadowColor: "rgba(17, 30, 90, 0.05)",
};

// ✅ CONFIGURAÇÃO DOS PLANOS PARA EXIBIÇÃO
const plansDisplay = {
    free: { name: 'Gratuito', color: '#6B7280', icon: '🆓' },
    monthly: { name: 'Essencial', color: '#3B82F6', icon: '⚡' },
    quarterly: { name: 'Profissional', color: '#8B5CF6', icon: '🚀' },
    annual: { name: 'Premium', color: '#F59E0B', icon: '👑' }
};

// ✅ TIPOS DE AÇÃO PARA O REDUCER
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

// ✅ ESTADO INICIAL - CORRIGIDO
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

// ✅ REDUCER PARA GERENCIAR ESTADO COMPLEXO - CORRIGIDO
const profileReducer = (state, action) => {
    switch (action.type) {
        case PROFILE_ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };

        case PROFILE_ACTIONS.SET_SAVING:
            return { ...state, saving: action.payload };

        case PROFILE_ACTIONS.SET_USER_DATA:
            return {
                ...state,
                userData: action.payload,
                formData: action.payload,
                loading: false
            };

        case PROFILE_ACTIONS.SET_EDITING:
            return { ...state, isEditing: action.payload };

        case PROFILE_ACTIONS.UPDATE_FORM_FIELD:
            return {
                ...state,
                formData: {
                    ...state.formData,
                    [action.field]: action.value
                }
            };

        case PROFILE_ACTIONS.UPDATE_NESTED_FIELD:
            const [parent, child] = action.field.split('.');
            return {
                ...state,
                formData: {
                    ...state.formData,
                    [parent]: {
                        ...state.formData[parent],
                        [child]: action.value
                    }
                }
            };

        case PROFILE_ACTIONS.SET_ERRORS:
            return { ...state, errors: action.payload };

        case PROFILE_ACTIONS.CLEAR_ERROR:
            const newErrors = { ...state.errors };
            delete newErrors[action.field];
            return { ...state, errors: newErrors };

        case PROFILE_ACTIONS.SET_PHOTO_PREVIEW:
            return {
                ...state,
                photoFile: action.file,
                photoPreview: action.preview
            };

        case PROFILE_ACTIONS.SET_ALERT:
            return {
                ...state,
                alert: {
                    open: true,
                    message: action.message,
                    severity: action.severity
                }
            };

        case PROFILE_ACTIONS.CLEAR_ALERT:
            return {
                ...state,
                alert: { ...state.alert, open: false }
            };

        case PROFILE_ACTIONS.RESET_FORM:
            return {
                ...state,
                formData: state.userData,
                errors: {},
                photoFile: null,
                photoPreview: null,
                isEditing: false
            };

        case PROFILE_ACTIONS.SET_SECRETARY_INFO:
            return { ...state, secretaryInfo: action.payload };

        // ✅ NOVOS CASOS ADICIONADOS
        case PROFILE_ACTIONS.SET_SHOW_SECRETARY_MANAGER:
            return { ...state, showSecretaryManager: action.payload };

        case PROFILE_ACTIONS.SET_SHOW_SUBSCRIPTION_MANAGER:
            return { ...state, showSubscriptionManager: action.payload };

        default:
            return state;
    }
};

// ✅ FUNÇÕES DE MÁSCARA OTIMIZADAS
const applyPhoneMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
};

const applyCepMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
};

const applyCpfMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// ✅ FUNÇÃO PARA APLICAR MÁSCARAS
const applyFieldMask = (field, value) => {
    switch (field) {
        case 'phone':
            return applyPhoneMask(value);
        case 'address.cep':
            return applyCepMask(value);
        case 'cpf':
            return applyCpfMask(value);
        default:
            return value;
    }
};

// ✅ VALIDAÇÃO DE CPF
const isValidCpf = (cpf) => {
    const numbers = cpf.replace(/\D/g, "");

    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2;
};

// ✅ VALIDAÇÃO DE CEP
const isValidCep = (cep) => {
    const numbers = cep.replace(/\D/g, "");
    return /^\d{8}$/.test(numbers);
};

// ✅ VALIDAÇÃO OTIMIZADA DE FORMULÁRIO
const validateFormData = (formData) => {
    const errors = {};

    // Validação de nome
    if (!formData.fullName?.trim()) {
        errors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.trim().length < 3) {
        errors.fullName = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validação de email
    if (!formData.email?.trim()) {
        errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'E-mail inválido';
    }

    // Validação de telefone
    if (!formData.phone?.trim()) {
        errors.phone = 'Telefone é obrigatório';
    } else {
        const phoneNumbers = formData.phone.replace(/\D/g, "");
        if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
            errors.phone = 'Telefone deve ter 10 ou 11 dígitos';
        }
    }

    // Validação de CPF
    if (!formData.cpf?.trim()) {
        errors.cpf = 'CPF é obrigatório';
    } else if (!isValidCpf(formData.cpf)) {
        errors.cpf = 'CPF inválido';
    }

    // Validação de endereço
    if (formData.address) {
        if (!formData.address.street?.trim()) {
            errors['address.street'] = 'Endereço é obrigatório';
        }
        if (!formData.address.city?.trim()) {
            errors['address.city'] = 'Cidade é obrigatória';
        }
        if (!formData.address.state?.trim()) {
            errors['address.state'] = 'Estado é obrigatório';
        }
        if (formData.address.cep && !isValidCep(formData.address.cep)) {
            errors['address.cep'] = 'CEP inválido';
        }
    }

    return errors;
};

// ✅ HOOK PERSONALIZADO PARA GERENCIAR ESTADO DO PERFIL - CORRIGIDO
const useProfileState = () => {
    const [state, dispatch] = useReducer(profileReducer, initialProfileState);
    const validateTimeoutRef = useRef(null);

    // ✅ AÇÕES MEMOIZADAS - CORRIGIDAS COM NOVAS FUNÇÕES
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
        // ✅ NOVAS FUNÇÕES ADICIONADAS
        setShowSecretaryManager: (show) => dispatch({ type: PROFILE_ACTIONS.SET_SHOW_SECRETARY_MANAGER, payload: show }),
        setShowSubscriptionManager: (show) => dispatch({ type: PROFILE_ACTIONS.SET_SHOW_SUBSCRIPTION_MANAGER, payload: show })
    }), []);

    // ✅ FUNÇÃO OTIMIZADA PARA ATUALIZAR CAMPOS
    const updateField = useCallback((field, value) => {
        // Aplicar máscaras se necessário
        const maskedValue = applyFieldMask(field, value);

        if (field.includes('.')) {
            dispatch({
                type: PROFILE_ACTIONS.UPDATE_NESTED_FIELD,
                field,
                value: maskedValue
            });
        } else {
            dispatch({
                type: PROFILE_ACTIONS.UPDATE_FORM_FIELD,
                field,
                value: maskedValue
            });
        }

        // Limpar erro do campo se existir
        if (state.errors[field]) {
            actions.clearError(field);
        }
    }, [state.errors, actions]);

    // ✅ VALIDAÇÃO DEBOUNCED PARA MELHOR UX
    const debouncedValidate = useCallback(
        debounce((formData) => {
            const errors = validateFormData(formData);
            actions.setErrors(errors);
        }, 500),
        [actions]
    );

    // ✅ EXECUTAR VALIDAÇÃO QUANDO FORM DATA MUDAR
    useEffect(() => {
        if (state.isEditing && Object.keys(state.formData).length > 0) {
            debouncedValidate(state.formData);
        }

        return () => {
            debouncedValidate.cancel();
        };
    }, [state.formData, state.isEditing, debouncedValidate]);

    return { state, actions, updateField };
};

// ✅ HOOK PARA OTIMIZAR RE-RENDERS DO FORMULÁRIO
const useFormOptimization = (formData, errors) => {
    // Memoizar campos calculados para evitar re-renders
    const formStatus = useMemo(() => ({
        hasChanges: Object.keys(formData).length > 0,
        hasErrors: Object.keys(errors).length > 0,
        isValid: Object.keys(errors).length === 0 && Object.keys(formData).length > 0
    }), [formData, errors]);

    // Memoizar configuração de campos
    const fieldConfig = useMemo(() => ({
        fullName: { required: true, type: 'text', icon: PersonIcon },
        email: { required: true, type: 'email', icon: EmailIcon },
        phone: { required: true, type: 'tel', icon: PhoneIcon, mask: 'phone' },
        cpf: { required: true, type: 'text', icon: BadgeIcon, mask: 'cpf' },
        'address.street': { required: true, type: 'text', icon: HomeIcon },
        'address.number': { required: false, type: 'text', icon: MarginIcon },
        'address.complement': { required: false, type: 'text', icon: ApartmentIcon },
        'address.neighborhood': { required: false, type: 'text', icon: LocationOnIcon },
        'address.city': { required: true, type: 'text', icon: LocationCityIcon },
        'address.state': { required: true, type: 'text', icon: LocationOnIcon },
        'address.cep': { required: false, type: 'text', icon: PinDropIcon, mask: 'cep' }
    }), []);

    return { formStatus, fieldConfig };
};

// ✅ COMPONENTE EDITÁVEL OTIMIZADO E MEMOIZADO
const EditableField = React.memo(({
                                      label,
                                      value,
                                      isEditing,
                                      onChange,
                                      error,
                                      helperText,
                                      type = "text",
                                      required = false,
                                      startIcon,
                                      disabled = false,
                                      multiline = false,
                                      rows = 1,
                                      ...props
                                  }) => {
    return (
        <Box sx={{ mb: 2.5, position: 'relative' }}>
            {isEditing ? (
                <TextField
                    fullWidth
                    label={label}
                    value={value || ""}
                    onChange={onChange}
                    error={!!error}
                    helperText={helperText}
                    required={required}
                    type={type}
                    disabled={disabled}
                    multiline={multiline}
                    rows={rows}
                    variant="outlined"
                    sx={{
                        '& .MuiInputLabel-root': {
                            color: themeColors.textTertiary,
                            fontFamily: 'Gellix, sans-serif',
                            fontWeight: 500,
                            fontSize: '14px',
                            '&.Mui-focused': {
                                color: error ? themeColors.error : themeColors.primary,
                            }
                        },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            '& fieldset': {
                                borderColor: error ? themeColors.error : themeColors.borderColor,
                            },
                            '&:hover fieldset': {
                                borderColor: error ? themeColors.error : themeColors.primary,
                            },
                            '&.Mui-focused': {
                                '& fieldset': {
                                    borderColor: error ? themeColors.error : themeColors.primary,
                                    borderWidth: '1px',
                                },
                            }
                        },
                        '& .MuiInputBase-input': {
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '14px',
                            color: themeColors.textPrimary,
                            padding: '12px 14px',
                        },
                        '& .MuiFormHelperText-root': {
                            fontFamily: 'Gellix, sans-serif',
                            marginLeft: '4px',
                            fontSize: '12px',
                        }
                    }}
                    InputProps={{
                        startAdornment: startIcon ? (
                            <InputAdornment position="start">
                                <Box sx={{
                                    color: error ? themeColors.error : themeColors.primary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    mr: 0.5
                                }}>
                                    {React.createElement(startIcon, { fontSize: 'small' })}
                                </Box>
                            </InputAdornment>
                        ) : null
                    }}
                    {...props}
                />
            ) : (
                <Box
                    sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: themeColors.borderColor,
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'flex-start',
                    }}
                >
                    {startIcon && (
                        <Box
                            sx={{
                                color: themeColors.primary,
                                mr: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.3,
                            }}
                        >
                            {React.createElement(startIcon, { fontSize: 'small' })}
                        </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: themeColors.textTertiary,
                                fontFamily: "Gellix, sans-serif",
                                fontSize: '12px',
                                fontWeight: 500,
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            {label} {required && <span style={{ color: themeColors.error }}>*</span>}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: value ? (disabled ? themeColors.textTertiary : themeColors.textPrimary) : alpha(themeColors.textTertiary, 0.7),
                                fontFamily: "Gellix, sans-serif",
                                fontSize: '14px',
                                fontWeight: 500,
                                wordBreak: multiline ? "break-word" : "normal",
                                whiteSpace: multiline ? "pre-wrap" : "normal",
                                fontStyle: value ? 'normal' : 'italic',
                            }}
                        >
                            {value || "Não informado"}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
});

// ✅ COMPONENTE DE LOADING SKELETON
const ProfileSkeleton = React.memo(() => (
    <Box sx={{ py: 2, px: { xs: 2, md: 3 } }}>
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '20px', p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={120} height={120} sx={{ mb: 2 }} />
                        <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width={150} height={20} sx={{ mb: 2 }} />
                        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: '50px' }} />
                    </Box>
                </Card>
            </Grid>
            <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: '12px', p: 3 }}>
                    <Skeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                        {[1, 2, 3, 4].map((item) => (
                            <Grid item xs={12} md={6} key={item}>
                                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px', mb: 2 }} />
                            </Grid>
                        ))}
                    </Grid>
                </Card>
            </Grid>
        </Grid>
    </Box>
));

// ✅ COMPONENTE PRINCIPAL OTIMIZADO
const UserProfileTemplate = ({ onLogout }) => {
    const theme = useTheme();
    const auth = useAuth();
    const { user, isSecretary, userContext, getDisplayUserData, reloadUserContext } = auth;

    // ✅ USAR HOOK PERSONALIZADO PARA ESTADO
    const { state, actions, updateField } = useProfileState();
    const { formStatus, fieldConfig } = useFormOptimization(state.formData, state.errors);

    // ✅ REFS PARA PERFORMANCE
    const loadingRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    // ✅ OBTER DADOS DE EXIBIÇÃO BASEADOS NO CONTEXTO
    const displayData = getDisplayUserData();

    // ✅ FUNÇÃO PARA DETERMINAR TIPO DE PLANO BASEADO NO CONTEXTO
    const getUserPlanInfo = useCallback(() => {
        if (isSecretary) {
            return { name: 'Secretária', color: '#10B981', icon: '👩‍💼' };
        }

        if (state.userData.administrador) {
            return { name: 'Administrador', color: '#DC2626', icon: '👨‍💼' };
        }

        if (state.userData.assinouPlano) {
            const planType = state.userData.planType || 'monthly';
            return plansDisplay[planType] || plansDisplay.monthly;
        }

        return plansDisplay.free;
    }, [isSecretary, state.userData]);

    const canManageSecretaries = useCallback(() => {
        if (isSecretary) return false; // Apenas secretárias não podem gerenciar outras secretárias
        return true; // ✅ Todos os médicos podem gerenciar secretárias
    }, [isSecretary]);


    // ✅ FUNÇÃO PARA OBTER PRIMEIRO NOME
    const getFirstName = useCallback((fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    }, []);

    // ✅ CARREGAR DADOS DO USUÁRIO BASEADO NO CONTEXTO - OTIMIZADO
    const loadUserData = useCallback(async () => {
        if (!user?.uid || loadingRef.current) return;

        try {
            loadingRef.current = true;
            actions.setLoading(true);

            // ✅ USAR CACHE PARA DADOS DO USUÁRIO
            const userData = await globalCache.getOrSet('profileData', user.uid, async () => {
                if (isSecretary && userContext) {
                    return userContext.userData;
                } else {
                    return await FirebaseService.getUserData(user.uid);
                }
            }, 2 * 60 * 1000); // 2 minutos de cache

            actions.setUserData(userData);
            console.log('✅ Dados do usuário carregados com sucesso');

        } catch (error) {
            console.error("❌ Erro ao carregar dados do usuário:", error);
            actions.setAlert('Erro ao carregar dados do perfil.', 'error');
        } finally {
            loadingRef.current = false;
            actions.setLoading(false);
        }
    }, [user?.uid, isSecretary, userContext, actions]);

    // ✅ CARREGAR INFORMAÇÕES DA SECRETÁRIA - CORRIGIDO
    const loadSecretaryInfo = useCallback(async () => {
        // ✅ VERIFICAÇÃO ADICIONADA PARA PREVENIR ERRO
        if (!user?.uid || !canManageSecretaries() || isSecretary) {
            console.log('⚠️ Não é possível carregar informações da secretária:', {
                hasUser: !!user?.uid,
                canManage: canManageSecretaries(),
                isSecretary
            });
            return;
        }

        try {
            const info = await globalCache.getOrSet('secretaryInfo', user.uid, async () => {
                return await FirebaseService.getDoctorSecretaryInfo(user.uid);
            }, 5 * 60 * 1000); // 5 minutos de cache

            actions.setSecretaryInfo(info);
        } catch (error) {
            console.warn('⚠️ Erro ao carregar informações da secretária:', error);
            // Não mostrar erro para o usuário pois é informação opcional
        }
    }, [user?.uid, canManageSecretaries, isSecretary, actions]);

    // ✅ HANDLER PARA MUDANÇAS NOS CAMPOS - OTIMIZADO
    const handleChange = useCallback((field) => (e) => {
        const value = e.target.value;
        updateField(field, value);
    }, [updateField]);

    // ✅ HANDLER DE LOGOUT MELHORADO
    const handleLogout = useCallback(async () => {
        try {
            console.log('🚪 Iniciando logout do UserProfile...');
            actions.setLoading(true);

            // Limpar cache relacionado ao usuário
            if (user?.uid) {
                globalCache.invalidate('profileData', user.uid);
                globalCache.invalidate('secretaryInfo', user.uid);
            }

            if (onLogout) {
                await onLogout();
            } else {
                await auth.logout();
            }
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
            actions.setAlert('Erro ao fazer logout. Tente novamente.', 'error');
            actions.setLoading(false);
        }
    }, [onLogout, auth, user?.uid, actions]);

    // ✅ HANDLER PARA UPLOAD DE FOTO - OTIMIZADO
    const handlePhotoChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validar tamanho do arquivo (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                actions.setAlert('Arquivo muito grande. Máximo 5MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                actions.setPhotoPreview(file, event.target.result);
            };
            reader.readAsDataURL(file);
        }
    }, [actions]);

    // ✅ VALIDAÇÃO DO FORMULÁRIO - OTIMIZADA
    const validateForm = useCallback(() => {
        const errors = validateFormData(state.formData);
        actions.setErrors(errors);
        return Object.keys(errors).length === 0;
    }, [state.formData, actions]);

    // ✅ HANDLER PARA SALVAR ALTERAÇÕES - OTIMIZADO
    const handleSave = useCallback(async () => {
        // Secretárias não podem editar dados do médico
        if (isSecretary) {
            actions.setAlert('Secretárias não podem editar dados do médico.', 'warning');
            return;
        }

        if (!validateForm()) {
            actions.setAlert('Por favor, corrija os campos com erro antes de salvar.', 'error');
            return;
        }

        try {
            actions.setSaving(true);
            let updatedData = { ...state.formData };

            // ✅ UPLOAD DE FOTO SE HOUVER
            if (state.photoFile) {
                try {
                    const photoPath = `users/${user.uid}/profilePhoto/${Date.now()}_${state.photoFile.name}`;
                    const photoURL = await FirebaseService.uploadFile(state.photoFile, photoPath);

                    // Deletar foto anterior se existir
                    if (state.userData.photoURL && state.userData.photoURL !== photoURL) {
                        try {
                            await FirebaseService.deleteFile(state.userData.photoURL);
                        } catch (error) {
                            console.warn("⚠️ Erro ao deletar foto antiga:", error);
                        }
                    }

                    updatedData.photoURL = photoURL;
                } catch (error) {
                    console.error("❌ Erro ao fazer upload da foto:", error);
                    throw new Error("Erro ao fazer upload da foto de perfil.");
                }
            }

            // ✅ ATUALIZAR DADOS NO FIREBASE
            await FirebaseService.editUserData(user.uid, updatedData);

            // ✅ ATUALIZAR DADOS LOCAIS E CACHE
            actions.setUserData(updatedData);
            globalCache.set('profileData', user.uid, updatedData, 2 * 60 * 1000);

            actions.setAlert('Perfil atualizado com sucesso!', 'success');
            actions.setEditing(false);

            // ✅ RECARREGAR CONTEXTO SE NECESSÁRIO
            if (reloadUserContext) {
                await reloadUserContext();
            }

        } catch (error) {
            console.error("❌ Erro ao salvar perfil:", error);
            actions.setAlert(`Erro ao salvar alterações: ${error.message}`, 'error');
        } finally {
            actions.setSaving(false);
        }
    }, [isSecretary, validateForm, state, user?.uid, actions, reloadUserContext]);

    // ✅ HANDLER PARA CANCELAR EDIÇÃO
    const handleCancel = useCallback(() => {
        actions.resetForm();
    }, [actions]);

    // ✅ CARREGAR DADOS INICIAIS
    useEffect(() => {
        if (user && !auth.loading) {
            loadUserData();
            loadSecretaryInfo();
        }
    }, [user, auth.loading, loadUserData, loadSecretaryInfo]);

    // ✅ CLEANUP AO DESMONTAR
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // ✅ VALORES MEMOIZADOS PARA PERFORMANCE
    const planInfo = useMemo(() => getUserPlanInfo(), [getUserPlanInfo]);
    const firstName = useMemo(() => getFirstName(displayData?.name), [getFirstName, displayData?.name]);

    // ✅ MOSTRAR SKELETON DURANTE CARREGAMENTO
    if (state.loading || auth.loading) {
        return <ProfileSkeleton />;
    }

    return (
        <Box sx={{ py: 2, px: { xs: 2, md: 3 } }}>
            <Grid container spacing={3}>
                {/* ✅ COLUNA DA ESQUERDA - FOTO E INFORMAÇÕES BÁSICAS */}
                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '20px',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                            overflow: 'visible',
                            position: 'relative',
                            mb: 3
                        }}
                    >
                        <Box sx={{
                            position: 'relative',
                            pt: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            {/* ✅ AVATAR COM UPLOAD */}
                            <input
                                accept="image/*"
                                id="profile-photo-upload"
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handlePhotoChange}
                                disabled={!state.isEditing || isSecretary}
                            />
                            <label htmlFor={state.isEditing && !isSecretary ? "profile-photo-upload" : ""}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={state.photoPreview || state.userData.photoURL}
                                        alt={displayData?.name || "Perfil"}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            border: `3px solid ${themeColors.primary}`,
                                            backgroundColor: alpha(themeColors.primary, 0.1),
                                            color: themeColors.primary,
                                            fontSize: '3rem',
                                            fontWeight: 600,
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            cursor: state.isEditing && !isSecretary ? 'pointer' : 'default',
                                            "&:hover": {
                                                transform: state.isEditing && !isSecretary ? "scale(1.05)" : "none",
                                                boxShadow: state.isEditing && !isSecretary ? "0 4px 20px rgba(24, 82, 254, 0.15)" : "none",
                                            },
                                        }}
                                    >
                                        {displayData?.name ? displayData.name.charAt(0) : <PersonIcon fontSize="large" />}
                                    </Avatar>

                                    {state.isEditing && !isSecretary && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                backgroundColor: themeColors.primary,
                                                borderRadius: '50%',
                                                width: 36,
                                                height: 36,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                                                border: '2px solid white',
                                            }}
                                        >
                                            <AddPhotoIcon sx={{ color: 'white', fontSize: 20 }} />
                                        </Box>
                                    )}
                                </Box>
                            </label>

                            {/* ✅ NOME E TÍTULO */}
                            <Typography
                                variant="h5"
                                sx={{
                                    mt: 2,
                                    fontWeight: 600,
                                    color: themeColors.textPrimary,
                                    fontFamily: "Gellix, sans-serif",
                                    textAlign: 'center'
                                }}
                            >
                                {isSecretary ? displayData?.name : `Dr. ${firstName}`}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: themeColors.textSecondary,
                                    fontFamily: "Gellix, sans-serif",
                                    mb: 2,
                                    textAlign: 'center'
                                }}
                            >
                                {isSecretary ? 'Secretária' : (state.userData.especialidade || "Médico")}
                            </Typography>

                            {/* ✅ INFORMAÇÃO ESPECIAL PARA SECRETÁRIAS */}
                            {isSecretary && userContext?.userData?.fullName && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: themeColors.textTertiary,
                                        fontFamily: "Gellix, sans-serif",
                                        mb: 2,
                                        textAlign: 'center',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    Trabalhando para Dr. {userContext.userData.fullName}
                                </Typography>
                            )}

                            {/* ✅ CHIP DO PLANO ATUAL */}
                            <Chip
                                icon={<span style={{ fontSize: '16px' }}>{planInfo.icon}</span>}
                                label={planInfo.name}
                                sx={{
                                    mb: 2,
                                    backgroundColor: alpha(planInfo.color, 0.1),
                                    color: planInfo.color,
                                    borderColor: planInfo.color,
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                                variant="outlined"
                            />

                            {/* ✅ BOTÕES DE AÇÃO */}
                            {!state.isEditing && !isSecretary ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => actions.setEditing(true)}
                                    sx={{
                                        borderRadius: '50px',
                                        mb: 3,
                                        textTransform: 'none',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontWeight: 500,
                                        px: 3
                                    }}
                                >
                                    Editar Perfil
                                </Button>
                            ) : state.isEditing && !isSecretary ? (
                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloseIcon />}
                                        onClick={handleCancel}
                                        disabled={state.saving}
                                        sx={{
                                            borderRadius: '50px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            borderColor: 'grey.400',
                                            color: 'grey.700',
                                            '&:hover': {
                                                borderColor: 'grey.600',
                                                backgroundColor: 'grey.100'
                                            }
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={state.saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                        onClick={handleSave}
                                        disabled={state.saving || !formStatus.isValid}
                                        sx={{
                                            borderRadius: '50px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            backgroundColor: themeColors.primary,
                                            boxShadow: '0 2px 10px rgba(24, 82, 254, 0.2)',
                                            '&:hover': {
                                                backgroundColor: themeColors.primaryDark,
                                                boxShadow: '0 4px 15px rgba(24, 82, 254, 0.3)'
                                            }
                                        }}
                                    >
                                        {state.saving ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </Box>
                            ) : isSecretary ? (
                                <Alert severity="info" sx={{ mb: 3, maxWidth: 300 }}>
                                    <Typography variant="caption">
                                        Secretárias não podem editar dados do médico
                                    </Typography>
                                </Alert>
                            ) : null}
                        </Box>
                    </Card>

                    {/* ✅ CARD DE INFORMAÇÕES DA CONTA */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '20px',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 600,
                                    color: themeColors.textPrimary,
                                    fontFamily: "Gellix, sans-serif"
                                }}
                            >
                                Informações de Conta
                            </Typography>

                            {/* E-mail de Login */}
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        color: themeColors.textTertiary,
                                        fontFamily: "Gellix, sans-serif",
                                        mb: 0.5
                                    }}
                                >
                                    E-mail de Login
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <EmailIcon
                                        fontSize="small"
                                        sx={{ color: themeColors.primary, mr: 1 }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: themeColors.textPrimary,
                                            fontFamily: "Gellix, sans-serif",
                                            fontWeight: 500
                                        }}
                                    >
                                        {user?.email || "-"}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Status da Conta */}
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        color: themeColors.textTertiary,
                                        fontFamily: "Gellix, sans-serif",
                                        mb: 0.5
                                    }}
                                >
                                    Status da Conta
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: themeColors.success,
                                            mr: 1
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: themeColors.success,
                                            fontFamily: "Gellix, sans-serif",
                                            fontWeight: 500
                                        }}
                                    >
                                        Ativo
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Seção de Secretárias (apenas para médicos) */}
                            {!isSecretary && canManageSecretaries() && (
                                <Box
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        borderRadius: '12px',
                                        backgroundColor: state.secretaryInfo
                                            ? alpha(themeColors.success, 0.05)
                                            : alpha(themeColors.primary, 0.03),
                                        border: '1px solid',
                                        borderColor: state.secretaryInfo
                                            ? alpha(themeColors.success, 0.15)
                                            : alpha(themeColors.primary, 0.1),
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: state.secretaryInfo
                                                ? alpha(themeColors.success, 0.08)
                                                : alpha(themeColors.primary, 0.06),
                                            transform: 'translateY(-1px)'
                                        }
                                    }}
                                    onClick={() => actions.setShowSecretaryManager(true)}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '10px',
                                                    backgroundColor: state.secretaryInfo
                                                        ? alpha(themeColors.success, 0.15)
                                                        : alpha(themeColors.primary, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <PeopleIcon
                                                    sx={{
                                                        fontSize: 20,
                                                        color: state.secretaryInfo ? themeColors.success : themeColors.primary
                                                    }}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: themeColors.textPrimary,
                                                        fontFamily: "Gellix, sans-serif",
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    {state.secretaryInfo ? 'Sua Equipe' : 'Secretárias'}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: state.secretaryInfo ? themeColors.success : themeColors.textTertiary,
                                                        fontFamily: "Gellix, sans-serif",
                                                        fontWeight: state.secretaryInfo ? 500 : 400
                                                    }}
                                                >
                                                    {state.secretaryInfo
                                                        ? `${state.secretaryInfo.name} ativa`
                                                        : 'Adicionar secretária'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '8px',
                                                backgroundColor: state.secretaryInfo
                                                    ? alpha(themeColors.success, 0.15)
                                                    : alpha(themeColors.primary, 0.1),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <SettingsIcon
                                                sx={{
                                                    fontSize: 16,
                                                    color: state.secretaryInfo ? themeColors.success : themeColors.primary
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {/* Botões de Gerenciamento */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                                {/* Botão de gerenciar assinatura (apenas para médicos) */}
                                {!isSecretary && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<SettingsIcon />}
                                        onClick={() => actions.setShowSubscriptionManager(true)}
                                        fullWidth
                                        sx={{
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            color: themeColors.primary,
                                            borderColor: alpha(themeColors.primary, 0.5),
                                            py: 1,
                                            '&:hover': {
                                                backgroundColor: alpha(themeColors.primary, 0.08),
                                                borderColor: themeColors.primary
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Gerenciar Assinatura
                                    </Button>
                                )}

                                {/* Botão de logout */}
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<LogoutIcon />}
                                    onClick={handleLogout}
                                    fullWidth
                                    disabled={state.loading}
                                    sx={{
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontWeight: 500,
                                        color: themeColors.error,
                                        borderColor: alpha(themeColors.error, 0.5),
                                        py: 1,
                                        '&:hover': {
                                            backgroundColor: alpha(themeColors.error, 0.08),
                                            borderColor: themeColors.error
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {state.loading ? <CircularProgress size={20} /> : 'Sair da Conta'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ✅ COLUNA DA DIREITA - DETALHES PROFISSIONAIS */}
                <Grid item xs={12} md={8}>
                    {/* ✅ CARTÃO DE INFORMAÇÕES PESSOAIS */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '12px',
                            boxShadow: '0px 2px 10px rgba(17, 30, 90, 0.08)',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid',
                            borderColor: themeColors.borderColor,
                            bgcolor: '#FFFFFF',
                            mb: 3
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            {/* Progress bar durante salvamento */}
                            {state.saving && (
                                <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <PersonIcon
                                        sx={{
                                            color: themeColors.primary,
                                            mr: 1.5,
                                            fontSize: 20
                                        }}
                                    />
                                    Dados Pessoais
                                </Typography>

                                {!state.isEditing && !isSecretary ? (
                                    <IconButton
                                        onClick={() => actions.setEditing(true)}
                                        size="small"
                                        sx={{ color: themeColors.primary }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2.5}>
                                {/* ✅ CAMPOS DO FORMULÁRIO */}
                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Nome Completo"
                                        value={state.formData.fullName || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('fullName')}
                                        error={state.errors.fullName}
                                        helperText={state.errors.fullName}
                                        required
                                        startIcon={PersonIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="CPF"
                                        value={state.formData.cpf || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('cpf')}
                                        error={state.errors.cpf}
                                        helperText={state.errors.cpf}
                                        required
                                        startIcon={BadgeIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="E-mail"
                                        value={state.formData.email || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('email')}
                                        error={state.errors.email}
                                        helperText={state.errors.email}
                                        required
                                        startIcon={EmailIcon}
                                        type="email"
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Telefone"
                                        value={state.formData.phone || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('phone')}
                                        error={state.errors.phone}
                                        helperText={state.errors.phone}
                                        required
                                        startIcon={PhoneIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* ✅ CARTÃO DE ENDEREÇO */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '12px',
                            boxShadow: '0px 2px 10px rgba(17, 30, 90, 0.08)',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid',
                            borderColor: themeColors.borderColor,
                            bgcolor: '#FFFFFF'
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 600,
                                        color: themeColors.textPrimary,
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <LocationOnIcon
                                        sx={{
                                            color: themeColors.primary,
                                            mr: 1.5,
                                            fontSize: 20
                                        }}
                                    />
                                    Endereço
                                </Typography>

                                {!state.isEditing && !isSecretary ? (
                                    <IconButton
                                        onClick={() => actions.setEditing(true)}
                                        size="small"
                                        sx={{ color: themeColors.primary }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            {/* ✅ VISUALIZAÇÃO DO ENDEREÇO QUANDO NÃO EDITANDO */}
                            {!state.isEditing && (
                                <Box
                                    sx={{
                                        mb: 3,
                                        p: 2,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: themeColors.borderColor,
                                        bgcolor: alpha(themeColors.backgroundSecondary, 0.3)
                                    }}
                                >
                                    {state.formData.address?.street ? (
                                        <>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: themeColors.textPrimary,
                                                    fontFamily: "Gellix, sans-serif",
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                <HomeIcon sx={{ color: themeColors.primary, mr: 1.5, fontSize: 18 }} />
                                                {state.formData.address?.street}, {state.formData.address?.number || 'S/N'}
                                                {state.formData.address?.complement ? ` - ${state.formData.address.complement}` : ''}
                                                {state.formData.address?.neighborhood ? `, ${state.formData.address.neighborhood}` : ''}
                                            </Typography>

                                            {state.formData.address?.city && (
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: themeColors.textPrimary,
                                                        fontFamily: "Gellix, sans-serif",
                                                        fontWeight: 500,
                                                        mt: 1.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    <LocationCityIcon sx={{ color: themeColors.primary, mr: 1.5, fontSize: 18 }} />
                                                    {state.formData.address?.city} - {state.formData.address?.state}
                                                    {state.formData.address?.cep ? `, CEP ${state.formData.address.cep}` : ''}
                                                </Typography>
                                            )}
                                        </>
                                    ) : (
                                        <Typography
                                            sx={{
                                                fontStyle: 'italic',
                                                color: alpha(themeColors.textTertiary, 0.7),
                                                fontFamily: "Gellix, sans-serif",
                                                fontSize: '14px'
                                            }}
                                        >
                                            Endereço não informado
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* ✅ CAMPOS DO ENDEREÇO */}
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={8}>
                                    <EditableField
                                        label="Rua"
                                        value={state.formData.address?.street || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.street')}
                                        error={state.errors['address.street']}
                                        helperText={state.errors['address.street']}
                                        required
                                        startIcon={HomeIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <EditableField
                                        label="Número"
                                        value={state.formData.address?.number || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.number')}
                                        startIcon={MarginIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Complemento"
                                        value={state.formData.address?.complement || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.complement')}
                                        startIcon={ApartmentIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Bairro"
                                        value={state.formData.address?.neighborhood || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.neighborhood')}
                                        startIcon={LocationOnIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <EditableField
                                        label="CEP"
                                        value={state.formData.address?.cep || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.cep')}
                                        startIcon={PinDropIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <EditableField
                                        label="Cidade"
                                        value={state.formData.address?.city || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.city')}
                                        error={state.errors['address.city']}
                                        helperText={state.errors['address.city']}
                                        required
                                        startIcon={LocationCityIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <EditableField
                                        label="Estado"
                                        value={state.formData.address?.state || ""}
                                        isEditing={state.isEditing && !isSecretary}
                                        onChange={handleChange('address.state')}
                                        error={state.errors['address.state']}
                                        helperText={state.errors['address.state']}
                                        required
                                        startIcon={LocationOnIcon}
                                        disabled={isSecretary}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ✅ MODAIS */}
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

            {/* ✅ ALERTA DE FEEDBACK */}
            <Snackbar
                open={state.alert.open}
                autoHideDuration={6000}
                onClose={actions.clearAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={actions.clearAlert}
                    severity={state.alert.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontFamily: 'Gellix, sans-serif',
                        borderRadius: '10px'
                    }}
                >
                    {state.alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfileTemplate;