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
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
    Fade,
    Slide,
    alpha
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from '../../../lib/firebaseService';
import { useAuth } from '../authProvider';
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

// Theme creation for defining colors, fonts, and formats
const theme = createTheme({
    palette: {
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
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
        }
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
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputBase-root': {
                        borderRadius: 8,
                    }
                }
            }
        }
    }
});

// Styled Dialog with smoother transitions
const StyledDialog = ({ open, onClose, children, ...props }) => (
    <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
            '& .MuiDialog-paper': {
                borderRadius: '16px',
                border: '1px solid #EAECEF',
                background: '#FFF',
                boxShadow: '0px 4px 40px 0px rgba(0, 0, 0, 0.1)',
                maxHeight: '90vh',
                margin: '16px',
                width: 'calc(100% - 32px)',
                maxWidth: '900px',
                overflow: 'hidden',
            },
            '& .MuiBackdrop-root': {
                backdropFilter: 'blur(4px)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
        }}
        TransitionComponent={Fade}
        transitionDuration={250}
        {...props}
    >
        {children}
    </Dialog>
);

// Custom styled buttons
const PrimaryButton = ({ children, loading, success, ...props }) => (
    <Button
        variant="contained"
        color="primary"
        sx={{
            height: 44,
            px: 3,
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 8px rgba(24, 82, 254, 0.2)' },
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
        }}
        {...props}
    >
        {loading ? (
            <CircularProgress size={20} color="inherit" />
        ) : success ? (
            <Fade in={success}>
                <CheckCircleOutlineIcon />
            </Fade>
        ) : (
            children
        )}
    </Button>
);

const SecondaryButton = ({ children, ...props }) => (
    <Button
        variant="outlined"
        sx={{
            height: 44,
            px: 3,
            fontWeight: 600,
            fontSize: '15px',
            borderColor: '#D0D5DD',
            color: theme.palette.grey[800],
            '&:hover': {
                borderColor: '#B0B7C3',
                backgroundColor: 'rgba(52, 64, 84, 0.04)'
            }
        }}
        {...props}
    >
        {children}
    </Button>
);

// Attachment chip with better styling
const AttachmentChip = ({ file, onOpen, onRemove, disabled }) => {
    const getFileIcon = (fileType) => {
        if (fileType && fileType.startsWith('image/')) {
            return <ImageIcon fontSize="small" sx={{ color: '#34D399' }} />;
        }
        return <PdfIcon fontSize="small" sx={{ color: '#F24E1E' }} />;
    };

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#F6F7F9',
                padding: '8px 12px',
                borderRadius: '8px',
                margin: '0 8px 8px 0',
                fontWeight: 500,
                fontSize: '14px',
                color: '#64748B',
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: '#EAECEF',
                }
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
                onClick={onOpen}
            >
                <Box sx={{ mr: 1.5 }}>
                    {getFileIcon(file.fileType)}
                </Box>
                <Typography sx={{ color: '#475467', fontWeight: 500 }}>
                    {file.fileName}
                </Typography>
                <Typography
                    component="span"
                    sx={{
                        fontSize: '13px',
                        color: '#94A3B8',
                        ml: 1,
                        fontWeight: 400
                    }}
                >
                    {file.fileSize}
                </Typography>
            </Box>
            <IconButton
                size="small"
                onClick={onRemove}
                disabled={disabled}
                sx={{
                    ml: 1,
                    p: 0.5,
                    color: '#94A3B8',
                    '&:hover': {
                        color: '#F04438',
                        backgroundColor: alpha('#F04438', 0.1),
                    }
                }}
            >
                <CloseIcon fontSize="small" sx={{ fontSize: '16px' }} />
            </IconButton>
        </Box>
    );
};

// Enhanced consultation dropdown component
const ConsultationSelector = ({ consultations, selectedDate, onSelect, loading }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelectConsultation = (consultation) => {
        onSelect(consultation);
        handleClose();
    };

    return (
        <>
            <Button
                variant={selectedDate ? "contained" : "outlined"}
                color="primary"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleClick}
                disabled={loading}
                sx={{
                    height: 44,
                    px: 3,
                    minWidth: '220px',
                    fontWeight: 600,
                    fontSize: '15px',
                    borderRadius: '50px',
                    backgroundColor: selectedDate ? undefined : 'transparent',
                }}
            >
                {selectedDate ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon sx={{ fontSize: 18, mr: 1 }} />
                        {format(
                            selectedDate instanceof Date ? selectedDate : selectedDate.toDate(),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                        )}
                    </Box>
                ) : (
                    "Escolha a consulta"
                )}
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1,
                        maxHeight: 300,
                        width: 280,
                        borderRadius: 2,
                        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                        '& .MuiList-root': {
                            py: 1,
                        }
                    },
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : consultations.length > 0 ? (
                    consultations.map((cons, index) => (
                        <MenuItem
                            key={cons.id || index}
                            onClick={() => handleSelectConsultation(cons)}
                            sx={{
                                py: 1.5,
                                px: 2,
                                '&:hover': { backgroundColor: '#F6F7F9' },
                                borderBottom: index !== consultations.length - 1 ? '1px solid #F6F7F9' : 'none'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <CalendarTodayIcon sx={{ fontSize: 18, color: '#1852FE', mr: 2 }} />
                                <Typography sx={{ color: '#111828', fontWeight: 500 }}>
                                    {format(
                                        cons.consultationDate instanceof Date
                                            ? cons.consultationDate
                                            : cons.consultationDate.toDate(),
                                        "dd/MM/yyyy",
                                        { locale: ptBR }
                                    )}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>
                        <Typography sx={{ color: '#94A3B8', fontWeight: 500 }}>
                            Nenhuma consulta encontrada
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

// Main component for patient notes dialog
const PatientNoteDialog = ({
                               open,
                               onClose,
                               note = null,
                               patientId,
                               onSave,
                               onDelete
                           }) => {
    const { user } = useAuth();
    const isEditMode = !!note;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState('Rápida');
    const [attachments, setAttachments] = useState([]);
    const [consultationDate, setConsultationDate] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
    const [anamneseId, setAnamneseId] = useState(null);

    useEffect(() => {
        if (note) {
            setTitle(note.noteTitle || '');
            setContent(note.noteText || '');
            setNoteType(note.noteType || 'Rápida');
            setAttachments(note.attachments || []);
            setConsultationDate(note.consultationDate ? note.consultationDate.toDate() : null);

            // Se for uma nota de anamnese, guarda o ID da anamnese
            if (note.noteType === 'Anamnese' && note.anamneseId) {
                setAnamneseId(note.anamneseId);
            } else {
                setAnamneseId(null);
            }
        } else {
            // Reset dos campos para nova nota
            setTitle('');
            setContent('');
            setNoteType('Rápida');
            setAttachments([]);
            setConsultationDate(null);
            setAnamneseId(null);
        }
        setIsLoading(false);
        setIsSaved(false);
        setIsDeleteConfirm(false);
    }, [note, open]);

    const handleViewAnamnesis = () => {
        // Procura o anexo PDF
        const pdfAttachment = attachments.find(
            att => att.fileType === 'application/pdf' ||
                (att.fileName && att.fileName.toLowerCase().endsWith('.pdf'))
        );

        if (pdfAttachment && pdfAttachment.fileUrl) {
            window.open(pdfAttachment.fileUrl, '_blank');
        } else if (note && note.pdfUrl) {
            // Caso o URL do PDF esteja diretamente na nota
            window.open(note.pdfUrl, '_blank');
        }
    };

    // Load consultations when the dialog opens or when type changes to 'Consulta'
    useEffect(() => {
        if (open && patientId && user) {
            loadConsultations();
        }
    }, [open, patientId, user, noteType]);

    const loadConsultations = async () => {
        if (!user || !patientId) return;

        setIsLoadingConsultations(true);
        try {
            console.log("Carregando consultas para paciente:", patientId); // Log para depuração
            const cons = await FirebaseService.listPatientConsultations(user.uid, patientId);
            console.log("Consultas carregadas:", cons); // Log para depuração
            setConsultations(cons);
        } catch (error) {
            console.error("Erro ao carregar consultas:", error);
        } finally {
            setIsLoadingConsultations(false);
        }
    };

    const getCurrentDate = () => {
        return format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    };

    const handleFileUpload = async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
        fileInput.click();

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (isEditMode && note.id) {
                setIsLoading(true);
                setUploadProgress('Fazendo upload do arquivo...');
                try {
                    const fileInfo = await FirebaseService.uploadNoteAttachment(
                        file,
                        user.uid,
                        patientId,
                        note.id
                    );
                    setAttachments(prev => [...prev, fileInfo]);
                } catch (error) {
                    console.error("Erro ao fazer upload do arquivo:", error);
                    alert("Erro ao fazer upload do arquivo. Tente novamente.");
                } finally {
                    setIsLoading(false);
                    setUploadProgress(null);
                }
            } else {
                const fileInfo = {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: formatFileSize(file.size),
                    file: file,
                    uploadedAt: new Date()
                };
                setAttachments(prev => [...prev, fileInfo]);
            }
        };
    };

    const formatFileSize = (sizeInBytes) => {
        if (sizeInBytes < 1024) {
            return sizeInBytes + ' bytes';
        } else if (sizeInBytes < 1024 * 1024) {
            return (sizeInBytes / 1024).toFixed(1) + 'KB';
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
        } else {
            return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
        }
    };

    const handleOpenAttachment = (attachment) => {
        if (attachment && attachment.fileUrl) {
            window.open(attachment.fileUrl, '_blank');
        }
    };

    const handleRemoveAttachment = async (index) => {
        if (isEditMode && note.id) {
            setIsLoading(true);
            try {
                const attachment = attachments[index];
                if (attachment.fileUrl) {
                    await FirebaseService.removeNoteAttachment(
                        user.uid,
                        patientId,
                        note.id,
                        attachment.fileUrl,
                        index
                    );
                }
                const newAttachments = [...attachments];
                newAttachments.splice(index, 1);
                setAttachments(newAttachments);
            } catch (error) {
                console.error("Erro ao remover anexo:", error);
                alert("Erro ao remover anexo. Tente novamente.");
            } finally {
                setIsLoading(false);
            }
        } else {
            const newAttachments = [...attachments];
            newAttachments.splice(index, 1);
            setAttachments(newAttachments);
        }
    };

    const handleSelectConsultation = (consultation) => {
        // Adicione esta linha para definir o tipo da nota como "Consulta"
        setNoteType("Consulta");

        const consDate = consultation.consultationDate instanceof Date
            ? consultation.consultationDate
            : consultation.consultationDate.toDate();
        setConsultationDate(consDate);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("Por favor, insira um título para a nota.");
            return;
        }
        setIsLoading(true);
        try {
            const noteData = {
                noteTitle: title,
                noteText: content,
                noteType: noteType,
                consultationDate: consultationDate
            };
            if (isEditMode && note.id) {
                await FirebaseService.updateNote(
                    user.uid,
                    patientId,
                    note.id,
                    noteData
                );
                if (onSave) {
                    onSave({
                        ...note,
                        ...noteData,
                        lastModified: new Date()
                    });
                }
            } else {
                const noteId = await FirebaseService.createNote(
                    user.uid,
                    patientId,
                    noteData
                );
                const uploadedAttachments = [];
                for (const attachment of attachments) {
                    if (attachment.file) {
                        const fileInfo = await FirebaseService.uploadNoteAttachment(
                            attachment.file,
                            user.uid,
                            patientId,
                            noteId
                        );
                        uploadedAttachments.push(fileInfo);
                    }
                }
                if (onSave) {
                    onSave({
                        id: noteId,
                        ...noteData,
                        attachments: uploadedAttachments,
                        createdAt: new Date()
                    });
                }
            }
            setIsSaved(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            alert("Erro ao salvar nota. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = () => {
        setIsDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!isEditMode || !note.id) return;
        setIsLoading(true);
        try {
            await FirebaseService.deleteNote(
                user.uid,
                patientId,
                note.id
            );
            if (onDelete) {
                onDelete(note.id);
            }
            onClose();
        } catch (error) {
            console.error("Erro ao deletar nota:", error);
            alert("Erro ao deletar nota. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <StyledDialog open={open} onClose={isLoading ? null : onClose}>
                <DialogContent sx={{
                    p: 0,
                    maxHeight: '90vh', // define a altura máxima do diálogo
                    overflowY: 'auto', // permite a rolagem vertical
                    // Estilização customizada da scrollbar para navegadores que suportam WebKit
                    scrollbarWidth: 'thin', // para Firefox
                    scrollbarColor: '#B0B0B0 #E0E0E0', // thumb e track
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: theme.palette.grey[100],
                        borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: '8px',
                        border: `2px solid ${theme.palette.grey[100]}`,
                    },
                }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #EAECEF',
                    }}>
                        <IconButton
                            onClick={onClose}
                            disabled={isLoading}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#F6F7F9',
                                color: '#64748B',
                                '&:hover': {
                                    backgroundColor: '#EAECEF',
                                    color: '#475467'
                                }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        {isEditMode && !isDeleteConfirm ? (
                            <Button
                                variant="text"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleConfirmDelete}
                                disabled={isLoading}
                                sx={{
                                    color: '#F04438',
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: alpha('#F04438', 0.08),
                                    }
                                }}
                            >
                                Excluir nota
                            </Button>
                        ) : isEditMode && isDeleteConfirm ? (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Typography sx={{ color: 'error.main', fontWeight: 500 }}>
                                    Confirmar exclusão?
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => setIsDeleteConfirm(false)}
                                    disabled={isLoading}
                                    sx={{
                                        height: 36,
                                        borderRadius: 18,
                                        borderColor: '#D0D5DD',
                                        color: '#475467',
                                        px: 2,
                                        '&:hover': {
                                            borderColor: '#B0B7C3',
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    sx={{
                                        height: 36,
                                        borderRadius: 18,
                                        px: 2,
                                        boxShadow: 'none',
                                    }}
                                >
                                    Confirmar
                                </Button>
                            </Box>
                        ) : null}
                    </Box>

                    {/* Main Content */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100% - 65px)', // accounting for header height
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            px: { xs: 2.5, sm: 4 },
                            pt: 4,
                            pb: 3,
                            width: '100%',
                            maxWidth: '900px',
                            mx: 'auto',
                        }}>
                            {/* Icon and Title */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Box
                                    component="img"
                                    src="/receitas.svg"
                                    alt="Nota"
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        mb: 2
                                    }}
                                />
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontSize: '28px',
                                        fontWeight: 600,
                                        color: '#101828'
                                    }}
                                >
                                    {isEditMode ? 'Editar nota' : 'Criar nova nota'}
                                </Typography>
                            </Box>

                            {/* Note Type Selector */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                mb: 4,
                                width: '100%',
                                justifyContent: 'center',
                                gap: { xs: 2, sm: 3 }
                            }}>
                                <Button
                                    variant={noteType === 'Rápida' ? "contained" : "outlined"}
                                    color="primary"
                                    onClick={() => setNoteType('Rápida')}
                                    disabled={isLoading}
                                    sx={{
                                        height: 44,
                                        px: 3,
                                        minWidth: '130px',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        borderRadius: '50px',
                                        position: 'relative',
                                    }}
                                >
                                    Nota Rápida
                                    {/* Quick add button */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            right: -8,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            backgroundColor: noteType === 'Rápida' ? '#fff' : '#1852FE',
                                            color: noteType === 'Rápida' ? '#1852FE' : '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: noteType === 'Rápida' ? '1px solid #1852FE' : 'none',
                                            boxShadow: '0 2px 5px rgba(24, 82, 254, 0.2)',
                                        }}
                                    >
                                        <AddIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                </Button>

                                <Typography sx={{ color: '#94A3B8', mx: { xs: 0, sm: 2 }, fontWeight: 500, fontSize: '15px' }}>
                                    ou
                                </Typography>

                                {/* Enhanced Consultation Selector */}
                                <Box sx={{ position: 'relative', zIndex: 2 }}>
                                    <ConsultationSelector
                                        consultations={consultations}
                                        selectedDate={consultationDate}
                                        onSelect={handleSelectConsultation}
                                        loading={isLoadingConsultations}
                                    />
                                </Box>
                            </Box>

                            {/* Main Editor Content */}
                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                overflow: 'hidden',
                                pb: 1,
                            }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        flex: 1,
                                        border: '1px solid #EAECEF',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                                        minHeight: '420px',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Loading overlay */}
                                    {isLoading && uploadProgress && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            zIndex: 10,
                                            borderRadius: '16px',
                                        }}>
                                            <CircularProgress size={40} />
                                            <Typography sx={{ mt: 2, fontSize: '15px', fontWeight: 500 }}>
                                                {uploadProgress}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Title Area */}
                                    <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #EAECEF' }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Digite aqui o título..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            disabled={isLoading}
                                            variant="standard"
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: {
                                                    fontSize: '18px',
                                                    fontWeight: 500,
                                                    color: '#101828',
                                                    '&::placeholder': {
                                                        color: '#94A3B8',
                                                        opacity: 1
                                                    }
                                                }
                                            }}
                                        />

                                        {/* Date information */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#1852FE',
                                                        display: 'inline-block',
                                                        mr: 1
                                                    }}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#64748B',
                                                        fontSize: '13px',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {isEditMode && note.createdAt
                                                        ? `Criado em: ${format(
                                                            note.createdAt instanceof Date
                                                                ? note.createdAt
                                                                : note.createdAt.toDate(),
                                                            "dd/MM/yyyy",
                                                            { locale: ptBR }
                                                        )}`
                                                        : `Data de criação: ${getCurrentDate()}`
                                                    }
                                                </Typography>
                                            </Box>

                                            {isEditMode && note.lastModified && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            backgroundColor: '#F59E0B',
                                                            display: 'inline-block',
                                                            mr: 1
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#64748B',
                                                            fontSize: '13px',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {`Última modificação: ${format(
                                                            note.lastModified instanceof Date
                                                                ? note.lastModified
                                                                : note.lastModified.toDate(),
                                                            "dd/MM/yyyy",
                                                            { locale: ptBR }
                                                        )}`}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {consultationDate && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            backgroundColor: '#22C55E',
                                                            display: 'inline-block',
                                                            mr: 1
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: '#64748B',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, color: '#64748B' }} />
                                                        {`Consulta: ${format(
                                                            consultationDate instanceof Date
                                                                ? consultationDate
                                                                : consultationDate.toDate(),
                                                            "dd/MM/yyyy",
                                                            { locale: ptBR }
                                                        )}`}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                    {isEditMode && noteType === 'Anamnese' && (
                                        <Box sx={{
                                            mt: 2,
                                            mb: 3,
                                            p: 2,
                                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <HistoryEduIcon sx={{ color: '#6366F1', mr: 1.5 }} />
                                                <Typography sx={{ color: '#111E5A', fontWeight: 500 }}>
                                                    Esta nota foi gerada automaticamente a partir de uma anamnese.
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PictureAsPdfIcon />}
                                                onClick={handleViewAnamnesis}
                                                sx={{
                                                    borderColor: '#6366F1',
                                                    color: '#6366F1',
                                                    '&:hover': {
                                                        borderColor: '#4F46E5',
                                                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                    }
                                                }}
                                            >
                                                Ver Anamnese
                                            </Button>
                                        </Box>
                                    )}
                                    {/* Content Area */}
                                    <Box sx={{
                                        p: 3,
                                        flex: 1,
                                        overflowY: 'auto',
                                        '&::-webkit-scrollbar': {
                                            width: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            borderRadius: '4px',
                                        }
                                    }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            variant="standard"
                                            placeholder="Digite aqui o conteúdo da sua nota..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            disabled={isLoading}
                                            InputProps={{
                                                disableUnderline: true,
                                            }}
                                            sx={{
                                                minHeight: '200px',
                                                '& .MuiInputBase-root': {
                                                    fontSize: '15px',
                                                    lineHeight: 1.6,
                                                    color: '#475467'
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Formatting Toolbar */}
                                    <Box sx={{
                                        display: 'flex',
                                        borderTop: '1px solid #EAECEF',
                                        p: 1.5,
                                        px: 3,
                                        gap: 1,
                                        bgcolor: alpha('#F6F7F9', 0.5)
                                    }}>
                                        <Tooltip title="Lista com marcadores">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <FormatListBulletedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Lista numerada">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <FormatListNumberedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                        <Tooltip title="Negrito">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <FormatBoldIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Itálico">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <FormatItalicIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Cor do texto">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <TextFormatIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                        <Tooltip title="Inserir link">
                                            <IconButton size="small" sx={{ color: '#64748B' }} disabled={isLoading}>
                                                <InsertLinkIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Attachments Section */}
                                    {attachments.length > 0 && (
                                        <Box sx={{
                                            p: 3,
                                            pt: 2,
                                            borderTop: '1px solid #EAECEF',
                                            bgcolor: '#FCFCFD'
                                        }}>
                                            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#475467', mb: 1.5 }}>
                                                Anexos ({attachments.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                {attachments.map((file, index) => (
                                                    <AttachmentChip
                                                        key={index}
                                                        file={file}
                                                        onOpen={() => handleOpenAttachment(file)}
                                                        onRemove={() => handleRemoveAttachment(index)}
                                                        disabled={isLoading}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Actions Footer */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        p: 3,
                                        pt: 2,
                                        borderTop: '1px solid #EAECEF',
                                        bgcolor: attachments.length > 0 ? '#fff' : '#FCFCFD'
                                    }}>
                                        <SecondaryButton
                                            onClick={handleFileUpload}
                                            disabled={isLoading}
                                            startIcon={<AttachFileOutlinedIcon />}
                                        >
                                            Adicionar Anexo
                                        </SecondaryButton>

                                        <PrimaryButton
                                            onClick={handleSave}
                                            disabled={isLoading || !title.trim()}
                                            loading={isLoading}
                                            success={isSaved}
                                        >
                                            {isSaved ? "Salvado com sucesso!" : "Salvar nota"}
                                        </PrimaryButton>
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </StyledDialog>
        </ThemeProvider>
    );
};

export default PatientNoteDialog;
