"use client";

/**
 * DigitalSignatureDialog - Diálogo para assinatura digital de documentos
 *
 * Permite ao médico selecionar um certificado digital e assinar
 * prescrições ou atestados digitalmente.
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    AlertTitle,
    CircularProgress,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    useTheme,
    alpha,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    Security as SecurityIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Upload as UploadIcon,
    Key as KeyIcon,
    Edit as EditIcon,
    VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prescriptionsService } from '@/lib/services/api';

const STEPS = ['Selecionar Certificado', 'Confirmar Assinatura'];

export default function DigitalSignatureDialog({
    open,
    onClose,
    documentType = 'prescription', // 'prescription' | 'certificate'
    documentId,
    onSuccess,
}) {
    const theme = useTheme();

    // Estados
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingCertificates, setLoadingCertificates] = useState(false);
    const [certificates, setCertificates] = useState([]);
    const [selectedCertificateId, setSelectedCertificateId] = useState('');
    const [certificatePassword, setCertificatePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [signing, setSigning] = useState(false);

    // Carregar certificados ao abrir
    useEffect(() => {
        if (open) {
            loadCertificates();
            setActiveStep(0);
            setSelectedCertificateId('');
            setCertificatePassword('');
            setError(null);
        }
    }, [open]);

    const loadCertificates = async () => {
        setLoadingCertificates(true);
        try {
            const certs = await prescriptionsService.listDoctorCertificates();
            setCertificates(certs.filter(c => c.isActive && !c.isExpired));

            // Selecionar automaticamente se houver apenas um certificado ativo
            if (certs.length === 1 && certs[0].isActive && !certs[0].isExpired) {
                setSelectedCertificateId(certs[0].id);
            }
        } catch (err) {
            console.error('Erro ao carregar certificados:', err);
            setError('Erro ao carregar certificados digitais.');
        } finally {
            setLoadingCertificates(false);
        }
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (!selectedCertificateId) {
                setError('Selecione um certificado digital.');
                return;
            }
            setError(null);
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError(null);
    };

    const handleSign = async () => {
        if (!selectedCertificateId) {
            setError('Selecione um certificado digital.');
            return;
        }

        setSigning(true);
        setError(null);

        try {
            const signatureData = {
                certificateId: selectedCertificateId,
                certificatePassword: certificatePassword || undefined,
            };

            let result;
            if (documentType === 'prescription') {
                result = await prescriptionsService.sign(documentId, signatureData);
            } else {
                result = await prescriptionsService.signCertificate(documentId, signatureData);
            }

            if (onSuccess) {
                onSuccess(result);
            }
            onClose();
        } catch (err) {
            console.error('Erro ao assinar documento:', err);
            setError(err.userMessage || 'Erro ao assinar documento. Verifique a senha do certificado.');
        } finally {
            setSigning(false);
        }
    };

    const selectedCertificate = certificates.find(c => c.id === selectedCertificateId);

    const formatExpiryDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = parseISO(dateString);
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const getCertificateStatusChip = (cert) => {
        if (cert.isExpired) {
            return <Chip label="Expirado" color="error" size="small" />;
        }
        if (cert.daysUntilExpiry <= 30) {
            return <Chip label={`Expira em ${cert.daysUntilExpiry} dias`} color="warning" size="small" />;
        }
        return <Chip label="Válido" color="success" size="small" />;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Assinatura Digital
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                        {error}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} orientation="vertical">
                    {/* Step 1: Selecionar Certificado */}
                    <Step>
                        <StepLabel>
                            <Typography fontWeight={activeStep === 0 ? 600 : 400}>
                                Selecionar Certificado
                            </Typography>
                        </StepLabel>
                        <StepContent>
                            {loadingCertificates ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : certificates.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                    <AlertTitle>Nenhum certificado encontrado</AlertTitle>
                                    Você precisa cadastrar um certificado digital para assinar documentos.
                                    Acesse as configurações para fazer o upload do seu certificado A1 ou A3.
                                </Alert>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Certificado Digital</InputLabel>
                                        <Select
                                            value={selectedCertificateId}
                                            onChange={(e) => setSelectedCertificateId(e.target.value)}
                                            label="Certificado Digital"
                                            sx={{ borderRadius: '12px' }}
                                        >
                                            {certificates.map((cert) => (
                                                <MenuItem key={cert.id} value={cert.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                        <KeyIcon sx={{ color: 'primary.main' }} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {cert.holderName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                CRM {cert.crm}/{cert.crmState} - Válido até {formatExpiryDate(cert.validUntil)}
                                                            </Typography>
                                                        </Box>
                                                        {getCertificateStatusChip(cert)}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {selectedCertificate && selectedCertificate.certificateType === 'A1' && (
                                        <TextField
                                            fullWidth
                                            type={showPassword ? 'text' : 'password'}
                                            label="Senha do Certificado"
                                            value={certificatePassword}
                                            onChange={(e) => setCertificatePassword(e.target.value)}
                                            sx={{ mt: 2 }}
                                            InputProps={{
                                                sx: { borderRadius: '12px' },
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="Digite a senha do certificado A1 para assinar"
                                        />
                                    )}

                                    <Box sx={{ mt: 3 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            disabled={!selectedCertificateId}
                                            sx={{ borderRadius: '20px' }}
                                        >
                                            Continuar
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </StepContent>
                    </Step>

                    {/* Step 2: Confirmar Assinatura */}
                    <Step>
                        <StepLabel>
                            <Typography fontWeight={activeStep === 1 ? 600 : 400}>
                                Confirmar Assinatura
                            </Typography>
                        </StepLabel>
                        <StepContent>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                                    borderColor: alpha(theme.palette.success.main, 0.3),
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <VerifiedUserIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Pronto para Assinar
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Você está prestes a assinar digitalmente este {documentType === 'prescription' ? 'receituário' : 'atestado'}.
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {selectedCertificate && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Typography variant="body2">
                                            <strong>Certificado:</strong> {selectedCertificate.holderName}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>CRM:</strong> {selectedCertificate.crm}/{selectedCertificate.crmState}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Tipo:</strong> Certificado {selectedCertificate.certificateType}
                                        </Typography>
                                    </Box>
                                )}

                                <Alert severity="info" sx={{ mt: 2, borderRadius: '12px' }}>
                                    <Typography variant="body2">
                                        Ao assinar, você confirma que revisou o documento e que as informações
                                        estão corretas. A assinatura terá validade jurídica conforme Lei 14.063/2020.
                                    </Typography>
                                </Alert>
                            </Paper>

                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                    sx={{ borderRadius: '20px' }}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSign}
                                    disabled={signing}
                                    startIcon={signing ? <CircularProgress size={20} /> : <EditIcon />}
                                    sx={{ borderRadius: '20px' }}
                                >
                                    {signing ? 'Assinando...' : 'Assinar Documento'}
                                </Button>
                            </Box>
                        </StepContent>
                    </Step>
                </Stepper>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    Assinatura digital conforme padrão ICP-Brasil
                </Typography>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: '20px' }}>
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
