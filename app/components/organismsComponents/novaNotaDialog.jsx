"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    alpha,
    Chip,
    FormControl,
    InputLabel,
    Select
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MedicationIcon from "@mui/icons-material/Medication";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BiotechIcon from "@mui/icons-material/Biotech";
import ArticleIcon from "@mui/icons-material/Article";

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
        },
        // Theme colors for note categories
        noteCategory: {
            Geral: {
                main: '#1852FE',
                light: '#ECF1FF',
                dark: '#0A3CC9',
                background: '#F0F5FF',
            },
            Exames: {
                main: '#F59E0B',
                light: '#FEF9C3',
                dark: '#D97706',
                background: '#FFFBEB',
            },
            Laudos: {
                main: '#F43F5E',
                light: '#FEE2E2',
                dark: '#E11D48',
                background: '#FFF1F2',
            },
            Receitas: {
                main: '#22C55E',
                light: '#ECFDF5',
                dark: '#16A34A',
                background: '#F0FFF4',
            },
            Atestados: {
                main: '#8B5CF6',
                light: '#F3E8FF',
                dark: '#7C3AED',
                background: '#F5F3FF',
            },
            Imagens: {
                main: '#10B981',
                light: '#D1FAE5',
                dark: '#059669',
                background: '#ECFDF5',
            },
            Consultas: {
                main: '#3B82F6',
                light: '#DBEAFE',
                dark: '#2563EB',
                background: '#EFF6FF',
            }
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
    const getFileIcon = (fileType, fileName) => {
        if (!fileType && !fileName) return <ArticleIcon fontSize="small" sx={{ color: '#94A3B8' }} />;

        if (fileType && fileType.startsWith('image/') ||
            (fileName && (fileName.toLowerCase().endsWith('.jpg') ||
                fileName.toLowerCase().endsWith('.jpeg') ||
                fileName.toLowerCase().endsWith('.png') ||
                fileName.toLowerCase().endsWith('.gif')))) {
            return <ImageIcon fontSize="small" sx={{ color: '#34D399' }} />;
        }

        if (fileType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
            return <PdfIcon fontSize="small" sx={{ color: '#F24E1E' }} />;
        }

        return <ArticleIcon fontSize="small" sx={{ color: '#3B82F6' }} />;
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
                    {getFileIcon(file.fileType, file.fileName)}
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

// Get category icon component
const getCategoryIcon = (category) => {
    switch(category) {
        case 'Receitas':
            return <MedicationIcon />;
        case 'Exames':
            return <BiotechIcon />;
        case 'Laudos':
            return <AssignmentIcon />;
        case 'Atestados':
            return <HistoryEduIcon />;
        case 'Consultas':
            return <EventNoteIcon />;
        case 'Imagens':
            return <ImageIcon />;
        default:
            return <ArticleIcon />;
    }
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
    const fileInputRef = useRef(null);
    const dropAreaRef = useRef(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState('Rápida');
    const [noteCategory, setNoteCategory] = useState('Geral');
    const [attachments, setAttachments] = useState([]);
    const [consultationDate, setConsultationDate] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
    const [anamneseId, setAnamneseId] = useState(null);

    // Note categories
    const noteCategories = [
        "Geral",
        "Exames",
        "Laudos",
        "Receitas",
        "Atestados",
        "Imagens",
        "Consultas"
    ];

    // Get category color
    const getCategoryColor = (category) => {
        return theme.palette.noteCategory[category] || theme.palette.noteCategory.Geral;
    };

    useEffect(() => {
        if (note) {
            setTitle(note.noteTitle || '');
            setContent(note.noteText || '');
            setNoteType(note.noteType || 'Rápida');
            setNoteCategory(note.category || 'Geral');
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
            setNoteCategory('Geral');
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
            console.log("Carregando consultas para paciente:", patientId);
            const cons = await FirebaseService.listPatientConsultations(user.uid, patientId);
            console.log("Consultas carregadas:", cons);
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

    // Process files for upload
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);

        // For editing an existing note, upload immediately
        if (isEditMode && note.id) {
            setIsLoading(true);
            setUploadProgress('Fazendo upload dos arquivos...');
            try {
                for (const file of fileList) {
                    const fileInfo = await FirebaseService.uploadNoteAttachment(
                        file,
                        user.uid,
                        patientId,
                        note.id
                    );
                    setAttachments(prev => [...prev, fileInfo]);
                }
            } catch (error) {
                console.error("Erro ao fazer upload dos arquivos:", error);
                alert("Erro ao fazer upload dos arquivos. Tente novamente.");
            } finally {
                setIsLoading(false);
                setUploadProgress(null);
            }
        } else {
            // For new notes, just store file info and the actual file
            // (we'll upload when saving the note)
            const newAttachments = fileList.map(file => ({
                fileName: file.name,
                fileType: file.type,
                fileSize: formatFileSize(file.size),
                file: file, // Keep the file object for later upload
                uploadedAt: new Date()
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const handleFileUpload = async () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileInputChange = (e) => {
        processFiles(e.target.files);
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

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
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
        setNoteCategory("Consultas");

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
            // Para notas em modo de edição, o processo permanece o mesmo
            if (isEditMode && note.id) {
                // Process attachments - upload files and keep only metadata
                const processedAttachments = await Promise.all(
                    attachments.map(async (attachment) => {
                        // If the attachment already has a fileUrl, it's already uploaded
                        if (attachment.fileUrl) {
                            // Return attachment without the File object
                            const { file, ...attachmentWithoutFile } = attachment;
                            return attachmentWithoutFile;
                        }

                        // If there's a File object, we need to upload it
                        if (attachment.file) {
                            setUploadProgress(`Fazendo upload do arquivo ${attachment.fileName}...`);
                            const fileInfo = await FirebaseService.uploadNoteAttachment(
                                attachment.file,
                                user.uid,
                                patientId,
                                note.id
                            );

                            // Return the file info without the actual File object
                            return {
                                fileName: attachment.fileName,
                                fileType: attachment.fileType,
                                fileSize: attachment.fileSize,
                                fileUrl: fileInfo.fileUrl,
                                uploadedAt: attachment.uploadedAt
                            };
                        }

                        // Fallback (shouldn't happen)
                        return null;
                    })
                );

                // Filter out null values and prepare the note data
                const validAttachments = processedAttachments.filter(att => att !== null);

                const noteData = {
                    noteTitle: title,
                    noteText: content,
                    noteType: noteType,
                    category: noteCategory,
                    consultationDate: consultationDate,
                    attachments: validAttachments
                };

                await FirebaseService.updateNote(user.uid, patientId, note.id, noteData);
                if (onSave) {
                    onSave({
                        ...note,
                        ...noteData,
                        lastModified: new Date()
                    });
                }
            } else {
                // Para novas notas, vamos primeiro preparar os attachments sem URLs
                // (apenas metadados para criar a nota)
                const pendingAttachments = attachments.map(attachment => {
                    const { file, ...attachmentWithoutFile } = attachment;
                    return {
                        fileName: attachment.fileName,
                        fileType: attachment.fileType,
                        fileSize: attachment.fileSize,
                        uploadedAt: attachment.uploadedAt || new Date(),
                        // Manteremos uma flag para identificar quais anexos precisam ser processados
                        needsUpload: !!attachment.file
                    };
                });

                // Criar a nota primeiro sem os URLs dos arquivos
                const noteData = {
                    noteTitle: title,
                    noteText: content,
                    noteType: noteType,
                    category: noteCategory,
                    consultationDate: consultationDate,
                    attachments: pendingAttachments
                };

                // Chamar onSave para criar a nota
                // Importante: o arquivo original de FirebaseService.createNote() deve retornar
                // a nota criada com id, ou pelo menos o ID da nota
                if (onSave) {
                    // onSave pode retornar a nota completa ou apenas o ID
                    const saveResult = await onSave(noteData);

                    // Determinar o ID da nota criada
                    const createdNoteId = saveResult?.id ||
                        (typeof saveResult === 'string' ? saveResult : null);

                    // Se há arquivos para upload, processá-los agora com o ID real da nota
                    if (createdNoteId && attachments.some(att => att.file)) {
                        setUploadProgress('Fazendo upload dos anexos...');

                        // Criar objeto da nota com ID
                        const createdNote = {
                            id: createdNoteId,
                            ...(typeof saveResult === 'object' ? saveResult : {})
                        };

                        // Coleção de anexos depois do upload
                        const updatedAttachments = [];

                        // Processar cada anexo
                        for (const attachment of attachments) {
                            if (attachment.file) {
                                setUploadProgress(`Fazendo upload do arquivo ${attachment.fileName}...`);

                                try {
                                    // Fazer upload direto para o Storage (sem atualizar o documento)
                                    const storageFilePath = `users/${user.uid}/patients/${patientId}/notes/${createdNote.id}/${attachment.fileName}`;
                                    // Tentar usar o método oficial primeiro, se não estiver disponível, usar nossa função auxiliar
                                    const fileUrl = FirebaseService.uploadFile
                                        ? await FirebaseService.uploadFile(attachment.file, storageFilePath)
                                        : await uploadFileToStorage(attachment.file, storageFilePath);

                                    updatedAttachments.push({
                                        fileName: attachment.fileName,
                                        fileType: attachment.fileType,
                                        fileSize: attachment.fileSize,
                                        fileUrl: fileUrl,
                                        uploadedAt: attachment.uploadedAt || new Date()
                                    });
                                } catch (uploadError) {
                                    console.error(`Erro ao fazer upload do arquivo ${attachment.fileName}:`, uploadError);
                                    // Continua mesmo com erro em um arquivo
                                }
                            } else if (attachment.fileUrl) {
                                // Se já tem URL, mantém como está
                                updatedAttachments.push(attachment);
                            }
                        }

                        // Atualizar a nota com os anexos processados
                        if (updatedAttachments.length > 0) {
                            try {
                                await FirebaseService.updateNote(user.uid, patientId, createdNoteId, {
                                    attachments: updatedAttachments
                                });
                            } catch (updateError) {
                                console.error("Erro ao atualizar nota com anexos:", updateError);
                                // Não interromper o fluxo por causa de erro na atualização dos anexos
                                // O usuário ainda verá os anexos na interface e poderá editar a nota depois
                            }
                        }
                    }
                }
            }

            setIsSaved(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            alert(`Erro ao salvar nota: ${error.message}. Tente novamente.`);
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
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

    const categoryColor = getCategoryColor(noteCategory);
    const categoryIcon = getCategoryIcon(noteCategory);

    return (
        <ThemeProvider theme={theme}>
            <StyledDialog open={open} onClose={isLoading ? null : onClose}>
                <DialogContent sx={{
                    p: 0,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#B0B0B0 #E0E0E0',
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
                        height: 'calc(100% - 65px)',
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
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '18px',
                                        backgroundColor: categoryColor.light,
                                        color: categoryColor.main,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2,
                                        mx: 'auto'
                                    }}
                                >
                                    {React.cloneElement(categoryIcon, {
                                        style: { fontSize: 30 }
                                    })}
                                </Box>
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

                            {/* Note Type and Category Selectors */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                mb: 4,
                                width: '100%',
                                justifyContent: 'center',
                                gap: { xs: 2, sm: 3 }
                            }}>
                                {/* Note Type */}
                                <Button
                                    variant={noteType === 'Rápida' ? "contained" : "outlined"}
                                    color="primary"
                                    onClick={() => {
                                        setNoteType('Rápida');
                                        setConsultationDate(null);
                                    }}
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

                            {/* Category Selector */}
                            <Box sx={{
                                width: '100%',
                                mb: 4
                            }}>
                                <FormControl fullWidth>
                                    <InputLabel id="note-category-label">Categoria da Nota</InputLabel>
                                    <Select
                                        labelId="note-category-label"
                                        value={noteCategory}
                                        onChange={(e) => setNoteCategory(e.target.value)}
                                        label="Categoria da Nota"
                                        disabled={noteType === 'Consulta'}
                                        sx={{
                                            borderRadius: '10px',
                                            '& .MuiSelect-select': {
                                                fontFamily: 'Gellix, sans-serif',
                                            }
                                        }}
                                    >
                                        {noteCategories.map((category) => {
                                            const catColor = getCategoryColor(category);
                                            const catIcon = getCategoryIcon(category);

                                            return (
                                                <MenuItem
                                                    key={category}
                                                    value={category}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2
                                                    }}
                                                >
                                                    <Box sx={{
                                                        color: catColor.main,
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        {React.cloneElement(catIcon, {
                                                            style: { fontSize: 22 }
                                                        })}
                                                    </Box>
                                                    {category}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
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

                                    {/* Enhanced Drag & Drop Area */}
                                    <Box
                                        ref={dropAreaRef}
                                        sx={{
                                            p: 3,
                                            borderTop: '1px solid #EAECEF',
                                            bgcolor: isDragging ? alpha(categoryColor.light, 0.7) : '#FCFCFD',
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                            minHeight: '120px'
                                        }}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            ref={fileInputRef}
                                            onChange={handleFileInputChange}
                                        />

                                        {attachments.length === 0 ? (
                                            <Box
                                                sx={{
                                                    border: `2px dashed ${isDragging ? categoryColor.main : '#EAECEF'}`,
                                                    borderRadius: '12px',
                                                    p: 3,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: categoryColor.main,
                                                        backgroundColor: alpha(categoryColor.light, 0.3)
                                                    }
                                                }}
                                                onClick={handleFileUpload}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: '50%',
                                                        backgroundColor: categoryColor.light,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mb: 2
                                                    }}
                                                >
                                                    <AttachFileOutlinedIcon sx={{ fontSize: 28, color: categoryColor.main }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 600, mb: 1, color: '#344054' }}>
                                                    Arraste e solte os arquivos aqui
                                                </Typography>
                                                <Typography sx={{ color: '#64748B', mb: 2, textAlign: 'center' }}>
                                                    ou clique para selecionar arquivos
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center' }}>
                                                    Formatos suportados: PDF, DOC, DOCX, JPG, PNG
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#475467' }}>
                                                        Anexos ({attachments.length})
                                                    </Typography>
                                                    <Button
                                                        variant="text"
                                                        startIcon={<AddIcon />}
                                                        onClick={handleFileUpload}
                                                        disabled={isLoading}
                                                        sx={{
                                                            color: categoryColor.main,
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            '&:hover': {
                                                                backgroundColor: alpha(categoryColor.light, 0.5)
                                                            }
                                                        }}
                                                    >
                                                        Adicionar mais arquivos
                                                    </Button>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        border: isDragging ? `2px dashed ${categoryColor.main}` : 'none',
                                                        borderRadius: '12px',
                                                        p: isDragging ? 2 : 0
                                                    }}
                                                >
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
                                            </>
                                        )}

                                        {isDragging && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    bgcolor: alpha(categoryColor.light, 0.8),
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 5,
                                                    borderRadius: '0 0 16px 16px'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mb: 2,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <AttachFileOutlinedIcon sx={{ fontSize: 32, color: categoryColor.main }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: '18px', color: categoryColor.dark }}>
                                                    Solte os arquivos aqui
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Actions Footer */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        p: 3,
                                        borderTop: '1px solid #EAECEF',
                                        bgcolor: '#fff'
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
                                            sx={{
                                                backgroundColor: categoryColor.main,
                                                '&:hover': {
                                                    backgroundColor: categoryColor.dark,
                                                }
                                            }}
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