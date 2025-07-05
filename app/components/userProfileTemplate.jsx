"use client";

import React, {useState, useEffect} from "react";
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
    Paper,
    InputAdornment,
    alpha,
    useTheme,
    Tooltip,
    Chip
} from "@mui/material";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    AddAPhoto as AddPhotoIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    LocalHospital as LocalHospitalIcon,
    Person as PersonIcon,
    LocationOn as LocationOnIcon,
    Info as InfoIcon,
    Home as HomeIcon,
    LocationCity as LocationCityIcon,
    PinDrop as PinDropIcon,
    Margin as MarginIcon,
    Apartment as ApartmentIcon,
    CreditCard as CreditCardIcon,
    Receipt as ReceiptIcon,
    Settings as SettingsIcon,
    Upgrade as UpgradeIcon,
    People as PeopleIcon
} from "@mui/icons-material";
import FirebaseService from "../../lib/firebaseService";
import {useAuth} from "./authProvider";
import SubscriptionManagerDialog from './organismsComponents/subscriptionManagerDialog';
import LogoutIcon from '@mui/icons-material/Logout';
import SecretaryManagerDialog from './organismsComponents/secretaryManagerDialog';

// Enhanced color palette
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

// Helper para máscara de telefone
const applyPhoneMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    let result = "";
    let numberIndex = 0;
    const mask = "(99) 99999-9999";

    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
        if (mask[i] === "9") {
            result += numbers[numberIndex++];
        } else {
            result += mask[i];
            if (i + 1 < mask.length && mask[i + 1] !== "9") {
                result += mask[++i];
            }
        }
    }
    return result;
};

// Helper para máscara de CEP
const applyCepMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
        return numbers;
    }
    return `${numbers.substring(0, 5)}-${numbers.substring(5, 8)}`;
};

// Configuração dos planos para exibição
const plansDisplay = {
    free: { name: 'Gratuito', color: '#6B7280', icon: '🆓' },
    monthly: { name: 'Essencial', color: '#3B82F6', icon: '⚡' },
    quarterly: { name: 'Profissional', color: '#8B5CF6', icon: '🚀' },
    annual: { name: 'Premium', color: '#F59E0B', icon: '👑' }
};

// Campo editável com UI elegante e minimalista
const EditableField = ({
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
                           mask = null,
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
                                    {startIcon}
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
                            {startIcon}
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
};

const UserProfileTemplate = ({onLogout}) => {
    const theme = useTheme();
    const {user, loading: authLoading, isSecretary} = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState({});
    const [formData, setFormData] = useState({});
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({open: false, message: '', severity: 'success'});

    // Estados para dialogs
    const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
    const [showSecretaryManager, setShowSecretaryManager] = useState(false);

    // Estado para informações da secretária
    const [secretaryInfo, setSecretaryInfo] = useState(null);

    // Extrair o primeiro nome do usuário logado
    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    const firstName = getFirstName(userData.fullName);

    // Função para determinar o tipo de plano do usuário
    const getUserPlanInfo = () => {
        if (userData.administrador) {
            return { name: 'Administrador', color: '#DC2626', icon: '👨‍💼' };
        }

        if (userData.assinouPlano) {
            const planType = userData.planType || 'monthly';
            return plansDisplay[planType] || plansDisplay.monthly;
        }

        return plansDisplay.free;
    };

    const planInfo = getUserPlanInfo();

    // Verificar se o usuário pode gerenciar secretárias
    const canManageSecretaries = () => {
        // Secretárias não podem gerenciar outras secretárias
        if (isSecretary) return false;

        // Apenas médicos com planos pagos ou admins podem ter secretárias
        return userData.administrador || userData.assinouPlano;
    };

    // Carregar dados do usuário
    useEffect(() => {
        const loadUserData = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const userData = await FirebaseService.getUserData(user.uid);
                setUserData(userData);
                setFormData(userData);
                setLoading(false);
            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error);
                setAlert({
                    open: true,
                    message: 'Erro ao carregar dados do perfil.',
                    severity: 'error'
                });
                setLoading(false);
            }
        };

        if (user && !authLoading) {
            loadUserData();
        }
    }, [user, authLoading]);

    // Carregar informações da secretária
    useEffect(() => {
        const loadSecretaryInfo = async () => {
            if (user?.uid && canManageSecretaries()) {
                try {
                    const info = await FirebaseService.getDoctorSecretaryInfo(user.uid);
                    setSecretaryInfo(info);
                } catch (error) {
                    console.warn('Erro ao carregar informações da secretária:', error);
                }
            }
        };

        if (user && !authLoading && userData.administrador !== undefined) {
            loadSecretaryInfo();
        }
    }, [user, authLoading, userData.administrador, userData.assinouPlano]);

    // Handler para mudanças nos campos do formulário
    const handleChange = (field) => (e) => {
        let value = e.target.value;

        // Aplicar máscara se for um campo específico
        if (field === 'phone') {
            value = applyPhoneMask(value);
        } else if (field === 'address.cep') {
            value = applyCepMask(value);
        }

        // Gerenciar campos aninhados (address.field)
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            // Campos regulares
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        // Limpar o erro do campo quando ele é editado
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            await FirebaseService.logout();
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            setAlert({
                open: true,
                message: 'Erro ao fazer logout. Tente novamente.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handler para upload de foto
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                setPhotoFile(file);
                setPhotoPreview(event.target.result);
            };

            reader.readAsDataURL(file);
        }
    };

    // Validação dos campos do formulário
    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName || formData.fullName.trim() === '') {
            newErrors.fullName = 'Nome completo é obrigatório';
        }

        if (!formData.phone || formData.phone.trim() === '') {
            newErrors.phone = 'Telefone é obrigatório';
        }

        if (!formData.email || formData.email.trim() === '') {
            newErrors.email = 'E-mail é obrigatório';
        }

        if (!formData.cpf || formData.cpf.trim() === '') {
            newErrors.cpf = 'CPF é obrigatório';
        }

        // Validação de endereço
        if (formData.address) {
            if (!formData.address.street || formData.address.street.trim() === '') {
                newErrors['address.street'] = 'Endereço é obrigatório';
            }
            if (!formData.address.city || formData.address.city.trim() === '') {
                newErrors['address.city'] = 'Cidade é obrigatória';
            }
            if (!formData.address.state || formData.address.state.trim() === '') {
                newErrors['address.state'] = 'Estado é obrigatório';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handler para salvar alterações
    const handleSave = async () => {
        if (!validateForm()) {
            setAlert({
                open: true,
                message: 'Por favor, corrija os campos com erro antes de salvar.',
                severity: 'error'
            });
            return;
        }

        try {
            setSaving(true);

            let updatedData = {...formData};

            // Se houver upload de foto
            if (photoFile) {
                try {
                    const photoPath = `users/${user.uid}/profilePhoto/${Date.now()}_${photoFile.name}`;
                    const photoURL = await FirebaseService.uploadFile(photoFile, photoPath);

                    // Se havia uma foto anterior, deletar
                    if (userData.photoURL && userData.photoURL !== photoURL) {
                        try {
                            await FirebaseService.deleteFile(userData.photoURL);
                        } catch (error) {
                            console.warn("Erro ao deletar foto antiga:", error);
                        }
                    }

                    updatedData.photoURL = photoURL;
                } catch (error) {
                    console.error("Erro ao fazer upload da foto:", error);
                    throw new Error("Erro ao fazer upload da foto de perfil.");
                }
            }

            // Atualizar dados no Firebase
            await FirebaseService.editUserData(user.uid, updatedData);

            // Atualizar dados locais
            setUserData(updatedData);

            setAlert({
                open: true,
                message: 'Perfil atualizado com sucesso!',
                severity: 'success'
            });

            setIsEditing(false);
            setSaving(false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            setAlert({
                open: true,
                message: `Erro ao salvar alterações: ${error.message}`,
                severity: 'error'
            });
            setSaving(false);
        }
    };

    // Handler para cancelar edição
    const handleCancel = () => {
        setFormData(userData);
        setPhotoFile(null);
        setPhotoPreview(null);
        setErrors({});
        setIsEditing(false);
    };

    // Handler para fechar alerta
    const handleCloseAlert = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlert({...alert, open: false});
    };

    // Mostrar spinner durante carregamento inicial
    if (loading || authLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
                <CircularProgress color="primary"/>
            </Box>
        );
    }

    return (
        <Box sx={{py: 2, px: {xs: 2, md: 3}}}>
            <Grid container spacing={3}>
                {/* Coluna da Esquerda - Foto e Informações Básicas */}
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
                            <input
                                accept="image/*"
                                id="profile-photo-upload"
                                type="file"
                                style={{display: 'none'}}
                                onChange={handlePhotoChange}
                                disabled={!isEditing}
                            />
                            <label htmlFor={isEditing ? "profile-photo-upload" : ""}>
                                <Box sx={{position: 'relative'}}>
                                    <Avatar
                                        src={photoPreview || userData.photoURL}
                                        alt={userData.fullName || "Perfil"}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            border: `3px solid ${themeColors.primary}`,
                                            backgroundColor: alpha(themeColors.primary, 0.1),
                                            color: themeColors.primary,
                                            fontSize: '3rem',
                                            fontWeight: 600,
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            cursor: isEditing ? 'pointer' : 'default',
                                            "&:hover": {
                                                transform: isEditing ? "scale(1.05)" : "none",
                                                boxShadow: isEditing ? "0 4px 20px rgba(24, 82, 254, 0.15)" : "none",
                                            },
                                        }}
                                    >
                                        {userData.fullName ? userData.fullName.charAt(0) :
                                            <PersonIcon fontSize="large"/>}
                                    </Avatar>

                                    {isEditing && (
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
                                            <AddPhotoIcon sx={{color: 'white', fontSize: 20}}/>
                                        </Box>
                                    )}
                                </Box>
                            </label>

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
                                Dr. {firstName}
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
                                {userData.especialidade || "Médico"}
                            </Typography>

                            {/* Chip do plano atual */}
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

                            {!isEditing ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon/>}
                                    onClick={() => setIsEditing(true)}
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
                            ) : (
                                <Box sx={{display: 'flex', gap: 2, mb: 3}}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloseIcon/>}
                                        onClick={handleCancel}
                                        disabled={saving}
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
                                        startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>}
                                        onClick={handleSave}
                                        disabled={saving}
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
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Card>

                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '20px',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        <CardContent sx={{p: 3}}>
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

                            <Box sx={{mb: 2}}>
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
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <EmailIcon
                                        fontSize="small"
                                        sx={{color: themeColors.primary, mr: 1}}
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

                            <Box sx={{mb: 2}}>
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
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
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

                            {/* Indicador de secretária ativa */}
                            {secretaryInfo && (
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
                                        Secretária Ativa
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PeopleIcon
                                            fontSize="small"
                                            sx={{ color: themeColors.success, mr: 1 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: themeColors.success,
                                                fontFamily: "Gellix, sans-serif",
                                                fontWeight: 500
                                            }}
                                        >
                                            {secretaryInfo.name}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Botões de gerenciamento */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {/* Botão para gerenciar secretárias (apenas para médicos) */}
                                {canManageSecretaries() && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<PeopleIcon />}
                                        onClick={() => setShowSecretaryManager(true)}
                                        fullWidth
                                        sx={{
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontFamily: 'Gellix, sans-serif',
                                            fontWeight: 500,
                                            color: themeColors.success,
                                            borderColor: alpha(themeColors.success, 0.5),
                                            py: 1,
                                            '&:hover': {
                                                backgroundColor: alpha(themeColors.success, 0.08),
                                                borderColor: themeColors.success
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {secretaryInfo ? 'Gerenciar Secretária' : 'Adicionar Secretária'}
                                    </Button>
                                )}

                                {/* Botão de gerenciar assinatura */}
                                <Button
                                    variant="outlined"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => setShowSubscriptionManager(true)}
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

                                {/* Botão de logout */}
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<LogoutIcon />}
                                    onClick={onLogout}
                                    fullWidth
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
                                    Sair da Conta
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Coluna da Direita - Detalhes Profissionais */}
                <Grid item xs={12} md={8}>
                    {/* Cartão de Informações Pessoais Refinado */}
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
                                    <PersonIcon
                                        sx={{
                                            color: themeColors.primary,
                                            mr: 1.5,
                                            fontSize: 20
                                        }}
                                    />
                                    Dados Pessoais
                                </Typography>

                                {!isEditing ? (
                                    <IconButton
                                        onClick={() => setIsEditing(true)}
                                        size="small"
                                        sx={{
                                            color: themeColors.primary,
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>

                            <Divider sx={{ mb: 3 }}/>

                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Nome Completo"
                                        value={formData.fullName || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('fullName')}
                                        error={errors.fullName}
                                        helperText={errors.fullName}
                                        required
                                        startIcon={<PersonIcon sx={{ color: errors.fullName ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="CPF"
                                        value={formData.cpf || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('cpf')}
                                        error={errors.cpf}
                                        helperText={errors.cpf}
                                        required
                                        startIcon={<BadgeIcon sx={{ color: errors.cpf ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="E-mail"
                                        value={formData.email || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('email')}
                                        error={errors.email}
                                        helperText={errors.email}
                                        required
                                        startIcon={<EmailIcon sx={{ color: errors.email ? themeColors.error : themeColors.primary }}/>}
                                        type="email"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Telefone"
                                        value={formData.phone || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('phone')}
                                        error={errors.phone}
                                        helperText={errors.phone}
                                        required
                                        startIcon={<PhoneIcon sx={{ color: errors.phone ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Cartão de Endereço Refinado */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: '12px',
                            boxShadow: '0px 2px 10px rgba(17, 30, 90, 0.08)',
                            overflow: 'hidden',
                            position: 'relative',
                            mt: 3,
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

                                {!isEditing ? (
                                    <IconButton
                                        onClick={() => setIsEditing(true)}
                                        size="small"
                                        sx={{
                                            color: themeColors.primary,
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>

                            <Divider sx={{ mb: 3 }}/>

                            {!isEditing && (
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
                                    {formData.address?.street ? (
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
                                                {formData.address?.street}, {formData.address?.number || 'S/N'}
                                                {formData.address?.complement ? ` - ${formData.address.complement}` : ''}
                                                {formData.address?.neighborhood ? `, ${formData.address.neighborhood}` : ''}
                                            </Typography>

                                            {formData.address?.city && (
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
                                                    {formData.address?.city} - {formData.address?.state}
                                                    {formData.address?.cep ? `, CEP ${formData.address.cep}` : ''}
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

                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={8}>
                                    <EditableField
                                        label="Rua"
                                        value={formData.address?.street || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.street')}
                                        error={errors['address.street']}
                                        helperText={errors['address.street']}
                                        required
                                        startIcon={<HomeIcon sx={{ color: errors['address.street'] ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <EditableField
                                        label="Número"
                                        value={formData.address?.number || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.number')}
                                        startIcon={<MarginIcon sx={{ color: themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Complemento"
                                        value={formData.address?.complement || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.complement')}
                                        startIcon={<ApartmentIcon sx={{ color: themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <EditableField
                                        label="Bairro"
                                        value={formData.address?.neighborhood || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.neighborhood')}
                                        startIcon={<LocationOnIcon sx={{ color: themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <EditableField
                                        label="CEP"
                                        value={formData.address?.cep || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.cep')}
                                        startIcon={<PinDropIcon sx={{ color: themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <EditableField
                                        label="Cidade"
                                        value={formData.address?.city || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.city')}
                                        error={errors['address.city']}
                                        helperText={errors['address.city']}
                                        required
                                        startIcon={<LocationCityIcon sx={{ color: errors['address.city'] ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <EditableField
                                        label="Estado"
                                        value={formData.address?.state || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange('address.state')}
                                        error={errors['address.state']}
                                        helperText={errors['address.state']}
                                        required
                                        startIcon={<LocationOnIcon sx={{ color: errors['address.state'] ? themeColors.error : themeColors.primary }}/>}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Modal de gerenciamento de assinatura */}
            <SubscriptionManagerDialog
                open={showSubscriptionManager}
                onClose={() => setShowSubscriptionManager(false)}
            />

            {/* Modal de gerenciamento de secretárias */}
            <SecretaryManagerDialog
                open={showSecretaryManager}
                onClose={() => setShowSecretaryManager(false)}
            />

            {/* Alerta de Feedback */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity={alert.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontFamily: 'Gellix, sans-serif',
                        borderRadius: '10px'
                    }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfileTemplate;