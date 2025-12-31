"use client";

/**
 * CertificateUploadDialog - Diálogo para upload de certificado digital
 *
 * Permite ao médico fazer upload de seu certificado digital A1 (.pfx/.p12)
 * para uso em assinaturas de documentos.
 */

import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Alert,
    AlertTitle,
    CircularProgress,
    IconButton,
    InputAdornment,
    useTheme,
    alpha,
    Paper,
    LinearProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    CheckCircle as CheckCircleIcon,
    Key as KeyIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { prescriptionsService } from '@/lib/services/api';

export default function CertificateUploadDialog({
    open,
    onClose,
    onSuccess,
}) {
    const theme = useTheme();

    // Estados
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Reset ao abrir
    React.useEffect(() => {
        if (open) {
            setFile(null);
            setPassword('');
            setError(null);
            setSuccess(false);
            setUploadProgress(0);
        }
    }, [open]);

    // Dropzone
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError('Formato de arquivo inválido. Use arquivos .pfx ou .p12');
            return;
        }

        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('Arquivo muito grande. O limite é 10MB.');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/x-pkcs12': ['.pfx', '.p12'],
        },
        maxFiles: 1,
        multiple: false,
    });

    const handleRemoveFile = () => {
        setFile(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Selecione um arquivo de certificado.');
            return;
        }

        if (!password) {
            setError('Digite a senha do certificado.');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Simular progresso
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const result = await prescriptionsService.uploadCertificate(file, password, true);

            clearInterval(progressInterval);
            setUploadProgress(100);
            setSuccess(true);

            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(result);
                }
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Erro ao fazer upload do certificado:', err);
            setError(err.userMessage || 'Erro ao processar certificado. Verifique a senha e tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog
            open={open}
            onClose={uploading ? undefined : onClose}
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
                    <KeyIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Upload de Certificado Digital
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" disabled={uploading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {success ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 4,
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" fontWeight={600}>
                            Certificado Cadastrado com Sucesso!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Seu certificado digital está pronto para uso em assinaturas.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                                {error}
                            </Alert>
                        )}

                        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                            <AlertTitle>Certificado Digital A1</AlertTitle>
                            Faça o upload do seu certificado digital ICP-Brasil no formato .pfx ou .p12.
                            Este certificado será usado para assinar digitalmente prescrições e atestados.
                        </Alert>

                        {/* Dropzone */}
                        {!file ? (
                            <Paper
                                {...getRootProps()}
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    borderStyle: 'dashed',
                                    borderWidth: 2,
                                    borderColor: isDragActive
                                        ? 'primary.main'
                                        : alpha(theme.palette.text.primary, 0.2),
                                    backgroundColor: isDragActive
                                        ? alpha(theme.palette.primary.main, 0.05)
                                        : 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                    },
                                }}
                            >
                                <input {...getInputProps()} />
                                <CloudUploadIcon
                                    sx={{
                                        fontSize: 48,
                                        color: isDragActive ? 'primary.main' : 'text.secondary',
                                        mb: 2,
                                    }}
                                />
                                <Typography variant="body1" fontWeight={500}>
                                    {isDragActive
                                        ? 'Solte o arquivo aqui...'
                                        : 'Arraste o certificado aqui ou clique para selecionar'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Formatos aceitos: .pfx, .p12 (máx. 10MB)
                                </Typography>
                            </Paper>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <InsertDriveFileIcon color="primary" />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatFileSize(file.size)}
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={handleRemoveFile}
                                    size="small"
                                    disabled={uploading}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Paper>
                        )}

                        {/* Senha */}
                        <TextField
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            label="Senha do Certificado"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={uploading}
                            sx={{ mt: 3 }}
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
                            helperText="A senha será usada para validar o certificado"
                        />

                        {/* Progress */}
                        {uploading && (
                            <Box sx={{ mt: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Processando certificado...
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {uploadProgress}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    sx={{ borderRadius: 1 }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            {!success && (
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button
                        onClick={onClose}
                        color="inherit"
                        disabled={uploading}
                        sx={{ borderRadius: '20px' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={!file || !password || uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                        sx={{ borderRadius: '20px' }}
                    >
                        {uploading ? 'Enviando...' : 'Enviar Certificado'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
