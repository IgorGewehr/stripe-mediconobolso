"use client";

/**
 * Página de Entrada de Código de Verificação
 *
 * Página pública que permite ao usuário inserir ou escanear
 * o código de verificação de um documento digital.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Paper,
    useTheme,
    alpha,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    Security as SecurityIcon,
    Search as SearchIcon,
    QrCodeScanner as QrCodeScannerIcon,
    Clear as ClearIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import verificationService from '@/lib/services/api/verification.service';

// Máscara para o código: XXXX-XXXX-XXXX-XXXX
const formatCodeInput = (value) => {
    // Remove tudo que não é alfanumérico
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Limita a 16 caracteres
    const limited = cleaned.slice(0, 16);

    // Adiciona hífens a cada 4 caracteres
    const parts = [];
    for (let i = 0; i < limited.length; i += 4) {
        parts.push(limited.slice(i, i + 4));
    }

    return parts.join('-');
};

export default function VerificarPage() {
    const router = useRouter();
    const theme = useTheme();
    const inputRef = useRef(null);

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Foca no input quando a página carrega
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleCodeChange = (e) => {
        const formatted = formatCodeInput(e.target.value);
        setCode(formatted);
        setError('');
    };

    const handleClearCode = () => {
        setCode('');
        setError('');
        inputRef.current?.focus();
    };

    const handleVerify = async () => {
        // Validar formato
        if (!verificationService.isValidFormat(code)) {
            setError('Código inválido. O código deve ter 16 caracteres no formato XXXX-XXXX-XXXX-XXXX.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Verificar se o documento existe antes de redirecionar
            await verificationService.verifyDocument(code);

            // Redirecionar para a página de resultado
            const cleanCode = code.replace(/-/g, '');
            router.push(`/verificar/${cleanCode}`);
        } catch (err) {
            setError(err.userMessage || 'Erro ao verificar documento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && code.length === 19) { // 16 chars + 3 hífens
            handleVerify();
        }
    };

    const isCodeComplete = code.replace(/-/g, '').length === 16;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#F4F9FF',
                display: 'flex',
                alignItems: 'center',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '24px',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                        }}
                    >
                        <SecurityIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    </Box>

                    <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                        Verificar Documento
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                        Verifique a autenticidade de prescrições e atestados
                        médicos assinados digitalmente.
                    </Typography>
                </Box>

                {/* Card Principal */}
                <Card
                    sx={{
                        borderRadius: '24px',
                        boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.08)',
                        overflow: 'visible',
                    }}
                >
                    <CardContent sx={{ p: 4 }}>
                        {/* Input do Código */}
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Código de Verificação
                        </Typography>

                        <TextField
                            ref={inputRef}
                            fullWidth
                            value={code}
                            onChange={handleCodeChange}
                            onKeyPress={handleKeyPress}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            error={!!error}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: code && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={handleClearCode}
                                            disabled={loading}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: '16px',
                                    fontFamily: 'monospace',
                                    fontSize: '1.25rem',
                                    letterSpacing: 2,
                                    '& input': {
                                        textAlign: 'center',
                                    },
                                },
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Erro */}
                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2,
                                    borderRadius: '12px',
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {/* Botão Verificar */}
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!isCodeComplete || loading}
                            onClick={handleVerify}
                            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: '16px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                            }}
                        >
                            {loading ? 'Verificando...' : 'Verificar Documento'}
                        </Button>

                        {/* Divisor */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                my: 3,
                            }}
                        >
                            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                                ou
                            </Typography>
                            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                        </Box>

                        {/* Botão QR Code (para futuro) */}
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            disabled
                            startIcon={<QrCodeScannerIcon />}
                            sx={{
                                py: 1.5,
                                borderRadius: '16px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderColor: 'divider',
                                color: 'text.secondary',
                            }}
                        >
                            Escanear QR Code (em breve)
                        </Button>
                    </CardContent>
                </Card>

                {/* Instruções */}
                <Paper
                    sx={{
                        mt: 3,
                        p: 3,
                        borderRadius: '16px',
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600} color="info.main" gutterBottom>
                        Onde encontrar o código?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        O código de verificação está localizado no rodapé do documento digital
                        ou pode ser escaneado via QR Code presente no canto inferior do documento.
                    </Typography>
                </Paper>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        Sistema de verificação seguro
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Médico no Bolso - mediconobolso.com.br
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
