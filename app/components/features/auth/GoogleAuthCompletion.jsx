"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Avatar,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { authService } from '../../../../lib/services/firebase';

// Lista de estados brasileiros
const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: 16,
        padding: theme.spacing(1),
        maxWidth: 600,
        width: '100%'
    }
}));

const GoogleProfileCompletion = ({
                                     open,
                                     onClose,
                                     user,
                                     onComplete
                                 }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        phone: '',
        cpf: '',
        especialidade: '',
        cep: '',
        city: '',
        state: '',
        crm: ''
    });

    const steps = ['Informações Pessoais', 'Endereço', 'Dados Profissionais'];

    // Função para formatar CPF
    const formatCPF = (value) => {
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    };

    // Função para formatar telefone
    const formatPhone = (value) => {
        value = value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return value;
    };

    // Função para formatar CEP
    const formatCEP = (value) => {
        value = value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    };

    // Handler para mudanças nos inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cpf') {
            const formattedValue = formatCPF(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else if (name === 'phone') {
            const formattedValue = formatPhone(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else if (name === 'cep') {
            const formattedValue = formatCEP(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro quando usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    // Validar step atual
    const validateCurrentStep = () => {
        const newErrors = {};

        if (activeStep === 0) {
            // Informações Pessoais
            if (!formData.phone.trim()) {
                newErrors.phone = "Telefone é obrigatório";
            } else if (formData.phone.replace(/\D/g, '').length < 10) {
                newErrors.phone = "Telefone inválido";
            }

            if (!formData.cpf.trim()) {
                newErrors.cpf = "CPF é obrigatório";
            } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
                newErrors.cpf = "CPF inválido";
            }
        } else if (activeStep === 1) {
            // Endereço
            if (!formData.cep.trim()) {
                newErrors.cep = "CEP é obrigatório";
            } else if (formData.cep.replace(/\D/g, '').length !== 8) {
                newErrors.cep = "CEP inválido";
            }

            if (!formData.city.trim()) {
                newErrors.city = "Cidade é obrigatória";
            }

            if (!formData.state) {
                newErrors.state = "Estado é obrigatório";
            }
        } else if (activeStep === 2) {
            // Dados Profissionais (opcionais mas validamos se preenchidos)
            if (formData.crm && formData.crm.length < 4) {
                newErrors.crm = "CRM inválido";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Próximo step
    const handleNext = () => {
        if (validateCurrentStep()) {
            setActiveStep(prev => prev + 1);
        }
    };

    // Step anterior
    const handleBack = () => {
        setActiveStep(prev => prev - 1);
        setErrors({});
    };

    // Finalizar cadastro
    const handleComplete = async () => {
        if (!validateCurrentStep()) {
            return;
        }

        setLoading(true);

        try {
            const profileData = {
                phone: formData.phone,
                cpf: formData.cpf,
                especialidade: formData.especialidade || '',
                crm: formData.crm || '',
                address: {
                    cep: formData.cep,
                    city: formData.city,
                    state: formData.state,
                    country: 'BR'
                },
                profileCompleted: true,
                needsProfileCompletion: false,
                checkoutCompleted: true
            };

            await authService.completeGoogleProfile(user.uid, profileData);

            // Enviar emails de boas-vindas se ainda não foram enviados
            authService.sendGoogleWelcomeEmails(
                user.email,
                user.displayName || user.email.split('@')[0]
            ).catch(console.error);

            console.log('✅ Perfil Google completado com sucesso');
            onComplete && onComplete();
            onClose();

        } catch (error) {
            console.error('❌ Erro ao completar perfil:', error);
            setErrors({ general: 'Erro ao salvar dados. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Telefone"
                                fullWidth
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                error={Boolean(errors.phone)}
                                helperText={errors.phone || ""}
                                placeholder="(11) 99999-9999"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="CPF"
                                fullWidth
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleInputChange}
                                error={Boolean(errors.cpf)}
                                helperText={errors.cpf || ""}
                                placeholder="000.000.000-00"
                                inputProps={{ maxLength: 14 }}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="CEP"
                                fullWidth
                                name="cep"
                                value={formData.cep}
                                onChange={handleInputChange}
                                error={Boolean(errors.cep)}
                                helperText={errors.cep || ""}
                                placeholder="00000-000"
                                inputProps={{ maxLength: 9 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Cidade"
                                fullWidth
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                error={Boolean(errors.city)}
                                helperText={errors.city || ""}
                                placeholder="São Paulo"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth error={Boolean(errors.state)}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={formData.state}
                                    label="Estado"
                                    name="state"
                                    onChange={handleInputChange}
                                >
                                    {brazilianStates.map((state) => (
                                        <MenuItem key={state.value} value={state.value}>
                                            {state.value} - {state.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.state && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                        {errors.state}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Especialidade"
                                fullWidth
                                name="especialidade"
                                value={formData.especialidade}
                                onChange={handleInputChange}
                                placeholder="Ex: Cardiologia, Clínica Geral..."
                                helperText="Campo opcional"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="CRM"
                                fullWidth
                                name="crm"
                                value={formData.crm}
                                onChange={handleInputChange}
                                error={Boolean(errors.crm)}
                                helperText={errors.crm || "Campo opcional"}
                                placeholder="Ex: 123456"
                            />
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={user?.photoURL}
                        sx={{ width: 60, height: 60 }}
                    >
                        {user?.displayName?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Complete seu perfil
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Olá, {user?.displayName?.split(' ')[0]}! Precisamos de algumas informações adicionais.
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 2 }}>
                {!isMobile && (
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                )}

                {isMobile && (
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {steps[activeStep]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Passo {activeStep + 1} de {steps.length}
                        </Typography>
                    </Box>
                )}

                {errors.general && (
                    <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                        {errors.general}
                    </Typography>
                )}

                {renderStepContent()}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 2
                }}>
                    <Button
                        onClick={handleBack}
                        disabled={activeStep === 0 || loading}
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        Voltar
                    </Button>

                    {activeStep === steps.length - 1 ? (
                        <Button
                            onClick={handleComplete}
                            disabled={loading}
                            variant="contained"
                            sx={{
                                minWidth: 120,
                                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #43A047 0%, #5CB85C 100%)',
                                }
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? 'Salvando...' : 'Finalizar'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            sx={{ minWidth: 100 }}
                        >
                            Próximo
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </StyledDialog>
    );
};

export default GoogleProfileCompletion;