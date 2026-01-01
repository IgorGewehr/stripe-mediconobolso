"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    CircularProgress,
    Fade,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notesService } from '@/lib/services/api';
import { useAuth } from '../../providers/authProvider';

// Theme colors
const theme = createTheme({
    palette: {
        primary: {
            main: '#8B5CF6',
            light: '#F3E8FF',
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
        },
        success: {
            main: '#22C55E',
        },
        error: {
            main: '#F04438',
            light: '#FEE4E2',
        },
    },
    typography: {
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                }
            }
        },
    },
});

// Tipos de atestado
const ATESTADO_TYPES = [
    { value: 'comparecimento', label: 'Atestado de Comparecimento' },
    { value: 'afastamento', label: 'Atestado de Afastamento' },
    { value: 'acompanhamento', label: 'Atestado de Acompanhamento' },
    { value: 'aptidao', label: 'Atestado de Aptidão' },
    { value: 'saude', label: 'Atestado de Saúde' },
    { value: 'outro', label: 'Outro' },
];

export default function AtestadoDialog({
    open,
    onClose,
    patientId,
    atestado = null,
    onSave,
    onDelete
}) {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const { user, getEffectiveUserId } = useAuth();

    // Form state
    const [atestadoType, setAtestadoType] = useState('comparecimento');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [cid, setCid] = useState('');
    const [diasAfastamento, setDiasAfastamento] = useState('');
    const [dataAtestado, setDataAtestado] = useState(format(new Date(), 'yyyy-MM-dd'));

    // UI state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Effect to populate form when editing
    useEffect(() => {
        if (atestado) {
            setTitle(atestado.title || '');
            setContent(atestado.content || '');
            setAtestadoType(atestado.atestadoType || 'comparecimento');
            setCid(atestado.cid || '');
            setDiasAfastamento(atestado.diasAfastamento || '');
            if (atestado.consultationDate) {
                setDataAtestado(atestado.consultationDate);
            }
        } else {
            // Reset form for new atestado
            setTitle('');
            setContent('');
            setAtestadoType('comparecimento');
            setCid('');
            setDiasAfastamento('');
            setDataAtestado(format(new Date(), 'yyyy-MM-dd'));
        }
    }, [atestado, open]);

    // Generate default title based on type
    const getDefaultTitle = () => {
        const type = ATESTADO_TYPES.find(t => t.value === atestadoType);
        return type ? type.label : 'Atestado Médico';
    };

    // Handle save
    const handleSave = async () => {
        if (!content.trim()) {
            setError('O conteúdo do atestado é obrigatório');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const atestadoData = {
                title: title || getDefaultTitle(),
                content: content,
                noteType: 'Atestado',
                consultationDate: dataAtestado,
                isImportant: false,
                // Custom fields stored in content or as metadata
                atestadoType,
                cid,
                diasAfastamento: diasAfastamento ? parseInt(diasAfastamento) : null,
            };

            if (atestado?.id) {
                // Update existing
                await notesService.updateNote(atestado.id, atestadoData);
            } else {
                // Create new
                await notesService.createNote(patientId, atestadoData);
            }

            setSuccess(true);

            // Notify parent and close
            setTimeout(() => {
                if (onSave) onSave();
                handleClose();
            }, 500);

        } catch (err) {
            console.error('Erro ao salvar atestado:', err);
            setError('Erro ao salvar o atestado. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!atestado?.id) return;

        if (!window.confirm('Tem certeza que deseja excluir este atestado?')) {
            return;
        }

        setSaving(true);
        try {
            await notesService.deleteNote(patientId, atestado.id);
            if (onDelete) onDelete(atestado.id);
            handleClose();
        } catch (err) {
            console.error('Erro ao excluir atestado:', err);
            setError('Erro ao excluir o atestado. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '20px',
                        maxHeight: isMobile ? '100%' : '90vh',
                    }
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'grey.200',
                        backgroundColor: theme.palette.primary.light,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {isMobile && (
                            <IconButton onClick={handleClose} size="small">
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <DescriptionIcon sx={{ color: '#FFF', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: 'grey.800',
                                }}
                            >
                                {atestado ? 'Editar Atestado' : 'Novo Atestado'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: 'grey.500', fontSize: 13 }}
                            >
                                Documento médico oficial
                            </Typography>
                        </Box>
                    </Box>
                    {!isMobile && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>

                {/* Content */}
                <DialogContent sx={{ p: 3 }}>
                    {success ? (
                        <Fade in={success}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 6,
                                }}
                            >
                                <CheckCircleOutlineIcon
                                    sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Atestado salvo com sucesso!
                                </Typography>
                            </Box>
                        </Fade>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Tipo de atestado */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Atestado</InputLabel>
                                <Select
                                    value={atestadoType}
                                    onChange={(e) => setAtestadoType(e.target.value)}
                                    label="Tipo de Atestado"
                                >
                                    {ATESTADO_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Data */}
                            <TextField
                                label="Data do Atestado"
                                type="date"
                                value={dataAtestado}
                                onChange={(e) => setDataAtestado(e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <CalendarTodayIcon sx={{ mr: 1, color: 'grey.400', fontSize: 18 }} />
                                    ),
                                }}
                            />

                            {/* Título (opcional) */}
                            <TextField
                                label="Título (opcional)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={getDefaultTitle()}
                                size="small"
                                fullWidth
                            />

                            {/* CID (opcional) */}
                            <TextField
                                label="CID (opcional)"
                                value={cid}
                                onChange={(e) => setCid(e.target.value)}
                                placeholder="Ex: J11"
                                size="small"
                                fullWidth
                                helperText="Código Internacional de Doenças"
                            />

                            {/* Dias de afastamento */}
                            {(atestadoType === 'afastamento' || atestadoType === 'acompanhamento') && (
                                <TextField
                                    label="Dias de Afastamento"
                                    type="number"
                                    value={diasAfastamento}
                                    onChange={(e) => setDiasAfastamento(e.target.value)}
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 1, max: 365 }}
                                />
                            )}

                            {/* Conteúdo do atestado */}
                            <TextField
                                label="Conteúdo do Atestado"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                multiline
                                rows={6}
                                fullWidth
                                placeholder="Atesto para os devidos fins que o(a) paciente..."
                                error={!!error}
                                helperText={error}
                            />

                            {/* Actions */}
                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                {atestado && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDelete}
                                        disabled={saving}
                                    >
                                        Excluir
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    onClick={handleClose}
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={saving || !content.trim()}
                                    sx={{
                                        backgroundColor: theme.palette.primary.main,
                                        '&:hover': {
                                            backgroundColor: '#7C3AED',
                                        },
                                    }}
                                >
                                    {saving ? (
                                        <CircularProgress size={22} color="inherit" />
                                    ) : (
                                        'Salvar Atestado'
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
