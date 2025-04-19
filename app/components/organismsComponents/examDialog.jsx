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
    CircularProgress,
    Fade,
    alpha,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Snackbar,
    Alert
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from '../../../lib/firebaseService';
import { useAuth } from '../authProvider';
import ExamTable from "./examTable";

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
        examCategory: {
            LabGerais: {
                main: '#EF4444',
                light: '#FEE2E2',
                dark: '#DC2626',
                background: '#FEF2F2',
                icon: '🩸',
            },
            PerfilLipidico: {
                main: '#F97316',
                light: '#FFEDD5',
                dark: '#EA580C',
                background: '#FFF7ED',
                icon: '⭕️',
            },
            Hepaticos: {
                main: '#EC4899',
                light: '#FCE7F3',
                dark: '#DB2777',
                background: '#FDF2F8',
                icon: '🫁',
            },
            Inflamatorios: {
                main: '#EAB308',
                light: '#FEF9C3',
                dark: '#CA8A04',
                background: '#FEFCE8',
                icon: '🔬',
            },
            Hormonais: {
                main: '#8B5CF6',
                light: '#F3E8FF',
                dark: '#7C3AED',
                background: '#F5F3FF',
                icon: '⚗️',
            },
            Vitaminas: {
                main: '#F59E0B',
                light: '#FEF3C7',
                dark: '#D97706',
                background: '#FFFBEB',
                icon: '💊',
            },
            Infecciosos: {
                main: '#06B6D4',
                light: '#CFFAFE',
                dark: '#0891B2',
                background: '#ECFEFF',
                icon: '🦠',
            },
            Tumorais: {
                main: '#F43F5E',
                light: '#FFE4E6',
                dark: '#E11D48',
                background: '#FFF1F3',
                icon: '🔍',
            },
            Cardiacos: {
                main: '#10B981',
                light: '#D1FAE5',
                dark: '#059669',
                background: '#ECFDF5',
                icon: '❤️',
            },
            Imagem: {
                main: '#6366F1',
                light: '#E0E7FF',
                dark: '#4F46E5',
                background: '#EEF2FF',
                icon: '📷',
            },
            Outros: {
                main: '#3B82F6',
                light: '#DBEAFE',
                dark: '#2563EB',
                background: '#EFF6FF',
                icon: '🧪',
            },
            Default: {
                main: '#1852FE',
                light: '#ECF1FF',
                dark: '#0A3AA8',
                background: '#F0F5FF',
                icon: '🔬',
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
        if (!fileType && !fileName) return null;

        if (fileType && fileType.startsWith('image/') ||
            (fileName && (fileName.toLowerCase().endsWith('.jpg') ||
                fileName.toLowerCase().endsWith('.jpeg') ||
                fileName.toLowerCase().endsWith('.png') ||
                fileName.toLowerCase().endsWith('.gif')))) {
            return '📷';
        }

        if (fileType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
            return '📄';
        }

        return '📎';
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
                <Box sx={{ mr: 1.5, fontSize: '16px' }}>
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

// Exam categories (matches the categories in the ExamTable component)
const examCategories = [
    { id: "LabGerais", name: "Exames Laboratoriais Gerais", icon: "🩸" },
    { id: "PerfilLipidico", name: "Perfil Lipídico", icon: "⭕️" },
    { id: "Hepaticos", name: "Exames Hepáticos e Pancreáticos", icon: "🫁" },
    { id: "Inflamatorios", name: "Inflamatórios e Imunológicos", icon: "🔬" },
    { id: "Hormonais", name: "Hormonais", icon: "⚗️" },
    { id: "Vitaminas", name: "Vitaminas e Minerais", icon: "💊" },
    { id: "Infecciosos", name: "Infecciosos / Sorologias", icon: "🦠" },
    { id: "Tumorais", name: "Marcadores Tumorais", icon: "🔍" },
    { id: "Cardiacos", name: "Cardíacos e Musculares", icon: "❤️" },
    { id: "Imagem", name: "Imagem e Diagnóstico", icon: "📷" },
    { id: "Outros", name: "Outros Exames", icon: "🧪" }
];

// Main component for exam dialog
const ExamDialog = ({
                        open,
                        onClose,
                        exam = null,
                        patientId,
                        onSave,
                        onDelete
                    }) => {
    const { user } = useAuth();
    const isEditMode = !!exam;
    const fileInputRef = useRef(null);
    const dropAreaRef = useRef(null);

    const [title, setTitle] = useState('');
    const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [examCategory, setExamCategory] = useState('LabGerais');
    const [observations, setObservations] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showExamTable, setShowExamTable] = useState(false);
    const [examResults, setExamResults] = useState({});

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Função para mostrar notificações
    const showNotification = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Initialize form with exam data in edit mode
    useEffect(() => {
        if (exam) {
            setTitle(exam.title || '');
            setExamDate(exam.examDate || format(new Date(), 'yyyy-MM-dd'));
            setExamCategory(exam.category || 'LabGerais');
            setObservations(exam.observations || '');
            setAttachments(exam.attachments || []);
            setExamResults(exam.results || {});

            // Mostrar a tabela de resultados automaticamente se houver dados
            if (exam.results && Object.keys(exam.results).length > 0) {
                setShowExamTable(true);
            }
        } else {
            // Reset form for new exam
            setTitle('');
            setExamDate(format(new Date(), 'yyyy-MM-dd')); // Data atual para novos exames
            setExamCategory('LabGerais');
            setObservations('');
            setAttachments([]);
            setExamResults({});
            setShowExamTable(false);
        }
        setIsLoading(false);
        setIsSaved(false);
        setIsDeleteConfirm(false);
    }, [exam, open]);

    // Function to format date for display
    const formatDateDisplay = (dateString) => {
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString;
        }
    };

    // NOVA FUNÇÃO: Processar arquivo PDF com IA
    const processExamPDF = async (file) => {
        // Verificar se é um arquivo PDF
        if (file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')) {
            showNotification("Por favor, selecione um arquivo PDF válido", "error");
            return false;
        }

        setIsLoading(true);
        setUploadProgress('Processando arquivo de exame com IA...');

        try {
            // Enviar o arquivo diretamente para a API processar
            const formData = new FormData();
            formData.append('file', file);

            // Chamar a API processexam com o arquivo
            const response = await fetch('/api/processexam', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro na API: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Atualizar os resultados no estado
                setExamResults(result.data);

                // Mostrar a tabela de resultados automaticamente
                setShowExamTable(true);

                // Sugerir título baseado na categoria ou data
                if (!title.trim()) {
                    const category = examCategories.find(cat => cat.id === examCategory);
                    const categoryName = category ? category.name : '';
                    const formattedDate = formatDateDisplay(examDate);
                    setTitle(`${categoryName} - ${formattedDate}`);
                }

                // Adicionar observação sobre processamento automático
                if (!observations.includes('Processado automaticamente')) {
                    setObservations(prev =>
                        `${prev ? prev + '\n\n' : ''}Processado automaticamente pela IA em ${new Date().toLocaleString()}.`
                    );
                }

                showNotification("Arquivo processado com sucesso! Resultados extraídos.", "success");
                return true;
            } else {
                throw new Error("Falha ao processar o resultado");
            }
        } catch (error) {
            console.error('Erro ao processar o arquivo:', error);
            showNotification(`Não foi possível processar o arquivo: ${error.message}`, "error");
            return false;
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
        }
    };

    // Função para processar arquivos carregados
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);

        // Verificar se há arquivos PDF para processamento automático
        const pdfFiles = fileList.filter(file =>
            file.type === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf')
        );

        // Se houver um PDF, tentar processá-lo primeiro com IA
        let processingResult = false;
        if (pdfFiles.length > 0) {
            try {
                const firstPdf = pdfFiles[0];
                processingResult = await processExamPDF(firstPdf);

                if (processingResult) {
                    showNotification("PDF processado com sucesso! Resultados extraídos automaticamente.");
                }
            } catch (error) {
                console.error("Erro ao processar PDF automaticamente:", error);
                showNotification("O processamento automático falhou. O arquivo será anexado normalmente.", "warning");
                // Continuar com o upload normal mesmo se o processamento falhar
            }
        }

        // Para exames em modo de edição, fazer upload dos arquivos
        if (isEditMode && exam.id) {
            setIsLoading(true);
            setUploadProgress('Fazendo upload dos arquivos...');
            try {
                for (const file of fileList) {
                    const fileInfo = await FirebaseService.uploadExamAttachment(
                        file,
                        user.uid,
                        patientId,
                        exam.id
                    );
                    setAttachments(prev => [...prev, fileInfo]);
                }
                showNotification("Arquivos enviados com sucesso!");
            } catch (error) {
                console.error("Erro ao fazer upload dos arquivos:", error);
                showNotification("Erro ao fazer upload dos arquivos. Tente novamente.", "error");
            } finally {
                setIsLoading(false);
                setUploadProgress(null);
            }
        } else {
            // Para novos exames, apenas armazenar informações e o objeto do arquivo
            const newAttachments = fileList.map(file => ({
                fileName: file.name,
                fileType: file.type,
                fileSize: formatFileSize(file.size),
                file: file, // Manter o objeto do arquivo para upload posterior
                uploadedAt: new Date()
            }));
            setAttachments(prev => [...prev, ...newAttachments]);

            if (fileList.length > 0 && !pdfFiles.length) {
                showNotification('Arquivos adicionados e serão enviados ao salvar o exame.');
            }
        }
    };

    // Função para processar anexo existente
    const handleProcessExistingAttachment = async () => {
        // Encontrar o primeiro anexo PDF
        const pdfAttachment = attachments.find(
            att => att.fileType === 'application/pdf' ||
                (att.fileName && att.fileName.toLowerCase().endsWith('.pdf'))
        );

        if (!pdfAttachment) {
            showNotification("Nenhum arquivo PDF encontrado nos anexos.", "warning");
            return;
        }

        setIsLoading(true);
        setUploadProgress('Processando anexo...');

        try {
            let fileToProcess;

            if (pdfAttachment.file) {
                // Se temos o objeto File diretamente
                fileToProcess = pdfAttachment.file;
            } else if (pdfAttachment.fileUrl) {
                // Se o arquivo já está no servidor, precisamos baixá-lo
                const response = await fetch(pdfAttachment.fileUrl);
                if (!response.ok) throw new Error("Falha ao obter o arquivo do servidor");

                const blob = await response.blob();
                fileToProcess = new File([blob], pdfAttachment.fileName, {
                    type: 'application/pdf'
                });
            } else {
                throw new Error("Não foi possível acessar o conteúdo do arquivo");
            }

            // Processar o arquivo
            await processExamPDF(fileToProcess);

        } catch (error) {
            console.error('Erro ao processar anexo existente:', error);
            showNotification('Não foi possível processar o anexo: ' + error.message, "error");
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
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
            return (sizeInBytes / 1024).toFixed(1) + ' KB';
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
        } else {
            return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
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

    // Function to open attachment
    const handleOpenAttachment = (attachment) => {
        if (!attachment) {
            console.error("Anexo nulo ou indefinido");
            showNotification("Não foi possível abrir este anexo.", "error");
            return;
        }

        if (attachment.fileUrl) {
            window.open(attachment.fileUrl, '_blank');
            return;
        }

        if (attachment.file instanceof File) {
            try {
                const blobUrl = URL.createObjectURL(attachment.file);
                window.open(blobUrl, '_blank');

                // Free the URL temporary after some time
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 5000);
                return;
            } catch (e) {
                console.error("Erro ao criar URL temporária:", e);
            }
        }

        // Try other possible URL fields
        const urlFields = ['url', 'downloadURL', 'fileUrl'];
        for (const field of urlFields) {
            if (attachment[field]) {
                window.open(attachment[field], '_blank');
                return;
            }
        }

        // If we have a storagePath, try to get the URL
        if (attachment.storagePath) {
            try {
                FirebaseService.getStorageFileUrl(attachment.storagePath)
                    .then(url => {
                        window.open(url, '_blank');
                    })
                    .catch(error => {
                        console.error("Erro ao obter URL do Storage:", error);
                        showNotification("Não foi possível obter a URL do anexo.", "error");
                    });
                return;
            } catch (error) {
                console.error("Erro ao processar path do Storage:", error);
            }
        }

        showNotification(`Não foi possível abrir o anexo: ${attachment.fileName || "sem nome"}`, "error");
    };

    const handleRemoveAttachment = async (index) => {
        if (isEditMode && exam.id) {
            setIsLoading(true);
            try {
                const attachment = attachments[index];
                if (attachment.fileUrl) {
                    await FirebaseService.removeExamAttachment(
                        user.uid,
                        patientId,
                        exam.id,
                        attachment.fileUrl,
                        index
                    );
                }
                const newAttachments = [...attachments];
                newAttachments.splice(index, 1);
                setAttachments(newAttachments);
                showNotification("Anexo removido com sucesso.");
            } catch (error) {
                console.error("Erro ao remover anexo:", error);
                showNotification("Erro ao remover anexo. Tente novamente.", "error");
            } finally {
                setIsLoading(false);
            }
        } else {
            const newAttachments = [...attachments];
            newAttachments.splice(index, 1);
            setAttachments(newAttachments);
            showNotification("Anexo removido.");
        }
    };

    const handleToggleExamTable = () => {
        setShowExamTable(!showExamTable);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification("Por favor, insira um título para o exame.", "warning");
            return;
        }

        setIsLoading(true);
        console.log("Iniciando salvamento do exame com", attachments.length, "anexos");

        try {
            // For exams in edit mode
            if (isEditMode && exam.id) {
                console.log("Editando exame existente:", exam.id);

                // Process attachments - keep existing ones and upload new ones
                const processedAttachments = await Promise.all(
                    attachments.map(async (attachment, index) => {
                        console.log(`Processando anexo ${index + 1}/${attachments.length}:`, attachment.fileName);

                        // If the attachment already has URL, just keep it
                        if (attachment.fileUrl) {
                            console.log("Anexo já possui URL:", attachment.fileUrl);
                            // Remove the File object to avoid serialization error
                            const { file, ...attachmentWithoutFile } = attachment;
                            return attachmentWithoutFile;
                        }

                        // If it has the File object, upload it
                        if (attachment.file) {
                            setUploadProgress(`Fazendo upload do arquivo ${attachment.fileName}...`);
                            console.log("Iniciando upload para:", attachment.fileName);

                            try {
                                // Using the specific method for uploading attachments
                                const fileInfo = await FirebaseService.uploadExamAttachment(
                                    attachment.file,
                                    user.uid,
                                    patientId,
                                    exam.id
                                );

                                console.log("Upload finalizado com sucesso:", fileInfo);
                                return fileInfo;
                            } catch (uploadError) {
                                console.error("Erro no upload:", uploadError);

                                // Try an alternative, more direct upload method
                                try {
                                    const path = `users/${user.uid}/patients/${patientId}/exams/${exam.id}/${attachment.fileName}`;
                                    console.log("Tentando método alternativo de upload para:", path);

                                    const fileUrl = await FirebaseService.uploadFile(attachment.file, path);
                                    console.log("Upload alternativo bem-sucedido, URL:", fileUrl);

                                    return {
                                        fileName: attachment.fileName,
                                        fileType: attachment.fileType,
                                        fileSize: attachment.fileSize,
                                        fileUrl: fileUrl,
                                        uploadedAt: attachment.uploadedAt || new Date()
                                    };
                                } catch (altError) {
                                    console.error("Falha também no método alternativo:", altError);
                                    return {
                                        fileName: attachment.fileName,
                                        fileType: attachment.fileType,
                                        fileSize: attachment.fileSize,
                                        uploadError: true,
                                        errorMessage: altError.message,
                                        uploadedAt: attachment.uploadedAt || new Date()
                                    };
                                }
                            }
                        }

                        // If we got here, attachment has no URL and no file
                        console.warn("Anexo sem URL e sem arquivo:", attachment);
                        return null;
                    })
                );

                // Filter valid attachments (non-null)
                const validAttachments = processedAttachments.filter(att => att !== null);
                console.log("Total de anexos válidos após processamento:", validAttachments.length);

                // Exam data for update
                const examData = {
                    title: title,
                    examDate: examDate,
                    category: examCategory,
                    observations: observations,
                    attachments: validAttachments,
                    results: examResults,
                    lastModified: new Date()
                };

                console.log("Atualizando exame com dados:", examData);
                await FirebaseService.updateExam(user.uid, patientId, exam.id, examData);

                if (onSave) {
                    onSave({
                        ...exam,
                        ...examData
                    });
                }

            } else {
                // For new exams
                console.log("Criando novo exame");

                // Create the exam without attachments first (just metadata)
                const initialAttachments = attachments.map(attachment => {
                    // Remove the File object to avoid serialization error
                    const { file, ...metadata } = attachment;
                    return {
                        ...metadata,
                        pendingUpload: true
                    };
                });

                const examData = {
                    title: title,
                    examDate: examDate,
                    category: examCategory,
                    observations: observations,
                    attachments: initialAttachments,
                    results: examResults,
                    createdAt: new Date(),
                    lastModified: new Date()
                };

                // Save the exam and get the ID
                let createdExamId;
                if (onSave) {
                    try {
                        console.log("Salvando exame inicial sem anexos processados");
                        const saveResult = await onSave(examData);

                        // Determine the created exam ID
                        createdExamId = saveResult?.id ||
                            (typeof saveResult === 'string' ? saveResult : null);

                        console.log("Exame criado com ID:", createdExamId);
                    } catch (saveError) {
                        console.error("Erro ao salvar exame:", saveError);
                        throw saveError;
                    }
                }

                // If we have ID and attachments, process the uploads
                if (createdExamId && attachments.some(att => att.file)) {
                    console.log("Processando uploads de anexos para novo exame");
                    setUploadProgress('Processando anexos...');

                    // List to store processed attachments
                    const updatedAttachments = [];

                    // Process each attachment
                    for (let i = 0; i < attachments.length; i++) {
                        const attachment = attachments[i];

                        if (attachment.file) {
                            setUploadProgress(`Enviando arquivo ${i+1}/${attachments.length}: ${attachment.fileName}`);
                            console.log(`Iniciando upload ${i+1}/${attachments.length}:`, attachment.fileName);

                            try {
                                // Standard path for the file in Storage
                                const path = `users/${user.uid}/patients/${patientId}/exams/${createdExamId}/${attachment.fileName}`;
                                console.log("Caminho de upload:", path);

                                // Upload the file
                                const fileUrl = await FirebaseService.uploadFile(attachment.file, path);
                                console.log("Upload bem-sucedido, URL:", fileUrl);

                                // Add the processed attachment to the list
                                updatedAttachments.push({
                                    fileName: attachment.fileName,
                                    fileType: attachment.fileType,
                                    fileSize: attachment.fileSize,
                                    fileUrl: fileUrl,
                                    storagePath: path, // Store the path for future reference
                                    uploadedAt: attachment.uploadedAt || new Date()
                                });
                            } catch (uploadError) {
                                console.error(`Erro no upload do arquivo ${attachment.fileName}:`, uploadError);

                                // Keep the record even with error
                                updatedAttachments.push({
                                    fileName: attachment.fileName,
                                    fileType: attachment.fileType,
                                    fileSize: attachment.fileSize,
                                    uploadError: true,
                                    errorMessage: uploadError.message,
                                    uploadedAt: attachment.uploadedAt || new Date()
                                });
                            }
                        } else if (attachment.fileUrl) {
                            // If it already has URL, keep it as is
                            console.log("Mantendo anexo existente com URL:", attachment.fileUrl);
                            updatedAttachments.push(attachment);
                        }
                    }

                    // Update the exam with processed attachments
                    if (updatedAttachments.length > 0) {
                        try {
                            console.log("Atualizando exame com anexos processados:", updatedAttachments);
                            await FirebaseService.updateExam(user.uid, patientId, createdExamId, {
                                attachments: updatedAttachments,
                                lastModified: new Date()
                            });
                            console.log("Exame atualizado com anexos");
                        } catch (updateError) {
                            console.error("Erro ao atualizar exame com anexos:", updateError);
                            // Continue even with error in update
                        }
                    }
                }
            }

            // Success
            setIsSaved(true);
            console.log("Exame salvo com sucesso");
            showNotification("Exame salvo com sucesso!");
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar exame:", error);
            showNotification(`Erro ao salvar exame: ${error.message}. Tente novamente.`, "error");
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
        }
    };

    const handleConfirmDelete = () => {
        setIsDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!isEditMode || !exam.id) return;
        setIsLoading(true);
        try {
            await FirebaseService.deleteExam(
                user.uid,
                patientId,
                exam.id
            );
            if (onDelete) {
                onDelete(exam.id);
            }
            showNotification("Exame excluído com sucesso!");
            onClose();
        } catch (error) {
            console.error("Erro ao deletar exame:", error);
            showNotification("Erro ao deletar exame. Tente novamente.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Get category color from theme
    const getCategoryColor = (categoryId) => {
        return theme.palette.examCategory[categoryId] || theme.palette.examCategory.Default;
    };

    const categoryColor = getCategoryColor(examCategory);

    const handleScanDocument = () => {
        // In a real app, this would launch the device camera or a scanning interface
        showNotification("Funcionalidade de escaneamento será implementada em breve!", "info");
    };

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
                                Excluir exame
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
                                        mx: 'auto',
                                        fontSize: '28px'
                                    }}
                                >
                                    {categoryColor.icon || <BiotechIcon sx={{ fontSize: 30 }} />}
                                </Box>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontSize: '28px',
                                        fontWeight: 600,
                                        color: '#101828'
                                    }}
                                >
                                    {isEditMode ? 'Editar exame' : 'Novo exame'}
                                </Typography>
                            </Box>

                            {/* Exam Category Selector */}
                            <Box sx={{ width: '100%', mb: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="exam-category-label">Categoria do Exame</InputLabel>
                                    <Select
                                        labelId="exam-category-label"
                                        value={examCategory}
                                        onChange={(e) => setExamCategory(e.target.value)}
                                        label="Categoria do Exame"
                                        sx={{
                                            borderRadius: '10px',
                                            '& .MuiSelect-select': {
                                                fontFamily: 'Gellix, sans-serif',
                                            }
                                        }}
                                    >
                                        {examCategories.map((category) => {
                                            const catColor = getCategoryColor(category.id);
                                            return (
                                                <MenuItem
                                                    key={category.id}
                                                    value={category.id}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2
                                                    }}
                                                >
                                                    <Box sx={{
                                                        color: catColor.main,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontSize: '18px'
                                                    }}>
                                                        {category.icon}
                                                    </Box>
                                                    {category.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Form Card */}
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
                                        <CircularProgress size={40} color="primary" />
                                        <Typography sx={{ mt: 2, fontSize: '15px', fontWeight: 500 }}>
                                            {uploadProgress}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Basic Info Section */}
                                <Box sx={{ p: 3, pb: 2 }}>
                                    {/* Title Field */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1,
                                                color: '#344054'
                                            }}
                                        >
                                            Título
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Digite o título do exame"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            disabled={isLoading}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Date Field */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1,
                                                color: '#344054'
                                            }}
                                        >
                                            Data do exame
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            value={examDate}
                                            onChange={(e) => setExamDate(e.target.value)}
                                            disabled={isLoading}
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: (
                                                    <Box sx={{
                                                        mr: 1.5,
                                                        color: theme.palette.grey[400],
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        <CalendarTodayIcon fontSize="small" />
                                                    </Box>
                                                )
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Observations Field */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1,
                                                color: '#344054'
                                            }}
                                        >
                                            Observações
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            placeholder="Digite observações ou informações adicionais sobre o exame"
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            disabled={isLoading}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                }
                                            }}
                                        />
                                    </Box>
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

                                    {/* Drag & Drop or Upload Area */}
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: 2,
                                        mb: attachments.length > 0 ? 3 : 0
                                    }}>
                                        {/* Drag & Drop Area */}
                                        <Box
                                            sx={{
                                                flex: 1,
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
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    backgroundColor: categoryColor.light,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 2
                                                }}
                                            >
                                                <AttachFileOutlinedIcon sx={{ fontSize: 24, color: categoryColor.main }} />
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

                                        {/* Scan Document Area */}
                                        <Box
                                            sx={{
                                                width: { xs: '100%', sm: '200px' },
                                                border: `2px solid ${categoryColor.light}`,
                                                borderRadius: '12px',
                                                p: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: alpha(categoryColor.light, 0.1),
                                                '&:hover': {
                                                    backgroundColor: alpha(categoryColor.light, 0.3)
                                                }
                                            }}
                                            onClick={handleScanDocument}
                                        >
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 2,
                                                    border: `1px solid ${categoryColor.light}`
                                                }}
                                            >
                                                <CameraAltOutlinedIcon sx={{ fontSize: 24, color: categoryColor.main }} />
                                            </Box>
                                            <Typography sx={{ fontWeight: 600, mb: 1, color: '#344054', textAlign: 'center' }}>
                                                Escanear com AI
                                            </Typography>
                                            <Typography sx={{ color: '#64748B', textAlign: 'center', fontSize: '13px' }}>
                                                Digitalizar documento físico
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* File attachments */}
                                    {attachments.length > 0 && (
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#475467' }}>
                                                    Anexos ({attachments.length})
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    {/* Botão para processar com IA */}
                                                    {attachments.some(att =>
                                                        att.fileType === 'application/pdf' ||
                                                        (att.fileName && att.fileName.toLowerCase().endsWith('.pdf'))
                                                    ) && (
                                                        <Button
                                                            variant="text"
                                                            startIcon={<AutoAwesomeIcon />}
                                                            onClick={handleProcessExistingAttachment}
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
                                                            Processar PDF com IA
                                                        </Button>
                                                    )}

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
                                        </Box>
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

                                {/* Exam Results Table Toggle Button */}
                                <Box sx={{
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    borderTop: '1px solid #EAECEF'
                                }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={showExamTable ? <KeyboardArrowDownOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon sx={{ transform: 'rotate(-90deg)' }} />}
                                        onClick={handleToggleExamTable}
                                        sx={{
                                            borderRadius: '8px',
                                            height: '48px',
                                            width: '100%',
                                            maxWidth: '400px',
                                            fontWeight: 600,
                                            borderColor: categoryColor.main,
                                            color: categoryColor.main,
                                            '&:hover': {
                                                borderColor: categoryColor.dark,
                                                backgroundColor: alpha(categoryColor.light, 0.3),
                                            }
                                        }}
                                    >
                                        {showExamTable ? 'Fechar tabela de resultados' : 'Abrir tabela de resultados'}
                                    </Button>
                                </Box>

                                {/* Exam Results Table */}
                                <Fade in={showExamTable}>
                                    <Box sx={{
                                        p: 3,
                                        borderTop: showExamTable ? '1px solid #EAECEF' : 'none',
                                        display: showExamTable ? 'block' : 'none',
                                        bgcolor: alpha(categoryColor.light, 0.1)
                                    }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 3,
                                                color: categoryColor.dark,
                                                textAlign: 'center'
                                            }}
                                        >
                                            Resultados do Exame
                                        </Typography>

                                        <ExamTable
                                            results={examResults}
                                            onUpdateResults={setExamResults}
                                            readOnly={isLoading}
                                        />
                                    </Box>
                                </Fade>

                                {/* Actions Footer */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    p: 3,
                                    borderTop: '1px solid #EAECEF',
                                    bgcolor: '#fff'
                                }}>
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
                                        {isSaved ? "Salvo com sucesso!" : "Salvar exame"}
                                    </PrimaryButton>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                </DialogContent>

                {/* Notificações */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity={snackbarSeverity}
                        sx={{
                            width: '100%',
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </StyledDialog>
        </ThemeProvider>
    );
};

export default ExamDialog;