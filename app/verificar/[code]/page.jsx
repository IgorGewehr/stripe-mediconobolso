"use client";

/**
 * Página de Verificação de Documentos Digitais
 *
 * Página pública para verificar autenticidade de prescrições e atestados
 * assinados digitalmente. Acessível via QR Code no documento.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    AlertTitle,
    Divider,
    Chip,
    Grid,
    Paper,
    useTheme,
    alpha,
    Button,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    VerifiedUser as VerifiedUserIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    LocalHospital as LocalHospitalIcon,
    CalendarToday as CalendarTodayIcon,
    Security as SecurityIcon,
    Warning as WarningIcon,
    ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prescriptionsService } from '@/lib/services/api';

// Status do documento
const DOCUMENT_STATUS = {
    valid: {
        color: 'success',
        icon: <CheckCircleIcon sx={{ fontSize: 64 }} />,
        title: 'Documento Válido',
        description: 'Este documento foi assinado digitalmente e é autêntico.',
    },
    expired: {
        color: 'warning',
        icon: <WarningIcon sx={{ fontSize: 64 }} />,
        title: 'Documento Expirado',
        description: 'Este documento foi válido, mas já expirou.',
    },
    revoked: {
        color: 'error',
        icon: <CancelIcon sx={{ fontSize: 64 }} />,
        title: 'Documento Revogado',
        description: 'Este documento foi revogado e não é mais válido.',
    },
    invalid: {
        color: 'error',
        icon: <CancelIcon sx={{ fontSize: 64 }} />,
        title: 'Documento Inválido',
        description: 'Não foi possível verificar a autenticidade deste documento.',
    },
};

// Tipos de documento
const DOCUMENT_TYPES = {
    prescription: {
        label: 'Prescrição Médica',
        icon: <DescriptionIcon />,
    },
    certificate: {
        label: 'Atestado Médico',
        icon: <LocalHospitalIcon />,
    },
};

export default function VerificationPage() {
    const params = useParams();
    const theme = useTheme();
    const code = params.code;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (code) {
            verifyDocument(code);
        }
    }, [code]);

    const verifyDocument = async (verificationCode) => {
        setLoading(true);
        setError(null);

        try {
            const result = await prescriptionsService.verifyDocument(verificationCode);
            setVerificationResult(result);
        } catch (err) {
            console.error('Erro ao verificar documento:', err);
            if (err.status === 404) {
                setError('Código de verificação não encontrado. Verifique se o código está correto.');
            } else {
                setError(err.userMessage || 'Erro ao verificar documento. Tente novamente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = parseISO(dateString);
            return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const getStatusInfo = () => {
        if (!verificationResult) return DOCUMENT_STATUS.invalid;

        if (!verificationResult.valid) {
            return DOCUMENT_STATUS.invalid;
        }

        switch (verificationResult.status) {
            case 'signed':
            case 'active':
                return DOCUMENT_STATUS.valid;
            case 'expired':
                return DOCUMENT_STATUS.expired;
            case 'revoked':
            case 'cancelled':
                return DOCUMENT_STATUS.revoked;
            default:
                return DOCUMENT_STATUS.invalid;
        }
    };

    const statusInfo = getStatusInfo();
    const documentType = DOCUMENT_TYPES[verificationResult?.documentType] || DOCUMENT_TYPES.prescription;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#F4F9FF',
                py: 4,
            }}
        >
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        <SecurityIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        <Typography variant="h4" fontWeight={700} color="primary">
                            Verificação de Documento
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Médico no Bolso - Sistema de Verificação de Documentos Digitais
                    </Typography>
                </Box>

                {/* Código de Verificação */}
                <Paper
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: '16px',
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Código de Verificação:
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            fontFamily="monospace"
                            sx={{ letterSpacing: 2 }}
                        >
                            {code}
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyCode}
                            sx={{ borderRadius: '20px' }}
                        >
                            {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                    </Box>
                </Paper>

                {/* Loading State */}
                {loading && (
                    <Card sx={{ borderRadius: '24px', textAlign: 'center', py: 8 }}>
                        <CircularProgress size={64} />
                        <Typography variant="h6" sx={{ mt: 3 }}>
                            Verificando documento...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Aguarde enquanto validamos a autenticidade do documento.
                        </Typography>
                    </Card>
                )}

                {/* Error State */}
                {!loading && error && (
                    <Alert
                        severity="error"
                        sx={{
                            borderRadius: '16px',
                            '& .MuiAlert-icon': { fontSize: 28 },
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 600 }}>Erro na Verificação</AlertTitle>
                        {error}
                    </Alert>
                )}

                {/* Result State */}
                {!loading && !error && verificationResult && (
                    <>
                        {/* Status Card */}
                        <Card
                            sx={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.08)',
                                mb: 3,
                            }}
                        >
                            <Box
                                sx={{
                                    backgroundColor: theme.palette[statusInfo.color].main,
                                    color: '#fff',
                                    py: 4,
                                    textAlign: 'center',
                                }}
                            >
                                {statusInfo.icon}
                                <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
                                    {statusInfo.title}
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                                    {statusInfo.description}
                                </Typography>
                            </Box>

                            <CardContent sx={{ p: 4 }}>
                                {/* Tipo de Documento */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Chip
                                        icon={documentType.icon}
                                        label={documentType.label}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ borderRadius: '12px', fontWeight: 500 }}
                                    />
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Informações do Documento */}
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <CalendarTodayIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Emitido em
                                                </Typography>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {formatDate(verificationResult.issuedAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {verificationResult.signedAt && (
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <VerifiedUserIcon sx={{ color: 'success.main', mt: 0.5 }} />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Assinado em
                                                    </Typography>
                                                    <Typography variant="body1" fontWeight={500}>
                                                        {formatDate(verificationResult.signedAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Informações Adicionais */}
                        <Card
                            sx={{
                                borderRadius: '24px',
                                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Sobre a Verificação Digital
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <CheckCircleIcon sx={{ color: 'success.main', flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Assinatura Digital ICP-Brasil:</strong> Este documento foi assinado
                                            utilizando um certificado digital emitido por uma Autoridade Certificadora
                                            credenciada pela ICP-Brasil, garantindo sua autenticidade e integridade.
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <SecurityIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Lei 14.063/2020:</strong> Este documento está em conformidade com
                                            a legislação brasileira sobre assinaturas eletrônicas, tendo validade
                                            jurídica equivalente a um documento físico assinado.
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <VerifiedUserIcon sx={{ color: 'info.main', flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Padrão PAdES:</strong> A assinatura segue o padrão PAdES (PDF
                                            Advanced Electronic Signatures), um formato reconhecido internacionalmente
                                            para documentos PDF assinados digitalmente.
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Footer */}
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Em caso de dúvidas, entre em contato com o profissional de saúde que emitiu o documento.
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Médico no Bolso - mediconobolso.com.br
                            </Typography>
                        </Box>
                    </>
                )}
            </Container>
        </Box>
    );
}
